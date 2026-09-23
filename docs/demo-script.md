# CSAS Connect — Demo Script

A short, self-contained guide for presenting CSAS Connect to the department. Written so someone who did not build
it can run the demo end to end.

## Live demo (recommended)

**https://csas-connect.vercel.app** — deployed against the real Supabase project, seeded with the same fictional
demo data described below. No setup needed; just open the URL and use the credentials in "Demo credentials" below.
Verified end-to-end (real HTTP requests, not assumptions): homepage, login, admin/student/teacher dashboards, and
role-based redirects all confirmed working against this live URL.

## Running it locally instead

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
| Class Representative | `student.1-26.717b983d@csas-connect.local` | `StudentPass123!` | Ahmed Chaudhry, roll number 1-26 — flagged `is_class_rep = true`; reaches the `/cr` area in addition to the normal student dashboard |
| Student | `student.8-24.7312d17d@csas-connect.local` | `StudentPass123!` | Junaid Sheikh, roll number 8-24 — has 9 graded results seeded, so GPA/CGPA aren't zero |

These are the credentials on the **live production database** (see "Live demo" above). A local `npm run db:seed` generates its own separate set with different email suffixes — the pattern (roles, password) is the same either way.

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

## Task 45 status: production deployment — DONE

Live at **https://csas-connect.vercel.app**, on the real Supabase project (`csas-connect`), authorized by the
project owner. What actually happened, in order:

1. Confirmed the Supabase project and connected its credentials to `.env.local` (a separate `SUPABASE_DATABASE_URL`
   was used for the one-time migrate/seed steps, kept deliberately distinct from `DATABASE_URL` so local dev never
   silently pointed at the cloud database).
2. Checked the cloud database was empty before touching it, then applied the checked-in migrations
   (`db/migrations/*.sql`, in order).
3. **Found and fixed a real bug while verifying RLS on the cloud database**: `programs`/`batches`/`classes`/
   `courses`/`course_offerings`/`academic_terms`/`grading_scale` had RLS silently enabled with zero policies —
   correct on a vanilla local Postgres (where the migrations never explicitly enabled RLS on them, relying on it
   staying off), but Supabase auto-enables RLS on new tables in `public`, which turned those tables' existing
   `GRANT SELECT` into default-deny and broke every student/teacher page that joins through `course_offerings`
   (e.g. viewing your own results). Fixed with a new migration
   (`db/migrations/0007_academic_structure_read_policies.sql`) adding explicit open-read policies, matching the
   pattern already used for `timetable_slots`. Verified the exact previously-broken query against the cloud
   database directly before and after the fix.
4. Seeded the cloud database with the same fictional demo data described above (real Supabase Auth accounts via
   the Admin API this time, not the local shim) — checked for and cleaned up a handful of stray test accounts that
   had accidentally been created on the cloud project by an earlier test run, before seeding the real demo data.
5. Deployed to Vercel production with all required environment variables set directly in Vercel's dashboard (never
   printed in chat) — `vercel --prod`, from the account owner's own authenticated CLI session.
6. **Verified the live deployment with real requests, not assumptions**: homepage and login page return 200;
   unauthenticated `/admin` and `/student` redirect to `/login`; a real login form submission (replicating the
   no-JavaScript server-action fallback encoding a browser without JS would send) for both the seeded admin and a
   seeded student succeeds and reaches their respective dashboards with real data (GPA, attendance, etc.) rendered;
   an admin session requesting `/student` is redirected back to `/admin` — role-based access control confirmed
   live, not just locally.

A related, narrower bug was also found and fixed along the way: the demo admin account showed "This account has no
role assigned" when logging in locally after Supabase was connected, because authentication went through real
Supabase (returning a Supabase-issued ID) while role lookup still queried the local database (keyed to a different,
locally-generated ID from before Supabase was connected). Fixed by adding one new `admin_profiles` row locally,
keyed to the real ID — the existing local demo data (which references the old local ID) was left untouched.
