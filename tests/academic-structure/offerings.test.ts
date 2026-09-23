import { describe, expect, it } from "vitest";
import { testDb } from "../db";
import {
  academicTerms,
  batches,
  classes,
  courseOfferings,
  courses,
  programs,
} from "@/db/schema/academic-structure";

async function seedClassAndCourse(suffix: string) {
  const [program] = await testDb
    .insert(programs)
    .values({ name: `Offerings test program ${suffix}`, code: `OT-${suffix}` })
    .returning();
  const [batch] = await testDb
    .insert(batches)
    .values({ programId: program.id, intakeYear: 2024 })
    .returning();
  const [cls] = await testDb
    .insert(classes)
    .values({ batchId: batch.id, sectionType: "regular", currentSemester: 1 })
    .returning();
  const [course] = await testDb
    .insert(courses)
    .values({
      programId: program.id,
      code: `CRS-${suffix}`,
      title: "Test Course",
      creditHours: "3.0",
      curriculumSemester: 1,
    })
    .returning();
  return { program, batch, class: cls, course };
}

describe("academic-structure schema (Task 6): courses, academic_terms, course_offerings", () => {
  it("creates a course with is_verified_curriculum defaulting false", async () => {
    const { course } = await seedClassAndCourse(`verify-${Date.now()}`);
    expect(course.isVerifiedCurriculum).toBe(false);
  });

  it("teacher_id is nullable on course_offerings (placeholder until identity ships)", async () => {
    const { class: cls, course } = await seedClassAndCourse(`nullable-${Date.now()}`);
    const year = 4000 + Math.floor(Math.random() * 90000);
    const [term] = await testDb
      .insert(academicTerms)
      .values({ season: "fall", year, name: `Fall ${year}` })
      .returning();

    const [offering] = await testDb
      .insert(courseOfferings)
      .values({ classId: cls.id, courseId: course.id, termId: term.id, semesterNumber: 1 })
      .returning();

    expect(offering.teacherId).toBeNull();
  });

  it("rejects a duplicate (class_id, course_id, term_id) offering", async () => {
    const { class: cls, course } = await seedClassAndCourse(`dup-${Date.now()}`);
    const year = 4000 + Math.floor(Math.random() * 90000);
    const [term] = await testDb
      .insert(academicTerms)
      .values({ season: "spring", year, name: `Spring ${year}` })
      .returning();

    await testDb
      .insert(courseOfferings)
      .values({ classId: cls.id, courseId: course.id, termId: term.id, semesterNumber: 1 });

    await expect(
      testDb
        .insert(courseOfferings)
        .values({ classId: cls.id, courseId: course.id, termId: term.id, semesterNumber: 1 }),
    ).rejects.toThrow();
  });
});
