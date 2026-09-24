import Link from "next/link";
import { getClassWithContext } from "@/lib/academic-structure/classes";
import { requireRole } from "@/lib/identity/require-role";
import { getStudentByUserId } from "@/lib/identity/students";
import { listAttendanceForStudent } from "@/lib/attendance/student";
import { attendancePercentage } from "@/lib/attendance/percentage";
import { listResultsForStudent } from "@/lib/results/student";
import { computeCgpa, computeSemesterGpa, type ResultForGpa } from "@/lib/results/gpa";
import { listPeriodDefinitions, listSlotsForClass } from "@/lib/timetable/queries";
import { buildTodaySchedule } from "@/lib/timetable/today";
import { findNextLecture, type TimetableSlotWithTime } from "@/lib/timetable/next-lecture";
import { listVisibleNotices } from "@/lib/notices/feed";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ScheduleList } from "@/components/dashboard/ScheduleList";
import { CalendarCheckIcon, ChartIcon, ClockIcon, BookIcon, BellIcon } from "@/components/icons";
import { formatTime } from "@/lib/format";

export default async function StudentDashboardPage() {
  const session = await requireRole("student");
  const profile = await getStudentByUserId(session.userId);
  const classContext = profile ? await getClassWithContext(profile.classId) : null;

  const [attendanceRecords, resultRows, periods, slots, notices] = await Promise.all([
    listAttendanceForStudent(session.userId),
    listResultsForStudent(session.userId),
    listPeriodDefinitions(),
    profile ? listSlotsForClass(profile.classId) : Promise.resolve([]),
    listVisibleNotices(session.userId),
  ]);

  const overallAttendance = attendancePercentage(attendanceRecords);
  const courseCount = new Set([
    ...attendanceRecords.map((r) => r.courseOfferingId),
    ...resultRows.map((r) => r.courseOfferingId),
  ]).size;

  const forGpa: ResultForGpa[] = resultRows.map((r) => ({
    creditHours: Number(r.creditHours),
    gradePoints: r.gradePoints !== null ? Number(r.gradePoints) : null,
    specialStatus: r.specialStatus,
    semesterNumber: r.semesterNumber,
  }));
  const cgpa = computeCgpa(forGpa);
  const currentSemester = classContext?.currentSemester;
  const semesterGpa = currentSemester !== undefined ? computeSemesterGpa(forGpa, currentSemester) : 0;

  const now = new Date();
  const todaySchedule = buildTodaySchedule(slots, periods, now);

  const periodStart = new Map(periods.map((p) => [p.periodNumber, p.startTime]));
  const slotsForNextLecture: (TimetableSlotWithTime & { courseCode: string; courseTitle: string; teacherName: string | null })[] =
    slots
      .filter((s) => periodStart.has(s.periodNumber))
      .map((s) => ({
        dayOfWeek: s.dayOfWeek,
        periodNumber: s.periodNumber,
        startTime: periodStart.get(s.periodNumber)!,
        courseOfferingId: s.courseOfferingId,
        room: s.room,
        courseCode: s.courseCode,
        courseTitle: s.courseTitle,
        teacherName: s.teacherName,
      }));
  const nextLecture = findNextLecture(slotsForNextLecture, now);
  const nextLectureDetail = nextLecture
    ? slotsForNextLecture.find(
        (s) => s.dayOfWeek === nextLecture.dayOfWeek && s.periodNumber === nextLecture.periodNumber && s.courseOfferingId === nextLecture.courseOfferingId,
      )
    : null;

  const recentNotices = notices.slice(0, 4);

  return (
    <div className="flex flex-col gap-6">
      {/* Identity banner */}
      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-lg font-semibold text-white">
              {(profile?.fullName ?? "S")
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </span>
            <div>
              <p className="text-xs text-slate-500">Welcome back</p>
              <h1 className="text-xl font-semibold text-slate-900">{profile?.fullName ?? "Student"}</h1>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge tone="brand">Roll {profile?.rollNumber}</Badge>
                {classContext && <Badge tone="info">{classContext.programName}</Badge>}
                {classContext && (
                  <Badge tone="neutral">{classContext.sectionType === "regular" ? "Regular" : "Replica"}</Badge>
                )}
                {classContext && <Badge tone="neutral">Semester {classContext.currentSemester}</Badge>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-data stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<CalendarCheckIcon />} label="Overall attendance" value={`${overallAttendance}%`} tone="emerald" />
        <StatCard icon={<ChartIcon />} label="CGPA" value={cgpa.toFixed(2)} tone="indigo" />
        <StatCard
          icon={<ChartIcon />}
          label={currentSemester ? `Semester ${currentSemester} GPA` : "Semester GPA"}
          value={semesterGpa.toFixed(2)}
          tone="sky"
        />
        <StatCard icon={<BookIcon />} label="Enrolled courses" value={courseCount} tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Today's schedule"
            description={now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
            action={
              <Link href="/student/timetable" className="text-xs font-medium text-indigo-600 hover:underline">
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
                teacherName: s.teacherName,
                room: s.room,
              }))}
            />
          </CardBody>
        </Card>

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
              <EmptyState icon={<BellIcon className="h-9 w-9" />} title="Nothing yet" description="No notices or events for you right now." />
            ) : (
              <ul className="flex flex-col gap-3">
                {recentNotices.map((n) => (
                  <li key={n.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <p className="text-sm font-medium text-slate-900">{n.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {n.eventStartAt ? new Date(n.eventStartAt).toLocaleDateString() : new Date(n.createdAt).toLocaleDateString()}
                      {" · "}
                      {n.category}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
