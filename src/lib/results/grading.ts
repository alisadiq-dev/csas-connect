// See SPEC-results.md. Grade thresholds and points live in `grading_scale`
// (config data), never hardcoded in this function — if the department later
// provides a different official table, it's a data update, not a code
// change (SPEC-results.md Boundaries).

export type GradingScaleRow = { minPercent: number; maxPercent: number; letterGrade: string; gradePoints: number };

/**
 * "A fraction of mark in a course is to be counted as '1' mark e.g. 64.1 or
 * 64.9 is to be shown as 65" — University of the Punjab, "Semester Rules and
 * Regulations for Undergraduate Studies," Section 11, item 5. Any nonzero
 * fractional part rounds UP, which is Math.ceil, not standard
 * round-to-nearest (64.1 would round DOWN to 64 under normal rounding).
 */
export function roundTotalMarks(raw: number): number {
  return Math.ceil(raw);
}

/**
 * sessional/mid-term/final-term marks are each already recorded on their
 * own weighted scale (out of 25/35/40 respectively) — confirmed directly
 * against the source document's own worked example (Section 11, item 6:
 * mid term 20.0 + sessional/"assignment" 16.4 + final 35.0 = 71.4, rounded
 * to 72), not a raw 0-100 subscore that needs multiplying by a percentage
 * weight. Total is their direct sum, then rounded per roundTotalMarks.
 */
export function computeTotalMarks(sessionalMarks: number, midTermMarks: number, finalTermMarks: number): number {
  return roundTotalMarks(sessionalMarks + midTermMarks + finalTermMarks);
}

/** Looks up {letterGrade, gradePoints} for a whole-number total-marks percent against grading_scale rows. */
export function gradeFor(totalMarks: number, scale: GradingScaleRow[]): { letterGrade: string; gradePoints: number } {
  const row = scale.find((r) => totalMarks >= r.minPercent && totalMarks <= r.maxPercent);
  if (!row) {
    throw new Error(`No grading_scale row covers a total of ${totalMarks}`);
  }
  return { letterGrade: row.letterGrade, gradePoints: Number(row.gradePoints) };
}
