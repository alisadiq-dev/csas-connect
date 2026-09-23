import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { attendanceRecords, attendanceSessions, type AttendanceStatusEnum } from "@/db/schema/attendance";
import { studentProfiles } from "@/db/schema/identity";

// Admin-only: uses the raw `db` export (owner bypass), matching the same
// rationale as src/lib/identity/students.ts's createStudent — there's no
// per-request user identity to scope this to beyond "the caller already
// passed requireRole('admin')".

export async function createAttendanceSession(input: {
  courseOfferingId: string;
  sessionDate: string;
  createdBy: string;
  statuses: { studentUserId: string; status: AttendanceStatusEnum }[];
}) {
  return db.transaction(async (tx) => {
    const [session] = await tx
      .insert(attendanceSessions)
      .values({
        courseOfferingId: input.courseOfferingId,
        sessionDate: input.sessionDate,
        createdBy: input.createdBy,
      })
      .returning();

    if (input.statuses.length > 0) {
      await tx.insert(attendanceRecords).values(
        input.statuses.map((s) => ({
          sessionId: session.id,
          studentUserId: s.studentUserId,
          status: s.status,
          updatedBy: input.createdBy,
        })),
      );
    }
    return session;
  });
}

export async function listSessionsForOffering(courseOfferingId: string) {
  return db
    .select()
    .from(attendanceSessions)
    .where(eq(attendanceSessions.courseOfferingId, courseOfferingId))
    .orderBy(desc(attendanceSessions.sessionDate));
}

export async function listRecordsForSession(sessionId: string) {
  return db
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
    .orderBy(asc(studentProfiles.rollNumber));
}
