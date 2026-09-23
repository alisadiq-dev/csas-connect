# Task List: CSAS Connect

Full checklist backing `tasks/plan.md`. Tasks are ordered by dependency; Phase 4's four tracks (attendance/results/timetable/notices-events) can run in parallel once the Phase 3 checkpoint passes.

## Phase 1: Foundation & Tooling

- [x] **Task 1: Scaffold the Next.js project**
  - Acceptance: Next.js (App Router, TypeScript) app created; Tailwind configured; ESLint/Prettier configured; `npm run dev` serves a placeholder homepage.
  - Verify: `npm run build` succeeds; `npm run lint` passes clean.
  - Dependencies: None
  - Files: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `src/app/page.tsx`
  - Estimated scope: S

- [x] **Task 2: Set up Supabase project + Drizzle migrations** (local dev/test Postgres + Drizzle; real Supabase cloud project not created — see Task 4 note)
  - Acceptance: Supabase project created (or local dev stack via Supabase CLI); Drizzle configured with a working connection; `drizzle-kit` generates and applies a trivial migration.
  - Verify: `npm run db:migrate` runs against a fresh database without error.
  - Dependencies: Task 1
  - Files: `drizzle.config.ts`, `src/db/index.ts`, `db/migrations/0000_init.sql`
  - Estimated scope: S

- [x] **Task 3: Set up test runner against a real test database**
  - Acceptance: Vitest configured; a local/test Postgres (Supabase CLI local stack) is reachable from tests; one trivial integration test passes.
  - Verify: `npm test` passes.
  - Dependencies: Task 2
  - Files: `vitest.config.ts`, `tests/setup.ts`, `tests/smoke.test.ts`
  - Estimated scope: S

- [ ] **Task 4: Prove the free-tier deployment path end-to-end**
  - Acceptance: Repo linked to Vercel; Supabase connection env vars configured in Vercel; the placeholder homepage from Task 1 is live at a real shareable URL.
  - Verify: Manual check — visit the deployed URL, confirm it renders.
  - Dependencies: Task 1, Task 2
  - Files: Vercel project config (no repo files, or `vercel.json` if needed)
  - Estimated scope: XS

### Checkpoint: Foundation
- [x] `npm run build`, `npm test`, `npm run lint` all pass
- [ ] A live Vercel URL serves the placeholder app connected to Supabase — **BLOCKED**: needs a real Supabase project + `vercel login`, both requiring human browser/account action (see README "Cloud setup"); not created in this run, per the run's explicit scope
- [ ] Review with human before proceeding to `academic-structure`

## Phase 2: `academic-structure`

- [x] **Task 5: Schema + migration — programs, batches, classes**
  - Acceptance: `programs`, `batches`, `classes` tables exist per `SPEC-academic-structure.md`, with stated unique constraints.
  - Verify: Integration test inserts a program/batch/class and confirms the `unique(batch_id, section_type)` constraint rejects a duplicate.
  - Dependencies: Task 3
  - Files: `src/db/schema/academic-structure.ts`, `db/migrations/000X_academic_structure_core.sql`, `tests/academic-structure/schema.test.ts`
  - Estimated scope: S

- [x] **Task 6: Schema + migration — courses, academic_terms, course_offerings**
  - Acceptance: `courses`, `academic_terms`, `course_offerings` tables exist per spec, including the `is_verified_curriculum` flag and the `unique(class_id, course_id, term_id)` constraint.
  - Verify: Integration test confirms the offering uniqueness constraint and that `teacher_id` is nullable (placeholder until `identity` ships).
  - Dependencies: Task 5
  - Files: `src/db/schema/academic-structure.ts`, `db/migrations/000X_offerings.sql`, `tests/academic-structure/offerings.test.ts`
  - Estimated scope: S

- [x] **Task 7: `lib/academic-structure` query/mutation functions**
  - Acceptance: `createClassesForBatch`, `createCourseOffering`, and basic CRUD helpers for programs/courses exist and are the only code paths touching these tables.
  - Verify: `npm test` — unit/integration tests for each function, including the `createClassesForBatch` two-class generation.
  - Dependencies: Task 6
  - Files: `src/lib/academic-structure/*.ts`, `tests/academic-structure/lib.test.ts`
  - Estimated scope: M

- [x] **Task 8: Admin UI — programs and batches**
  - Acceptance: Admin can create a program, create a batch under it, and see its auto-generated Regular + Replica classes.
  - Verify: Manual check in browser; smoke test confirms the form submits and the class list renders.
  - Dependencies: Task 7
  - Files: `src/app/admin/programs/*`, `src/app/admin/batches/*`
  - Estimated scope: M

