import { requireRole } from "@/lib/identity/require-role";
import { listResultsForTeacherOffering } from "@/lib/results/teacher";
import { correctResultAction } from "../actions";

export default async function TeacherResultsOfferingPage({
  params,
}: {
  params: Promise<{ courseOfferingId: string }>;
}) {
  const { courseOfferingId } = await params;
  const session = await requireRole("teacher");
  const rows = await listResultsForTeacherOffering(session.userId, courseOfferingId);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Correct results</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Change a student&apos;s marks or special status for this existing result. If this list is empty, RLS is
          correctly denying access — this offering isn&apos;t one of your own.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="text-left text-xs text-zinc-500">
              <th className="p-2">Student</th>
              <th className="p-2">Sessional (25)</th>
              <th className="p-2">Mid (35)</th>
              <th className="p-2">Final (40)</th>
              <th className="p-2">Status</th>
              <th className="p-2">Total / Grade</th>
              <th className="p-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {rows.length === 0 && (
              <tr>
                <td className="p-4 text-sm text-zinc-500" colSpan={7}>
                  No results visible for this offering.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td colSpan={7} className="p-0">
                  <form action={correctResultAction} className="grid grid-cols-7 items-center gap-2 p-2">
                    <input type="hidden" name="resultId" value={r.id} />
                    <input type="hidden" name="courseOfferingId" value={courseOfferingId} />
                    <span className="text-zinc-900 dark:text-zinc-50">
                      {r.rollNumber} — {r.fullName}
                    </span>
                    <input
                      name="sessionalMarks"
                      type="number"
                      step="0.01"
                      defaultValue={r.sessionalMarks ?? ""}
                      className="w-20 rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    />
                    <input
                      name="midTermMarks"
                      type="number"
                      step="0.01"
                      defaultValue={r.midTermMarks ?? ""}
                      className="w-20 rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    />
                    <input
                      name="finalTermMarks"
                      type="number"
                      step="0.01"
                      defaultValue={r.finalTermMarks ?? ""}
                      className="w-20 rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    />
                    <select
                      name="specialStatus"
                      defaultValue={r.specialStatus ?? ""}
                      className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    >
                      <option value="">—</option>
                      <option value="W">W</option>
                      <option value="FW">FW</option>
                      <option value="I">I</option>
                    </select>
                    <span className="text-xs text-zinc-500">
                      {r.totalMarks ?? "—"} / {r.letterGrade ?? "—"}
                    </span>
                    <button
                      type="submit"
                      className="w-fit rounded bg-zinc-900 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900"
                    >
                      Save
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
