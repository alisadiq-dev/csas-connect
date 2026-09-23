import { sql } from "drizzle-orm";
import { db } from "../../db/index.ts";
import { hashPassword, verifyPassword } from "./password.ts";

/**
 * Server-side account creation — the only way an account is ever created in
 * this app (there is no public sign-up route, per SPEC-identity.md).
 *
 * Two paths, chosen automatically:
 *
 * 1. Real Supabase project configured (NEXT_PUBLIC_SUPABASE_URL +
 *    SUPABASE_SERVICE_ROLE_KEY set — see README "Cloud setup"): calls
 *    Supabase's Admin REST API directly with the service-role key, exactly
 *    what `supabase.auth.admin.createUser()` does under the hood. No SDK
 *    dependency — a single authenticated POST. NOTE: this path is
 *    implemented per Supabase's documented Admin API contract but has not
 *    been exercised against a real project in this environment (no cloud
 *    Supabase project exists yet — creating one requires a human's browser
 *    login, out of scope here). It should work unmodified once one exists;
 *    flag if it doesn't.
 *
 * 2. No real Supabase project configured (local dev, this environment):
 *    inserts directly into the local auth shim's `auth.users` table (see
 *    scripts/local-auth-shim.sql) using the raw `db` export — this is
 *    exactly the kind of service-role-equivalent, admin-only operation that
 *    export exists for. The password is hashed with scrypt and stored in
 *    the shim-only `auth.local_credentials` table (never in `auth.users`
 *    itself, and never anywhere a real Supabase project has an equivalent
 *    column) so src/lib/identity/session.ts can verify local dev/demo
 *    logins without a real GoTrue server running.
 */

export function isRealSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function createAuthUser(input: { email: string; password: string }): Promise<{ userId: string }> {
  if (isRealSupabaseConfigured()) {
    return createAuthUserViaSupabaseAdminApi(input);
  }
  return createAuthUserLocally(input);
}

async function createAuthUserViaSupabaseAdminApi(input: {
  email: string;
  password: string;
}): Promise<{ userId: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ email: input.email, password: input.password, email_confirm: true }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase Admin API createUser failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as { id: string };
  return { userId: data.id };
}

async function createAuthUserLocally(input: { email: string; password: string }): Promise<{ userId: string }> {
  const rows = await db.execute<{ id: string }>(
    sql`insert into auth.users (email) values (${input.email}) returning id`,
  );
  const userId = rows[0]?.id;
  if (!userId) {
    throw new Error("Local auth shim did not return a user id");
  }

  const passwordHash = await hashPassword(input.password);
  await db.execute(
    sql`insert into auth.local_credentials (user_id, password_hash) values (${userId}, ${passwordHash})`,
  );

  return { userId };
}

/**
 * Verifies email+password against Supabase's password-grant token endpoint.
 * Same caveat as createAuthUserViaSupabaseAdminApi: implemented per
 * Supabase's documented REST contract, not exercised against a real
 * project in this environment. Not used by src/app/login — this app's
 * login form uses the local-dev session mechanism (session.ts) regardless
 * of which path created the account, since there's no real GoTrue server
 * running locally to hand back a Supabase session to. Kept here so the
 * pattern already exists once a real project make this the live path.
 */
export async function signInWithPasswordViaSupabase(input: {
  email: string;
  password: string;
}): Promise<{ userId: string } | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: anonKey },
    body: JSON.stringify({ email: input.email, password: input.password }),
  });
  if (!response.ok) return null;

  const data = (await response.json()) as { user?: { id: string } };
  return data.user ? { userId: data.user.id } : null;
}

/**
 * Local-dev-only credential check (see createAuthUserLocally above for why
 * this exists). Never used when a real Supabase project is configured —
 * login there goes through Supabase Auth's own session flow instead.
 */
export async function verifyLocalCredentials(email: string, password: string): Promise<{ userId: string } | null> {
  const rows = await db.execute<{ id: string; password_hash: string }>(
    sql`select u.id, lc.password_hash
        from auth.users u
        join auth.local_credentials lc on lc.user_id = u.id
        where u.email = ${email}`,
  );
  const row = rows[0];
  if (!row) return null;

  const valid = await verifyPassword(password, row.password_hash);
  if (!valid) return null;

  return { userId: row.id };
}
