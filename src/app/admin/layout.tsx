import Link from "next/link";

const NAV_ITEMS = [
  { href: "/admin/programs", label: "Programs" },
  { href: "/admin/batches", label: "Batches & Classes" },
  { href: "/admin/courses", label: "Courses & Terms" },
  { href: "/admin/offerings", label: "Offerings" },
  { href: "/admin/teachers", label: "Teachers" },
  { href: "/admin/students", label: "Students" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-4 sm:px-6">
          <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            CSAS Connect · Admin
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
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
