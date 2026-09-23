// Seeds several weeks of realistic attendance history for every seeded
// course offering across all 3 programs. "Realistic" means varied per
// student (a mix of mostly-present students, a few chronically-absent ones,
// occasional leave) — never uniformly 100% or 0% across the board.
//
// Must run after `npm run db:seed` and `npm run db:seed:auth`. Relative
// imports (not `@/`) so it runs directly under Node's native TypeScript
// support: `npm run db:seed:attendance`.

import { asc, eq } from "drizzle-orm";
import { db } from "../../src/db/index.ts";
import { courseOfferings } from "../../src/db/schema/academic-structure.ts";
import { adminProfiles, studentProfiles } from "../../src/db/schema/identity.ts";
import { attendanceRecords, attendanceSessions, type AttendanceStatusEnum } from "../../src/db/schema/attendance.ts";

const WEEKS_OF_HISTORY = 6;

// Simple deterministic PRNG (mulberry32) so re-running a dry check on an
// already-seeded database is reproducible — not used for anything
// security-sensitive, just demo-data variety.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Each student gets a stable "profile" (chronically-absent, average, near-perfect) so their pattern is consistent across sessions, not just per-record noise. */
function presentProbabilityFor(rand: () => number): number {
  const roll = rand();
  if (roll < 0.15) return 0.55; // chronically-absent minority
  if (roll < 0.35) return 0.78; // borderline
  return 0.93; // mostly-present majority
}

function pickStatus(rand: () => number, presentProbability: number): AttendanceStatusEnum {
  const roll = rand();
  if (roll < presentProbability) return "present";
  // Of the non-present outcomes, most are plain absences, a smaller share is approved leave.
  return rand() < 0.7 ? "absent" : "leave";
}

function mondayWeeksAgo(weeksAgo: number): Date {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun
  const diffToMonday = (day + 6) % 7;
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - diffToMonday);
  thisMonday.setDate(thisMonday.getDate() - weeksAgo * 7);
  return thisMonday;
}

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function main() {
  const existing = await db.select().from(attendanceSessions).limit(1);
  if (existing.length > 0) {
    console.log("attendance already seeded — skipping.");
    return;
  }

  const [admin] = await db.select().from(adminProfiles).limit(1);
  if (!admin) {
    throw new Error("No admin account found — run `npm run db:seed:auth` first.");
  }

  const offerings = await db.select().from(courseOfferings).orderBy(asc(courseOfferings.id));
  if (offerings.length === 0) {
    throw new Error("No course offerings found — run `npm run db:seed` first.");
  }

  let sessionCount = 0;
  let recordCount = 0;
  let offeringIndex = 0;

  for (const offering of offerings) {
    const roster = await db
      .select({ userId: studentProfiles.userId })
      .from(studentProfiles)
      .where(eq(studentProfiles.classId, offering.classId))
      .orderBy(asc(studentProfiles.rollNumber));
    if (roster.length === 0) {
      offeringIndex++;
      continue;
    }

    // One class meeting per week, on a day-of-week derived from the
    // offering so different courses don't all land on the same day.
    const rand = mulberry32(offeringIndex * 7919 + 13);
    const studentProbabilities = new Map(roster.map((s) => [s.userId, presentProbabilityFor(rand)]));

    for (let week = WEEKS_OF_HISTORY; week >= 1; week--) {
      const sessionDate = toDateString(mondayWeeksAgo(week));
      const [session] = await db
        .insert(attendanceSessions)
        .values({ courseOfferingId: offering.id, sessionDate, createdBy: admin.userId })
        .returning();
      sessionCount++;

      const values = roster.map((s) => ({
        sessionId: session.id,
        studentUserId: s.userId,
        status: pickStatus(rand, studentProbabilities.get(s.userId)!),
        updatedBy: admin.userId,
      }));
      await db.insert(attendanceRecords).values(values);
      recordCount += values.length;
    }

    offeringIndex++;
  }

  console.log(`Created ${sessionCount} attendance sessions and ${recordCount} attendance records across ${offerings.length} course offerings (${WEEKS_OF_HISTORY} weeks each).`);
  console.log("attendance seed complete.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
