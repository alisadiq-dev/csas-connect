"use client";

import { useRef, type ReactNode } from "react";

/**
 * Cursor-following spotlight (Aceternity "spotlight" idea): a soft radial light tracks the pointer inside
 * the wrapper. Mouse/pen only — touch and reduced-motion get a static, centred glow. Updates a CSS
 * variable inside rAF, so no React re-renders.
 */
export function Spotlight({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const raf = useRef(0);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    const el = ref.current;
    if (!el) return;
    const { clientX, clientY } = e;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--sx", `${clientX - r.left}px`);
      el.style.setProperty("--sy", `${clientY - r.top}px`);
    });
  };

  return (
    <div ref={ref} onPointerMove={onMove} className={`relative ${className}`}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70 motion-reduce:opacity-40"
        style={{ background: "radial-gradient(520px circle at var(--sx, 50%) var(--sy, 30%), rgb(91 140 255 / 0.16), rgb(246 180 90 / 0.05) 45%, transparent 70%)" }}
      />
      {children}
    </div>
  );
}
