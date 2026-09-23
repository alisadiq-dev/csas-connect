import { sql, type ExtractTablesWithRelations } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import { db } from "@/db";

export type UserDbTx = PgTransaction<
  PostgresJsQueryResultHKT,
  Record<string, never>,
  ExtractTablesWithRelations<Record<string, never>>
>;

/**
 * The ONLY way student/teacher/CR-scoped queries should touch the database.
 * Runs `fn` inside a transaction where the Postgres session has dropped to
 * the unprivileged `authenticated` role and `auth.uid()` resolves to
 * `userId` — exactly how Supabase's own PostgREST layer executes queries in
 * production, so every RLS policy that would apply there applies here too.
 *
 * Never use the raw `db` export for these queries: `db` connects as the
 * table-owning role, which bypasses Row-Level Security entirely regardless
 * of policies — appropriate only for admin/service-role-equivalent server
 * actions (clearly marked as such), never for student/teacher/CR requests.
 */
export async function withUserDb<T>(userId: string, fn: (tx: UserDbTx) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`set local role authenticated`);
    await tx.execute(sql`select set_config('request.jwt.claim.sub', ${userId}, true)`);
    return fn(tx);
  });
}
