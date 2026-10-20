"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { useCopy } from "@/hooks/use-copy";
import type { DemoAccount } from "@/lib/demo-accounts";

/** Collapsible test-credentials panel: every value copies with one tap (44px targets). */
export function DemoAccounts({ accounts }: { accounts: DemoAccount[] }) {
  const [open, setOpen] = useState(false);
  const { copied, copy } = useCopy();
  const panelId = useId();

  if (accounts.length === 0) return null;

  return (
    <div className="glass mx-auto w-full max-w-2xl rounded-3xl bg-night-800/50">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-14 w-full items-center justify-between gap-4 rounded-3xl px-5 py-3 text-left focus-visible:ring-2 focus-visible:ring-ice focus-visible:outline-none"
      >
        <span>
          <span className="block font-medium text-white">Try it with a test account</span>
          <span className="block text-sm text-ice/65">Demo logins for reviewers — tap any value to copy</span>
        </span>
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          className={`h-5 w-5 shrink-0 text-ice transition-transform duration-300 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m5 8 5 5 5-5" />
        </svg>
      </button>

      <div
        id={panelId}
        role="region"
        aria-label="Test accounts"
        className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden" inert={!open}>
          <ul className="flex flex-col gap-3 px-5 pb-5">
            {accounts.map((a) => (
              <li key={a.role} className="rounded-2xl bg-night-900/60 p-4">
                <p className="text-xs font-medium tracking-wider text-mint/90 uppercase">{a.label}</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {(
                    [
                      ["email", "Email", a.email],
                      ["password", "Password", a.password],
                    ] as const
                  ).map(([field, label, value]) => {
                    const key = `${a.role}-${field}`;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => copy(key, value)}
                        aria-label={`Copy ${a.label.toLowerCase()} ${label.toLowerCase()}`}
                        className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-ice/15 px-3 py-2 text-left text-sm text-ice transition-colors hover:border-ice/40 hover:bg-white/5 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ice focus-visible:outline-none"
                      >
                        <span className="min-w-0">
                          <span className="block text-[11px] text-ice/50">{label}</span>
                          <span className="block truncate font-mono text-[13px]">{value}</span>
                        </span>
                        <span className={`shrink-0 text-xs ${copied === key ? "text-mint" : "text-ice/50"}`}>
                          {copied === key ? "Copied" : "Copy"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
          <div className="px-5 pb-5">
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center rounded-full border border-ice/25 px-5 text-sm text-ice hover:border-ice/60 hover:text-white focus-visible:ring-2 focus-visible:ring-ice focus-visible:outline-none"
            >
              Go to sign-in →
            </Link>
          </div>
          <p role="status" aria-live="polite" className="sr-only">
            {copied ? "Copied to clipboard" : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
