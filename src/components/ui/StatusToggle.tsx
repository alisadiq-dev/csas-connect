"use client";

import { motion } from "motion/react";
import { useId, useState } from "react";

const OPTIONS = [
  { value: "present", label: "Present", on: "bg-emerald-500 text-white" },
  { value: "absent", label: "Absent", on: "bg-rose-500 text-white" },
  { value: "leave", label: "Leave", on: "bg-amber-400 text-amber-950" },
] as const;

/**
 * Attendance status control: three radio inputs (so the surrounding <form> posts `name=value` exactly like
 * the <select> it replaces) styled as a segmented pill whose highlight springs between options.
 * Fully keyboard accessible (arrow keys move the selection) and 44px tall on touch.
 */
export function StatusToggle({
  name,
  defaultValue = "present",
  label,
}: {
  name: string;
  defaultValue?: "present" | "absent" | "leave" | string;
  /** Accessible group label, e.g. the student's name. */
  label: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const scope = useId();

  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full bg-slate-100 p-1">
      {OPTIONS.map((o) => {
        const selected = value === o.value;
        return (
          <label
            key={o.value}
            className={`relative inline-flex min-h-9 min-w-[4.5rem] cursor-pointer touch-manipulation items-center justify-center rounded-full px-3 text-xs font-medium select-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-indigo-500 ${
              selected ? "" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <input type="radio" name={name} value={o.value} checked={selected} onChange={() => setValue(o.value)} className="sr-only" />
            {selected && (
              <motion.span
                layoutId={`${scope}-pill`}
                aria-hidden
                className={`absolute inset-0 rounded-full shadow-sm ${o.on.split(" ")[0]}`}
                transition={{ type: "spring", stiffness: 520, damping: 30 }}
              />
            )}
            <motion.span className={`relative ${selected ? o.on.split(" ").slice(1).join(" ") : ""}`} whileTap={{ scale: 0.9 }}>
              {o.label}
            </motion.span>
          </label>
        );
      })}
    </div>
  );
}
