CREATE TYPE "public"."term_season" AS ENUM('fall', 'spring', 'summer');--> statement-breakpoint
CREATE TABLE "academic_terms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"season" "term_season" NOT NULL,
	"year" integer NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "academic_terms_name_unique" UNIQUE("name"),
	CONSTRAINT "academic_terms_season_year_unique" UNIQUE("season","year")
);
--> statement-breakpoint
CREATE TABLE "course_offerings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"term_id" uuid NOT NULL,
	"teacher_id" uuid,
	"semester_number" integer NOT NULL,
	CONSTRAINT "course_offerings_class_course_term_unique" UNIQUE("class_id","course_id","term_id")
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"credit_hours" numeric(2, 1) NOT NULL,
	"curriculum_semester" integer NOT NULL,
	"is_verified_curriculum" boolean DEFAULT false NOT NULL,
	CONSTRAINT "courses_program_code_unique" UNIQUE("program_id","code")
);
--> statement-breakpoint
ALTER TABLE "course_offerings" ADD CONSTRAINT "course_offerings_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_offerings" ADD CONSTRAINT "course_offerings_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_offerings" ADD CONSTRAINT "course_offerings_term_id_academic_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."academic_terms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;