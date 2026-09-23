// Seeds a full 7-period weekly timetable for every seeded demo class across
// all 3 programs, with no double-booking — validated through the same
// validateSlot() the admin UI uses, not a separate ad hoc check. Must run
// after `npm run db:seed` and `npm run db:seed:auth` (teacher assignments
// matter for teacher-conflict validation). Relative imports (not `@/`) so
// it runs directly under Node's native TypeScript support:
// `npm run db:seed:timetable`.

import { asc, eq } from "drizzle-orm";
import { db } from "../../src/db/index.ts";
import { classes, courseOfferings, courses } from "../../src/db/schema/academic-structure.ts";
import { periodDefinitions, timetableSlots, type DayOfWeekEnum } from "../../src/db/schema/timetable.ts";
import { validateSlot, type ExistingSlot } from "../../src/lib/timetable/validate.ts";

const DAYS: DayOfWeekEnum[] = ["mon", "tue", "wed", "thu", "fri", "sat"];

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function main() {
  const existingSlotCount = await db.select().from(timetableSlots).limit(1);
  if (existingSlotCount.length > 0) {
    console.log("timetable already seeded — skipping.");
    return;
  }

  const periods = await db.select().from(periodDefinitions).orderBy(asc(periodDefinitions.periodNumber));
  if (periods.length === 0) {
    throw new Error("period_definitions is empty — run `npm run db:migrate` (0005_timetable.sql seeds it).");
  }
  const periodNumbers = periods.map((p) => p.periodNumber);
  const allSlotKeys: { dayOfWeek: DayOfWeekEnum; periodNumber: number }[] = [];
  for (const day of DAYS) {
    for (const periodNumber of periodNumbers) {
      allSlotKeys.push({ dayOfWeek: day, periodNumber });
    }
  }

  const allClasses = await db.select().from(classes).orderBy(asc(classes.id));
  if (allClasses.length === 0) {
    throw new Error("No classes found — run `npm run db:seed` first.");
  }

  // In-memory mirror of every slot created so far this run, in the exact
  // shape validateSlot() expects — avoids a DB round-trip per slot and lets
  // every insert be validated against everything placed so far (including
  // other classes' teacher assignments), globally, in one pass.
  const existing: ExistingSlot[] = [];
  let created = 0;
  let classIndex = 0;

  for (const cls of allClasses) {
    const offeringRows = await db
      .select({ offering: courseOfferings, creditHours: courses.creditHours })
      .from(courseOfferings)
      .innerJoin(courses, eq(courseOfferings.courseId, courses.id))
      .where(eq(courseOfferings.classId, cls.id))
      .orderBy(asc(courseOfferings.id));

    if (offeringRows.length === 0) {
      classIndex++;
      continue;
    }

    // A per-class shuffled traversal order over the full 42 (day, period)
    // grid — searching the WHOLE week for each course's sessions (rather
    // than walking the grid once, offering-by-offering) is what lets a
    // course still find a free, non-conflicting slot even once the shared
    // teacher pool is heavily booked elsewhere.
    const classRand = mulberry32(classIndex * 2654435761 + 11);
    const slotOrder = shuffle(allSlotKeys, classRand);

    for (const { offering, creditHours } of offeringRows) {
      // Real BS courses meet more than once a week; a 1-credit lab/
      // practical typically meets once, a 3-credit theory course 2-3
      // times. Credit hours < 2 -> 1 session/week, otherwise 3.
      const targetSessions = Number(creditHours) < 2 ? 1 : 3;
      let placedForOffering = 0;

      for (const { dayOfWeek, periodNumber } of slotOrder) {
        if (placedForOffering >= targetSessions) break;

        const validation = validateSlot({ classId: cls.id, teacherId: offering.teacherId, dayOfWeek, periodNumber }, existing);
        if (!validation.ok) continue;

        const [slot] = await db
          .insert(timetableSlots)
          .values({ courseOfferingId: offering.id, dayOfWeek, periodNumber })
          .returning();
        existing.push({ id: slot.id, classId: cls.id, teacherId: offering.teacherId, dayOfWeek, periodNumber });
        created++;
        placedForOffering++;
      }
    }

    classIndex++;
  }

  console.log(`Created ${created} timetable slots across ${allClasses.length} classes.`);
  console.log("timetable seed complete.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
