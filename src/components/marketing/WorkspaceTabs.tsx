"use client";

import { AnimatePresence, motion } from "motion/react";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { BellIcon, CalendarCheckIcon, ChartIcon, ClockIcon } from "@/components/icons";
import { MiniBars, ProgressBar } from "@/components/ui/charts";

// Interactive "workspace" panel (idea from the reference's Shell / Browser / Editor / Planner tabs),
// re-expressed as the four things students and teachers do every day. Sample data only.

type Tab = { id: string; label: string; icon: ReactNode; title: string; body: string; view: ReactNode };

const COURSES = [
  ["STAT-301 Probability Theory", 94],
  ["STAT-305 Linear Models", 88],
  ["BIOS-310 Biostatistics Lab", 72],
  ["ACT-320 Actuarial Mathematics", 91],
] as const;

const TABS: Tab[] = [
  {
    id: "attendance",
    label: "Attendance",
    icon: <CalendarCheckIcon className="h-4 w-4" />,
    title: "See attendance by course — before it becomes a problem",
    body: "A running percentage per course, with anything under the 75% threshold flagged. Teachers mark a session in seconds.",
    view: (
      <ul className="space-y-4">
        {COURSES.map(([name, pct]) => (
          <li key={name}>
            <div className="mb-1.5 flex justify-between text-sm text-ice/90">
              <span>{name}</span>
              <span className={pct < 75 ? "text-rose-300" : "text-mint"}>{pct}%</span>
            </div>
            <ProgressBar value={pct} danger={pct < 75} tone="dark" />
          </li>
        ))}
      </ul>
    ),
  },
  {
    id: "results",
    label: "Results",
    icon: <ChartIcon className="h-4 w-4" />,
    title: "Grades, GPA and CGPA — calculated, not guessed",
    body: "Per-course marks and letter grades roll into semester GPA and CGPA automatically, using the department's own grading scale.",
    view: (
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 self-stretch">
          <MiniBars values={[2.9, 3.1, 3.3, 3.2, 3.6, 3.7]} max={4} height={120} tone="dark" ariaLabel="Illustrative semester GPA by semester" labels={["S1", "S2", "S3", "S4", "S5", "S6"]} />
        </div>
        <div>
          <p className="text-xs tracking-wide text-ice/60 uppercase">CGPA</p>
          <p className="text-5xl font-light text-white">3.64</p>
        </div>
      </div>
    ),
  },
  {
    id: "timetable",
    label: "Timetable",
    icon: <ClockIcon className="h-4 w-4" />,
    title: "Today's classes, rooms and the next lecture at a glance",
    body: "A weekly grid per class, and a today view that highlights what's happening now and what's next.",
    view: (
      <ul className="space-y-2.5">
        {[
          ["09:00", "Probability Theory", "Room 101", "Done"],
          ["10:00", "Linear Models", "Room 204", "Now"],
          ["12:00", "Biostatistics Lab", "Lab 2", "Upcoming"],
          ["14:00", "Actuarial Mathematics", "Room 105", "Upcoming"],
        ].map(([t, c, r, s]) => (
          <li key={t} className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 text-sm text-ice/90">
            <span className="w-12 text-xs text-ice/60">{t}</span>
            <span className="flex-1">{c}</span>
            <span className="hidden text-xs text-ice/50 sm:inline">{r}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs ${s === "Now" ? "bg-mint/20 text-mint" : "bg-white/10 text-ice/70"}`}>{s}</span>
          </li>
        ))}
      </ul>
    ),
  },
  {
    id: "notices",
    label: "Notices",
    icon: <BellIcon className="h-4 w-4" />,
    title: "Department notices and events, to the right people",
    body: "Announcements reach the whole department, a program or a single class — and class representatives can post for their own class.",
    view: (
      <ul className="space-y-2.5">
        {[
          ["Notice", "Mid-term datesheet released", "Whole department"],
          ["Event", "Statistics seminar series", "BS Statistics"],
          ["Notice", "Lab session moved to Friday", "BS Biostatistics · Sem 4"],
        ].map(([k, t, a]) => (
          <li key={t} className="flex items-start gap-3 rounded-2xl bg-white/5 px-4 py-3 text-sm">
            <span className="mt-0.5 rounded-full bg-indigo-400/20 px-2.5 py-0.5 text-xs text-ice">{k}</span>
            <span className="flex-1 text-ice/90">
              {t}
              <span className="block text-xs text-ice/50">{a}</span>
            </span>
          </li>
        ))}
      </ul>
    ),
  },
];

export function WorkspaceTabs() {
  const [active, setActive] = useState(0);
  const uid = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const tab = TABS[active];

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const next =
      e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : (active + (e.key === "ArrowRight" ? 1 : -1) + TABS.length) % TABS.length;
    setActive(next);
    refs.current[next]?.focus();
  };

  return (
    <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.15fr] lg:gap-14">
      <div>
        <div role="tablist" aria-label="Portal features" onKeyDown={onKeyDown} className="flex flex-wrap gap-2">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              role="tab"
              id={`${uid}-tab-${t.id}`}
              aria-selected={i === active}
              aria-controls={`${uid}-panel`}
              tabIndex={i === active ? 0 : -1}
              onClick={() => setActive(i)}
              className={`relative inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition-colors active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ice focus-visible:outline-none ${
                i === active ? "border-transparent text-night-900" : "border-ice/20 text-ice/80 hover:border-ice/50 hover:text-white"
              }`}
            >
              {i === active && (
                <motion.span layoutId={`${uid}-pill`} aria-hidden className="absolute inset-0 -z-0 rounded-full bg-ice shadow-[0_0_24px_rgb(186_215_245/0.35)]" transition={{ type: "spring", stiffness: 420, damping: 32 }} />
              )}
              <span className="relative z-10 inline-flex items-center gap-2">
              {t.icon}
              {t.label}
              </span>
            </button>
          ))}
        </div>
        <h3 className="mt-8 text-2xl font-light tracking-tight text-balance text-white sm:text-3xl">{tab.title}</h3>
        <p className="mt-4 max-w-md leading-relaxed text-ice/70">{tab.body}</p>
      </div>

      <div
        role="tabpanel"
        id={`${uid}-panel`}
        aria-labelledby={`${uid}-tab-${tab.id}`}
        className="glass relative rounded-3xl bg-night-800/70 p-5 sm:p-7"
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-ice/25" />
            <span className="h-2.5 w-2.5 rounded-full bg-ice/25" />
            <span className="h-2.5 w-2.5 rounded-full bg-ice/25" />
          </div>
          <span className="text-[11px] text-ice/60">Illustrative preview · sample data</span>
        </div>
        <div className="min-h-[15rem]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={tab.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
              {tab.view}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
