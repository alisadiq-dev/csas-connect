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
import { noticesEvents } from "@/db/schema/notices-events";
import { withUserDbFor } from "../identity/with-user-test-db";

// Proves SPEC-notices-events.md's RLS rules at the database level: a CR's
// session can INSERT a class-scoped notice for their own class, denied for
// another class or for department/program scope.

let fixtures: {
  programId: string;
  batchId: string;
  classId: string;
  otherClassId: string;
  courseId: string;
  termId: string;
  adminId: string;
  crId: string;
  nonCrStudentId: string;
  teacherId: string;
  outsiderTeacherId: string;
};

async function insertAuthUser(email: string): Promise<string> {
  const [{ id }] = (
    await testDb.execute<{ id: string }>(sql`insert into auth.users (email) values (${email}) returning id`)
  ).map((r) => r as unknown as { id: string });
  return id;
}

beforeAll(async () => {
  const suffix = `ne-${Date.now()}`;
  const [program] = await testDb.insert(programs).values({ name: `Notices test ${suffix}`, code: `NE-${suffix}` }).returning();
  const intakeYear = 900_000 + Math.floor(Math.random() * 90_000);
  const [batch] = await testDb.insert(batches).values({ programId: program.id, intakeYear }).returning();
  const [cls] = await testDb.insert(classes).values({ batchId: batch.id, sectionType: "regular", currentSemester: 1 }).returning();
  const [otherCls] = await testDb.insert(classes).values({ batchId: batch.id, sectionType: "replica", currentSemester: 1 }).returning();
  const [course] = await testDb
    .insert(courses)
    .values({ programId: program.id, code: `NCRS-${suffix}`, title: "Test Course", creditHours: "3.0", curriculumSemester: 1 })
    .returning();
  const year = 9000 + Math.floor(Math.random() * 90000);
  const [term] = await testDb.insert(academicTerms).values({ season: "fall", year, name: `Fall ${year} ${suffix}` }).returning();

  const adminId = await insertAuthUser(`ne-admin-${suffix}@example.test`);
  const crId = await insertAuthUser(`ne-cr-${suffix}@example.test`);
  const nonCrStudentId = await insertAuthUser(`ne-student-${suffix}@example.test`);
  const teacherId = await insertAuthUser(`ne-teacher-${suffix}@example.test`);
  const outsiderTeacherId = await insertAuthUser(`ne-outsider-teacher-${suffix}@example.test`);

  await testDb.insert(adminProfiles).values({ userId: adminId, fullName: "Notices Test Admin" });
  await testDb.insert(teacherProfiles).values([
    { userId: teacherId, fullName: "Assigned Teacher" },
    { userId: outsiderTeacherId, fullName: "Outsider Teacher" },
  ]);
  await testDb.insert(studentProfiles).values([
    { userId: crId, fullName: "Class Rep", rollNumber: `NE-CR-${suffix}`, classId: cls.id, isClassRep: true },
    { userId: nonCrStudentId, fullName: "Regular Student", rollNumber: `NE-STU-${suffix}`, classId: cls.id, isClassRep: false },
  ]);
  await testDb
    .insert(courseOfferings)
    .values({ classId: cls.id, courseId: course.id, termId: term.id, teacherId, semesterNumber: 1 });

  fixtures = {
    programId: program.id,
    batchId: batch.id,
    classId: cls.id,
    otherClassId: otherCls.id,
    courseId: course.id,
    termId: term.id,
    adminId,
    crId,
    nonCrStudentId,
    teacherId,
    outsiderTeacherId,
  };
});

// See tests/identity/roll-number.test.ts's afterAll for why every fixture
// (up to the program/batch/class) gets cleaned up here, not just the leaf
// rows.
afterAll(async () => {
  if (!fixtures) return;
  await testDb.delete(noticesEvents).where(eq(noticesEvents.classId, fixtures.classId));
  await testDb.delete(noticesEvents).where(eq(noticesEvents.classId, fixtures.otherClassId));
  await testDb.delete(noticesEvents).where(eq(noticesEvents.programId, fixtures.programId));
  await testDb.delete(courseOfferings).where(eq(courseOfferings.classId, fixtures.classId));
  await testDb.delete(studentProfiles).where(eq(studentProfiles.userId, fixtures.crId));
  await testDb.delete(studentProfiles).where(eq(studentProfiles.userId, fixtures.nonCrStudentId));
  await testDb.delete(teacherProfiles).where(eq(teacherProfiles.userId, fixtures.teacherId));
  await testDb.delete(teacherProfiles).where(eq(teacherProfiles.userId, fixtures.outsiderTeacherId));
  await testDb.delete(adminProfiles).where(eq(adminProfiles.userId, fixtures.adminId));
  await testDb.execute(
    sql`delete from auth.users where id in (${fixtures.adminId}, ${fixtures.crId}, ${fixtures.nonCrStudentId}, ${fixtures.teacherId}, ${fixtures.outsiderTeacherId})`,
  );
  await testDb.delete(courses).where(eq(courses.id, fixtures.courseId));
  await testDb.delete(academicTerms).where(eq(academicTerms.id, fixtures.termId));
  await testDb.delete(classes).where(eq(classes.id, fixtures.otherClassId));
  await testDb.delete(classes).where(eq(classes.id, fixtures.classId));
  await testDb.delete(batches).where(eq(batches.id, fixtures.batchId));
  await testDb.delete(programs).where(eq(programs.id, fixtures.programId));
});

