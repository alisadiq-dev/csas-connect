-- Fix: 0002/0004 granted SELECT on these reference/catalog tables to
-- `authenticated` but never explicitly enabled RLS on them, relying on RLS
-- staying off by default. That's true on a vanilla local Postgres, but
-- Supabase auto-enables RLS on new tables in `public` as a platform-level
-- default — which silently turns those grants into default-deny (RLS
-- enabled with zero policies = no access for any non-owner role), breaking
-- every student/teacher read path that joins through course_offerings/
-- courses under the `authenticated` role (e.g. src/lib/results/student.ts).
-- Discovered by directly comparing RLS status between local and the real
-- Supabase project after first deploying migrations there.
--
-- Fix: make RLS explicit and add an open-read policy, matching the working
-- pattern already used for period_definitions/timetable_slots (0005). These
-- tables are non-sensitive catalog data — every authenticated user may read
-- all rows; only admin writes them, via the service-role/owner connection
-- (src/db/index.ts's `db`), which bypasses RLS by ownership regardless of
-- these policies, so no INSERT/UPDATE/DELETE policy is needed here.

ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE grading_scale ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

CREATE POLICY programs_select_all ON programs FOR SELECT TO authenticated USING (true);
--> statement-breakpoint
CREATE POLICY batches_select_all ON batches FOR SELECT TO authenticated USING (true);
--> statement-breakpoint
CREATE POLICY classes_select_all ON classes FOR SELECT TO authenticated USING (true);
--> statement-breakpoint
CREATE POLICY courses_select_all ON courses FOR SELECT TO authenticated USING (true);
--> statement-breakpoint
CREATE POLICY academic_terms_select_all ON academic_terms FOR SELECT TO authenticated USING (true);
--> statement-breakpoint
CREATE POLICY course_offerings_select_all ON course_offerings FOR SELECT TO authenticated USING (true);
--> statement-breakpoint
CREATE POLICY grading_scale_select_all ON grading_scale FOR SELECT TO authenticated USING (true);
