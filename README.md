# Mou — Officials Dashboard

Next.js dashboard that displays systemic defect clusters from anonymised
ration-exclusion events, ranked by beneficiaries affected.

## Setup

```bash
npm install
```

## Development

Start the backend first (port 8000), then:

```bash
npm run dev
# Opens at http://localhost:3000
```

The dashboard reads the API base URL from `NEXT_PUBLIC_API_URL` (defaults to
`http://localhost:8000`). Set it for production:

```bash
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com npm run build
```

## Production build

```bash
npm run build && npm start
```

## Tech stack

- Next.js 16 + React 19
- Tailwind CSS
- Deployed on Vercel

## What Mou does NOT do

This dashboard is **read-only**. It does not modify any government record,
eligibility database, or backend state. Every cluster shown is derived from
anonymised events that contain no names or Aadhaar numbers (SRS §7).