describe("notices_events RLS (Task 37)", () => {
  it("a CR can INSERT a class-scoped notice for their own class", async () => {
    const created = await withUserDbFor(fixtures.crId, async (tx) =>
      tx
        .insert(noticesEvents)
        .values({ title: "Own-class notice", category: "Announcement", audienceScope: "class", classId: fixtures.classId, createdBy: fixtures.crId })
        .returning(),
    );
    expect(created).toHaveLength(1);
  });

  it("a CR is DENIED inserting a notice for another class", async () => {
    await expect(
      withUserDbFor(fixtures.crId, async (tx) =>
        tx
          .insert(noticesEvents)
          .values({ title: "Other class notice", category: "Announcement", audienceScope: "class", classId: fixtures.otherClassId, createdBy: fixtures.crId })
          .returning(),
      ),
    ).rejects.toThrow();
  });

  it("a CR is DENIED inserting a department-scoped notice", async () => {
    await expect(
      withUserDbFor(fixtures.crId, async (tx) =>
        tx.insert(noticesEvents).values({ title: "Dept notice", category: "Announcement", audienceScope: "department", createdBy: fixtures.crId }).returning(),
      ),
    ).rejects.toThrow();
  });

  it("a CR is DENIED inserting a program-scoped notice", async () => {
    await expect(
      withUserDbFor(fixtures.crId, async (tx) =>
        tx
          .insert(noticesEvents)
          .values({ title: "Program notice", category: "Announcement", audienceScope: "program", programId: fixtures.programId, createdBy: fixtures.crId })
          .returning(),
      ),
    ).rejects.toThrow();
  });

  it("a non-CR student in the same class is DENIED inserting any notice", async () => {
    await expect(
      withUserDbFor(fixtures.nonCrStudentId, async (tx) =>
        tx
          .insert(noticesEvents)
          .values({ title: "Non-CR attempt", category: "Announcement", audienceScope: "class", classId: fixtures.classId, createdBy: fixtures.nonCrStudentId })
          .returning(),
      ),
    ).rejects.toThrow();
  });

  it("a teacher (read-only in this module) is DENIED inserting any notice", async () => {
    await expect(
      withUserDbFor(fixtures.teacherId, async (tx) =>
        tx
          .insert(noticesEvents)
          .values({ title: "Teacher attempt", category: "Announcement", audienceScope: "class", classId: fixtures.classId, createdBy: fixtures.teacherId })
          .returning(),
      ),
    ).rejects.toThrow();
  });

  it("admin CAN INSERT any scope", async () => {
    const created = await withUserDbFor(fixtures.adminId, async (tx) =>
      tx.insert(noticesEvents).values({ title: "Dept notice by admin", category: "Announcement", audienceScope: "department", createdBy: fixtures.adminId }).returning(),
    );
    expect(created).toHaveLength(1);
    await testDb.delete(noticesEvents).where(eq(noticesEvents.id, created[0].id));
  });

  it("visibility: a department notice is visible to everyone; a program notice only to the matching program; a class notice only to that class plus its assigned teacher", async () => {
    const [deptNotice] = await testDb
      .insert(noticesEvents)
      .values({ title: "Dept visibility check", category: "Announcement", audienceScope: "department", createdBy: fixtures.adminId })
      .returning();
    const [programNotice] = await testDb
      .insert(noticesEvents)
      .values({ title: "Program visibility check", category: "Announcement", audienceScope: "program", programId: fixtures.programId, createdBy: fixtures.adminId })
      .returning();
    const [classNotice] = await testDb
      .insert(noticesEvents)
      .values({ title: "Class visibility check", category: "Announcement", audienceScope: "class", classId: fixtures.classId, createdBy: fixtures.adminId })
      .returning();

    const studentView = await withUserDbFor(fixtures.nonCrStudentId, async (tx) => tx.select().from(noticesEvents));
    const ids = studentView.map((n) => n.id);
    expect(ids).toContain(deptNotice.id);
    expect(ids).toContain(programNotice.id);
    expect(ids).toContain(classNotice.id);

    const outsiderView = await withUserDbFor(fixtures.outsiderTeacherId, async (tx) => tx.select().from(noticesEvents));
    const outsiderIds = outsiderView.map((n) => n.id);
    expect(outsiderIds).toContain(deptNotice.id);
    expect(outsiderIds).not.toContain(programNotice.id);
    expect(outsiderIds).not.toContain(classNotice.id);

    const assignedTeacherView = await withUserDbFor(fixtures.teacherId, async (tx) => tx.select().from(noticesEvents));
    const assignedIds = assignedTeacherView.map((n) => n.id);
    expect(assignedIds).toContain(classNotice.id);

    await testDb.delete(noticesEvents).where(eq(noticesEvents.id, deptNotice.id));
    await testDb.delete(noticesEvents).where(eq(noticesEvents.id, programNotice.id));
    await testDb.delete(noticesEvents).where(eq(noticesEvents.id, classNotice.id));
  });
});
