import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ClockIcon } from "@/components/icons";
import { formatTime } from "@/lib/format";
import type { ScheduleStatus } from "@/lib/timetable/today";

export type ScheduleItem = {
  id: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  status: ScheduleStatus;
  courseCode: string;
  courseTitle: string;
  teacherName?: string | null;
  room?: string | null;
};

const BORDER_BY_STATUS: Record<ScheduleStatus, string> = {
  completed: "border-l-emerald-400",
  ongoing: "border-l-indigo-500",
  upcoming: "border-l-slate-200",
};

function StatusBadge({ status }: { status: ScheduleStatus }) {
  if (status === "ongoing") return <Badge tone="brand">Now</Badge>;
  if (status === "completed") return <Badge tone="success">Done</Badge>;
  return <Badge tone="neutral">Upcoming</Badge>;
}

export function ScheduleList({ items }: { items: ScheduleItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ClockIcon className="h-9 w-9" />}
        title="No classes today"
        description="Nothing scheduled for today in your timetable."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li
          key={item.id}
          className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 border-l-4 bg-white px-3.5 py-2.5 text-sm ${BORDER_BY_STATUS[item.status]}`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="w-20 shrink-0 text-xs font-medium text-slate-500">{formatTime(item.startTime)}</span>
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-900">
                {item.courseCode} — {item.courseTitle}
              </p>
              <p className="truncate text-xs text-slate-500">
                {[item.teacherName, item.room ? `Room ${item.room}` : null].filter(Boolean).join(" · ") || "—"}
              </p>
            </div>
          </div>
          <StatusBadge status={item.status} />
        </li>
      ))}
    </ul>
  );
}
