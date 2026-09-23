# CSAS Connect — Demo Script

A short, self-contained guide for presenting CSAS Connect to the department. Written so someone who did not build
it can run the demo end to end. Runs entirely against the local dev environment (see "Before the demo" below) —
there is no live production URL yet; see "Task 45 status" at the bottom for why.

## Before the demo

From a fresh clone of the repo:

```
npm install
npm run db:local:start     # starts an isolated local Postgres (idempotent, always safe to re-run)
npm run db:migrate         # applies all checked-in schema migrations
npm run db:seed            # seeds all demo data: academic structure, accounts, attendance, results, timetable, notices
npm run dev                # http://localhost:3000
```

`npm run db:seed` is the umbrella command — it seeds, in dependency order: academic structure (3 programs, 24
classes) → identity (accounts) → attendance → results → timetable → notices/events. Every step is idempotent: if
you've already seeded, re-running `npm run db:seed` prints "already seeded — skipping" for each step rather than
duplicating data. If you ever want a truly clean slate, drop and recreate the local databases (see README.md's
"Local Postgres" section) before re-running the commands above.

Login credentials are **admin-assigned email + password**, not self-registration — there is no sign-up page by
design (SPEC-identity.md). Every account below was created by the seed scripts and works immediately.

## Demo credentials

| Role | Email | Password | Notes |
|---|---|---|---|
| Admin | `admin@csas-connect.local` | `AdminPass123!` | Full access to every module |
| Teacher | `teacher.stat.1@csas-connect.local` | `TeacherPass123!` | Dr. Ahmed Chaudhry — deliberately assigned course offerings in **two different programs** (BS Statistics and BS Biostatistics), so the aggregated cross-program timetable view has something real to show |
| Class Representative | `student.1-23.cf657c8a@csas-connect.local` | `StudentPass123!` | Saad Abbasi, roll number 1-23 — flagged `is_class_rep = true`; reaches the `/cr` area in addition to the normal student dashboard |
| Student | `student.10-23.6ab27ace@csas-connect.local` | `StudentPass123!` | Amna Butt, roll number 10-23 — has several graded results seeded, so GPA/CGPA aren't zero |

These exact accounts exist after a fresh `npm run db:seed` on an empty database. If the local database has been
re-seeded independently, the admin account's email/password stay fixed; for teacher/student/CR accounts, re-query
directly (`select email from auth.users ...` joined to `teacher_profiles`/`student_profiles`) since exact emails
are stable but this table lists the demo run's actual values as a convenience, not a guarantee across re-seeds.
Every seeded student's password is `StudentPass123!`, every seeded teacher's is `TeacherPass123!`, regardless of
which specific account you pick.

## Suggested tour order (~12-15 minutes)

1. **Landing page → Login** (`/`) — show the plain, admin-assigned-credentials login flow. No "sign up" link exists
   anywhere; that's deliberate (SPEC-identity.md).

2. **Admin: build the academic structure** (`/admin`) — walk through Programs → Batches & Classes → Courses & Terms
   → Offerings, pointing out the three real programs (BS Statistics, BS Biostatistics, BS Computational Statistics)
   and that Biostatistics course data is clearly flagged as unverified/demo (no official University of the Punjab
   undergraduate Biostatistics curriculum was found — see `SPEC-academic-structure.md`).

3. **Admin: attendance** (`/admin/attendance`) — pick any course offering, show the roster-marking screen (a whole
   class marked present/absent/leave in one screen), then note the several weeks of realistic seeded history.

4. **Admin: results** (`/admin/results`) — pick the same or another offering, show marks entry (sessional/mid/final,
   each on its own weighted sub-scale out of 25/35/40) and the automatic total/letter/grade-point computation.
   Mention the grading table is config data (`grading_scale`), not hardcoded logic.

5. **Admin: timetable** (`/admin/timetable`) — pick a class, show the weekly grid, and demonstrate the
   double-booking guard: try assigning a course to a day/period already taken by that class (or by a teacher who's
   already booked elsewhere at that time) and show the rejection.

6. **Admin: notices** (`/admin/notices`) — show a department-wide notice, the seeded exam date-sheet PDF and
   result-summary PDF (both open as real, valid PDFs), and audience targeting (department/program/class).

7. **Log out, log in as the Teacher** (`teacher.stat.1@csas-connect.local`) — go straight to
   `/teacher/timetable` and point out the "Next lecture" card and that the weekly grid spans **two different
   programs** in one aggregated view. Then `/teacher/attendance` or `/teacher/results`: open one session/result and
   correct a single student's entry — note there is no "add" control anywhere in the teacher area, only "edit."

8. **Log out, log in as the Class Representative** (`student.1-23.cf657c8a@csas-connect.local`) — show the normal
   student dashboard first (attendance %, results/GPA/CGPA, own-class timetable), then the "Class Rep area" link to
   `/cr/notices`: post a notice for their own class live, and mention that posting for another class or
   department/program-wide is rejected by the database (Row-Level Security), not just hidden in the UI.

9. **Log out, log in as the plain Student** (`student.10-23.6ab27ace@csas-connect.local`) — `/student/results` to
   show real varied GPA/CGPA (not a uniform placeholder number across students), and `/notices` to show the shared
   feed filtered to what's relevant to them (department + their program + their class).

10. **Close with the access-control story** — mention that every role boundary demonstrated above (student sees
    only their own data, teacher edits only their own courses, CR posts only for their own class) is enforced at
    the database level via Postgres Row-Level Security, not just hidden in the UI, and that this is proven by
    automated tests that fail without the policy and pass with it (`npm test` — 90 passing tests as of this run,
    including a dedicated RLS test suite per module).

## If something looks empty

Every seeded number (attendance %, GPA, timetable slot count) is randomized-but-deterministic per course/student,
so exact figures vary from account to account by design — that's intentional realism, not a bug. If a specific
page looks completely empty, it usually means `npm run db:seed` didn't fully complete; check its terminal output
for the per-module "X seed complete" lines.

## Task 45 status: production deployment — BLOCKED

Task 45 (push to a production Supabase project + deploy to Vercel) could not be completed in this run. Two things
require a human, not a workaround:

1. **A Vercel account and login.** No `vercel` CLI is installed/authenticated in this environment, and creating or
   logging into a Vercel account isn't something that can be done non-interactively. A human needs to run
   `vercel login` (or connect the GitHub repo directly from vercel.com) themselves.
2. **The Supabase cloud-project decision.** `.env.local` already has real Supabase cloud credentials
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) sitting there,
   commented out, pending your confirmation in a separate conversation. This run deliberately did not enable or use
   them — the whole architecture (this demo script included) is built to run identically against local Postgres or
   a real Supabase project, so once that decision is made, switching over is a config change, not a rebuild.

Once both are resolved, "production deployment" is: run the checked-in migrations
(`db/migrations/*.sql`, in order) against the real Supabase Postgres instance, run the seed scripts against it
(or hand-enter real department data instead — the seed scripts are for demo data only), link the repo to Vercel
with the real Supabase env vars set, and deploy. Everything else in the codebase (schema, RLS policies, app code)
needs zero changes for that switch — see `src/lib/db/with-user.ts` and `.env.local`'s own comments for why.
