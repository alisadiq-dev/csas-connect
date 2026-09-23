import { requireRole } from "@/lib/identity/require-role";

export default async function StudentDashboardPage() {
  await requireRole("student");

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            CSAS Connect · Student
          </span>
          <form action="/logout" method="post">
            <button type="submit" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50">
              Log out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Student dashboard</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Your attendance, results, GPA/CGPA, timetable, and notices will appear here as those modules are built.
        </p>
      </main>
    </div>
  );
}
