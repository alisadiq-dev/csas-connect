# Spec: attendance

Module id: `attendance` | Depends on: `identity` | Depended on by: —

## Objective

Attendance records per course offering, per student, per session date. Admin creates the records (matching the agreed workflow: teachers report attendance to the admin office, who enters it); teachers may only correct existing records for their own assigned course offerings; students see their own attendance percentage, read-only.

**User:** Admin (data entry), teachers (corrections for their own courses), students (read-only view).

**Success looks like:** Admin can log a session's attendance for every student in a course offering. A teacher can fix a mis-marked record for their own course offering but cannot add a new session or record. A student sees, per course, how many sessions they've attended and their percentage.

## Tech Stack

Same as `identity` (Next.js/TS, Supabase Postgres + Auth, Drizzle, RLS).

## Data Model

```
attendance_sessions
  id                  uuid pk
  course_offering_id  uuid fk -> course_offerings.id
  session_date        date
  created_by          uuid fk -> admin_profiles.user_id   -- always an admin; enforced by RLS, not just convention
  unique(course_offering_id, session_date)

attendance_records
  id                  uuid pk
  session_id          uuid fk -> attendance_sessions.id
  student_user_id     uuid fk -> student_profiles.user_id
  status              enum('present', 'absent', 'leave')
  updated_by          uuid fk -> auth.users.id  -- audit: who last touched this record (admin or the assigned teacher)
  updated_at          timestamptz default now()
  unique(session_id, student_user_id)
```

**Attendance percentage** (per student, per course offering) is computed, not stored: `count(status='present') / count(*) * 100` over that student's `attendance_records` for the offering — avoids a cached value drifting from the underlying records.

**RLS:**
- `attendance_sessions` / `attendance_records`: admin has full `INSERT`/`UPDATE`/`SELECT`. Teachers get `UPDATE` only on `attendance_records` where the session's `course_offering.teacher_id = auth.uid()` — **no `INSERT` policy for teachers**, matching "teachers only correct existing records." Students get `SELECT` only where `student_user_id = auth.uid()`.

## Project Structure

Adds to existing layout:
```
src/
  app/
    admin/attendance/         -> admin: create a session, mark all students present/absent/leave
    (teacher)/attendance/     -> teacher: list own course offerings' sessions, correct records
    (student)/attendance/     -> student: own attendance % per course, session-by-session detail
  lib/attendance/
    percentage.ts             -> computes attendance % from records (used by student view + eventually results/probation logic)
```

## Code Style

```ts
// src/lib/attendance/percentage.ts
export function attendancePercentage(records: { status: Status }[]): number {
  if (records.length === 0) return 0;
  const present = records.filter(r => r.status === 'present').length;
  return Math.round((present / records.length) * 100);
}
```

## Testing Strategy

- Integration test proving a teacher's Postgres session can `UPDATE` a record for their own course offering but gets denied `INSERT`ing a new session or record (RLS-level, not app-level).
- Unit test on `attendancePercentage` for edge cases (zero sessions, all-leave).

## Boundaries

- **Always:** every attendance session and record is created by an admin action; teacher UI only ever renders an "edit" affordance, never "add."
- **Ask first:** whether "leave" counts toward the denominator differently from "absent" for percentage purposes. Per the confirmed source — University of the Punjab, "Semester Rules and Regulations for Undergraduate Studies," w.e.f. Fall 2023, `https://pu.edu.pk/images/file/BS-4years/Semester%20Rules%20and%20Regulations%20for%20Undergraduate%20Studies.pdf` (Notification No. D/6966/Acad., 04-09-2023; see `SPEC-results.md` for full provenance), Section 9.4: the 25% absent allowance and 5% HoD relaxation (which carries a fine — Rs. 2,000/short-attendance course, max Rs. 5,000/semester, not free as an earlier draft of this spec had read from the affiliated-colleges edition) are both "inclusive of absents (without prior approval) or leave (with prior approval)" — meaning leave and unapproved absence count the same way toward the threshold. Implementing "leave" and "absent" as the same denominator treatment per this confirmation.
- A student exceeding the 25% absence allowance in a course is meant to receive an **FW (Forced Withdrawal)** grade for that course (Section 9.2 of the same document), which is a `results` module concept (see `SPEC-results.md`). V1 does **not** auto-assign FW when the threshold is crossed — this is a formal administrative action; admin manually records `special_status = 'FW'` in `results` once it's officially decided. Flag if you want an automated threshold warning/flag instead.
- **Never:** let a teacher's RLS session touch a course offering they aren't assigned to, even via a crafted request — this is enforced at the database policy level, not just hidden UI.

## Success Criteria

- [ ] Admin creates an attendance session for a course offering and marks every enrolled student present/absent/leave.
- [ ] Assigned teacher can correct one student's status for an existing session; cannot create a new session (UI has no control for it, and RLS would reject it if attempted directly).
- [ ] Student sees per-course attendance percentage and a session-by-session breakdown for their own courses only.
- [ ] Seed script generates several weeks of realistic attendance history for the demo classes seeded in `academic-structure`.

## Open Questions

- How "leave" should count toward the 75% attendance threshold isn't confirmed against official policy (flagged above) — using the conservative "counts as not-present" interpretation until you or the department confirm otherwise.
