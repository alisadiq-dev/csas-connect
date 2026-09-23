import { listAllClassesWithContext } from "@/lib/academic-structure/classes";
import { listOfferingsForClass } from "@/lib/academic-structure/offerings";
import { listAllCourses } from "@/lib/academic-structure/courses";
import { listPeriodDefinitions, listSlotsForClass } from "@/lib/timetable/queries";
import { SlotForm } from "./slot-form";
import { deleteSlotAction } from "./actions";

const DAYS: { value: string; label: string }[] = [
  { value: "mon", label: "Monday" },
  { value: "tue", label: "Tuesday" },
  { value: "wed", label: "Wednesday" },
  { value: "thu", label: "Thursday" },
  { value: "fri", label: "Friday" },
  { value: "sat", label: "Saturday" },
];

export default async function AdminTimetablePage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string }>;
}) {
  const { classId } = await searchParams;
  const classes = await listAllClassesWithContext();
  const selected = classId ? classes.find((c) => c.id === classId) : undefined;

  const [offerings, courses, slots, periods] = selected
    ? await Promise.all([
        listOfferingsForClass(selected.id),
        listAllCourses(),
        listSlotsForClass(selected.id),
        listPeriodDefinitions(),
      ])
    : [[], [], [], await listPeriodDefinitions()];

  const courseById = new Map(courses.map((c) => [c.id, c]));
  const slotByDayPeriod = new Map(slots.map((s) => [`${s.dayOfWeek}-${s.periodNumber}`, s]));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Timetable</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Build a class&apos;s weekly grid by assigning course offerings to day/period/room. Conflicting assignments
          (same class already booked, or the assigned teacher already booked elsewhere) are rejected server-side.
        </p>
      </div>

      <form method="GET" className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">Class</span>
          <select name="classId" defaultValue={classId ?? ""} required className="w-96 rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900">
            <option value="" disabled>
              Select a class…
            </option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.programName} — Intake {c.intakeYear} {c.sectionType} (sem {c.currentSemester})
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900">
          Load
        </button>
      </form>

      {selected && (
        <>
          <SlotForm
            classId={selected.id}
            offerings={offerings.map((o) => {
              const course = courseById.get(o.courseId);
              return { id: o.id, label: course ? `${course.code} — ${course.title}` : o.id };
            })}
            periods={periods.map((p) => ({ periodNumber: p.periodNumber, startTime: p.startTime, endTime: p.endTime }))}
          />

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
                            <form action={deleteSlotAction} className="flex flex-col gap-1">
                              <input type="hidden" name="slotId" value={s.id} />
                              <span className="text-xs font-medium text-zinc-900 dark:text-zinc-50">{s.courseCode}</span>
                              <span className="text-xs text-zinc-500">{s.teacherName ?? "unassigned"}</span>
                              {s.room && <span className="text-xs text-zinc-400">Room {s.room}</span>}
                              <button type="submit" className="w-fit text-xs text-red-700 hover:underline dark:text-red-400">
                                Remove
                              </button>
                            </form>
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
        </>
      )}
    </div>
  );
}
