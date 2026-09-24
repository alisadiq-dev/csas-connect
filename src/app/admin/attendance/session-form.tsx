"use client";

import { useActionState } from "react";
import { AlertIcon } from "@/components/icons";
import { createSessionAction, type CreateSessionState } from "./actions";

const initialState: CreateSessionState = { error: null };

const fieldBase =
  "rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

export function SessionForm({
  courseOfferingId,
  students,
}: {
  courseOfferingId: string;
  students: { userId: string; rollNumber: string; fullName: string }[];
}) {
  const [state, formAction, pending] = useActionState(createSessionAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="courseOfferingId" value={courseOfferingId} />
      <label className="flex w-full flex-col gap-1.5 text-sm sm:w-56">
        <span className="font-medium text-slate-700">Session date</span>
        <input name="sessionDate" type="date" required className={`w-full ${fieldBase}`} />
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-slate-700">Mark every enrolled student ({students.length})</span>
        {students.length === 0 ? (
          <p className="text-sm text-slate-500">No students enrolled in this class yet.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <ul className="divide-y divide-slate-100">
              {students.map((s) => (
                <li key={s.userId} className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 text-sm">
                  <input type="hidden" name="studentUserId" value={s.userId} />
                  <span className="text-slate-900">
                    {s.rollNumber} — {s.fullName}
                  </span>
                  <select
                    name={`status-${s.userId}`}
                    defaultValue="present"
                    className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="leave">Leave</option>
                  </select>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={pending || students.length === 0}
        className="w-fit rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Create session"}
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
