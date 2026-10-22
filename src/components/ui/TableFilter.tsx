"use client";

import { Search } from "lucide-react";
import { useId, useState } from "react";

/**
 * Instant search box for a server-rendered table: hides non-matching body rows of `#tableId` by toggling
 * the `hidden` attribute (no restructuring of the table, so server rendering and any row forms are untouched).
 */
export function TableFilter({ tableId, label = "Filter rows", placeholder = "Search…" }: { tableId: string; label?: string; placeholder?: string }) {
  const inputId = useId();
  const [shown, setShown] = useState<number | null>(null);

  const apply = (q: string) => {
    const table = document.getElementById(tableId);
    if (!table) return;
    const needle = q.trim().toLowerCase();
    let visible = 0;
    table.querySelectorAll<HTMLTableRowElement>("tbody tr").forEach((tr) => {
      const match = needle === "" || (tr.textContent ?? "").toLowerCase().includes(needle);
      tr.hidden = !match;
      if (match) visible++;
    });
    setShown(needle === "" ? null : visible);
  };

  return (
    <div className="relative w-full sm:max-w-xs">
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        id={inputId}
        type="search"
        inputMode="search"
        autoComplete="off"
        placeholder={placeholder}
        onChange={(e) => apply(e.target.value)}
        aria-controls={tableId}
        className="min-h-11 w-full rounded-full border border-slate-300 bg-white pr-4 pl-10 text-sm text-slate-900 outline-none transition-[border-color,box-shadow] placeholder:text-slate-500 focus-visible:border-indigo-600 focus-visible:ring-4 focus-visible:ring-indigo-600/15"
      />
      <p role="status" aria-live="polite" className="sr-only">
        {shown === null ? "" : `${shown} matching row${shown === 1 ? "" : "s"}`}
      </p>
    </div>
  );
}
