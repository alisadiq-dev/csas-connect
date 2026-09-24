import { requireRole } from "@/lib/identity/require-role";
import { getStudentByUserId } from "@/lib/identity/students";
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

export default async function StudentTimetablePage() {
  const session = await requireRole("student");
  const student = await getStudentByUserId(session.userId);

  if (!student) {
    return <p className="text-sm text-slate-500">No profile found.</p>;
  }

  const [periods, slots] = await Promise.all([listPeriodDefinitions(), listSlotsForClass(student.classId)]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Timetable</h1>
        <p className="mt-1 text-sm text-slate-500">Your own class&apos;s weekly schedule.</p>
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
