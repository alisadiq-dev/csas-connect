CREATE TYPE "public"."attendance_status" AS ENUM('present', 'absent', 'leave');--> statement-breakpoint
CREATE TABLE "attendance_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"student_user_id" uuid NOT NULL,
	"status" "attendance_status" NOT NULL,
	"updated_by" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attendance_records_session_student_unique" UNIQUE("session_id","student_user_id")
);
--> statement-breakpoint
ALTER TABLE "attendance_records" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "attendance_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_offering_id" uuid NOT NULL,
	"session_date" date NOT NULL,
	"created_by" uuid NOT NULL,
	CONSTRAINT "attendance_sessions_offering_date_unique" UNIQUE("course_offering_id","session_date")
);
--> statement-breakpoint
ALTER TABLE "attendance_sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_session_id_attendance_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."attendance_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_student_user_id_student_profiles_user_id_fk" FOREIGN KEY ("student_user_id") REFERENCES "public"."student_profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_course_offering_id_course_offerings_id_fk" FOREIGN KEY ("course_offering_id") REFERENCES "public"."course_offerings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_created_by_admin_profiles_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_profiles"("user_id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- ============================================================================
-- Row-Level Security policies (SPEC-attendance.md).
--
-- "Admin has full INSERT/UPDATE/SELECT. Teachers get UPDATE only on
-- attendance_records where the session's course_offering.teacher_id =
-- auth.uid() — no INSERT policy for teachers, matching 'teachers only
-- correct existing records.' Students get SELECT only where
-- student_user_id = auth.uid()." Same GRANT-plus-policy requirement as
-- 0002_identity_rls.sql: the migration-running role owns these tables and
-- bypasses RLS entirely, so `authenticated` (the role src/lib/db/with-user.ts
-- switches every student/teacher/CR-scoped query to) needs an explicit GRANT
-- in addition to the policies below, or the policies silently deny everything.
-- ============================================================================

GRANT SELECT, INSERT ON attendance_sessions TO authenticated;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON attendance_records TO authenticated;
--> statement-breakpoint

-- Both attendance_sessions and attendance_records have RLS-protected
-- policies that each need to look through the other table (a session's
-- policies need to know if the caller has a record in it; a record's
-- policies need to know its session's course_offering_id). Written as
-- direct subqueries against the RLS-protected table, this is circular:
-- evaluating one table's policy invokes the other table's policy, which
-- invokes the first again ("infinite recursion detected in policy").
-- Standard fix: a SECURITY DEFINER helper function that reads
-- attendance_sessions as the function's OWNER (whoever runs this
-- migration) — the table owner bypasses RLS entirely on their own tables
-- (same fact noted at the top of this file and in 0002_identity_rls.sql),
-- so calling this function never re-enters attendance_sessions' policies.
CREATE FUNCTION attendance_session_offering_id(p_session_id uuid) RETURNS uuid
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = public
  AS $$ SELECT course_offering_id FROM attendance_sessions WHERE id = p_session_id $$;
--> statement-breakpoint

-- attendance_sessions: admin full access.
CREATE POLICY attendance_sessions_admin_select ON attendance_sessions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_profiles ap WHERE ap.user_id = auth.uid()));
--> statement-breakpoint
CREATE POLICY attendance_sessions_admin_insert ON attendance_sessions
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_profiles ap WHERE ap.user_id = auth.uid()));
--> statement-breakpoint

-- attendance_sessions: the assigned teacher can see sessions for their own
-- course offerings (needed to list sessions to correct — no write policy,
-- teachers never create/modify a session itself).
CREATE POLICY attendance_sessions_teacher_select ON attendance_sessions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM course_offerings co
      WHERE co.id = attendance_sessions.course_offering_id AND co.teacher_id = auth.uid()
    )
  );
--> statement-breakpoint

-- attendance_sessions: a student can see a session only if they have a
-- record in it (i.e. they're enrolled in that offering) — mirrors
-- attendance_records' own student-scoping below rather than duplicating an
-- enrollment concept this module doesn't otherwise model.
CREATE POLICY attendance_sessions_student_select ON attendance_sessions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM attendance_records ar
      WHERE ar.session_id = attendance_sessions.id AND ar.student_user_id = auth.uid()
    )
  );
--> statement-breakpoint

-- attendance_records: admin full access.
CREATE POLICY attendance_records_admin_select ON attendance_records
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_profiles ap WHERE ap.user_id = auth.uid()));
--> statement-breakpoint
CREATE POLICY attendance_records_admin_insert ON attendance_records
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_profiles ap WHERE ap.user_id = auth.uid()));
--> statement-breakpoint
CREATE POLICY attendance_records_admin_update ON attendance_records
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_profiles ap WHERE ap.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_profiles ap WHERE ap.user_id = auth.uid()));
--> statement-breakpoint

-- attendance_records: the assigned teacher can SELECT (to see the whole
-- session's roster when correcting) and UPDATE (correct a status) records
-- for their own course offerings only — deliberately NO INSERT policy here,
-- the literal enforcement of "teachers only correct existing records."
CREATE POLICY attendance_records_teacher_select ON attendance_records
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM course_offerings co
      WHERE co.id = attendance_session_offering_id(attendance_records.session_id) AND co.teacher_id = auth.uid()
    )
  );
--> statement-breakpoint
CREATE POLICY attendance_records_teacher_update ON attendance_records
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM course_offerings co
      WHERE co.id = attendance_session_offering_id(attendance_records.session_id) AND co.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM course_offerings co
      WHERE co.id = attendance_session_offering_id(attendance_records.session_id) AND co.teacher_id = auth.uid()
    )
  );
--> statement-breakpoint

-- attendance_records: a student sees only their own records.
CREATE POLICY attendance_records_student_select ON attendance_records
  FOR SELECT TO authenticated
  USING (student_user_id = auth.uid());