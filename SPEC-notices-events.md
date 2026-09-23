# Spec: notices-events

Module id: `notices-events` | Depends on: `identity` | Depended on by: —

## Objective

A combined notice board and events section: departmental announcements, exam date sheets, semester result PDFs, deadlines, and events, all in one place, with department-wide vs. class-specific audience targeting. Admin has full access; the class representative (CR) can post/manage items scoped to their own class only; everyone else has read-only access to what's relevant to them.

**User:** Admin (full management), CR (own-class notices/events), everyone (read their relevant notices/events).

## Tech Stack

Same as `identity`, plus **Supabase Storage** for PDF uploads (date sheets, result PDFs).

## Data Model

```
notices_events
  id                  uuid pk
  title               text
  body                text null
  category            text          -- free text; suggested defaults below, not an enforced enum —
                                     -- exact categories are explicitly not finalized yet (per original spec)
  audience_scope      enum('department', 'program', 'class')
  program_id          uuid null fk -> programs.id   -- set when scope='program' or 'class'
  class_id            uuid null fk -> classes.id    -- set when scope='class'
  semester_label       text null    -- free-text labeling for date sheets/result PDFs, e.g. "Semester 3" — display metadata, not a hard link, since a date sheet may span multiple classes/semesters
  event_start_at       timestamptz null   -- set when this is an event
  event_end_at         timestamptz null
  location             text null
  created_by           uuid fk -> auth.users.id
  created_at           timestamptz default now()

notice_attachments
  id            uuid pk
  notice_id     uuid fk -> notices_events.id
  file_url      text     -- Supabase Storage URL
  file_name     text
```

Suggested (non-enforced) starting categories: "Announcement", "Date Sheet", "Result", "Deadline", "Event" — stored as plain text so the real taxonomy can be dropped in later without a migration.

**Visibility rule** (who can see what):
- `audience_scope = 'department'`: everyone.
- `audience_scope = 'program'`: everyone whose own program (student's class → batch → program, or teacher's any assigned course offering's program) matches `program_id`.
- `audience_scope = 'class'`: students/CR in that class, plus any teacher currently assigned a course offering for that class.

**RLS:**
- Admin: full `INSERT`/`UPDATE`/`DELETE`/`SELECT`.
- CR: `INSERT`/`UPDATE`/`DELETE` only where `audience_scope = 'class'` and `class_id` = their own class.
- Everyone: `SELECT` per the visibility rule above.
- Teachers: read-only in this module (no creation rights) — the original spec grants teachers editing power over attendance and results only, not notices.

## Project Structure

```
src/
  app/
    admin/notices/            -> admin: full CRUD, PDF upload, audience targeting
    (cr)/notices/              -> CR: create/manage own-class notices and events only
    notices/                    -> shared read view for all authenticated roles, filtered by visibility rule
  lib/notices/
    visibility.ts               -> the visibility-rule query, shared by the read view and RLS test suite
```

## Code Style

```ts
// src/lib/notices/visibility.ts
export function visibleTo(notice: NoticeEvent, viewer: Viewer): boolean {
  if (notice.audienceScope === 'department') return true;
  if (notice.audienceScope === 'program') return viewer.programIds.includes(notice.programId);
  return viewer.classIds.includes(notice.classId); // 'class'
}
```

## Testing Strategy

- RLS integration test: a CR's session can `INSERT` a class-scoped notice for their own class, gets denied for another class or for `department`/`program` scope.
- Unit tests for `visibility.ts` covering all three scopes for student, teacher, and CR viewers.

## Boundaries

- **Always:** every PDF upload goes through Supabase Storage with a generated URL stored in `notice_attachments` — never store binary content in Postgres.
- **Ask first:** if/when the department gives you the real notice category taxonomy, since it may be worth promoting `category` from free text to an enforced enum at that point.
- **Never:** let a CR create or edit a notice outside `audience_scope='class'` for their own class, even via direct API call (RLS-enforced).

## Success Criteria

- [ ] Admin posts a department-wide announcement, a class-specific notice, an exam date sheet (with PDF), and a result PDF (with PDF, labeled with program/class/semester via the metadata fields).
- [ ] CR posts a notice/event for their own class; attempting to post for another class or department-wide is rejected.
- [ ] Students/teachers see only notices/events matching their own program/class plus department-wide ones.
- [ ] Events show date, time, location, and description on a dedicated view within the same combined section.
- [ ] Seed script populates a realistic mix: a few department-wide notices, one date sheet PDF, one result PDF, a couple of class-specific notices, and at least one upcoming event.

## Open Questions

- Exact notice category taxonomy is explicitly deferred by you — using the free-text `category` field with suggested defaults until the department finalizes real names.
