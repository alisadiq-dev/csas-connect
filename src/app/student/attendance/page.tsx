import { requireRole } from "@/lib/identity/require-role";
import { listAttendanceForStudent } from "@/lib/attendance/student";
import { attendancePercentage } from "@/lib/attendance/percentage";

export default async function StudentAttendancePage() {
  const session = await requireRole("student");
  const records = await listAttendanceForStudent(session.userId);

  const byOffering = new Map<string, { courseCode: string; courseTitle: string; records: typeof records }>();
  for (const r of records) {
    const existing = byOffering.get(r.courseOfferingId);
    if (existing) {
      existing.records.push(r);
    } else {
      byOffering.set(r.courseOfferingId, { courseCode: r.courseCode, courseTitle: r.courseTitle, records: [r] });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Attendance</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Your own attendance only — percentage and a session-by-session breakdown per course.
        </p>
      </div>

      {byOffering.size === 0 && <p className="text-sm text-zinc-500">No attendance recorded yet.</p>}

      {Array.from(byOffering.entries()).map(([offeringId, group]) => {
        const pct = attendancePercentage(group.records);
        return (
          <div key={offeringId} className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {group.courseCode} — {group.courseTitle}
              </h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  pct < 75
                    ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                }`}
              >
                {pct}%
              </span>
            </div>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
              {group.records.map((r) => (
                <li key={r.recordId}>
                  {r.sessionDate}: <span className="font-medium">{r.status}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
