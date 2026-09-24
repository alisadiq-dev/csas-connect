import { eq } from "drizzle-orm";
import { db } from "@/db";
import { adminProfiles } from "@/db/schema/identity";

/** Looks up one admin's own profile (own-lookup during an already-authenticated request). */
export async function getAdminByUserId(userId: string) {
  const [profile] = await db.select().from(adminProfiles).where(eq(adminProfiles.userId, userId));
  return profile ?? null;
}
