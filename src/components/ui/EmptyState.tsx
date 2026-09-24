import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div role="status" className="flex flex-col items-center gap-2 py-12 text-center">
      {icon && <span className="h-9 w-9 text-slate-300">{icon}</span>}
      <h3 className="text-sm font-medium text-slate-700">{title}</h3>
      {description && <p className="max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
