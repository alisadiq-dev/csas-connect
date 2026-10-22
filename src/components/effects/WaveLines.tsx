/** Gentle wavy lines drifting behind the hero. Three SVG paths on the compositor; static for reduced motion; skipped on phones. */
export function WaveLines({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1440 320"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute inset-x-[-5%] bottom-0 h-56 w-[110%] max-sm:hidden ${className}`}
      fill="none"
    >
      {[
        { d: "M0 220 C 240 150, 480 290, 720 210 S 1200 130, 1440 200", o: 0.35, delay: "0s" },
        { d: "M0 250 C 260 200, 500 300, 760 240 S 1220 190, 1440 250", o: 0.22, delay: "-5s" },
        { d: "M0 190 C 220 120, 520 250, 740 170 S 1180 110, 1440 170", o: 0.16, delay: "-9s" },
      ].map((w, i) => (
        <path key={i} d={w.d} stroke="url(#wave-grad)" strokeOpacity={w.o} strokeWidth="1.5" className="motion-safe:animate-wave" style={{ animationDelay: w.delay }} />
      ))}
      <defs>
        <linearGradient id="wave-grad" x1="0" x2="1">
          <stop stopColor="#5b8cff" />
          <stop offset=".6" stopColor="#6beccd" />
          <stop offset="1" stopColor="#f6b45a" />
        </linearGradient>
      </defs>
    </svg>
  );
}
