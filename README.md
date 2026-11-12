# Goi Cleaning Project

Cleaning business ops web app for residential and commercial crews. Short brand in tight UI: **Goi Cleaning** (G-O-I).

## Stack

- Vite + React + TypeScript
- **Live workspace:** Postgres via `DATABASE_URL` (declared in `cursor-app.json` + `migrations/`) and Cursor sign-in on private/team publishes
- **Fallback:** browser `localStorage` key `goi-cleaning-app-v3` with seeded sample data when the database or identity is unavailable
- API: `GET` / `PUT` `/api/workspace` (identity required when the database is configured)
- Schedule: Day board, Week time-grid, Month calendar, Year overview

## Scripts

```bash
npm install
npm run dev
npm run build
```

## Workspace modes

1. **Live** — App published with Postgres; visibility **private** or **team** so Cursor sign-in reaches `/api/workspace`. Data is stored in the `workspaces` table (not demo seed).
2. **Sample fallback** — Local dev, public apps without identity, or unset `DATABASE_URL`. Uses existing local sample data; does not delete it. Sidebar can reset sample data only in this mode.

Open the app → **Open workspace** → Dashboard, Schedule, Customers, Jobs, Invoices, Price book, and Team.
