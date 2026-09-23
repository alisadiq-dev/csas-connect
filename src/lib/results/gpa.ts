// See SPEC-results.md. GPA/CGPA are computed, not stored — no cache to go
// stale.

export function computeGpa(results: { creditHours: number; gradePoints: number }[]): number {
  const totalCredits = results.reduce((s, r) => s + r.creditHours, 0);
  if (totalCredits === 0) return 0;
  const totalPoints = results.reduce((s, r) => s + r.creditHours * r.gradePoints, 0);
  return Math.round((totalPoints / totalCredits) * 100) / 100;
}

export type ResultForGpa = {
  creditHours: number;
  gradePoints: number | null;
  specialStatus: "W" | "FW" | "I" | null;
  semesterNumber: number;
};

/** W/FW/I are excluded from both semester GPA and CGPA (Section 11.2 of the confirmed PU document). */
function isGpaEligible(r: ResultForGpa): r is ResultForGpa & { gradePoints: number } {
  return r.specialStatus === null && r.gradePoints !== null;
}

/** Semester GPA = Σ(credit_hours × grade_points) / Σcredit_hours over the student's results for one semester. */
export function computeSemesterGpa(results: ResultForGpa[], semesterNumber: number): number {
  const isEligibleForSemester = (r: ResultForGpa): r is ResultForGpa & { gradePoints: number } =>
    r.semesterNumber === semesterNumber && isGpaEligible(r);
  const eligible = results.filter(isEligibleForSemester);
  return computeGpa(eligible.map((r) => ({ creditHours: r.creditHours, gradePoints: r.gradePoints })));
}

/**
 * CGPA = the same formula over ALL of the student's results across every
 * semester — computed directly from course-level grade points, never as an
 * average of per-semester GPAs (explicit in Section 11: "Overall CGPA
 * should be directly computed from the individual courses GPs and not from
 * the GPAs of semesters").
 */
export function computeCgpa(results: ResultForGpa[]): number {
  const eligible = results.filter(isGpaEligible);
  return computeGpa(eligible.map((r) => ({ creditHours: r.creditHours, gradePoints: r.gradePoints })));
}
