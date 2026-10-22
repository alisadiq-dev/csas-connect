/** "↑ 0.12 vs last semester" style change badge: emerald up, rose down, neutral flat. */
export function TrendBadge({ delta, unit = "", suffix = "" }: { delta: number; unit?: string; suffix?: string }) {
  const flat = Math.abs(delta) < 0.005;
  const up = delta > 0;
  const tone = flat ? "bg-slate-100 text-slate-600" : up ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${tone}`}>
      <span aria-hidden>{flat ? "→" : up ? "↑" : "↓"}</span>
      <span className="sr-only">{flat ? "No change" : up ? "Up" : "Down"}</span>
      {flat ? "no change" : `${Math.abs(delta).toFixed(2)}${unit}`}
      {suffix && <span className="font-normal opacity-80">{suffix}</span>}
    </span>
  );
}
