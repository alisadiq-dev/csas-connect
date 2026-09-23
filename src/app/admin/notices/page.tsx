import { listPrograms } from "@/lib/academic-structure/programs";
import { listAllClassesWithContext } from "@/lib/academic-structure/classes";
import { listAllNotices, listAttachmentsForNotices } from "@/lib/notices/admin";
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
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Notices &amp; Events</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Full CRUD, PDF attachments (date sheets, result PDFs), and audience targeting (department/program/class).
        </p>
      </div>

      <NoticeForm programs={programs.map((p) => ({ id: p.id, name: p.name }))} classes={classes.map((c) => ({ id: c.id, label: classLabelById.get(c.id)! }))} />

      <ul className="flex flex-col gap-3">
        {notices.length === 0 && <li className="text-sm text-zinc-500">No notices yet.</li>}
        {notices.map((n) => (
          <li key={n.id} className="rounded-lg border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="font-medium text-zinc-900 dark:text-zinc-50">
                  {n.title} <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">{n.category}</span>
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  {n.audienceScope === "department" && "Department-wide"}
                  {n.audienceScope === "program" && `Program: ${programNameById.get(n.programId ?? "") ?? "—"}`}
                  {n.audienceScope === "class" && `Class: ${classLabelById.get(n.classId ?? "") ?? "—"}`}
                  {n.semesterLabel ? ` · ${n.semesterLabel}` : ""}
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
              <form action={deleteNoticeAction}>
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
