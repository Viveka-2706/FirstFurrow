# Deploying FirstFurrow

Two services are needed: **MongoDB Atlas** (the database) and **one web host** that runs the Node server.
The server also serves the built React app, so there is a single URL and nothing to wire together.

```
Browser ──► your-app.onrender.com ──► MongoDB Atlas
            (React app + /api)         (users, plans, crops …)
```

## 0. Before you deploy — on your own computer

```bash
npm install && npm --prefix server install
npm --prefix server test            # 70+ tests, no database needed
```

Then check the database code against a **real MongoDB** (this is the one part that could not be run when the code was written):

```bash
# local MongoDB, or paste your Atlas URI from step 1
TEST_MONGODB_URI="mongodb://127.0.0.1:27017" npm --prefix server run test:db
```
It creates a throw-away database, runs the same checks the in-memory version passes, and deletes it. **Every test should pass; if one fails, fix that before deploying.**

## 1. Create the database (MongoDB Atlas, free tier)

1. Sign up at mongodb.com/atlas → create a free **M0** cluster (choose a region close to your users, e.g. Mumbai).
2. **Database Access** → add a database user with a **strong password** (letters + numbers; avoid `@ : / ?` or URL-encode them).
3. **Network Access** → *Add IP Address* → *Allow access from anywhere* (`0.0.0.0/0`). Free hosts don't have a fixed IP, so this is the usual choice — which is why the password in step 2 must be strong.
4. **Connect → Drivers** → copy the connection string and put the database name in it:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/firstfurrow?retryWrites=true&w=majority`

## 2. Load the crop data (once)

From your computer, with that connection string:

```bash
cd server
cp .env.example .env        # fill in MONGODB_URI (and JWT_SECRET, see step 3)
npm run seed                # crops, soils, districts, symptom rules
```
You should see `crops 18 documents`, `soils 6`, `regions 9`, `symptoms 25`, `problems 15`.
`npm run seed` is safe to re-run later (e.g. after editing crop data) — **it never touches users or plans.**

## 3. Make a secret for login tokens

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
Keep the output; it becomes `JWT_SECRET`. Anyone who knows it can forge logins, so never commit it.

## 4. Set up the "Forgot password" email (Gmail)

The server emails reset links using a Gmail account of yours. Google requires an **App password** for this (your normal password will not work):

1. Open your Google Account → **Security**. Turn on **2-Step Verification** if it isn't on (App passwords need it).
2. Go to **myaccount.google.com/apppasswords** (or search "App passwords" in your Google Account), name it `FirstFurrow`, and click **Create**.
3. Google shows a 16-letter password (like `abcd efgh ijkl mnop`). Copy it — it is shown once. Spaces don't matter.

You will use these three values in the next step:

| Name | Value |
|---|---|
| `MAIL_USER` | your Gmail address, e.g. `yourname@gmail.com` |
| `MAIL_APP_PASSWORD` | the 16-letter app password |
| `APP_URL` | your website's address, e.g. `https://your-app.onrender.com` (no trailing slash) |

Things to know:
- The email arrives **from** that Gmail address, and goes to whichever address the farmer signed up with (it doesn't have to be Gmail).
- A normal Gmail account can send roughly 500 emails a day — plenty for this project.
- The first emails may land in **spam**; the app tells people to check there.
- ⚠️ **Some free hosts block outgoing email (SMTP).** At the time of writing, Render's free web services do, and some others restrict it on free or trial plans — check your host's current rules. If blocked, the reset email will fail (you'll see a timeout in the server log) while the page still says "check your email". Fix: use a paid instance, or switch the mailer to an email service with an HTTP API (Resend, Brevo, SendGrid…). All sending is in one small file, `server/src/mail/mailer.js`, so the change is small.
- When the server starts it logs in to Gmail to check your settings. Look for **`✔ Email ready — reset links will be sent from you@gmail.com`**. If you see `✘ Could not log in to the mail server…`, the app password is wrong (or your host blocks email).

## 5. Deploy the server (example: Render)

New → **Web Service** → connect your Git repository, then:

| Setting | Value |
|---|---|
| Root directory | *(leave empty — the repo root)* |
| Build command | `npm install --include=dev && npm run build:all` |
| Start command | `npm start` |
| Health check path | `/api/health` |

**Environment variables**

| Name | Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | the Atlas string from step 1 |
| `JWT_SECRET` | the secret from step 3 |
| `MAIL_USER` | your Gmail address (step 4) |
| `MAIL_APP_PASSWORD` | the Google app password (step 4) |
| `APP_URL` | your website address, e.g. `https://your-app.onrender.com` |

`APP_URL` is only known after Render creates the service — deploy once, copy the address Render shows, add it as `APP_URL`, and redeploy.

Deploy. When it's live, open `https://<your-app>.onrender.com/api/health` — you should see `{"ok":true,"db":"connected","store":"mongo"}`. Then open the site root and sign up.

> **Free tier note:** free Render services go to sleep after ~15 minutes without visitors; the next request can take up to a minute. The app shows a "waking up the server" message instead of looking frozen. For a viva/demo, open the site a minute beforehand. A paid instance or a free uptime pinger on `/api/health` avoids this.

Other hosts (Railway, Fly.io, a VPS) work the same way: build with `npm install --include=dev && npm run build:all`, start with `npm start`, set the three variables.

## 6. After deploying — a 3-minute check

1. `/api/health` says `"db":"connected"`.
2. Sign up → build a plan → mark a stage done → **refresh the page**: your progress is still there.
3. Open the site in a private window and sign up as a second person: they see an empty farm (your data is private).
4. Switch to தமிழ் and run the Symptom Checker.
5. Log out → **Forgot password?** → enter your email → open the email, click the link, set a new password, and log in with it.
   (No email after a minute? Check spam, then the server log — a timeout there usually means your host blocks outgoing email.)

## Alternative: frontend and API on different hosts

If you prefer the React app on Vercel/Netlify:

1. Server: set `SERVE_CLIENT=false` and `CLIENT_ORIGIN=https://your-app.vercel.app`.
2. Frontend: build with `VITE_API_URL=https://your-api.onrender.com` (set it in the host's environment settings before building).

## What protects the app

- Passwords are stored as **bcrypt hashes**, never in plain text; login errors don't reveal whether an email exists.
- Login tokens (JWT) expire after 7 days. Each farmer can only read or change **their own** plans — the server checks this on every request.
- **Forgot password:** the emailed link is a random one-time token that works once, expires in 30 minutes, and only a *hash* of it is kept in the database. The page answers the same whether or not an email has an account, so nobody can use it to find out who is registered. Resetting also signs out every older login. Links are built from `APP_URL`, never from request headers.
- Login/signup are **rate-limited** (30 tries per 15 min per IP), and the whole API has a general limit.
- Input is strictly type-checked (blocks NoSQL-injection payloads), request bodies are capped at 100 KB, and responses carry security headers (CSP, nosniff, …).
- Errors sent to the browser never contain internal details.

## Good to know

- **Accounts and plans made before this version** lived only in each browser's localStorage and are **not** carried over. Everyone signs up again on the deployed app.
- Login tokens are kept in the browser's localStorage (simple and works across domains). The trade-off: a cross-site-scripting bug could steal one. The app has no user-generated HTML, and the CSP header limits what scripts can run.
- Back up: Atlas free tier has no automatic backups. Use *Atlas → Collections → Export*, or `mongodump`, before anything important.

> **Why `--include=dev`?** Hosts set `NODE_ENV=production` while building, and npm then skips the build tool (Vite). `--include=dev` keeps it so the React app can be built.
