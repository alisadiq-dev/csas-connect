import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { authUsers } from "../schema-ref/auth.ts";
import { classes, programs } from "./academic-structure.ts";

// See SPEC-notices-events.md. `category` is deliberately free text (a
// suggested, non-enforced set of defaults), not an enum — the real
// taxonomy is explicitly deferred by the department.

export const audienceScopeEnum = pgEnum("audience_scope", ["department", "program", "class"]);
export type AudienceScopeEnum = (typeof audienceScopeEnum.enumValues)[number];

export const noticesEvents = pgTable("notices_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  body: text("body"),
  category: text("category").notNull(),
  audienceScope: audienceScopeEnum("audience_scope").notNull(),
  // Set when scope='program' or 'class'.
  programId: uuid("program_id").references(() => programs.id),
  // Set when scope='class'.
  classId: uuid("class_id").references(() => classes.id),
  // Free-text labeling for date sheets/result PDFs (e.g. "Semester 3") —
  // display metadata, not a hard link, since a date sheet may span multiple
  // classes/semesters.
  semesterLabel: text("semester_label"),
  eventStartAt: timestamp("event_start_at", { withTimezone: true }),
  eventEndAt: timestamp("event_end_at", { withTimezone: true }),
  location: text("location"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => authUsers.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

export const noticeAttachments = pgTable("notice_attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  noticeId: uuid("notice_id")
    .notNull()
    .references(() => noticesEvents.id),
  // Supabase Storage URL in production; a local `public/uploads/notices/...`
  // path in local dev (no cloud project connected yet — see
  // SPEC-notices-events.md Boundaries and src/lib/notices/attachments.ts).
  // Either way: never binary content in Postgres, only this URL string.
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
}).enableRLS();
