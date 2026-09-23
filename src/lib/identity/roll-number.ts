import { count, eq } from "drizzle-orm";
import { db } from "../../db/index.ts";
import { batches, classes } from "../../db/schema/academic-structure.ts";
import { studentProfiles } from "../../db/schema/identity.ts";

/**
 * `{seq}-{yy}` — YY = batch.intake_year % 100.
 *
 * Deviation from SPEC-identity.md's literal description ("NN = sequence
 * within class"), noted here because it affects a "get it right once"
 * piece other modules depend on: `student_profiles.roll_number` has a
 * GLOBAL unique constraint (schema, not app-level), but "sequence within
 * class" alone cannot satisfy that the moment two classes share an intake
 * year — which happens by construction every time, since every batch
 * always gets a Regular *and* a Replica class together
 * (createClassesForBatch), both with the same batch.intake_year. Two
 * classes' first students would both compute "1-26", violating the unique
 * constraint (confirmed while seeding: db/seed/identity.ts hit exactly this
 * collision on the very first multi-program run).
 *
 * Fix: NN counts sequentially across every student who shares this batch's
 * intake_year — across all programs and both sections — not just this one
 * class. This is the only scoping that keeps the exact "NN-YY" display
 * format from the spec while making the global uniqueness constraint it's
 * stored under actually satisfiable. Sequential per class (as originally
 * described) remains true for a batch with only one class, and remains
 * cheap to reason about (still "first come, first numbered" within a
 * cohort) — it just widens "cohort" from "this section" to "this intake
 * year," matching how university roll-number ranges are usually issued in
 * practice (per admission year, not per section).
 */
export async function generateRollNumber(classId: string): Promise<string> {
  const [cls] = await db
    .select({ intakeYear: batches.intakeYear })
    .from(classes)
    .innerJoin(batches, eq(classes.batchId, batches.id))
    .where(eq(classes.id, classId));

  if (!cls) {
    throw new Error(`Class ${classId} not found`);
  }

  const [{ value }] = await db
    .select({ value: count() })
    .from(studentProfiles)
    .innerJoin(classes, eq(studentProfiles.classId, classes.id))
    .innerJoin(batches, eq(classes.batchId, batches.id))
    .where(eq(batches.intakeYear, cls.intakeYear));

  const yy = (cls.intakeYear % 100).toString().padStart(2, "0");
  return `${value + 1}-${yy}`;
}
