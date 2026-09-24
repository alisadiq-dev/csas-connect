import { requireRole } from "@/lib/identity/require-role";
import { listResultsForTeacherOffering } from "@/lib/results/teacher";
import { correctResultAction } from "../actions";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Table, THead, Th, TBody, Tr, Td } from "@/components/ui/Table";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ChartIcon } from "@/components/icons";

const inputClass =
  "w-20 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";
const selectClass =
  "rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

function gradeTone(letterGrade: string | null): BadgeTone {
  if (!letterGrade) return "neutral";
  return letterGrade === "F" ? "danger" : "success";
}

export default async function TeacherResultsOfferingPage({
  params,
}: {
  params: Promise<{ courseOfferingId: string }>;
}) {
  const { courseOfferingId } = await params;
  const session = await requireRole("teacher");
  const rows = await listResultsForTeacherOffering(session.userId, courseOfferingId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Correct results</h1>
        <p className="mt-1 text-sm text-slate-500">
          Change a student&apos;s marks or special status for this existing result. If this list is empty, RLS is
          correctly denying access — this offering isn&apos;t one of your own.
        </p>
      </div>

      <Card>
        <CardHeader title="Results" description={`${rows.length} student${rows.length === 1 ? "" : "s"}`} />
        <CardBody>
          {rows.length === 0 ? (
            <EmptyState
              icon={<ChartIcon className="h-9 w-9" />}
              title="No results visible"
              description="No results visible for this offering."
            />
          ) : (
            <Table>
              <THead>
                <Th>Student</Th>
                <Th>Sessional (25)</Th>
                <Th>Mid (35)</Th>
                <Th>Final (40)</Th>
                <Th>Special status</Th>
                <Th>Total / Grade</Th>
                <Th />
              </THead>
              <TBody>
                {rows.map((r) => (
                  <Tr key={r.id}>
                    <Td colSpan={7} className="p-0">
                      <form action={correctResultAction} className="grid grid-cols-7 items-center gap-3 p-3">
                        <input type="hidden" name="resultId" value={r.id} />
                        <input type="hidden" name="courseOfferingId" value={courseOfferingId} />
                        <span className="text-sm font-medium text-slate-900">
                          {r.rollNumber} — {r.fullName}
                        </span>
                        <input
                          name="sessionalMarks"
                          type="number"
                          step="0.01"
                          defaultValue={r.sessionalMarks ?? ""}
                          className={inputClass}
                        />
                        <input
                          name="midTermMarks"
                          type="number"
                          step="0.01"
                          defaultValue={r.midTermMarks ?? ""}
                          className={inputClass}
                        />
                        <input
                          name="finalTermMarks"
                          type="number"
                          step="0.01"
                          defaultValue={r.finalTermMarks ?? ""}
                          className={inputClass}
                        />
                        <select name="specialStatus" defaultValue={r.specialStatus ?? ""} className={selectClass}>
                          <option value="">—</option>
                          <option value="W">W</option>
                          <option value="FW">FW</option>
                          <option value="I">I</option>
                        </select>
                        <span className="flex items-center gap-2 text-xs text-slate-500">
                          {r.totalMarks ?? "—"}
                          <Badge tone={gradeTone(r.letterGrade)}>{r.letterGrade ?? "—"}</Badge>
                        </span>
                        <button
                          type="submit"
                          className="w-fit rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
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
