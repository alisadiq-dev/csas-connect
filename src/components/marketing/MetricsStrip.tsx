import { StatNumber } from "@/components/marketing/StatNumber";
import { RingGauge } from "@/components/ui/charts";
import type { PublicStats } from "@/lib/public-stats";

// Shown only when the database can't be reached, and labelled as sample figures.
const SAMPLE: PublicStats = { students: 96, teachers: 12, attendanceRate: 92, notices: 8 };

/** Counters that roll into place when scrolled into view (Animate UI Sliding Number). */
export function MetricsStrip({ stats }: { stats: PublicStats | null }) {
  const live = stats !== null;
  const s = stats ?? SAMPLE;
  const items = [
    { label: "Students enrolled", value: s.students, suffix: "", pill: "Active" },
    { label: "Teachers", value: s.teachers, suffix: "", pill: "Faculty" },
    ...(s.attendanceRate !== null ? [{ label: "Attendance rate", value: s.attendanceRate, suffix: "%", ring: s.attendanceRate }] : []),
    { label: "Notices & events posted", value: s.notices, suffix: "", pill: "Timely" },
  ];

  return (
    <div>
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-ice/15 bg-ice/10 lg:grid-cols-4">
        {items.map((m) => (
          <div key={m.label} className="relative bg-night-900/90 px-5 py-7 sm:px-7 sm:py-9">
            <div aria-hidden className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-ember/40 to-transparent" />
            <div className="flex items-start justify-between gap-3">
              <dd className="flex items-baseline text-5xl font-light tracking-tight text-white sm:text-6xl">
                <StatNumber value={m.value} suffix={m.suffix} />
              </dd>
              {"ring" in m && m.ring !== undefined ? (
                <RingGauge value={m.ring} size={52} stroke={6} tone="dark" label={`${m.ring} percent`} />
              ) : (
                <span className="mt-2 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300 shadow-[0_0_18px_rgb(52_211_153/0.25)] ring-1 ring-emerald-400/25">
                  {"pill" in m ? m.pill : ""}
                </span>
              )}
            </div>
            <dt className="mt-2 text-sm text-ice/65">{m.label}</dt>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-center text-xs text-ice/45">
        {live ? "Department totals from the portal database; attendance rate is across all marked sessions." : "Sample figures shown — live totals unavailable right now."}
      </p>
    </div>
  );
}
