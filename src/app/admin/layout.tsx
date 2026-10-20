import { AppShell } from "@/components/layout/AppShell";
import type { NavSection } from "@/components/layout/nav-types";
import { getAdminByUserId } from "@/lib/identity/admins";
import { requireRole } from "@/lib/identity/require-role";

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Main",
    items: [{ href: "/admin", label: "Dashboard", icon: "dashboard", primary: true }],
  },
  {
    label: "Academic structure",
    items: [
      { href: "/admin/programs", label: "Programs", icon: "programs" },
      { href: "/admin/batches", label: "Batches & Classes", icon: "batches" },
      { href: "/admin/courses", label: "Courses & Terms", icon: "courses" },
      { href: "/admin/offerings", label: "Offerings", icon: "offerings" },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/admin/teachers", label: "Teachers", icon: "teachers" },
      { href: "/admin/students", label: "Students", icon: "students", primary: true },
    ],
  },
  {
    label: "Records",
    items: [
      { href: "/admin/attendance", label: "Attendance", icon: "attendance", primary: true },
      { href: "/admin/results", label: "Results", icon: "results", primary: true },
      { href: "/admin/timetable", label: "Timetable", icon: "timetable" },
    ],
  },
  {
    label: "Communication",
    items: [
      { href: "/admin/notices", label: "Notices", icon: "notices" },
      { href: "/notices", label: "Shared feed", icon: "feed" },
    ],
  },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("admin");
  const profile = await getAdminByUserId(session.userId);

  return (
    <AppShell roleLabel="Administrator" userName={profile?.fullName ?? "Admin"} navSections={NAV_SECTIONS}>
      {children}
    </AppShell>
  );
}
