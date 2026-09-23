import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <main className="flex w-full max-w-sm flex-col items-center gap-6 rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">CSAS Connect</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Departmental portal for the University of the Punjab&apos;s Department of Statistics — attendance,
            results, timetables, and notices for students, teachers, class representatives, and admin.
          </p>
        </div>
        <Link
          href="/login"
          className="w-full rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900"
        >
          Sign in
        </Link>
      </main>
    </div>
  );
}
