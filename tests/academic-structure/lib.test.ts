import { eq } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import { testDb } from "../db";
import { academicTerms, batches, classes, courseOfferings } from "@/db/schema/academic-structure";

// These lib functions use the shared `db` export (src/db/index.ts), which
// points at DATABASE_URL (the dev database) — not DATABASE_URL_TEST. Point
// the module at the test database for this suite by mocking `@/db` before
// importing the functions under test, so lib tests exercise the same
// isolated test DB as every other integration test.
vi.mock("@/db", async () => {
  const { testDb } = await import("../db");
  return { db: testDb };
});

const { createProgram, listPrograms } = await import("@/lib/academic-structure/programs");
const { createBatch } = await import("@/lib/academic-structure/batches");
const { createClassesForBatch } = await import("@/lib/academic-structure/classes");
const { createCourse } = await import("@/lib/academic-structure/courses");
const { createAcademicTerm } = await import("@/lib/academic-structure/terms");
const { createCourseOffering } = await import("@/lib/academic-structure/offerings");

describe("lib/academic-structure", () => {
  it("createProgram + listPrograms round-trip", async () => {
    const code = `LIB-${Date.now()}`;
    const program = await createProgram({ name: "Lib test program", code });
    const all = await listPrograms();
    expect(all.some((p) => p.id === program.id)).toBe(true);
  });

  it("createClassesForBatch generates exactly regular + replica", async () => {
    const program = await createProgram({ name: "Lib test program 2", code: `LIB2-${Date.now()}` });
    const [batch] = await testDb.insert(batches).values({ programId: program.id, intakeYear: 2027 }).returning();

    const created = await createClassesForBatch(batch.id, 3);
    expect(created).toHaveLength(2);
    expect(created.map((c) => c.sectionType).sort()).toEqual(["regular", "replica"]);
    expect(created.every((c) => c.currentSemester === 3)).toBe(true);
  });

  it("createBatch creates the batch and its two classes together", async () => {
    const program = await createProgram({ name: "Lib test program 3", code: `LIB3-${Date.now()}` });
    const { batch, classes: createdClasses } = await createBatch({
      programId: program.id,
      intakeYear: 2028,
      currentSemester: 5,
    });
    expect(createdClasses).toHaveLength(2);

    const stored = await testDb.select().from(classes).where(eq(classes.batchId, batch.id));
    expect(stored).toHaveLength(2);
  });

  it("createCourseOffering denormalizes the class's current_semester as semester_number", async () => {
    const program = await createProgram({ name: "Lib test program 4", code: `LIB4-${Date.now()}` });
    const intakeYear = 5000 + Math.floor(Math.random() * 90000);
    const { batch } = await createBatch({ programId: program.id, intakeYear, currentSemester: 7 });
    const [cls] = await testDb.select().from(classes).where(eq(classes.batchId, batch.id));

    const course = await createCourse({
      programId: program.id,
      code: `CRS-${Date.now()}`,
      title: "Lib Test Course",
      creditHours: 3,
      curriculumSemester: 7,
    });
    const termYear = 5000 + Math.floor(Math.random() * 90000);
    const term = await createAcademicTerm({ season: "fall", year: termYear });

    const offering = await createCourseOffering({ classId: cls.id, courseId: course.id, termId: term.id });
    expect(offering.semesterNumber).toBe(7);

    const [stored] = await testDb.select().from(courseOfferings).where(eq(courseOfferings.id, offering.id));
    expect(stored.teacherId).toBeNull();
  });

  it("createAcademicTerm derives the display name from season+year", async () => {
    const year = 3000 + Math.floor(Math.random() * 90000); // keep unique across runs
    const term = await createAcademicTerm({ season: "spring", year });
    expect(term.name).toBe(`Spring ${year}`);

    const [stored] = await testDb.select().from(academicTerms).where(eq(academicTerms.id, term.id));
    expect(stored.name).toBe(`Spring ${year}`);
  });
});
