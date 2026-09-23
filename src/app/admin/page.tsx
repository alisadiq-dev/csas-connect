import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Admin dashboard</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Manage the department&apos;s academic structure and accounts from the sections above.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/admin/programs" className="rounded-lg border border-zinc-200 bg-white p-4 text-sm hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950">
          Programs
        </Link>
        <Link href="/admin/batches" className="rounded-lg border border-zinc-200 bg-white p-4 text-sm hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950">
          Batches & classes
        </Link>
        <Link href="/admin/courses" className="rounded-lg border border-zinc-200 bg-white p-4 text-sm hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950">
          Courses & terms
        </Link>
        <Link href="/admin/offerings" className="rounded-lg border border-zinc-200 bg-white p-4 text-sm hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950">
          Course offerings
        </Link>
        <Link href="/admin/teachers" className="rounded-lg border border-zinc-200 bg-white p-4 text-sm hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950">
          Teachers
        </Link>
        <Link href="/admin/students" className="rounded-lg border border-zinc-200 bg-white p-4 text-sm hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950">
          Students
        </Link>
      </div>
    </div>
  );
}
