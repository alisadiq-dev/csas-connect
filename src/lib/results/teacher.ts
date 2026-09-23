import { asc, eq } from "drizzle-orm";
import { courseOfferings, courses } from "@/db/schema/academic-structure";
import { studentProfiles } from "@/db/schema/identity";
import { gradingScale, results, type SpecialStatusEnum } from "@/db/schema/results";
import { withUserDb } from "@/lib/db/with-user";
import { computeTotalMarks, gradeFor } from "./grading";

// Teacher-scoped: every query goes through withUserDb (RLS-enforced) — a
// teacher only ever sees/edits results for their own course offerings
// because results_teacher_select / results_teacher_update
// (db/migrations/0004_results.sql) say so, not because this code filters by
// teacherUserId itself.

export async function listOfferingsWithResultsForTeacher(teacherUserId: string) {
  return withUserDb(teacherUserId, (tx) =>
    tx
      .selectDistinct({
        courseOfferingId: results.courseOfferingId,
        courseCode: courses.code,
        courseTitle: courses.title,
      })
      .from(results)
      .innerJoin(courseOfferings, eq(results.courseOfferingId, courseOfferings.id))
      .innerJoin(courses, eq(courseOfferings.courseId, courses.id)),
  );
}

export async function listResultsForTeacherOffering(teacherUserId: string, courseOfferingId: string) {
  return withUserDb(teacherUserId, (tx) =>
    tx
      .select({
        id: results.id,
        studentUserId: results.studentUserId,
        fullName: studentProfiles.fullName,
        rollNumber: studentProfiles.rollNumber,
        sessionalMarks: results.sessionalMarks,
        midTermMarks: results.midTermMarks,
        finalTermMarks: results.finalTermMarks,
        totalMarks: results.totalMarks,
        letterGrade: results.letterGrade,
        gradePoints: results.gradePoints,
        specialStatus: results.specialStatus,
      })
      .from(results)
      .innerJoin(studentProfiles, eq(results.studentUserId, studentProfiles.userId))
      .where(eq(results.courseOfferingId, courseOfferingId))
      .orderBy(asc(studentProfiles.rollNumber)),
  );
}

export type CorrectResultInput = {
  sessionalMarks: number | null;
  midTermMarks: number | null;
  finalTermMarks: number | null;
  specialStatus: SpecialStatusEnum | null;
};

/** Corrects an EXISTING result only — no create path here (SPEC-results.md: teachers never get an INSERT policy). */
export async function correctResult(teacherUserId: string, resultId: string, input: CorrectResultInput) {
  return withUserDb(teacherUserId, async (tx) => {
    let totalMarks: number | null = null;
    let letterGrade: string | null = null;
    let gradePoints: number | null = null;

    if (!input.specialStatus) {
      if (input.sessionalMarks == null || input.midTermMarks == null || input.finalTermMarks == null) {
        throw new Error("Sessional, mid term, and final term marks are all required unless a special status (W/FW/I) is set.");
      }
      const scaleRows = await tx.select().from(gradingScale);
      const scale = scaleRows.map((r) => ({
        minPercent: r.minPercent,
        maxPercent: r.maxPercent,
        letterGrade: r.letterGrade,
        gradePoints: Number(r.gradePoints),
      }));
      totalMarks = computeTotalMarks(input.sessionalMarks, input.midTermMarks, input.finalTermMarks);
      const grade = gradeFor(totalMarks, scale);
      letterGrade = grade.letterGrade;
      gradePoints = grade.gradePoints;
    }

    return tx
      .update(results)
      .set({
        sessionalMarks: input.specialStatus ? null : input.sessionalMarks!.toFixed(2),
        midTermMarks: input.specialStatus ? null : input.midTermMarks!.toFixed(2),
        finalTermMarks: input.specialStatus ? null : input.finalTermMarks!.toFixed(2),
        totalMarks: totalMarks !== null ? totalMarks.toFixed(2) : null,
        letterGrade,
        gradePoints: gradePoints !== null ? gradePoints.toFixed(2) : null,
        specialStatus: input.specialStatus,
        updatedBy: teacherUserId,
        updatedAt: new Date(),
      })
      .where(eq(results.id, resultId))
      .returning();
  });
}
