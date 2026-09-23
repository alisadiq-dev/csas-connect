import { listPrograms } from "@/lib/academic-structure/programs";
import { createProgramAction } from "./actions";

export default async function ProgramsPage() {
  const programs = await listPrograms();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Programs</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          The three degree programs offered by the department.
        </p>
      </div>

      <form action={createProgramAction} className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">Name</span>
          <input
            name="name"
            required
            placeholder="BS Statistics"
            className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">Code</span>
          <input
            name="code"
            required
            placeholder="STAT"
            className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <button
          type="submit"
          className="rounded bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900"
        >
          Create program
        </button>
      </form>

      <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
        {programs.length === 0 && (
          <li className="p-4 text-sm text-zinc-500">No programs yet.</li>
        )}
        {programs.map((program) => (
          <li key={program.id} className="flex items-center justify-between p-4 text-sm">
            <span className="font-medium text-zinc-900 dark:text-zinc-50">{program.name}</span>
            <span className="text-zinc-500">{program.code}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
