import Link from "next/link";
import { requireRole } from "@/lib/identity/require-role";
import { listOfferingsWithResultsForTeacher } from "@/lib/results/teacher";

export default async function TeacherResultsPage() {
  const session = await requireRole("teacher");
  const offerings = await listOfferingsWithResultsForTeacher(session.userId);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Results</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Course offerings with results for your own courses only. Pick one to correct a student&apos;s marks —
          there is no &quot;add result&quot; control here; only an admin creates new results.
        </p>
      </div>

      <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
        {offerings.length === 0 && <li className="p-4 text-sm text-zinc-500">No results found for your course offerings yet.</li>}
        {offerings.map((o) => (
          <li key={o.courseOfferingId} className="p-4 text-sm">
            <Link href={`/teacher/results/${o.courseOfferingId}`} className="text-zinc-900 hover:underline dark:text-zinc-50">
              {o.courseCode} — {o.courseTitle}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
