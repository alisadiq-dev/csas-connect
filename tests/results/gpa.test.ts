import { describe, expect, it } from "vitest";
import { computeCgpa, computeGpa, computeSemesterGpa, type ResultForGpa } from "@/lib/results/gpa";

// Regression fixtures from the University of the Punjab's "Semester Rules
// and Regulations for Undergraduate Studies" (w.e.f. Fall 2023), Section
// "Calculation of CGPA" — fetched and read directly from the source PDF
// (page 10/19) on 2026-09-24. See SPEC-results.md's Testing Strategy note
// for the full discrepancy writeup on Example No. 2.

describe("computeGpa — official worked examples (Task 25)", () => {
  it("Example No. 1 (equal credit-hour courses) reproduces the document's own GPA of 2.45 exactly", () => {
    // Courses 531/534/547/550/571/572, each 3 credit hours; grade points
    // 3.00, 2.30, 4.00, 3.70, 0.00 ("Zero" — an F), 1.70. Total weighted
    // grade points 44.1 over 18 credit hours: 44.1/18 = 2.45, which the
    // document's own arithmetic confirms exactly.
    const results = [
      { creditHours: 3, gradePoints: 3.0 },
      { creditHours: 3, gradePoints: 2.3 },
      { creditHours: 3, gradePoints: 4.0 },
      { creditHours: 3, gradePoints: 3.7 },
      { creditHours: 3, gradePoints: 0.0 },
      { creditHours: 3, gradePoints: 1.7 },
    ];
    expect(computeGpa(results)).toBe(2.45);
  });

  it("Example No. 2 (unequal credit-hour courses): the document prints 2.94, but 44.3/15 is actually 2.95 — computeGpa implements the correct formula, not the misprint", () => {
    // Courses 510/511/512/550/575, credit hours 4/3/4/2/2, grade points
    // 3.00/3.70/2.30/4.00/2.00. Total weighted grade points 44.3 over 15
    // credit hours. The source document states "Grade Point average =
    // 44.3/15 = 2.94", but 44.3 / 15 = 2.9533..., which rounds to 2.95 under
    // any standard rounding rule (nearest, floor, or ceiling all agree here
    // since 2.9533 is closer to 2.95 than 2.94 — there is no rounding
    // convention that legitimately produces 2.94 from these inputs).
    // Example No. 1 in the same document checks out exactly (44.1/18 =
    // 2.45), so this is a one-off arithmetic error in the official PDF, not
    // a different intended formula. Shipping code that deliberately
    // reproduces a wrong number would fail the module's own stated
    // priority ("this is the number a demo audience will scrutinize most").
    const results = [
      { creditHours: 4, gradePoints: 3.0 },
      { creditHours: 3, gradePoints: 3.7 },
      { creditHours: 4, gradePoints: 2.3 },
      { creditHours: 2, gradePoints: 4.0 },
      { creditHours: 2, gradePoints: 2.0 },
    ];
    expect(computeGpa(results)).toBe(2.95);
  });

  it("the same document's CGPA worked example (93.3 / 31 credit hours) reproduces 3.01 exactly", () => {
    const results = [
      { creditHours: 3, gradePoints: 2.7 },
      { creditHours: 3, gradePoints: 4.0 },
      { creditHours: 3, gradePoints: 3.3 },
      { creditHours: 3, gradePoints: 4.0 },
      { creditHours: 4, gradePoints: 2.0 },
      { creditHours: 3, gradePoints: 1.7 },
      { creditHours: 3, gradePoints: 2.3 },
      { creditHours: 3, gradePoints: 3.3 },
      { creditHours: 2, gradePoints: 2.7 },
      { creditHours: 4, gradePoints: 4.0 },
    ];
    expect(computeGpa(results)).toBe(3.01);
  });

  it("returns 0 for an empty result set (zero total credit hours)", () => {
    expect(computeGpa([])).toBe(0);
  });
});

describe("computeSemesterGpa / computeCgpa — special_status exclusion (Task 25)", () => {
  const results: ResultForGpa[] = [
    { creditHours: 3, gradePoints: 4.0, specialStatus: null, semesterNumber: 1 },
    { creditHours: 3, gradePoints: 3.0, specialStatus: null, semesterNumber: 1 },
    // Withdrawn — no marks, no grade points; must be excluded, not treated as 0.
    { creditHours: 3, gradePoints: null, specialStatus: "W", semesterNumber: 1 },
    { creditHours: 3, gradePoints: null, specialStatus: "FW", semesterNumber: 1 },
    { creditHours: 3, gradePoints: null, specialStatus: "I", semesterNumber: 1 },
    { creditHours: 4, gradePoints: 2.0, specialStatus: null, semesterNumber: 2 },
  ];

  it("computeSemesterGpa only counts semester 1's non-special-status results", () => {
    // (3*4.0 + 3*3.0) / 6 = 21/6 = 3.5
    expect(computeSemesterGpa(results, 1)).toBe(3.5);
  });

  it("computeCgpa excludes W/FW/I across all semesters", () => {
    // (3*4.0 + 3*3.0 + 4*2.0) / (3+3+4) = 29/10 = 2.9
    expect(computeCgpa(results)).toBe(2.9);
  });

  it("a semester with only special-status results has GPA 0, not NaN", () => {
    const onlyWithdrawn: ResultForGpa[] = [{ creditHours: 3, gradePoints: null, specialStatus: "W", semesterNumber: 3 }];
    expect(computeSemesterGpa(onlyWithdrawn, 3)).toBe(0);
  });
});
