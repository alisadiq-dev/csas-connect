import type { ReactNode } from "react";
import { StatNumber } from "@/components/marketing/StatNumber";
import { Sparkline } from "@/components/ui/Sparkline";

export type StatTone = "indigo" | "emerald" | "amber" | "rose" | "sky";

const TONE_CLASSES: Record<StatTone, string> = {
  indigo: "bg-indigo-50 text-indigo-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
  sky: "bg-sky-50 text-sky-600",
};

/** A single real-data metric card — no invented deltas or trend arrows unless the caller passes real ones. */
export function StatCard({
  icon,
  label,
  value,
  number,
  decimals = 0,
  suffix,
  hint,
  trend,
  trendLabel,
  tone = "indigo",
}: {
  icon: ReactNode;
  label: string;
  /** Static content. Prefer `number` for numeric metrics so the figure rolls in with a sliding-number animation. */
  value?: ReactNode;
  number?: number;
  decimals?: number;
  suffix?: string;
  hint?: ReactNode;
  /** Optional real series drawn as an animated trend line. */
  trend?: number[];
  trendLabel?: string;
  tone?: StatTone;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_1px_2px_rgb(15_23_42/0.04),0_8px_24px_-12px_rgb(15_23_42/0.08)]">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${TONE_CLASSES[tone]}`}>
        <span className="h-5 w-5">{icon}</span>
      </div>
      <div className="mt-3 flex items-baseline text-3xl font-light tracking-tight text-slate-900">
        {number !== undefined ? <StatNumber value={number} decimals={decimals} suffix={suffix} suffixClassName="text-xl text-slate-500" /> : value}
      </div>
      <div className="text-xs text-slate-500">{label}</div>
      {hint && <div className="mt-1.5 text-[11px] text-slate-400">{hint}</div>}
      {trend && trend.length > 1 && (
        <div className="mt-3">
          <Sparkline values={trend} width={140} height={34} ariaLabel={trendLabel ?? `${label} trend`} />
        </div>
      )}
    </div>
  );
}
