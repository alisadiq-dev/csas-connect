import { SlidingNumber } from "@/components/animate-ui/primitives/texts/sliding-number";
import type { PublicStats } from "@/lib/public-stats";

// Shown only when the database can't be reached, and labelled as sample figures.
const SAMPLE: PublicStats = { students: 96, teachers: 12, attendanceRate: 92, notices: 8 };

/** Counters that roll into place when scrolled into view (Animate UI Sliding Number). */
export function MetricsStrip({ stats }: { stats: PublicStats | null }) {
  const live = stats !== null;
  const s = stats ?? SAMPLE;
  const items = [
    { label: "Students enrolled", value: s.students, suffix: "" },
    { label: "Teachers", value: s.teachers, suffix: "" },
    ...(s.attendanceRate !== null ? [{ label: "Attendance rate", value: s.attendanceRate, suffix: "%" }] : []),
    { label: "Notices & events posted", value: s.notices, suffix: "" },
  ];

  return (
    <div>
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-ice/15 bg-ice/10 lg:grid-cols-4">
        {items.map((m) => (
          <div key={m.label} className="bg-night-900/90 px-5 py-7 sm:px-7 sm:py-9">
            <dd className="flex items-baseline text-5xl font-light tracking-tight text-white sm:text-6xl">
              <SlidingNumber number={m.value} inView inViewMargin="-10% 0px" aria-label={`${m.value}${m.suffix}`} />
              {m.suffix && <span className="text-3xl text-mint sm:text-4xl">{m.suffix}</span>}
            </dd>
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
