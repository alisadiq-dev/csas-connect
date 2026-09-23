import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testDb } from "../db";
import { batches, classes, programs } from "@/db/schema/academic-structure";
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
};

beforeAll(async () => {
  const [program] = await testDb
    .insert(programs)
    .values({ name: "RLS test program", code: `RLS-${Date.now()}` })
    .returning();
  const [batch] = await testDb.insert(batches).values({ programId: program.id, intakeYear: 2024 }).returning();
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

  await testDb.insert(studentProfiles).values([
    { userId: studentAId, fullName: "Student A", rollNumber: `A-${Date.now()}`, classId: cls.id },
    { userId: studentBId, fullName: "Student B", rollNumber: `B-${Date.now()}`, classId: cls.id },
  ]);
  await testDb.insert(teacherProfiles).values({ userId: teacherId, fullName: "RLS Test Teacher" });

  fixtureIds = {
    programId: program.id,
    batchId: batch.id,
    classId: cls.id,
    studentAId,
    studentBId,
    teacherId,
  };
});

afterAll(async () => {
  if (!fixtureIds) return;
  await testDb.delete(studentProfiles).where(eq(studentProfiles.classId, fixtureIds.classId));
  await testDb.delete(teacherProfiles).where(eq(teacherProfiles.userId, fixtureIds.teacherId));
  const { sql } = await import("drizzle-orm");
  await testDb.execute(
    sql`delete from auth.users where id in (${fixtureIds.studentAId}, ${fixtureIds.studentBId}, ${fixtureIds.teacherId})`,
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
