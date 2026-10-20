import { Logo } from "@/components/brand/Logo";
import { BellIcon, BuildingIcon, CalendarCheckIcon, ChartIcon, ClockIcon, UserIcon, UsersIcon } from "@/components/icons";
import { AuroraBackground } from "@/components/effects/AuroraBackground";
import { ShimmerButton } from "@/components/effects/ShimmerButton";
import { Sparkles } from "@/components/effects/Sparkles";
import { TiltCard } from "@/components/effects/TiltCard";
import { DemoAccounts } from "@/components/marketing/DemoAccounts";
import { HeroPanels } from "@/components/marketing/HeroPanels";
import { MetricsStrip } from "@/components/marketing/MetricsStrip";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { ProgramCards } from "@/components/marketing/ProgramCards";
import { RevealProvider } from "@/components/marketing/Reveal";
import { WorkspaceTabs } from "@/components/marketing/WorkspaceTabs";
import { listPrograms } from "@/lib/academic-structure/programs";
import { listDemoAccounts } from "@/lib/demo-accounts";
import { getPublicStats } from "@/lib/public-stats";

// Counts and the program list are cached and refreshed hourly.
export const revalidate = 3600;

// Used when the database can't be reached (e.g. a static preview): the department's three programs.
const FALLBACK_PROGRAMS = [
  { id: "stat", name: "BS Statistics", code: "STAT" },
  { id: "biostat", name: "BS Biostatistics", code: "BIOSTAT" },
  { id: "cs", name: "BS Computational Statistics", code: "CS" },
];

const ROLES = [
  { icon: UsersIcon, title: "Students", points: ["Attendance per course", "Results, GPA and CGPA", "Today's timetable and next lecture"] },
  { icon: UserIcon, title: "Teachers", points: ["Mark attendance in a few taps", "Enter and correct marks", "Your own weekly timetable"] },
  { icon: BuildingIcon, title: "Administrators", points: ["Programs, batches and offerings", "Student and teacher accounts", "Department-wide notices"] },
];

