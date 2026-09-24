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
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="classId" value={classId} />
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-slate-700">Course offering</span>
        <select
          name="courseOfferingId"
          required
          className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:w-64"
        >
          {offerings.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-slate-700">Day</span>
        <select
          name="dayOfWeek"
          required
          className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        >
          {DAYS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-slate-700">Period</span>
        <select
          name="periodNumber"
          required
          className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        >
          {periods.map((p) => (
            <option key={p.periodNumber} value={p.periodNumber}>
              {p.periodNumber} ({p.startTime}-{p.endTime})
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-slate-700">Room (optional)</span>
        <input
          name="room"
          className="w-32 rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add slot"}
      </button>
      {state.error && <p className="w-full text-sm text-rose-600">{state.error}</p>}
    </form>
  );
}
