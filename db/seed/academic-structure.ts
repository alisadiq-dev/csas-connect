// Seeds the demo academic-structure data: all 3 programs, 4 batches each
// (currently at semesters 1/3/5/7) x Regular+Replica = 24 classes, course
// catalogs, one academic term ("Fall 2026"), and course offerings for every
// class's currently-active semester.
//
// Uses relative imports (not the `@/` alias) so it runs directly under
// Node's native TypeScript support: `npm run db:seed`.
//
// Curriculum sourcing:
// - BS Statistics: real course codes/titles/credit-hours, verified against
//   University of the Punjab's official "BS (4 Years) for Affiliated
//   Colleges" course-contents document (pu.edu.pk/images/file/BS-4years/
//   Code-STAT-Course-Details.pdf, codes STAT-101..STAT-204) for semesters
//   1-4, and the department's own "Syllabus for BS (5th to 8th Semester)
//   Statistics" page (pu.edu.pk/page/show/syllabus-BS-5th-to-8th-semester-
//   statistics.html) for semesters 5-8. Credit hours for semester 5/7
//   courses follow the Theory=3/Lab-or-Practical=1 pattern confirmed
//   without exception across every semester-1-6 course pair in the sourced
//   document (STAT-101/102, 103/104, 201/202, 203/204, 301/302, 303/304) —
//   not independently confirmed per-course beyond that pattern.
//   is_verified_curriculum = true.
// - BS Computational Statistics: real course codes/titles/credit hours from
//   University of the Punjab's actual "BS Computational Statistics and Data
//   Analytics" program (pu.edu.pk/home/bos2_pro/192/30) — the program this
//   spec's "BS Computational Statistics" corresponds to. is_verified_curriculum = true.
// - BS Biostatistics: no official University of the Punjab undergraduate
//   program found (confirmed by search — biostatistics appears at PU only
//   at graduate/research-recommendation level, not as this department's own
//   BS offering). Course names below are clearly-labelled fictional demo
//   data, plausible for an undergraduate biostatistics curriculum.
//   is_verified_curriculum = false — never presented as official.

import { db } from "../../src/db/index.ts";
import {
  academicTerms,
  batches,
  classes,
  courseOfferings,
  courses,
  programs,
} from "../../src/db/schema/academic-structure.ts";

type SectionType = "regular" | "replica";

