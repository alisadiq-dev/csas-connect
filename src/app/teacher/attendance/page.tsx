import Link from "next/link";
import { requireRole } from "@/lib/identity/require-role";
import { listSessionsForTeacher } from "@/lib/attendance/teacher";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { CalendarCheckIcon } from "@/components/icons";

export default async function TeacherAttendancePage() {
  const session = await requireRole("teacher");
  const sessions = await listSessionsForTeacher(session.userId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Attendance</h1>
        <p className="mt-1 text-sm text-slate-500">
          Sessions for your own course offerings only. Pick one to correct a student&apos;s status — there is no
          &quot;add session&quot; control here; only an admin creates new sessions.
        </p>
      </div>

      <Card>
        <CardHeader title="Sessions" description="Across all your course offerings" />
        <CardBody>
          {sessions.length === 0 ? (
            <EmptyState
              icon={<CalendarCheckIcon className="h-9 w-9" />}
              title="No sessions yet"
              description="No sessions found for your course offerings yet."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {sessions.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                  <Link
                    href={`/teacher/attendance/${s.id}`}
                    className="text-sm font-medium text-slate-900 hover:text-indigo-600 hover:underline"
                  >
                    {s.courseCode} — {s.courseTitle}
                  </Link>
                  <span className="text-xs text-slate-500">{s.sessionDate}</span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
