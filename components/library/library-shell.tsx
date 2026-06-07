"use client";

import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/** DialogContent: varsayılan sm:max-w-[560px] üzerine yaz */
export const LIBRARY_DIALOG_XL =
  "flex h-[min(92vh,940px)] w-[calc(100vw-1.25rem)] max-w-[min(1280px,calc(100vw-1.25rem))] flex-col gap-0 overflow-hidden border-slate-200 p-0 shadow-2xl sm:max-w-[1280px]";

export const LIBRARY_DIALOG_LG =
  "flex max-h-[min(92vh,900px)] w-[calc(100vw-1.25rem)] max-w-[min(960px,calc(100vw-1.25rem))] flex-col gap-0 overflow-hidden border-slate-200 p-0 shadow-2xl sm:max-w-[960px]";

/** Koç paneli sayfa kabuğu — Öğrenciler / Denemeler ile aynı ritim */
export const LIBRARY_PAGE_CLASS = "space-y-6";

export const LIBRARY_PANEL_CLASS =
  "overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm";

export const LIBRARY_PANEL_INNER = "space-y-4 p-4 sm:p-5";

type PageHeaderProps = {
  title: string;
  description: string;
  meta?: string;
  action?: React.ReactNode;
};

export function LibraryPageHeader({ title, description, meta, action }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-1 max-w-2xl text-[15px] leading-relaxed text-slate-500">{description}</p>
        {meta ? <p className="mt-1 text-sm font-medium text-slate-700">{meta}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
    </header>
  );
}

export type LibraryMetric = {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
};

export function LibraryInsights({ metrics }: { metrics: LibraryMetric[] }) {
  return (
    <div
      className={cn(LIBRARY_PANEL_CLASS, "grid sm:grid-cols-2 lg:grid-cols-4")}
      style={{ boxShadow: "var(--card-shadow-sm, 0 1px 3px rgb(15 23 42 / 0.06))" }}
    >
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

export function LibraryFilterBar({
  children,
  trailing,
}: {
  children: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 lg:flex-row lg:flex-wrap lg:items-center">
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {children}
      </div>
      {trailing ? (
        <div className="shrink-0 text-sm text-slate-500 lg:ml-auto">{trailing}</div>
      ) : null}
    </div>
  );
}

export function LibrarySectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <h2 className="text-sm font-bold text-slate-900">{title}</h2>
      {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
    </div>
  );
}

export function LibraryProgressBar({ value, className }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
        <span>İlerleme</span>
        <span className="tabular-nums text-slate-700">%{pct}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-slate-900 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function LibraryEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-14 text-center">
      <p className="font-medium text-slate-800">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">{description}</p>
      {action ? <div className="mt-6 flex justify-center gap-2">{action}</div> : null}
    </div>
  );
}

/** @deprecated — LibraryPageHeader kullanın */
export function LibraryPageHero(props: PageHeaderProps & { eyebrow?: string }) {
  return <LibraryPageHeader title={props.title} description={props.description} action={props.action} />;
}
