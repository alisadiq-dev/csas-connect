"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId } from "react";

/**
 * Small animated trend line: the stroke draws itself in (spring), then the area fades up. Static under
 * reduced motion. Values are real series passed by the caller; with fewer than 2 points nothing is drawn.
 */
export function Sparkline({
  values,
  width = 160,
  height = 48,
  tone = "light",
  ariaLabel,
}: {
  values: number[];
  width?: number;
  height?: number;
  tone?: "light" | "dark";
  ariaLabel: string;
}) {
  const reduce = useReducedMotion();
  const gid = useId();
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const pad = 4;
  const pts = values.map((v, i) => [pad + (i / (values.length - 1)) * (width - pad * 2), height - pad - (v / max) * (height - pad * 2)] as const);
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)} ${height} L${pts[0][0].toFixed(1)} ${height} Z`;
  const stroke = tone === "dark" ? "#6beccd" : "#4f46e5";
  const last = pts[pts.length - 1];

  return (
    <svg role="img" aria-label={ariaLabel} width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="max-w-full overflow-visible">
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop stopColor={stroke} stopOpacity=".28" />
          <stop offset="1" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path d={area} fill={`url(#${gid})`} initial={reduce ? false : { opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.5, duration: 0.6 }} />
      <motion.path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduce ? false : { pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 40, damping: 18, mass: 1 }}
      />
      <circle cx={last[0]} cy={last[1]} r={3.2} fill={stroke} />
      <circle cx={last[0]} cy={last[1]} r={6.5} fill={stroke} opacity=".2" />
    </svg>
  );
}
