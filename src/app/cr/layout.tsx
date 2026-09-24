import { AppShell } from "@/components/layout/AppShell";
import type { NavSection } from "@/components/layout/nav-types";
import { requireClassRep } from "@/lib/identity/require-role";
import { getStudentByUserId } from "@/lib/identity/students";

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Main",
    items: [{ href: "/student", label: "Student dashboard", icon: "dashboard" }],
  },
  {
    label: "Class Rep",
    items: [
      { href: "/cr/notices", label: "Class Notices", icon: "notices" },
      { href: "/cr/timetable", label: "Timetable", icon: "timetable" },
    ],
  },
  {
    label: "Community",
    items: [{ href: "/notices", label: "Shared feed", icon: "feed" }],
  },
];

export default async function CrLayout({ children }: { children: React.ReactNode }) {
  // Gates on requireRole('student') first, then is_class_rep — see
  // src/lib/identity/require-role.ts. CR is a permission level inside the
  // student role, not a fourth Role value.
  const session = await requireClassRep();
  const profile = await getStudentByUserId(session.userId);

  return (
    <AppShell roleLabel="Class Representative" userName={profile?.fullName ?? "Student"} navSections={NAV_SECTIONS}>
      {children}
    </AppShell>
  );
}
