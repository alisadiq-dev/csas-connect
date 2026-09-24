import { requireRole } from "@/lib/identity/require-role";
import { listSessionRecordsForTeacher } from "@/lib/attendance/teacher";
import { correctRecordAction } from "../actions";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Table, THead, Th, TBody, Tr, Td } from "@/components/ui/Table";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { UsersIcon } from "@/components/icons";

const STATUS_TONE: Record<string, BadgeTone> = {
  present: "success",
  absent: "danger",
  leave: "warning",
};

const STATUS_LABEL: Record<string, string> = {
  present: "Present",
  absent: "Absent",
  leave: "Leave",
};

export default async function TeacherAttendanceSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await requireRole("teacher");
  const records = await listSessionRecordsForTeacher(session.userId, sessionId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Correct attendance</h1>
        <p className="mt-1 text-sm text-slate-500">
          Change a student&apos;s status for this existing session. If this list is empty, RLS is correctly denying
          access — either this session isn&apos;t for one of your own course offerings, or it doesn&apos;t exist.
        </p>
      </div>

      <Card>
        <CardHeader title="Roster" description={`${records.length} student${records.length === 1 ? "" : "s"}`} />
        <CardBody>
          {records.length === 0 ? (
            <EmptyState
              icon={<UsersIcon className="h-9 w-9" />}
              title="No records visible"
              description="No records visible for this session."
            />
          ) : (
            <Table>
              <THead>
                <Th>Roll no.</Th>
                <Th>Student</Th>
                <Th>Status</Th>
                <Th>Correct</Th>
              </THead>
              <TBody>
                {records.map((r) => (
                  <Tr key={r.id}>
                    <Td className="font-medium text-slate-900">{r.rollNumber}</Td>
                    <Td>{r.fullName}</Td>
                    <Td>
                      <Badge tone={STATUS_TONE[r.status] ?? "neutral"}>{STATUS_LABEL[r.status] ?? r.status}</Badge>
                    </Td>
                    <Td>
                      <form action={correctRecordAction} className="flex items-center gap-2">
                        <input type="hidden" name="recordId" value={r.id} />
                        <input type="hidden" name="sessionId" value={sessionId} />
                        <select
                          name="status"
                          defaultValue={r.status}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="leave">Leave</option>
                        </select>
                        <button
                          type="submit"
                          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                        >
                          Save
                        </button>
                      </form>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
