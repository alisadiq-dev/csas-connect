import { integer, numeric, pgEnum, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { authUsers } from "../schema-ref/auth.ts";
import { courseOfferings } from "./academic-structure.ts";
import { studentProfiles } from "./identity.ts";

// See SPEC-results.md. grading_scale is reference/config data (like
// academic-structure's programs/courses/etc.) — not sensitive, so it
// deliberately does NOT get .enableRLS(): any authenticated user can read
// it via a plain GRANT (db/migrations/0004_results.sql), matching the
// pattern already established for programs/batches/classes/courses.

export const gradingScale = pgTable("grading_scale", {
  id: uuid("id").primaryKey().defaultRandom(),
  minPercent: integer("min_percent").notNull(),
  maxPercent: integer("max_percent").notNull(),
  letterGrade: text("letter_grade").notNull(),
  gradePoints: numeric("grade_points", { precision: 3, scale: 2 }).notNull(),
});

export const specialStatusEnum = pgEnum("special_status", ["W", "FW", "I"]);
export type SpecialStatusEnum = (typeof specialStatusEnum.enumValues)[number];

export const results = pgTable(
  "results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseOfferingId: uuid("course_offering_id")
      .notNull()
      .references(() => courseOfferings.id),
    studentUserId: uuid("student_user_id")
      .notNull()
      .references(() => studentProfiles.userId),
    // Nullable — deviates from SPEC-results.md's literal (non-null) column
    // listing: a result with special_status set (W/FW/I) legitimately has
    // no marks at all ("admin enters sessional/mid/final marks (or a
    // special status)" per the spec's Boundaries), so marks can't be
    // NOT NULL. Each is recorded on its own weighted scale (sessional out
    // of 25, mid term out of 35, final term out of 40) per the confirmed PU
    // document's own worked example (Section 11, item 6) — total_marks is
    // their direct sum, not a further percentage multiplication.
    sessionalMarks: numeric("sessional_marks", { precision: 5, scale: 2 }),
    midTermMarks: numeric("mid_term_marks", { precision: 5, scale: 2 }),
    finalTermMarks: numeric("final_term_marks", { precision: 5, scale: 2 }),
    totalMarks: numeric("total_marks", { precision: 5, scale: 2 }),
    letterGrade: text("letter_grade"),
    gradePoints: numeric("grade_points", { precision: 3, scale: 2 }),
    specialStatus: specialStatusEnum("special_status"),
    updatedBy: uuid("updated_by")
      .notNull()
      .references(() => authUsers.id),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique("results_offering_student_unique").on(table.courseOfferingId, table.studentUserId)],
).enableRLS();
