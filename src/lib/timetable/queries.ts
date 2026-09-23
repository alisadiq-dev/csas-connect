import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { courseOfferings, courses, programs, classes, batches } from "@/db/schema/academic-structure";
import { teacherProfiles } from "@/db/schema/identity";
import { periodDefinitions, timetableSlots, type DayOfWeekEnum } from "@/db/schema/timetable";
import type { ExistingSlot } from "./validate";

// Read-only. Timetable data is open-read for any authenticated user
// (SPEC-timetable.md) — the raw `db` export plus a route-level
// requireRole() check is enough here, unlike attendance/results, which must
// go through withUserDb for RLS enforcement per-request.

export async function listPeriodDefinitions() {
  return db.select().from(periodDefinitions).orderBy(asc(periodDefinitions.periodNumber));
}

export type SlotWithContext = {
  id: string;
  dayOfWeek: DayOfWeekEnum;
  periodNumber: number;
  room: string | null;
  courseOfferingId: string;
  courseCode: string;
  courseTitle: string;
  teacherId: string | null;
  teacherName: string | null;
};

export async function listSlotsForClass(classId: string): Promise<SlotWithContext[]> {
  return db
    .select({
      id: timetableSlots.id,
      dayOfWeek: timetableSlots.dayOfWeek,
      periodNumber: timetableSlots.periodNumber,
      room: timetableSlots.room,
      courseOfferingId: timetableSlots.courseOfferingId,
      courseCode: courses.code,
      courseTitle: courses.title,
      teacherId: courseOfferings.teacherId,
      teacherName: teacherProfiles.fullName,
    })
    .from(timetableSlots)
    .innerJoin(courseOfferings, eq(timetableSlots.courseOfferingId, courseOfferings.id))
    .innerJoin(courses, eq(courseOfferings.courseId, courses.id))
    .leftJoin(teacherProfiles, eq(courseOfferings.teacherId, teacherProfiles.userId))
    .where(eq(courseOfferings.classId, classId));
}

export type SlotWithFullContext = SlotWithContext & {
  classId: string;
  programName: string;
  sectionType: string;
  intakeYear: number;
};

export async function listSlotsForTeacher(teacherUserId: string): Promise<SlotWithFullContext[]> {
  return db
    .select({
      id: timetableSlots.id,
      dayOfWeek: timetableSlots.dayOfWeek,
      periodNumber: timetableSlots.periodNumber,
      room: timetableSlots.room,
      courseOfferingId: timetableSlots.courseOfferingId,
      courseCode: courses.code,
      courseTitle: courses.title,
      teacherId: courseOfferings.teacherId,
      teacherName: teacherProfiles.fullName,
      classId: courseOfferings.classId,
      programName: programs.name,
      sectionType: classes.sectionType,
      intakeYear: batches.intakeYear,
    })
    .from(timetableSlots)
    .innerJoin(courseOfferings, eq(timetableSlots.courseOfferingId, courseOfferings.id))
    .innerJoin(courses, eq(courseOfferings.courseId, courses.id))
    .innerJoin(classes, eq(courseOfferings.classId, classes.id))
    .innerJoin(batches, eq(classes.batchId, batches.id))
    .innerJoin(programs, eq(batches.programId, programs.id))
    .leftJoin(teacherProfiles, eq(courseOfferings.teacherId, teacherProfiles.userId))
    .where(eq(courseOfferings.teacherId, teacherUserId));
}

/** Every slot with its owning class/teacher — the input validateSlot() checks new/edited slots against. */
export async function listAllSlotsForValidation(): Promise<ExistingSlot[]> {
  return db
    .select({
      id: timetableSlots.id,
      classId: courseOfferings.classId,
      teacherId: courseOfferings.teacherId,
      dayOfWeek: timetableSlots.dayOfWeek,
      periodNumber: timetableSlots.periodNumber,
    })
    .from(timetableSlots)
    .innerJoin(courseOfferings, eq(timetableSlots.courseOfferingId, courseOfferings.id));
}
