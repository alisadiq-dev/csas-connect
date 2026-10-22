"use client";

import { BarChart3, Bell, CalendarCheck, Clock, type LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { AnimatedIcon, type IconMotion } from "@/components/effects/AnimatedIcon";
import { TiltCard } from "@/components/effects/TiltCard";
import { MiniBars, ProgressBar, RingGauge } from "@/components/ui/charts";

/** Bento cell: tilt + cursor-following border light, with an animated icon that plays on hover/focus. */
function Cell({
  icon,
  motionType,
  title,
  text,
  className = "",
  children,
}: {
  icon: LucideIcon;
  motionType: IconMotion;
  title: string;
  text: string;
  className?: string;
  children?: ReactNode;
}) {
  const [active, setActive] = useState(false);
  return (
    <div
      data-reveal
      className={`min-w-0 ${className}`}
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
    >
      <TiltCard className="glass group relative flex h-full flex-col overflow-hidden rounded-3xl bg-night-800/50 p-6 sm:p-7">
        <div aria-hidden className="pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full bg-sapphire/10 blur-3xl transition-opacity duration-500 group-hover:opacity-100 sm:opacity-60" />
        <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-ember/10 text-ember ring-1 ring-ember/25">
          <AnimatedIcon icon={icon} motionType={motionType} active={active} />
        </span>
        <h3 className="relative mt-5 text-xl font-medium text-white">{title}</h3>
        <p className="relative mt-2 leading-relaxed text-ice/70">{text}</p>
        {children && <div className="relative mt-6 flex-1">{children}</div>}
      </TiltCard>
    </div>
  );
}

export function BentoGrid({ attendanceRate }: { attendanceRate: number | null }) {
  const rate = attendanceRate ?? 92;
  return (
    <div className="grid auto-rows-fr gap-4 sm:gap-5 md:grid-cols-6">
      <Cell
        icon={CalendarCheck}
        motionType="pop"
        title="Attendance you can trust"
        text="Marked per session by teachers, summarised per course, with the 75% line made obvious."
        className="md:col-span-4"
      >
        <div className="flex flex-wrap items-center gap-6">
          <RingGauge value={rate} size={104} tone="dark" label={`Attendance ${rate} percent`} />
          <ul className="min-w-[10rem] flex-1 space-y-3 text-sm text-ice/80">
            {[
              ["Probability Theory", 94],
              ["Linear Models", 88],
              ["Biostatistics Lab", 72],
            ].map(([n, v]) => (
              <li key={n}>
                <div className="mb-1 flex justify-between">
                  <span>{n}</span>
                  <span className={Number(v) < 75 ? "text-rose-300" : "text-mint"}>{v}%</span>
                </div>
                <ProgressBar value={Number(v)} danger={Number(v) < 75} tone="dark" />
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-3 text-[11px] text-ice/45">Illustrative courses · ring shows the department&apos;s real average{attendanceRate === null ? " (sample)" : ""}</p>
      </Cell>

      <Cell
        icon={BarChart3}
        motionType="rise"
        title="GPA, done properly"
        text="Semester GPA and CGPA from credit hours and grade points — repeats and special statuses handled."
        className="md:col-span-2"
      >
        <MiniBars values={[2.9, 3.1, 3.3, 3.2, 3.6, 3.7]} max={4} height={72} tone="dark" ariaLabel="Illustrative GPA trend" labels={["S1", "S2", "S3", "S4", "S5", "S6"]} />
      </Cell>

      <Cell
        icon={Clock}
        motionType="spin"
        title="A timetable that knows today"
        text="Weekly grids per class, plus a today view with what's on now and what's next."
        className="md:col-span-3"
      >
        <ul className="space-y-2 text-sm text-ice/85">
          {[
            ["09:00", "Probability Theory", "Done"],
            ["10:00", "Linear Models", "Live"],
            ["12:00", "Biostatistics Lab", "Next"],
          ].map(([t, c, s]) => (
            <li key={t} className="flex items-center gap-3 rounded-2xl bg-white/5 px-3.5 py-2.5">
              <span className="w-11 text-xs text-ice/55">{t}</span>
              <span className="flex-1 truncate">{c}</span>
              {s === "Live" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ember/15 px-2.5 py-0.5 text-xs text-ember">
                  <span className="relative flex h-1.5 w-1.5" aria-hidden>
                    <span className="absolute inline-flex h-full w-full rounded-full bg-ember motion-safe:animate-pulse-ring" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-ember" />
                  </span>
                  Live now
                </span>
              ) : (
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-ice/65">{s}</span>
              )}
            </li>
          ))}
        </ul>
      </Cell>

      <Cell
        icon={Bell}
        motionType="wiggle"
        title="Notices that find you"
        text="To the whole department, one program or one class — and class reps can post for their own class."
        className="md:col-span-3"
      >
        <ul className="space-y-2 text-sm">
          {[
            ["Whole department", "Mid-term datesheet released"],
            ["BS Statistics", "Statistics seminar series"],
          ].map(([a, t]) => (
            <li key={t} className="flex items-center justify-between gap-3 rounded-2xl bg-white/5 px-3.5 py-2.5">
              <span className="text-ice/90">{t}</span>
              <span className="shrink-0 text-xs text-ice/50">{a}</span>
            </li>
          ))}
        </ul>
      </Cell>
    </div>
  );
}
