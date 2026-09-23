import Link from "next/link";
import { requireRole } from "@/lib/identity/require-role";
import { listSessionsForTeacher } from "@/lib/attendance/teacher";

export default async function TeacherAttendancePage() {
  const session = await requireRole("teacher");
  const sessions = await listSessionsForTeacher(session.userId);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Attendance</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Sessions for your own course offerings only. Pick one to correct a student&apos;s status — there is no
          &quot;add session&quot; control here; only an admin creates new sessions.
        </p>
      </div>

      <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
        {sessions.length === 0 && <li className="p-4 text-sm text-zinc-500">No sessions found for your course offerings yet.</li>}
        {sessions.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
            <Link href={`/teacher/attendance/${s.id}`} className="text-zinc-900 hover:underline dark:text-zinc-50">
              {s.courseCode} — {s.courseTitle}
            </Link>
            <span className="text-zinc-500">{s.sessionDate}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
