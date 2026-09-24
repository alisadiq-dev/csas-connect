"use client";

import { useState, type ReactNode } from "react";
import type { DayOfWeekEnum } from "@/db/schema/timetable";
import { formatTime } from "@/lib/format";

const DEFAULT_DAYS: { value: DayOfWeekEnum; label: string; short: string }[] = [
  { value: "mon", label: "Monday", short: "Mon" },
  { value: "tue", label: "Tuesday", short: "Tue" },
  { value: "wed", label: "Wednesday", short: "Wed" },
  { value: "thu", label: "Thursday", short: "Thu" },
  { value: "fri", label: "Friday", short: "Fri" },
  { value: "sat", label: "Saturday", short: "Sat" },
];

function todayDayOfWeek(): DayOfWeekEnum {
  const map: DayOfWeekEnum[] = ["sun" as DayOfWeekEnum, "mon", "tue", "wed", "thu", "fri", "sat"];
  const day = map[new Date().getDay()];
  return DEFAULT_DAYS.some((d) => d.value === day) ? day : "mon";
}

type Period = { periodNumber: number; startTime: string; endTime: string };
type BaseSlot = { dayOfWeek: DayOfWeekEnum; periodNumber: number };

/**
 * A full weekly timetable grid: a table on desktop, a day-by-day list on
 * mobile (viewports too narrow for a 7-column grid to stay readable).
 * `renderCell` renders one slot's content — the caller decides what fields
 * to show (course only, course+teacher, course+delete action, etc.).
 */
export function WeeklyGrid<T extends BaseSlot>({
  periods,
  slots,
  renderCell,
  emptyCell = <span className="text-xs text-slate-300">—</span>,
}: {
  periods: Period[];
  slots: T[];
  renderCell: (slot: T) => ReactNode;
  emptyCell?: ReactNode;
}) {
  const [mobileDay, setMobileDay] = useState<DayOfWeekEnum>(todayDayOfWeek());
  const byDayPeriod = new Map(slots.map((s) => [`${s.dayOfWeek}-${s.periodNumber}`, s]));

  return (
    <div>
      {/* Desktop grid */}
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white md:block">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium text-slate-500">
              <th className="w-28 p-3">Period</th>
              {DEFAULT_DAYS.map((d) => (
                <th key={d.value} className="p-3">
                  {d.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {periods.map((p) => (
              <tr key={p.periodNumber}>
                <td className="p-3 align-top text-xs text-slate-500">
                  <span className="font-medium text-slate-700">Period {p.periodNumber}</span>
                  <br />
                  {formatTime(p.startTime)}–{formatTime(p.endTime)}
                </td>
                {DEFAULT_DAYS.map((d) => {
                  const slot = byDayPeriod.get(`${d.value}-${p.periodNumber}`);
                  return (
                    <td key={d.value} className="p-3 align-top">
                      {slot ? renderCell(slot) : emptyCell}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: day tabs + that day's periods as a list */}
      <div className="md:hidden">
        <div className="flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1">
          {DEFAULT_DAYS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setMobileDay(d.value)}
              aria-current={mobileDay === d.value ? "true" : undefined}
              className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                mobileDay === d.value ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600"
              }`}
            >
              {d.short}
            </button>
          ))}
        </div>

        <ul className="mt-3 flex flex-col gap-2">
          {periods.map((p) => {
            const slot = byDayPeriod.get(`${mobileDay}-${p.periodNumber}`);
            return (
              <li key={p.periodNumber} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm">
                <span className="w-20 shrink-0 text-xs font-medium text-slate-500">{formatTime(p.startTime)}</span>
                <div className="min-w-0 flex-1">{slot ? renderCell(slot) : <span className="text-xs text-slate-400">Free period</span>}</div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
