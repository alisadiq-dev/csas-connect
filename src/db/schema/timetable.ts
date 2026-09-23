import { integer, pgEnum, pgTable, text, time, unique, uuid } from "drizzle-orm/pg-core";
import { courseOfferings } from "./academic-structure.ts";

// See SPEC-timetable.md. Unlike attendance/results, a timetable isn't
// private academic data — RLS here is open-read for any authenticated user,
// admin-only write (db/migrations/0005_timetable.sql), not the
// admin/teacher/student-scoped pattern those two modules use.

export const dayOfWeekEnum = pgEnum("day_of_week", ["mon", "tue", "wed", "thu", "fri", "sat"]);
export type DayOfWeekEnum = (typeof dayOfWeekEnum.enumValues)[number];

export const periodDefinitions = pgTable("period_definitions", {
  periodNumber: integer("period_number").primaryKey(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
}).enableRLS();

export const timetableSlots = pgTable(
  "timetable_slots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseOfferingId: uuid("course_offering_id")
      .notNull()
      .references(() => courseOfferings.id),
    dayOfWeek: dayOfWeekEnum("day_of_week").notNull(),
    periodNumber: integer("period_number")
      .notNull()
      .references(() => periodDefinitions.periodNumber),
    // "where available," per the original requirement — nullable, not required.
    room: text("room"),
  },
  (table) => [
    unique("timetable_slots_offering_day_period_unique").on(table.courseOfferingId, table.dayOfWeek, table.periodNumber),
  ],
).enableRLS();