export default async function Home() {
  const [programs, stats, demoAccounts] = await Promise.all([
    listPrograms()
      .then((rows) => rows.filter((p) => p.active).map(({ id, name, code }) => ({ id, name, code })))
      .catch(() => FALLBACK_PROGRAMS),
    getPublicStats(),
    listDemoAccounts(),
  ]);

  return (
    <div className="relative min-h-screen overflow-x-clip bg-night-950 text-ice">
      <RevealProvider />
      <MarketingNav />

      {/* Hero */}
      <section className="relative isolate overflow-hidden px-4 pt-32 pb-20 sm:px-6 lg:pt-40 lg:pb-28">
        <AuroraBackground className="-z-10" />
        <Sparkles className="-z-10" />
        <div aria-hidden className="night-grid absolute inset-0 -z-10" />
        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
          <div className="order-1 lg:order-2">
            <p className="inline-flex items-center gap-2 rounded-full border border-ice/20 bg-white/5 py-1.5 pr-4 pl-3 text-sm text-ice/85 backdrop-blur-sm">
              <span className="relative flex h-2 w-2" aria-hidden>
                <span className="absolute inline-flex h-full w-full rounded-full bg-mint opacity-70 motion-safe:animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-mint" />
              </span>
              University of the Punjab · CSAS
            </p>
            <h1 className="mt-5 text-5xl leading-[1.04] font-light tracking-tight text-balance text-white sm:text-6xl lg:text-7xl">
              <span className="text-gradient">CSAS Connect</span> is your department, in one place
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-ice/75">
              Attendance, results, GPA and timetables for BS Statistics, Biostatistics and Computational Statistics — for
              students, teachers and administrators.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <ShimmerButton href="/login">Sign in to the portal</ShimmerButton>
              <a
                href="#workspace"
                className="inline-flex min-h-12 items-center rounded-full border border-ice/25 px-6 text-base text-ice transition-colors hover:border-ice/60 hover:text-white active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ice focus-visible:outline-none"
              >
                See how it works
              </a>
            </div>
          </div>
          <div className="order-2 lg:order-1">
            <HeroPanels />
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section aria-label="Portal at a glance" className="px-4 sm:px-6">
        <div data-reveal className="mx-auto max-w-6xl">
          <MetricsStrip stats={stats} />
        </div>
      </section>

      {/* Workspace */}
      <section id="workspace" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <p data-reveal className="text-sm font-medium tracking-wider text-mint/90 uppercase">The portal</p>
          <h2 data-reveal className="mt-3 max-w-2xl text-4xl font-light tracking-tight text-balance text-white sm:text-5xl">
            The four things you open it for, every day
          </h2>
          <div data-reveal className="mt-12">
            <WorkspaceTabs />
          </div>
        </div>
      </section>

      {/* Programs */}
      <section id="programs" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <p data-reveal className="text-sm font-medium tracking-wider text-mint/90 uppercase">Programs</p>
          <h2 data-reveal className="mt-3 max-w-2xl text-4xl font-light tracking-tight text-balance text-white sm:text-5xl">
            Three degrees, Regular and Replica sections
          </h2>
          <div className="mt-12">
            <ProgramCards programs={programs} />
          </div>
        </div>
      </section>

      {/* Bento */}
      <section className="px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
          {[
            { icon: CalendarCheckIcon, title: "Attendance you can trust", text: "Marked per session by teachers, summarised per course, with the 75% line made obvious." },
            { icon: ChartIcon, title: "GPA, done properly", text: "Semester GPA and CGPA computed from credit hours and grade points — repeats and special statuses handled." },
            { icon: ClockIcon, title: "A timetable that knows today", text: "Weekly grids per class, plus a today view with what's on now and what's next." },
          ].map((f, i) => (
            <div key={f.title} data-reveal style={{ "--reveal-delay": `${i * 90}ms` } as React.CSSProperties}>
            <TiltCard className="glass h-full rounded-3xl bg-night-800/50 p-7">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-400/15 text-ice">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-6 text-xl font-medium text-white">{f.title}</h3>
              <p className="mt-2 leading-relaxed text-ice/70">{f.text}</p>
            </TiltCard>
            </div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <p data-reveal className="text-sm font-medium tracking-wider text-mint/90 uppercase">Who it&apos;s for</p>
          <h2 data-reveal className="mt-3 max-w-2xl text-4xl font-light tracking-tight text-balance text-white sm:text-5xl">
            One sign-in, the right view for each role
          </h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {ROLES.map((r, i) => (
              <div key={r.title} data-reveal style={{ "--reveal-delay": `${i * 90}ms` } as React.CSSProperties}>
              <TiltCard className="h-full rounded-3xl border border-ice/15 p-7">
                <r.icon className="h-6 w-6 text-mint" />
                <h3 className="mt-5 text-xl font-medium text-white">{r.title}</h3>
                <ul className="mt-4 space-y-2.5 text-ice/75">
                  {r.points.map((p) => (
                    <li key={p} className="flex gap-2.5">
                      <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-mint" />
                      {p}
                    </li>
                  ))}
                </ul>
              </TiltCard>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Notices & events */}
      <section id="community" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:py-28">
        <div className="glass mx-auto grid max-w-6xl items-center gap-10 rounded-[2rem] bg-night-800/50 p-8 sm:p-12 lg:grid-cols-2">
          <div data-reveal>
            <BellIcon className="h-7 w-7 text-mint" />
            <h2 className="mt-5 text-4xl font-light tracking-tight text-balance text-white">Notices and events that find the right people</h2>
            <p className="mt-4 max-w-md leading-relaxed text-ice/70">
              Post to the whole department, one program or one class. Class representatives can share updates with their own class.
            </p>
          </div>
          <ul data-reveal className="space-y-3">
            {[
              ["Whole department", "Mid-term datesheet released"],
              ["BS Statistics", "Statistics seminar series — Thursday"],
              ["Class notice", "Lab session moved to Friday"],
            ].map(([a, t]) => (
              <li key={t} className="flex items-center justify-between gap-4 rounded-2xl bg-night-900/60 px-5 py-4">
                <span className="text-white">{t}</span>
                <span className="shrink-0 text-xs text-ice/55">{a}</span>
              </li>
            ))}
            <li className="text-right text-[11px] text-ice/50">Illustrative examples</li>
          </ul>
        </div>
      </section>

      {/* CTA + test accounts */}
      <section className="px-4 pt-10 pb-24 text-center sm:px-6">
        <h2 data-reveal className="mx-auto max-w-3xl text-5xl font-light tracking-tight text-balance text-white sm:text-6xl">
          Ready to open your <span className="text-gradient">portal</span>?
        </h2>
        <div data-reveal className="mt-9">
          <ShimmerButton href="/login" className="px-9">
            Sign in
          </ShimmerButton>
        </div>
        {demoAccounts.length > 0 && (
          <div data-reveal className="mt-14">
            <DemoAccounts accounts={demoAccounts} />
          </div>
        )}
      </section>

      <footer className="border-t border-ice/10 px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <Logo size="sm" tone="dark" />
          <p className="max-w-md text-xs leading-relaxed text-ice/55">
            Unofficial student-built demo — not an official University of the Punjab system. Previews on this page use sample data.
          </p>
        </div>
      </footer>
    </div>
  );
}
