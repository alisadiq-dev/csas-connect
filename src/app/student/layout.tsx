import { AppShell } from "@/components/layout/AppShell";
import type { NavSection } from "@/components/layout/nav-types";
import { getClassWithContext } from "@/lib/academic-structure/classes";
import { requireRole } from "@/lib/identity/require-role";
import { getStudentByUserId } from "@/lib/identity/students";

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Main",
    items: [
      { href: "/student", label: "Dashboard", icon: "dashboard", primary: true },
      { href: "/student/attendance", label: "Attendance", icon: "attendance", primary: true },
      { href: "/student/results", label: "Results", icon: "results", primary: true },
      { href: "/student/timetable", label: "Timetable", icon: "timetable", primary: true },
    ],
  },
  {
    label: "Community",
    items: [{ href: "/notices", label: "Notices & Events", icon: "notices" }],
  },
];

const CR_SECTION: NavSection = {
  label: "Class Rep",
  items: [{ href: "/cr/notices", label: "Class Rep area", icon: "feed" }],
};

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("student");
  const profile = await getStudentByUserId(session.userId);
  const classContext = profile ? await getClassWithContext(profile.classId) : null;

  const sections = profile?.isClassRep ? [...NAV_SECTIONS, CR_SECTION] : NAV_SECTIONS;
  const subtitle = classContext
    ? `${classContext.sectionType === "regular" ? "Regular" : "Replica"} · Semester ${classContext.currentSemester}`
    : undefined;

  return (
    <AppShell
      roleLabel="Student"
      userName={profile?.fullName ?? "Student"}
      userSubtitle={subtitle}
      navSections={sections}
    >
      {children}
    </AppShell>
  );
}
