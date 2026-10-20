"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { MenuIcon, XIcon } from "@/components/icons";

const LINKS = [
  { href: "#workspace", label: "Portal" },
  { href: "#programs", label: "Programs" },
  { href: "#roles", label: "Who it's for" },
  { href: "#community", label: "Notices & events" },
];

/** Floating glass pill navigation (pattern observed on the reference), collapsing to a menu on small screens. */
export function MarketingNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-[calc(0.75rem+env(safe-area-inset-top))] sm:px-6 sm:pt-[calc(1.25rem+env(safe-area-inset-top))]">
      <div className="glass mx-auto flex max-w-6xl items-center justify-between rounded-2xl bg-night-900/70 px-3 py-2 sm:px-4">
        <Link href="/" aria-label="CSAS Connect home" className="flex min-h-11 items-center rounded-lg focus-visible:ring-2 focus-visible:ring-ice focus-visible:outline-none">
          <Logo size="sm" tone="dark" subtitle={false} className="sm:hidden" />
          <Logo size="sm" tone="dark" className="hidden sm:flex" />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm text-ice/80 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-ice focus-visible:outline-none"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-ice px-5 text-sm font-medium whitespace-nowrap active:scale-[0.97] text-night-900 transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            Sign in
          </Link>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="marketing-menu"
            onClick={() => setOpen((v) => !v)}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-ice hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-ice focus-visible:outline-none md:hidden"
          >
            {open ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="marketing-menu"
          aria-label="Mobile"
          className="glass mx-auto mt-2 flex max-w-6xl flex-col gap-1 rounded-2xl bg-night-900/90 p-2 md:hidden"
        >
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="flex min-h-12 items-center rounded-xl px-4 text-base text-ice hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-ice focus-visible:outline-none"
            >
              {l.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
