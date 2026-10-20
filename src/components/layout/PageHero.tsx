import type { ReactNode } from "react";

/** Night-palette banner at the top of role dashboards (matches the public pages). */
export function PageHero({
  eyebrow,
  title,
  description,
  aside,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-night-900 via-night-800 to-indigo-900 p-5 text-white sm:p-7">
      <div aria-hidden className="night-grid absolute inset-0 opacity-70" />
      <div aria-hidden className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-indigo-500/30 blur-3xl" />
      <div className="relative flex flex-wrap items-center justify-between gap-5">
        <div className="min-w-0">
          {eyebrow && <p className="text-xs font-medium tracking-wider text-mint/90 uppercase">{eyebrow}</p>}
          <h1 className="mt-1 text-2xl font-light tracking-tight sm:text-3xl">{title}</h1>
          {description && <p className="mt-1.5 max-w-xl text-sm text-ice/70">{description}</p>}
        </div>
        {aside && <div className="shrink-0">{aside}</div>}
      </div>
    </div>
  );
}
