import Link from "next/link";
import { requireRole } from "@/lib/identity/require-role";
import { listOfferingsWithResultsForTeacher } from "@/lib/results/teacher";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ChartIcon } from "@/components/icons";

export default async function TeacherResultsPage() {
  const session = await requireRole("teacher");
  const offerings = await listOfferingsWithResultsForTeacher(session.userId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Results</h1>
        <p className="mt-1 text-sm text-slate-500">
          Course offerings with results for your own courses only. Pick one to correct a student&apos;s marks —
          there is no &quot;add result&quot; control here; only an admin creates new results.
        </p>
      </div>

      <Card>
        <CardHeader title="Course offerings" description="With existing results" />
        <CardBody>
          {offerings.length === 0 ? (
            <EmptyState
              icon={<ChartIcon className="h-9 w-9" />}
              title="No results yet"
              description="No results found for your course offerings yet."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {offerings.map((o) => (
                <li key={o.courseOfferingId} className="py-3 first:pt-0 last:pb-0">
                  <Link
                    href={`/teacher/results/${o.courseOfferingId}`}
                    className="text-sm font-medium text-slate-900 hover:text-indigo-600 hover:underline"
                  >
                    {o.courseCode} — {o.courseTitle}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
