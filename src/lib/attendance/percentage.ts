// See SPEC-attendance.md. Attendance percentage is computed, not stored —
// avoids a cached value drifting from the underlying records.
//
// "Leave" counts the same as "absent" toward the denominator, per the
// SPEC-attendance.md Boundaries note (Section 9.4 of the confirmed PU
// document: the 25% absence allowance is "inclusive of absents ... or leave
// ... " — both count the same way toward the threshold).

export type AttendanceStatus = "present" | "absent" | "leave";

export function attendancePercentage(records: { status: AttendanceStatus }[]): number {
  if (records.length === 0) return 0;
  const present = records.filter((r) => r.status === "present").length;
  return Math.round((present / records.length) * 100);
}
