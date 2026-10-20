import Link from "next/link";
import { listPrograms } from "@/lib/academic-structure/programs";
import { listAllClassesWithContext } from "@/lib/academic-structure/classes";
import { listAllOfferingsWithContext } from "@/lib/academic-structure/offerings";
import { listTeachers } from "@/lib/identity/teachers";
import { listAllStudents } from "@/lib/identity/students";
import { PageHero } from "@/components/layout/PageHero";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import {
  BuildingIcon,
  LayersIcon,
  LinkIcon,
  UserIcon,
  UsersIcon,
  BookIcon,
  CalendarCheckIcon,
  ChartIcon,
  ClockIcon,
  BellIcon,
} from "@/components/icons";

const QUICK_LINKS = [
  { href: "/admin/programs", label: "Programs", description: "The three degree programs", icon: BuildingIcon },
  { href: "/admin/batches", label: "Batches & Classes", description: "Intakes, sections, semesters", icon: LayersIcon },
  { href: "/admin/courses", label: "Courses & Terms", description: "Catalogue and academic terms", icon: BookIcon },
  { href: "/admin/offerings", label: "Offerings", description: "Courses assigned to classes", icon: LinkIcon },
  { href: "/admin/teachers", label: "Teachers", description: "Faculty accounts", icon: UserIcon },
  { href: "/admin/students", label: "Students", description: "Student accounts and roll numbers", icon: UsersIcon },
  { href: "/admin/attendance", label: "Attendance", description: "Mark and correct sessions", icon: CalendarCheckIcon },
  { href: "/admin/results", label: "Results", description: "Enter and correct marks", icon: ChartIcon },
  { href: "/admin/timetable", label: "Timetable", description: "Weekly schedule per class", icon: ClockIcon },
  { href: "/admin/notices", label: "Notices", description: "Post department-wide notices", icon: BellIcon },
];

export default async function AdminHomePage() {
  const [programs, classes, offerings, teachers, students] = await Promise.all([
    listPrograms(),
    listAllClassesWithContext(),
    listAllOfferingsWithContext(),
    listTeachers(),
    listAllStudents(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        eyebrow="Administrator"
        title="Department overview"
        description="Manage the department's academic structure, people and records."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard icon={<BuildingIcon />} label="Programs" value={programs.length} tone="indigo" />
        <StatCard icon={<LayersIcon />} label="Classes" value={classes.length} tone="sky" />
        <StatCard icon={<LinkIcon />} label="Offerings" value={offerings.length} tone="amber" />
        <StatCard icon={<UserIcon />} label="Teachers" value={teachers.length} tone="emerald" />
        <StatCard icon={<UsersIcon />} label="Students" value={students.length} tone="rose" />
      </div>

      <Card>
        <CardHeader title="Manage" description="Academic structure, people and records" />
        <CardBody>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 text-sm transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50/40 hover:shadow-md focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <link.icon className="h-[18px] w-[18px]" />
                </span>
                <span>
                  <span className="block font-medium text-slate-900">{link.label}</span>
                  <span className="block text-xs text-slate-500">{link.description}</span>
                </span>
              </Link>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
