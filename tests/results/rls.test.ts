import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testDb } from "../db";
import {
  academicTerms,
  batches,
  classes,
  courseOfferings,
  courses,
  programs,
} from "@/db/schema/academic-structure";
import { adminProfiles, studentProfiles, teacherProfiles } from "@/db/schema/identity";
import { results } from "@/db/schema/results";
import { withUserDbFor } from "../identity/with-user-test-db";

// Proves SPEC-results.md's RLS rules ("RLS matches the attendance pattern:
// admin full, teacher update-own-only, student select-own-only") at the
// database level, mirroring tests/attendance/rls.test.ts.

let fixtures: {
  programId: string;
  batchId: string;
  classId: string;
  courseId: string;
  otherCourseId: string;
  termId: string;
  offeringId: string;
  otherOfferingId: string;
  adminId: string;
  teacherId: string;
  otherTeacherId: string;
  studentAId: string;
  studentBId: string;
  resultId: string;
};

async function insertAuthUser(email: string): Promise<string> {
  const [{ id }] = (
    await testDb.execute<{ id: string }>(sql`insert into auth.users (email) values (${email}) returning id`)
  ).map((r) => r as unknown as { id: string });
  return id;
}

beforeAll(async () => {
  const suffix = `res-${Date.now()}`;
  const [program] = await testDb.insert(programs).values({ name: `Results test ${suffix}`, code: `RES-${suffix}` }).returning();
  const intakeYear = 400_000 + Math.floor(Math.random() * 100_000);
  const [batch] = await testDb.insert(batches).values({ programId: program.id, intakeYear }).returning();
  const [cls] = await testDb.insert(classes).values({ batchId: batch.id, sectionType: "regular", currentSemester: 1 }).returning();
  const [course] = await testDb
    .insert(courses)
    .values({ programId: program.id, code: `RCRS-${suffix}`, title: "Test Course", creditHours: "3.0", curriculumSemester: 1 })
    .returning();
  const [otherCourse] = await testDb
    .insert(courses)
    .values({ programId: program.id, code: `RCRS2-${suffix}`, title: "Other Test Course", creditHours: "3.0", curriculumSemester: 1 })
    .returning();
  const year = 6000 + Math.floor(Math.random() * 90000);
  const [term] = await testDb.insert(academicTerms).values({ season: "fall", year, name: `Fall ${year} ${suffix}` }).returning();

  const adminId = await insertAuthUser(`res-admin-${suffix}@example.test`);
  const teacherId = await insertAuthUser(`res-teacher-${suffix}@example.test`);
  const otherTeacherId = await insertAuthUser(`res-other-teacher-${suffix}@example.test`);
  const studentAId = await insertAuthUser(`res-student-a-${suffix}@example.test`);
  const studentBId = await insertAuthUser(`res-student-b-${suffix}@example.test`);

  await testDb.insert(adminProfiles).values({ userId: adminId, fullName: "Results Test Admin" });
  await testDb.insert(teacherProfiles).values([
    { userId: teacherId, fullName: "Assigned Teacher" },
    { userId: otherTeacherId, fullName: "Unassigned Teacher" },
  ]);
  await testDb.insert(studentProfiles).values([
    { userId: studentAId, fullName: "Student A", rollNumber: `RES-A-${suffix}`, classId: cls.id },
    { userId: studentBId, fullName: "Student B", rollNumber: `RES-B-${suffix}`, classId: cls.id },
  ]);

  const [offering] = await testDb
    .insert(courseOfferings)
    .values({ classId: cls.id, courseId: course.id, termId: term.id, teacherId, semesterNumber: 1 })
    .returning();
  const [otherOffering] = await testDb
    .insert(courseOfferings)
    .values({ classId: cls.id, courseId: otherCourse.id, termId: term.id, teacherId: otherTeacherId, semesterNumber: 1 })
    .returning();

  const [result] = await testDb
    .insert(results)
    .values({
      courseOfferingId: offering.id,
      studentUserId: studentAId,
      sessionalMarks: "20.00",
      midTermMarks: "30.00",
      finalTermMarks: "35.00",
      totalMarks: "85.00",
      letterGrade: "A",
      gradePoints: "4.00",
      updatedBy: adminId,
    })
    .returning();
  await testDb.insert(results).values({
    courseOfferingId: offering.id,
    studentUserId: studentBId,
    sessionalMarks: "10.00",
    midTermMarks: "15.00",
    finalTermMarks: "20.00",
    totalMarks: "45.00",
    letterGrade: "F",
    gradePoints: "0.00",
    updatedBy: adminId,
  });

  fixtures = {
    programId: program.id,
    batchId: batch.id,
    classId: cls.id,
    courseId: course.id,
    otherCourseId: otherCourse.id,
    termId: term.id,
    offeringId: offering.id,
    otherOfferingId: otherOffering.id,
    adminId,
    teacherId,
    otherTeacherId,
    studentAId,
    studentBId,
    resultId: result.id,
  };
});

