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
import { adminProfiles, studentProfiles } from "@/db/schema/identity";
import { periodDefinitions, timetableSlots } from "@/db/schema/timetable";
import { withUserDbFor } from "../identity/with-user-test-db";

// Proves SPEC-timetable.md's RLS rule at the database level: "any
// authenticated user (SELECT) can read timetable_slots/period_definitions;
// only admin has INSERT/UPDATE/DELETE."

let fixtures: { offeringId: string; adminId: string; studentId: string; slotId: string };

async function insertAuthUser(email: string): Promise<string> {
  const [{ id }] = (
    await testDb.execute<{ id: string }>(sql`insert into auth.users (email) values (${email}) returning id`)
  ).map((r) => r as unknown as { id: string });
  return id;
}

beforeAll(async () => {
  const suffix = `tt-${Date.now()}`;
  const [program] = await testDb.insert(programs).values({ name: `Timetable test ${suffix}`, code: `TT-${suffix}` }).returning();
  const intakeYear = 700_000 + Math.floor(Math.random() * 100_000);
  const [batch] = await testDb.insert(batches).values({ programId: program.id, intakeYear }).returning();
  const [cls] = await testDb.insert(classes).values({ batchId: batch.id, sectionType: "regular", currentSemester: 1 }).returning();
  const [course] = await testDb
    .insert(courses)
    .values({ programId: program.id, code: `TCRS-${suffix}`, title: "Test Course", creditHours: "3.0", curriculumSemester: 1 })
    .returning();
  const year = 8000 + Math.floor(Math.random() * 90000);
  const [term] = await testDb.insert(academicTerms).values({ season: "fall", year, name: `Fall ${year} ${suffix}` }).returning();
  const [offering] = await testDb
    .insert(courseOfferings)
    .values({ classId: cls.id, courseId: course.id, termId: term.id, semesterNumber: 1 })
    .returning();

  const adminId = await insertAuthUser(`tt-admin-${suffix}@example.test`);
  const studentId = await insertAuthUser(`tt-student-${suffix}@example.test`);
  await testDb.insert(adminProfiles).values({ userId: adminId, fullName: "Timetable Test Admin" });
  await testDb.insert(studentProfiles).values({ userId: studentId, fullName: "Student", rollNumber: `TT-${suffix}`, classId: cls.id });

  const [slot] = await testDb
    .insert(timetableSlots)
    .values({ courseOfferingId: offering.id, dayOfWeek: "mon", periodNumber: 1 })
    .returning();

  fixtures = { offeringId: offering.id, adminId, studentId, slotId: slot.id };
});

afterAll(async () => {
  if (!fixtures) return;
  await testDb.delete(timetableSlots).where(eq(timetableSlots.courseOfferingId, fixtures.offeringId));
  await testDb.delete(courseOfferings).where(eq(courseOfferings.id, fixtures.offeringId));
  await testDb.delete(studentProfiles).where(eq(studentProfiles.userId, fixtures.studentId));
  await testDb.delete(adminProfiles).where(eq(adminProfiles.userId, fixtures.adminId));
  await testDb.execute(sql`delete from auth.users where id in (${fixtures.adminId}, ${fixtures.studentId})`);
});

describe("timetable RLS (Task 30)", () => {
  it("period_definitions is readable by any authenticated user", async () => {
    const rows = await withUserDbFor(fixtures.studentId, async (tx) => tx.select().from(periodDefinitions));
    expect(rows.length).toBeGreaterThan(0);
  });

  it("any authenticated user (e.g. a student) can SELECT timetable_slots", async () => {
    const rows = await withUserDbFor(fixtures.studentId, async (tx) =>
      tx.select().from(timetableSlots).where(eq(timetableSlots.id, fixtures.slotId)),
    );
    expect(rows).toHaveLength(1);
  });

  it("a non-admin (student) INSERT is denied", async () => {
    await expect(
      withUserDbFor(fixtures.studentId, async (tx) =>
        tx.insert(timetableSlots).values({ courseOfferingId: fixtures.offeringId, dayOfWeek: "tue", periodNumber: 2 }).returning(),
      ),
    ).rejects.toThrow();
  });

  it("admin CAN INSERT a new timetable slot", async () => {
    const created = await withUserDbFor(fixtures.adminId, async (tx) =>
      tx.insert(timetableSlots).values({ courseOfferingId: fixtures.offeringId, dayOfWeek: "wed", periodNumber: 3 }).returning(),
    );
    expect(created).toHaveLength(1);
    await testDb.delete(timetableSlots).where(eq(timetableSlots.id, created[0].id));
  });

  it("a non-admin (student) UPDATE is denied", async () => {
    const updated = await withUserDbFor(fixtures.studentId, async (tx) =>
      tx.update(timetableSlots).set({ room: "Room 101" }).where(eq(timetableSlots.id, fixtures.slotId)).returning(),
    );
    expect(updated).toHaveLength(0);
  });
});
