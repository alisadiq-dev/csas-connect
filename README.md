# CSAS Connect

Departmental portal for the University of the Punjab's Statistics department (BS Statistics, BS Biostatistics, BS Computational Statistics). See `CAPABILITY_MAP.md` and the `SPEC-*.md` files for the full specification, and `tasks/plan.md` / `tasks/todo.md` for the implementation plan.

## Local development

```bash
npm install
npm run db:local:start   # starts an isolated Postgres instance for this project (first run initializes it)
npm run db:migrate       # applies migrations to the local dev + test databases
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
  DATABASE_URL=<the Supabase Postgres connection string, for Drizzle migrations>
  ```

**2. Deploy to Vercel** (free tier)
- Install the CLI (`npm install -g vercel`, or use `npx vercel`) and run `vercel login` yourself in a real terminal — it opens a browser for authentication.
- From the project root, run `vercel` (creates a preview deployment) or `vercel --prod` (production).
- In the Vercel project's dashboard (Settings → Environment Variables), add the same four variables listed above, pointing at your Supabase project — Vercel needs them at build/runtime, not just locally.

Once both are done, the app is live at the URL Vercel gives you. Nothing above needs to be shared in chat — set the values directly in `.env.local` and the Vercel dashboard.
