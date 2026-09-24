import { listAllClassesWithContext } from "@/lib/academic-structure/classes";
import { listAllCourses } from "@/lib/academic-structure/courses";
import { listAcademicTerms } from "@/lib/academic-structure/terms";
import { listAllOfferingsWithContext } from "@/lib/academic-structure/offerings";
import { createCourseOfferingAction } from "./actions";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Table, THead, Th, TBody, Tr, Td } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { LinkIcon } from "@/components/icons";

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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Course Offerings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Links a class + course + term. This is the record every other module (attendance, results,
          timetable) references — never the class or course directly.
        </p>
      </div>

      <Card>
        <CardHeader title="Add an offering" />
        <CardBody>
          <form action={createCourseOfferingAction} className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-slate-700">Class</span>
              <select
                name="classId"
                required
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:w-72"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {classLabel(cls)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-slate-700">Course</span>
              <select
                name="courseId"
                required
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:w-56"
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} — {course.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-slate-700">Term</span>
              <select
                name="termId"
                required
                className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                {terms.map((term) => (
                  <option key={term.id} value={term.id}>
                    {term.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Create offering
            </button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="All offerings"
          description={`${offerings.length} offering${offerings.length === 1 ? "" : "s"}`}
        />
        <CardBody>
          {offerings.length === 0 ? (
            <EmptyState
              icon={<LinkIcon />}
              title="No offerings yet"
              description="Create the first course offering above."
            />
          ) : (
            <Table>
              <THead>
                <Th>Course</Th>
                <Th>Term</Th>
                <Th>Semester</Th>
                <Th>Teacher</Th>
              </THead>
              <TBody>
                {offerings.map((offering) => (
                  <Tr key={offering.id}>
                    <Td className="font-medium text-slate-900">
                      {offering.courseCode} — {offering.courseTitle}
                    </Td>
                    <Td>{offering.termName}</Td>
                    <Td>{offering.semesterNumber}</Td>
                    <Td>
                      {offering.teacherId ? (
                        <Badge tone="success">Assigned</Badge>
                      ) : (
                        <Badge tone="neutral">Unassigned</Badge>
                      )}
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
