"use client";

import { useActionState } from "react";
import { Logo } from "@/components/brand/Logo";
import { AlertIcon, CalendarCheckIcon, ChartIcon, ClockIcon } from "@/components/icons";
import CircularGallery from "@/components/gallery/CircularGallery";
import DotField from "@/components/effects/DotField";
import { loginAction, type LoginState } from "./actions";

const FEATURES = [
  { icon: CalendarCheckIcon, label: "Attendance" },
  { icon: ChartIcon, label: "Results & GPA" },
  { icon: ClockIcon, label: "Timetable" },
];

// Placeholder tiles (public/gallery/) labeling the university, college, and
// three programs — not photographs, since no real campus/department photos
// have been supplied yet. Swap `image` for a real photo path per item
// whenever they're available; `text` can stay or be replaced with a caption.
const GALLERY_ITEMS = [
  { image: "/gallery/placeholder-1.jpg", text: "University of the Punjab" },
  { image: "/gallery/placeholder-2.jpg", text: "CSAS" },
  { image: "/gallery/placeholder-3.jpg", text: "BS Statistics" },
  { image: "/gallery/placeholder-4.jpg", text: "BS Biostatistics" },
  { image: "/gallery/placeholder-5.jpg", text: "BS Computational Statistics" },
  { image: "/gallery/placeholder-6.jpg", text: "CSAS Connect" },
];

const initialState: LoginState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="relative hidden flex-1 overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-700 to-indigo-600 p-10 text-white lg:flex">
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0 opacity-60">
          <DotField
            dotRadius={1.5}
            dotSpacing={14}
            bulgeStrength={55}
            glowRadius={200}
            cursorRadius={300}
            cursorForce={0.1}
            bulgeOnly
            gradientFrom="rgba(224, 231, 255, 0.55)"
            gradientTo="rgba(129, 140, 248, 0.3)"
            glowColor="#EEF2FF"
          />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 z-0 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-16 z-0 h-80 w-80 rounded-full bg-sky-400/10 blur-3xl"
        />

        <div className="relative z-10 flex flex-1 flex-col justify-between">
          <Logo size="lg" tone="dark" />

          <div className="max-w-sm">
            <h1 className="text-3xl font-semibold tracking-tight">A single home for CSAS academic records.</h1>
            <p className="mt-3 text-sm leading-relaxed text-indigo-100">
              Attendance, results, GPA/CGPA and timetables for BS Statistics, BS Biostatistics and BS Computational
              Statistics — Regular and Replica sections — in one portal for students, teachers and administrators.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {FEATURES.map((f) => (
                <span
                  key={f.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-indigo-50 backdrop-blur-sm"
                >
                  <f.icon className="h-3.5 w-3.5" />
                  {f.label}
                </span>
              ))}
            </div>
          </div>

          <div className="h-80 w-full overflow-hidden rounded-xl border border-white/10 bg-black/10 shadow-inner">
            <CircularGallery
              items={GALLERY_ITEMS}
              bend={1.1}
              textColor="#ffffff"
              borderRadius={0.06}
              font="600 20px system-ui, sans-serif"
              scrollSpeed={1.5}
              scrollEase={0.06}
            />
          </div>

          <p className="text-xs text-indigo-200">University of the Punjab · College of Statistical &amp; Actuarial Sciences</p>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
        <div aria-hidden className="pointer-events-none absolute top-0 right-0 h-72 w-72 translate-x-1/3 -translate-y-1/3 rounded-full bg-indigo-100/70 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 -translate-x-1/3 translate-y-1/3 rounded-full bg-sky-100/60 blur-3xl" />

        <div className="relative w-full max-w-sm">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo size="md" />
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-400" />
            <div className="p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-slate-900">Sign in</h2>
              <p className="mt-1 text-sm text-slate-500">Use the email and password your administrator gave you.</p>

              <form action={formAction} className="mt-6 flex flex-col gap-4">
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium text-slate-700">Email</span>
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="username"
                    className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="you@csas-connect.local"
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium text-slate-700">Password</span>
                  <input
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="••••••••"
                  />
                </label>

                {state.error && (
                  <p role="alert" className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
                    <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                    {state.error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={pending}
                  className="mt-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-60"
                >
                  {pending ? "Signing in…" : "Sign in"}
                </button>
              </form>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            Unofficial student-built demo — not an official University of the Punjab system.
          </p>
        </div>
      </div>
    </div>
  );
}