- [x] **Task 9: Admin UI — courses, terms, and offerings**
  - Acceptance: Admin can add a course to the catalog, create an academic term, and create a course offering linking a class + course + term.
  - Verify: Manual check; smoke test on form submission.
  - Dependencies: Task 7, Task 8
  - Files: `src/app/admin/courses/*`, `src/app/admin/offerings/*`
  - Estimated scope: M

- [x] **Task 10: Seed script — all three programs, 12 batches, verified/flagged curricula**
  - Acceptance: Seed script creates all 3 programs; 4 batches per program (currently at semesters 1/3/5/7) × Regular+Replica = 24 classes total; a real, verified BS Statistics course catalog; a Biostatistics/Computational Statistics catalog that's either verified (if an authoritative source is found) or clearly flagged fictional (`is_verified_curriculum = false`); one seeded academic term ("Fall 2026"); course offerings for all currently-active semesters.
  - Verify: `npm run db:seed` runs clean; a query confirms 24 classes and course offerings exist across all 3 programs.
  - Dependencies: Task 9
  - Files: `db/seed/academic-structure.ts`
  - Estimated scope: M

### Checkpoint: `academic-structure`
- [x] All academic-structure tests pass against a real Postgres instance
- [x] Admin UI can build out the full taxonomy manually, end to end
- [x] Seed script produces the full 3-program, 24-class demo dataset
- [ ] Review with human before proceeding to `identity`

## Phase 3: `identity`

- [x] **Task 11: Supabase Auth wiring + admin-API account creation helper**
  - Acceptance: Server-side helper creates a Supabase Auth user (email+password) via the Admin API using the service-role key; no public sign-up route exists anywhere in the app.
  - Verify: Manual check — helper creates a user, confirmed via Supabase dashboard/API.
  - Dependencies: Task 4
  - Files: `src/lib/identity/auth.ts`
  - Estimated scope: S

- [x] **Task 12: Schema + migration — profile tables and RLS policies**
  - Acceptance: `admin_profiles`, `teacher_profiles`, `student_profiles` exist; RLS policies enforce the rules in `SPEC-identity.md` (student sees own row only, etc.); `course_offerings.teacher_id` upgraded to a real FK.
  - Verify: Integration test — a simulated student Postgres session (using `auth.uid()`) can `SELECT` its own row and is denied on another student's row; **this test must fail before the RLS policy exists and pass after**, proving the policy is doing the work.
  - Dependencies: Task 6, Task 11
  - Files: `src/db/schema/identity.ts`, `db/migrations/000X_identity_rls.sql`, `tests/identity/rls.test.ts`
  - Estimated scope: M

- [x] **Task 13: Roll number generation**
  - Acceptance: `generateRollNumber(classId)` returns `{seq}-{yy}` per spec, sequential within a class.
  - Verify: Unit tests covering first-student, nth-student, and cross-class independence.
  - Dependencies: Task 12
  - Files: `src/lib/identity/roll-number.ts`, `tests/identity/roll-number.test.ts`
  - Estimated scope: XS

- [x] **Task 14: Middleware + `requireRole` helper + login page**
  - Acceptance: `middleware.ts` redirects unauthenticated requests to `/login`; `/login` authenticates via Supabase Auth (email+password) and redirects by role; `requireRole()` is the single auth-check helper used everywhere else.
  - Verify: Manual login test with a seeded account (created in Task 17); smoke test on the login form.
  - Dependencies: Task 11, Task 12
  - Files: `src/middleware.ts`, `src/app/login/page.tsx`, `src/lib/identity/require-role.ts`
  - Estimated scope: M

- [x] **Task 15: Admin UI — create teacher account**
  - Acceptance: Admin creates a teacher (email + password + name); teacher can immediately log in.
  - Verify: Manual check — create then log in as that teacher.
  - Dependencies: Task 14
  - Files: `src/app/admin/teachers/*`
  - Estimated scope: S

- [x] **Task 16: Admin UI — create student account**
  - Acceptance: Admin picks a class, system generates the roll number, admin sets email+password, optionally flags the student as CR; student can immediately log in.
  - Verify: Manual check — create then log in as that student.
  - Dependencies: Task 13, Task 14
  - Files: `src/app/admin/students/*`
  - Estimated scope: S

