import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { noticeAttachments, noticesEvents, type AudienceScopeEnum } from "@/db/schema/notices-events";

// Admin-only: raw `db` export (owner bypass), matching the same rationale
// as every other module's admin-side lib file — admin has full access per
// SPEC-notices-events.md.

export type CreateNoticeInput = {
  title: string;
  body?: string | null;
  category: string;
  audienceScope: AudienceScopeEnum;
  programId?: string | null;
  classId?: string | null;
  semesterLabel?: string | null;
  eventStartAt?: Date | null;
  eventEndAt?: Date | null;
  location?: string | null;
  createdBy: string;
};

export async function createNotice(input: CreateNoticeInput) {
  const [row] = await db.insert(noticesEvents).values(input).returning();
  return row;
}

export async function listAllNotices() {
  return db.select().from(noticesEvents).orderBy(desc(noticesEvents.createdAt));
}

export async function deleteNotice(id: string) {
  await db.delete(noticeAttachments).where(eq(noticeAttachments.noticeId, id));
  await db.delete(noticesEvents).where(eq(noticesEvents.id, id));
}

export async function addAttachment(noticeId: string, fileUrl: string, fileName: string) {
  const [row] = await db.insert(noticeAttachments).values({ noticeId, fileUrl, fileName }).returning();
  return row;
}

export async function listAttachmentsForNotices(noticeIds: string[]) {
  if (noticeIds.length === 0) return [];
  return db.select().from(noticeAttachments).where(inArray(noticeAttachments.noticeId, noticeIds));
}
