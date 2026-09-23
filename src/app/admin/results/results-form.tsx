"use client";

import { useActionState } from "react";
import { saveResultsAction, type SaveResultsState } from "./actions";

const initialState: SaveResultsState = { error: null };

type ExistingResult = {
  studentUserId: string;
  sessionalMarks: string | null;
  midTermMarks: string | null;
  finalTermMarks: string | null;
  specialStatus: string | null;
};

export function ResultsForm({
  courseOfferingId,
  students,
  existingByStudent,
}: {
  courseOfferingId: string;
  students: { userId: string; rollNumber: string; fullName: string }[];
  existingByStudent: Map<string, ExistingResult>;
}) {
  const [state, formAction, pending] = useActionState(saveResultsAction, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <input type="hidden" name="courseOfferingId" value={courseOfferingId} />
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Sessional is out of 25, Mid Term out of 35, Final Term out of 40 (matching the confirmed PU weightage) — total,
        letter grade, and grade points compute automatically. Leave marks blank and pick a special status instead for
        W/FW/I.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="text-left text-xs text-zinc-500">
              <th className="p-2">Student</th>
              <th className="p-2">Sessional (25)</th>
              <th className="p-2">Mid (35)</th>
              <th className="p-2">Final (40)</th>
              <th className="p-2">Special status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {students.map((s) => {
              const existing = existingByStudent.get(s.userId);
              return (
                <tr key={s.userId}>
                  <td className="p-2 whitespace-nowrap text-zinc-900 dark:text-zinc-50">
                    <input type="hidden" name="studentUserId" value={s.userId} />
                    {s.rollNumber} — {s.fullName}
                  </td>
                  <td className="p-2">
                    <input
                      name={`sessional-${s.userId}`}
                      type="number"
                      step="0.01"
                      min="0"
                      max="25"
                      defaultValue={existing?.sessionalMarks ?? ""}
                      className="w-20 rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      name={`mid-${s.userId}`}
                      type="number"
                      step="0.01"
                      min="0"
                      max="35"
                      defaultValue={existing?.midTermMarks ?? ""}
                      className="w-20 rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      name={`final-${s.userId}`}
                      type="number"
                      step="0.01"
                      min="0"
                      max="40"
                      defaultValue={existing?.finalTermMarks ?? ""}
                      className="w-20 rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    />
                  </td>
                  <td className="p-2">
                    <select
                      name={`specialStatus-${s.userId}`}
                      defaultValue={existing?.specialStatus ?? ""}
                      className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    >
                      <option value="">—</option>
                      <option value="W">W (Withdrawal)</option>
                      <option value="FW">FW (Forced Withdrawal)</option>
                      <option value="I">I (Incomplete)</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button
        type="submit"
        disabled={pending || students.length === 0}
        className="w-fit rounded bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900"
      >
        {pending ? "Saving…" : "Save results"}
      </button>
      {state.error && <p className="text-sm text-red-700 dark:text-red-400">{state.error}</p>}
    </form>
  );
}
