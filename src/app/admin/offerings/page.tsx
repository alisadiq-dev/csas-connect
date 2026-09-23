import { listAllClassesWithContext } from "@/lib/academic-structure/classes";
import { listAllCourses } from "@/lib/academic-structure/courses";
import { listAcademicTerms } from "@/lib/academic-structure/terms";
import { listAllOfferingsWithContext } from "@/lib/academic-structure/offerings";
import { createCourseOfferingAction } from "./actions";

export default async function OfferingsPage() {
  const [classes, courses, terms, offerings] = await Promise.all([
    listAllClassesWithContext(),
    listAllCourses(),
    listAcademicTerms(),
    listAllOfferingsWithContext(),
  ]);

  const classLabel = (cls: (typeof classes)[number]) =>
    `${cls.programName} — Intake ${cls.intakeYear} ${cls.sectionType} (sem ${cls.currentSemester})`;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Course Offerings</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Links a class + course + term. This is the record every other module (attendance, results,
          timetable) references — never the class or course directly.
        </p>
      </div>

      <form action={createCourseOfferingAction} className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">Class</span>
          <select name="classId" required className="w-72 rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900">
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {classLabel(cls)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">Course</span>
          <select name="courseId" required className="w-56 rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900">
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} — {course.title}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">Term</span>
          <select name="termId" required className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900">
            {terms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900">
          Create offering
        </button>
      </form>

      <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
        {offerings.length === 0 && <li className="p-4 text-sm text-zinc-500">No offerings yet.</li>}
        {offerings.map((offering) => (
          <li key={offering.id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
            <span className="text-zinc-900 dark:text-zinc-50">
              {offering.courseCode} — {offering.courseTitle}
            </span>
            <span className="text-zinc-500">
              {offering.termName} · semester {offering.semesterNumber} ·{" "}
              {offering.teacherId ? "teacher assigned" : "unassigned"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
