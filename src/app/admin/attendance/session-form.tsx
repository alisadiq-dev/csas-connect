"use client";

import { useActionState } from "react";
import { createSessionAction, type CreateSessionState } from "./actions";

const initialState: CreateSessionState = { error: null };

export function SessionForm({
  courseOfferingId,
  students,
}: {
  courseOfferingId: string;
  students: { userId: string; rollNumber: string; fullName: string }[];
}) {
  const [state, formAction, pending] = useActionState(createSessionAction, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <input type="hidden" name="courseOfferingId" value={courseOfferingId} />
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-700 dark:text-zinc-300">Session date</span>
        <input
          name="sessionDate"
          type="date"
          required
          className="w-48 rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-zinc-700 dark:text-zinc-300">
          Mark every enrolled student ({students.length})
        </span>
        {students.length === 0 && <p className="text-sm text-zinc-500">No students enrolled in this class yet.</p>}
        <ul className="divide-y divide-zinc-200 rounded border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {students.map((s) => (
            <li key={s.userId} className="flex flex-wrap items-center justify-between gap-2 p-2 text-sm">
              <input type="hidden" name="studentUserId" value={s.userId} />
              <span className="text-zinc-900 dark:text-zinc-50">
                {s.rollNumber} — {s.fullName}
              </span>
              <select
                name={`status-${s.userId}`}
                defaultValue="present"
                className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="leave">Leave</option>
              </select>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="submit"
        disabled={pending || students.length === 0}
        className="w-fit rounded bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900"
      >
        {pending ? "Saving…" : "Create session"}
      </button>
      {state.error && <p className="text-sm text-red-700 dark:text-red-400">{state.error}</p>}
    </form>
  );
}
