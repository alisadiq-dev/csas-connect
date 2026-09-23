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
import { attendanceRecords, attendanceSessions } from "@/db/schema/attendance";
import { withUserDbFor } from "../identity/with-user-test-db";

// Proves SPEC-attendance.md's RLS rules at the database level: admin has
// full INSERT/UPDATE/SELECT; a teacher gets UPDATE-only (no INSERT) scoped
// to their own course offering; a student gets SELECT-own-only. Every query
// goes through withUserDbFor, exactly like tests/identity/rls.test.ts.

let fixtures: {
  offeringId: string;
  otherOfferingId: string;
  adminId: string;
  teacherId: string;
  otherTeacherId: string;
  studentAId: string;
  studentBId: string;
  sessionId: string;
};

async function insertAuthUser(email: string): Promise<string> {
  const [{ id }] = (
    await testDb.execute<{ id: string }>(sql`insert into auth.users (email) values (${email}) returning id`)
  ).map((r) => r as unknown as { id: string });
  return id;
}

beforeAll(async () => {
  const suffix = `att-${Date.now()}`;
  const [program] = await testDb.insert(programs).values({ name: `Attendance test ${suffix}`, code: `ATT-${suffix}` }).returning();
  const intakeYear = 300_000 + Math.floor(Math.random() * 100_000);
  const [batch] = await testDb.insert(batches).values({ programId: program.id, intakeYear }).returning();
  const [cls] = await testDb.insert(classes).values({ batchId: batch.id, sectionType: "regular", currentSemester: 1 }).returning();
  const [course] = await testDb
    .insert(courses)
    .values({ programId: program.id, code: `CRS-${suffix}`, title: "Test Course", creditHours: "3.0", curriculumSemester: 1 })
    .returning();
  const [otherCourse] = await testDb
    .insert(courses)
    .values({ programId: program.id, code: `CRS2-${suffix}`, title: "Other Test Course", creditHours: "3.0", curriculumSemester: 1 })
    .returning();
  const year = 5000 + Math.floor(Math.random() * 90000);
  const [term] = await testDb.insert(academicTerms).values({ season: "fall", year, name: `Fall ${year} ${suffix}` }).returning();

  const adminId = await insertAuthUser(`att-admin-${suffix}@example.test`);
  const teacherId = await insertAuthUser(`att-teacher-${suffix}@example.test`);
  const otherTeacherId = await insertAuthUser(`att-other-teacher-${suffix}@example.test`);
  const studentAId = await insertAuthUser(`att-student-a-${suffix}@example.test`);
  const studentBId = await insertAuthUser(`att-student-b-${suffix}@example.test`);

  await testDb.insert(adminProfiles).values({ userId: adminId, fullName: "Attendance Test Admin" });
  await testDb.insert(teacherProfiles).values([
    { userId: teacherId, fullName: "Assigned Teacher" },
    { userId: otherTeacherId, fullName: "Unassigned Teacher" },
  ]);
  await testDb.insert(studentProfiles).values([
    { userId: studentAId, fullName: "Student A", rollNumber: `ATT-A-${suffix}`, classId: cls.id },
    { userId: studentBId, fullName: "Student B", rollNumber: `ATT-B-${suffix}`, classId: cls.id },
  ]);

  const [offering] = await testDb
    .insert(courseOfferings)
    .values({ classId: cls.id, courseId: course.id, termId: term.id, teacherId, semesterNumber: 1 })
    .returning();
  const [otherOffering] = await testDb
    .insert(courseOfferings)
    .values({ classId: cls.id, courseId: otherCourse.id, termId: term.id, teacherId: otherTeacherId, semesterNumber: 1 })
    .returning();

  const [session] = await testDb
    .insert(attendanceSessions)
    .values({ courseOfferingId: offering.id, sessionDate: "2026-09-01", createdBy: adminId })
    .returning();
  await testDb.insert(attendanceRecords).values([
    { sessionId: session.id, studentUserId: studentAId, status: "present", updatedBy: adminId },
    { sessionId: session.id, studentUserId: studentBId, status: "absent", updatedBy: adminId },
  ]);

  fixtures = {
    offeringId: offering.id,
    otherOfferingId: otherOffering.id,
    adminId,
    teacherId,
    otherTeacherId,
    studentAId,
    studentBId,
    sessionId: session.id,
  };
});

