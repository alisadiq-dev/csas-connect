"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
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
import type { NavIconName, NavSection } from "./nav-types";

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

function isActive(pathname: string, href: string): boolean {
  return href === pathname || pathname.startsWith(`${href}/`);
}

function SidebarNav({ sections, pathname, onNavigate }: { sections: NavSection[]; pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-5 px-3">
      {sections.map((section, idx) => (
        <div key={section.label ?? idx}>
          {section.label && (
            <p className="px-3 pb-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">{section.label}</p>
          )}
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const Icon = ICONS[item.icon];
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                      active
                        ? "bg-indigo-50 font-medium text-indigo-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-indigo-600" : "text-slate-400"}`} />
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
  const initials = userName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-slate-100 px-4">
          <Logo size="sm" />
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <SidebarNav sections={navSections} pathname={pathname} />
        </div>
        <div className="border-t border-slate-100 p-3">
          <form action="/logout" method="post">
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              <LogoutIcon className="h-[18px] w-[18px] text-slate-400" />
              Log out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Close navigation menu"
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
              <Logo size="sm" />
              <button
                aria-label="Close navigation menu"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
              <SidebarNav sections={navSections} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            </div>
            <div className="border-t border-slate-100 p-3">
              <form action="/logout" method="post">
                <button
                  type="submit"
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  <LogoutIcon className="h-[18px] w-[18px] text-slate-400" />
                  Log out
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
          <button
            aria-label="Open navigation menu"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden"
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
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <BellIcon className="h-5 w-5" />
          </Link>

          <div className="flex items-center gap-2.5 border-l border-slate-200 pl-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
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

        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
