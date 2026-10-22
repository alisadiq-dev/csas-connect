"use client";

import { motion, useReducedMotion } from "motion/react";
import { TiltCard } from "@/components/effects/TiltCard";
import { StatNumber } from "@/components/marketing/StatNumber";

/**
 * 3D-feeling circular attendance gauge: glowing arc springs to its value, number rolls in the centre,
 * the whole dial tilts toward the pointer (mouse only). Emerald when on track, rose below the 75% line.
 * `value` is the real percentage computed by the existing attendance rules.
 */
export function AttendanceGauge({ value, size = 112 }: { value: number; size?: number }) {
  const reduce = useReducedMotion();
  const pct = Math.max(0, Math.min(100, value));
  const low = pct < 75;
  const color = low ? "#fb7185" : "#34d399";
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  return (
    <TiltCard className="rounded-full" maxTilt={14}>
      <div className="relative" style={{ width: size, height: size, filter: `drop-shadow(0 0 14px ${color}55)` }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" role="img" aria-label={`Overall attendance ${pct} percent${low ? ", below the 75 percent threshold" : ""}`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(186 215 245 / 0.14)" strokeWidth={stroke} />
          {/* 75% threshold tick */}
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(246 180 90 / 0.55)" strokeWidth={stroke + 2} strokeDasharray={`1.5 ${c}`} strokeDashoffset={-c * 0.75} />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: reduce ? c * (1 - pct / 100) : c }}
            animate={{ strokeDashoffset: c * (1 - pct / 100) }}
            transition={{ type: "spring", stiffness: 36, damping: 14, mass: 1 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-3xl font-light text-white">
          <StatNumber value={pct} suffix="%" suffixClassName="text-base text-ice/70" />
        </div>
      </div>
    </TiltCard>
  );
}
