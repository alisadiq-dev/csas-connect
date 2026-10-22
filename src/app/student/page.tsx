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
import { AttendanceGauge } from "@/components/ui/AttendanceGauge";
import { MiniBars, ProgressBar } from "@/components/ui/charts";
import { TrendBadge } from "@/components/ui/TrendBadge";
import { Greeting } from "@/components/layout/Greeting";
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

  const gpaSemesters = Array.from(new Set(forGpa.map((r) => r.semesterNumber))).sort((a, b) => a - b);
  const gpaTrend = gpaSemesters.map((sem) => computeSemesterGpa(forGpa, sem));

  const attendanceByCourse = new Map<string, { code: string; records: typeof attendanceRecords }>();
  for (const r of attendanceRecords) {
    const g = attendanceByCourse.get(r.courseOfferingId);
    if (g) g.records.push(r);
    else attendanceByCourse.set(r.courseOfferingId, { code: r.courseCode, records: [r] });
  }
  const courseAttendance = Array.from(attendanceByCourse.values()).map((g) => ({
    code: g.code,
    pct: attendancePercentage(g.records),
  }));

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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-night-900 via-night-800 to-indigo-900 p-5 text-white sm:p-7">
        <div aria-hidden className="night-grid absolute inset-0 opacity-70" />
        <div aria-hidden className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-indigo-500/30 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 text-lg font-semibold text-white">
              {(profile?.fullName ?? "S")
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </span>
            <div>
              <p className="text-xs text-ice/70">
                <Greeting />, glad you&apos;re here
              </p>
              <h1 className="text-2xl font-light tracking-tight">{profile?.fullName ?? "Student"}</h1>
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
          <div className="flex items-center gap-4">
            <AttendanceGauge value={overallAttendance} />
            <div className="text-sm">
              <p className="font-medium">Overall attendance</p>
              <p className={`text-xs ${overallAttendance < 75 ? "text-rose-300" : "text-emerald-300"}`}>{overallAttendance < 75 ? "Below the 75% line — let's catch up" : "Right on track — keep it up"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Real-data stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<CalendarCheckIcon />} label="Overall attendance" number={overallAttendance} suffix="%" tone="emerald" />
        <StatCard icon={<ChartIcon />} label="CGPA" number={cgpa} decimals={2} tone="amber" />
        <StatCard
          icon={<ChartIcon />}
          label={currentSemester ? `Semester ${currentSemester} GPA` : "Semester GPA"}
          number={semesterGpa}
          decimals={2}
          hint={gpaTrend.length >= 2 ? <TrendBadge delta={gpaTrend[gpaTrend.length - 1] - gpaTrend[gpaTrend.length - 2]} suffix=" vs previous semester" /> : undefined}
          tone="sky"
        />
        <StatCard icon={<BookIcon />} label="Enrolled courses" number={courseCount} tone="indigo" />
      </div>

      {(gpaTrend.length > 0 || courseAttendance.length > 0) && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {gpaTrend.length > 0 && (
            <Card>
              <CardHeader title="GPA by semester" description="Computed from your published results" />
              <CardBody>
                {gpaTrend.length < 2 && (
                  <p className="mb-3 text-xs text-slate-500">Your trend line appears once a second semester is published.</p>
                )}
                <MiniBars
                  values={gpaTrend}
                  max={4}
                  height={110}
                  labels={gpaSemesters.map((n) => `S${n}`)}
                  ariaLabel={`GPA by semester: ${gpaSemesters.map((n, i) => `semester ${n} ${gpaTrend[i].toFixed(2)}`).join(", ")}`}
                />
              </CardBody>
            </Card>
          )}
          {courseAttendance.length > 0 && (
            <Card>
              <CardHeader
                title="Attendance by course"
                action={
                  <Link href="/student/attendance" className="text-xs font-medium text-indigo-600 hover:underline">
                    Details
                  </Link>
                }
              />
              <CardBody>
                <ul className="flex flex-col gap-3.5">
                  {courseAttendance.map((c) => (
                    <li key={c.code}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="font-medium text-slate-700">{c.code}</span>
                        <span className={c.pct < 75 ? "font-medium text-rose-600" : "text-slate-500"}>{c.pct}%</span>
                      </div>
                      <ProgressBar value={c.pct} danger={c.pct < 75} />
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}
        </div>
      )}

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
