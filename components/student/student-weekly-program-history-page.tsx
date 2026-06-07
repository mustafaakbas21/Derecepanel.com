"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarRange,
  CheckCircle2,
  Search,
  Target,
  TrendingUp,
} from "lucide-react";

import {
  LIBRARY_PAGE_CLASS,
  LIBRARY_PANEL_CLASS,
  LibraryPageHeader,
} from "@/components/library/library-shell";
import { Button } from "@/components/ui/button";
import { WeeklyProgramHistoryFilters } from "@/components/student/weekly-program-history-filters";
import { WeeklyProgramHistoryResults } from "@/components/student/weekly-program-history-results";
import {
  buildHistoryRow,
  countByCompletion,
  DEFAULT_HISTORY_FILTERS,
  filterHistoryRows,
  filtersFromSearchParams,
  filtersToSearchParams,
  loadHistoryFilterPrefs,
  saveHistoryFilterPrefs,
  summarizeFilteredRows,
  summarizeHistoryRows,
  type HistoryFilterState,
} from "@/lib/weekly-planner/history-filters";
import { getProgramProgress } from "@/lib/weekly-planner/student-progress";
import { useStudentWeeklyProgramHistory } from "@/lib/weekly-planner/use-student-weekly-program";
import { cn } from "@/lib/utils";

