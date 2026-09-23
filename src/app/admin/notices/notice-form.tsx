"use client";

import { useActionState, useState } from "react";
import { createNoticeAction, type CreateNoticeState } from "./actions";

const initialState: CreateNoticeState = { error: null };
const SUGGESTED_CATEGORIES = ["Announcement", "Date Sheet", "Result", "Deadline", "Event"];

export function NoticeForm({
  programs,
  classes,
}: {
  programs: { id: string; name: string }[];
  classes: { id: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(createNoticeAction, initialState);
  const [scope, setScope] = useState<"department" | "program" | "class">("department");

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">Title</span>
          <input name="title" required className="w-64 rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">Category</span>
          <input
            name="category"
            list="notice-categories"
            required
            className="w-48 rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <datalist id="notice-categories">
            {SUGGESTED_CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">Audience scope</span>
          <select
            name="audienceScope"
            value={scope}
            onChange={(e) => setScope(e.target.value as typeof scope)}
            className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="department">Department (everyone)</option>
            <option value="program">Program</option>
            <option value="class">Class</option>
          </select>
        </label>
        {scope !== "department" && (
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-700 dark:text-zinc-300">Program</span>
            <select name="programId" required className="w-56 rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900">
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {scope === "class" && (
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-700 dark:text-zinc-300">Class</span>
            <select name="classId" required className="w-64 rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900">
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-700 dark:text-zinc-300">Body (optional)</span>
        <textarea name="body" rows={3} className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
      </label>

      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">Semester label (optional)</span>
          <input name="semesterLabel" placeholder="e.g. Semester 3" className="w-40 rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">Event start (optional)</span>
          <input name="eventStartAt" type="datetime-local" className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">Event end (optional)</span>
          <input name="eventEndAt" type="datetime-local" className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">Location (optional)</span>
          <input name="location" className="w-48 rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">Attachment (PDF, optional)</span>
          <input name="attachment" type="file" accept="application/pdf" className="text-sm" />
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900"
      >
        {pending ? "Posting…" : "Post notice"}
      </button>
      {state.error && <p className="text-sm text-red-700 dark:text-red-400">{state.error}</p>}
    </form>
  );
}
