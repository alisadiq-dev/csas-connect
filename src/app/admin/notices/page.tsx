import { listPrograms } from "@/lib/academic-structure/programs";
import { listAllClassesWithContext } from "@/lib/academic-structure/classes";
import { listAllNotices, listAttachmentsForNotices } from "@/lib/notices/admin";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { BellIcon, DocumentIcon } from "@/components/icons";
import { NoticeForm } from "./notice-form";
import { deleteNoticeAction } from "./actions";

export default async function AdminNoticesPage() {
  const [programs, classes, notices] = await Promise.all([listPrograms(), listAllClassesWithContext(), listAllNotices()]);
  const classLabelById = new Map(
    classes.map((c) => [c.id, `${c.programName} — Intake ${c.intakeYear} ${c.sectionType} (sem ${c.currentSemester})`]),
  );
  const programNameById = new Map(programs.map((p) => [p.id, p.name]));
  const attachments = await listAttachmentsForNotices(notices.map((n) => n.id));
  const attachmentsByNotice = new Map<string, typeof attachments>();
  for (const a of attachments) {
    const list = attachmentsByNotice.get(a.noticeId);
    if (list) list.push(a);
    else attachmentsByNotice.set(a.noticeId, [a]);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Notices &amp; Events</h1>
        <p className="mt-1 text-sm text-slate-500">
          Full CRUD, PDF attachments (date sheets, result PDFs), and audience targeting (department/program/class).
        </p>
      </div>

      <Card>
        <CardHeader title="Post a notice" />
        <CardBody>
          <NoticeForm
            programs={programs.map((p) => ({ id: p.id, name: p.name }))}
            classes={classes.map((c) => ({ id: c.id, label: classLabelById.get(c.id)! }))}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Posted notices" description={`${notices.length} notice${notices.length === 1 ? "" : "s"}`} />
        <CardBody>
          {notices.length === 0 ? (
            <EmptyState
              icon={<BellIcon className="h-9 w-9" />}
              title="No notices yet"
              description="Notices you post will show up here."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {notices.map((n) => (
                <div key={n.id} className="rounded-lg border border-slate-200 p-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-slate-900">{n.title}</span>
                        <Badge tone="brand">{n.category}</Badge>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {n.audienceScope === "department" && "Department-wide"}
                        {n.audienceScope === "program" && `Program: ${programNameById.get(n.programId ?? "") ?? "—"}`}
                        {n.audienceScope === "class" && `Class: ${classLabelById.get(n.classId ?? "") ?? "—"}`}
                        {n.semesterLabel ? ` · ${n.semesterLabel}` : ""}
                      </div>
                      {n.body && <p className="mt-1.5 text-sm text-slate-600">{n.body}</p>}
                      {n.eventStartAt && (
                        <div className="mt-1.5 text-xs text-slate-500">
                          Event: {new Date(n.eventStartAt).toLocaleString()} {n.location ? `· ${n.location}` : ""}
                        </div>
                      )}
                      {(attachmentsByNotice.get(n.id) ?? []).map((a) => (
                        <a
                          key={a.id}
                          href={a.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1.5 flex items-center gap-1.5 text-xs text-indigo-600 hover:underline"
                        >
                          <DocumentIcon className="h-3.5 w-3.5 shrink-0" />
                          {a.fileName}
                        </a>
                      ))}
                    </div>
                    <form action={deleteNoticeAction} className="shrink-0">
                      <input type="hidden" name="id" value={n.id} />
                      <button type="submit" className="text-xs text-rose-600 hover:underline">
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
