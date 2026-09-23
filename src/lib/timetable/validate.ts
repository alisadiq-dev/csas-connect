import type { DayOfWeekEnum } from "@/db/schema/timetable";

// See SPEC-timetable.md. Double-booking prevention can't be expressed as a
// simple table constraint (it spans a join: timetable_slots ->
// course_offerings -> class_id/teacher_id) — this is application-level
// validation, called before every admin create/update, server-side
// (Boundaries: "run the double-booking validation on every admin
// create/update of a timetable_slots row, server-side, not just as a
// client-side form check").

export type ExistingSlot = {
  id: string;
  classId: string;
  teacherId: string | null;
  dayOfWeek: DayOfWeekEnum;
  periodNumber: number;
};

export type NewSlotInput = {
  classId: string;
  teacherId: string | null;
  dayOfWeek: DayOfWeekEnum;
  periodNumber: number;
};

export type ValidationResult = { ok: true } | { ok: false; error: string };

/**
 * Rejects a class double-booked in a day/period, or a teacher double-booked
 * across two different classes/programs in the same day/period.
 * `excludeSlotId` lets an update check against every OTHER existing slot
 * without tripping over itself.
 */
export function validateSlot(input: NewSlotInput, existingSlots: ExistingSlot[], excludeSlotId?: string): ValidationResult {
  const sameSlot = existingSlots.filter(
    (s) => s.id !== excludeSlotId && s.dayOfWeek === input.dayOfWeek && s.periodNumber === input.periodNumber,
  );

  const classConflict = sameSlot.find((s) => s.classId === input.classId);
  if (classConflict) {
    return { ok: false, error: `This class already has a course scheduled on ${input.dayOfWeek} period ${input.periodNumber}.` };
  }

  if (input.teacherId) {
    const teacherConflict = sameSlot.find((s) => s.teacherId === input.teacherId);
    if (teacherConflict) {
      return { ok: false, error: `This teacher is already teaching another class on ${input.dayOfWeek} period ${input.periodNumber}.` };
    }
  }

  return { ok: true };
}
