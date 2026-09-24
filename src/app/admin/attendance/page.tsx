import { listAllOfferingsWithContext } from "@/lib/academic-structure/offerings";
import { listStudentsForClass } from "@/lib/identity/students";
import { listRecordsForSession, listSessionsForOffering } from "@/lib/attendance/admin";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { CalendarCheckIcon } from "@/components/icons";
import { SessionForm } from "./session-form";

function statusTone(status: string): BadgeTone {
  if (status === "present") return "success";
  if (status === "absent") return "danger";
  return "warning";
}

export default async function AdminAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ courseOfferingId?: string }>;
}) {
  const { courseOfferingId } = await searchParams;
  const offerings = await listAllOfferingsWithContext();

  const selected = courseOfferingId ? offerings.find((o) => o.id === courseOfferingId) : undefined;
  const [students, sessions] = selected
    ? await Promise.all([listStudentsForClass(selected.classId), listSessionsForOffering(selected.id)])
    : [[], []];

  const sessionsWithRecords = await Promise.all(
    sessions.map(async (s) => ({ ...s, records: await listRecordsForSession(s.id) })),
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Attendance</h1>
        <p className="mt-1 text-sm text-slate-500">
          Create an attendance session for a course offering and mark every enrolled student. Corrections to an
          existing session happen in the Teacher area, not here.
        </p>
      </div>

      <Card>
        <CardBody>
          <form method="GET" className="flex flex-wrap items-end gap-3">
            <label className="flex flex-1 min-w-[16rem] flex-col gap-1.5 text-sm">
              <span className="font-medium text-slate-700">Course offering</span>
              <select
                name="courseOfferingId"
                defaultValue={courseOfferingId ?? ""}
                required
                className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="" disabled>
                  Select a course offering…
                </option>
                {offerings.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.courseCode} — {o.courseTitle} · {o.termName} (sem {o.semesterNumber})
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              Load
            </button>
          </form>
        </CardBody>
      </Card>

      {selected && (
        <>
          <Card>
            <CardHeader title="Create session" description={`Mark attendance for ${selected.courseCode}`} />
            <CardBody>
              <SessionForm
                courseOfferingId={selected.id}
                students={students.map((s) => ({ userId: s.userId, rollNumber: s.rollNumber, fullName: s.fullName }))}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={`Existing sessions for ${selected.courseCode}`} />
            <CardBody>
              {sessionsWithRecords.length === 0 ? (
                <EmptyState
                  icon={<CalendarCheckIcon className="h-9 w-9" />}
                  title="No sessions yet"
                  description="Sessions you create will show up here."
                />
              ) : (
                <div className="flex flex-col gap-3">
                  {sessionsWithRecords.map((s) => (
                    <div key={s.id} className="rounded-lg border border-slate-200 p-3.5">
                      <div className="text-sm font-medium text-slate-900">{s.sessionDate}</div>
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {s.records.map((r) => (
                          <li key={r.id}>
                            <Badge tone={statusTone(r.status)}>
                              {r.rollNumber}: {r.status}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
