import type { DayOfWeekEnum } from "@/db/schema/timetable";
import { jsDayToDayOfWeek } from "./next-lecture";

export type ScheduleStatus = "completed" | "ongoing" | "upcoming";

export type WithSchedule<T> = T & { startTime: string; endTime: string; status: ScheduleStatus };

/** Today's slots (by JS weekday), in period order, each tagged with its real completed/ongoing/upcoming status vs `now`. */
export function buildTodaySchedule<T extends { dayOfWeek: DayOfWeekEnum; periodNumber: number }>(
  slots: T[],
  periods: { periodNumber: number; startTime: string; endTime: string }[],
  now: Date,
): WithSchedule<T>[] {
  const today = jsDayToDayOfWeek(now.getDay());
  if (!today) return [];

  const periodByNumber = new Map(periods.map((p) => [p.periodNumber, p]));
  const nowTime = now.toTimeString().slice(0, 8);

  return slots
    .filter((s) => s.dayOfWeek === today && periodByNumber.has(s.periodNumber))
    .map((s) => {
      const period = periodByNumber.get(s.periodNumber)!;
      const status: ScheduleStatus = nowTime < period.startTime ? "upcoming" : nowTime > period.endTime ? "completed" : "ongoing";
      return { ...s, startTime: period.startTime, endTime: period.endTime, status };
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}
