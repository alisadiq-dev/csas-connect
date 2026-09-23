import { pgSchema, uuid } from "drizzle-orm/pg-core";

// Reference-only representation of Supabase's `auth.users` table (locally
// provided by the shim in scripts/local-auth-shim.sql; on a real Supabase
// project it already exists). Deliberately lives OUTSIDE
// `src/db/schema/*.ts` — drizzle-kit's `schema` glob (drizzle.config.ts)
// only scans that directory, so this file is never picked up for migration
// generation. It exists purely so other schema files can `.references()`
// its `id` column for a real foreign key, without drizzle-kit ever trying
// to CREATE/ALTER/DROP `auth.users` itself (which would be wrong on both
// the local shim, which already owns that table, and a real Supabase
// project, which already has its own).
const authSchema = pgSchema("auth");

export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});