afterAll(async () => {
  if (!fixtures) return;
  await testDb.delete(attendanceRecords).where(eq(attendanceRecords.sessionId, fixtures.sessionId));
  await testDb.delete(attendanceSessions).where(eq(attendanceSessions.id, fixtures.sessionId));
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
});

describe("attendance RLS (Task 18)", () => {
  it("admin can INSERT a new session and record", async () => {
    const created = await withUserDbFor(fixtures.adminId, async (tx) => {
      const [s] = await tx
        .insert(attendanceSessions)
        .values({ courseOfferingId: fixtures.offeringId, sessionDate: "2026-09-08", createdBy: fixtures.adminId })
        .returning();
      const [r] = await tx
        .insert(attendanceRecords)
        .values({ sessionId: s.id, studentUserId: fixtures.studentAId, status: "present", updatedBy: fixtures.adminId })
        .returning();
      return { s, r };
    });
    expect(created.s.id).toBeDefined();
    expect(created.r.id).toBeDefined();
    // cleanup
    await testDb.delete(attendanceRecords).where(eq(attendanceRecords.id, created.r.id));
    await testDb.delete(attendanceSessions).where(eq(attendanceSessions.id, created.s.id));
  });

  it("the assigned teacher can SELECT and UPDATE a record for their own course offering", async () => {
    const before = await withUserDbFor(fixtures.teacherId, async (tx) =>
      tx.select().from(attendanceRecords).where(eq(attendanceRecords.sessionId, fixtures.sessionId)),
    );
    expect(before).toHaveLength(2);

    const updated = await withUserDbFor(fixtures.teacherId, async (tx) =>
      tx
        .update(attendanceRecords)
        .set({ status: "leave" })
        .where(eq(attendanceRecords.studentUserId, fixtures.studentBId))
        .returning(),
    );
    expect(updated).toHaveLength(1);
    expect(updated[0].status).toBe("leave");
  });

  it("the assigned teacher CANNOT INSERT a new attendance session — no INSERT policy exists", async () => {
    await expect(
      withUserDbFor(fixtures.teacherId, async (tx) =>
        tx
          .insert(attendanceSessions)
          .values({ courseOfferingId: fixtures.offeringId, sessionDate: "2026-09-15", createdBy: fixtures.teacherId })
          .returning(),
      ),
    ).rejects.toThrow();
  });

  it("the assigned teacher CANNOT INSERT a new attendance record — no INSERT policy exists", async () => {
    await expect(
      withUserDbFor(fixtures.teacherId, async (tx) =>
        tx
          .insert(attendanceRecords)
          .values({ sessionId: fixtures.sessionId, studentUserId: fixtures.studentAId, status: "present", updatedBy: fixtures.teacherId })
          .returning(),
      ),
    ).rejects.toThrow();
  });

  it("a teacher NOT assigned to the course offering cannot see or update its records", async () => {
    const rows = await withUserDbFor(fixtures.otherTeacherId, async (tx) =>
      tx.select().from(attendanceRecords).where(eq(attendanceRecords.sessionId, fixtures.sessionId)),
    );
    expect(rows).toHaveLength(0);

    const updated = await withUserDbFor(fixtures.otherTeacherId, async (tx) =>
      tx
        .update(attendanceRecords)
        .set({ status: "absent" })
        .where(eq(attendanceRecords.studentUserId, fixtures.studentAId))
        .returning(),
    );
    expect(updated).toHaveLength(0);
  });

  it("a student sees only their own attendance records", async () => {
    const ownRecords = await withUserDbFor(fixtures.studentAId, async (tx) => tx.select().from(attendanceRecords));
    expect(ownRecords).toHaveLength(1);
    expect(ownRecords[0].studentUserId).toBe(fixtures.studentAId);
  });

  it("a student cannot UPDATE any attendance record, even their own — no policy grants it", async () => {
    const updated = await withUserDbFor(fixtures.studentAId, async (tx) =>
      tx
        .update(attendanceRecords)
        .set({ status: "absent" })
        .where(eq(attendanceRecords.studentUserId, fixtures.studentAId))
        .returning(),
    );
    expect(updated).toHaveLength(0);
  });
});
