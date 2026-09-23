CREATE TYPE "public"."audience_scope" AS ENUM('department', 'program', 'class');--> statement-breakpoint
CREATE TABLE "notice_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"notice_id" uuid NOT NULL,
	"file_url" text NOT NULL,
	"file_name" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notice_attachments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "notices_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"category" text NOT NULL,
	"audience_scope" "audience_scope" NOT NULL,
	"program_id" uuid,
	"class_id" uuid,
	"semester_label" text,
	"event_start_at" timestamp with time zone,
	"event_end_at" timestamp with time zone,
	"location" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notices_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "notice_attachments" ADD CONSTRAINT "notice_attachments_notice_id_notices_events_id_fk" FOREIGN KEY ("notice_id") REFERENCES "public"."notices_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notices_events" ADD CONSTRAINT "notices_events_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notices_events" ADD CONSTRAINT "notices_events_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notices_events" ADD CONSTRAINT "notices_events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- ============================================================================
-- Row-Level Security policies (SPEC-notices-events.md).
--
-- "Admin: full INSERT/UPDATE/DELETE/SELECT. CR: INSERT/UPDATE/DELETE only
-- where audience_scope='class' and class_id = their own class. Everyone:
-- SELECT per the visibility rule. Teachers: read-only in this module (no
-- creation rights)." Same GRANT-plus-policy requirement as every other
-- module's migration.
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON notices_events, notice_attachments TO authenticated;
--> statement-breakpoint

-- Visibility rule, all in one SELECT policy (mirrors src/lib/notices/visibility.ts,
-- which is unit-tested against the same three scopes so the RLS policy and
-- the app-layer rule can't drift silently):
--   department -> everyone
--   program    -> the viewer's own program (student's class -> batch ->
--                 program, OR teacher's any assigned course offering's
--                 program) matches program_id
--   class      -> students/CR in that class, OR any teacher currently
--                 assigned a course offering for that class
-- admin sees everything regardless of scope.
CREATE POLICY notices_events_select_visible ON notices_events
  FOR SELECT TO authenticated
  USING (
    audience_scope = 'department'
    OR EXISTS (SELECT 1 FROM admin_profiles ap WHERE ap.user_id = auth.uid())
    OR (
      audience_scope = 'program' AND EXISTS (
        SELECT 1 FROM student_profiles sp
        JOIN classes c ON c.id = sp.class_id
        JOIN batches b ON b.id = c.batch_id
        WHERE sp.user_id = auth.uid() AND b.program_id = notices_events.program_id
      )
    )
    OR (
      audience_scope = 'program' AND EXISTS (
        SELECT 1 FROM course_offerings co
        JOIN classes c ON c.id = co.class_id
        JOIN batches b ON b.id = c.batch_id
        WHERE co.teacher_id = auth.uid() AND b.program_id = notices_events.program_id
      )
    )
    OR (
      audience_scope = 'class' AND EXISTS (
        SELECT 1 FROM student_profiles sp WHERE sp.user_id = auth.uid() AND sp.class_id = notices_events.class_id
      )
    )
    OR (
      audience_scope = 'class' AND EXISTS (
        SELECT 1 FROM course_offerings co WHERE co.teacher_id = auth.uid() AND co.class_id = notices_events.class_id
      )
    )
  );
--> statement-breakpoint

CREATE POLICY notices_events_admin_insert ON notices_events
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_profiles ap WHERE ap.user_id = auth.uid()));
--> statement-breakpoint
CREATE POLICY notices_events_admin_update ON notices_events
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_profiles ap WHERE ap.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_profiles ap WHERE ap.user_id = auth.uid()));
--> statement-breakpoint
CREATE POLICY notices_events_admin_delete ON notices_events
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_profiles ap WHERE ap.user_id = auth.uid()));
--> statement-breakpoint

-- CR: only class-scoped, only their own class. "Even via direct API call"
-- (SPEC-notices-events.md Boundaries) — this is the actual enforcement, not
-- the CR UI hiding other options.
CREATE POLICY notices_events_cr_insert ON notices_events
  FOR INSERT TO authenticated
  WITH CHECK (
    audience_scope = 'class'
    AND EXISTS (
      SELECT 1 FROM student_profiles sp
      WHERE sp.user_id = auth.uid() AND sp.is_class_rep = true AND sp.class_id = notices_events.class_id
    )
  );
--> statement-breakpoint
CREATE POLICY notices_events_cr_update ON notices_events
  FOR UPDATE TO authenticated
  USING (
    audience_scope = 'class'
    AND EXISTS (
      SELECT 1 FROM student_profiles sp
      WHERE sp.user_id = auth.uid() AND sp.is_class_rep = true AND sp.class_id = notices_events.class_id
    )
  )
  WITH CHECK (
    audience_scope = 'class'
    AND EXISTS (
      SELECT 1 FROM student_profiles sp
      WHERE sp.user_id = auth.uid() AND sp.is_class_rep = true AND sp.class_id = notices_events.class_id
    )
  );
--> statement-breakpoint
CREATE POLICY notices_events_cr_delete ON notices_events
  FOR DELETE TO authenticated
  USING (
    audience_scope = 'class'
    AND EXISTS (
      SELECT 1 FROM student_profiles sp
      WHERE sp.user_id = auth.uid() AND sp.is_class_rep = true AND sp.class_id = notices_events.class_id
    )
  );
--> statement-breakpoint

-- notice_attachments: visible whenever its parent notice is visible
-- (re-evaluates notices_events_select_visible via the join — no recursion,
-- since that policy never references notice_attachments back).
CREATE POLICY notice_attachments_select_visible ON notice_attachments
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM notices_events ne WHERE ne.id = notice_attachments.notice_id));
--> statement-breakpoint

CREATE POLICY notice_attachments_admin_insert ON notice_attachments
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_profiles ap WHERE ap.user_id = auth.uid()));
--> statement-breakpoint
CREATE POLICY notice_attachments_admin_delete ON notice_attachments
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_profiles ap WHERE ap.user_id = auth.uid()));
--> statement-breakpoint

-- CR: can attach a PDF only to a notice they're themselves allowed to
-- create/manage (own-class-scoped).
CREATE POLICY notice_attachments_cr_insert ON notice_attachments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM notices_events ne
      JOIN student_profiles sp ON sp.user_id = auth.uid() AND sp.is_class_rep = true AND sp.class_id = ne.class_id
      WHERE ne.id = notice_attachments.notice_id AND ne.audience_scope = 'class'
    )
  );
--> statement-breakpoint
CREATE POLICY notice_attachments_cr_delete ON notice_attachments
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM notices_events ne
      JOIN student_profiles sp ON sp.user_id = auth.uid() AND sp.is_class_rep = true AND sp.class_id = ne.class_id
      WHERE ne.id = notice_attachments.notice_id AND ne.audience_scope = 'class'
    )
  );