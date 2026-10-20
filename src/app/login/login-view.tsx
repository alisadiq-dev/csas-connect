"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { AlertIcon, CalendarCheckIcon, ChartIcon, ClockIcon } from "@/components/icons";
import DeviceScene from "@/components/scene/DeviceScene";
import { AuroraBackground } from "@/components/effects/AuroraBackground";
import { Sparkles } from "@/components/effects/Sparkles";
import type { DemoAccount } from "@/lib/demo-accounts";
import { loginAction, type LoginState } from "./actions";

const FEATURES = [
  { icon: CalendarCheckIcon, label: "Attendance" },
  { icon: ChartIcon, label: "Results & GPA" },
  { icon: ClockIcon, label: "Timetable" },
];

const initialState: LoginState = { error: null };

const inputClass =
  "min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-slate-500 focus-visible:border-indigo-600 focus-visible:bg-indigo-50/30 focus-visible:ring-4 focus-visible:ring-indigo-600/15 motion-reduce:transition-none";

export function LoginView({ demoAccounts }: { demoAccounts: DemoAccount[] }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<DemoAccount["role"] | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Quick-fill for reviewers: the fields stay uncontrolled so the form posts exactly as before.
  const fillDemo = (account: DemoAccount) => {
    if (emailRef.current) emailRef.current.value = account.email;
    if (passwordRef.current) passwordRef.current.value = account.password;
    setSelectedRole(account.role);
    passwordRef.current?.focus();
  };

  return (
    <div className="grid min-h-screen bg-night-950 lg:grid-cols-[1.2fr_1fr]">
      {/* Brand + 3D panel: compact band on phones, full-height column on desktop. */}
      <section
        aria-label="CSAS Connect"
        className="relative flex flex-col overflow-hidden bg-gradient-to-br from-night-950 via-night-800 to-indigo-900 text-white lg:min-h-screen lg:p-10"
      >
        <AuroraBackground />
        <Sparkles />
        <div aria-hidden className="night-grid pointer-events-none absolute inset-0" />
        <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-indigo-500/25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-mint/10 blur-3xl" />

        <div className="relative z-10 hidden lg:block">
          <Logo size="lg" tone="dark" />
        </div>

        <div className="relative z-10 hidden max-w-lg lg:mt-8 lg:block">
          <h1 className="text-4xl font-light tracking-tight text-balance">Your department, <span className="text-gradient">in one place.</span></h1>
          <p className="mt-3 text-sm leading-relaxed text-ice/75">
            Attendance, results, GPA/CGPA and timetables for BS Statistics, BS Biostatistics and BS Computational
            Statistics — Regular and Replica sections — in one portal for students, teachers and administrators.
          </p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {FEATURES.map((f) => (
              <li
                key={f.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-ice/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-ice backdrop-blur-sm"
              >
                <f.icon className="h-3.5 w-3.5" />
                {f.label}
              </li>
            ))}
          </ul>
        </div>

        <DeviceScene className="relative z-10 h-64 w-full sm:h-72 lg:mt-4 lg:h-auto lg:min-h-0 lg:flex-1" />

        <p className="relative z-10 hidden text-xs text-ice/60 lg:block">
          University of the Punjab · College of Statistical &amp; Actuarial Sciences
        </p>
      </section>

      <main className="relative flex flex-col items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
        <div aria-hidden className="pointer-events-none absolute top-0 right-0 h-72 w-72 translate-x-1/3 -translate-y-1/3 rounded-full bg-indigo-600/25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 -translate-x-1/3 translate-y-1/3 rounded-full bg-mint/10 blur-3xl" />

        <Link
          href="/"
          className="absolute top-5 left-5 rounded-full px-3 py-1.5 text-xs text-ice/70 hover:text-white focus-visible:ring-2 focus-visible:ring-ice focus-visible:outline-none sm:left-8"
        >
          ← Back to home
        </Link>

        <div className="relative w-full max-w-sm mt-8 lg:mt-0">
          <div className="mb-6 flex justify-center lg:hidden">
            <Logo size="md" tone="dark" />
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl shadow-black/40">
            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-sky-400 to-mint" />
            <div className="p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-slate-900">Sign in</h2>
              <p className="mt-1 text-sm text-slate-600">Use the email and password your administrator gave you.</p>

              {demoAccounts.length > 0 && (
                <fieldset className="mt-5 rounded-2xl bg-slate-50 p-3">
                  <legend className="px-1 text-xs font-medium text-slate-600">Quick fill a test account</legend>
                  <div className="mt-1 grid grid-cols-3 gap-2">
                    {demoAccounts.map((a) => (
                      <button
                        key={a.role}
                        type="button"
                        onClick={() => fillDemo(a)}
                        aria-pressed={selectedRole === a.role}
                        className="min-h-11 rounded-xl border border-slate-200 bg-white px-2 text-sm font-medium text-slate-700 transition-[background-color,border-color,color,transform] duration-200 hover:border-indigo-300 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-indigo-600/40 focus-visible:outline-none aria-pressed:border-indigo-600 aria-pressed:bg-indigo-600 aria-pressed:text-white motion-reduce:transition-none"
                      >
                        {a.label === "Administrator" ? "Admin" : a.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              <form action={formAction} className="mt-6 flex flex-col gap-4">
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium text-slate-700">Email</span>
                  <input
                    ref={emailRef}
                    name="email"
                    type="email"
                    required
                    autoComplete="username"
                    aria-describedby={state.error ? "login-error" : undefined}
                    className={inputClass}
                    placeholder="you@csas-connect.local"
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium text-slate-700">Password</span>
                  <span className="relative">
                    <input
                      ref={passwordRef}
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      aria-describedby={state.error ? "login-error" : undefined}
                      className={`${inputClass} pr-16`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-pressed={showPassword}
                      className="absolute inset-y-0 right-1.5 my-1.5 min-w-11 rounded-lg px-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50 focus-visible:ring-2 focus-visible:ring-indigo-600/40 focus-visible:outline-none"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </span>
                </label>

                {state.error && (
                  <p id="login-error" role="alert" className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
                    <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                    {state.error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={pending}
                  aria-busy={pending}
                  className="mt-1 inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full bg-indigo-600 px-4 py-3 text-base font-medium text-white transition-[background-color,transform] duration-200 hover:bg-indigo-700 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-indigo-600/40 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-80 motion-reduce:transition-none"
                >
                  {pending && (
                    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 motion-safe:animate-spin" fill="none">
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".3" strokeWidth="3" />
                      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  )}
                  {pending ? "Signing in…" : "Sign in"}
                </button>
                <p role="status" aria-live="polite" className="sr-only">
                  {pending ? "Signing you in" : ""}
                </p>
              </form>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-ice/60">
            Unofficial student-built demo — not an official University of the Punjab system.
          </p>
          <p className="mt-2 text-center text-[11px] leading-relaxed text-ice/50">
            3D models: “MacBook Pro 13 inch 2020” by timblewee and “Apple iPhone 15 Pro Max Black” by polyman Studio,
            via Sketchfab,{" "}
            <a className="underline hover:text-white" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">
              CC BY 4.0
            </a>
            . Scene built with{" "}
            <a className="underline hover:text-white" href="https://threepipe.org" target="_blank" rel="noreferrer">
              threepipe
            </a>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
