import { requireClassRep } from "@/lib/identity/require-role";
import { listAttachmentsForNoticesAsCr, listOwnClassNotices } from "@/lib/notices/cr";
import { CrNoticeForm } from "./notice-form";
import { deleteCrNoticeAction } from "./actions";

export default async function CrNoticesPage() {
  const session = await requireClassRep();
  const notices = await listOwnClassNotices(session.userId, session.classId);
  const attachments = await listAttachmentsForNoticesAsCr(session.userId, notices.map((n) => n.id));
  const attachmentsByNotice = new Map<string, typeof attachments>();
  for (const a of attachments) {
    const list = attachmentsByNotice.get(a.noticeId);
    if (list) list.push(a);
    else attachmentsByNotice.set(a.noticeId, [a]);
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Class Notices &amp; Events</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Scoped to your own class only — posting for another class or department/program-wide is rejected by the
          database, not just hidden here.
        </p>
      </div>

      <CrNoticeForm />

      <ul className="flex flex-col gap-3">
        {notices.length === 0 && <li className="text-sm text-zinc-500">No notices posted for your class yet.</li>}
        {notices.map((n) => (
          <li key={n.id} className="rounded-lg border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="font-medium text-zinc-900 dark:text-zinc-50">
                  {n.title} <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">{n.category}</span>
                </div>
                {n.body && <p className="mt-1 text-zinc-600 dark:text-zinc-400">{n.body}</p>}
                {n.eventStartAt && (
                  <div className="mt-1 text-xs text-zinc-500">
                    Event: {new Date(n.eventStartAt).toLocaleString()} {n.location ? `· ${n.location}` : ""}
                  </div>
                )}
                {(attachmentsByNotice.get(n.id) ?? []).map((a) => (
                  <a key={a.id} href={a.fileUrl} target="_blank" rel="noreferrer" className="mt-1 block text-xs text-blue-700 hover:underline dark:text-blue-400">
                    📎 {a.fileName}
                  </a>
                ))}
              </div>
              <form action={deleteCrNoticeAction}>
                <input type="hidden" name="id" value={n.id} />
                <button type="submit" className="text-xs text-red-700 hover:underline dark:text-red-400">
                  Delete
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
