-- Local-only shim that makes this project's isolated dev/test Postgres behave
-- like real Supabase-hosted Postgres for Row-Level Security testing.
--
-- Applied ONLY to the local dev/test databases by scripts/db-local.sh (start).
-- NEVER part of db/migrations/ — those files must stay portable to a real
-- Supabase project, which already ships its own real `auth` schema; applying
-- this shim there would be wrong/dangerous.
--
-- Idempotent: safe to re-run on every `npm run db:local:start`.

create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique
);

create or replace function auth.uid() returns uuid
language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

do $$ begin
  if not exists (select from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end $$;

grant usage on schema public, auth to authenticated;

-- --- Local-dev-only extension, beyond the minimal auth.uid() shim above ---
--
-- Real Supabase Auth (GoTrue) issues its own sessions and verifies passwords
-- itself; nothing in this project ever re-implements that against a real
-- project. But no real Supabase project exists yet (see README "Cloud
-- setup"), so there is no GoTrue server running locally to verify email+
-- password login against. This table lets src/lib/identity/auth.ts verify
-- credentials locally for dev/demo login only — it is never read by RLS
-- policies (auth.uid() above is the only thing policies depend on), never
-- created in db/migrations/, and has no equivalent on a real Supabase
-- project (where password verification happens inside GoTrue, not Postgres).
create table if not exists auth.local_credentials (
  user_id uuid primary key references auth.users(id) on delete cascade,
  password_hash text not null
);
