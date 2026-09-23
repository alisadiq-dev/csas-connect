import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Runs once before the whole test suite: applies every checked-in migration
// (db/migrations/) to the isolated test database, so `npm test` always runs
// against the current schema without a separate manual migrate step.
export default async function globalSetup() {
  const connectionString = process.env.DATABASE_URL_TEST;
  if (!connectionString) {
    throw new Error("DATABASE_URL_TEST is not set — is .env.local loaded?");
  }

  const client = postgres(connectionString, { max: 1, onnotice: () => {} });
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: "./db/migrations" });
  await client.end();
}