// See tests/identity/roll-number.test.ts's afterAll for why every fixture
// (up to the program/batch/class) gets cleaned up here, not just the
// leaf rows.
afterAll(async () => {
  if (!fixtures) return;
  await testDb.delete(results).where(eq(results.courseOfferingId, fixtures.offeringId));
  await testDb.delete(courseOfferings).where(eq(courseOfferings.id, fixtures.offeringId));
  await testDb.delete(courseOfferings).where(eq(courseOfferings.id, fixtures.otherOfferingId));
  await testDb.delete(studentProfiles).where(eq(studentProfiles.userId, fixtures.studentAId));
  await testDb.delete(studentProfiles).where(eq(studentProfiles.userId, fixtures.studentBId));
  await testDb.delete(teacherProfiles).where(eq(teacherProfiles.userId, fixtures.teacherId));
  await testDb.delete(teacherProfiles).where(eq(teacherProfiles.userId, fixtures.otherTeacherId));
  await testDb.delete(adminProfiles).where(eq(adminProfiles.userId, fixtures.adminId));
  await testDb.execute(
    sql`delete from auth.users where id in (${fixtures.adminId}, ${fixtures.teacherId}, ${fixtures.otherTeacherId}, ${fixtures.studentAId}, ${fixtures.studentBId})`,
  );
  await testDb.delete(courses).where(eq(courses.id, fixtures.courseId));
  await testDb.delete(courses).where(eq(courses.id, fixtures.otherCourseId));
  await testDb.delete(academicTerms).where(eq(academicTerms.id, fixtures.termId));
  await testDb.delete(classes).where(eq(classes.id, fixtures.classId));
  await testDb.delete(batches).where(eq(batches.id, fixtures.batchId));
  await testDb.delete(programs).where(eq(programs.id, fixtures.programId));
});

describe("results RLS (Task 24)", () => {
  it("admin can INSERT a new result", async () => {
    // A fresh (offering, student) pair — studentA already has a result on
    // `offeringId` from the fixture (unique constraint), so this proves the
    // INSERT policy itself, not a conflict-driven no-op.
    const created = await withUserDbFor(fixtures.adminId, async (tx) =>
      tx
        .insert(results)
        .values({
          courseOfferingId: fixtures.otherOfferingId,
          studentUserId: fixtures.studentAId,
          specialStatus: "I",
          updatedBy: fixtures.adminId,
        })
        .returning(),
    );
    expect(created).toHaveLength(1);
    await testDb.delete(results).where(eq(results.id, created[0].id));
  });

  it("the assigned teacher can SELECT and UPDATE a result for their own course offering", async () => {
    const before = await withUserDbFor(fixtures.teacherId, async (tx) =>
      tx.select().from(results).where(eq(results.courseOfferingId, fixtures.offeringId)),
    );
    expect(before).toHaveLength(2);

    const updated = await withUserDbFor(fixtures.teacherId, async (tx) =>
      tx
        .update(results)
        .set({ finalTermMarks: "38.00", totalMarks: "88.00", letterGrade: "A", gradePoints: "4.00" })
        .where(eq(results.id, fixtures.resultId))
        .returning(),
    );
    expect(updated).toHaveLength(1);
    expect(updated[0].totalMarks).toBe("88.00");
  });

  it("the assigned teacher CANNOT INSERT a new result — no INSERT policy exists for teachers", async () => {
    await expect(
      withUserDbFor(fixtures.teacherId, async (tx) =>
        tx
          .insert(results)
          .values({ courseOfferingId: fixtures.offeringId, studentUserId: fixtures.studentAId, specialStatus: "W", updatedBy: fixtures.teacherId })
          .returning(),
      ),
    ).rejects.toThrow();
  });

  it("a teacher NOT assigned to the course offering cannot see or update its results", async () => {
    const rows = await withUserDbFor(fixtures.otherTeacherId, async (tx) =>
      tx.select().from(results).where(eq(results.courseOfferingId, fixtures.offeringId)),
    );
    expect(rows).toHaveLength(0);

    const updated = await withUserDbFor(fixtures.otherTeacherId, async (tx) =>
      tx.update(results).set({ letterGrade: "F" }).where(eq(results.id, fixtures.resultId)).returning(),
    );
    expect(updated).toHaveLength(0);
  });

  it("a student sees only their own results", async () => {
    const own = await withUserDbFor(fixtures.studentAId, async (tx) => tx.select().from(results));
    expect(own).toHaveLength(1);
    expect(own[0].studentUserId).toBe(fixtures.studentAId);
  });

  it("a student cannot UPDATE any result, even their own", async () => {
    const updated = await withUserDbFor(fixtures.studentAId, async (tx) =>
      tx.update(results).set({ letterGrade: "F" }).where(eq(results.id, fixtures.resultId)).returning(),
    );
    expect(updated).toHaveLength(0);
  });
});
