# Spec: timetable

Module id: `timetable` | Depends on: `identity` | Depended on by: —

## Objective

Class timetables (7 periods/day, morning to afternoon) built from `course_offerings`, kept in their own section (not merged with notices/events). Students see their own class's timetable; teachers see their personal teaching schedule aggregated across all three programs, plus their next lecture.

**User:** Admin (builds timetables), students (view own class schedule), teachers (view own aggregated schedule).

## Tech Stack

Same as `identity`.

## Data Model

```
period_definitions           -- config: the department's 7 fixed period times
  period_number   int pk     -- 1-7
  start_time      time
  end_time        time

timetable_slots
  id                  uuid pk
  course_offering_id  uuid fk -> course_offerings.id
  day_of_week         enum('mon','tue','wed','thu','fri','sat')
  period_number       int fk -> period_definitions.period_number
  room                text null   -- "where available," per the original requirement — nullable, not required
  unique(course_offering_id, day_of_week, period_number)
```

**Double-booking prevention** (a class or a teacher can't be in two places at once) can't be expressed as a simple table constraint, since it spans a join (`timetable_slots` → `course_offerings` → `class_id`/`teacher_id`). It's enforced as application-level validation in `lib/timetable/validate.ts`, called before any admin create/update — documented here so it isn't silently skipped, not encoded as a raw DB constraint.

**RLS:** unlike `attendance`/`results`, a timetable isn't private academic data — the original requirement is about relevance (each viewer sees *their* schedule by default), not confidentiality. Policy: any authenticated user (`SELECT`) can read `timetable_slots`/`period_definitions`; only admin has `INSERT`/`UPDATE`/`DELETE`. The student/teacher "own schedule" views are an application-level filter on top of this open read access, not an RLS restriction.

## Project Structure

```
src/
  app/
    admin/timetable/           -> admin: build a class's weekly grid, assign course offerings to day/period/room
    (student)/timetable/       -> student: own class's weekly grid
    (teacher)/timetable/       -> teacher: own lectures across all programs, "next lecture" card
  lib/timetable/
    validate.ts                 -> double-booking checks (class-level, teacher-level)
    next-lecture.ts              -> given now(), find the next upcoming slot for a teacher or a class
```

## Code Style

```ts
// src/lib/timetable/next-lecture.ts
export function findNextLecture(slots: TimetableSlot[], now: Date): TimetableSlot | null {
  const currentDay = dayOfWeek(now);
  const upcoming = slots
    .filter(s => s.dayOfWeek === currentDay && s.period.startTime > timeOf(now))
    .sort((a, b) => a.period.startTime.localeCompare(b.period.startTime));
  return upcoming[0] ?? nextDaysLecture(slots, currentDay); // falls through to the next teaching day if none left today
}
```

## Testing Strategy

- Unit tests for `validate.ts`: same class double-booked in a slot → rejected; same teacher double-booked across two different programs' classes in the same slot → rejected.
- Unit tests for `findNextLecture` covering "later today," "none left today, next lecture is tomorrow," and "none left this week."

## Boundaries

- **Always:** run the double-booking validation on every admin create/update of a `timetable_slots` row, server-side (not just as a client-side form check).
- **Ask first:** if actual period start/end times differ from a reasonable default (e.g. 8:00-8:50, ... through 7 periods) — I'll seed placeholder times unless you give me the department's real schedule.
- **Never:** let a timetable edit silently overwrite another course offering's slot — a conflicting write should error, not clobber.

## Success Criteria

- [ ] Admin builds a weekly timetable for a class by assigning course offerings to day/period/room, with double-booking rejected for both class and teacher.
- [ ] Student sees their own class's timetable, including assigned teacher per course.
- [ ] Teacher sees a single aggregated schedule across all their course offerings, regardless of program, plus a "next lecture" summary (course, program, class, day/time, room).
- [ ] Seed script builds a full 7-period weekly timetable for every demo class across all three programs.

## Open Questions

- Real period start/end times aren't known yet — seeding placeholders (e.g. 8:00 AM start, 50-minute periods) unless you provide the department's actual schedule.
