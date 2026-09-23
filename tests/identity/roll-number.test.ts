import { sql } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import { testDb } from "../db";
import { batches, classes, programs } from "@/db/schema/academic-structure";
import { studentProfiles } from "@/db/schema/identity";

vi.mock("@/db", async () => {
  const { testDb } = await import("../db");
  return { db: testDb };
});

const { generateRollNumber } = await import("@/lib/identity/roll-number");

async function makeClass(intakeYear: number, sectionType: "regular" | "replica" = "regular") {
  const [program] = await testDb
    .insert(programs)
    .values({ name: `Roll number test ${Date.now()}`, code: `RN-${Date.now()}-${Math.random()}` })
    .returning();
  const [batch] = await testDb.insert(batches).values({ programId: program.id, intakeYear }).returning();
  const [cls] = await testDb.insert(classes).values({ batchId: batch.id, sectionType, currentSemester: 1 }).returning();
  return cls;
}

/** Two independent batches (different programs) sharing the same intake year — the exact collision generateRollNumber must avoid. */
async function makeTwoBatchesSameYear(intakeYear: number) {
  const classA = await makeClass(intakeYear, "regular");
  const classB = await makeClass(intakeYear, "regular");
  return { classA, classB };
}

// Distinct, non-overlapping intake years per test run (a random base plus a
// monotonic counter) — a previous version drew independently random years
// per test with overlapping ranges, which very occasionally collided
// between two `it()` blocks in this file and made one flaky.
let yearCounter = 0;
const YEAR_BASE = 500_000 + Math.floor(Math.random() * 1_000_000);
function nextYear(): number {
  return YEAR_BASE + yearCounter++;
}

async function makeStudent(classId: string, rollNumber: string) {
  const rows = await testDb.execute<{ id: string }>(
    sql`insert into auth.users (email) values (${`rn-${rollNumber}-${Date.now()}-${Math.random()}@example.test`}) returning id`,
  );
  const userId = rows[0].id;
  await testDb.insert(studentProfiles).values({ userId, fullName: "Test Student", rollNumber, classId });
  return userId;
}

describe("generateRollNumber (Task 13)", () => {
  it("first student in a class gets sequence 1", async () => {
    const year = nextYear();
    const cls = await makeClass(year);
    const rollNumber = await generateRollNumber(cls.id);
    expect(rollNumber).toBe(`1-${(year % 100).toString().padStart(2, "0")}`);
  });

  it("the nth student gets sequence n", async () => {
    const year = nextYear();
    const cls = await makeClass(year);
    await makeStudent(cls.id, `seed-a-${cls.id}`);
    await makeStudent(cls.id, `seed-b-${cls.id}`);
    const rollNumber = await generateRollNumber(cls.id);
    expect(rollNumber).toBe(`3-${(year % 100).toString().padStart(2, "0")}`);
  });

  it("formats single-digit intake years as two digits (YY padding)", async () => {
    // Unique-per-run year whose last two digits are deliberately "05".
    const year = nextYear() * 100 + 5;
    const cls = await makeClass(year);
    const rollNumber = await generateRollNumber(cls.id);
    expect(rollNumber).toBe("1-05");
  });

  it("a different intake year starts its own sequence at 1, independent of other years", async () => {
    const yearA = nextYear();
    const clsA = await makeClass(yearA);
    await makeStudent(clsA.id, `seed-a-${clsA.id}`);

    const yearB = nextYear();
    const clsB = await makeClass(yearB);
    const rollNumber = await generateRollNumber(clsB.id);
    expect(rollNumber).toBe(`1-${(yearB % 100).toString().padStart(2, "0")}`);
  });

  it("two classes sharing an intake year (e.g. Regular + Replica of the same batch, or two programs' batches admitted the same year) do NOT collide — this is the exact bug generateRollNumber must avoid, since student_profiles.roll_number has a GLOBAL unique constraint", async () => {
    const year = nextYear();
    const { classA, classB } = await makeTwoBatchesSameYear(year);

    const rollA1 = await generateRollNumber(classA.id);
    await makeStudent(classA.id, rollA1);

    const rollB1 = await generateRollNumber(classB.id);
    await makeStudent(classB.id, rollB1);

    const rollA2 = await generateRollNumber(classA.id);

    // All three must be distinct (no collision), and the shared YY cohort
    // sequence must keep incrementing across both classes.
    expect(new Set([rollA1, rollB1, rollA2]).size).toBe(3);
    expect(rollA1).toBe(`1-${(year % 100).toString().padStart(2, "0")}`);
    expect(rollB1).toBe(`2-${(year % 100).toString().padStart(2, "0")}`);
    expect(rollA2).toBe(`3-${(year % 100).toString().padStart(2, "0")}`);
  });
});