- [x] **Task 17: Seed demo accounts across all 3 programs**
  - Acceptance: Seed script creates working login credentials for a handful of students (incl. at least one CR) per seeded class, and a teacher per seeded course offering, across all 3 programs from `academic-structure`'s seed.
  - Verify: `npm run db:seed:auth` runs clean; spot-check login for one account per role.
  - Dependencies: Task 10, Task 16
  - Files: `db/seed/identity.ts`
  - Estimated scope: M

### Checkpoint: `identity`
- [x] RLS integration test proves database-level access control, not just UI hiding
- [x] Every role can log in with a seeded account and reach a (still mostly empty) role-appropriate dashboard shell
- [ ] Review with human before starting the parallel Phase 4 tracks

## Phase 4a: `attendance`

- [x] **Task 18: Schema + RLS migration — attendance_sessions, attendance_records**
  - Acceptance: Tables exist per spec; RLS allows admin full access, teacher `UPDATE`-only (no `INSERT`) scoped to their own course offerings, student `SELECT`-own-only.
  - Verify: RLS integration test covering all three roles, including a teacher `INSERT` attempt that must be denied.
  - Dependencies: Phase 3 checkpoint
  - Files: `src/db/schema/attendance.ts`, `db/migrations/000X_attendance.sql`, `tests/attendance/rls.test.ts`
  - Estimated scope: M

- [x] **Task 19: `lib/attendance` percentage calculation**
  - Acceptance: `attendancePercentage()` implemented per spec.
  - Verify: Unit tests including zero-sessions and all-leave edge cases.
  - Dependencies: Task 18
  - Files: `src/lib/attendance/percentage.ts`, `tests/attendance/percentage.test.ts`
  - Estimated scope: XS

- [x] **Task 20: Admin UI — create attendance session**
  - Acceptance: Admin selects a course offering + date, marks every enrolled student present/absent/leave in one screen.
  - Verify: Manual check; smoke test.
  - Dependencies: Task 19
  - Files: `src/app/admin/attendance/*`
  - Estimated scope: M

- [x] **Task 21: Teacher UI — correct existing records**
  - Acceptance: Teacher sees sessions for their own course offerings only, can edit a student's status; no "add session" control exists.
  - Verify: Manual check as a seeded teacher account.
  - Dependencies: Task 18, Task 20
  - Files: `src/app/(teacher)/attendance/*`
  - Estimated scope: S

- [x] **Task 22: Student UI — own attendance view**
  - Acceptance: Student sees per-course attendance % and session-by-session detail for their own courses only.
  - Verify: Manual check as a seeded student account; confirm another student's data is unreachable.
  - Dependencies: Task 18
  - Files: `src/app/(student)/attendance/*`
  - Estimated scope: S

- [x] **Task 23: Seed attendance history**
  - Acceptance: Several weeks of realistic attendance data generated for every seeded course offering across all 3 programs.
  - Verify: `npm run db:seed` includes this step without error; spot-check a student's percentage looks realistic (not 100% or 0% everywhere).
  - Dependencies: Task 22
  - Files: `db/seed/attendance.ts`
  - Estimated scope: S

## Phase 4b: `results`

- [x] **Task 24: Schema + RLS migration — grading_scale, results**
  - Acceptance: Tables exist per spec (including `special_status`); RLS matches the `attendance` pattern (admin full, teacher update-own-only, student select-own-only).
  - Verify: RLS integration test; seed `grading_scale` from the confirmed PU table as part of this task's migration.
  - Dependencies: Phase 3 checkpoint
  - Files: `src/db/schema/results.ts`, `db/migrations/000X_results.sql`, `tests/results/rls.test.ts`
  - Estimated scope: M

- [x] **Task 25: `lib/results` grading + GPA/CGPA engine**
  - Acceptance: `grading.ts` (percent→letter/points lookup) and `gpa.ts` (`computeGpa`) implemented per spec, including fractional-mark rounding and `special_status` exclusion.
  - Verify: Unit tests reproduce the two official worked examples (GPA 2.45, GPA 2.94) exactly; rounding test (64.1/64.9→65); exclusion test for W/FW/I.
  - Dependencies: Task 24
  - Files: `src/lib/results/grading.ts`, `src/lib/results/gpa.ts`, `tests/results/gpa.test.ts`
  - Estimated scope: M

