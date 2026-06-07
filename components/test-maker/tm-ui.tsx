"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Öğrenciler / Kitap Kütüphanesi ile aynı sayfa ritmi */
export const TM_PAGE_CLASS = "space-y-6";

export const TM_STUDIO_CARD =
  "overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm";

export const TM_STUDIO_CARD_INNER = "p-4 sm:p-5";

export function TestMakerPageHeader({
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
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
          Test Maker
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.65rem]">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-500">{description}</p>
      </div>
      {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
    </header>
  );
}

export function TestMakerMetrics({
  items,
}: {
  items: { label: string; value: string | number; sub?: string; icon: LucideIcon }[];
}) {
  return (
    <div className={cn(TM_STUDIO_CARD, "grid sm:grid-cols-2 xl:grid-cols-4")}>
      {items.map((m, i) => (
        <div
          key={m.label}
          className={cn(
            "flex items-center gap-3 px-4 py-4 sm:px-5 sm:py-5",
            i > 0 && "border-t border-slate-100 sm:border-t-0 sm:border-l sm:border-slate-100"
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
            {m.sub ? (
              <p className="truncate text-[11px] text-slate-400" title={m.sub}>
                {m.sub}
              </p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export function TestMakerSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(className)}>
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-[13px] leading-relaxed text-slate-500">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function TestMakerField({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("tm-v2-field", className)}>
      <label className="tm-v2-field__label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}

export const tmFieldInputClass =
  "tm-v2-input w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[15px] text-slate-900 shadow-sm transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10";

/** @deprecated tek kart kullanın */
export const TestMakerPanel = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
  noPad?: boolean;
}) => (
  <div className={cn(TM_STUDIO_CARD, TM_STUDIO_CARD_INNER, className)}>{children}</div>
);

/** @deprecated TestMakerSection + Button kullanın */
export function TestMakerToolbarSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="tm-v2-toolbar-section">
      <p className="tm-v2-toolbar-section__label">{label}</p>
      <div className="tm-v2-toolbar-section__actions">{children}</div>
    </div>
  );
}
