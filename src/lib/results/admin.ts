import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { studentProfiles } from "@/db/schema/identity";
import { gradingScale, results, type SpecialStatusEnum } from "@/db/schema/results";
import { computeTotalMarks, gradeFor } from "./grading";

// Admin-only: uses the raw `db` export (owner bypass), same rationale as
// src/lib/attendance/admin.ts.

export async function listGradingScale() {
  return db.select().from(gradingScale).orderBy(desc(gradingScale.minPercent));
}

function toScaleRows(rows: Awaited<ReturnType<typeof listGradingScale>>) {
  return rows.map((r) => ({
    minPercent: r.minPercent,
    maxPercent: r.maxPercent,
    letterGrade: r.letterGrade,
    gradePoints: Number(r.gradePoints),
  }));
}

export type UpsertResultInput = {
  courseOfferingId: string;
  studentUserId: string;
  sessionalMarks: number | null;
  midTermMarks: number | null;
  finalTermMarks: number | null;
  specialStatus: SpecialStatusEnum | null;
  updatedBy: string;
};

/**
 * Creates or corrects one student's result for one course offering
 * (upsert, keyed on the same unique(course_offering_id, student_user_id)
 * constraint RLS relies on) — the admin-side counterpart to
 * src/lib/results/teacher.ts's correctResult, which is UPDATE-only.
 * total_marks/letter_grade/grade_points are always computed here, never
 * accepted from the client (SPEC-results.md: "total/letter/points compute
 * automatically").
 */
export async function upsertResult(input: UpsertResultInput) {
  let totalMarks: number | null = null;
  let letterGrade: string | null = null;
  let gradePoints: number | null = null;

  if (!input.specialStatus) {
    if (input.sessionalMarks == null || input.midTermMarks == null || input.finalTermMarks == null) {
      throw new Error("Sessional, mid term, and final term marks are all required unless a special status (W/FW/I) is set.");
    }
    const scale = toScaleRows(await listGradingScale());
    totalMarks = computeTotalMarks(input.sessionalMarks, input.midTermMarks, input.finalTermMarks);
    const grade = gradeFor(totalMarks, scale);
    letterGrade = grade.letterGrade;
    gradePoints = grade.gradePoints;
  }

  const values = {
    courseOfferingId: input.courseOfferingId,
    studentUserId: input.studentUserId,
    sessionalMarks: input.specialStatus ? null : input.sessionalMarks!.toFixed(2),
    midTermMarks: input.specialStatus ? null : input.midTermMarks!.toFixed(2),
    finalTermMarks: input.specialStatus ? null : input.finalTermMarks!.toFixed(2),
    totalMarks: totalMarks !== null ? totalMarks.toFixed(2) : null,
    letterGrade,
    gradePoints: gradePoints !== null ? gradePoints.toFixed(2) : null,
    specialStatus: input.specialStatus,
    updatedBy: input.updatedBy,
  };

  const [row] = await db
    .insert(results)
    .values(values)
    .onConflictDoUpdate({
      target: [results.courseOfferingId, results.studentUserId],
      set: { ...values, updatedAt: new Date() },
    })
    .returning();
  return row;
}

export async function listResultsForOffering(courseOfferingId: string) {
  return db
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
    .orderBy(asc(studentProfiles.rollNumber));
}
