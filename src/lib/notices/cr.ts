import { and, desc, eq, inArray } from "drizzle-orm";
import { noticeAttachments, noticesEvents } from "@/db/schema/notices-events";
import { withUserDb } from "@/lib/db/with-user";

// CR-scoped: every query goes through withUserDb (RLS-enforced) — a CR can
// only create/edit/delete notices/events where audience_scope='class' and
// class_id is their own class because notices_events_cr_insert/update/delete
// (db/migrations/0006_notices_events.sql) say so, not because this code
// filters by classId itself. Attempting another scope or another class is
// denied at the database level even if this code were bypassed.

export async function listOwnClassNotices(crUserId: string, classId: string) {
  return withUserDb(crUserId, (tx) =>
    tx
      .select()
      .from(noticesEvents)
      .where(and(eq(noticesEvents.audienceScope, "class"), eq(noticesEvents.classId, classId)))
      .orderBy(desc(noticesEvents.createdAt)),
  );
}

export type CrCreateNoticeInput = {
  classId: string;
  title: string;
  body?: string | null;
  category: string;
  semesterLabel?: string | null;
  eventStartAt?: Date | null;
  eventEndAt?: Date | null;
  location?: string | null;
};

export async function createOwnClassNotice(crUserId: string, input: CrCreateNoticeInput) {
  return withUserDb(crUserId, async (tx) => {
    const [row] = await tx
      .insert(noticesEvents)
      .values({ ...input, audienceScope: "class", createdBy: crUserId })
      .returning();
    return row;
  });
}

export async function deleteOwnClassNotice(crUserId: string, noticeId: string) {
  return withUserDb(crUserId, async (tx) => {
    await tx.delete(noticeAttachments).where(eq(noticeAttachments.noticeId, noticeId));
    return tx.delete(noticesEvents).where(eq(noticesEvents.id, noticeId)).returning();
  });
}

export async function addAttachmentAsCr(crUserId: string, noticeId: string, fileUrl: string, fileName: string) {
  return withUserDb(crUserId, (tx) => tx.insert(noticeAttachments).values({ noticeId, fileUrl, fileName }).returning());
}

export async function listAttachmentsForNoticesAsCr(crUserId: string, noticeIds: string[]) {
  if (noticeIds.length === 0) return [];
  return withUserDb(crUserId, (tx) => tx.select().from(noticeAttachments).where(inArray(noticeAttachments.noticeId, noticeIds)));
}
