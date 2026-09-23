import Link from "next/link";
import { requireClassRep } from "@/lib/identity/require-role";

const NAV_ITEMS = [
  { href: "/cr/notices", label: "Class Notices" },
  { href: "/cr/timetable", label: "Timetable" },
  { href: "/notices", label: "Shared feed" },
];

export default async function CrLayout({ children }: { children: React.ReactNode }) {
  // Gates on requireRole('student') first, then is_class_rep — see
  // src/lib/identity/require-role.ts. CR is a permission level inside the
  // student role, not a fourth Role value.
  await requireClassRep();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              CSAS Connect · Class Rep
            </span>
            <nav className="flex flex-wrap gap-4 text-sm">
              <Link href="/student" className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50">
                Student dashboard
              </Link>
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
                >
                  {item.label}
                </Link>
              ))}
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
