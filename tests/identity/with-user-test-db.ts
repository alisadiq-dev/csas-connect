import { sql } from "drizzle-orm";
import { testDb } from "../db";

/**
 * Test-only counterpart to src/lib/db/with-user.ts's `withUserDb` — same
 * mechanism (drop to the `authenticated` role, set auth.uid() via
 * request.jwt.claim.sub, all inside one transaction), pointed at the
 * isolated test database instead of dev. Production code must still only
 * ever import `withUserDb` from src/lib/db/with-user.ts; this exists purely
 * so RLS integration tests can exercise the identical mechanism without
 * touching dev data.
 *
 * `userId: null` simulates an unauthenticated Postgres session: role drops
 * to `authenticated` but `auth.uid()` resolves to NULL (the JWT claim GUC
 * is never set), matching an anonymous PostgREST request.
 */
export async function withUserDbFor<T>(
  userId: string | null,
  fn: (tx: Parameters<Parameters<typeof testDb.transaction>[0]>[0]) => Promise<T>,
): Promise<T> {
  return testDb.transaction(async (tx) => {
    await tx.execute(sql`set local role authenticated`);
    if (userId !== null) {
      await tx.execute(sql`select set_config('request.jwt.claim.sub', ${userId}, true)`);
    }
    return fn(tx);
  });
}
