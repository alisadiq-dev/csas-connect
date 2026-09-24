import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Dedicated connection for the test suite — always the isolated test
// database (csas_connect_test), never the dev database, so tests can
// freely insert/delete without touching data used for manual dev checks.
const connectionString = process.env.DATABASE_URL_TEST;
if (!connectionString) {
  throw new Error("DATABASE_URL_TEST is not set — is .env.local loaded?");
}

// See src/db/index.ts for why `prepare: false` is required whenever a
// pooled connection is shared across withUserDb() calls for different
// users/roles.
const client = postgres(connectionString, { prepare: false });
export const testDb = drizzle(client);
