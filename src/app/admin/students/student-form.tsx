"use client";

import { useActionState } from "react";
import { createStudentAction, type StudentFormState } from "./actions";

const initialState: StudentFormState = { error: null };

export function StudentForm({ classes }: { classes: { id: string; label: string }[] }) {
  const [state, formAction, pending] = useActionState(createStudentAction, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">Full name</span>
          <input name="fullName" required className="w-full sm:w-48 rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">Email</span>
          <input name="email" type="email" required className="w-full sm:w-56 rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">Password</span>
          <input name="password" type="password" required className="w-40 rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">Class</span>
          <select name="classId" required className="w-full sm:w-64 rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900">
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 pb-1.5 text-sm text-zinc-700 dark:text-zinc-300">
          <input name="isClassRep" type="checkbox" />
          Class Representative
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900"
        >
          {pending ? "Creating…" : "Create student (auto roll number)"}
        </button>
      </div>
      {state.error && <p className="text-sm text-red-700 dark:text-red-400">{state.error}</p>}
      {state.createdRollNumber && (
        <p className="text-sm text-emerald-700 dark:text-emerald-400">
          Created with roll number <strong>{state.createdRollNumber}</strong>.
        </p>
      )}
    </form>
  );
}
