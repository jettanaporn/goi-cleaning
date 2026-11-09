# Goi Cleaning Project

Field service management web app for home-service businesses (HVAC, plumbing, cleaning). Short brand in tight UI: **Goi Cleaning** (G-O-I).

## Stack

- Vite + React + TypeScript
- Client-side persistence via `localStorage` (seeded sample data on first load)
- Storage key: `goi-cleaning-app-v1` (migrates once from legacy `cleanpro-app-v1`)
- Upgrade path to Postgres: see apps-database skill (`migrations/` + `DATABASE_URL`)

## Scripts

```bash
npm install
npm run dev
npm run build
```

## Demo

Open the app → **Open demo workspace** / sign in with any email → explore Dashboard, Schedule (drag-dispatch), Customers, Jobs, Estimates, Invoices, Price book, and Team.
