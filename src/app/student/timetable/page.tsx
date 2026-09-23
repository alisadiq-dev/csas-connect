import { requireRole } from "@/lib/identity/require-role";
import { getStudentByUserId } from "@/lib/identity/students";
import { listPeriodDefinitions, listSlotsForClass } from "@/lib/timetable/queries";

const DAYS: { value: string; label: string }[] = [
  { value: "mon", label: "Monday" },
  { value: "tue", label: "Tuesday" },
  { value: "wed", label: "Wednesday" },
  { value: "thu", label: "Thursday" },
  { value: "fri", label: "Friday" },
  { value: "sat", label: "Saturday" },
];

export default async function StudentTimetablePage() {
  const session = await requireRole("student");
  const student = await getStudentByUserId(session.userId);

  if (!student) {
    return <p className="text-sm text-zinc-500">No profile found.</p>;
  }

  const [periods, slots] = await Promise.all([listPeriodDefinitions(), listSlotsForClass(student.classId)]);
  const slotByDayPeriod = new Map(slots.map((s) => [`${s.dayOfWeek}-${s.periodNumber}`, s]));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Timetable</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Your own class&apos;s weekly schedule.</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="text-left text-xs text-zinc-500">
              <th className="p-2">Period</th>
              {DAYS.map((d) => (
                <th key={d.value} className="p-2">
                  {d.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {periods.map((p) => (
              <tr key={p.periodNumber}>
                <td className="p-2 align-top text-xs text-zinc-500">
                  {p.periodNumber}
                  <br />
                  {p.startTime}-{p.endTime}
                </td>
                {DAYS.map((d) => {
                  const s = slotByDayPeriod.get(`${d.value}-${p.periodNumber}`);
                  return (
                    <td key={d.value} className="p-2 align-top">
                      {s ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-medium text-zinc-900 dark:text-zinc-50">{s.courseCode}</span>
                          <span className="text-xs text-zinc-500">{s.teacherName ?? "unassigned"}</span>
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
