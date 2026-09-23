import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { batches } from "@/db/schema/academic-structure";
import { createClassesForBatch } from "./classes";

/**
 * Creates a batch (program + intake year) and immediately generates its
 * Regular and Replica classes — the two always exist together per the spec.
 */
export async function createBatch(input: {
  programId: string;
  intakeYear: number;
  currentSemester?: number;
}) {
  const [batch] = await db
    .insert(batches)
    .values({ programId: input.programId, intakeYear: input.intakeYear })
    .returning();
  const classes = await createClassesForBatch(batch.id, input.currentSemester ?? 1);
  return { batch, classes };
}

export async function listBatchesForProgram(programId: string) {
  return db.select().from(batches).where(eq(batches.programId, programId)).orderBy(asc(batches.intakeYear));
}
