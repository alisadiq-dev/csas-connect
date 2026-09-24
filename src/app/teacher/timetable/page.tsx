import { requireRole } from "@/lib/identity/require-role";
import { listPeriodDefinitions, listSlotsForTeacher, type SlotWithFullContext } from "@/lib/timetable/queries";
import { findNextLecture, type TimetableSlotWithTime } from "@/lib/timetable/next-lecture";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { WeeklyGrid } from "@/components/timetable/WeeklyGrid";
import { ClockIcon } from "@/components/icons";
import { formatTime } from "@/lib/format";

const DAY_LABEL: Record<string, string> = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday" };

function Cell({ slot }: { slot: SlotWithFullContext }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-slate-900">{slot.courseCode}</span>
      <span className="text-xs text-slate-500">
        {slot.programName} {slot.sectionType === "regular" ? "Regular" : "Replica"} ({slot.intakeYear})
      </span>
      {slot.room && <span className="text-xs text-slate-400">Room {slot.room}</span>}
    </div>
  );
}

export default async function TeacherTimetablePage() {
  const session = await requireRole("teacher");
  const [periods, slots] = await Promise.all([listPeriodDefinitions(), listSlotsForTeacher(session.userId)]);

  const periodStart = new Map(periods.map((p) => [p.periodNumber, p.startTime]));
  const slotsForNextLecture: (TimetableSlotWithTime & Pick<SlotWithFullContext, "courseCode" | "courseTitle" | "programName" | "sectionType" | "intakeYear">)[] =
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
        programName: s.programName,
        sectionType: s.sectionType,
        intakeYear: s.intakeYear,
      }));
  const nextLecture = findNextLecture(slotsForNextLecture, new Date());
  const nextLectureDetail = nextLecture
    ? slotsForNextLecture.find(
        (s) => s.dayOfWeek === nextLecture.dayOfWeek && s.periodNumber === nextLecture.periodNumber && s.courseOfferingId === nextLecture.courseOfferingId,
      )
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Timetable</h1>
        <p className="mt-1 text-sm text-slate-500">All your lectures across every program, in one aggregated schedule.</p>
      </div>

      <div className="flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
        <ClockIcon className="h-4 w-4 shrink-0" />
        {nextLectureDetail ? (
          <span>
            Next lecture: <span className="font-medium">{nextLectureDetail.courseCode}</span> — {nextLectureDetail.courseTitle} ·{" "}
            {nextLectureDetail.programName} {nextLectureDetail.sectionType} (Intake {nextLectureDetail.intakeYear}) ·{" "}
            {DAY_LABEL[nextLectureDetail.dayOfWeek]} at {formatTime(nextLectureDetail.startTime)}
            {nextLectureDetail.room ? ` · Room ${nextLectureDetail.room}` : ""}
          </span>
        ) : (
          <span>No upcoming lectures scheduled this week.</span>
        )}
      </div>

      <Card>
        <CardHeader title="Weekly schedule" />
        <CardBody>
          <WeeklyGrid periods={periods} slots={slots} renderCell={(slot) => <Cell slot={slot} />} />
        </CardBody>
      </Card>
    </div>
  );
}
