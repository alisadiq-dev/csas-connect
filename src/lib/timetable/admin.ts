import { eq } from "drizzle-orm";
import { db } from "@/db";
import { courseOfferings } from "@/db/schema/academic-structure";
import { timetableSlots, type DayOfWeekEnum } from "@/db/schema/timetable";
import { validateSlot } from "./validate";
import { listAllSlotsForValidation } from "./queries";

// Admin-only writes: raw `db` export plus requireRole('admin') at the route
// level — matches SPEC-timetable.md's stated RLS ("only admin has
// INSERT/UPDATE/DELETE"), enforced for real via the migration's policies;
// this file is the one place those writes are meant to happen from.

export type CreateSlotInput = {
  courseOfferingId: string;
  dayOfWeek: DayOfWeekEnum;
  periodNumber: number;
  room?: string | null;
};

/**
 * Always validates for double-booking BEFORE writing (SPEC-timetable.md
 * Boundaries: "run the double-booking validation on every admin
 * create/update of a timetable_slots row, server-side") — never just relies
 * on the UI to prevent a conflicting submission.
 */
export async function createTimetableSlot(input: CreateSlotInput) {
  const [offering] = await db.select().from(courseOfferings).where(eq(courseOfferings.id, input.courseOfferingId));
  if (!offering) {
    throw new Error("Course offering not found.");
  }

  const existing = await listAllSlotsForValidation();
  const validation = validateSlot(
    { classId: offering.classId, teacherId: offering.teacherId, dayOfWeek: input.dayOfWeek, periodNumber: input.periodNumber },
    existing,
  );
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const [slot] = await db
    .insert(timetableSlots)
    .values({
      courseOfferingId: input.courseOfferingId,
      dayOfWeek: input.dayOfWeek,
      periodNumber: input.periodNumber,
      room: input.room ?? null,
    })
    .returning();
  return slot;
}

export async function deleteTimetableSlot(slotId: string) {
  await db.delete(timetableSlots).where(eq(timetableSlots.id, slotId));
}
