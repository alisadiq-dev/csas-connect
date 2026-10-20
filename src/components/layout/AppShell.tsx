"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import {
  BellIcon,
  BookIcon,
  BuildingIcon,
  CalendarCheckIcon,
  ChartIcon,
  ClockIcon,
  GridIcon,
  LayersIcon,
  LinkIcon,
  LogoutIcon,
  MegaphoneIcon,
  MenuIcon,
  UserIcon,
  UsersIcon,
  XIcon,
} from "@/components/icons";
import type { NavIconName, NavItem, NavSection } from "./nav-types";

const ICONS: Record<NavIconName, (props: { className?: string }) => ReactNode> = {
  dashboard: GridIcon,
  attendance: CalendarCheckIcon,
  results: ChartIcon,
  timetable: ClockIcon,
  notices: BellIcon,
  programs: BuildingIcon,
  batches: LayersIcon,
  courses: BookIcon,
  offerings: LinkIcon,
  teachers: UserIcon,
  students: UsersIcon,
  feed: MegaphoneIcon,
};

function matches(pathname: string, href: string): boolean {
  return href === pathname || pathname.startsWith(`${href}/`);
}

/** Only the most specific matching link is active (so "/student" isn't lit on "/student/attendance"). */
function activeHref(pathname: string, sections: NavSection[]): string | undefined {
  return sections
    .flatMap((s) => s.items.map((i) => i.href))
    .filter((href) => matches(pathname, href))
    .sort((a, b) => b.length - a.length)[0];
}

function SidebarNav({ sections, pathname, onNavigate }: { sections: NavSection[]; pathname: string; onNavigate?: () => void }) {
  const current = activeHref(pathname, sections);
  return (
    <nav className="flex flex-col gap-5 px-3">
      {sections.map((section, idx) => (
        <div key={section.label ?? idx}>
          {section.label && (
            <p className="px-3 pb-1.5 text-[11px] font-semibold tracking-wider text-ice/40 uppercase">{section.label}</p>
          )}
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const Icon = ICONS[item.icon];
              const active = item.href === current;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-11 items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                      active
                        ? "bg-white/10 font-medium text-white shadow-[inset_2px_0_0_0_var(--color-mint)]"
                        : "text-ice/70 hover:bg-white/5 hover:text-white"
                    } focus-visible:ring-2 focus-visible:ring-ice focus-visible:outline-none`}
                  >
                    <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-mint" : "text-ice/50"}`} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** Floating thumb-reach tab bar for phones/tablets (hidden on desktop, where the sidebar is used). */
function BottomNav({ sections, pathname, onMore }: { sections: NavSection[]; pathname: string; onMore: () => void }) {
  const all: NavItem[] = sections.flatMap((s) => s.items);
  const flagged = all.filter((i) => i.primary);
  const tabs = (flagged.length > 0 ? flagged : all).slice(0, 4);
  const current = activeHref(pathname, sections);

  return (
    <nav
      aria-label="Quick navigation"
      className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-30 lg:hidden"
    >
      <ul className="flex items-stretch rounded-3xl border border-white/10 bg-night-900/90 p-1.5 shadow-2xl shadow-black/30 backdrop-blur-xl">
        {tabs.map((item) => {
          const Icon = ICONS[item.icon];
          const active = item.href === current;
          return (
            <li key={item.href} className="min-w-0 flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 text-[11px] font-medium transition-[background-color,color,transform] duration-200 active:scale-95 focus-visible:ring-2 focus-visible:ring-ice focus-visible:outline-none motion-reduce:transition-none ${
                  active ? "bg-white/10 text-mint" : "text-ice/70"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
        <li className="min-w-0 flex-1">
          <button
            type="button"
            onClick={onMore}
            aria-haspopup="dialog"
            className="flex min-h-14 w-full flex-col items-center justify-center gap-0.5 rounded-2xl px-1 text-[11px] font-medium text-ice/70 transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-ice focus-visible:outline-none motion-reduce:transition-none"
          >
            <MenuIcon className="h-5 w-5" />
            More
          </button>
        </li>
      </ul>
    </nav>
  );
}

export function AppShell({
  roleLabel,
  userName,
  userSubtitle,
  navSections,
  pageTitle,
  pageDescription,
  children,
}: {
  roleLabel: string;
  userName: string;
  userSubtitle?: string;
  navSections: NavSection[];
  pageTitle?: string;
  pageDescription?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);
  const initials = userName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/5 bg-night-900 lg:flex">
        <div className="flex h-16 items-center border-b border-white/5 px-4">
          <Logo size="sm" tone="dark" />
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <SidebarNav sections={navSections} pathname={pathname} />
        </div>
        <div className="border-t border-white/5 p-3">
          <form action="/logout" method="post">
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ice/70 hover:bg-white/5 hover:text-white focus-visible:ring-2 focus-visible:ring-ice focus-visible:outline-none"
            >
              <LogoutIcon className="h-[18px] w-[18px] text-ice/50" />
              Log out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu" data-lenis-prevent>
          <button
            aria-label="Close navigation menu"
            className="absolute inset-0 bg-night-950/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-night-900 pt-safe pb-safe shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-white/5 px-4">
              <Logo size="sm" tone="dark" />
              <button
                aria-label="Close navigation menu"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="scroll-area flex-1 py-4">
              <SidebarNav sections={navSections} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            </div>
            <div className="border-t border-white/5 p-3">
              <form action="/logout" method="post">
                <button
                  type="submit"
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ice/70 hover:bg-white/5 hover:text-white"
                >
                  <LogoutIcon className="h-[18px] w-[18px] text-ice/50" />
                  Log out
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-[calc(4rem+env(safe-area-inset-top))] items-center gap-3 border-b border-slate-200/70 bg-white/80 px-4 pt-safe backdrop-blur-md sm:px-6">
          <button
            aria-label="Open navigation menu"
            onClick={() => setMobileOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none lg:hidden"
          >
            <MenuIcon className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1">
            {pageTitle && <h1 className="truncate text-base font-semibold text-slate-900">{pageTitle}</h1>}
            {pageDescription && <p className="hidden truncate text-xs text-slate-500 sm:block">{pageDescription}</p>}
          </div>

          <Link
            href="/notices"
            aria-label="Notices"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            <BellIcon className="h-5 w-5" />
          </Link>

          <div className="flex items-center gap-2.5 border-l border-slate-200 pl-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-xs font-semibold text-white">
              {initials || "?"}
            </span>
            <div className="hidden leading-tight sm:block">
              <p className="text-sm font-medium text-slate-900">{userName}</p>
              <p className="text-xs text-slate-500">
                {roleLabel}
                {userSubtitle ? ` · ${userSubtitle}` : ""}
              </p>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 pt-6 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-8 lg:pb-8">{children}</main>

        <BottomNav sections={navSections} pathname={pathname} onMore={() => setMobileOpen(true)} />
      </div>
    </div>
  );
}
