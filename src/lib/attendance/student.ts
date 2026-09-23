import { desc, eq } from "drizzle-orm";
import { courseOfferings, courses } from "@/db/schema/academic-structure";
import { attendanceRecords, attendanceSessions } from "@/db/schema/attendance";
import { withUserDb } from "@/lib/db/with-user";

/** Own-data-only via RLS (attendance_records_student_select) — see SPEC-attendance.md. */
export async function listAttendanceForStudent(studentUserId: string) {
  return withUserDb(studentUserId, (tx) =>
    tx
      .select({
        recordId: attendanceRecords.id,
        status: attendanceRecords.status,
        sessionDate: attendanceSessions.sessionDate,
        courseOfferingId: attendanceSessions.courseOfferingId,
        courseCode: courses.code,
        courseTitle: courses.title,
      })
      .from(attendanceRecords)
      .innerJoin(attendanceSessions, eq(attendanceRecords.sessionId, attendanceSessions.id))
      .innerJoin(courseOfferings, eq(attendanceSessions.courseOfferingId, courseOfferings.id))
      .innerJoin(courses, eq(courseOfferings.courseId, courses.id))
      .where(eq(attendanceRecords.studentUserId, studentUserId))
      .orderBy(desc(attendanceSessions.sessionDate)),
  );
}
