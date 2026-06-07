"use client";

import { useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  ListFilter,
  Search,
  SlidersHorizontal,
  Timeline,
  X,
} from "lucide-react";

import { FilterSegments } from "@/components/appointments/filter-segments";
import { Button } from "@/components/ui/button";
import {
  activeFilterChips,
  clearFilterChip,
  countByCompletion,
  DEFAULT_HISTORY_FILTERS,
  defaultCustomRange,
  isHistoryFiltersActive,
  type CompletionFilter,
  type HistoryFilterState,
  type MinProgressFilter,
  type PeriodPreset,
  type SortKey,
  type ViewMode,
} from "@/lib/weekly-planner/history-filters";
import { cn } from "@/lib/utils";

const PERIOD_OPTIONS: { value: PeriodPreset; label: string }[] = [
  { value: "all", label: "Tüm zamanlar" },
  { value: "4w", label: "Son 4 hafta" },
  { value: "3m", label: "Son 3 ay" },
  { value: "6m", label: "Son 6 ay" },
  { value: "year", label: "Bu yıl" },
  { value: "custom", label: "Tarih aralığı" },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "En yeni" },
  { value: "oldest", label: "En eski" },
  { value: "most_done", label: "En yüksek ilerleme" },
  { value: "least_done", label: "En düşük ilerleme" },
  { value: "most_tasks", label: "En çok görev" },
];

const MIN_PROGRESS_OPTIONS: { value: MinProgressFilter; label: string }[] = [
  { value: "all", label: "Tümü" },
  { value: "25", label: "%25+" },
  { value: "50", label: "%50+" },
  { value: "75", label: "%75+" },
  { value: "100", label: "%100" },
];

const VIEW_OPTIONS: { value: ViewMode; label: string; icon: typeof List }[] = [
  { value: "list", label: "Liste", icon: List },
  { value: "grid", label: "Kart", icon: LayoutGrid },
  { value: "timeline", label: "Zaman", icon: Timeline },
];

type Props = {
  filters: HistoryFilterState;
  onChange: (next: HistoryFilterState) => void;
  resultCount: number;
  totalCount: number;
  completionCounts: ReturnType<typeof countByCompletion>;
};

