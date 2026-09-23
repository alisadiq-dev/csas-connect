import type { DayOfWeekEnum } from "@/db/schema/timetable";

// See SPEC-timetable.md.

const DAY_ORDER: DayOfWeekEnum[] = ["mon", "tue", "wed", "thu", "fri", "sat"];

export type TimetableSlotWithTime = {
  dayOfWeek: DayOfWeekEnum;
  periodNumber: number;
  startTime: string; // "HH:MM" or "HH:MM:SS", lexically comparable
  courseOfferingId: string;
  room: string | null;
};

function jsDayToDayOfWeek(jsDay: number): DayOfWeekEnum | null {
  // Date.getDay(): 0 = Sunday, 1 = Monday, ... 6 = Saturday. No Sunday
  // teaching day exists in this department's schedule.
  const map: (DayOfWeekEnum | null)[] = [null, "mon", "tue", "wed", "thu", "fri", "sat"];
  return map[jsDay];
}

function timeOf(now: Date): string {
  return now.toTimeString().slice(0, 8); // "HH:MM:SS"
}

function earliestOn(slots: TimetableSlotWithTime[], day: DayOfWeekEnum): TimetableSlotWithTime | null {
  const onDay = slots.filter((s) => s.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
  return onDay[0] ?? null;
}

/**
 * Given `now`, finds the next upcoming slot for a teacher or a class:
 * later today if one remains, otherwise the earliest slot on the next
 * teaching day with any slots (searching forward through the rest of THIS
 * week only — Monday-Saturday — not wrapping into next week), or `null` if
 * none remain this week.
 */
export function findNextLecture(slots: TimetableSlotWithTime[], now: Date): TimetableSlotWithTime | null {
  const currentDay = jsDayToDayOfWeek(now.getDay());
  const nowTime = timeOf(now);

  if (currentDay) {
    const laterToday = slots
      .filter((s) => s.dayOfWeek === currentDay && s.startTime > nowTime)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    if (laterToday[0]) return laterToday[0];
  }

  const startIndex = currentDay ? DAY_ORDER.indexOf(currentDay) : -1;
  for (let idx = startIndex + 1; idx < DAY_ORDER.length; idx++) {
    const found = earliestOn(slots, DAY_ORDER[idx]);
    if (found) return found;
  }

  return null;
}
