import { requireRole } from "@/lib/identity/require-role";
import { listResultsForStudent } from "@/lib/results/student";
import { computeCgpa, computeSemesterGpa, type ResultForGpa } from "@/lib/results/gpa";

export default async function StudentResultsPage() {
  const session = await requireRole("student");
  const rows = await listResultsForStudent(session.userId);

  const forGpa: ResultForGpa[] = rows.map((r) => ({
    creditHours: Number(r.creditHours),
    gradePoints: r.gradePoints !== null ? Number(r.gradePoints) : null,
    specialStatus: r.specialStatus,
    semesterNumber: r.semesterNumber,
  }));

  const semesters = Array.from(new Set(rows.map((r) => r.semesterNumber))).sort((a, b) => b - a);
  const cgpa = computeCgpa(forGpa);
  const currentSemester = semesters[0];

  const bySemester = new Map<number, typeof rows>();
  for (const r of rows) {
    const list = bySemester.get(r.semesterNumber);
    if (list) list.push(r);
    else bySemester.set(r.semesterNumber, [r]);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Results</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Your own results only, per course, per semester.</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-xs text-zinc-500">CGPA</div>
          <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{cgpa.toFixed(2)}</div>
        </div>
        {currentSemester !== undefined && (
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="text-xs text-zinc-500">Current semester ({currentSemester}) GPA</div>
            <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              {computeSemesterGpa(forGpa, currentSemester).toFixed(2)}
            </div>
          </div>
        )}
      </div>

      {rows.length === 0 && <p className="text-sm text-zinc-500">No results entered yet.</p>}

      {semesters.map((sem) => (
        <div key={sem} className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Semester {sem}</h2>
            <span className="text-xs text-zinc-500">GPA {computeSemesterGpa(forGpa, sem).toFixed(2)}</span>
          </div>
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-zinc-500">
                <th className="py-1">Course</th>
                <th className="py-1">Total</th>
                <th className="py-1">Grade</th>
                <th className="py-1">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {bySemester.get(sem)!.map((r) => (
                <tr key={r.resultId}>
                  <td className="py-1 text-zinc-900 dark:text-zinc-50">
                    {r.courseCode} — {r.courseTitle}
                  </td>
                  <td className="py-1">{r.specialStatus ? "—" : (r.totalMarks ?? "—")}</td>
                  <td className="py-1">{r.specialStatus ?? r.letterGrade ?? "—"}</td>
                  <td className="py-1">{r.specialStatus ? "excluded" : (r.gradePoints ?? "—")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
