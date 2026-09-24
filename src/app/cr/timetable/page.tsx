import { requireClassRep } from "@/lib/identity/require-role";
import { listPeriodDefinitions, listSlotsForClass, type SlotWithContext } from "@/lib/timetable/queries";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { WeeklyGrid } from "@/components/timetable/WeeklyGrid";

function Cell({ slot }: { slot: SlotWithContext }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-slate-900">{slot.courseCode}</span>
      <span className="text-xs text-slate-500">{slot.teacherName ?? "Unassigned"}</span>
      {slot.room && <span className="text-xs text-slate-400">Room {slot.room}</span>}
    </div>
  );
}

/** Read-only — same open-read timetable data as every other role, filtered to this CR's own class (SPEC-notices-events.md: CR is "read-only on their own class's timetable"). */
export default async function CrTimetablePage() {
  const session = await requireClassRep();
  const [periods, slots] = await Promise.all([listPeriodDefinitions(), listSlotsForClass(session.classId)]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Timetable</h1>
        <p className="mt-1 text-sm text-slate-500">Your class&apos;s weekly schedule (read-only).</p>
      </div>

      <Card>
        <CardHeader title="Weekly schedule" />
        <CardBody>
          <WeeklyGrid periods={periods} slots={slots.map((slot) => ({ ...slot, content: <Cell slot={slot} /> }))} />
        </CardBody>
      </Card>
    </div>
  );
}
