import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testDb } from "../db";
import { academicTerms, batches, classes, courseOfferings, courses, programs } from "@/db/schema/academic-structure";
import { studentProfiles, teacherProfiles } from "@/db/schema/identity";
import { withUserDbFor } from "./with-user-test-db";

// Proves SPEC-identity.md's core claim at the database level, not the app
// layer: "a student can SELECT only their own row... No student can query
// another student's row, by roll number or otherwise." Every query here
// goes through withUserDbFor (the test-db-pointed variant of
// src/lib/db/with-user.ts's withUserDb — see that file for why), which
// drops the Postgres session to the unprivileged `authenticated` role and
// sets auth.uid() via request.jwt.claim.sub, exactly like a real Supabase
// PostgREST request would.
//
// This test was manually verified to FAIL before the RLS policies existed
// (temporarily `ALTER TABLE student_profiles DISABLE ROW LEVEL SECURITY`
// reproduces that state — see tasks/todo.md Task 12 notes) and to PASS once
// they're in place, proving the policy — not the test — is what's doing the
// work.

let fixtureIds: {
  programId: string;
  batchId: string;
  classId: string;
  studentAId: string;
  studentBId: string;
  teacherId: string;
  courseId: string;
  termId: string;
  offeringId: string;
  assignedTeacherId: string;
};

beforeAll(async () => {
  const [program] = await testDb
    .insert(programs)
    .values({ name: "RLS test program", code: `RLS-${Date.now()}` })
    .returning();
  // A randomized, unlikely-to-collide intake year: student_profiles.roll_number
  // generation (Task 13) scopes its sequence by intake year GLOBALLY across
  // the whole database (see src/lib/identity/roll-number.ts), and vitest
  // runs test files in parallel by default — a hardcoded year here
  // previously collided with tests/identity/roll-number.test.ts's own
  // fixtures running concurrently in another file.
  const intakeYear = 200_000 + Math.floor(Math.random() * 100_000);
  const [batch] = await testDb.insert(batches).values({ programId: program.id, intakeYear }).returning();
  const [cls] = await testDb
    .insert(classes)
    .values({ batchId: batch.id, sectionType: "regular", currentSemester: 1 })
    .returning();

  // Raw SQL for auth.users inserts: that table lives outside drizzle's
  // managed schema (see src/db/schema-ref/auth.ts) so there's no typed
  // table object to insert through.
  const { sql } = await import("drizzle-orm");
  const [{ id: studentAId }] = (
    await testDb.execute<{ id: string }>(
      sql`insert into auth.users (email) values (${"rls-student-a-" + Date.now() + "@example.test"}) returning id`,
    )
  ).map((r) => r as unknown as { id: string });
  const [{ id: studentBId }] = (
    await testDb.execute<{ id: string }>(
      sql`insert into auth.users (email) values (${"rls-student-b-" + Date.now() + "@example.test"}) returning id`,
    )
  ).map((r) => r as unknown as { id: string });
  const [{ id: teacherId }] = (
    await testDb.execute<{ id: string }>(
      sql`insert into auth.users (email) values (${"rls-teacher-" + Date.now() + "@example.test"}) returning id`,
    )
  ).map((r) => r as unknown as { id: string });
  const [{ id: assignedTeacherId }] = (
    await testDb.execute<{ id: string }>(
      sql`insert into auth.users (email) values (${"rls-assigned-teacher-" + Date.now() + "@example.test"}) returning id`,
    )
  ).map((r) => r as unknown as { id: string });

  await testDb.insert(studentProfiles).values([
    { userId: studentAId, fullName: "Student A", rollNumber: `A-${Date.now()}`, classId: cls.id },
    { userId: studentBId, fullName: "Student B", rollNumber: `B-${Date.now()}`, classId: cls.id },
  ]);
  await testDb.insert(teacherProfiles).values([
    { userId: teacherId, fullName: "RLS Test Teacher" },
    { userId: assignedTeacherId, fullName: "RLS Assigned Teacher" },
  ]);

  const [course] = await testDb
    .insert(courses)
    .values({ programId: program.id, code: `RLS-CRS-${Date.now()}`, title: "RLS Test Course", creditHours: "3.0", curriculumSemester: 1 })
    .returning();
  const year = 5000 + Math.floor(Math.random() * 90000);
  const [term] = await testDb.insert(academicTerms).values({ season: "fall", year, name: `RLS Fall ${year}` }).returning();
  const [offering] = await testDb
    .insert(courseOfferings)
    .values({ classId: cls.id, courseId: course.id, termId: term.id, teacherId: assignedTeacherId, semesterNumber: 1 })
    .returning();

  fixtureIds = {
    programId: program.id,
    batchId: batch.id,
    classId: cls.id,
    studentAId,
    studentBId,
    teacherId,
    courseId: course.id,
    termId: term.id,
    offeringId: offering.id,
    assignedTeacherId,
  };
});

