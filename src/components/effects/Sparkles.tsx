// Subtle particle accents. Positions are fixed (not Math.random) so server and client markup match
// and there is no hydration mismatch; the second half is hidden on small screens to keep phones light.
const DOTS: [number, number, number, number][] = [
  [8, 14, 2, 0], [18, 62, 1.5, 1.2], [27, 28, 2, 2.4], [36, 80, 1.5, 0.6], [44, 18, 2.5, 1.8], [52, 48, 1.5, 3],
  [61, 72, 2, 0.9], [70, 24, 1.5, 2.1], [78, 56, 2, 3.3], [86, 12, 1.5, 1.5], [92, 68, 2, 0.3], [14, 90, 1.5, 2.7],
  [33, 44, 1.5, 3.6], [57, 8, 2, 1], [74, 86, 1.5, 2.4], [96, 38, 2, 0.5],
];

export function Sparkles({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {DOTS.map(([x, y, size, delay], i) => (
        <span
          key={i}
          className={`absolute rounded-full bg-ice opacity-20 motion-safe:animate-twinkle ${i >= 8 ? "max-sm:hidden" : ""}`}
          style={{ left: `${x}%`, top: `${y}%`, width: size * 2, height: size * 2, animationDelay: `${delay}s` }}
        />
      ))}
    </div>
  );
}
