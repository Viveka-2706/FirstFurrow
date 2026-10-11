# FirstFurrow API

Express + MongoDB backend. **Everything the app stores is in MongoDB**: accounts, farm plans (stage progress, spending, journal, results) and the reference data (crops, soils, districts, symptom rules).

> Deploying? Read **`../DEPLOY.md`**. This file is about running and understanding the server.

## Run it locally

Needs Node 18+ and a MongoDB (local install **or** a free Atlas cluster).

```bash
cd server
npm install
cp .env.example .env        # set MONGODB_URI (JWT_SECRET is optional in development)
npm run seed                # loads crops, soils, districts, symptom rules
npm run dev                 # API on http://localhost:5000
```
In a second terminal start the React app (`npm run dev` in the project root). Vite forwards `/api/*` to port 5000.

**No MongoDB yet?** `npm run dev:memory` runs the API with an in-memory database pre-loaded with all the reference data. Handy for a quick look — but **everything is lost when you stop it**, and it refuses to run in production.

## Collections

| Collection | What it holds |
|---|---|
| `users` | name, email (unique), bcrypt password hash, when the password last changed |
| `passwordresets` | outstanding reset links — a **hash** of each token plus its expiry (MongoDB deletes expired rows itself) |
| `plans` | one per farmer per crop: land, soil, district, season, **a copy of the crop as it was when chosen**, stage progress, spend per stage, journal, profit |
| `crops` | 18 crops — numbers, guide stages, English + Tamil |
| `soils`, `regions` | soil types (with Tamil text and the districts where each is found), districts (with weather coordinates) |
| `symptomgroups`, `symptoms`, `problems` | the symptom-checker rule base |

`npm run seed` rewrites the reference collections only. **It never touches `users` or `plans`**, so it is safe to re-run after editing crop data.

## Endpoints

| | |
|---|---|
| `GET /api/health` | `{ ok, db, store }` — 503 if the database is down |
| `POST /api/auth/signup` · `POST /api/auth/login` | `{ token, user }` |
| `GET /api/auth/me` | the logged-in user |
| `POST /api/auth/forgot-password` | `{ email, lang }` → emails a one-time reset link (always answers `{ ok: true }`) |
| `POST /api/auth/reset-password` | `{ token, password }` → sets the new password; the link works once and expires in 30 minutes |
| `GET /api/plans` · `POST /api/plans` | list / create (body: `cropId, land, soilId, region, season`) — **login required** |
| `PATCH /api/plans/:id/stages/:index` | `{ done, actualCost }` — stages must be finished in order |
| `POST /api/plans/:id/complete` | `{ profit }` — only after every stage is done |
| `POST /api/plans/:id/journal` · `DELETE /api/plans/:id/journal/:entryId` | field notes |
| `DELETE /api/plans/:id` | remove a plan |
| `GET /api/crops/recommend?soil=&season=&budget=&land=` | up to 3 crops with a computed `match` |
| `GET /api/crops` · `GET /api/crops/:id` | crop data |
| `GET /api/reference` | soils, districts, short crop list |
| `GET /api/symptoms?crop=` · `POST /api/symptoms/diagnose` | symptom checklist / diagnosis |

Send the login token as `Authorization: Bearer <token>`. Errors are `{ error, code }`; the frontend maps `code` to English/Tamil text.

## How it is organised

```
src/
  app.js            Express setup: security headers, CORS, rate limits, routes, serving the React build
  config.js         all environment variables, validated (refuses to start in production without a strong JWT_SECRET)
  routes/           auth, plans, crops, reference, symptoms
  services/         the rules: password/token handling, plan rules (stage order, completion), symptom matching
  mail/mailer.js    sends the reset emails through Gmail/SMTP (never prints them)
  repo/mongo.js     the MongoDB data layer          ┐ same interface —
  repo/memory.js    in-memory version (tests, demo) ┘ the routes can't tell them apart
  models/           Mongoose schemas
seed/               data files + the script that loads them
test/               see below
```

## Tests

```bash
npm test                                   # ~70 tests, no database needed
TEST_MONGODB_URI="mongodb://127.0.0.1:27017" npm run test:db
```
`test:db` runs the **same data-layer suite** against a real MongoDB (in a throw-away database it deletes afterwards). Run it once before deploying — it is how the MongoDB code is verified against the real thing.

Password reset is tested end to end, including **delivering a real email over SMTP to a local fake mail server** and using the link from it. The API tests cover: signup/login rules, rejected/expired/forged tokens, **one farmer never reaching another's plans**, stage ordering, completion rules, injection payloads, rate limiting, CORS, security headers, and error handling that doesn't leak internals.

## Review before presenting

1. **Soils for the 15 non-original crops** (`seed/data/extra.js`) are general agronomy assumptions — the dataset has no soil data.
2. **Tamil text for those crops** was written by the developer; have a Tamil speaker check it. (Also worth checking: marigold's local name "Thagarai Poo".)
3. Crop guides for the 15 newer crops are shorter than the three original hand-written ones; an agriculture officer should review the generated stage advice.
4. **Oyster mushroom** figures are per setup, not per acre.
