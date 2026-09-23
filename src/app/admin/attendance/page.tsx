import { listAllOfferingsWithContext } from "@/lib/academic-structure/offerings";
import { listStudentsForClass } from "@/lib/identity/students";
import { listRecordsForSession, listSessionsForOffering } from "@/lib/attendance/admin";
import { SessionForm } from "./session-form";

export default async function AdminAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ courseOfferingId?: string }>;
}) {
  const { courseOfferingId } = await searchParams;
  const offerings = await listAllOfferingsWithContext();

  const selected = courseOfferingId ? offerings.find((o) => o.id === courseOfferingId) : undefined;
  const [students, sessions] = selected
    ? await Promise.all([listStudentsForClass(selected.classId), listSessionsForOffering(selected.id)])
    : [[], []];

  const sessionsWithRecords = await Promise.all(
    sessions.map(async (s) => ({ ...s, records: await listRecordsForSession(s.id) })),
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Attendance</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Create an attendance session for a course offering and mark every enrolled student. Corrections to an
          existing session happen in the Teacher area, not here.
        </p>
      </div>

      <form
        method="GET"
        className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">Course offering</span>
          <select
            name="courseOfferingId"
            defaultValue={courseOfferingId ?? ""}
            required
            className="w-full sm:w-96 rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="" disabled>
              Select a course offering…
            </option>
            {offerings.map((o) => (
              <option key={o.id} value={o.id}>
                {o.courseCode} — {o.courseTitle} · {o.termName} (sem {o.semesterNumber})
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900"
        >
          Load
        </button>
      </form>

      {selected && (
        <>
          <SessionForm courseOfferingId={selected.id} students={students.map((s) => ({ userId: s.userId, rollNumber: s.rollNumber, fullName: s.fullName }))} />

          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Existing sessions for {selected.courseCode}
            </h2>
            <ul className="mt-2 flex flex-col gap-3">
              {sessionsWithRecords.length === 0 && <li className="text-sm text-zinc-500">No sessions yet.</li>}
              {sessionsWithRecords.map((s) => (
                <li key={s.id} className="rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="font-medium text-zinc-900 dark:text-zinc-50">{s.sessionDate}</div>
                  <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                    {s.records.map((r) => (
                      <li key={r.id}>
                        {r.rollNumber}: <span className="font-medium">{r.status}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
