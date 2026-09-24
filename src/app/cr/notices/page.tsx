import { requireClassRep } from "@/lib/identity/require-role";
import { listAttachmentsForNoticesAsCr, listOwnClassNotices } from "@/lib/notices/cr";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { DocumentIcon, MegaphoneIcon } from "@/components/icons";
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
        <h1 className="text-xl font-semibold text-slate-900">Class Notices &amp; Events</h1>
        <p className="mt-1 text-sm text-slate-500">
          Scoped to your own class only — posting for another class or department/program-wide is rejected by the
          database, not just hidden here.
        </p>
      </div>

      <CrNoticeForm />

      {notices.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState icon={<MegaphoneIcon className="h-9 w-9" />} title="No notices posted for your class yet" />
          </CardBody>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {notices.map((n) => (
            <li key={n.id}>
              <Card>
                <CardBody>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-slate-900">{n.title}</span>
                        <Badge tone="brand">{n.category}</Badge>
                      </div>
                      {n.body && <p className="mt-1 text-sm text-slate-600">{n.body}</p>}
                      {n.eventStartAt && (
                        <div className="mt-1 text-xs text-slate-500">
                          Event: {new Date(n.eventStartAt).toLocaleString()} {n.location ? `· ${n.location}` : ""}
                        </div>
                      )}
                      {(attachmentsByNotice.get(n.id) ?? []).map((a) => (
                        <a
                          key={a.id}
                          href={a.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 flex items-center gap-1.5 text-xs text-indigo-600 hover:underline"
                        >
                          <DocumentIcon className="h-3.5 w-3.5 shrink-0" />
                          {a.fileName}
                        </a>
                      ))}
                    </div>
                    <form action={deleteCrNoticeAction}>
                      <input type="hidden" name="id" value={n.id} />
                      <button type="submit" className="text-xs text-rose-600 hover:underline">
                        Delete
                      </button>
                    </form>
                  </div>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
