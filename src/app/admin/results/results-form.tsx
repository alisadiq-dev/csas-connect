"use client";

import { useActionState } from "react";
import { Table, THead, Th, TBody, Tr, Td } from "@/components/ui/Table";
import { AlertIcon } from "@/components/icons";
import { saveResultsAction, type SaveResultsState } from "./actions";

const initialState: SaveResultsState = { error: null };

type ExistingResult = {
  studentUserId: string;
  sessionalMarks: string | null;
  midTermMarks: string | null;
  finalTermMarks: string | null;
  specialStatus: string | null;
};

const numberFieldClass =
  "w-20 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";
const selectFieldClass =
  "rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

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
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="courseOfferingId" value={courseOfferingId} />

      <Table>
        <THead>
          <Th>Student</Th>
          <Th>Sessional (25)</Th>
          <Th>Mid (35)</Th>
          <Th>Final (40)</Th>
          <Th>Special status</Th>
        </THead>
        <TBody>
          {students.map((s) => {
            const existing = existingByStudent.get(s.userId);
            return (
              <Tr key={s.userId}>
                <Td className="whitespace-nowrap font-medium text-slate-900">
                  <input type="hidden" name="studentUserId" value={s.userId} />
                  {s.rollNumber} — {s.fullName}
                </Td>
                <Td>
                  <input
                    name={`sessional-${s.userId}`}
                    type="number"
                    step="0.01"
                    min="0"
                    max="25"
                    defaultValue={existing?.sessionalMarks ?? ""}
                    className={numberFieldClass}
                  />
                </Td>
                <Td>
                  <input
                    name={`mid-${s.userId}`}
                    type="number"
                    step="0.01"
                    min="0"
                    max="35"
                    defaultValue={existing?.midTermMarks ?? ""}
                    className={numberFieldClass}
                  />
                </Td>
                <Td>
                  <input
                    name={`final-${s.userId}`}
                    type="number"
                    step="0.01"
                    min="0"
                    max="40"
                    defaultValue={existing?.finalTermMarks ?? ""}
                    className={numberFieldClass}
                  />
                </Td>
                <Td>
                  <select
                    name={`specialStatus-${s.userId}`}
                    defaultValue={existing?.specialStatus ?? ""}
                    className={selectFieldClass}
                  >
                    <option value="">—</option>
                    <option value="W">W (Withdrawal)</option>
                    <option value="FW">FW (Forced Withdrawal)</option>
                    <option value="I">I (Incomplete)</option>
                  </select>
                </Td>
              </Tr>
            );
          })}
        </TBody>
      </Table>

      <button
        type="submit"
        disabled={pending || students.length === 0}
        className="w-fit rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save results"}
      </button>
      {state.error && (
        <p role="alert" className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          {state.error}
        </p>
      )}
    </form>
  );
}
