import {
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

// See SPEC-academic-structure.md for the full data model this file backs.
// `course_offerings` is the join point every other module (attendance,
// results, timetable) references — never `courses`/`classes` directly.

export const sectionTypeEnum = pgEnum("section_type", ["regular", "replica"]);
export const termSeasonEnum = pgEnum("term_season", ["fall", "spring", "summer"]);

export const programs = pgTable("programs", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  active: boolean("active").notNull().default(true),
});

export const batches = pgTable(
  "batches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    programId: uuid("program_id")
      .notNull()
      .references(() => programs.id),
    intakeYear: integer("intake_year").notNull(),
  },
  (table) => [unique("batches_program_intake_year_unique").on(table.programId, table.intakeYear)],
);

export const classes = pgTable(
  "classes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => batches.id),
    sectionType: sectionTypeEnum("section_type").notNull(),
    currentSemester: integer("current_semester").notNull(),
  },
  (table) => [unique("classes_batch_section_type_unique").on(table.batchId, table.sectionType)],
);

export const courses = pgTable(
  "courses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    programId: uuid("program_id")
      .notNull()
      .references(() => programs.id),
    code: text("code").notNull(),
    title: text("title").notNull(),
    // Typically 1.0-4.0 per PU's confirmed "Semester Rules and Regulations
    // for Undergraduate Studies" (Section 5, item 2) — not a hard CHECK
    // constraint, since course design is the department's call.
    creditHours: numeric("credit_hours", { precision: 2, scale: 1 }).notNull(),
    curriculumSemester: integer("curriculum_semester").notNull(),
    isVerifiedCurriculum: boolean("is_verified_curriculum").notNull().default(false),
  },
  (table) => [unique("courses_program_code_unique").on(table.programId, table.code)],
);

export const academicTerms = pgTable(
  "academic_terms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    season: termSeasonEnum("season").notNull(),
    year: integer("year").notNull(),
    name: text("name").notNull().unique(),
  },
  (table) => [unique("academic_terms_season_year_unique").on(table.season, table.year)],
);

export const courseOfferings = pgTable(
  "course_offerings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id),
    termId: uuid("term_id")
      .notNull()
      .references(() => academicTerms.id),
    // Nullable placeholder until the `identity` module ships; Task 12
    // upgrades this to a real FK -> teacher_profiles.user_id.
    teacherId: uuid("teacher_id"),
    // Denormalized: preserves the class's semester at time of offering, so
    // history stays correct after the class advances semesters.
    semesterNumber: integer("semester_number").notNull(),
  },
  (table) => [
    unique("course_offerings_class_course_term_unique").on(
      table.classId,
      table.courseId,
      table.termId,
    ),
  ],
);
