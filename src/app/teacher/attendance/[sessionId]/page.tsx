import { requireRole } from "@/lib/identity/require-role";
import { listSessionRecordsForTeacher } from "@/lib/attendance/teacher";
import { correctRecordAction } from "../actions";

export default async function TeacherAttendanceSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await requireRole("teacher");
  const records = await listSessionRecordsForTeacher(session.userId, sessionId);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Correct attendance</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Change a student&apos;s status for this existing session. If this list is empty, RLS is correctly denying
          access — either this session isn&apos;t for one of your own course offerings, or it doesn&apos;t exist.
        </p>
      </div>

      <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
        {records.length === 0 && <li className="p-4 text-sm text-zinc-500">No records visible for this session.</li>}
        {records.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
            <span className="text-zinc-900 dark:text-zinc-50">
              {r.rollNumber} — {r.fullName}
            </span>
            <form action={correctRecordAction} className="flex items-center gap-2">
              <input type="hidden" name="recordId" value={r.id} />
              <input type="hidden" name="sessionId" value={sessionId} />
              <select
                name="status"
                defaultValue={r.status}
                className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="leave">Leave</option>
              </select>
              <button
                type="submit"
                className="rounded bg-zinc-900 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900"
              >
                Save
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
