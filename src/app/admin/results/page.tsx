import { listAllOfferingsWithContext } from "@/lib/academic-structure/offerings";
import { listStudentsForClass } from "@/lib/identity/students";
import { listResultsForOffering } from "@/lib/results/admin";
import { ResultsForm } from "./results-form";

export default async function AdminResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ courseOfferingId?: string }>;
}) {
  const { courseOfferingId } = await searchParams;
  const offerings = await listAllOfferingsWithContext();
  const selected = courseOfferingId ? offerings.find((o) => o.id === courseOfferingId) : undefined;

  const [students, existing] = selected
    ? await Promise.all([listStudentsForClass(selected.classId), listResultsForOffering(selected.id)])
    : [[], []];

  const existingByStudent = new Map(existing.map((r) => [r.studentUserId, r]));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Results</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Enter sessional/mid/final marks for every student in a course offering. Corrections to already-entered
          results happen here too (admin has full access) or in the Teacher area for the assigned teacher.
        </p>
      </div>

      <form
        method="GET"
        className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">Course offering</span>
          <select
            name="courseOfferingId"
            defaultValue={courseOfferingId ?? ""}
            required
            className="w-96 rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="" disabled>
              Select a course offering…
            </option>
            {offerings.map((o) => (
              <option key={o.id} value={o.id}>
                {o.courseCode} — {o.courseTitle} · {o.termName} (sem {o.semesterNumber})
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900"
        >
          Load
        </button>
      </form>

      {selected && (
        <ResultsForm
          courseOfferingId={selected.id}
          students={students.map((s) => ({ userId: s.userId, rollNumber: s.rollNumber, fullName: s.fullName }))}
          existingByStudent={existingByStudent}
        />
      )}
    </div>
  );
}
