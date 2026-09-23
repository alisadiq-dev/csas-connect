import { asc } from "drizzle-orm";
import { db } from "@/db";
import { academicTerms } from "@/db/schema/academic-structure";

const SEASON_LABEL: Record<"fall" | "spring" | "summer", string> = {
  fall: "Fall",
  spring: "Spring",
  summer: "Summer",
};

export async function createAcademicTerm(input: { season: "fall" | "spring" | "summer"; year: number }) {
  const name = `${SEASON_LABEL[input.season]} ${input.year}`;
  const [term] = await db
    .insert(academicTerms)
    .values({ season: input.season, year: input.year, name })
    .returning();
  return term;
}

export async function listAcademicTerms() {
  return db.select().from(academicTerms).orderBy(asc(academicTerms.year));
}
