import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// `prepare: false` is required, not optional: withUserDb() runs `SET LOCAL
// ROLE authenticated` + `set_config('request.jwt.claim.sub', ...)` per
// request on a pooled connection shared across many different users'
// requests over the server's lifetime. postgres.js's default server-side
// prepared statements are cached per physical connection keyed by SQL text
// alone, independent of which role/user prepared them — so a later request
// for a *different* user can silently reuse an *earlier* user's prepared
// plan and see stale/wrong RLS-filtered results. Disabling prepare makes
// every query re-parse and re-plan (and therefore re-apply RLS) under the
// role actually active for that request.
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client);
