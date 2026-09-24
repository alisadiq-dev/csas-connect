"use client";

import { useActionState, useState } from "react";
import { AlertIcon } from "@/components/icons";
import { createNoticeAction, type CreateNoticeState } from "./actions";

const initialState: CreateNoticeState = { error: null };
const SUGGESTED_CATEGORIES = ["Announcement", "Date Sheet", "Result", "Deadline", "Event"];

const fieldBase =
  "rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

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
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        <label className="flex w-full flex-1 min-w-[12rem] flex-col gap-1.5 text-sm sm:w-64">
          <span className="font-medium text-slate-700">Title</span>
          <input name="title" required className={`w-full ${fieldBase}`} />
        </label>
        <label className="flex w-full flex-col gap-1.5 text-sm sm:w-48">
          <span className="font-medium text-slate-700">Category</span>
          <input name="category" list="notice-categories" required className={`w-full ${fieldBase}`} />
          <datalist id="notice-categories">
            {SUGGESTED_CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label className="flex w-full flex-col gap-1.5 text-sm sm:w-56">
          <span className="font-medium text-slate-700">Audience scope</span>
          <select
            name="audienceScope"
            value={scope}
            onChange={(e) => setScope(e.target.value as typeof scope)}
            className={`w-full ${fieldBase}`}
          >
            <option value="department">Department (everyone)</option>
            <option value="program">Program</option>
            <option value="class">Class</option>
          </select>
        </label>
        {scope !== "department" && (
          <label className="flex w-full flex-col gap-1.5 text-sm sm:w-56">
            <span className="font-medium text-slate-700">Program</span>
            <select name="programId" required className={`w-full ${fieldBase}`}>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {scope === "class" && (
          <label className="flex w-full flex-col gap-1.5 text-sm sm:w-64">
            <span className="font-medium text-slate-700">Class</span>
            <select name="classId" required className={`w-full ${fieldBase}`}>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-slate-700">Body (optional)</span>
        <textarea name="body" rows={3} className={fieldBase} />
      </label>

      <div className="flex flex-wrap items-end gap-4">
        <label className="flex w-40 flex-col gap-1.5 text-sm">
          <span className="font-medium text-slate-700">Semester label (optional)</span>
          <input name="semesterLabel" placeholder="e.g. Semester 3" className={`w-full ${fieldBase}`} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-slate-700">Event start (optional)</span>
          <input name="eventStartAt" type="datetime-local" className={fieldBase} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-slate-700">Event end (optional)</span>
          <input name="eventEndAt" type="datetime-local" className={fieldBase} />
        </label>
        <label className="flex w-full flex-col gap-1.5 text-sm sm:w-48">
          <span className="font-medium text-slate-700">Location (optional)</span>
          <input name="location" className={`w-full ${fieldBase}`} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-slate-700">Attachment (PDF, optional)</span>
          <input
            name="attachment"
            type="file"
            accept="application/pdf"
            className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
      >
        {pending ? "Posting…" : "Post notice"}
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
