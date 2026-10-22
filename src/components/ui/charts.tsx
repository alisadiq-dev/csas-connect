// Small dependency-free SVG charts shared by the marketing previews (illustrative data)
// and the dashboards (real data). Server-component safe: no hooks, no browser APIs.

type Tone = "light" | "dark";

/** Circular percentage gauge. */
export function RingGauge({
  value,
  size = 96,
  stroke = 9,
  tone = "light",
  label,
  danger = false,
}: {
  value: number;
  size?: number;
  stroke?: number;
  tone?: Tone;
  label?: string;
  /** Renders in a warning colour (e.g. attendance below the 75% threshold). */
  danger?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const track = tone === "dark" ? "rgb(186 215 245 / 0.16)" : "#e2e8f0";
  const arc = danger ? "#f43f5e" : tone === "dark" ? "#6beccd" : "#4f46e5";
  const text = tone === "dark" ? "text-white" : "text-slate-900";
  return (
    <div className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label ?? `${pct}%`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={arc}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
        />
      </svg>
      <span className={`absolute text-sm font-semibold ${text}`} style={{ fontSize: size * 0.22 }}>
        {Math.round(pct)}%
      </span>
    </div>
  );
}

/** Vertical bars normalised to `max` (default: the largest value). The last bar is highlighted. */
export function MiniBars({
  values,
  labels,
  max,
  height = 96,
  tone = "light",
  ariaLabel,
}: {
  values: number[];
  labels?: string[];
  max?: number;
  height?: number;
  tone?: Tone;
  ariaLabel: string;
}) {
  const top = max ?? Math.max(...values, 1);
  const base = tone === "dark" ? "bg-ice/25" : "bg-indigo-200";
  const hi = tone === "dark" ? "bg-mint" : "bg-indigo-600";
  const lab = tone === "dark" ? "text-ice/60" : "text-slate-400";
  return (
    <div role="img" aria-label={ariaLabel} className="flex justify-center gap-1.5" style={{ height: height + (labels ? 18 : 0) }}>
      {values.map((v, i) => (
        <div key={i} className="flex min-w-0 max-w-16 flex-1 flex-col items-center gap-1">
          <div className="flex w-full flex-1 items-end">
            <div
              className={`w-full rounded-t-md ${i === values.length - 1 ? hi : base}`}
              style={{ height: `${Math.max(4, (v / top) * 100)}%` }}
            />
          </div>
          {labels && <span className={`text-[10px] ${lab}`}>{labels[i]}</span>}
        </div>
      ))}
    </div>
  );
}

/** Horizontal progress bar. */
export function ProgressBar({ value, danger = false, tone = "light" }: { value: number; danger?: boolean; tone?: Tone }) {
  const pct = Math.max(0, Math.min(100, value));
  const track = tone === "dark" ? "bg-ice/15" : "bg-slate-100";
  const fill = danger ? "bg-rose-500" : tone === "dark" ? "bg-mint" : "bg-indigo-600";
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full ${track}`} role="presentation">
      <div className={`h-full rounded-full ${fill}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
