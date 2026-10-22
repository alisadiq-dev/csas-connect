// Aceternity-style meteor streaks. CSS only; fixed positions (no Math.random → no hydration mismatch);
// hidden on small screens and when the user prefers reduced motion.
const METEORS: [number, number, number][] = [
  [8, 0, 5.5], [22, 2.4, 7], [37, 1.1, 6], [51, 3.6, 8], [66, 0.6, 6.5], [79, 2.9, 7.5], [91, 1.8, 5.8],
];

export function Meteors({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 hidden overflow-hidden motion-safe:md:block ${className}`}>
      {METEORS.map(([left, delay, duration], i) => (
        <span
          key={i}
          className="absolute top-[-4%] h-px w-24 rounded-full bg-gradient-to-r from-ice/70 to-transparent motion-safe:animate-meteor"
          style={{ left: `${left}%`, animationDelay: `${delay}s`, animationDuration: `${duration}s` }}
        >
          <span className="absolute -left-0.5 -top-[1px] h-[3px] w-[3px] rounded-full bg-white shadow-[0_0_8px_2px_rgb(186_215_245/0.6)]" />
        </span>
      ))}
    </div>
  );
}
