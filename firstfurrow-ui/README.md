# FirstFurrow — UI (dummy data + mock auth)

A crop-planning app for new and small-land farmers: landing page, login/signup,
a soil-aware planning wizard, crop recommendations, a guided stage-by-stage
tracker, and a completed-crops archive with profit tracking. This is the
**frontend UI only** — all data is mock/dummy, and login uses `localStorage`
instead of a real backend.

## Run it

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

## Try the full flow

1. Landing page → **Get started** → sign up with any name/email/password —
   a playful welcome animation (a cow and a few crops flying across the
   screen) plays for a couple of seconds before you land on your dashboard
2. You'll land on **My Farm** (empty at first) → **+ Add new land**
3. Wizard: land size → soil type → budget → region (filtered by your soil) → season
4. Pick one of the 3 recommended crops → dropped straight into its tracker,
   laid out compactly: a slim top bar, a row of stat cards (harvest
   countdown, live weather, cost breakdown, irrigation info), a horizontal
   stage rail, and a tabbed panel below (**Stage Guide** / **Field
   Journal**) — everything fits without a long scroll.
5. Work through the **Stage Guide** tab one stage at a time. Locked stages
   are genuinely locked — you can't click into them or preview their
   instructions at all; the rail just shows a 🔒 until you finish the
   current stage. A "Budget for what's coming" card under the guide still
   shows the next stage's itemised cost so you can plan money ahead, without
   revealing its actual instructions.
6. When you mark a stage complete, you're asked how much you actually spent
   on it (pre-filled with the estimate) — logging this is optional but feeds
   into a real Planned vs. Actual comparison later.
7. Switch to the **Field Journal** tab any time to jot down free-text field
   notes (pest sightings, soil condition, weather surprises) — each entry is
   timestamped and kept per plan.
8. Mark the final (harvest) stage complete → a congratulations popup appears
   and asks for your actual profit. Submitting moves the crop into the
   **Completed** tab on your dashboard.
9. Open a completed crop to see planned budget, actual spend logged, profit,
   ROI, days taken, start date, and harvest date — plus a short note comparing
   what you planned to spend against what you actually did.
10. Log out and back in with the same account — active and completed plans
    are both still there, exactly where you left them (and yes, the welcome
    animation plays again).
11. Hover any tile and tap the ✕ in the corner to remove a plan (with a
    confirm step) from either the Active or Completed list.
12. Once you have at least one plan, a **Farm Overview** strip appears above
    the tabs: total land under cultivation, total planned investment across
    every plan, total profit earned so far, and your best-performing crop.
13. Inside a tracker, the **weather widget** fetches today's actual forecast
    (Open-Meteo, no key needed) for the plan's region and gives a watering
    tip based on real rain chance; a **harvest countdown** ring shows days
    left to estimated harvest.
14. On the Active tab, a **Today's Focus** panel lists the current stage for
    every plan in progress, so you can see what's next across all your land
    without opening each tracker.
15. Once you have 2+ completed crops with profit logged, a **bar chart**
    comparing investment vs. profit appears above the Completed list.
16. Use the **🖨 Print** button in a tracker's top bar for a clean printout
    of just the current stage guide.

## What's inside

- `src/components/Landing.jsx` — public landing page: photo hero with animated
  furrow lines, a cursor-following spotlight glow, drifting particles, scroll
  progress bar, count-up stats, a scrolling ticker of soils/crops, a 3-step
  "how it works" walkthrough, slow Ken-Burns zoom + parallax on feature
  photos, and a pulsing glow ring on the final call-to-action
- `src/components/AuthForm.jsx` — shared login/signup card
- `src/components/Dashboard.jsx` — "My Farm" with a **Farm Overview** stats
  strip (total land, planned investment, profit earned, best crop) plus
  **Active** / **Completed** tabs over a soft, blurred farm-photo background;
  active tiles show progress % and which stage is next, completed tiles show
  reported profit
- `src/components/WizardForm.jsx` + `FurrowStepper.jsx` — 5-step wizard (land
  size, soil type, budget, region — narrowed to where that soil is actually
  found, season)
- `src/components/RecommendationGrid.jsx` + `CropCard.jsx` — "seed packet"
  cards tagged with soil compatibility and accurate water figures; crop names
  shown as `Tamil name (English name)` throughout the app
