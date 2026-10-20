# CSAS Connect

Departmental portal for the University of the Punjab's Statistics department (BS Statistics, BS Biostatistics, BS Computational Statistics). See `CAPABILITY_MAP.md` and the `SPEC-*.md` files for the full specification, and `tasks/plan.md` / `tasks/todo.md` for the implementation plan.

## Local development

```bash
npm install
npm run db:local:start   # starts an isolated Postgres instance for this project (first run initializes it; safe to call anytime)
npm run db:migrate       # applies migrations to the local dev database
npm run db:seed          # seeds academic-structure demo data (3 programs, 24 classes, courses, Fall 2026 offerings)
npm run db:seed:auth     # seeds identity demo accounts (admin, teachers, students) — run after db:seed
npm run dev               # http://localhost:3000
```

Other useful commands:

```bash
npm test                  # runs the test suite against the local test database
npm run db:generate       # generates a new migration after changing src/db/schema/*.ts
npm run db:local:stop     # stops the local Postgres instance
npm run db:local:status   # checks whether it's running
npm run db:studio         # opens Drizzle Studio against the local dev database
```

Demo login credentials after seeding (local dev only — see "Local auth shim" below): `admin@csas-connect.local` / `AdminPass123!`, `teacher.<program-code>.<1-4>@csas-connect.local` / `TeacherPass123!` (program codes: `stat`, `biostat`, `cs`), and any seeded student (`select email from auth.users` after seeding, or query `student_profiles` for a roll number and reconstruct `student.<roll-number>.<class-id-prefix>@csas-connect.local`) / `StudentPass123!`. Both seed scripts are idempotent — safe to re-run, they skip if already seeded.


### Demo accounts on the landing / login pages

The landing page ("Try it with a test account") and the login page ("Quick fill") show the seeded demo logins for one-tap copy/fill. They are **only shown outside production**; set `SHOW_DEMO_ACCOUNTS=true` to show them on a deployed site (don't, unless that deployment is a throwaway demo).

### Install as an app (PWA)

`/manifest.webmanifest` + generated icons (`/pwa-icon/*`, `/apple-icon`) make the site installable: on a phone use "Add to Home Screen" and it opens full-screen with a bottom tab bar. There is no service worker, so it needs a connection.

### Local auth shim (RLS testing without a real Supabase project)

No cloud Supabase project is connected yet (see "Cloud setup" below), but Row-Level Security still needs to be tested against real Postgres. `scripts/local-auth-shim.sql` (applied automatically by `npm run db:local:start`, never part of `db/migrations/`) makes the local dev/test databases provide `auth.users`, `auth.uid()`, and the `authenticated` role the same way real Supabase-hosted Postgres does, plus a local-only `auth.local_credentials` table so `/login` can verify passwords without a real GoTrue server running. `src/lib/db/with-user.ts` (`withUserDb`) is the only code path that should run student/teacher/CR-scoped queries — it drops the Postgres session to the `authenticated` role and sets `auth.uid()` inside a transaction, exactly like Supabase's PostgREST does, so nothing here needs to change once a real project exists.

The local Postgres instance is dedicated to this project only — separate data directory (`~/.csas-connect-devdb`, deliberately kept outside the repo so Next.js's build tooling doesn't scan its socket file), separate port (54329), trust-auth, loopback-only. It never touches any other Postgres install on your machine. Connection details are in `.env.local` (gitignored).

## Cloud setup (needed before deploying)

Local dev works without any cloud account. To deploy to a live, shareable URL, you'll need to do two things yourself — these both involve account creation and browser-based login, which can't be done on your behalf:

**1. Create a Supabase project** (free tier)
- Sign up / log in at [supabase.com](https://supabase.com) and create a new project.
- In the project's Settings → API page, copy the Project URL and the `anon` public key.
- In Settings → Database, copy the connection string (use the "Session pooler" or direct connection string, whichever the project's Postgres driver needs — we're using `postgres.js`, which works with either).
- In Settings → API, copy the `service_role` key too (used server-side only, for the admin-API account creation in the `identity` module — never exposed to the browser).
- Add these to `.env.local` yourself (it's already gitignored, so this is safe):
  ```
  NEXT_PUBLIC_SUPABASE_URL=...
  NEXT_PUBLIC_SUPABASE_ANON_KEY=...
  SUPABASE_SERVICE_ROLE_KEY=...
  SUPABASE_DATABASE_URL=<the Supabase Postgres connection string, for one-time migrate/seed only>
  ```
  Note `SUPABASE_DATABASE_URL` is deliberately separate from `DATABASE_URL`/`DATABASE_URL_TEST` — those two keep pointing at the local Postgres instance for day-to-day `npm run dev`/`npm test`, so adding cloud credentials doesn't change local development at all. `SUPABASE_DATABASE_URL` is only used for the explicit one-time commands that migrate/seed the real cloud database (see below), and for Vercel's own environment variables at deploy time (set separately, in Vercel's dashboard, not from this file).

**2. Deploy to Vercel** (free tier)
- Install the CLI (`npm install -g vercel`, or use `npx vercel`) and run `vercel login` yourself in a real terminal — it opens a browser for authentication.
- From the project root, run `vercel` (creates a preview deployment) or `vercel --prod` (production).
- In the Vercel project's dashboard (Settings → Environment Variables), add the same four variables listed above, pointing at your Supabase project — Vercel needs them at build/runtime, not just locally.

Once both are done, the app is live at the URL Vercel gives you. Nothing above needs to be shared in chat — set the values directly in `.env.local` and the Vercel dashboard.
