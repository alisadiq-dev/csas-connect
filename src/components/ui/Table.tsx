import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from "react";

export function Table({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <div className="overflow-x-auto">
      <table id={id} className="w-full min-w-[36rem] text-left text-sm">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-slate-200 text-xs font-medium tracking-wide text-slate-500 uppercase">
        {children}
      </tr>
    </thead>
  );
}

export function Th({ children, className = "", ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th scope="col" className={`py-2.5 pr-4 font-medium ${className}`} {...rest}>
      {children}
    </th>
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-slate-100">{children}</tbody>;
}

export function Tr({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <tr className={`hover:bg-slate-50 ${className}`}>{children}</tr>;
}

export function Td({ children, className = "", ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`py-3 pr-4 text-slate-700 ${className}`} {...rest}>
      {children}
    </td>
  );
}
