import { desc, inArray } from "drizzle-orm";
import { noticeAttachments, noticesEvents } from "@/db/schema/notices-events";
import { withUserDb } from "@/lib/db/with-user";

// Shared read view for every role — a single RLS-enforced query path.
// notices_events_select_visible (db/migrations/0006_notices_events.sql)
// already implements the full department/program/class visibility rule
// (mirrored in src/lib/notices/visibility.ts for unit testing), including
// admin seeing everything, so this needs no app-layer filtering.

export async function listVisibleNotices(userId: string) {
  return withUserDb(userId, (tx) => tx.select().from(noticesEvents).orderBy(desc(noticesEvents.createdAt)));
}

export async function listAttachmentsForNotices(userId: string, noticeIds: string[]) {
  if (noticeIds.length === 0) return [];
  return withUserDb(userId, (tx) => tx.select().from(noticeAttachments).where(inArray(noticeAttachments.noticeId, noticeIds)));
}
