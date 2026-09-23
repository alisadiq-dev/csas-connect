"use client";

import { useActionState } from "react";
import { createSlotAction, type CreateSlotState } from "./actions";

const initialState: CreateSlotState = { error: null };
const DAYS: { value: string; label: string }[] = [
  { value: "mon", label: "Monday" },
  { value: "tue", label: "Tuesday" },
  { value: "wed", label: "Wednesday" },
  { value: "thu", label: "Thursday" },
  { value: "fri", label: "Friday" },
  { value: "sat", label: "Saturday" },
];

export function SlotForm({
  classId,
  offerings,
  periods,
}: {
  classId: string;
  offerings: { id: string; label: string }[];
  periods: { periodNumber: number; startTime: string; endTime: string }[];
}) {
  const [state, formAction, pending] = useActionState(createSlotAction, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <input type="hidden" name="classId" value={classId} />
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-700 dark:text-zinc-300">Course offering</span>
        <select name="courseOfferingId" required className="w-64 rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900">
          {offerings.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-700 dark:text-zinc-300">Day</span>
        <select name="dayOfWeek" required className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900">
          {DAYS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-700 dark:text-zinc-300">Period</span>
        <select name="periodNumber" required className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900">
          {periods.map((p) => (
            <option key={p.periodNumber} value={p.periodNumber}>
              {p.periodNumber} ({p.startTime}-{p.endTime})
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-700 dark:text-zinc-300">Room (optional)</span>
        <input name="room" className="w-32 rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900"
      >
        {pending ? "Adding…" : "Add slot"}
      </button>
      {state.error && <p className="w-full text-sm text-red-700 dark:text-red-400">{state.error}</p>}
    </form>
  );
}
