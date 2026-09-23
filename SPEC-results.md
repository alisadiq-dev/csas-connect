# Spec: results

Module id: `results` | Depends on: `identity` | Depended on by: —

## Objective

Per-course results (sessional/mid/final marks → letter grade → grade points) and the GPA/CGPA engine, implemented against the University of the Punjab's confirmed grading policy (sourced from the official document, not assumed) and structured as config data so the real policy can be corrected later without a code change. Admin creates result entries; assigned teachers may only correct existing entries for their own courses; students see their own results and computed GPA/CGPA, read-only.

**User:** Admin (data entry), teachers (corrections for their own courses), students (read-only view).

## Tech Stack

Same as `identity`.

## Data Model

```
grading_scale                          -- config table, not hardcoded logic
  id              uuid pk
  min_percent     int
  max_percent     int
  letter_grade    text
  grade_points    numeric(3,2)
```

**Source (verified 2026-09-23):** University of the Punjab, "Semester Rules and Regulations for Undergraduate Studies," w.e.f. Fall 2023 — `https://pu.edu.pk/images/file/BS-4years/Semester%20Rules%20and%20Regulations%20for%20Undergraduate%20Studies.pdf`. Notification No. D/6966/Acad., dated 04-09-2023, signed by the Registrar; approved by the Syndicate on 27-07-2023 on the recommendation of the Academic Council dated 24-05-2023; explicitly copied to "All the Heads of University Teaching Departments" (item 3 of the distribution list) — confirmed as the applicable document for a constituent department like Statistics, distinct from the separate "Affiliated Colleges" edition (`pu.edu.pk/puac/download/Semester_Rules.pdf`) previously and incorrectly cited in an earlier draft of this spec. The notification's final line states existing prior regulations are repealed. Grade table and evaluation weightage below are from Section 11 and Section 10 of the attached Annexure-A respectively.

| Percent | Letter | Points |
|---|---|---|
| 85+ | A | 4.00 |
| 80-84 | A- | 3.70 |
| 75-79 | B+ | 3.30 |
| 70-74 | B | 3.00 |
| 65-69 | B- | 2.70 |
| 61-64 | C+ | 2.30 |
| 58-60 | C | 2.00 |
| 55-57 | C- | 1.70 |
| 50-54 | D | 1.00 |
| <50 or Absent | F | 0.00 |
| Withdrawal | W | not counted in GPA/CGPA |
| Forced Withdrawal | FW | not counted in GPA/CGPA (shown on transcript) — triggered by exceeding the attendance absence allowance, see `SPEC-attendance.md` |
| Incomplete | I | not counted in GPA/CGPA until resolved by a special exam within one month |

Evaluation weightage (Section 10, confirmed for teaching departments): **Sessional 25% / Mid Term 35% / Final Term 40%** — corrected from an earlier draft of this spec that had cited the affiliated-colleges document's 15/25/60 split.

```
results
  id                  uuid pk
  course_offering_id  uuid fk -> course_offerings.id
  student_user_id     uuid fk -> student_profiles.user_id
  sessional_marks     numeric(5,2)  -- 25% weight
  mid_term_marks      numeric(5,2)  -- 35% weight
  final_term_marks    numeric(5,2)  -- 40% weight
  total_marks         numeric(5,2) null  -- computed: weighted sum, fractional part rounds up (64.1/64.9 -> 65, per Section 11.5); null when special_status is set
  letter_grade        text null     -- looked up from grading_scale by total_marks; null when special_status is set
  grade_points        numeric(3,2) null -- looked up from grading_scale; null (excluded from GPA/CGPA sums) when special_status is set
  special_status       enum('W', 'FW', 'I') null  -- overrides marks-based grading; excluded from GPA/CGPA per Section 11.2
  updated_by          uuid fk -> auth.users.id
  updated_at          timestamptz default now()
  unique(course_offering_id, student_user_id)
```

**GPA/CGPA are computed, not stored** (same rationale as attendance percentage — no cache to go stale):
- **Semester GPA** = `Σ(course.credit_hours × result.grade_points) / Σ(course.credit_hours)` over the student's results whose `course_offering.semester_number` matches the target semester.
- **CGPA** = same formula over **all** of the student's results across all semesters — computed directly from course-level grade points, not as an average of semester GPAs (explicit in Section 11: "Overall CGPA should be directly computed from the individual courses GPs and not from the GPAs of semesters").

## Project Structure

```
src/
  app/
    admin/results/            -> admin: enter results for a course offering, all enrolled students
    (teacher)/results/        -> teacher: correct existing results for own course offerings
    (student)/results/        -> student: own results per course, semester GPA, CGPA
  lib/results/
    grading.ts                 -> percent -> {letter, points} lookup against grading_scale
    gpa.ts                      -> semester GPA and CGPA computation
db/seed/
  grading-scale.ts               -> seeds the table above from the sourced PU values
```

## Code Style

```ts
// src/lib/results/gpa.ts
export function computeGpa(results: { creditHours: number; gradePoints: number }[]): number {
  const totalCredits = results.reduce((s, r) => s + r.creditHours, 0);
  if (totalCredits === 0) return 0;
  const totalPoints = results.reduce((s, r) => s + r.creditHours * r.gradePoints, 0);
  return Math.round((totalPoints / totalCredits) * 100) / 100;
}
```

## Testing Strategy

- Unit tests for `computeGpa` against the two worked examples in the official document (equal-credit case → GPA 2.45, unequal-credit case → GPA 2.94) as regression fixtures, so the implementation is checked against the university's own examples, not just internal logic.
- Unit test for the fractional-marks rounding rule (64.1 and 64.9 both round to 65).
- Unit test confirming a result with `special_status` set (W/FW/I) is excluded from both semester GPA and CGPA computation.
- RLS integration test: teacher can `UPDATE` a result row only for their own course offering, no `INSERT` policy.

## Boundaries

- **Always:** grade thresholds and points live in `grading_scale`, never hardcoded in a function — if the department later provides a different official table, it's a data update.
- **Ask first:** any change to the CGPA formula (direct computation vs. averaging semester GPAs) — this is the one place a subtle implementation mistake produces a plausible-looking but wrong number.
- **Never:** let a teacher's session `INSERT` a new result row, or edit a result for a course offering they aren't assigned to (RLS-enforced).

## Success Criteria

- [ ] Admin enters sessional/mid/final marks for every student in a course offering; total, letter grade, and grade points compute automatically from `grading_scale`.
- [ ] Assigned teacher corrects an existing result; cannot create a new one.
- [ ] Student sees, for their own account only: per-course results, their current semester's GPA, and their CGPA.
- [ ] `computeGpa` matches both worked examples from the official PU document exactly.
- [ ] Seed script generates realistic results for the demo classes so GPA/CGPA display meaningfully varied numbers, not all-identical placeholder grades.

## Open Questions

- **Resolved:** the grading table and formulas are now confirmed against the document addressed to University Teaching Departments (not the Affiliated Colleges edition previously cited) — same letter-grade/points table, corrected evaluation weightage (25/35/40), and three additional non-GPA-counting statuses (W/FW/I) added above.
- `I` (Incomplete) formally requires resolution via a special exam within one month, after which it becomes a real grade. V1 does not model that follow-up workflow — admin can manually update the result once resolved. Flag if you want an explicit "pending resolution" queue.
- Promotion/probation/drop status (GPA/CGPA thresholds from Section 12/13 of the same document) is not in this module's scope — it's informational academic-standing data, not attendance/results entry. Flag if you want it added as a visible status on the student dashboard.
