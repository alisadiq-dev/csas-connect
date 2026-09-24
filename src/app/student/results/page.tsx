import { requireRole } from "@/lib/identity/require-role";
import { listResultsForStudent } from "@/lib/results/student";
import { computeCgpa, computeSemesterGpa, type ResultForGpa } from "@/lib/results/gpa";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, THead, Th, TBody, Tr, Td } from "@/components/ui/Table";
import { ChartIcon, DocumentIcon } from "@/components/icons";

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
        <h1 className="text-xl font-semibold text-slate-900">Results</h1>
        <p className="mt-1 text-sm text-slate-500">Your own results only, per course, per semester.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:max-w-md">
        <StatCard icon={<ChartIcon />} label="CGPA" value={cgpa.toFixed(2)} tone="indigo" />
        {currentSemester !== undefined && (
          <StatCard
            icon={<ChartIcon />}
            label={`Semester ${currentSemester} GPA`}
            value={computeSemesterGpa(forGpa, currentSemester).toFixed(2)}
            tone="sky"
          />
        )}
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<DocumentIcon className="h-9 w-9" />}
              title="No results entered yet"
              description="Your results will appear here once they're published."
            />
          </CardBody>
        </Card>
      ) : (
        semesters.map((sem) => (
          <Card key={sem}>
            <CardHeader
              title={`Semester ${sem}`}
              action={<span className="text-xs text-slate-500">GPA {computeSemesterGpa(forGpa, sem).toFixed(2)}</span>}
            />
            <CardBody>
              <Table>
                <THead>
                  <Th>Course</Th>
                  <Th>Total</Th>
                  <Th>Grade</Th>
                  <Th>Points</Th>
                </THead>
                <TBody>
                  {bySemester.get(sem)!.map((r) => (
                    <Tr key={r.resultId}>
                      <Td className="text-slate-900">
                        {r.courseCode} — {r.courseTitle}
                      </Td>
                      <Td>{r.specialStatus ? "—" : (r.totalMarks ?? "—")}</Td>
                      <Td>{r.specialStatus ?? r.letterGrade ?? "—"}</Td>
                      <Td>{r.specialStatus ? "excluded" : (r.gradePoints ?? "—")}</Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            </CardBody>
          </Card>
        ))
      )}
    </div>
  );
}
