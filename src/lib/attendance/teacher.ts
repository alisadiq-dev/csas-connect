import { asc, desc, eq } from "drizzle-orm";
import { courseOfferings, courses } from "@/db/schema/academic-structure";
import { attendanceRecords, attendanceSessions, type AttendanceStatusEnum } from "@/db/schema/attendance";
import { studentProfiles } from "@/db/schema/identity";
import { withUserDb } from "@/lib/db/with-user";

// Teacher-scoped: every query goes through withUserDb (RLS-enforced), never
// the raw `db` export — a teacher only ever sees/edits sessions and records
// for their own course offerings because attendance_sessions_teacher_select
// / attendance_records_teacher_select / attendance_records_teacher_update
// (db/migrations/0003_attendance.sql) say so, not because this code filters
// by teacherUserId itself.

export async function listSessionsForTeacher(teacherUserId: string) {
  return withUserDb(teacherUserId, (tx) =>
    tx
      .select({
        id: attendanceSessions.id,
        sessionDate: attendanceSessions.sessionDate,
        courseOfferingId: attendanceSessions.courseOfferingId,
        courseCode: courses.code,
        courseTitle: courses.title,
      })
      .from(attendanceSessions)
      .innerJoin(courseOfferings, eq(attendanceSessions.courseOfferingId, courseOfferings.id))
      .innerJoin(courses, eq(courseOfferings.courseId, courses.id))
      .orderBy(desc(attendanceSessions.sessionDate)),
  );
}

export async function listSessionRecordsForTeacher(teacherUserId: string, sessionId: string) {
  return withUserDb(teacherUserId, (tx) =>
    tx
      .select({
        id: attendanceRecords.id,
        studentUserId: attendanceRecords.studentUserId,
        status: attendanceRecords.status,
        fullName: studentProfiles.fullName,
        rollNumber: studentProfiles.rollNumber,
      })
      .from(attendanceRecords)
      .innerJoin(studentProfiles, eq(attendanceRecords.studentUserId, studentProfiles.userId))
      .where(eq(attendanceRecords.sessionId, sessionId))
      .orderBy(asc(studentProfiles.rollNumber)),
  );
}

/** Corrects one student's status on an EXISTING record — no create path exists here (SPEC-attendance.md). */
export async function correctAttendanceRecord(teacherUserId: string, recordId: string, status: AttendanceStatusEnum) {
  return withUserDb(teacherUserId, (tx) =>
    tx
      .update(attendanceRecords)
      .set({ status, updatedBy: teacherUserId, updatedAt: new Date() })
      .where(eq(attendanceRecords.id, recordId))
      .returning(),
  );
}
