import { boolean, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { authUsers } from "../schema-ref/auth.ts";
import { classes } from "./academic-structure.ts";

// See SPEC-identity.md. Every table here ships with RLS policies in the
// same migration that creates it (db/migrations/0002_identity_rls.sql) —
// the `.enableRLS()` calls below make drizzle-kit emit the
// `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` statements; the CREATE POLICY
// / GRANT statements are hand-written SQL appended to that migration (see
// the migration file itself for why: they reference `auth.uid()` and the
// `authenticated` role, which aren't part of the drizzle-managed schema).

export const adminProfiles = pgTable("admin_profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => authUsers.id),
  fullName: text("full_name").notNull(),
}).enableRLS();

export const teacherProfiles = pgTable("teacher_profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => authUsers.id),
  fullName: text("full_name").notNull(),
}).enableRLS();

export const studentProfiles = pgTable("student_profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => authUsers.id),
  fullName: text("full_name").notNull(),
  // "12-24": NN-YY, NN = sequence within class, YY = batch.intake_year % 100.
  // Generated once at student creation, then immutable.
  rollNumber: text("roll_number").notNull().unique(),
  classId: uuid("class_id")
    .notNull()
    .references(() => classes.id),
  isClassRep: boolean("is_class_rep").notNull().default(false),
}).enableRLS();
