import { desc, eq } from "drizzle-orm";
import { courseOfferings, courses } from "@/db/schema/academic-structure";
import { results } from "@/db/schema/results";
import { withUserDb } from "@/lib/db/with-user";

/** Own-data-only via RLS (results_student_select) — see SPEC-results.md. */
export async function listResultsForStudent(studentUserId: string) {
  return withUserDb(studentUserId, (tx) =>
    tx
      .select({
        resultId: results.id,
        courseOfferingId: results.courseOfferingId,
        courseCode: courses.code,
        courseTitle: courses.title,
        creditHours: courses.creditHours,
        semesterNumber: courseOfferings.semesterNumber,
        sessionalMarks: results.sessionalMarks,
        midTermMarks: results.midTermMarks,
        finalTermMarks: results.finalTermMarks,
        totalMarks: results.totalMarks,
        letterGrade: results.letterGrade,
        gradePoints: results.gradePoints,
        specialStatus: results.specialStatus,
      })
      .from(results)
      .innerJoin(courseOfferings, eq(results.courseOfferingId, courseOfferings.id))
      .innerJoin(courses, eq(courseOfferings.courseId, courses.id))
      .where(eq(results.studentUserId, studentUserId))
      .orderBy(desc(courseOfferings.semesterNumber)),
  );
}
