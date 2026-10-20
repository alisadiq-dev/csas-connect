import type { ReactNode } from "react";
import { TiltCard } from "@/components/effects/TiltCard";

// Original line illustrations (SVG, no external assets), one per degree program.
function CurveArt() {
  return (
    <svg viewBox="0 0 200 110" className="h-full w-full" fill="none" aria-hidden>
      <path d="M0 100 C 40 100, 55 20, 100 20 S 160 100, 200 100" stroke="url(#g1)" strokeWidth="2" />
      <path d="M0 100 C 40 100, 55 20, 100 20 S 160 100, 200 100 V110 H0Z" fill="url(#g1f)" />
      {[40, 70, 100, 130, 160].map((x, i) => (
        <line key={x} x1={x} x2={x} y1={104 - [12, 55, 82, 55, 12][i]} y2={104} stroke="#bad7f5" strokeOpacity=".35" strokeWidth="6" strokeLinecap="round" />
      ))}
      <defs>
        <linearGradient id="g1" x1="0" x2="1"><stop stopColor="#7aa7ff" /><stop offset="1" stopColor="#6beccd" /></linearGradient>
        <linearGradient id="g1f" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#7aa7ff" stopOpacity=".25" /><stop offset="1" stopColor="#7aa7ff" stopOpacity="0" /></linearGradient>
      </defs>
    </svg>
  );
}
function PulseArt() {
  return (
    <svg viewBox="0 0 200 110" className="h-full w-full" fill="none" aria-hidden>
      <path d="M0 60 H55 L68 30 L88 92 L106 14 L122 70 L132 60 H200" stroke="#6beccd" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      {[28, 160].map((cx) => (
        <circle key={cx} cx={cx} cy="60" r="18" stroke="#bad7f5" strokeOpacity=".3" />
      ))}
      <circle cx="106" cy="14" r="4" fill="#6beccd" />
    </svg>
  );
}
function NodesArt() {
  const pts: [number, number][] = [[30, 80], [70, 30], [110, 70], [150, 25], [175, 85], [100, 100]];
  const edges = [[0, 1], [1, 2], [2, 3], [3, 4], [2, 4], [0, 5], [5, 2]];
  return (
    <svg viewBox="0 0 200 110" className="h-full w-full" fill="none" aria-hidden>
      {edges.map(([a, b]) => (
        <line key={`${a}-${b}`} x1={pts[a][0]} y1={pts[a][1]} x2={pts[b][0]} y2={pts[b][1]} stroke="#bad7f5" strokeOpacity=".35" />
      ))}
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === 2 ? 7 : 5} fill={i === 2 ? "#6beccd" : "#7aa7ff"} />
      ))}
    </svg>
  );
}

const ART: Record<string, { art: ReactNode; blurb: string }> = {
  STAT: { art: <CurveArt />, blurb: "Probability, inference, modelling and the mathematics beneath them." },
  BIOSTAT: { art: <PulseArt />, blurb: "Statistical methods for medicine, public health and the life sciences." },
  CS: { art: <NodesArt />, blurb: "Statistics meets computing: data, algorithms and simulation at scale." },
};
const FALLBACK = { art: <CurveArt />, blurb: "A degree program of the College of Statistical & Actuarial Sciences." };

export function ProgramCards({ programs }: { programs: { id: string; name: string; code: string }[] }) {
  return (
    <ul className="grid gap-5 md:grid-cols-3">
      {programs.map((p, i) => {
        const meta = ART[p.code.toUpperCase()] ?? FALLBACK;
        return (
          <li
            key={p.id}
            data-reveal
            style={{ "--reveal-delay": `${i * 90}ms` } as React.CSSProperties}
          >
            <TiltCard className="glass group relative h-full overflow-hidden rounded-3xl bg-night-800/60 p-6 transition-colors hover:bg-night-700/60">
            <div className="mb-6 h-32 rounded-2xl bg-night-900/60 p-3 transition-transform duration-500 group-hover:scale-[1.03]">{meta.art}</div>
            <p className="text-xs font-medium tracking-wider text-mint/90 uppercase">{p.code}</p>
            <h3 className="mt-1 text-xl font-medium text-white">{p.name}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ice/70">{meta.blurb}</p>
            <p className="mt-4 text-xs text-ice/50">Regular and Replica sections</p>
            </TiltCard>
          </li>
        );
      })}
    </ul>
  );
}