- [x] **Task 26: Admin UI — enter results**
  - Acceptance: Admin selects a course offering, enters sessional/mid/final marks (or a special status) per enrolled student; total/letter/points compute automatically.
  - Verify: Manual check; smoke test.
  - Dependencies: Task 25
  - Files: `src/app/admin/results/*`
  - Estimated scope: M

- [x] **Task 27: Teacher UI — correct existing results**
  - Acceptance: Teacher edits existing results for their own course offerings only; no "add result" control.
  - Verify: Manual check as a seeded teacher account.
  - Dependencies: Task 24, Task 26
  - Files: `src/app/(teacher)/results/*`
  - Estimated scope: S

- [x] **Task 28: Student UI — own results, semester GPA, CGPA**
  - Acceptance: Student sees per-course results, current-semester GPA, and CGPA for their own account only.
  - Verify: Manual check as a seeded student account; confirm computed GPA matches a hand-calculated expectation for that student's seeded results.
  - Dependencies: Task 24
  - Files: `src/app/(student)/results/*`
  - Estimated scope: S

- [x] **Task 29: Seed realistic, varied results**
  - Acceptance: Results generated for seeded course offerings across all 3 programs with varied grades (not uniform), so GPA/CGPA differ meaningfully across demo students.
  - Verify: `npm run db:seed` includes this step; spot-check GPA variance across a few seeded students.
  - Dependencies: Task 28
  - Files: `db/seed/results.ts`
  - Estimated scope: S

## Phase 4c: `timetable`

- [x] **Task 30: Schema + migration — period_definitions, timetable_slots + RLS**
  - Acceptance: Tables exist per spec; RLS is open-read for authenticated users, admin-only write.
  - Verify: Integration test confirms a non-admin `INSERT` is denied and any authenticated `SELECT` succeeds.
  - Dependencies: Phase 3 checkpoint
  - Files: `src/db/schema/timetable.ts`, `db/migrations/000X_timetable.sql`, `tests/timetable/rls.test.ts`
  - Estimated scope: S

- [x] **Task 31: `lib/timetable` double-booking validation**
  - Acceptance: `validate.ts` rejects a class double-booked in a slot and a teacher double-booked across two classes/programs in the same slot.
  - Verify: Unit tests for both cases plus a valid non-conflicting case.
  - Dependencies: Task 30
  - Files: `src/lib/timetable/validate.ts`, `tests/timetable/validate.test.ts`
  - Estimated scope: S

- [x] **Task 32: `lib/timetable` next-lecture logic**
  - Acceptance: `findNextLecture()` implemented per spec.
  - Verify: Unit tests for "later today," "next teaching day," and "none this week" cases.
  - Dependencies: Task 30
  - Files: `src/lib/timetable/next-lecture.ts`, `tests/timetable/next-lecture.test.ts`
  - Estimated scope: S

- [x] **Task 33: Admin UI — build weekly timetable**
  - Acceptance: Admin assigns course offerings to day/period/room for a class; conflicting assignments are rejected with a clear error (server-side, using Task 31).
  - Verify: Manual check, including attempting a double-booking and confirming rejection.
  - Dependencies: Task 31
  - Files: `src/app/admin/timetable/*`
  - Estimated scope: M

- [x] **Task 34: Student UI — own class timetable**
  - Acceptance: Student sees their own class's weekly grid with assigned teacher per course.
  - Verify: Manual check as a seeded student account.
  - Dependencies: Task 33
  - Files: `src/app/(student)/timetable/*`
  - Estimated scope: S

- [x] **Task 35: Teacher UI — aggregated schedule + next lecture**
  - Acceptance: Teacher sees all their lectures across all programs in one grid, plus a next-lecture summary card (course, program, class, day/time, room).
  - Verify: Manual check as a seeded teacher account with offerings in more than one program.
  - Dependencies: Task 32, Task 33
  - Files: `src/app/(teacher)/timetable/*`
  - Estimated scope: M

- [x] **Task 36: Seed full weekly timetables**
  - Acceptance: All 24 seeded demo classes across 3 programs have a complete 7-period weekly grid with no conflicts.
  - Verify: `npm run db:seed` includes this step and passes the double-booking validation as part of seeding.
  - Dependencies: Task 35
  - Files: `db/seed/timetable.ts`
  - Estimated scope: M

## Phase 4d: `notices-events`

