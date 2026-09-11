# AdmissionMate — Architecture

Snapshot of what's built and deployed, as of 2026-09-11.

## Overview

Three deployable pieces, one shared backend:

```
                    ┌─────────────────────────┐
                    │   backend/ (FastAPI)     │
                    │   Render: admissionmate  │
                    │   -api                   │
                    │                          │
                    │  admissionmate-api       │
                    │  .onrender.com           │
                    └────────────┬─────────────┘
                                 │
                REST API (JSON, JWT bearer auth)
                                 │
                    ┌────────────▼────────────┐
                    │  admissionmate.online    │
                    │  (Vercel project         │
                    │  `admission-mate`)       │
                    │                          │
                    │  /            → frontend/ │
                    │  /admin/*  → proxied to  │
                    │  admin/'s own deployment │
                    │  via vercel.json rewrite  │
                    └──────────────────────────┘
```

`admin/` is a **separate Next.js app and Vercel project** (`admissionmate-admin`),
reached at `/admin` on the same `admissionmate.online` domain via a Vercel
multi-zone rewrite (`frontend/vercel.json`) — `admin/next.config.mjs` sets
`basePath: "/admin"` so its own routing/assets resolve under that prefix
regardless of which domain serves it (works on `admissionmate-admin.vercel.app/admin/*`
directly too).

Previously `admin/` lived on a fully separate origin (`admissionmate-admin.vercel.app`)
specifically so an XSS bug in the public site couldn't reach the admin's
`localStorage` JWT. Merging both onto one domain (2026-09-11, deliberate choice)
gives up that isolation in exchange for a single custom domain — noted here so
a future session doesn't "fix" the shared origin without knowing it was intentional.

## Backend (`backend/`)

- **Framework**: FastAPI (async), SQLAlchemy 2.0 (async, `asyncpg` driver), Alembic migrations
- **Hosted on**: Render, free web service, defined by `render.yaml` (Blueprint) at repo root
- **Database**: Neon Postgres (project `long-sky-62021025`, branch `production`) — migrated off Render's free Postgres (which was expiring 2026-10-10) on 2026-09-11. `DATABASE_URL` on Render is set manually (not Blueprint-synced) to Neon's unpooled connection string.
- **Cache / rate-limit / OTP storage**: Render-managed Redis (`admissionmate-redis`, free tier), reached over Render's private network
- **Auth**: passwordless — request a 6-digit OTP by email, verify it, get a JWT access + refresh token pair. Roles: `student` | `admin`.
- **Email**:
  - Local dev: `EMAIL_BACKEND=smtp` via Gmail (`backend/.env`, gitignored)
  - Production: `EMAIL_BACKEND=resend` — Render blocks all outbound SMTP ports on every plan, so production sends over Resend's HTTPS API instead (`backend/app/services/email/resend.py`)
  - Sending domain `admissionmate.online` is verified with Resend (DKIM/SPF/MX/CNAME records added in Hostinger DNS) — production sends `from: noreply@admissionmate.online` and can reach **any** recipient, not just the account owner
- **CORS**: `CORS_ORIGINS` env var on Render allow-lists `admissionmate.online`, `www.admissionmate.online`, plus both old `*.vercel.app` origins (kept during DNS cutover, safe to drop once the custom domain is confirmed working end-to-end)
- **Local DB browsing**: `docker-compose.yml` includes Adminer (`localhost:8080`) alongside local Postgres/Redis — a Supabase-Table-Editor-style UI for the local dev database only, not production

## Frontend (`frontend/`)

- Public exam calendar (no login) + student dashboard/planner (OTP login required)
- Deployed to Vercel project `admission-mate`, auto-deploys on push to `master` (root directory set to `frontend/`)
- Custom domains `admissionmate.online` / `www.admissionmate.online` attached (2026-09-11) — pending DNS: see "Known gaps"
- `frontend/vercel.json` rewrites `/admin` and `/admin/:path*` to the `admin/` deployment (multi-zone)
- `NEXT_PUBLIC_API_BASE_URL` → `https://admissionmate-api.onrender.com`

## Admin dashboard (`admin/`)

- Standalone Next.js app: OTP login gated to `role: admin`, manage exams, toggle user status, view audit log
- Dark/light theme (persisted, defaults to system preference)
- Deployed to its own Vercel project `admissionmate-admin` (deployed via CLI, not yet connected to auto-deploy-on-push — redeploy manually with `npx vercel --prod` from `admin/` after changes, or run `vercel git connect` to wire it up)
- `basePath: "/admin"` (`next.config.mjs`) — reached at `admissionmate.online/admin` via the frontend's rewrite, or directly at `admissionmate-admin.vercel.app/admin` (the bare `/login` root path 404s now, this is expected)
- `NEXT_PUBLIC_API_BASE_URL` → same Render backend URL
- Public frontend's admin-role login redirect targets the relative `/admin/login` path (no env var needed — works on whichever domain serves the frontend deployment)

## Secrets / where things live

| What | Where |
|---|---|
| Render API key | given in chat this session, not stored in repo |
| Resend API key | Render env var `RESEND_API_KEY` (production only) |
| Gmail app password | `backend/.env` (local only, gitignored) |
| JWT signing secret | Render env var `JWT_SECRET` (auto-generated by the Blueprint) |
| DB URL | Render env var `DATABASE_URL`, manually set to Neon (not Blueprint-synced — `render.yaml`'s `DATABASE_URL` is `sync: false`) |
| Redis URL | Render env var, auto-wired from the linked Redis resource |
| Neon account | logged in as `talhazobayed7@gmail.com`; `neon mcp` minted an account-wide API key (id `3328834`) stored in `~/.claude.json` on the machine that ran setup |

## Known gaps / next things to watch

- **`admissionmate.online` DNS not pointed at Vercel yet** — domain is attached to the `admission-mate` Vercel project, but Hostinger still needs these records added (do NOT change nameservers — that would break the existing Resend email DNS records):
  - `A  admissionmate.online  →  76.76.21.21`
  - `A  www.admissionmate.online  →  76.76.21.21`
  Until this is done, the site is only reachable at `admission-mate-sandy.vercel.app` (which already fully works, including `/admin`).
- Old Render Postgres (`admissionmate-db`) is gone — confirmed 2026-09-11 via Render API (account has zero Postgres instances), nothing left to clean up there
- Admin Vercel project isn't connected to GitHub for auto-deploy yet (manual `vercel --prod` needed after changes to `admin/`)
- Render's free web service spins down after inactivity — first request after idle has a cold-start delay
- Once the custom domain is confirmed working, drop the old `*.vercel.app` origins from `CORS_ORIGINS` (Render env var + `render.yaml`)
