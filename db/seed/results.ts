// Seeds realistic, varied results for every seeded course offering across
// all 3 programs — varied per student (a spread of grade bands, not
// uniform), so GPA/CGPA differ meaningfully across demo students. Must run
// after `npm run db:seed` and `npm run db:seed:auth`. Relative imports (not
// `@/`) so it runs directly under Node's native TypeScript support:
// `npm run db:seed:results`.

import { asc, eq } from "drizzle-orm";
import { db } from "../../src/db/index.ts";
import { courseOfferings } from "../../src/db/schema/academic-structure.ts";
import { adminProfiles, studentProfiles } from "../../src/db/schema/identity.ts";
import { gradingScale, results } from "../../src/db/schema/results.ts";
import { computeTotalMarks, gradeFor } from "../../src/lib/results/grading.ts";

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function round2(n: number): string {
  return n.toFixed(2);
}

/** A student's stable "ability band" (0-1) drives all their marks, so one student's results are internally consistent (a strong student stays strong across courses) rather than pure per-record noise. */
function abilityFor(rand: () => number): number {
  const roll = rand();
  if (roll < 0.1) return 0.35 + rand() * 0.15; // struggling (may land below 50%)
  if (roll < 0.3) return 0.5 + rand() * 0.15; // borderline/average
  if (roll < 0.75) return 0.65 + rand() * 0.15; // solid majority
  return 0.85 + rand() * 0.15; // high performers
}

function marksFor(rand: () => number, ability: number, max: number): number {
  const noise = (rand() - 0.5) * 0.15; // +/-7.5% component-level variance
  const fraction = Math.min(1, Math.max(0, ability + noise));
  return Math.round(fraction * max * 100) / 100;
}

async function main() {
  const existing = await db.select().from(results).limit(1);
  if (existing.length > 0) {
    console.log("results already seeded — skipping.");
    return;
  }

  const [admin] = await db.select().from(adminProfiles).limit(1);
  if (!admin) {
    throw new Error("No admin account found — run `npm run db:seed:auth` first.");
  }

  const scaleRows = await db.select().from(gradingScale);
  if (scaleRows.length === 0) {
    throw new Error("grading_scale is empty — run `npm run db:migrate` (0004_results.sql seeds it).");
  }
  const scale = scaleRows.map((r) => ({
    minPercent: r.minPercent,
    maxPercent: r.maxPercent,
    letterGrade: r.letterGrade,
    gradePoints: Number(r.gradePoints),
  }));

  const offerings = await db.select().from(courseOfferings).orderBy(asc(courseOfferings.id));
  if (offerings.length === 0) {
    throw new Error("No course offerings found — run `npm run db:seed` first.");
  }

  // A student's ability band is stable ACROSS every course (keyed by
  // studentUserId, seeded once), not re-rolled per offering — otherwise
  // every student would regress to the same mean across enough courses.
  const abilityByStudent = new Map<string, number>();
  const studentRand = mulberry32(4242);

  let resultCount = 0;
  let specialStatusCount = 0;
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

    const rand = mulberry32(offeringIndex * 104729 + 7);

    for (const student of roster) {
      let ability = abilityByStudent.get(student.userId);
      if (ability === undefined) {
        ability = abilityFor(studentRand);
        abilityByStudent.set(student.userId, ability);
      }

      // A small minority get a special status instead of marks — mostly W
      // (withdrawal), occasionally I (incomplete). FW is left for manual
      // admin action per SPEC-attendance.md's boundary (never auto-assigned
      // from a threshold), so it's not randomly seeded here.
      const specialRoll = rand();
      if (specialRoll < 0.04) {
        const status = rand() < 0.7 ? "W" : "I";
        await db.insert(results).values({
          courseOfferingId: offering.id,
          studentUserId: student.userId,
          specialStatus: status,
          updatedBy: admin.userId,
        });
        specialStatusCount++;
        continue;
      }

      const sessional = marksFor(rand, ability, 25);
      const midTerm = marksFor(rand, ability, 35);
      const finalTerm = marksFor(rand, ability, 40);
      const totalMarks = computeTotalMarks(sessional, midTerm, finalTerm);
      const { letterGrade, gradePoints } = gradeFor(totalMarks, scale);

      await db.insert(results).values({
        courseOfferingId: offering.id,
        studentUserId: student.userId,
        sessionalMarks: round2(sessional),
        midTermMarks: round2(midTerm),
        finalTermMarks: round2(finalTerm),
        totalMarks: round2(totalMarks),
        letterGrade,
        gradePoints: round2(gradePoints),
        updatedBy: admin.userId,
      });
      resultCount++;
    }

    offeringIndex++;
  }

  console.log(`Created ${resultCount} graded results and ${specialStatusCount} special-status (W/I) results across ${offerings.length} course offerings.`);
  console.log("results seed complete.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
