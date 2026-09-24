"use client";

import { useActionState } from "react";
import { createCrNoticeAction, type CreateCrNoticeState } from "./actions";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { AlertIcon } from "@/components/icons";

const initialState: CreateCrNoticeState = { error: null };
const SUGGESTED_CATEGORIES = ["Announcement", "Deadline", "Event"];

const inputClass =
  "rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

export function CrNoticeForm() {
  const [state, formAction, pending] = useActionState(createCrNoticeAction, initialState);

  return (
    <Card>
      <CardHeader title="Post a notice" description="Visible only to your own class." />
      <CardBody>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-slate-700">Title</span>
              <input name="title" required className={`w-full sm:w-64 ${inputClass}`} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-slate-700">Category</span>
              <input name="category" list="cr-notice-categories" required className={`w-full sm:w-48 ${inputClass}`} />
              <datalist id="cr-notice-categories">
                {SUGGESTED_CATEGORIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>
          </div>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-slate-700">Body (optional)</span>
            <textarea name="body" rows={3} className={inputClass} />
          </label>

          <div className="flex flex-wrap gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-slate-700">Event start (optional)</span>
              <input name="eventStartAt" type="datetime-local" className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-slate-700">Event end (optional)</span>
              <input name="eventEndAt" type="datetime-local" className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-slate-700">Location (optional)</span>
              <input name="location" className={`w-full sm:w-48 ${inputClass}`} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-slate-700">Attachment (PDF, optional)</span>
              <input name="attachment" type="file" accept="application/pdf" className="text-sm text-slate-600" />
            </label>
          </div>

          {state.error && (
            <p role="alert" className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-fit rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-60"
          >
            {pending ? "Posting…" : "Post for my class"}
          </button>
        </form>
      </CardBody>
    </Card>
  );
}
