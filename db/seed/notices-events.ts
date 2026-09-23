// Seeds a realistic mix of notices/events: a few department-wide notices,
// one exam date sheet PDF, one semester result PDF, a couple of
// class-specific notices, and at least one upcoming event — per
// SPEC-notices-events.md's Success Criteria and Task 42's acceptance.
//
// PDFs are real files (see db/seed/lib/simple-pdf.ts), written under
// public/uploads/notices/ — the local Supabase Storage stand-in documented
// in SPEC-notices-events.md's Boundaries. Must run after `npm run db:seed`
// and `npm run db:seed:auth`. Relative imports (not `@/`) so it runs
// directly under Node's native TypeScript support: `npm run db:seed:notices-events`.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { asc, eq } from "drizzle-orm";
import { db } from "../../src/db/index.ts";
import { batches, classes, programs } from "../../src/db/schema/academic-structure.ts";
import { adminProfiles } from "../../src/db/schema/identity.ts";
import { noticeAttachments, noticesEvents } from "../../src/db/schema/notices-events.ts";
import { buildSimplePdf } from "./lib/simple-pdf.ts";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "notices");

async function writeDemoPdf(fileName: string, title: string, lines: string[]): Promise<string> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const pdf = buildSimplePdf(title, lines);
  await writeFile(path.join(UPLOAD_DIR, fileName), pdf);
  return `/uploads/notices/${fileName}`;
}

async function main() {
  const existing = await db.select().from(noticesEvents).limit(1);
  if (existing.length > 0) {
    console.log("notices-events already seeded — skipping.");
    return;
  }

  const [admin] = await db.select().from(adminProfiles).limit(1);
  if (!admin) {
    throw new Error("No admin account found — run `npm run db:seed:auth` first.");
  }

  const allPrograms = await db.select().from(programs).orderBy(asc(programs.name));
  if (allPrograms.length === 0) {
    throw new Error("No programs found — run `npm run db:seed` first.");
  }
  const statProgram = allPrograms.find((p) => p.code === "STAT") ?? allPrograms[0];

  const statClasses = await db
    .select({ id: classes.id, sectionType: classes.sectionType, currentSemester: classes.currentSemester, intakeYear: batches.intakeYear })
    .from(classes)
    .innerJoin(batches, eq(classes.batchId, batches.id))
    .where(eq(batches.programId, statProgram.id))
    .orderBy(asc(classes.currentSemester));

  if (statClasses.length < 2) {
    throw new Error("Not enough classes found for the demo program — run `npm run db:seed` first.");
  }
  const classA = statClasses[0];
  const classB = statClasses[Math.min(2, statClasses.length - 1)];

  let noticeCount = 0;

  // --- Department-wide notices ---
  await db.insert(noticesEvents).values([
    {
      title: "Fall 2026 semester begins",
      body: "Classes for Fall 2026 commence today across all three programs. Please check your individual class timetables.",
      category: "Announcement",
      audienceScope: "department",
      createdBy: admin.userId,
    },
    {
      title: "Library extended hours during exams",
      body: "The department library will remain open until 10 PM on weekdays during the mid-term and final examination periods.",
      category: "Announcement",
      audienceScope: "department",
      createdBy: admin.userId,
    },
    {
      title: "Fee submission deadline",
      body: "Semester fee must be submitted by the due date printed on the fee voucher to avoid a late fine.",
      category: "Deadline",
      audienceScope: "department",
      createdBy: admin.userId,
    },
  ]);
  noticeCount += 3;

  // --- Date sheet PDF (program-scoped) ---
  const dateSheetUrl = await writeDemoPdf(
    "fall-2026-date-sheet.pdf",
    "BS Statistics — Fall 2026 Final Examination Date Sheet",
    [
      "Semester 1: STAT-101 (Statistics-I) — Mon 09:00 AM",
      "Semester 1: STAT-102 (Statistics Lab-I) — Wed 11:00 AM",
      "Semester 3: STAT-201 (Statistics-III) — Tue 09:00 AM",
      "Semester 5: STAT-301 (Parametric and Non-Parametric Tests) — Thu 02:00 PM",
      "Semester 7: STAT-401 (Statistical Inference-I) — Fri 09:00 AM",
      "",
      "Venue: Department of Statistics examination halls.",
      "Bring your admit card and university ID.",
    ],
  );
  const [dateSheetNotice] = await db
    .insert(noticesEvents)
    .values({
      title: "Fall 2026 Final Examination Date Sheet",
      body: "Attached is the final examination date sheet for BS Statistics, Fall 2026.",
      category: "Date Sheet",
      audienceScope: "program",
      programId: statProgram.id,
      semesterLabel: "All semesters",
      createdBy: admin.userId,
    })
    .returning();
  await db.insert(noticeAttachments).values({ noticeId: dateSheetNotice.id, fileUrl: dateSheetUrl, fileName: "fall-2026-date-sheet.pdf" });
  noticeCount += 1;

  // --- Result PDF (class-scoped) ---
  const resultPdfUrl = await writeDemoPdf(
    "sem1-regular-result.pdf",
    "BS Statistics — Semester 1 (Regular) Provisional Result",
    [
      "This is a demo-generated provisional result summary card.",
      "See the Results section of the portal for individual, per-student results and GPA.",
      "Consolidated result cards are issued by the department at the end of each semester.",
    ],
  );
  const [resultNotice] = await db
    .insert(noticesEvents)
    .values({
      title: "Semester 1 Provisional Result (Regular)",
      body: "Provisional result for Semester 1, Regular class, is attached. Individual results and GPA are also available in the Results section.",
      category: "Result",
      audienceScope: "class",
      programId: statProgram.id,
      classId: classA.id,
      semesterLabel: "Semester 1",
      createdBy: admin.userId,
    })
    .returning();
  await db.insert(noticeAttachments).values({ noticeId: resultNotice.id, fileUrl: resultPdfUrl, fileName: "sem1-regular-result.pdf" });
  noticeCount += 1;

  // --- Class-specific notices (a couple) ---
  await db.insert(noticesEvents).values([
    {
      title: "Class trip permission slips due",
      body: "Students planning to attend the department study trip must submit signed permission slips to the class representative by Friday.",
      category: "Announcement",
      audienceScope: "class",
      programId: statProgram.id,
      classId: classA.id,
      createdBy: admin.userId,
    },
    {
      title: "Makeup lecture scheduled",
      body: "A makeup lecture for the missed session will be held this Saturday at 10 AM in the usual room.",
      category: "Announcement",
      audienceScope: "class",
      programId: statProgram.id,
      classId: classB.id,
      createdBy: admin.userId,
    },
  ]);
  noticeCount += 2;

  // --- At least one upcoming event (department-wide) ---
  const eventStart = new Date();
  eventStart.setDate(eventStart.getDate() + 14);
  eventStart.setHours(10, 0, 0, 0);
  const eventEnd = new Date(eventStart);
  eventEnd.setHours(eventEnd.getHours() + 3);

  await db.insert(noticesEvents).values({
    title: "Annual Statistics Symposium",
    body: "Join us for a department-wide symposium featuring student research presentations, guest speakers, and a poster session.",
    category: "Event",
    audienceScope: "department",
    eventStartAt: eventStart,
    eventEndAt: eventEnd,
    location: "Department of Statistics Auditorium",
    createdBy: admin.userId,
  });
  noticeCount += 1;

  console.log(`Created ${noticeCount} notices/events (including 1 date sheet PDF, 1 result PDF, and 1 upcoming event).`);
  console.log("notices-events seed complete.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
