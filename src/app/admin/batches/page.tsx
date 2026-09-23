import { listPrograms } from "@/lib/academic-structure/programs";
import { listBatchesForProgram } from "@/lib/academic-structure/batches";
import { listClassesForBatch } from "@/lib/academic-structure/classes";
import { createBatchAction } from "./actions";

export default async function BatchesPage() {
  const programs = await listPrograms();
  const programsWithBatches = await Promise.all(
    programs.map(async (program) => {
      const batches = await listBatchesForProgram(program.id);
      const batchesWithClasses = await Promise.all(
        batches.map(async (batch) => ({
          batch,
          classes: await listClassesForBatch(batch.id),
        })),
      );
      return { program, batchesWithClasses };
    }),
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Batches & Classes</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Creating a batch automatically generates its Regular and Replica classes.
        </p>
      </div>

      <form action={createBatchAction} className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">Program</span>
          <select
            name="programId"
            required
            className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            {programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">Intake year</span>
          <input
            name="intakeYear"
            type="number"
            required
            placeholder="2024"
            className="w-28 rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">Current semester</span>
          <input
            name="currentSemester"
            type="number"
            min={1}
            max={8}
            defaultValue={1}
            required
            className="w-24 rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <button
          type="submit"
          className="rounded bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900"
        >
          Create batch (+ classes)
        </button>
      </form>

      <div className="flex flex-col gap-6">
        {programsWithBatches.map(({ program, batchesWithClasses }) => (
          <div key={program.id} className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="border-b border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-900 dark:border-zinc-800 dark:text-zinc-50">
              {program.name}
            </div>
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {batchesWithClasses.length === 0 && (
                <li className="p-4 text-sm text-zinc-500">No batches yet.</li>
              )}
              {batchesWithClasses.map(({ batch, classes }) => (
                <li key={batch.id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
                  <span className="text-zinc-900 dark:text-zinc-50">
                    Intake {batch.intakeYear} — semester {classes[0]?.currentSemester ?? "?"}
                  </span>
                  <span className="flex gap-2">
                    {classes.map((cls) => (
                      <span
                        key={cls.id}
                        className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs capitalize text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        {cls.sectionType}
                      </span>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
