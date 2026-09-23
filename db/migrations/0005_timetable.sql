CREATE TYPE "public"."day_of_week" AS ENUM('mon', 'tue', 'wed', 'thu', 'fri', 'sat');--> statement-breakpoint
CREATE TABLE "period_definitions" (
	"period_number" integer PRIMARY KEY NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL
);
--> statement-breakpoint
ALTER TABLE "period_definitions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "timetable_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_offering_id" uuid NOT NULL,
	"day_of_week" "day_of_week" NOT NULL,
	"period_number" integer NOT NULL,
	"room" text,
	CONSTRAINT "timetable_slots_offering_day_period_unique" UNIQUE("course_offering_id","day_of_week","period_number")
);
--> statement-breakpoint
ALTER TABLE "timetable_slots" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_course_offering_id_course_offerings_id_fk" FOREIGN KEY ("course_offering_id") REFERENCES "public"."course_offerings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_period_number_period_definitions_period_number_fk" FOREIGN KEY ("period_number") REFERENCES "public"."period_definitions"("period_number") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- Seeds the department's 7 fixed period times. Real start/end times aren't
-- known yet (SPEC-timetable.md Open Questions) — placeholders: 8:00 AM
-- start, 50-minute periods, back-to-back, through 7 periods (ends 1:50 PM).
INSERT INTO period_definitions (period_number, start_time, end_time) VALUES
  (1, '08:00', '08:50'),
  (2, '08:50', '09:40'),
  (3, '09:40', '10:30'),
  (4, '10:30', '11:20'),
  (5, '11:20', '12:10'),
  (6, '12:10', '13:00'),
  (7, '13:00', '13:50');
--> statement-breakpoint

-- ============================================================================
-- Row-Level Security policies (SPEC-timetable.md).
--
-- "Unlike attendance/results, a timetable isn't private academic data...
-- Policy: any authenticated user (SELECT) can read timetable_slots/
-- period_definitions; only admin has INSERT/UPDATE/DELETE." Same
-- GRANT-plus-policy requirement as every other module: the migration-running
-- role owns these tables and bypasses RLS, so `authenticated` needs an
-- explicit GRANT in addition to the policies below.
-- ============================================================================

GRANT SELECT ON period_definitions, timetable_slots TO authenticated;
GRANT INSERT, UPDATE, DELETE ON timetable_slots TO authenticated;
--> statement-breakpoint

CREATE POLICY period_definitions_select_all ON period_definitions
  FOR SELECT TO authenticated
  USING (true);
--> statement-breakpoint

CREATE POLICY timetable_slots_select_all ON timetable_slots
  FOR SELECT TO authenticated
  USING (true);
--> statement-breakpoint
CREATE POLICY timetable_slots_admin_insert ON timetable_slots
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_profiles ap WHERE ap.user_id = auth.uid()));
--> statement-breakpoint
CREATE POLICY timetable_slots_admin_update ON timetable_slots
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_profiles ap WHERE ap.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_profiles ap WHERE ap.user_id = auth.uid()));
--> statement-breakpoint
CREATE POLICY timetable_slots_admin_delete ON timetable_slots
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_profiles ap WHERE ap.user_id = auth.uid()));