- [x] **Task 37: Schema + RLS migration — notices_events, notice_attachments + Storage bucket**
  - Acceptance: Tables exist per spec; a Supabase Storage bucket is configured for PDF attachments; RLS enforces admin full access, CR scoped to own-class-only writes, and the department/program/class visibility rule for reads.
  - Verify: RLS integration test — CR can insert for own class, denied for another class or department/program scope.
  - Dependencies: Phase 3 checkpoint
  - Files: `src/db/schema/notices-events.ts`, `db/migrations/000X_notices_events.sql`, `tests/notices-events/rls.test.ts`
  - Estimated scope: M

- [x] **Task 38: `lib/notices` visibility rule**
  - Acceptance: `visibleTo()` implemented per spec, covering department/program/class scopes.
  - Verify: Unit tests for all 3 scopes × student/teacher/CR viewer combinations.
  - Dependencies: Task 37
  - Files: `src/lib/notices/visibility.ts`, `tests/notices-events/visibility.test.ts`
  - Estimated scope: S

- [x] **Task 39: Admin UI — full CRUD + PDF upload + audience targeting**
  - Acceptance: Admin creates a notice/event with a category, audience scope, and optional PDF attachment (date sheet or result PDF), with program/class/semester labeling metadata.
  - Verify: Manual check, including a PDF upload round-trip.
  - Dependencies: Task 38
  - Files: `src/app/admin/notices/*`
  - Estimated scope: M

- [x] **Task 40: CR UI — own-class notices/events**
  - Acceptance: CR creates/edits/deletes notices/events scoped to their own class only; attempting another scope is rejected (relies on Task 37's RLS).
  - Verify: Manual check as a seeded CR account.
  - Dependencies: Task 37, Task 39
  - Files: `src/app/(cr)/notices/*`
  - Estimated scope: S

- [x] **Task 41: Shared read view — notices/events feed**
  - Acceptance: Every role sees a combined notices+events feed filtered by the visibility rule; events display date/time/location/description distinctly from notices within the same section.
  - Verify: Manual check across student/teacher/CR/admin accounts.
  - Dependencies: Task 38
  - Files: `src/app/notices/*`
  - Estimated scope: M

- [x] **Task 42: Seed realistic notices/events mix**
  - Acceptance: A few department-wide notices, one date sheet PDF, one result PDF, a couple of class-specific notices, and at least one upcoming event are seeded.
  - Verify: `npm run db:seed` includes this step; manual check that PDFs are viewable from the seeded records.
  - Dependencies: Task 41
  - Files: `db/seed/notices-events.ts`
  - Estimated scope: S

### Checkpoint: Phase 4 complete
- [x] All four tracks' tests pass; `npm test` is green project-wide
- [ ] Every module's Success Criteria (from its spec) verified manually at least once
- [ ] Review with human before final integration/deployment

## Phase 5: Integration, Polish, Deployment

- [x] **Task 43: Mobile responsiveness pass**
  - Acceptance: Every screen built in Phases 2-4 is usable at phone width (no horizontal scroll, tap targets reasonable) per the original "simple, works on phone and desktop" requirement.
  - Verify: Manual check at common phone viewport widths (e.g. 375px, 414px) for each role's key screens.
  - Dependencies: Phase 4 checkpoint
  - Files: touches existing UI files across `src/app/**`
  - Estimated scope: M (review-and-fix, not new features)

- [x] **Task 44: End-to-end role journeys**
  - Acceptance: A full manual (or scripted) run-through per role: admin builds a class/course/offering and enters attendance+results; teacher corrects a record and views their timetable; student views their dashboard, attendance, results, GPA/CGPA, timetable, and notices; CR posts a class notice.
  - Verify: Each journey completes without error against the seeded demo data.
  - Dependencies: Task 43
  - Files: none (verification task)
  - Estimated scope: S

- [ ] **Task 45: Production deployment**
  - Acceptance: Final schema + seed data pushed to the production Supabase project; app deployed to Vercel production; live URL fully functional with demo data, within free-tier limits.
  - Verify: Manual check — visit the production URL, log in as each seeded role, confirm data matches what was seeded.
  - Dependencies: Task 44
  - Files: deployment config only
  - Estimated scope: S

- [ ] **Task 46: Demo script + credentials handout**
  - Acceptance: A short document listing login credentials for one demo account per role and a suggested tour order, for presenting to department faculty.
  - Verify: Manual read-through — someone unfamiliar with the build could follow it and demo the app.
  - Dependencies: Task 45
  - Files: `docs/demo-script.md`
  - Estimated scope: XS

### Checkpoint: Complete
- [ ] All acceptance criteria across all 46 tasks met
- [ ] Live production URL ready to present
