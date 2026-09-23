import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { programs } from "@/db/schema/academic-structure";

// Admin-only reference-data mutations: this module has no end-user accounts
// yet (that's `identity`), so every function here uses the raw `db` export
// directly — there is no RLS-restricted caller to route through.

export async function createProgram(input: { name: string; code: string; active?: boolean }) {
  const [program] = await db
    .insert(programs)
    .values({ name: input.name, code: input.code, active: input.active ?? true })
    .returning();
  return program;
}

export async function listPrograms() {
  return db.select().from(programs).orderBy(asc(programs.name));
}

export async function getProgram(id: string) {
  const [program] = await db.select().from(programs).where(eq(programs.id, id));
  return program ?? null;
}
