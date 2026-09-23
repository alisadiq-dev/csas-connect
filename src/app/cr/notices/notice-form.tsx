"use client";

import { useActionState } from "react";
import { createCrNoticeAction, type CreateCrNoticeState } from "./actions";

const initialState: CreateCrNoticeState = { error: null };
const SUGGESTED_CATEGORIES = ["Announcement", "Deadline", "Event"];

export function CrNoticeForm() {
  const [state, formAction, pending] = useActionState(createCrNoticeAction, initialState);

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
          <input name="category" list="cr-notice-categories" required className="w-48 rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
          <datalist id="cr-notice-categories">
            {SUGGESTED_CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-700 dark:text-zinc-300">Body (optional)</span>
        <textarea name="body" rows={3} className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
      </label>

      <div className="flex flex-wrap gap-3">
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
        {pending ? "Posting…" : "Post for my class"}
      </button>
      {state.error && <p className="text-sm text-red-700 dark:text-red-400">{state.error}</p>}
    </form>
  );
}
