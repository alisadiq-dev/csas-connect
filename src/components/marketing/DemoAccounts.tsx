"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, Copy } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { useCopy } from "@/hooks/use-copy";
import type { DemoAccount } from "@/lib/demo-accounts";

/** Collapsible test-credentials panel: every value copies with one tap (44px targets). */
export function DemoAccounts({ accounts }: { accounts: DemoAccount[] }) {
  const [open, setOpen] = useState(false);
  const { copied, failed, copy } = useCopy();
  const panelId = useId();

  if (accounts.length === 0) return null;

  return (
    <div className="glass mx-auto w-full max-w-2xl rounded-3xl bg-night-800/40 text-left shadow-[0_8px_60px_-12px_rgb(91_140_255/0.35)] backdrop-blur-2xl">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-14 w-full cursor-pointer touch-manipulation items-center justify-between gap-4 rounded-3xl px-5 py-3 text-left select-none focus-visible:ring-2 focus-visible:ring-ice focus-visible:outline-none"
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
        {/* `invisible` (not `inert`) takes the collapsed contents out of the tab order and the accessibility tree
            in every engine; the visibility transition keeps it shown while the panel animates closed. */}
        <div className={`overflow-hidden transition-[visibility] duration-300 motion-reduce:transition-none ${open ? "visible" : "invisible"}`}>
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
                        data-state={copied === key ? "copied" : failed === key ? "failed" : "idle"}
                        aria-label={`Copy ${a.label.toLowerCase()} ${label.toLowerCase()}`}
                        className="flex min-h-11 cursor-pointer touch-manipulation items-center justify-between gap-3 rounded-xl border border-ice/15 bg-white/[0.03] px-3 py-2 text-left text-sm text-ice transition-[border-color,background-color,box-shadow] hover:border-ice/40 hover:bg-white/5 data-[state=copied]:border-emerald-400/50 data-[state=copied]:bg-emerald-400/10 data-[state=copied]:shadow-[0_0_24px_rgb(52_211_153/0.25)] focus-visible:ring-2 focus-visible:ring-ice focus-visible:outline-none"
                      >
                        <span className="min-w-0">
                          <span className="block text-[11px] text-ice/50">{label}</span>
                          <span className={`block truncate font-mono text-[13px] ${failed === key ? "select-all" : ""}`}>{value}</span>
                        </span>
                        <span className="relative flex h-6 min-w-[5.5rem] shrink-0 items-center justify-end overflow-hidden text-xs">
                          <AnimatePresence mode="popLayout" initial={false}>
                            {copied === key ? (
                              <motion.span key="copied" initial={{ opacity: 0, scale: 0.5, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ type: "spring", stiffness: 500, damping: 22 }} className="inline-flex items-center gap-1 text-emerald-300">
                                <Check className="h-3.5 w-3.5" strokeWidth={2.4} /> Copied
                              </motion.span>
                            ) : failed === key ? (
                              <motion.span key="failed" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-amber-300">
                                Select &amp; copy
                              </motion.span>
                            ) : (
                              <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="inline-flex items-center gap-1 text-ice/55">
                                <Copy className="h-3.5 w-3.5" /> Copy
                              </motion.span>
                            )}
                          </AnimatePresence>
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
            {copied ? "Copied to clipboard" : failed ? "Couldn't copy automatically — press and hold the text to copy it" : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
