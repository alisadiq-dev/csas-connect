import { listAllClassesWithContext } from "@/lib/academic-structure/classes";
import { listOfferingsForClass } from "@/lib/academic-structure/offerings";
import { listAllCourses } from "@/lib/academic-structure/courses";
import { listPeriodDefinitions, listSlotsForClass, type SlotWithContext } from "@/lib/timetable/queries";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { WeeklyGrid } from "@/components/timetable/WeeklyGrid";
import { SlotForm } from "./slot-form";
import { deleteSlotAction } from "./actions";

function Cell({ slot }: { slot: SlotWithContext }) {
  return (
    <form action={deleteSlotAction} className="flex flex-col gap-1">
      <input type="hidden" name="slotId" value={slot.id} />
      <span className="text-xs font-medium text-slate-900">{slot.courseCode}</span>
      <span className="text-xs text-slate-500">{slot.teacherName ?? "Unassigned"}</span>
      {slot.room && <span className="text-xs text-slate-400">Room {slot.room}</span>}
      <button type="submit" className="w-fit text-xs text-rose-600 hover:underline">
        Remove
      </button>
    </form>
  );
}

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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Timetable</h1>
        <p className="mt-1 text-sm text-slate-500">
          Build a class&apos;s weekly grid by assigning course offerings to day/period/room. Conflicting assignments
          (same class already booked, or the assigned teacher already booked elsewhere) are rejected server-side.
        </p>
      </div>

      <Card>
        <CardBody>
          <form method="GET" className="flex flex-wrap items-end gap-3">
            <label className="flex flex-1 flex-col gap-1.5 text-sm">
              <span className="font-medium text-slate-700">Class</span>
              <select
                name="classId"
                defaultValue={classId ?? ""}
                required
                className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
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
            <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              Load
            </button>
          </form>
        </CardBody>
      </Card>

      {selected && (
        <>
          <Card>
            <CardHeader title="Add a slot" />
            <CardBody>
              <SlotForm
                classId={selected.id}
                offerings={offerings.map((o) => {
                  const course = courseById.get(o.courseId);
                  return { id: o.id, label: course ? `${course.code} — ${course.title}` : o.id };
                })}
                periods={periods.map((p) => ({ periodNumber: p.periodNumber, startTime: p.startTime, endTime: p.endTime }))}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Weekly schedule" />
            <CardBody>
              <WeeklyGrid periods={periods} slots={slots.map((slot) => ({ ...slot, content: <Cell slot={slot} /> }))} />
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
