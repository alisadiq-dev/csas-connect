CREATE TABLE "admin_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "student_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"roll_number" text NOT NULL,
	"class_id" uuid NOT NULL,
	"is_class_rep" boolean DEFAULT false NOT NULL,
	CONSTRAINT "student_profiles_roll_number_unique" UNIQUE("roll_number")
);
--> statement-breakpoint
ALTER TABLE "student_profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "teacher_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "teacher_profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "admin_profiles" ADD CONSTRAINT "admin_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_profiles" ADD CONSTRAINT "teacher_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_offerings" ADD CONSTRAINT "course_offerings_teacher_id_teacher_profiles_user_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teacher_profiles"("user_id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- ============================================================================
-- Row-Level Security policies (SPEC-identity.md).
--
-- Hand-written, not drizzle-managed: they reference auth.uid() and the
-- `authenticated` role, which aren't part of the typed schema. Reviewed like
-- any other schema change, same as every other statement in this file.
--
-- Important Postgres gotcha (see README/tasks/plan.md): the role that owns
-- these tables (whoever ran this migration) bypasses RLS entirely,
-- regardless of policy. Policies only take effect for a role that has been
-- explicitly GRANTed access and is not the owner — the `authenticated` role,
-- which src/lib/db/with-user.ts switches to via `set local role
-- authenticated` before every student/teacher/CR-scoped query. Every table
-- below therefore gets both a GRANT and its policies; a table with policies
-- but no GRANT would just deny `authenticated` outright, and a table with a
-- GRANT but no policies would (with RLS enabled) also deny everything —
-- Postgres requires both.
-- ============================================================================

-- Reference data from `academic-structure`: not sensitive, so any
-- authenticated user can read it (matches the open-read/admin-write pattern
-- SPEC-timetable.md documents for the same kind of data). Admin writes go
-- through the raw `db` export (owner bypass), so no INSERT/UPDATE/DELETE
-- grant is needed here.
GRANT SELECT ON programs, batches, classes, courses, academic_terms, course_offerings TO authenticated;
--> statement-breakpoint

-- admin_profiles: an admin can see their own row. Created only via the raw
-- `db` export (seed / service-role-equivalent server actions), so no
-- INSERT/UPDATE grant for `authenticated` is needed.
GRANT SELECT ON admin_profiles TO authenticated;
--> statement-breakpoint
CREATE POLICY admin_profiles_select_own ON admin_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
--> statement-breakpoint

-- teacher_profiles: "a teacher can SELECT their own row; admin can
-- SELECT/INSERT/UPDATE all" (SPEC-identity.md). The admin check is a
-- self-referencing EXISTS against admin_profiles for the caller's own
-- auth.uid() — safe under RLS because it only ever needs to read the
-- caller's own admin_profiles row, which admin_profiles_select_own already
-- allows.
GRANT SELECT, INSERT, UPDATE ON teacher_profiles TO authenticated;
--> statement-breakpoint
CREATE POLICY teacher_profiles_select_own ON teacher_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
--> statement-breakpoint
CREATE POLICY teacher_profiles_admin_select ON teacher_profiles
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_profiles ap WHERE ap.user_id = auth.uid()));
--> statement-breakpoint
CREATE POLICY teacher_profiles_admin_insert ON teacher_profiles
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_profiles ap WHERE ap.user_id = auth.uid()));
--> statement-breakpoint
CREATE POLICY teacher_profiles_admin_update ON teacher_profiles
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_profiles ap WHERE ap.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_profiles ap WHERE ap.user_id = auth.uid()));
--> statement-breakpoint

-- student_profiles: "a student can SELECT only their own row
-- (user_id = auth.uid()). No student can query another student's row, by
-- roll number or otherwise." Admin gets the same full-access pattern as
-- teacher_profiles for consistency (not explicitly spelled out for this
-- table in the spec, but every other profile table gets it, and admin
-- writes here happen via the raw `db` export in practice — these policies
-- are defense-in-depth for the RLS layer itself, not the only path).
GRANT SELECT, INSERT, UPDATE ON student_profiles TO authenticated;
--> statement-breakpoint
CREATE POLICY student_profiles_select_own ON student_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
--> statement-breakpoint
CREATE POLICY student_profiles_admin_select ON student_profiles
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_profiles ap WHERE ap.user_id = auth.uid()));
--> statement-breakpoint
CREATE POLICY student_profiles_admin_insert ON student_profiles
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_profiles ap WHERE ap.user_id = auth.uid()));
--> statement-breakpoint
CREATE POLICY student_profiles_admin_update ON student_profiles
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_profiles ap WHERE ap.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_profiles ap WHERE ap.user_id = auth.uid()));