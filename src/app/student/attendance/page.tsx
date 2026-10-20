import { requireRole } from "@/lib/identity/require-role";
import { listAttendanceForStudent } from "@/lib/attendance/student";
import { attendancePercentage } from "@/lib/attendance/percentage";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { CalendarCheckIcon } from "@/components/icons";
import { RingGauge } from "@/components/ui/charts";

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
        <h1 className="text-xl font-semibold text-slate-900">Attendance</h1>
        <p className="mt-1 text-sm text-slate-500">
          Your own attendance only — percentage and a session-by-session breakdown per course.
        </p>
      </div>

      {byOffering.size === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<CalendarCheckIcon className="h-9 w-9" />}
              title="No attendance recorded yet"
              description="Your attendance will show up here once your teachers start marking sessions."
            />
          </CardBody>
        </Card>
      ) : (
        Array.from(byOffering.entries()).map(([offeringId, group]) => {
          const pct = attendancePercentage(group.records);
          return (
            <Card key={offeringId}>
              <CardHeader
                title={`${group.courseCode} — ${group.courseTitle}`}
                action={
                  <div className="flex items-center gap-3">
                    <Badge tone={pct < 75 ? "danger" : "success"}>{pct < 75 ? "Below 75%" : "On track"}</Badge>
                    <RingGauge value={pct} size={48} stroke={6} danger={pct < 75} label={`${group.courseCode} attendance ${pct} percent`} />
                  </div>
                }
              />
              <CardBody>
                <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500">
                  {group.records.map((r) => (
                    <li key={r.recordId}>
                      {r.sessionDate}: <span className="font-medium text-slate-700">{r.status}</span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          );
        })
      )}
    </div>
  );
}
