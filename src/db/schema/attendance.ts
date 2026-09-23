import { date, pgEnum, pgTable, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { authUsers } from "../schema-ref/auth.ts";
import { courseOfferings } from "./academic-structure.ts";
import { adminProfiles, studentProfiles } from "./identity.ts";

// See SPEC-attendance.md. Same RLS-ships-with-the-migration pattern as
// identity (db/migrations/0003_attendance.sql): `.enableRLS()` here makes
// drizzle-kit emit the ENABLE ROW LEVEL SECURITY statements; the CREATE
// POLICY / GRANT statements are hand-appended SQL in that migration file
// (they reference auth.uid() / the `authenticated` role, outside drizzle's
// typed schema).

export const attendanceStatusEnum = pgEnum("attendance_status", ["present", "absent", "leave"]);
export type AttendanceStatusEnum = (typeof attendanceStatusEnum.enumValues)[number];

export const attendanceSessions = pgTable(
  "attendance_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseOfferingId: uuid("course_offering_id")
      .notNull()
      .references(() => courseOfferings.id),
    sessionDate: date("session_date").notNull(),
    // Always an admin — enforced by RLS (only admin_profiles has an INSERT
    // policy on this table), not just this FK.
    createdBy: uuid("created_by")
      .notNull()
      .references(() => adminProfiles.userId),
  },
  (table) => [unique("attendance_sessions_offering_date_unique").on(table.courseOfferingId, table.sessionDate)],
).enableRLS();

export const attendanceRecords = pgTable(
  "attendance_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => attendanceSessions.id),
    studentUserId: uuid("student_user_id")
      .notNull()
      .references(() => studentProfiles.userId),
    status: attendanceStatusEnum("status").notNull(),
    // Audit: who last touched this record (admin or the assigned teacher).
    updatedBy: uuid("updated_by")
      .notNull()
      .references(() => authUsers.id),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique("attendance_records_session_student_unique").on(table.sessionId, table.studentUserId)],
).enableRLS();
