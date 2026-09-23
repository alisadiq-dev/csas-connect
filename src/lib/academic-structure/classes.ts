import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { batches, classes, programs } from "@/db/schema/academic-structure";

export async function createClassesForBatch(batchId: string, currentSemester = 1) {
  return db
    .insert(classes)
    .values([
      { batchId, sectionType: "regular", currentSemester },
      { batchId, sectionType: "replica", currentSemester },
    ])
    .returning();
}

export async function listClassesForBatch(batchId: string) {
  return db.select().from(classes).where(eq(classes.batchId, batchId));
}

/** All classes with enough context (program, intake year) to label a dropdown or list. */
export async function listAllClassesWithContext() {
  return db
    .select({
      id: classes.id,
      sectionType: classes.sectionType,
      currentSemester: classes.currentSemester,
      batchId: classes.batchId,
      intakeYear: batches.intakeYear,
      programId: programs.id,
      programName: programs.name,
    })
    .from(classes)
    .innerJoin(batches, eq(classes.batchId, batches.id))
    .innerJoin(programs, eq(batches.programId, programs.id))
    .orderBy(asc(programs.name), asc(batches.intakeYear), asc(classes.sectionType));
}

export async function advanceClassSemester(classId: string, newSemester: number) {
  const [updated] = await db
    .update(classes)
    .set({ currentSemester: newSemester })
    .where(eq(classes.id, classId))
    .returning();
  return updated;
}
