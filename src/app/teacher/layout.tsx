import { AppShell } from "@/components/layout/AppShell";
import type { NavSection } from "@/components/layout/nav-types";
import { requireRole } from "@/lib/identity/require-role";
import { getTeacherByUserId } from "@/lib/identity/teachers";

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Main",
    items: [
      { href: "/teacher", label: "Dashboard", icon: "dashboard" },
      { href: "/teacher/attendance", label: "Attendance", icon: "attendance" },
      { href: "/teacher/results", label: "Results", icon: "results" },
      { href: "/teacher/timetable", label: "Timetable", icon: "timetable" },
    ],
  },
  {
    label: "Community",
    items: [{ href: "/notices", label: "Notices & Events", icon: "notices" }],
  },
];

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("teacher");
  const profile = await getTeacherByUserId(session.userId);

  return (
    <AppShell roleLabel="Teacher" userName={profile?.fullName ?? "Teacher"} navSections={NAV_SECTIONS}>
      {children}
    </AppShell>
  );
}
