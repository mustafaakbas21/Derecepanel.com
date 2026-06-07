"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const TR_PAGE_CLASS = "tr-page space-y-6";

type HeaderProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function TrPageHeader({ title, description, action }: HeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function TrShell({
  title,
  description,
  action,
  children,
}: HeaderProps & { children: ReactNode }) {
  return (
    <div className={TR_PAGE_CLASS}>
      <TrPageHeader title={title} description={description} action={action} />
      {children}
    </div>
  );
}

export function TrPanel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm",
        className
      )}
    >
      {children}
    </section>
  );
}

export function TrKpiGrid({ children }: { children: ReactNode }) {
  return <div className="tr-kpi-grid">{children}</div>;
}

export function TrKpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="tr-kpi-card">
      <p className="tr-kpi-card__label">{label}</p>
      <p className="tr-kpi-card__value">{value}</p>
      {hint ? <p className="tr-kpi-card__hint">{hint}</p> : null}
    </div>
  );
}

export const trInputClass =
  "flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200";

export function TrField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5" htmlFor={htmlFor}>
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  );
}

export function TrEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="tr-empty">
      <p className="text-base font-semibold text-slate-900">{title}</p>
      <div className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">{description}</div>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
