# swearjar — Zachariah Tippett

Website for stand-up comedian and Tourette's Syndrome awareness advocate
Zachariah Tippett. Full-stack rebuild (this branch replaces the old Vite
frontend on `main`).

## Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Hono + tRPC 11 (end-to-end types, superjson)
- **Database**: MySQL via Drizzle ORM (TiDB-compatible, `mode: "planetscale"`)
- **Motion**: GSAP + ScrollTrigger + Lenis smooth scroll
- **Auth**: custom admin login — scrypt password hash, HMAC-signed bearer
  tokens (7-day TTL, secret derived from `DATABASE_URL`, never committed)

## Features

- Video hero (Kill Tony clip) with sound toggle — unmute restarts the clip
- Upcoming shows (next two featured, expandable), managed from the dashboard
- Products in three categories: **Multipurpose Apparel** (TS activism),
  **Just Funny**, and **Odds & Ends** (hidden until products are assigned)
- Merchize integration (catalog sync + connection test) from the dashboard
- Donation (Cash App / Patreon) + contact modal (general vs booking)
- Newsletter placeholder (GROQ — pending)
- Dashboard at `/admin`: shows, products, site settings, Merchize, password

## Develop

```bash
npm install
npm run db:push   # sync schema (needs DATABASE_URL in .env)
npm run dev       # http://localhost:3000
npm run check     # type-check
npm run build     # client -> dist/public, server -> dist/boot.js
```

Admin login is seeded by `db/seed.ts` (default password printed in its
output — change it in the dashboard immediately).

## Deploy

Dockerfile included (dynamic/full-stack). Requires `DATABASE_URL`.

## Legacy

The old site code is still on `main`. This branch is the source of truth
going forward. `node_modules` committed on `main` is not carried into this
branch's history beyond the fork point — consider `git filter-repo` or BFG
to purge it from the repo entirely before archiving `main`.
