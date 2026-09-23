import { listAllClassesWithContext } from "@/lib/academic-structure/classes";
import { listAllStudents } from "@/lib/identity/students";
import { StudentForm } from "./student-form";

export default async function StudentsPage() {
  const [classes, students] = await Promise.all([listAllClassesWithContext(), listAllStudents()]);
  const classLabelById = new Map(
    classes.map((cls) => [cls.id, `${cls.programName} — Intake ${cls.intakeYear} ${cls.sectionType} (sem ${cls.currentSemester})`]),
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Students</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Pick a class; the roll number is generated automatically ({"{seq}"}-{"{yy}"}). Flag a student as CR for
          their own class here.
        </p>
      </div>

      <StudentForm classes={classes.map((cls) => ({ id: cls.id, label: classLabelById.get(cls.id)! }))} />

      <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
        {students.length === 0 && <li className="p-4 text-sm text-zinc-500">No students yet.</li>}
        {students.map((student) => (
          <li key={student.userId} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
            <span className="text-zinc-900 dark:text-zinc-50">
              {student.rollNumber} — {student.fullName}
            </span>
            <span className="flex items-center gap-2 text-zinc-500">
              {classLabelById.get(student.classId) ?? "Unknown class"}
              {student.isClassRep && (
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                  CR
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
