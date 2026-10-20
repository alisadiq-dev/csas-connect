import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { attendanceRecords } from "@/db/schema/attendance";
import { studentProfiles, teacherProfiles } from "@/db/schema/identity";
import { noticesEvents } from "@/db/schema/notices-events";

export type PublicStats = {
  students: number;
  teachers: number;
  /** Department-wide present / all records, same rounding as src/lib/attendance/percentage.ts. */
  attendanceRate: number | null;
  notices: number;
};

/**
 * Aggregate, non-identifying counts for the public landing page. Only totals leave this function — no
 * names, emails or per-student rows — so using the raw `db` (not withUserDb) is deliberate and safe.
 * Returns null if the database is unreachable so the page can fall back to labelled sample numbers.
 */
export async function getPublicStats(): Promise<PublicStats | null> {
  try {
    const [[students], [teachers], [notices], [records], [present]] = await Promise.all([
      db.select({ n: count() }).from(studentProfiles),
      db.select({ n: count() }).from(teacherProfiles),
      db.select({ n: count() }).from(noticesEvents),
      db.select({ n: count() }).from(attendanceRecords),
      db.select({ n: count() }).from(attendanceRecords).where(eq(attendanceRecords.status, "present")),
    ]);
    return {
      students: students.n,
      teachers: teachers.n,
      notices: notices.n,
      attendanceRate: records.n === 0 ? null : Math.round((present.n / records.n) * 100),
    };
  } catch {
    return null;
  }
}
