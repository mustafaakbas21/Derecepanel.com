"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const HR_PAGE_CLASS = "hr-page space-y-6";
export const HR_PANEL_CLASS =
  "overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm";
export const HR_PANEL_INNER = "p-4 sm:p-5";

export function HrPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-1 max-w-2xl text-[15px] leading-relaxed text-slate-500">{description}</p>
      </div>
      {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
    </header>
  );
}

export type HrMetric = {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
};

export function HrMetrics({ metrics }: { metrics: HrMetric[] }) {
  return (
    <div className={cn(HR_PANEL_CLASS, "grid sm:grid-cols-2 lg:grid-cols-4")}>
      {metrics.map((m, i) => (
        <div
          key={m.label}
          className={cn(
            "flex items-center gap-3 px-4 py-4 sm:px-5 sm:py-5",
            i > 0 && "border-t border-slate-100 sm:border-t-0 sm:border-l"
          )}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <m.icon className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-slate-500">{m.label}</p>
            <p className="text-xl font-bold tabular-nums tracking-tight text-slate-900 sm:text-2xl">
              {m.value}
            </p>
            {m.sub ? <p className="text-[11px] text-slate-400">{m.sub}</p> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export function HrPanel({
  children,
  className,
  noPadding,
}: {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}) {
  return (
    <div className={cn(HR_PANEL_CLASS, !noPadding && HR_PANEL_INNER, className)}>{children}</div>
  );
}

export function HrSectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
      <div>
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function HrField({
  label,
  htmlFor,
  children,
  className,
  hint,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
  hint?: string;
}) {
  return (
    <div className={cn("hr-field", className)}>
      <label className="hr-field__label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint ? <p className="hr-field__hint">{hint}</p> : null}
    </div>
  );
}

export const hrInputClass =
  "hr-input w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-900 transition focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:opacity-50";

export function HrFilterGrid({ children }: { children: ReactNode }) {
  return <div className="hr-filter-grid">{children}</div>;
}

export function HrFilterActions({ children }: { children: ReactNode }) {
  return <div className="hr-filter-actions">{children}</div>;
}

export function HrEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="hr-empty">
      {Icon ? (
        <span className="hr-empty__icon-wrap">
          <Icon className="h-7 w-7 text-slate-500" strokeWidth={1.75} />
        </span>
      ) : null}
      <p className="hr-empty__title">{title}</p>
      <p className="hr-empty__desc">{description}</p>
      {action ? <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}

export function HrResultBar({
  children,
  trailing,
}: {
  children: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div className="hr-result-bar">
      <div className="text-sm text-slate-600">{children}</div>
      {trailing ? <div className="flex shrink-0 flex-wrap gap-2">{trailing}</div> : null}
    </div>
  );
}

export function HrCockpit({ children }: { children: ReactNode }) {
  return <aside className="hr-cockpit">{children}</aside>;
}

export function HrCockpitSection({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="hr-cockpit__section">
      {title ? <p className="hr-cockpit__section-title">{title}</p> : null}
      {children}
    </div>
  );
}

export function HrWorkspace({ children }: { children: ReactNode }) {
  return <section className="hr-workspace">{children}</section>;
}

export function HrStickyBar({ children }: { children: ReactNode }) {
  return <div className="hr-sticky-bar">{children}</div>;
}

export function HrSplitLayout({ children }: { children: ReactNode }) {
  return <div className="hr-split">{children}</div>;
}
