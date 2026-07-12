# AssetFlow

AssetFlow is a full-stack enterprise asset & resource management system: track physical
assets through their lifecycle (registration → allocation → transfer → maintenance →
audit → retirement), manage bookable shared resources with overlap-safe scheduling,
run departmental audit cycles with automatic discrepancy handling, and report on
utilization, maintenance frequency, and departmental allocation.

The stack is a real Express + better-sqlite3 API (`server/`) and a React 19 + Vite
frontend (`src/`) that talks to it over JWT-authenticated REST calls — no mock data,
no localStorage-only state. Every screen reads and writes through the API.

## Project structure

```
AssetFlow/
├── server/                 Express + better-sqlite3 API
│   ├── src/
│   │   ├── db.js           SQLite schema (idempotent, created on boot)
│   │   ├── seed.js         Idempotent demo-data seeder (reads data/*.json)
│   │   ├── routes/         One file per resource (assets, auth, bookings, ...)
│   │   ├── middleware/     JWT auth + RBAC, file upload
│   │   └── services/       Asset lifecycle state machine, activity/notification helpers
│   └── .env.example        Backend environment variables
├── data/                   Seed data (departments, employees, assets, ...)
├── src/                    React 19 + Vite frontend
│   ├── api/client.js       Fetch wrapper + typed API resource helpers
│   ├── context/AppContext.jsx  API-backed app state (adapter layer — see below)
│   ├── screens/            One screen per nav view (Now, Objects, Handoffs, ...)
│   ├── components/         Shared UI (AppFrame, StampedTag, LifecycleRail, ...)
│   └── db/mockData.js      Legacy mock dataset, kept only as a reference/fallback
└── .env.example             Frontend environment variables
```

### Why an adapter layer?

The frontend screens were originally built against a mock, localStorage-seeded
dataset with its own shape (lowercase statuses like `"allocated"`, `tag` as the
asset's primary key, `heldBy` as a holder id, capitalized `role` values like
`"Admin"`/`"Manager"`/`"Employee"`). The real backend uses a different shape
(capitalized status enums, numeric ids, `holder_user_id`, roles like
`admin`/`asset_manager`/`dept_head`/`employee`). Rather than rewrite every
screen, `src/context/AppContext.jsx` now fetches from the real API and maps
backend responses into the exact shape the screens already expect, so the
screen components are largely untouched.

## Prerequisites

- Node.js 18+
- npm

## Setup (two terminals)

### 1. Backend

```bash
cd server
npm install
cp .env.example .env        # optional — a dev JWT secret is used if you skip this
npm run seed                # creates/resets the SQLite DB with demo data
npm run dev                 # starts the API on http://localhost:4000
```

### 2. Frontend

```bash
npm install
cp .env.example .env         # optional — proxy mode works with no .env at all
npm run dev                  # starts Vite on http://localhost:5173
```

Vite proxies `/api` and `/uploads` to `http://localhost:4000` (see
`vite.config.js`), so the frontend just calls `fetch("/api/...")` with no CORS
setup needed. If you run the backend on a different host/port, set
`VITE_API_URL` in `.env` instead (see `.env.example`).

Open http://localhost:5173, click **Enter App**, then **Sign in**.

## Demo login credentials

All seeded via `npm run seed` (source: `data/employees.json` + `server/src/seed.js`):

| Role          | Email                              | Password      |
|---------------|-------------------------------------|----------------|
| Admin         | admin@assetflow.app                 | Admin@123      |
| Dept Head     | kavita.sharma@nexgeninfra.com       | Password@123   |
| Asset Manager | deepak.nair@nexgeninfra.com         | Password@123   |
| Employee      | priya.deshmukh@nexgeninfra.com      | Password@123   |

Every other seeded employee in `data/employees.json` also uses `Password@123`.

The "Switch User (Demo)" dropdown in the top bar is a **demo-only convenience** —
there is no impersonation endpoint on the backend. It performs a real login as
the selected seeded account using the known demo password above (admin uses
`Admin@123`, everyone else `Password@123`). It is clearly a testing aid, not a
real admin feature, and only works because these are known seed credentials.

## What's real vs. what's still a demo affordance

- Auth, all CRUD, allocations, transfers, bookings (with server-side overlap
  rejection), maintenance workflow, and audit cycles all hit the real API and
  persist to SQLite.
- Role permissions are enforced server-side (e.g. only `asset_manager` can
  register assets; `admin` cannot — this mirrors the backend's RBAC design).
  The frontend surfaces a `403` as an in-app error banner rather than a blind
  failure.
- "Reset Database" in the UI just re-fetches from the server; to actually
  reset seed data, re-run `npm run seed` in `server/`.

## The two `.env.example` files

- **`.env.example`** (repo root) — frontend Vite env vars. Controls whether the
  app talks to the backend via the dev proxy (default) or an explicit
  `VITE_API_URL`.
- **`server/.env.example`** — backend env vars: `JWT_SECRET` (required in
  production; a dev-only fallback is used otherwise with a console warning),
  `PORT`, `DB_PATH`, `NODE_ENV`.

Copy each to `.env` in its respective directory before running in a shared or
production-like environment.
