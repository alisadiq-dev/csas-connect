"use client";

import { useActionState } from "react";
import { AlertIcon } from "@/components/icons";
import { createTeacherAction, type TeacherFormState } from "./actions";

const initialState: TeacherFormState = { error: null };

const fieldBase =
  "rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

export function TeacherForm() {
  const [state, formAction, pending] = useActionState(createTeacherAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex w-full flex-col gap-1.5 text-sm sm:w-48">
          <span className="font-medium text-slate-700">Full name</span>
          <input name="fullName" required className={`w-full ${fieldBase}`} />
        </label>
        <label className="flex w-full flex-col gap-1.5 text-sm sm:w-56">
          <span className="font-medium text-slate-700">Email</span>
          <input name="email" type="email" required className={`w-full ${fieldBase}`} />
        </label>
        <label className="flex w-40 flex-col gap-1.5 text-sm">
          <span className="font-medium text-slate-700">Password</span>
          <input name="password" type="password" required className={`w-full ${fieldBase}`} />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create teacher"}
        </button>
      </div>
      {state.error && (
        <p role="alert" className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          {state.error}
        </p>
      )}
    </form>
  );
}
