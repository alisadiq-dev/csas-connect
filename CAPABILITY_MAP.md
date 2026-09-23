# Capability Map: CSAS Connect

Approved 2026-09-23. This is the index of what exists — module specs are named by the ids below.

## Context

CSAS Connect is a departmental portal for the Statistics department at the University of the Punjab, covering three programs (BS Statistics, BS Biostatistics, BS Computational Statistics), each with Regular and Replica classes. Built by a student as a working, fully-functional demo (not a mockup) to pitch to the department — no real student/teacher data yet, but the data model must let real records replace demo data later without a rebuild.

Stack: Next.js (TypeScript) + Postgres via Supabase, deployed to a free-tier live URL (Vercel).

## Module Table

| Module id | Responsibility | Depends on |
|---|---|---|
| `academic-structure` | Programs, Regular/Replica classes, batches/sessions, semesters (1-8), course catalog, credit hours | — |
| `identity` | Accounts for student/teacher/admin/CR roles, roll-number generation, email+password login, session/role-based access | `academic-structure` |
| `attendance` | Admin creates attendance records; teachers correct/update for assigned classes only; students view own % | `identity` |
| `results` | Admin creates results; teachers correct/update for assigned courses only; GPA/CGPA engine (University of the Punjab policy, config-driven); students view own results | `identity` |
| `timetable` | Per-program/class/semester schedules, 7 periods/day; student view (own class); teacher view (own lectures across all programs) | `identity` |
| `notices-events` | Combined notice board + events; department-wide vs. class-specific audience targeting; PDF uploads (date sheets, result PDFs); CR can post/manage for own class only | `identity` |

**Build order:** `academic-structure` → `identity` → `attendance`, `results`, `timetable`, `notices-events` (parallel once `identity` exists)

## Scope Decisions on Record

- All three programs in scope from the start, sharing one system and one codebase (not BS Statistics-only with others deferred).
- No standalone `admin` module — admin CRUD lives inside each module's own spec (e.g., `results` owns the admin screen for entering results).
- Roles: student, teacher, class representative (CR), admin. CR is a permission level inside `identity`, scoped to `notices-events` (own class) and read-only `timetable` — no write access to `attendance`/`results`.
- Data entry model: **admin creates new records** (attendance sessions, result entries). **Teachers may only correct/update existing records** for their assigned classes/courses — they do not add new ones.
- Login: roll number is the student identifier, but authentication is by **email + password**, both assigned by the admin (not the earlier roll-number+email-only model).
- Grading: 4.0 scale per University of the Punjab's confirmed policy (see `SPEC-results.md` for the sourced grade table and formulas), implemented as config data, not hardcoded.
- Timetable: 7 class periods/day, morning to afternoon; kept in its own section (not merged with notices/events).
- Notices + events are combined into one section/module.
