# Spec: academic-structure

Module id: `academic-structure` | Depends on: — | Depended on by: `identity`, `attendance`, `results`, `timetable`, `notices-events`

## Objective

Provide the reference data model that every other module keys off: which programs exist, what classes (Regular/Replica) and batches (intake years) exist within them, what semester each class is currently at, the academic terms offerings happen in, and the course catalog with credit hours. This module has no end-user-facing accounts or auth (that's `identity`) and no attendance/results data itself — it's the taxonomy everything else attaches to.

**User:** Indirect — the admin will manage this data through screens built in this module, but the direct "users" are the other five modules that read from it.

**Success looks like:** An admin can define all three programs, create a batch, generate its Regular and Replica classes, populate the course catalog, and create term-linked course offerings for a class — all backed by real Postgres tables with a working admin UI. All three programs (BS Statistics, BS Biostatistics, BS Computational Statistics) get working demo data with Regular and Replica classes across all four currently-active semesters (1, 3, 5, 7) — none of the three is left structurally empty.

**Permissions (enforced in `identity`/`attendance`/`results`, noted here for consistency):** admins create new academic records (batches, classes, offerings, attendance sessions, result entries); teachers may only edit *existing* attendance and marks for their own assigned classes/courses, never create new records; students have read-only access to their own data; the class representative (CR) is limited to their own class's notices/timetable requests and has no write access to attendance or results.

## Tech Stack

- Next.js 14+ (App Router), TypeScript
- Postgres via Supabase (schema managed through SQL migrations, not the Supabase UI, so it's portable)
- Drizzle ORM (typed schema + migrations, avoids hand-written SQL scattered across the app)
- Tailwind CSS for UI (mobile-first, per the original "simple, organized, works on phone and desktop" requirement)

## Commands

```
Dev:      npm run dev
Build:    npm run build
Test:     npm test
Lint:     npm run lint
Migrate:  npm run db:migrate
Seed:     npm run db:seed
```

## Data Model

```
programs
  id              uuid pk
  name            text            -- "BS Statistics" | "BS Biostatistics" | "BS Computational Statistics"
  code            text unique     -- "STAT" | "BIOSTAT" | "CS"
  active          boolean default true

batches
  id              uuid pk
  program_id      uuid fk -> programs.id
  intake_year     int             -- e.g. 2024
  unique(program_id, intake_year)

classes
  id              uuid pk
  batch_id        uuid fk -> batches.id
  section_type    enum('regular', 'replica')
  current_semester int            -- 1-8, admin-advanced each term
  unique(batch_id, section_type)

courses
  id              uuid pk
  program_id      uuid fk -> programs.id
  code            text            -- department-defined, e.g. "STAT-301"
  title           text
  credit_hours    numeric(2,1)    -- typically 1.0-4.0 (see note below)
  curriculum_semester int         -- which semester (1-8) this is normally taught in
  is_verified_curriculum boolean default false -- true only if sourced from a confirmed official curriculum document, not fabricated for the demo
  unique(program_id, code)

academic_terms
  id              uuid pk
  season          enum('fall', 'spring', 'summer')
  year            int
  name            text unique     -- "Fall 2026", derived from season+year, stored for display
  unique(season, year)

course_offerings
  id              uuid pk
  class_id        uuid fk -> classes.id
  course_id       uuid fk -> courses.id
  term_id         uuid fk -> academic_terms.id
  teacher_id      uuid null       -- placeholder; becomes fk -> identity.teachers.id once that module ships
  semester_number int             -- the class's current_semester at time of this offering (denormalized, preserves history)
  unique(class_id, course_id, term_id)
```

`course_offerings` is the join point every other module (`attendance`, `results`, `timetable`) actually references — never `courses` or `classes` directly — so that historical records stay correct even after a class advances to the next semester, and so a course repeated by the same class in a later term (e.g. after being offered again for retakes) is a distinct, queryable offering rather than an overwrite.

**On the 1.0-4.0 credit hour range:** confirmed against `https://pu.edu.pk/images/file/BS-4years/Semester%20Rules%20and%20Regulations%20for%20Undergraduate%20Studies.pdf` (University of the Punjab, "Semester Rules and Regulations for Undergraduate Studies," w.e.f. Fall 2023, Notification No. D/6966/Acad. dated 04-09-2023, issued to all Heads of University Teaching Departments — full provenance recorded in `SPEC-results.md`): "a course may range from one credit hour to four credit hours" (Section 5, item 2). It is still *not* enforced as a hard database constraint (a `CHECK`), just the seed-data default, since course design is ultimately the department's call — but the range itself is now a confirmed rule, not an assumption. Note: this document states the BS 4-year minimum degree credit-hour total as 120 (Section 5 table) vs. 126 in the affiliated-colleges edition — not directly relevant to this table's schema, but recorded here in case total-credit-hour validation is added later.

## Project Structure

```
src/
  app/                    -> Next.js App Router routes
    admin/
      programs/           -> admin CRUD for programs
      batches/            -> admin CRUD for batches + class generation
      courses/            -> admin CRUD for course catalog
      offerings/          -> admin CRUD for course offerings
  db/
    schema/
      academic-structure.ts -> Drizzle table definitions for the tables above
    migrations/          -> generated SQL migrations
    seed/
      academic-structure.ts -> seed script (realistic BS Statistics demo data)
  lib/
    academic-structure/  -> query/mutation functions used by routes and by other modules
tests/
  academic-structure/     -> unit + integration tests
```

This `src/` layout is the shared project structure for the whole app — later module specs add to it rather than redefining it.

## Code Style

```ts
// src/lib/academic-structure/classes.ts
export async function createClassesForBatch(batchId: string) {
  return db.insert(classes).values([
    { batchId, sectionType: 'regular', currentSemester: 1 },
    { batchId, sectionType: 'replica', currentSemester: 1 },
  ]).returning();
}
```

- Functions in `lib/` are the only code that touches the database; routes call them, never raw queries.
- Table names: snake_case in Postgres, camelCase in Drizzle/TypeScript (Drizzle's default mapping).
- No `any`; Drizzle's inferred types flow through to route handlers and components.

## Testing Strategy

- **Framework:** Vitest for unit/integration tests, run against a local test Postgres (Supabase CLI's local stack or a Dockerized Postgres — decide in Plan phase).
- **Coverage focus:** `lib/academic-structure/*` functions (class generation, offering creation, uniqueness constraints) get integration tests hitting a real test DB — this is data-integrity-critical code, not UI.
- Admin UI screens get a smoke test (renders, form submits) rather than exhaustive UI testing at this stage — it's a demo, not a UI test suite.

## Boundaries

- **Always:** run `npm test` and `npm run build` before considering a task done; every migration is a checked-in SQL file, never a manual Supabase dashboard edit.
- **Ask first:** changing the `course_offerings` uniqueness constraint or the semester-history model (this is the piece every later module depends on — get it right once).
- **Never:** delete a batch/class/course that has any `course_offerings` referencing it (soft-delete/`active` flag instead) — real academic history must never silently disappear once other modules start writing against it.

## Success Criteria

- [ ] Admin can create a program, a batch under it, and its Regular+Replica classes through the UI.
- [ ] Admin can add courses to the catalog, create academic terms, and create term-linked course offerings for a specific class.
- [ ] Seed script populates **all three programs**, each with **four batches** (not one) so that Regular+Replica classes exist at each of the four currently-active semesters — one batch currently at semester 1, one at 3, one at 5, one at 7, per program (12 batches × 2 classes = 24 classes total).
- [ ] BS Statistics' course catalog is seeded from real, verifiable course names/structure and its `courses.is_verified_curriculum` flag is `true`.
- [ ] BS Biostatistics and BS Computational Statistics get seeded course catalogs too (not left empty) — real curricula where I can verify them, otherwise clearly-labelled fictional demo courses (`is_verified_curriculum = false`) with names that make clear in the UI they're placeholders (e.g. a "Demo data" badge wherever `is_verified_curriculum` is false), never presented as official.
- [ ] At least one academic term (e.g. "Fall 2026") is seeded and every seeded course offering links to it.
- [ ] Schema supports semesters 1-8 without code changes when the next cycle (2/4/6/8) begins — advancing `classes.current_semester` and adding new offerings is a data operation, not a migration.
- [ ] All data model tests pass against a real Postgres instance (not mocked).

## Open Questions

- Course codes: use PU's affiliated-college convention (100/200/300/400 by year) or department-specific codes? Defaulting to free-form `code` text field so the admin can enter whatever the department actually uses — no enforced numbering scheme in v1.
- I have not yet checked whether official BS Biostatistics / BS Computational Statistics curricula are publicly available (e.g. on pu.edu.pk) the way the BS Statistics structure is known to you as a current student. I'll attempt to verify during the seed-data task; if nothing authoritative turns up, both programs get clearly-labelled fictional courses per the success criteria above rather than blocking on this.
