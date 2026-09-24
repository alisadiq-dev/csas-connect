-- Fixes a real gap found during frontend verification: `student_profiles`
-- only had SELECT policies for "a student sees their own row" and "admin
-- sees every row" (0002_identity_rls.sql). No policy let a teacher see the
-- student_profiles rows for students in classes they teach — so any query
-- joining attendance_records/results to student_profiles for display (e.g.
-- to show a roster's name/roll number while correcting attendance or
-- marks) silently returned zero rows under RLS: the attendance_records/
-- results rows themselves were visible, but the INNER JOIN to
-- student_profiles filtered everything out. This is the same class of bug
-- as 0007's default-deny gap, just on a table joined-for-display rather
-- than a table queried directly.
--
-- Scope mirrors the existing "own course offering" pattern used by
-- attendance_records_teacher_select / results_teacher_select: a teacher can
-- see a student_profiles row only if that student's class has at least one
-- course_offering taught by that teacher.
CREATE POLICY student_profiles_teacher_select ON student_profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM course_offerings co
      WHERE co.class_id = student_profiles.class_id AND co.teacher_id = auth.uid()
    )
  );
