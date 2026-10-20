import Link from "next/link";
import type { ComponentProps } from "react";

/**
 * Primary call-to-action with a light sheen sweeping across it (Inspira UI "shimmer button" idea).
 * Renders a real link (keyboard + SEO friendly). 48px tall for comfortable thumb taps; the sheen stops
 * under `prefers-reduced-motion`.
 */
export function ShimmerButton({ className = "", children, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      className={`shimmer-sheen relative inline-flex min-h-12 items-center justify-center gap-2 overflow-hidden rounded-full bg-ice px-7 text-base font-medium text-night-900 transition-[background-color,transform] duration-200 hover:bg-white active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-night-950 focus-visible:outline-none motion-reduce:transition-none ${className}`}
    >
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </Link>
  );
}