export function WeeklyProgramHistoryFilters({
  filters,
  onChange,
  resultCount,
  totalCount,
  completionCounts,
}: Props) {
  const [advancedOpen, setAdvancedOpen] = useState(
    filters.period === "custom" || Boolean(filters.dateFrom || filters.dateTo)
  );

  const completionOptions = [
    { value: "all" as const, label: `Tümü (${completionCounts.all})` },
    { value: "completed" as const, label: `Tamamlanan (${completionCounts.completed})` },
    { value: "in_progress" as const, label: `Devam eden (${completionCounts.in_progress})` },
    { value: "not_started" as const, label: `Başlanmamış (${completionCounts.not_started})` },
  ];

  const chips = activeFilterChips(filters);
  const hasActive = isHistoryFiltersActive(filters);

  const patch = (partial: Partial<HistoryFilterState>) => onChange({ ...filters, ...partial });

  const handlePeriodChange = (period: PeriodPreset) => {
    if (period === "custom") {
      const range = filters.dateFrom && filters.dateTo ? {} : defaultCustomRange();
      onChange({ ...filters, period: "custom", ...range });
      setAdvancedOpen(true);
      return;
    }
    onChange({
      ...filters,
      period,
      dateFrom: "",
      dateTo: "",
    });
  };

  const clearAll = () => onChange({ ...DEFAULT_HISTORY_FILTERS });

  return (
    <section className="overflow-hidden" aria-label="Arama ve filtreler">
      {/* Arama + görünüm */}
      <div className="border-b border-slate-100 bg-slate-50/40 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={filters.query}
              onChange={(e) => patch({ query: e.target.value })}
              placeholder="Hafta, görev, konu veya ders ara…"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-10 text-sm text-slate-900 shadow-sm outline-none ring-slate-300 placeholder:text-slate-400 focus:border-slate-300 focus:ring-2"
              aria-label="Geçmiş programlarda ara"
            />
            {filters.query ? (
              <button
                type="button"
                onClick={() => patch({ query: "" })}
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Aramayı temizle"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
              role="group"
              aria-label="Görünüm modu"
            >
              {VIEW_OPTIONS.map(({ value, label, icon: Icon }) => {
                const active = filters.view === value;
                return (
                  <button
                    key={value}
                    type="button"
                    title={label}
                    aria-pressed={active}
                    onClick={() => patch({ view: value })}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold transition",
                      active
                        ? "bg-slate-900 text-white"
                        : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-sm font-medium tabular-nums text-slate-600">
              <ListFilter className="mr-1 inline h-4 w-4 text-slate-400" />
              {resultCount}/{totalCount}
            </p>
          </div>
        </div>

        {chips.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {chips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => onChange(clearFilterChip(filters, chip.id))}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm transition hover:border-slate-300"
              >
                {chip.label}
                <X className="h-3 w-3 text-slate-400" />
              </button>
            ))}
            {hasActive ? (
              <button
                type="button"
                onClick={clearAll}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Tümünü temizle
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Hızlı filtreler */}
      <div className="space-y-4 border-b border-slate-100 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-3">
          <span className="flex shrink-0 items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-slate-400">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Durum
          </span>
          <FilterSegments
            ariaLabel="Tamamlanma durumu"
            options={completionOptions}
            value={filters.completion}
            onChange={(v: CompletionFilter) => patch({ completion: v })}
          />
        </div>
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-3">
          <span className="shrink-0 text-[12px] font-semibold uppercase tracking-wide text-slate-400">
            Dönem
          </span>
          <FilterSegments
            ariaLabel="Dönem filtresi"
            options={PERIOD_OPTIONS}
            value={filters.period}
            onChange={handlePeriodChange}
          />
        </div>
      </div>

      {/* Gelişmiş filtreler */}
      <div className="border-b border-slate-100">
        <button
          type="button"
          onClick={() => setAdvancedOpen((o) => !o)}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50/80 sm:px-5"
        >
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            Gelişmiş filtreler
            {(filters.dateFrom || filters.dateTo || filters.minProgress !== "all") && (
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-800">
                Aktif
              </span>
            )}
          </span>
          {advancedOpen ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </button>

        {advancedOpen ? (
          <div className="space-y-4 border-t border-slate-100 bg-slate-50/30 px-4 py-4 sm:px-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="block space-y-1.5">
                <span className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                  Başlangıç tarihi
                </span>
                <input
                  type="date"
                  value={filters.dateFrom}
                  max={filters.dateTo || undefined}
                  onChange={(e) =>
                    patch({ dateFrom: e.target.value, period: "custom" })
                  }
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                  Bitiş tarihi
                </span>
                <input
                  type="date"
                  value={filters.dateTo}
                  min={filters.dateFrom || undefined}
                  onChange={(e) => patch({ dateTo: e.target.value, period: "custom" })}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                />
              </label>
              <div className="md:col-span-2 xl:col-span-2">
                <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                  Minimum ilerleme
                </p>
                <FilterSegments
                  ariaLabel="Minimum ilerleme filtresi"
                  options={MIN_PROGRESS_OPTIONS}
                  value={filters.minProgress}
                  onChange={(v: MinProgressFilter) => patch({ minProgress: v })}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-3">
              <span className="shrink-0 text-[12px] font-semibold uppercase tracking-wide text-slate-400">
                Sırala
              </span>
              <FilterSegments
                ariaLabel="Sıralama"
                options={SORT_OPTIONS}
                value={filters.sort}
                onChange={(v: SortKey) => patch({ sort: v })}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const range = defaultCustomRange();
                  patch({ ...range, period: "custom" });
                }}
              >
                Son 3 ay (özel)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => patch({ dateFrom: "", dateTo: "", period: "all" })}
              >
                Tarih aralığını temizle
              </Button>
              {hasActive ? (
                <Button type="button" variant="ghost" size="sm" onClick={clearAll}>
                  Tüm filtreleri sıfırla
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
