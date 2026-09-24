import { listPrograms } from "@/lib/academic-structure/programs";
import { listCoursesForProgram } from "@/lib/academic-structure/courses";
import { listAcademicTerms } from "@/lib/academic-structure/terms";
import { createAcademicTermAction, createCourseAction } from "./actions";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Table, THead, Th, TBody, Tr, Td } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { BookIcon, ClockIcon } from "@/components/icons";

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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Courses &amp; Terms</h1>
        <p className="mt-1 text-sm text-slate-500">
          Courses without a verified official curriculum are shown with a &ldquo;Demo data&rdquo; badge.
        </p>
      </div>

      <Card>
        <CardHeader title="Add a course" />
        <CardBody>
          <form action={createCourseAction} className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-slate-700">Program</span>
              <select
                name="programId"
                required
                className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-slate-700">Code</span>
              <input
                name="code"
                required
                placeholder="STAT-301"
                className="w-28 rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-slate-700">Title</span>
              <input
                name="title"
                required
                placeholder="Probability Theory"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:w-56"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-slate-700">Credit hours</span>
              <input
                name="creditHours"
                type="number"
                step="0.5"
                min={1}
                max={4}
                defaultValue={3}
                required
                className="w-20 rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-slate-700">Curriculum semester</span>
              <input
                name="curriculumSemester"
                type="number"
                min={1}
                max={8}
                defaultValue={1}
                required
                className="w-24 rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </label>
            <label className="flex items-center gap-2 pb-2.5 text-sm text-slate-700">
              <input
                name="isVerifiedCurriculum"
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
              />
              Verified official curriculum
            </label>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Add course
            </button>
          </form>
        </CardBody>
      </Card>

      <div className="flex flex-col gap-6">
        {programsWithCourses.map(({ program, courses }) => (
          <Card key={program.id}>
            <CardHeader
              title={program.name}
              description={`${courses.length} course${courses.length === 1 ? "" : "s"}`}
            />
            <CardBody>
              {courses.length === 0 ? (
                <EmptyState
                  icon={<BookIcon />}
                  title="No courses yet"
                  description="Add the first course for this program above."
                />
              ) : (
                <Table>
                  <THead>
                    <Th>Code</Th>
                    <Th>Title</Th>
                    <Th>Credit hours</Th>
                    <Th>Semester</Th>
                    <Th>Curriculum</Th>
                  </THead>
                  <TBody>
                    {courses.map((course) => (
                      <Tr key={course.id}>
                        <Td className="font-medium text-slate-900">{course.code}</Td>
                        <Td>{course.title}</Td>
                        <Td>{course.creditHours}</Td>
                        <Td>{course.curriculumSemester}</Td>
                        <Td>
                          {course.isVerifiedCurriculum ? (
                            <Badge tone="success">Verified</Badge>
                          ) : (
                            <Badge tone="warning">Demo data</Badge>
                          )}
                        </Td>
                      </Tr>
                    ))}
                  </TBody>
                </Table>
              )}
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="Academic terms" />
        <CardBody>
          <form action={createAcademicTermAction} className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-slate-700">Season</span>
              <select
                name="season"
                required
                className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="fall">Fall</option>
                <option value="spring">Spring</option>
                <option value="summer">Summer</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-slate-700">Year</span>
              <input
                name="year"
                type="number"
                required
                defaultValue={2026}
                className="w-24 rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </label>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Create term
            </button>
          </form>

          <div className="mt-5">
            {terms.length === 0 ? (
              <EmptyState icon={<ClockIcon />} title="No terms yet" description="Create the first academic term above." />
            ) : (
              <Table>
                <THead>
                  <Th>Term</Th>
                </THead>
                <TBody>
                  {terms.map((term) => (
                    <Tr key={term.id}>
                      <Td className="font-medium text-slate-900">{term.name}</Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
