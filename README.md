# Mou — Officials Dashboard

Shows systemic defect clusters from anonymised ration-exclusion events,
ranked by how many people they affect.

## Setup

```bash
npm install
```

Point it at a running backend:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
# Opens at http://localhost:3000
```

For production, set `NEXT_PUBLIC_API_URL` to your deployed backend URL.

## Production build

```bash
npm run build && npm start
```

Or just deploy to Vercel — it handles the build.

## Live

**https://moudashboard.vercel.app**

## Stack

Next.js 16, React 19, Tailwind CSS. Hosted on Vercel.

## One rule

This dashboard is read-only. It does not touch any government record,
eligibility database, or backend state. Every cluster comes from anonymised
events — no names, no Aadhaar numbers.
