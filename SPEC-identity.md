# Spec: identity

Module id: `identity` | Depends on: `academic-structure` | Depended on by: `attendance`, `results`, `timetable`, `notices-events`

## Objective

Accounts and access control for four roles — student, teacher, class representative (CR), admin — with email+password login (both assigned by the admin) and roll-number identification for students. This module is what makes "a roll number alone doesn't grant access" and "students only ever see their own records" actually enforceable, not just a UI convention.

**User:** Every human who touches the portal. Admin manages accounts; everyone else authenticates through what this module builds.

**Success looks like:** Admin can create a student (assigned to a class, with an auto-generated roll number, admin-set email+password), a teacher, and promote a student to CR for their own class. Each role, once logged in, only sees what their role and row-ownership allow — enforced at the database level (Postgres Row-Level Security), not just hidden in the UI.

## Tech Stack

Adds to the `academic-structure` stack:
- **Supabase Auth** for `auth.users` (email+password, session cookies) — accounts are created server-side via the Supabase Admin API using the service-role key, never via public self-registration (there is no sign-up page; only the admin creates accounts).
- **Postgres Row-Level Security (RLS)** policies keyed off `auth.uid()`, applied to every table introduced in this and later modules — this is the actual access-control mechanism, not application-layer checks alone.

## Commands

Same as `academic-structure` (`npm run dev`, `npm test`, `npm run db:migrate`, `npm run db:seed`), plus:
```
Seed auth users: npm run db:seed:auth   -- creates demo auth.users + profiles together (must run after db:seed)
```

## Data Model

```
admin_profiles
  user_id         uuid pk fk -> auth.users.id
  full_name       text

teacher_profiles
  user_id         uuid pk fk -> auth.users.id
  full_name       text

student_profiles
  user_id         uuid pk fk -> auth.users.id
  full_name       text
  roll_number     text unique      -- "12-24": NN-YY, NN = sequence within class, YY = batch.intake_year % 100
  class_id        uuid fk -> classes.id
  is_class_rep    boolean default false
```

Schema change to `academic-structure`'s `course_offerings.teacher_id`: becomes a real foreign key to `teacher_profiles.user_id` once this module ships (it was a nullable placeholder column before).

**Roll number generation:** a function takes `class_id`, looks up `classes.batch_id -> batches.intake_year`, counts existing `student_profiles` rows in that class, and assigns the next sequence as `{seq}-{yy}`. Generated once at student creation, then immutable — it's the roll number, not a display label, and other modules (results PDFs, notices) reference it directly.

**Row-Level Security, established here and used by every later module:**
- `student_profiles`: a student can `SELECT` only their own row (`user_id = auth.uid()`). No student can query another student's row, by roll number or otherwise.
- `teacher_profiles`: a teacher can `SELECT` their own row; admin can `SELECT`/`INSERT`/`UPDATE` all.
- Tables in `attendance` and `results` (built later) inherit this pattern: student policies filter by `auth.uid()` matching the record's owning student; teacher policies filter by the teacher being the assigned `course_offerings.teacher_id` for that record's offering; admin bypasses via a service-role/admin policy.

## Project Structure

Adds to `academic-structure`'s layout:
```
src/
  app/
    login/                 -> single login page (email + password), redirects by role after auth
    admin/
      students/             -> admin CRUD: create student, assign class, generate roll number, set email+password
      teachers/              -> admin CRUD: create teacher, assign to course offerings
    (role)/                 -> route groups: (student), (teacher), (admin) dashboards, gated by middleware
  lib/
    identity/
      roll-number.ts         -> roll number generation function
      auth.ts                -> server-side helpers: getSession, requireRole
  middleware.ts               -> redirects unauthenticated users to /login; enforces role-based route access
db/
  migrations/                 -> adds identity tables + RLS policies (SQL, checked in)
  seed/
    identity.ts                -> creates demo auth.users + profiles for all seeded students/teachers
```

## Code Style

```ts
// src/lib/identity/roll-number.ts
export async function generateRollNumber(classId: string): Promise<string> {
  const cls = await db.query.classes.findFirst({ where: eq(classes.id, classId), with: { batch: true } });
  const yy = cls.batch.intakeYear % 100;
  const count = await db.$count(studentProfiles, eq(studentProfiles.classId, classId));
  return `${count + 1}-${yy}`;
}
```

- RLS policies are written as SQL in migration files, reviewed like any other schema change — never toggled from the Supabase dashboard.
- `requireRole('admin' | 'teacher' | 'student')` is the single helper every server action/route handler calls before touching data — no route reimplements its own auth check.

## Testing Strategy

- Integration tests run against a real local Postgres with RLS enabled (not just the app-layer mock) — the whole point of this module is that access control holds at the database level, so tests must prove a student's Postgres session literally cannot read another student's row, not just that the UI doesn't show it.
- Roll number generation gets a unit test covering sequential assignment within a class and the `NN-YY` format.

## Boundaries

- **Always:** every new table added by any module from here on gets an RLS policy in the same migration that creates it — no table ships "open" temporarily.
- **Ask first:** any change to how passwords are set (e.g. moving from admin-typed to auto-generated-and-emailed) — this is a real security/workflow decision, not a style choice.
- **Never:** build a public self-registration page, store a plaintext password anywhere in app code or logs, or let any query bypass RLS using the service-role key outside of admin-specific, clearly-marked server actions.

## Success Criteria

- [ ] Admin can create a teacher account (email + password) through the UI.
- [ ] Admin can create a student account: pick a class, system generates the roll number, admin sets email + password.
- [ ] Admin can flag a student as CR for their own class.
- [ ] A student logging in with their email+password sees only their own data; attempting to query another student's row (directly against Postgres, in a test) is denied by RLS, not just hidden by the UI.
- [ ] A teacher logging in sees only course offerings where they are the assigned teacher.
- [ ] Seed script creates demo accounts (with working login credentials) for enough students/teachers to populate the demo data seeded in `academic-structure` — at least a few students and their CR per class, and a teacher per course offering.

## Open Questions

- Bulk student import (CSV) for a new intake vs. one-by-one admin form: defaulting to **one-by-one form only** for v1 to stay in scope — bulk import can be a later ask if the department actually wants it.
- Password assignment: admin types the password directly when creating an account (simplest, matches "administrator assigns each student an email address and a password" literally) vs. auto-generated and shown once. Defaulting to **admin types it directly**; flag if you'd rather auto-generate.
