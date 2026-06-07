"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const ADMIN_PAGE_CLASS = "space-y-6";
export const ADMIN_PANEL_CLASS =
  "rounded-2xl border border-slate-200/80 bg-white shadow-sm";

type AdminPageHeaderProps = {
  title: string;
  description?: string;
  tabs?: { label: string; href?: string; active?: boolean }[];
  action?: React.ReactNode;
  showExport?: boolean;
  onExport?: () => void;
};

export function AdminPageHeader({
  title,
  description,
  tabs,
  action,
  showExport,
  onExport,
}: AdminPageHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          {description ? (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {showExport ? (
            <Button variant="outline" size="sm" type="button" onClick={onExport}>
              <Download className="mr-2 h-4 w-4" />
              Dışa aktar
            </Button>
          ) : null}
          {action}
        </div>
      </div>
      {tabs?.length ? (
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) =>
            tab.href ? (
              <Link
                key={tab.label}
                href={tab.href}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition",
                  tab.active
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 hover:text-slate-900"
                )}
              >
                {tab.label}
              </Link>
            ) : (
              <span
                key={tab.label}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium",
                  tab.active
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 shadow-sm ring-1 ring-slate-200"
                )}
              >
                {tab.label}
              </span>
            )
          )}
        </div>
      ) : null}
    </div>
  );
}

type AdminHeroMetricProps = {
  label: string;
  value: string | number;
  trend?: string;
  trendPositive?: boolean;
};

export function AdminHeroMetric({ label, value, trend, trendPositive }: AdminHeroMetricProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 p-6 text-white shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-300">{label}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums">{value}</p>
          {trend ? (
            <span
              className={cn(
                "mt-3 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                trendPositive === false
                  ? "bg-white/10 text-slate-200"
                  : "bg-emerald-500/20 text-emerald-100"
              )}
            >
              {trend}
            </span>
          ) : null}
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
          <ArrowUpRight className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

type AdminWaveMetricProps = {
  label: string;
  value: string | number;
  sub?: string;
};

export function AdminWaveMetric({ label, value, sub }: AdminWaveMetricProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">{value}</p>
      {sub ? <p className="mt-2 text-sm text-slate-500">{sub}</p> : null}
      <svg
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 w-full opacity-60"
        viewBox="0 0 400 60"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M0,40 C80,10 120,50 200,30 C280,10 320,45 400,25 L400,60 L0,60 Z"
          fill="url(#adminWave)"
        />
        <defs>
          <linearGradient id="adminWave" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#f1f5f9" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

type AdminSegmentedProgressProps = {
  title: string;
  value: string | number;
  segments: { label: string; percent: number; color: string }[];
};

export function AdminSegmentedProgress({ title, value, segments }: AdminSegmentedProgressProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">{value}</p>
      <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-slate-100">
        {segments.map((seg) => (
          <div
            key={seg.label}
            className="h-full transition-all"
            style={{ width: `${Math.max(seg.percent, 0)}%`, backgroundColor: seg.color }}
            title={`${seg.label}: %${seg.percent}`}
          />
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2 text-xs text-slate-600">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: seg.color }} />
            {seg.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminMetricGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 lg:grid-cols-3">{children}</div>;
}

export function AdminChartGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 lg:grid-cols-3">{children}</div>;
}

export function AdminChartCard({
  title,
  children,
  action,
  className,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(ADMIN_PANEL_CLASS, "p-6", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

type AdminPillTabsProps = {
  items: { label: string; href: string }[];
  activeHref: string;
};

export function AdminPillTabs({ items, activeHref }: AdminPillTabsProps) {
  return (
    <nav className="flex flex-wrap items-center gap-1 rounded-full bg-slate-100/80 p-1">
      {items.map((item) => {
        const active =
          item.href === activeHref ||
          (item.href !== "/admin" && activeHref.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              active ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminStatusBadge({
  status,
  children,
}: {
  status: "active" | "inactive" | "new" | "read";
  children: React.ReactNode;
}) {
  const styles = {
    active: "border-emerald-200 bg-emerald-50 text-emerald-700",
    inactive: "border-slate-200 bg-slate-50 text-slate-600",
    new: "border-sky-200 bg-sky-50 text-sky-700",
    read: "border-slate-200 bg-slate-50 text-slate-500",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styles[status]
      )}
    >
      {children}
    </span>
  );
}

export function AdminProgressBar({ value, className }: { value: number; className?: string }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-100", className)}>
      <div
        className="h-full rounded-full bg-slate-900 transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function AdminFilterBar({
  search,
  onSearchChange,
  placeholder = "Ara…",
  children,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  placeholder?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <input
        type="search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 min-w-[200px] flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-200"
      />
      {children}
    </div>
  );
}

export function AdminDataTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">{children}</table>
    </div>
  );
}

export function AdminEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon ? (
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <Icon className="h-7 w-7" />
        </span>
      ) : null}
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      {description ? <p className="mt-2 max-w-sm text-sm text-slate-500">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function AdminLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-36 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-36 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-36 animate-pulse rounded-2xl bg-slate-100" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-72 animate-pulse rounded-2xl bg-slate-100 lg:col-span-2" />
        <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    </div>
  );
}

export function AdminInfoBanner({
  variant = "info",
  children,
}: {
  variant?: "info" | "warning";
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 text-sm font-medium",
        variant === "warning"
          ? "border-amber-200 bg-amber-50 text-amber-900"
          : "border-slate-200 bg-slate-50 text-slate-700"
      )}
    >
      {children}
    </div>
  );
}
