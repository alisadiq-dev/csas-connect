"use client";

import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import type { DeviceFocus, DeviceSceneHandle } from "./device-scene-runtime";

// Fades the canvas edges so a device cropped by the camera framing dissolves into the
// panel gradient instead of ending in a hard line.
const EDGE_FADE = {
  maskImage:
    "linear-gradient(to bottom, transparent 0, #000 6%, #000 84%, transparent 100%), linear-gradient(to right, transparent 0, #000 5%, #000 95%, transparent 100%)",
  maskComposite: "intersect",
  WebkitMaskImage:
    "linear-gradient(to bottom, transparent 0, #000 6%, #000 84%, transparent 100%), linear-gradient(to right, transparent 0, #000 5%, #000 95%, transparent 100%)",
  WebkitMaskComposite: "source-in",
} as const;

type Status = "loading" | "ready" | "fallback";

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Decorative interactive 3D scene (laptop + phone showing CSAS Connect UI).
 * The three.js/threepipe code (~1 MB) and the 12 MB model are only fetched on
 * the client after mount, so the sign-in form never waits on them. If WebGL is
 * unavailable or anything fails, a static branded panel is shown instead.
 */
export default function DeviceScene({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<DeviceSceneHandle | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [focus, setFocus] = useState<DeviceFocus>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const controller = new AbortController();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const lowPower = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768 || (memory !== undefined && memory <= 4);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setStatus("fallback");
    };
    canvas.addEventListener("webglcontextlost", onContextLost);

    // Checked inside the promise chain so no state is set synchronously in the effect,
    // and so the ~1 MB scene chunk is never fetched when WebGL is missing.
    Promise.resolve()
      .then(() => {
        if (!hasWebGL()) throw new Error("WebGL is not available");
        return import("./device-scene-runtime");
      })
      .then(({ createDeviceScene }) =>
        createDeviceScene({
          canvas,
          modelUrl: "/models/tabletop_macbook_iphone.glb",
          lowPower,
          reducedMotion,
          signal: controller.signal,
          onFocusChange: setFocus,
        }),
      )
      .then((handle) => {
        if (!handle) return;
        if (controller.signal.aborted) {
          handle.dispose();
          return;
        }
        handleRef.current = handle;
        setStatus("ready");
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.warn("3D scene unavailable, showing static fallback:", err);
        setStatus("fallback");
      });

    return () => {
      controller.abort();
      canvas.removeEventListener("webglcontextlost", onContextLost);
      handleRef.current?.dispose();
      handleRef.current = null;
    };
  }, []);

  const toggle = (device: Exclude<DeviceFocus, null>) => handleRef.current?.setFocus(focus === device ? null : device);

  return (
    <div className={`relative isolate overflow-hidden ${className}`} data-scene-status={status}>
      {status !== "ready" && (
        <div
          className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-4 text-center"
          role={status === "loading" ? "status" : undefined}
        >
          <Logo size="lg" tone="dark" />
          <p className="max-w-xs text-sm text-indigo-100/90">
            {status === "loading" ? "Preparing your campus view…" : "Attendance, results and timetables — all in one place."}
          </p>
          {status === "loading" && <span className="h-1 w-24 animate-pulse rounded-full bg-white/40 motion-reduce:animate-none" />}
        </div>
      )}

      {/* Canvas sits below the controls and never receives the form's pointer events (it lives in its own panel). */}
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Interactive 3D laptop and phone showing the CSAS Connect dashboard"
        style={EDGE_FADE}
        className={`absolute inset-0 z-10 h-full w-full touch-pan-y outline-none transition-opacity duration-700 ${
          status === "ready" ? "opacity-100" : "opacity-0"
        }`}
      />

      {status === "ready" && (
        <div className="absolute inset-x-0 bottom-3 z-20 flex justify-center gap-2">
          {(
            [
              ["macbook", "Laptop"],
              ["iphone", "Phone"],
            ] as const
          ).map(([device, label]) => (
            <button
              key={device}
              type="button"
              aria-pressed={focus === device}
              onClick={() => toggle(device)}
              className="rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none aria-pressed:bg-white aria-pressed:text-indigo-900"
            >
              {focus === device ? `Close ${label.toLowerCase()}` : `Explore ${label.toLowerCase()}`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
