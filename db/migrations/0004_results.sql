CREATE TYPE "public"."special_status" AS ENUM('W', 'FW', 'I');--> statement-breakpoint
CREATE TABLE "grading_scale" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"min_percent" integer NOT NULL,
	"max_percent" integer NOT NULL,
	"letter_grade" text NOT NULL,
	"grade_points" numeric(3, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_offering_id" uuid NOT NULL,
	"student_user_id" uuid NOT NULL,
	"sessional_marks" numeric(5, 2),
	"mid_term_marks" numeric(5, 2),
	"final_term_marks" numeric(5, 2),
	"total_marks" numeric(5, 2),
	"letter_grade" text,
	"grade_points" numeric(3, 2),
	"special_status" "special_status",
	"updated_by" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "results_offering_student_unique" UNIQUE("course_offering_id","student_user_id")
);
--> statement-breakpoint
ALTER TABLE "results" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_course_offering_id_course_offerings_id_fk" FOREIGN KEY ("course_offering_id") REFERENCES "public"."course_offerings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_student_user_id_student_profiles_user_id_fk" FOREIGN KEY ("student_user_id") REFERENCES "public"."student_profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- ============================================================================
-- grading_scale: config/reference data, same pattern as academic-structure's
-- programs/batches/classes/courses/academic_terms/course_offerings
-- (0002_identity_rls.sql) — no RLS enabled (not sensitive), a plain GRANT
-- SELECT is enough for `authenticated` to read it. Writes go through the raw
-- `db` export (owner bypass) in the seed script below and any future
-- admin-only server action, matching how those reference tables are written.
-- ============================================================================

GRANT SELECT ON grading_scale TO authenticated;
--> statement-breakpoint

-- Seeded here (in the migration, not a separate seed script) per Task 24's
-- acceptance criteria: "seed grading_scale from the confirmed PU table as
-- part of this task's migration." Source: University of the Punjab,
-- "Semester Rules and Regulations for Undergraduate Studies" w.e.f. Fall
-- 2023, Section 11 (see SPEC-results.md for full provenance).
INSERT INTO grading_scale (min_percent, max_percent, letter_grade, grade_points) VALUES
  (85, 100, 'A', 4.00),
  (80, 84, 'A-', 3.70),
  (75, 79, 'B+', 3.30),
  (70, 74, 'B', 3.00),
  (65, 69, 'B-', 2.70),
  (61, 64, 'C+', 2.30),
  (58, 60, 'C', 2.00),
  (55, 57, 'C-', 1.70),
  (50, 54, 'D', 1.00),
  (0, 49, 'F', 0.00);
--> statement-breakpoint

-- ============================================================================
-- Row-Level Security policies for `results` (SPEC-results.md).
--
-- "RLS matches the `attendance` pattern (admin full, teacher update-own-only,
-- student select-own-only)." Unlike attendance_records, results has a direct
-- course_offering_id FK (no intermediate "session" table), and
-- course_offerings itself has no RLS enabled, so there's no policy-recursion
-- risk here — the SECURITY DEFINER workaround in 0003_attendance.sql isn't
-- needed.
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON results TO authenticated;
--> statement-breakpoint

CREATE POLICY results_admin_select ON results
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_profiles ap WHERE ap.user_id = auth.uid()));
--> statement-breakpoint
CREATE POLICY results_admin_insert ON results
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_profiles ap WHERE ap.user_id = auth.uid()));
--> statement-breakpoint
CREATE POLICY results_admin_update ON results
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_profiles ap WHERE ap.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_profiles ap WHERE ap.user_id = auth.uid()));
--> statement-breakpoint

-- The assigned teacher: SELECT (to see the whole roster when correcting)
-- and UPDATE (correct a result) for their own course offerings only —
-- deliberately NO INSERT policy, the literal enforcement of "teachers only
-- correct existing results."
CREATE POLICY results_teacher_select ON results
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM course_offerings co
      WHERE co.id = results.course_offering_id AND co.teacher_id = auth.uid()
    )
  );
--> statement-breakpoint
CREATE POLICY results_teacher_update ON results
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM course_offerings co
      WHERE co.id = results.course_offering_id AND co.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM course_offerings co
      WHERE co.id = results.course_offering_id AND co.teacher_id = auth.uid()
    )
  );
--> statement-breakpoint

-- A student sees only their own results.
CREATE POLICY results_student_select ON results
  FOR SELECT TO authenticated
  USING (student_user_id = auth.uid());