function HistoryInsights({
  summary,
  filteredCount,
}: {
  summary: ReturnType<typeof summarizeHistoryRows>;
  filteredCount: number;
}) {
  const tiles = [
    {
      label: "Geçmiş hafta",
      value: String(summary.totalWeeks),
      sub: "Toplam kayıt",
      icon: CalendarRange,
    },
    {
      label: "Filtre sonucu",
      value: String(filteredCount),
      sub: "Gösterilen hafta",
      icon: Target,
    },
    {
      label: "Tamamlanan",
      value: String(summary.completedWeeks),
      sub: "Hafta %100",
      icon: CheckCircle2,
    },
    {
      label: "Ortalama ilerleme",
      value: `%${summary.avgPct}`,
      sub: `${summary.doneTasks}/${summary.totalTasks} görev`,
      icon: TrendingUp,
    },
  ];

  return (
    <section
      className="overflow-hidden rounded-[1.35rem] border border-slate-200/70 bg-white"
      style={{ boxShadow: "var(--card-shadow)" }}
      aria-label="Geçmiş program özeti"
    >
      <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-y-0">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <div key={t.label} className="flex items-center gap-4 px-5 py-5">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: "#fff7ed" }}
              >
                <Icon className="h-5 w-5 text-orange-500" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-slate-500">{t.label}</p>
                <p className="mt-0.5 truncate text-2xl font-bold tabular-nums text-slate-900">
                  {t.value}
                </p>
                <p className="mt-0.5 text-[12px] text-slate-400">{t.sub}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function mergeInitialFilters(searchParams: URLSearchParams): HistoryFilterState {
  const fromUrl = filtersFromSearchParams(searchParams);
  const prefs = loadHistoryFilterPrefs();
  const hasUrl =
    searchParams.has("q") ||
    searchParams.has("status") ||
    searchParams.has("period") ||
    searchParams.has("from") ||
    searchParams.has("to") ||
    searchParams.has("sort") ||
    searchParams.has("min") ||
    searchParams.has("view");

  if (hasUrl) return fromUrl;

  return {
    ...DEFAULT_HISTORY_FILTERS,
    view: prefs.view ?? DEFAULT_HISTORY_FILTERS.view,
    sort: prefs.sort ?? DEFAULT_HISTORY_FILTERS.sort,
    period: prefs.period ?? DEFAULT_HISTORY_FILTERS.period,
    minProgress: prefs.minProgress ?? DEFAULT_HISTORY_FILTERS.minProgress,
  };
}

export function StudentWeeklyProgramHistoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, hydrated, coachName, programs, scopeKey, progressTick } =
    useStudentWeeklyProgramHistory();

  const [filters, setFilters] = useState<HistoryFilterState>(() =>
    mergeInitialFilters(searchParams)
  );

  useEffect(() => {
    if (hydrated && !user) router.replace("/");
  }, [hydrated, user, router]);

  const updateFilters = useCallback(
    (next: HistoryFilterState) => {
      setFilters(next);
      saveHistoryFilterPrefs(next);
      const qs = filtersToSearchParams(next).toString();
      const path = qs ? `/ogrenci/haftalik-program/gecmis?${qs}` : "/ogrenci/haftalik-program/gecmis";
      router.replace(path, { scroll: false });
    },
    [router]
  );

  const rows = useMemo(() => {
    void progressTick;
    return programs.map((p) => {
      const record = scopeKey ? getProgramProgress(scopeKey, p.id) : { completedTaskIds: [] };
      return buildHistoryRow(p, record);
    });
  }, [programs, scopeKey, progressTick]);

  const filtered = useMemo(() => filterHistoryRows(rows, filters), [rows, filters]);
  const completionCounts = useMemo(() => countByCompletion(rows), [rows]);
  const allSummary = useMemo(() => summarizeHistoryRows(rows), [rows]);
  const filteredSummary = useMemo(
    () => summarizeFilteredRows(filtered, rows),
    [filtered, rows]
  );

  if (!hydrated) {
    return <p className="text-sm text-slate-500">Yükleniyor…</p>;
  }

  if (!user) {
    return (
      <p className="text-sm text-slate-500">
        Oturum bulunamadı.{" "}
        <Link href="/" className="font-medium text-slate-900 underline">
          Giriş sayfasına dön
        </Link>
      </p>
    );
  }

  return (
    <div className={LIBRARY_PAGE_CLASS}>
      <LibraryPageHeader
        title="Geçmiş Programlar"
        description={`${coachName} tarafından atanan önceki haftalık çalışma planlarınız. Tarih aralığı, durum ve ilerlemeye göre filtreleyebilirsiniz.`}
        meta={
          rows.length
            ? `${filtered.length} / ${rows.length} hafta · ${filters.view === "grid" ? "Kart" : filters.view === "timeline" ? "Zaman çizelgesi" : "Liste"} görünümü`
            : "Geçmiş kayıt yok"
        }
        action={
          <Button variant="outline" size="sm" asChild>
            <Link href="/ogrenci/haftalik-program">Bu haftaki program</Link>
          </Button>
        }
      />

      {rows.length > 0 ? (
        <HistoryInsights summary={allSummary} filteredCount={filtered.length} />
      ) : null}

      {rows.length === 0 ? (
        <div
          className={cn(LIBRARY_PANEL_CLASS, "flex flex-col items-center px-6 py-16 text-center")}
        >
          <CalendarRange className="mb-4 h-12 w-12 text-slate-300" />
          <p className="text-xl font-bold text-slate-900">Geçmiş program yok</p>
          <p className="mt-2 max-w-md text-[15px] leading-relaxed text-slate-500">
            Koçunuz bir haftalık program kaydettiğinde ve o hafta geçtiğinde kayıtlar burada
            listelenir. Bu haftanın programını «Bu Haftaki Program» menüsünden görebilirsiniz.
          </p>
          <Button variant="primary" className="mt-6" asChild>
            <Link href="/ogrenci/haftalik-program">Bu haftaya git</Link>
          </Button>
        </div>
      ) : (
        <section
          className={cn(LIBRARY_PANEL_CLASS, "overflow-hidden")}
          style={{ boxShadow: "var(--card-shadow)" }}
        >
          <WeeklyProgramHistoryFilters
            filters={filters}
            onChange={updateFilters}
            resultCount={filtered.length}
            totalCount={rows.length}
            completionCounts={completionCounts}
          />

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-14 text-center">
              <Search className="mb-3 h-10 w-10 text-slate-300" />
              <p className="text-base font-semibold text-slate-900">Sonuç bulunamadı</p>
              <p className="mt-1 max-w-md text-sm text-slate-500">
                Seçili tarih aralığında veya filtrelerde eşleşen program yok. Tarihleri genişletmeyi
                veya filtreleri sıfırlamayı deneyin.
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={() => updateFilters({ ...DEFAULT_HISTORY_FILTERS })}
              >
                Filtreleri sıfırla
              </Button>
            </div>
          ) : (
            <>
              <div className="border-b border-slate-100 bg-white px-4 py-2.5 sm:px-5">
                <p className="text-xs text-slate-500">
                  Filtrelenmiş özet:{" "}
                  <span className="font-semibold text-slate-700">
                    %{filteredSummary.avgPct} ortalama ilerleme
                  </span>
                  {" · "}
                  {filteredSummary.doneTasks} görev tamamlandı
                </p>
              </div>
              <WeeklyProgramHistoryResults rows={filtered} view={filters.view} />
            </>
          )}
        </section>
      )}
    </div>
  );
}
