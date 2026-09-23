import { describe, expect, it } from "vitest";
import { computeTotalMarks, gradeFor, roundTotalMarks, type GradingScaleRow } from "@/lib/results/grading";

const SCALE: GradingScaleRow[] = [
  { minPercent: 85, maxPercent: 100, letterGrade: "A", gradePoints: 4.0 },
  { minPercent: 80, maxPercent: 84, letterGrade: "A-", gradePoints: 3.7 },
  { minPercent: 75, maxPercent: 79, letterGrade: "B+", gradePoints: 3.3 },
  { minPercent: 70, maxPercent: 74, letterGrade: "B", gradePoints: 3.0 },
  { minPercent: 65, maxPercent: 69, letterGrade: "B-", gradePoints: 2.7 },
  { minPercent: 61, maxPercent: 64, letterGrade: "C+", gradePoints: 2.3 },
  { minPercent: 58, maxPercent: 60, letterGrade: "C", gradePoints: 2.0 },
  { minPercent: 55, maxPercent: 57, letterGrade: "C-", gradePoints: 1.7 },
  { minPercent: 50, maxPercent: 54, letterGrade: "D", gradePoints: 1.0 },
  { minPercent: 0, maxPercent: 49, letterGrade: "F", gradePoints: 0.0 },
];

describe("roundTotalMarks (Task 25) — fractional marks round UP, not to nearest", () => {
  it("64.1 rounds up to 65", () => expect(roundTotalMarks(64.1)).toBe(65));
  it("64.9 rounds up to 65", () => expect(roundTotalMarks(64.9)).toBe(65));
  it("a whole number is unaffected", () => expect(roundTotalMarks(70)).toBe(70));
});

describe("computeTotalMarks (Task 25)", () => {
  it("reproduces the source document's own worked example: mid 20.0 + sessional 16.4 + final 35.0 = 71.4, rounded to 72", () => {
    expect(computeTotalMarks(16.4, 20.0, 35.0)).toBe(72);
  });
});

describe("gradeFor (Task 25)", () => {
  it("looks up the letter/points for the document's own example (72 -> B, 3.00)", () => {
    expect(gradeFor(72, SCALE)).toEqual({ letterGrade: "B", gradePoints: 3.0 });
  });

  it("covers every boundary of the confirmed PU grading table", () => {
    expect(gradeFor(85, SCALE).letterGrade).toBe("A");
    expect(gradeFor(100, SCALE).letterGrade).toBe("A");
    expect(gradeFor(84, SCALE).letterGrade).toBe("A-");
    expect(gradeFor(49, SCALE).letterGrade).toBe("F");
    expect(gradeFor(0, SCALE).letterGrade).toBe("F");
    expect(gradeFor(50, SCALE).letterGrade).toBe("D");
  });

  it("throws for a total outside 0-100 rather than silently misgrading", () => {
    expect(() => gradeFor(101, SCALE)).toThrow();
    expect(() => gradeFor(-1, SCALE)).toThrow();
  });
});
