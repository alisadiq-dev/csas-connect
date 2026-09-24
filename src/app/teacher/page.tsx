import Link from "next/link";
import { requireRole } from "@/lib/identity/require-role";
import { getTeacherByUserId } from "@/lib/identity/teachers";
import { listPeriodDefinitions, listSlotsForTeacher } from "@/lib/timetable/queries";
import { buildTodaySchedule } from "@/lib/timetable/today";
import { findNextLecture, type TimetableSlotWithTime } from "@/lib/timetable/next-lecture";
import { listVisibleNotices } from "@/lib/notices/feed";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ScheduleList } from "@/components/dashboard/ScheduleList";
import { BellIcon, BookIcon, ClockIcon, LayersIcon } from "@/components/icons";
import { formatTime } from "@/lib/format";

export default async function TeacherDashboardPage() {
  const session = await requireRole("teacher");
  const profile = await getTeacherByUserId(session.userId);

  const [periods, slots, notices] = await Promise.all([
    listPeriodDefinitions(),
    listSlotsForTeacher(session.userId),
    listVisibleNotices(session.userId),
  ]);

  const now = new Date();
  const todaySchedule = buildTodaySchedule(slots, periods, now);

  const periodStart = new Map(periods.map((p) => [p.periodNumber, p.startTime]));
  const slotsForNextLecture: (TimetableSlotWithTime & { courseCode: string; room: string | null })[] = slots
    .filter((s) => periodStart.has(s.periodNumber))
    .map((s) => ({
      dayOfWeek: s.dayOfWeek,
      periodNumber: s.periodNumber,
      startTime: periodStart.get(s.periodNumber)!,
      courseOfferingId: s.courseOfferingId,
      room: s.room,
      courseCode: s.courseCode,
    }));
  const nextLecture = findNextLecture(slotsForNextLecture, now);
  const nextLectureDetail = nextLecture
    ? slotsForNextLecture.find(
        (s) => s.dayOfWeek === nextLecture.dayOfWeek && s.periodNumber === nextLecture.periodNumber && s.courseOfferingId === nextLecture.courseOfferingId,
      )
    : null;

  const assignedOfferings = new Map<string, { courseCode: string; courseTitle: string; programName: string; sectionType: string; intakeYear: number }>();
  for (const s of slots) {
    if (!assignedOfferings.has(s.courseOfferingId)) {
      assignedOfferings.set(s.courseOfferingId, {
        courseCode: s.courseCode,
        courseTitle: s.courseTitle,
        programName: s.programName,
        sectionType: s.sectionType,
        intakeYear: s.intakeYear,
      });
    }
  }
  const programCount = new Set(Array.from(assignedOfferings.values()).map((o) => o.programName)).size;
  const recentNotices = notices.slice(0, 4);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Welcome back, {profile?.fullName ?? "Teacher"}</h1>
        <p className="mt-1 text-sm text-slate-500">Your assigned classes and today&apos;s schedule at a glance.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<BookIcon />} label="Assigned offerings" value={assignedOfferings.size} tone="indigo" />
        <StatCard icon={<LayersIcon />} label="Programs taught" value={programCount} tone="sky" />
        <StatCard icon={<ClockIcon />} label="Classes today" value={todaySchedule.length} tone="amber" />
        <StatCard icon={<BellIcon />} label="Recent notices" value={notices.length} tone="emerald" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Today's schedule"
            description={now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
            action={
              <Link href="/teacher/timetable" className="text-xs font-medium text-indigo-600 hover:underline">
                Full timetable
              </Link>
            }
          />
          <CardBody>
            {nextLectureDetail && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-indigo-50 px-3.5 py-2.5 text-sm text-indigo-800">
                <ClockIcon className="h-4 w-4 shrink-0" />
                <span>
                  Next lecture: <span className="font-medium">{nextLectureDetail.courseCode}</span> at{" "}
                  {formatTime(nextLectureDetail.startTime)}
                  {nextLectureDetail.room ? ` · Room ${nextLectureDetail.room}` : ""}
                </span>
              </div>
            )}
            <ScheduleList
              items={todaySchedule.map((s) => ({
                id: s.id,
                periodNumber: s.periodNumber,
                startTime: s.startTime,
                endTime: s.endTime,
                status: s.status,
                courseCode: s.courseCode,
                courseTitle: s.courseTitle,
                room: s.room,
              }))}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Assigned classes" description="Across all programs" />
          <CardBody>
            {assignedOfferings.size === 0 ? (
              <EmptyState icon={<BookIcon className="h-9 w-9" />} title="No offerings yet" description="You have no assigned course offerings." />
            ) : (
              <ul className="flex flex-col gap-3">
                {Array.from(assignedOfferings.values()).map((o, i) => (
                  <li key={i} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <p className="text-sm font-medium text-slate-900">
                      {o.courseCode} — {o.courseTitle}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Badge tone="info">{o.programName}</Badge>
                      <Badge tone="neutral">{o.sectionType === "regular" ? "Regular" : "Replica"}</Badge>
                      <Badge tone="neutral">{o.intakeYear}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Recent notices"
          action={
            <Link href="/notices" className="text-xs font-medium text-indigo-600 hover:underline">
              View all
            </Link>
          }
        />
        <CardBody>
          {recentNotices.length === 0 ? (
            <EmptyState icon={<BellIcon className="h-9 w-9" />} title="Nothing yet" description="No notices or events right now." />
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {recentNotices.map((n) => (
                <li key={n.id} className="rounded-lg border border-slate-100 p-3">
                  <p className="text-sm font-medium text-slate-900">{n.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {n.eventStartAt ? new Date(n.eventStartAt).toLocaleDateString() : new Date(n.createdAt).toLocaleDateString()} · {n.category}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