- `src/components/PlanView.jsx` — the tracker's layout: a compact top bar, a
  row of stat cards, a horizontal stage rail, and a tabbed panel below —
  everything fits without a long vertical scroll
- `src/components/StageNav.jsx` — horizontal stage rail; locked stages
  (🔒) are disabled outright — not clickable, not previewable — done stages
  show ✓
- `src/components/StageDetail.jsx` — the single-focus stage panel (what to
  do / why / beginner tip / warning sign) plus the actual-spend prompt shown
  when a stage is marked complete
- `src/components/UpNextCard.jsx` — the "budget for what's coming" card for
  the next locked stage — shows only its itemised cost, never its
  instructions
- `src/components/WaterCard.jsx`, `CostBreakdown.jsx` — compact stat cards
  for irrigation info and planned cost vs. return
- `src/components/HarvestCountdown.jsx` — ring widget counting down days to
  estimated harvest
- `src/components/FieldJournal.jsx` — a free-text field diary per plan
  (prompted questions, timestamped entries, deletable) — a new, non-mock
  feature: entries are the farmer's own words, not generated data
- `src/components/WelcomeAnimation.jsx` — a playful, self-dismissing
  animation (a cow and crops flying across the screen) shown once right
  after login or signup
- `src/components/CompletionModal.jsx` — congratulations popup with a
  full-screen confetti rain, a decorative badge banner, and a profit input,
  shown once every stage of a crop is marked complete
- `src/components/CompletedDetail.jsx` — full summary for a finished crop:
  planned budget vs. actual spend logged, profit, ROI, days taken,
  start/harvest dates
- `src/components/WeatherWidget.jsx` — **real, live** weather (not mock) for
  a plan's region via the Open-Meteo API, with a dynamic irrigation tip based
  on today's rain chance
- `src/components/TodaysFocus.jsx` — dashboard panel showing the current
  stage across all active plans at a glance
- `src/components/ProfitChart.jsx` — recharts bar chart comparing investment
  vs. reported profit across completed crops
- `src/utils/storage.js` — mock auth + plan persistence via `localStorage`,
  including journal entries (`addJournalEntry` / `deleteJournalEntry`).
  Every function is named/shaped so it can be swapped for real API calls
  later without touching component code. **Passwords are stored in plain
  text — this is a UI demo only, not production auth.**
- `src/data/dummyData.js` — soil types, soil→region mapping, region
  coordinates (for the weather widget), crops (each stage includes
  `costItems` for the budget-preview card), and the Unsplash photo URLs used
  on the landing page. Swap this file for real API calls when the backend is
  ready.

## Design notes

Palette and type tokens live in `src/index.css` as CSS custom properties
(`--field`, `--soil`, `--sprout`, `--turmeric`, `--mist`, `--chili`). Fonts
(`Fraunces` + `Space Grotesk`) and landing-page photos load from external
CDNs, so the first run needs internet access.


## Farmer-first features

- **Tamil / English toggle** — the whole app (wizard, results, stage guide, journal, dashboard) switches language. UI text lives in `src/i18n/strings.js`; the Tamil crop knowledge base (stage instructions, water advice, soils, regions) lives in `src/i18n/content.ta.js`. Stored plans keep their original English data, so switching language never corrupts saved progress. The choice is remembered in `localStorage`.
- **Read aloud** — a 🔊 button on every stage guide and symptom result, using the browser's built-in Web Speech API (no API key, no backend). Long text is chunked by sentence so Chrome doesn't cut it off. If a device has no Tamil voice installed, the app says so instead of failing silently.
- **Symptom Checker** — a rules-based matcher (`src/data/symptoms.js`). Each problem has weighted symptoms; a problem needs at least one *key* sign to show up, crop-specific problems get a small boost for the active crop, and the top three matches are shown with cause, fix steps and prevention. Results can be saved straight into the Field Journal.

## Backend

Accounts, farm plans and all reference data (crops, soils, districts, symptom rules) are stored in MongoDB behind an Express API in `server/` — see `server/README.md` for running it and **`DEPLOY.md`** for putting it online.

Forgot-password emails are sent through Gmail and need an app password in `server/.env` — see step 4 of `DEPLOY.md`.

Quick start: `cd server && npm install && cp .env.example .env && npm run seed && npm run dev`, then `npm run dev` in the project root.
