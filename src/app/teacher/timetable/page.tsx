import { requireRole } from "@/lib/identity/require-role";
import { listSlotsForTeacher } from "@/lib/timetable/queries";
import { findNextLecture } from "@/lib/timetable/next-lecture";

const DAY_LABEL: Record<string, string> = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday" };
const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat"];

export default async function TeacherTimetablePage() {
  const session = await requireRole("teacher");
  const slots = await listSlotsForTeacher(session.userId);

  // Placeholder period start times (see SPEC-timetable.md Open Questions) —
  // needed here only to sort/compare within findNextLecture, not displayed
  // directly (the grid shows period number + course/class/room instead).
  const PERIOD_START: Record<number, string> = { 1: "08:00:00", 2: "08:50:00", 3: "09:40:00", 4: "10:30:00", 5: "11:20:00", 6: "12:10:00", 7: "13:00:00" };
  const nextLecture = findNextLecture(
    slots.map((s) => ({ dayOfWeek: s.dayOfWeek, periodNumber: s.periodNumber, startTime: PERIOD_START[s.periodNumber] ?? "00:00:00", courseOfferingId: s.courseOfferingId, room: s.room })),
    new Date(),
  );
  const nextLectureDetail = nextLecture ? slots.find((s) => s.dayOfWeek === nextLecture.dayOfWeek && s.periodNumber === nextLecture.periodNumber && s.courseOfferingId === nextLecture.courseOfferingId) : null;

  const byDayPeriod = new Map(slots.map((s) => [`${s.dayOfWeek}-${s.periodNumber}`, s]));
  const periodNumbers = Array.from(new Set(slots.map((s) => s.periodNumber))).sort((a, b) => a - b);
  const periodsToShow = periodNumbers.length > 0 ? periodNumbers : [1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Timetable</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          All your lectures across every program, in one aggregated schedule.
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="text-xs text-zinc-500">Next lecture</div>
        {nextLectureDetail ? (
          <div className="mt-1 text-sm text-zinc-900 dark:text-zinc-50">
            {nextLectureDetail.courseCode} — {nextLectureDetail.courseTitle} · {nextLectureDetail.programName}{" "}
            {nextLectureDetail.sectionType} (Intake {nextLectureDetail.intakeYear}) · {DAY_LABEL[nextLectureDetail.dayOfWeek]}, period{" "}
            {nextLectureDetail.periodNumber}
            {nextLectureDetail.room ? ` · Room ${nextLectureDetail.room}` : ""}
          </div>
        ) : (
          <div className="mt-1 text-sm text-zinc-500">No upcoming lectures scheduled this week.</div>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="text-left text-xs text-zinc-500">
              <th className="p-2">Period</th>
              {DAYS.map((d) => (
                <th key={d} className="p-2">
                  {DAY_LABEL[d]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {periodsToShow.map((p) => (
              <tr key={p}>
                <td className="p-2 align-top text-xs text-zinc-500">{p}</td>
                {DAYS.map((d) => {
                  const s = byDayPeriod.get(`${d}-${p}`);
                  return (
                    <td key={d} className="p-2 align-top">
                      {s ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-medium text-zinc-900 dark:text-zinc-50">{s.courseCode}</span>
                          <span className="text-xs text-zinc-500">
                            {s.programName} {s.sectionType} ({s.intakeYear})
                          </span>
                          {s.room && <span className="text-xs text-zinc-400">Room {s.room}</span>}
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-300 dark:text-zinc-700">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
