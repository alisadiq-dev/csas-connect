/**
 * Ambient aurora glow (idea from Inspira UI / Aceternity "aurora background"): a few large blurred
 * colour fields drifting slowly. Pure CSS (GPU-composited transforms), no canvas, so it is SSR-safe,
 * cheap on phones, and frozen automatically under `prefers-reduced-motion` (see globals.css).
 */
export function AuroraBackground({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{ maskImage: "linear-gradient(to bottom, #000 62%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, #000 62%, transparent 100%)" }}
    >
      <div className="absolute -top-1/4 -left-1/4 h-[70%] w-[70%] rounded-full bg-indigo-600/30 blur-[110px] motion-safe:animate-aurora" />
      <div className="absolute top-[5%] -right-1/4 h-[60%] w-[60%] rounded-full bg-mint/15 blur-[120px] motion-safe:animate-aurora-slow" />
      <div className="absolute -bottom-1/3 left-1/4 h-[60%] w-[55%] rounded-full bg-sky-500/20 blur-[130px] motion-safe:animate-aurora" style={{ animationDelay: "-8s" }} />
    </div>
  );
}
