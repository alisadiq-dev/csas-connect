import { requireAnySession } from "@/lib/identity/require-role";
import { listAttachmentsForNotices, listVisibleNotices } from "@/lib/notices/feed";

/**
 * Shared read view for every role, filtered by the visibility rule at the
 * database level (RLS — see notices_events_select_visible,
 * db/migrations/0006_notices_events.sql). Events (rows with event_start_at
 * set) render with date/time/location distinctly from plain notices within
 * this same combined section (SPEC-notices-events.md).
 */
export default async function NoticesFeedPage() {
  const session = await requireAnySession();
  const notices = await listVisibleNotices(session.userId);
  const attachments = await listAttachmentsForNotices(session.userId, notices.map((n) => n.id));
  const attachmentsByNotice = new Map<string, typeof attachments>();
  for (const a of attachments) {
    const list = attachmentsByNotice.get(a.noticeId);
    if (list) list.push(a);
    else attachmentsByNotice.set(a.noticeId, [a]);
  }

  const events = notices.filter((n) => n.eventStartAt !== null);
  const plainNotices = notices.filter((n) => n.eventStartAt === null);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 sm:px-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Notices &amp; Events</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Everything relevant to you — department-wide, your program, and your class.
          </p>
        </div>

        {events.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Events</h2>
            {events.map((n) => (
              <div key={n.id} className="rounded-lg border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="font-medium text-zinc-900 dark:text-zinc-50">{n.title}</div>
                <div className="mt-1 text-xs text-zinc-500">
                  {n.eventStartAt && new Date(n.eventStartAt).toLocaleString()}
                  {n.eventEndAt && ` – ${new Date(n.eventEndAt).toLocaleString()}`}
                  {n.location ? ` · ${n.location}` : ""}
                </div>
                {n.body && <p className="mt-2 text-zinc-600 dark:text-zinc-400">{n.body}</p>}
                {(attachmentsByNotice.get(n.id) ?? []).map((a) => (
                  <a key={a.id} href={a.fileUrl} target="_blank" rel="noreferrer" className="mt-2 block text-xs text-blue-700 hover:underline dark:text-blue-400">
                    📎 {a.fileName}
                  </a>
                ))}
              </div>
            ))}
          </section>
        )}

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Notices</h2>
          {plainNotices.length === 0 && <p className="text-sm text-zinc-500">Nothing yet.</p>}
          {plainNotices.map((n) => (
            <div key={n.id} className="rounded-lg border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-zinc-900 dark:text-zinc-50">{n.title}</span>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">{n.category}</span>
                <span className="text-xs text-zinc-400">
                  {n.audienceScope === "department" && "Department-wide"}
                  {n.audienceScope === "program" && "Program"}
                  {n.audienceScope === "class" && "Class"}
                </span>
                {n.semesterLabel && <span className="text-xs text-zinc-400">· {n.semesterLabel}</span>}
              </div>
              {n.body && <p className="mt-1 text-zinc-600 dark:text-zinc-400">{n.body}</p>}
              {(attachmentsByNotice.get(n.id) ?? []).map((a) => (
                <a key={a.id} href={a.fileUrl} target="_blank" rel="noreferrer" className="mt-1 block text-xs text-blue-700 hover:underline dark:text-blue-400">
                  📎 {a.fileName}
                </a>
              ))}
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