afterAll(async () => {
  if (!fixtureIds) return;
  await testDb.delete(courseOfferings).where(eq(courseOfferings.id, fixtureIds.offeringId));
  await testDb.delete(courses).where(eq(courses.id, fixtureIds.courseId));
  await testDb.delete(academicTerms).where(eq(academicTerms.id, fixtureIds.termId));
  await testDb.delete(studentProfiles).where(eq(studentProfiles.classId, fixtureIds.classId));
  await testDb.delete(teacherProfiles).where(eq(teacherProfiles.userId, fixtureIds.teacherId));
  await testDb.delete(teacherProfiles).where(eq(teacherProfiles.userId, fixtureIds.assignedTeacherId));
  const { sql } = await import("drizzle-orm");
  await testDb.execute(
    sql`delete from auth.users where id in (${fixtureIds.studentAId}, ${fixtureIds.studentBId}, ${fixtureIds.teacherId}, ${fixtureIds.assignedTeacherId})`,
  );
  await testDb.delete(classes).where(eq(classes.id, fixtureIds.classId));
  await testDb.delete(batches).where(eq(batches.id, fixtureIds.batchId));
  await testDb.delete(programs).where(eq(programs.id, fixtureIds.programId));
});

describe("student_profiles RLS (Task 12)", () => {
  it("a student's session can SELECT its own row", async () => {
    const rows = await withUserDbFor(fixtureIds.studentAId, async (tx) =>
      tx.select().from(studentProfiles).where(eq(studentProfiles.userId, fixtureIds.studentAId)),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].fullName).toBe("Student A");
  });

  it("a student's session CANNOT SELECT another student's row — denied at the database level", async () => {
    const rows = await withUserDbFor(fixtureIds.studentAId, async (tx) =>
      tx.select().from(studentProfiles).where(eq(studentProfiles.userId, fixtureIds.studentBId)),
    );
    // RLS filters silently (no error) — the row exists (student B has a
    // profile) but the policy hides it from student A's session.
    expect(rows).toHaveLength(0);
  });

  it("a student's session cannot see another student's row even scanning the whole table unfiltered", async () => {
    const rows = await withUserDbFor(fixtureIds.studentAId, async (tx) => tx.select().from(studentProfiles));
    expect(rows.map((r) => r.userId)).toEqual([fixtureIds.studentAId]);
  });

  it("an unauthenticated session (no auth.uid()) sees no student_profiles rows at all", async () => {
    const rows = await withUserDbFor(null, async (tx) => tx.select().from(studentProfiles));
    expect(rows).toHaveLength(0);
  });
});

describe("teacher_profiles RLS (Task 12)", () => {
  it("a teacher's session can SELECT its own row and not another user's student row", async () => {
    const ownRow = await withUserDbFor(fixtureIds.teacherId, async (tx) =>
      tx.select().from(teacherProfiles).where(eq(teacherProfiles.userId, fixtureIds.teacherId)),
    );
    expect(ownRow).toHaveLength(1);

    const studentRowsViaTeacherSession = await withUserDbFor(fixtureIds.teacherId, async (tx) =>
      tx.select().from(studentProfiles).where(eq(studentProfiles.userId, fixtureIds.studentAId)),
    );
    expect(studentRowsViaTeacherSession).toHaveLength(0);
  });
});

// Regression coverage for a real gap found during frontend verification
// (see db/migrations/0008_student_profiles_teacher_select.sql): a teacher's
// UI queries join attendance_records/results to student_profiles to show a
// roster's name/roll number. Without this policy, the join silently
// returned zero rows for every teacher — attendance_records/results were
// visible, but student_profiles wasn't, so the INNER JOIN dropped
// everything.
describe("student_profiles_teacher_select RLS (Task 18/19 follow-up)", () => {
  it("a teacher WITH a course offering in the student's class CAN see that student's profile", async () => {
    const rows = await withUserDbFor(fixtureIds.assignedTeacherId, async (tx) =>
      tx.select().from(studentProfiles).where(eq(studentProfiles.userId, fixtureIds.studentAId)),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].fullName).toBe("Student A");
  });

  it("a teacher WITH a course offering in the class sees every student in that class, not just one", async () => {
    const rows = await withUserDbFor(fixtureIds.assignedTeacherId, async (tx) =>
      tx.select().from(studentProfiles).where(eq(studentProfiles.classId, fixtureIds.classId)),
    );
    expect(rows.map((r) => r.userId).sort()).toEqual([fixtureIds.studentAId, fixtureIds.studentBId].sort());
  });

  it("a teacher WITHOUT any course offering in that class still sees nothing — scope is real, not blanket teacher access", async () => {
    const rows = await withUserDbFor(fixtureIds.teacherId, async (tx) =>
      tx.select().from(studentProfiles).where(eq(studentProfiles.classId, fixtureIds.classId)),
    );
    expect(rows).toHaveLength(0);
  });
});