async function main() {
  const existing = await db.select().from(programs);
  if (existing.length > 0) {
    console.log(`academic-structure already seeded (${existing.length} programs found) — skipping.`);
    return;
  }

  // --- Programs ---
  const [statProgram, biostatProgram, csProgram] = await db
    .insert(programs)
    .values([
      { name: "BS Statistics", code: "STAT" },
      { name: "BS Biostatistics", code: "BIOSTAT" },
      { name: "BS Computational Statistics", code: "CS" },
    ])
    .returning();
  console.log("Created 3 programs.");

  // --- Academic term ---
  const [fall2026] = await db
    .insert(academicTerms)
    .values({ season: "fall", year: 2026, name: "Fall 2026" })
    .returning();
  console.log("Created academic term: Fall 2026.");

  // --- Batches + classes ---
  // Today (seed authoring date) is Fall 2026. A batch currently at semester
  // N was admitted N-1 "half-years" ago; 2 semesters/year, Fall intake.
  const SEMESTER_TO_INTAKE_YEAR: Record<number, number> = {
    1: 2026, // just admitted, Fall 2026
    3: 2025, // admitted Fall 2025, now starting year 2 (semester 3)
    5: 2024, // admitted Fall 2024, now starting year 3 (semester 5)
    7: 2023, // admitted Fall 2023, now starting year 4 (semester 7)
  };

  async function createBatchAndClasses(programId: string, semester: number) {
    const intakeYear = SEMESTER_TO_INTAKE_YEAR[semester];
    const [batch] = await db.insert(batches).values({ programId, intakeYear }).returning();
    const created = await db
      .insert(classes)
      .values([
        { batchId: batch.id, sectionType: "regular" satisfies SectionType, currentSemester: semester },
        { batchId: batch.id, sectionType: "replica" satisfies SectionType, currentSemester: semester },
      ])
      .returning();
    return { batch, classes: created };
  }

  const programBatches: Record<string, Awaited<ReturnType<typeof createBatchAndClasses>>[]> = {};
  for (const program of [statProgram, biostatProgram, csProgram]) {
    const results = [];
    for (const semester of [1, 3, 5, 7]) {
      results.push(await createBatchAndClasses(program.id, semester));
    }
    programBatches[program.id] = results;
  }
  console.log("Created 12 batches (4 per program) and 24 classes (Regular + Replica each).");

  // --- Course catalogs ---
  type CourseSeed = {
    code: string;
    title: string;
    creditHours: string;
    curriculumSemester: number;
    isVerifiedCurriculum: boolean;
  };

  const statCourses: CourseSeed[] = [
    { code: "STAT-101", title: "Statistics-I", creditHours: "3.0", curriculumSemester: 1, isVerifiedCurriculum: true },
    { code: "STAT-102", title: "Statistics Lab-I", creditHours: "1.0", curriculumSemester: 1, isVerifiedCurriculum: true },
    { code: "STAT-201", title: "Statistics-III", creditHours: "3.0", curriculumSemester: 3, isVerifiedCurriculum: true },
    { code: "STAT-202", title: "Statistics Lab-III", creditHours: "1.0", curriculumSemester: 3, isVerifiedCurriculum: true },
    { code: "STAT-301", title: "Parametric and Non-Parametric Tests (Theory)", creditHours: "3.0", curriculumSemester: 5, isVerifiedCurriculum: true },
    { code: "STAT-302", title: "Parametric and Non-Parametric Tests (Practical)", creditHours: "1.0", curriculumSemester: 5, isVerifiedCurriculum: true },
    { code: "STAT-303", title: "Design and Analysis of Experiments (Theory)", creditHours: "3.0", curriculumSemester: 5, isVerifiedCurriculum: true },
    { code: "STAT-304", title: "Design and Analysis of Experiments (Practical)", creditHours: "1.0", curriculumSemester: 5, isVerifiedCurriculum: true },
    { code: "STAT-305", title: "Sampling Techniques (Theory)", creditHours: "3.0", curriculumSemester: 5, isVerifiedCurriculum: true },
    { code: "STAT-306", title: "Sampling Techniques (Practical)", creditHours: "1.0", curriculumSemester: 5, isVerifiedCurriculum: true },
    { code: "STAT-307", title: "Probability Theory (Theory)", creditHours: "3.0", curriculumSemester: 5, isVerifiedCurriculum: true },
    { code: "STAT-308", title: "Probability Theory (Practical)", creditHours: "1.0", curriculumSemester: 5, isVerifiedCurriculum: true },
    { code: "STAT-309", title: "Statistical Computer Packages", creditHours: "3.0", curriculumSemester: 5, isVerifiedCurriculum: true },
    { code: "STAT-401", title: "Statistical Inference-I (Theory)", creditHours: "3.0", curriculumSemester: 7, isVerifiedCurriculum: true },
    { code: "STAT-402", title: "Statistical Inference-I (Practical)", creditHours: "1.0", curriculumSemester: 7, isVerifiedCurriculum: true },
    { code: "STAT-403", title: "Basic Econometrics (Theory)", creditHours: "3.0", curriculumSemester: 7, isVerifiedCurriculum: true },
    { code: "STAT-404", title: "Basic Econometrics (Practical)", creditHours: "1.0", curriculumSemester: 7, isVerifiedCurriculum: true },
    { code: "STAT-416", title: "Categorical Data Analysis", creditHours: "3.0", curriculumSemester: 7, isVerifiedCurriculum: true },
    { code: "STAT-406", title: "Research Methodology", creditHours: "3.0", curriculumSemester: 7, isVerifiedCurriculum: true },
    { code: "STAT-411", title: "Time Series Analysis-I", creditHours: "3.0", curriculumSemester: 7, isVerifiedCurriculum: true },
    { code: "STAT-412", title: "Operations Research", creditHours: "3.0", curriculumSemester: 7, isVerifiedCurriculum: true },
  ];

  const csCourses: CourseSeed[] = [
    { code: "CSTA-101", title: "Introduction to Statistics", creditHours: "3.0", curriculumSemester: 1, isVerifiedCurriculum: true },
    { code: "SMTH-101", title: "Calculus", creditHours: "3.0", curriculumSemester: 1, isVerifiedCurriculum: true },
    { code: "STAT-205", title: "Statistical Computing", creditHours: "3.0", curriculumSemester: 3, isVerifiedCurriculum: true },
    { code: "CSTA-202", title: "Inferential Statistics", creditHours: "3.0", curriculumSemester: 3, isVerifiedCurriculum: true },
    { code: "CSTA-201", title: "Applied Regression Analysis", creditHours: "3.0", curriculumSemester: 3, isVerifiedCurriculum: true },
    { code: "CSTA-303", title: "Decision Theory", creditHours: "3.0", curriculumSemester: 5, isVerifiedCurriculum: true },
    { code: "CSTA-302", title: "Programming with Python", creditHours: "3.0", curriculumSemester: 5, isVerifiedCurriculum: true },
    // STAT-305 and STAT-404 below are real PU course codes shared with the
    // BS Statistics catalog (different course, different program) — the
    // `unique(program_id, code)` constraint is scoped per program, so the
    // same code legitimately exists in two programs' catalogs, matching how
    // PU itself reuses STAT-prefixed codes across combinations/programs.
    { code: "STAT-305", title: "Multivariate Analysis", creditHours: "3.0", curriculumSemester: 5, isVerifiedCurriculum: true },
    { code: "CSTA-401", title: "Fieldwork", creditHours: "3.0", curriculumSemester: 7, isVerifiedCurriculum: true },
    { code: "STAT-404", title: "Research Methods", creditHours: "3.0", curriculumSemester: 7, isVerifiedCurriculum: true },
    { code: "CSTA-403", title: "Artificial Intelligence", creditHours: "3.0", curriculumSemester: 7, isVerifiedCurriculum: true },
    { code: "CSTA-402", title: "Industrial Statistics", creditHours: "3.0", curriculumSemester: 7, isVerifiedCurriculum: true },
  ];

  // Fictional but plausible — no official University of the Punjab BS
  // Biostatistics program was found. Never presented as official (see
  // is_verified_curriculum = false and the UI's "Demo data" badge).
  const biostatCourses: CourseSeed[] = [
    { code: "BIOS-101", title: "Introduction to Biostatistics", creditHours: "3.0", curriculumSemester: 1, isVerifiedCurriculum: false },
    { code: "BIOS-102", title: "Human Biology for Statisticians", creditHours: "3.0", curriculumSemester: 1, isVerifiedCurriculum: false },
    { code: "BIOS-201", title: "Epidemiological Methods", creditHours: "3.0", curriculumSemester: 3, isVerifiedCurriculum: false },
    { code: "BIOS-202", title: "Statistical Computing for Health Data", creditHours: "3.0", curriculumSemester: 3, isVerifiedCurriculum: false },
    { code: "BIOS-301", title: "Survival Analysis", creditHours: "3.0", curriculumSemester: 5, isVerifiedCurriculum: false },
    { code: "BIOS-302", title: "Clinical Trials Design", creditHours: "3.0", curriculumSemester: 5, isVerifiedCurriculum: false },
    { code: "BIOS-303", title: "Categorical Data Analysis in Health Sciences", creditHours: "3.0", curriculumSemester: 5, isVerifiedCurriculum: false },
    { code: "BIOS-401", title: "Genetic Epidemiology", creditHours: "3.0", curriculumSemester: 7, isVerifiedCurriculum: false },
    { code: "BIOS-402", title: "Bioinformatics Fundamentals", creditHours: "3.0", curriculumSemester: 7, isVerifiedCurriculum: false },
    { code: "BIOS-403", title: "Advanced Research Methods in Public Health", creditHours: "3.0", curriculumSemester: 7, isVerifiedCurriculum: false },
  ];

  async function insertCourses(programId: string, seeds: CourseSeed[]) {
    return db
      .insert(courses)
      .values(seeds.map((c) => ({ programId, ...c })))
      .returning();
  }

  const insertedStatCourses = await insertCourses(statProgram.id, statCourses);
  const insertedCsCourses = await insertCourses(csProgram.id, csCourses);
  const insertedBiostatCourses = await insertCourses(biostatProgram.id, biostatCourses);
  console.log(
    `Created ${insertedStatCourses.length + insertedCsCourses.length + insertedBiostatCourses.length} courses across 3 programs.`,
  );

  // --- Course offerings: every class gets an offering for every course at
  // its own current semester, in Fall 2026 ---
  const courseSetsByProgram: Record<string, typeof insertedStatCourses> = {
    [statProgram.id]: insertedStatCourses,
    [csProgram.id]: insertedCsCourses,
    [biostatProgram.id]: insertedBiostatCourses,
  };

  let offeringCount = 0;
  for (const program of [statProgram, biostatProgram, csProgram]) {
    const programCourses = courseSetsByProgram[program.id];
    for (const { classes: batchClasses } of programBatches[program.id]) {
      for (const cls of batchClasses) {
        const coursesForSemester = programCourses.filter((c) => c.curriculumSemester === cls.currentSemester);
        if (coursesForSemester.length === 0) continue;
        await db.insert(courseOfferings).values(
          coursesForSemester.map((course) => ({
            classId: cls.id,
            courseId: course.id,
            termId: fall2026.id,
            semesterNumber: cls.currentSemester,
          })),
        );
        offeringCount += coursesForSemester.length;
      }
    }
  }
  console.log(`Created ${offeringCount} course offerings for Fall 2026.`);

  console.log("academic-structure seed complete.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
