import Link from "next/link";
import { requireRole } from "@/lib/identity/require-role";
import { getStudentByUserId } from "@/lib/identity/students";

const NAV_ITEMS = [
  { href: "/student", label: "Dashboard" },
  { href: "/student/attendance", label: "Attendance" },
  { href: "/student/results", label: "Results" },
  { href: "/student/timetable", label: "Timetable" },
  { href: "/notices", label: "Notices" },
];

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("student");
  const profile = await getStudentByUserId(session.userId);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              CSAS Connect · Student
            </span>
            <nav className="flex flex-wrap gap-4 text-sm">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
                >
                  {item.label}
                </Link>
              ))}
              {profile?.isClassRep && (
                <Link href="/cr/notices" className="font-medium text-blue-700 hover:underline dark:text-blue-400">
                  Class Rep area
                </Link>
              )}
            </nav>
          </div>
          <form action="/logout" method="post">
            <button type="submit" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50">
              Log out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
