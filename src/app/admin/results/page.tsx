import { listAllOfferingsWithContext } from "@/lib/academic-structure/offerings";
import { listStudentsForClass } from "@/lib/identity/students";
import { listResultsForOffering } from "@/lib/results/admin";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Results</h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter sessional/mid/final marks for every student in a course offering. Corrections to already-entered
          results happen here too (admin has full access) or in the Teacher area for the assigned teacher.
        </p>
      </div>

      <Card>
        <CardBody>
          <form method="GET" className="flex flex-wrap items-end gap-3">
            <label className="flex flex-1 min-w-[16rem] flex-col gap-1.5 text-sm">
              <span className="font-medium text-slate-700">Course offering</span>
              <select
                name="courseOfferingId"
                defaultValue={courseOfferingId ?? ""}
                required
                className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
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
            <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              Load
            </button>
          </form>
        </CardBody>
      </Card>

      {selected && (
        <Card>
          <CardHeader
            title={`Marks for ${selected.courseCode}`}
            description="Sessional /25 · Mid Term /35 · Final Term /40 — total, letter grade, and grade points compute automatically. Leave marks blank and pick a special status instead for W/FW/I."
          />
          <CardBody>
            <ResultsForm
              courseOfferingId={selected.id}
              students={students.map((s) => ({ userId: s.userId, rollNumber: s.rollNumber, fullName: s.fullName }))}
              existingByStudent={existingByStudent}
            />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
