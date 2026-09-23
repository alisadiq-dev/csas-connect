# Implementation Plan: CSAS Connect

## Overview

A fully functional demo of a departmental portal for the University of the Punjab's Statistics department (BS Statistics, BS Biostatistics, BS Computational Statistics), covering academic structure, accounts/auth, attendance, results/GPA, timetables, and notices/events — deployed to a live free-tier URL with realistic seeded demo data, structured so real records can replace demo data later without a rebuild.

## Consistency Check (completed before planning)

Reviewed all six specs together for: role permissions, academic-terms linkage, and three-program demo coverage.

- **Role permissions** — consistent across all modules: admin creates records; teachers edit only *existing* attendance/results for their own assigned course offerings (no create rights); students are read-only on their own data; CR is limited to notices/events + timetable-viewing for their own class only, with no write access to attendance/results. `academic-structure`, `identity`, `attendance`, `results`, and `notices-events` all state this explicitly; `timetable` didn't state an access policy at all — **fixed** by adding one (open read for all authenticated users, since a timetable isn't private data; admin-only write).
- **Academic terms** — `academic_terms` (added to `academic-structure` per your correction) is correctly the thing `course_offerings` links to; every downstream module references `course_offerings`, not `classes`/`courses` directly, so the term linkage is transparent to them. No conflicts found.
- **Three-program demo coverage** — `academic-structure`'s seed requirement now explicitly covers all three programs with real BS Statistics data and clearly-labelled (non-official) demo data for the other two if verified curricula aren't found; `timetable` explicitly commits to seeding all three programs; `attendance`/`results` seed against "the demo classes seeded in academic-structure," which now means all three programs by construction.
- **Grading policy source — corrected during this review.** The document I'd originally cited (`pu.edu.pk/puac/download/Semester_Rules.pdf`) turned out to be the **Affiliated Colleges** edition. I located and verified the correct one: a Syndicate-approved notification (w.e.f. Fall 2023) addressed to **all Heads of University Teaching Departments** — the applicable document for a constituent department like Statistics. The letter-grade table, GPA formula, and CGPA formula are identical between both documents, but the **evaluation weightage differs** (25/35/40, not 15/25/60), and the correct document adds three non-GPA-counting statuses — **W**, **FW**, **I** — that the results module now models. `SPEC-results.md` and `SPEC-attendance.md` have been corrected accordingly.

**Unresolved assumptions carried into the plan** (from the specs' Open Questions, repeated here so they aren't lost):
- BS Biostatistics / BS Computational Statistics official curricula — not yet confirmed to exist publicly; the seed-data task will attempt to verify, and falls back to clearly-labelled fictional courses if nothing authoritative turns up.
- Real class period start/end times are unknown; seeding placeholder times (8:00 AM start, 50-minute periods) unless you provide the department's actual schedule.
- "Incomplete" (I) grade's special-exam follow-up workflow is not modeled — admin updates it manually once resolved.
- FW is never auto-assigned when a student crosses the 25% absence threshold — it's a manual admin action once officially decided, not an automated trigger.

## Architecture Decisions

- **Next.js (App Router, TypeScript) + Supabase (Postgres + Auth + Storage), deployed to Vercel** — free tier throughout, single codebase, no separate backend service.
- **Drizzle ORM with checked-in SQL migrations** — schema changes are reviewable diffs, never manual Supabase-dashboard edits.
- **Postgres Row-Level Security is the actual access-control mechanism**, not just application-layer checks — every table added by any module ships its RLS policy in the same migration that creates it (a standing boundary from `SPEC-identity.md`, applied project-wide).
- **GPA/CGPA and attendance percentages are computed on read, never cached** — avoids stale-derived-value bugs in a small demo dataset where correctness matters more than query performance.
- **`course_offerings` is the single reference point** every feature module (`attendance`, `results`, `timetable`) queries against — never `classes`/`courses` directly — so per-term history stays correct as classes advance semesters.

## Build Order (from the approved capability map)

`academic-structure` → `identity` → `attendance`, `results`, `timetable`, `notices-events` (parallelizable once `identity` ships) → deployment/polish.

## Task List

See `tasks/todo.md` for the full checklist. Summary by phase:

1. **Foundation & Tooling** (Tasks 1-4) — project scaffolding, migrations, test runner, and a proven Vercel deploy path, before any feature work.
2. **`academic-structure`** (Tasks 5-10) — schema, admin UI, three-program seed data.
3. **`identity`** (Tasks 11-17) — Supabase Auth wiring, RLS-enforced profile tables, account creation UI, login, seeded demo credentials.
4. **`attendance`** (Tasks 18-23), **`results`** (Tasks 24-29), **`timetable`** (Tasks 30-36), **`notices-events`** (Tasks 37-42) — can build in parallel once Phase 3 is checkpointed.
5. **Integration, polish, deployment** (Tasks 43-46) — mobile pass, end-to-end role journeys, production deploy, a demo script for presenting to the department.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| RLS policies written incorrectly (too permissive or too restrictive) | High — the whole "students only see their own records" requirement depends on this | Every module with sensitive data gets an integration test that proves access control at the raw Postgres level, not just through the app UI (established in `SPEC-identity.md`, enforced per-task below) |
| GPA/CGPA computed incorrectly | High — this is the number a demo audience will scrutinize most | `computeGpa` is tested against the two worked examples from the official PU document as regression fixtures, not just internal-logic unit tests |
| BS Biostatistics/Computational Statistics curricula can't be verified | Medium — affects demo credibility for those two programs | Clearly label unverified seed courses in the UI (`is_verified_curriculum` flag), don't present them as official |
| Free-tier hosting limits (Supabase/Vercel) hit during demo | Low-medium | Confirm free-tier deploy path works early (Task 4), before building features on top of it — fail fast if there's a blocker |
| Scope creep across 6 modules × 3 programs | Medium | Task list stays strictly within the six approved specs; anything not in a spec doesn't get built without discussing it first, per your original instruction |

## Open Questions

- Carried from specs (see above) — none of these block starting implementation, but should be resolved before the demo is presented to faculty.
