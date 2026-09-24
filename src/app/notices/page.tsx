import { requireAnySession } from "@/lib/identity/require-role";
import { listAttachmentsForNotices, listVisibleNotices } from "@/lib/notices/feed";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { CalendarCheckIcon, BellIcon, DocumentIcon } from "@/components/icons";

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

  const scopeLabel = (scope: (typeof notices)[number]["audienceScope"]) => {
    if (scope === "department") return "Department-wide";
    if (scope === "program") return "Program";
    return "Class";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 sm:px-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Notices &amp; Events</h1>
          <p className="mt-1 text-sm text-slate-500">
            Everything relevant to you — department-wide, your program, and your class.
          </p>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-slate-900">Events</h2>
          {events.length === 0 ? (
            <Card>
              <CardBody>
                <EmptyState icon={<CalendarCheckIcon className="h-9 w-9" />} title="No upcoming events" />
              </CardBody>
            </Card>
          ) : (
            events.map((n) => (
              <Card key={n.id}>
                <CardBody>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-slate-900">{n.title}</span>
                    <Badge tone="brand">{n.category}</Badge>
                    <Badge tone="neutral">{scopeLabel(n.audienceScope)}</Badge>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {n.eventStartAt && new Date(n.eventStartAt).toLocaleString()}
                    {n.eventEndAt && ` – ${new Date(n.eventEndAt).toLocaleString()}`}
                    {n.location ? ` · ${n.location}` : ""}
                  </div>
                  {n.body && <p className="mt-2 text-sm text-slate-600">{n.body}</p>}
                  {(attachmentsByNotice.get(n.id) ?? []).map((a) => (
                    <a
                      key={a.id}
                      href={a.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 flex items-center gap-1.5 text-xs text-indigo-600 hover:underline"
                    >
                      <DocumentIcon className="h-3.5 w-3.5 shrink-0" />
                      {a.fileName}
                    </a>
                  ))}
                </CardBody>
              </Card>
            ))
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-slate-900">Notices</h2>
          {plainNotices.length === 0 ? (
            <Card>
              <CardBody>
                <EmptyState icon={<BellIcon className="h-9 w-9" />} title="Nothing yet" />
              </CardBody>
            </Card>
          ) : (
            plainNotices.map((n) => (
              <Card key={n.id}>
                <CardBody>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-slate-900">{n.title}</span>
                    <Badge tone="brand">{n.category}</Badge>
                    <Badge tone="neutral">{scopeLabel(n.audienceScope)}</Badge>
                    {n.semesterLabel && <span className="text-xs text-slate-400">{n.semesterLabel}</span>}
                  </div>
                  {n.body && <p className="mt-1 text-sm text-slate-600">{n.body}</p>}
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
                </CardBody>
              </Card>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
