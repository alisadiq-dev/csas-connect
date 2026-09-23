import { listPrograms } from "@/lib/academic-structure/programs";
import { listCoursesForProgram } from "@/lib/academic-structure/courses";
import { listAcademicTerms } from "@/lib/academic-structure/terms";
import { createAcademicTermAction, createCourseAction } from "./actions";

export default async function CoursesPage() {
  const programs = await listPrograms();
  const programsWithCourses = await Promise.all(
    programs.map(async (program) => ({
      program,
      courses: await listCoursesForProgram(program.id),
    })),
  );
  const terms = await listAcademicTerms();

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Courses & Terms</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Courses without a verified official curriculum are shown with a &ldquo;Demo data&rdquo; badge.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Add a course</h2>
        <form action={createCourseAction} className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-700 dark:text-zinc-300">Program</span>
            <select name="programId" required className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900">
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-700 dark:text-zinc-300">Code</span>
            <input name="code" required placeholder="STAT-301" className="w-28 rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-700 dark:text-zinc-300">Title</span>
            <input name="title" required placeholder="Probability Theory" className="w-full sm:w-56 rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-700 dark:text-zinc-300">Credit hours</span>
            <input name="creditHours" type="number" step="0.5" min={1} max={4} defaultValue={3} required className="w-20 rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-700 dark:text-zinc-300">Curriculum semester</span>
            <input name="curriculumSemester" type="number" min={1} max={8} defaultValue={1} required className="w-24 rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
          </label>
          <label className="flex items-center gap-2 pb-1.5 text-sm text-zinc-700 dark:text-zinc-300">
            <input name="isVerifiedCurriculum" type="checkbox" />
            Verified official curriculum
          </label>
          <button type="submit" className="rounded bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900">
            Add course
          </button>
        </form>

        <div className="flex flex-col gap-4">
          {programsWithCourses.map(({ program, courses }) => (
            <div key={program.id} className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
              <div className="border-b border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-900 dark:border-zinc-800 dark:text-zinc-50">
                {program.name}
              </div>
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {courses.length === 0 && <li className="p-4 text-sm text-zinc-500">No courses yet.</li>}
                {courses.map((course) => (
                  <li key={course.id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
                    <span className="text-zinc-900 dark:text-zinc-50">
                      {course.code} — {course.title}{" "}
                      <span className="text-zinc-500">({course.creditHours} cr, sem {course.curriculumSemester})</span>
                    </span>
                    {!course.isVerifiedCurriculum && (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                        Demo data
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Academic terms</h2>
        <form action={createAcademicTermAction} className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-700 dark:text-zinc-300">Season</span>
            <select name="season" required className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900">
              <option value="fall">Fall</option>
              <option value="spring">Spring</option>
              <option value="summer">Summer</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-700 dark:text-zinc-300">Year</span>
            <input name="year" type="number" required defaultValue={2026} className="w-24 rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
          </label>
          <button type="submit" className="rounded bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900">
            Create term
          </button>
        </form>
        <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
          {terms.length === 0 && <li className="p-4 text-sm text-zinc-500">No terms yet.</li>}
          {terms.map((term) => (
            <li key={term.id} className="p-4 text-sm text-zinc-900 dark:text-zinc-50">
              {term.name}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
