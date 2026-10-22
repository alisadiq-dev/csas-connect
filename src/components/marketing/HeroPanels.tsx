"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useEffect } from "react";
import { RingGauge } from "@/components/ui/charts";

/**
 * Hero centrepiece: a stack of glass "portal" cards in real 3D (perspective + preserve-3d, each layer at
 * its own translateZ). The whole stack tilts toward the cursor on desktop and with device orientation
 * on phones that expose it without a permission prompt; springs smooth the motion. Pure CSS 3D + transforms
 * (no WebGL), so it is cheap on low-power devices; static under prefers-reduced-motion.
 * All figures are illustrative sample data and labelled as such.
 */
export function HeroPanels() {
  const reduce = useReducedMotion();
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 110, damping: 16, mass: 0.5 });
  const sy = useSpring(py, { stiffness: 110, damping: 16, mass: 0.5 });
  const rotateY = useTransform(sx, [-0.5, 0.5], [-14, 14]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [11, -11]);
  const glowX = useTransform(sx, [-0.5, 0.5], [-40, 40]);

  useEffect(() => {
    if (reduce) return;
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      px.set(e.clientX / window.innerWidth - 0.5);
      py.set(e.clientY / window.innerHeight - 0.5);
    };
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      px.set(Math.max(-0.5, Math.min(0.5, e.gamma / 60)));
      py.set(Math.max(-0.5, Math.min(0.5, (e.beta - 45) / 90)));
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    // Read the API through `window`: some WebKit builds have no DeviceOrientationEvent global at all, and a bare
    // reference would throw a ReferenceError and take the whole page down. iOS also gates it behind a permission
    // prompt; we never ask on page load, we just skip it there.
    const DOE = (window as unknown as { DeviceOrientationEvent?: { requestPermission?: unknown } }).DeviceOrientationEvent;
    const needsPermission = typeof DOE?.requestPermission === "function";
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (DOE && coarse && !needsPermission) window.addEventListener("deviceorientation", onOrient, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("deviceorientation", onOrient);
    };
  }, [reduce, px, py]);

  return (
    <div
      className="relative mx-auto aspect-[1/1.02] w-full max-w-[34rem]"
      style={{ perspective: "1100px" }}
      role="img"
      aria-label="Illustrative 3D preview of CSAS Connect timetable, results and attendance cards"
    >
      <motion.div
        aria-hidden
        className="absolute inset-0 -z-10 rounded-full bg-indigo-500/25 blur-3xl"
        style={reduce ? undefined : { x: glowX }}
      />
      <motion.div className="absolute inset-0 [transform-style:preserve-3d]" style={reduce ? { rotateX: 4, rotateY: -6 } : { rotateX, rotateY }}>
        {/* Back: timetable */}
        <div
          className="glass absolute top-[0%] left-[0%] w-[80%] -rotate-[8deg] rounded-3xl bg-night-800/60 p-5 [transform-origin:bottom_left] motion-safe:animate-float"
          style={{ translate: "0 0 -40px", animationDelay: "-2s" }}
        >
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
        <div
          className="glass absolute top-[27%] left-[9%] w-[82%] -rotate-[3deg] rounded-3xl bg-night-700/70 p-5 [transform-origin:bottom_left] motion-safe:animate-float"
          style={{ translate: "0 0 10px", animationDelay: "-4s" }}
        >
          <div className="flex items-baseline justify-between">
            <p className="text-xs font-medium tracking-wide text-ice/80 uppercase">Results</p>
            <p className="rounded-full bg-ember/15 px-2.5 py-0.5 text-xs text-ember">↑ 0.10 vs last semester</p>
          </div>
          <p className="mt-2 text-4xl font-light text-white">
            3.64 <span className="text-sm text-ice/60">CGPA</span>
          </p>
        </div>

        {/* Front: today overview */}
        <div
          className="glass absolute top-[54%] left-[16%] w-[80%] rotate-[2deg] rounded-3xl bg-night-700/85 p-5 shadow-2xl shadow-indigo-950/60 motion-safe:animate-float"
          style={{ translate: "0 0 70px" }}
        >
          <div className="flex items-center gap-4">
            <RingGauge value={92} size={84} tone="dark" label="Illustrative attendance 92 percent" />
            <div>
              <p className="text-xs font-medium tracking-wide text-mint/90 uppercase">Attendance</p>
              <p className="mt-1 text-sm text-white">Right on track — keep it up.</p>
              <p className="text-xs text-ice/60">4 of 4 classes marked present</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-black/25 px-4 py-3 text-sm text-ice/80">
            <span className="flex items-center gap-2">
              <span className="relative flex h-2 w-2" aria-hidden>
                <span className="absolute inline-flex h-full w-full rounded-full bg-ember opacity-70 motion-safe:animate-pulse-ring" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-ember" />
              </span>
              Up next: Linear Models · 10:00
            </span>
            <span aria-hidden>→</span>
          </div>
        </div>

        {/* Floating badge, closest layer with ambient glow */}
        <div
          className="absolute top-[44%] right-[0%] rounded-full border border-ember/40 bg-night-900/80 px-3.5 py-1.5 text-xs text-ember shadow-[0_0_28px_rgb(246_180_90/0.35)] backdrop-blur motion-safe:animate-float"
          style={{ translate: "0 0 120px", animationDelay: "-1s" }}
        >
          ✦ Fall 2026
        </div>
      </motion.div>

      <p className="absolute right-1 bottom-0 rounded-full bg-night-900/70 px-3 py-1 text-[11px] text-ice/70 backdrop-blur">Illustrative preview</p>
    </div>
  );
}
