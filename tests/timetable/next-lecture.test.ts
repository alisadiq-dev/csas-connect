import { describe, expect, it } from "vitest";
import { findNextLecture, type TimetableSlotWithTime } from "@/lib/timetable/next-lecture";
import type { DayOfWeekEnum } from "@/db/schema/timetable";

const DAY_ORDER: DayOfWeekEnum[] = ["mon", "tue", "wed", "thu", "fri", "sat"];

/** Finds the nearest date (on or after a fixed anchor) whose JS getDay() matches `jsDow`, at a given hour/minute — avoids hardcoding a real calendar date's weekday. */
function dateForJsDow(jsDow: number, hour: number, minute: number): Date {
  const d = new Date(2026, 0, 1, hour, minute, 0); // 2026-01-01, arbitrary anchor
  while (d.getDay() !== jsDow) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

function slot(dayOfWeek: DayOfWeekEnum, periodNumber: number, startTime: string): TimetableSlotWithTime {
  return { dayOfWeek, periodNumber, startTime, courseOfferingId: `offering-${dayOfWeek}-${periodNumber}`, room: null };
}

describe("findNextLecture (Task 32)", () => {
  it("finds a later slot today", () => {
    // Wednesday (jsDow=3), now = 09:00.
    const now = dateForJsDow(3, 9, 0);
    const slots = [slot("wed", 1, "08:00:00"), slot("wed", 3, "10:00:00"), slot("wed", 5, "12:00:00")];
    const next = findNextLecture(slots, now);
    expect(next?.periodNumber).toBe(3);
  });

  it("falls through to the next teaching day when none remain today", () => {
    // Wednesday, now = 15:00 (after every slot today); next slot is Thursday.
    const now = dateForJsDow(3, 15, 0);
    const slots = [slot("wed", 1, "08:00:00"), slot("thu", 2, "08:50:00"), slot("fri", 4, "10:30:00")];
    const next = findNextLecture(slots, now);
    expect(next?.dayOfWeek).toBe("thu");
    expect(next?.periodNumber).toBe(2);
  });

  it("skips a teaching day with no slots and finds the next one that has one", () => {
    // Wednesday, now = 15:00; Thursday has nothing, Friday does.
    const now = dateForJsDow(3, 15, 0);
    const slots = [slot("wed", 1, "08:00:00"), slot("fri", 4, "10:30:00")];
    const next = findNextLecture(slots, now);
    expect(next?.dayOfWeek).toBe("fri");
  });

  it("returns null when none remain this week (Saturday, after the last slot, no wrap to next week)", () => {
    // Saturday (jsDow=6), now = 15:00, no slots later today or on any day after Saturday this week.
    const now = dateForJsDow(6, 15, 0);
    const slots = [slot("sat", 1, "08:00:00"), slot("mon", 1, "08:00:00")];
    const next = findNextLecture(slots, now);
    expect(next).toBeNull();
  });

  it("on a non-teaching day (Sunday), finds the earliest slot of the coming week", () => {
    const now = dateForJsDow(0, 9, 0); // Sunday
    const slots = [slot("tue", 1, "08:00:00"), slot("mon", 2, "08:50:00")];
    const next = findNextLecture(slots, now);
    expect(next?.dayOfWeek).toBe("mon");
  });

  it("returns the earliest slot on a day when multiple exist", () => {
    const now = dateForJsDow(3, 15, 0);
    const slots = [slot("thu", 5, "12:10:00"), slot("thu", 1, "08:00:00")];
    const next = findNextLecture(slots, now);
    expect(next?.periodNumber).toBe(1);
  });

  it("DAY_ORDER sanity: every day is represented", () => {
    expect(DAY_ORDER).toHaveLength(6);
  });
});
