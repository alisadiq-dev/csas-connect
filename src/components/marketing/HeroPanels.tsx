import { RingGauge } from "@/components/ui/charts";

/**
 * Stack of tilted glass panels in the hero (visual idea observed on the reference: layered translucent
 * workspace cards). All figures are illustrative sample data, labelled as such for users.
 */
export function HeroPanels() {
  return (
    <div className="relative mx-auto aspect-[1/1.02] w-full max-w-[34rem]" role="img" aria-label="Illustrative preview of CSAS Connect timetable, results and attendance panels">
      <div aria-hidden className="absolute inset-0 -z-10 rounded-full bg-indigo-500/20 blur-3xl" />

      {/* Back: timetable */}
      <div className="glass absolute top-[0%] left-[0%] w-[80%] -rotate-[8deg] rounded-3xl bg-night-800/60 p-5 [transform-origin:bottom_left] motion-safe:animate-float" style={{ animationDelay: "-2s" }}>
        <p className="text-xs font-medium tracking-wide text-mint/90 uppercase">Timetable</p>
        <ul className="mt-3 space-y-2 text-sm text-ice/80">
          {[
            ["09:00", "Probability Theory", "Room 101"],
            ["10:00", "Linear Models", "Room 204"],
          ].map(([t, c, r]) => (
            <li key={t} className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2">
              <span className="w-12 text-xs text-ice/60">{t}</span>
              <span className="flex-1 truncate">{c}</span>
              <span className="text-xs text-ice/50">{r}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Middle: results */}
      <div className="glass absolute top-[27%] left-[9%] w-[82%] -rotate-[3deg] rounded-3xl bg-night-700/70 p-5 [transform-origin:bottom_left] motion-safe:animate-float" style={{ animationDelay: "-4s" }}>
        <div className="flex items-baseline justify-between">
          <p className="text-xs font-medium tracking-wide text-ice/80 uppercase">Results</p>
          <p className="text-xs text-ice/60">Semester 6 GPA 3.70</p>
        </div>
        <p className="mt-2 text-4xl font-light text-white">
          3.64 <span className="text-sm text-ice/60">CGPA</span>
        </p>
      </div>

      {/* Front: today overview */}
      <div className="glass absolute top-[54%] left-[16%] w-[80%] rotate-[2deg] rounded-3xl bg-night-700/80 p-5 shadow-2xl shadow-indigo-950/60 motion-safe:animate-float">
        <div className="flex items-center gap-4">
          <RingGauge value={92} size={84} tone="dark" label="Illustrative attendance 92 percent" />
          <div>
            <p className="text-xs font-medium tracking-wide text-mint/90 uppercase">Attendance</p>
            <p className="mt-1 text-sm text-white">Good morning — you&apos;re on track.</p>
            <p className="text-xs text-ice/60">4 of 4 classes marked present</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-black/25 px-4 py-3 text-sm text-ice/80">
          <span>Next: Linear Models · 10:00</span>
          <span aria-hidden>→</span>
        </div>
      </div>

      <p className="absolute right-1 bottom-0 rounded-full bg-night-900/70 px-3 py-1 text-[11px] text-ice/70 backdrop-blur">Illustrative preview</p>
    </div>
  );
}
