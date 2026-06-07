"use client";

import { useMemo, useState } from "react";
import { ListFilter, Printer, Sparkles, Zap } from "lucide-react";

import {
  AmDersFilterBar,
  buildDersFilterOptions,
} from "@/components/analiz-merkezi/v3/am-ders-filter-bar";
import { AmPriorityTopicCard } from "@/components/analiz-merkezi/v3/am-priority-topic-card";
import { AmPriorityTierDetailModal } from "@/components/analiz-merkezi/v3/am-tier-detail-modal";
import { AmTierStrip } from "@/components/analiz-merkezi/v3/am-tier-strip";
import { buildPriorityTierDetail } from "@/lib/analiz/tier-detail";
import { Button } from "@/components/ui/button";
import {
  buildOtonomV3Summary,
  filterPriorityByTier,
  type OtonomTierId,
} from "@/lib/analiz/otonom-v3";
import type { AnalizExamShell, AnalizStudent, PriorityRow } from "@/lib/analiz/types";
import type { AnalizDataQuality } from "@/lib/analiz/matrix-quality";
import { toast } from "@/lib/notify";

function groupBySubject(rows: PriorityRow[]) {
  const map = new Map<string, PriorityRow[]>();
  rows.forEach((r) => {
    const list = map.get(r.subjectName) || [];
    list.push(r);
    map.set(r.subjectName, list);
  });
  return Array.from(map.entries())
    .map(([subjectName, subjectRows]) => ({
      subjectName,
      rows: subjectRows.sort((a, b) => a.classCorrectRate - b.classCorrectRate),
    }))
    .sort((a, b) => {
      const minA = Math.min(...a.rows.map((r) => r.classCorrectRate));
      const minB = Math.min(...b.rows.map((r) => r.classCorrectRate));
      return minA - minB;
    });
}

export function AmOtonomPanel({
  priorityRows,
  filteredRows: dersFilteredRows,
  exam,
  students,
  dataQuality,
  dersOptions,
  dersFilter,
  onDersFilterChange,
  onOpenPdf,
}: {
  priorityRows: PriorityRow[];
  filteredRows: PriorityRow[];
  exam: AnalizExamShell | null;
  students: AnalizStudent[];
  dataQuality: AnalizDataQuality;
  dersOptions: string[];
  dersFilter: string;
  onDersFilterChange: (v: string) => void;
  onOpenPdf: () => void;
}) {
  const [tierFilter, setTierFilter] = useState<OtonomTierId | "all">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTier, setModalTier] = useState<OtonomTierId | null>(null);

  const tierSummary = useMemo(
    () => buildOtonomV3Summary(priorityRows, exam, students),
    [priorityRows, exam, students]
  );

  const subjectFilters = useMemo(
    () => buildDersFilterOptions(dersOptions, priorityRows),
    [dersOptions, priorityRows]
  );

  const displayRows = useMemo(
    () => filterPriorityByTier(dersFilteredRows, tierFilter),
    [dersFilteredRows, tierFilter]
  );

  const groupedRows = useMemo(() => {
    if (dersFilter !== "all" || displayRows.length < 4) return null;
    return groupBySubject(displayRows);
  }, [displayRows, dersFilter]);

  const topActionSubject = priorityRows[0]?.subjectName;

  const priorityModalPayload = useMemo(() => {
    if (!modalTier) return null;
    return buildPriorityTierDetail(
      modalTier,
      priorityRows,
      exam?.name,
      exam?.subjectGauges
    );
  }, [modalTier, priorityRows, exam?.name, exam?.subjectGauges]);

  const emptyMessage = !dataQuality.canPriorityList
    ? dataQuality.message
    : priorityRows.length === 0
      ? "Kritik konu bulunamadı — sınıf doğruluğu %50 altı soru yok."
      : tierFilter !== "all"
        ? "Bu triage seviyesinde gösterilecek konu yok."
        : dersFilter !== "all"
          ? "Seçilen derste bu filtrede konu yok."
          : "Gösterilecek konu yok.";

  return (
    <section data-am-tab="3" role="tabpanel" className="am-v3-otonom space-y-4">
      <div className="am-v3-otonom-hero am-card overflow-hidden">
        <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50/80 to-white px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="am-v3-pill am-v3-pill--rose mb-2 inline-flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                OTONOM v3
              </span>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Acil müdahale matrisi
              </h2>
              <p className="mt-1 max-w-lg text-sm leading-relaxed text-slate-500">
                Sınıf doğruluğu düşük soruları triage edin; ders butonlarıyla filtreleyin,
                detay için renkli satıra tıklayın.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => toast.message("Toplu müdahale planı hazırlanıyor…")}
              >
                <Zap className="mr-1.5 h-4 w-4" />
                Müdahale et
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenPdf}
                disabled={!priorityRows.length}
              >
                <Printer className="mr-1.5 h-4 w-4" />
                Yazdır / PDF
              </Button>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 sm:px-6">
          <AmTierStrip
            tiers={tierSummary}
            activeTier={tierFilter}
            onTierClick={setTierFilter}
            onTierPress={(tier) => {
              setModalTier(tier);
              setModalOpen(true);
              setTierFilter(tier);
            }}
          />
          <p className="mt-2.5 text-[11px] text-slate-400">
            Kritik / Dikkat / Normal — detay modalı için satıra tıklayın
          </p>
        </div>
      </div>

      <AmPriorityTierDetailModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        payload={priorityModalPayload}
      />

      <div className="am-card p-4 sm:p-5">
        <AmDersFilterBar
          value={dersFilter}
          onChange={onDersFilterChange}
          subjects={subjectFilters}
          totalCount={priorityRows.length}
        />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <ListFilter className="h-3.5 w-3.5 text-slate-400" />
            {displayRows.length} konu listeleniyor
            {dersFilter !== "all" && (
              <span className="text-slate-400">· {dersFilter}</span>
            )}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => toast.message("Toplu ek ders planı hazırlanıyor…")}
          >
            Toplu ek ders planla
            {topActionSubject ? (
              <span className="ml-1 max-w-[120px] truncate text-slate-500">
                · {topActionSubject}
              </span>
            ) : null}
          </Button>
        </div>
      </div>

      {displayRows.length === 0 ? (
        <div className="am-card flex min-h-[220px] flex-col items-center justify-center gap-2 p-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <ListFilter className="h-6 w-6" />
          </div>
          <p className="max-w-sm text-sm font-semibold text-slate-700">{emptyMessage}</p>
          {dersFilter !== "all" && priorityRows.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => onDersFilterChange("all")}>
              Tüm dersleri göster
            </Button>
          )}
        </div>
      ) : groupedRows ? (
        <div id="am-priority-list" className="space-y-4">
          {groupedRows.map((g) => (
            <div key={g.subjectName} className="am-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                <h3 className="text-sm font-bold text-slate-900">{g.subjectName}</h3>
                <span className="rounded-full bg-slate-200/80 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                  {g.rows.length} soru
                </span>
              </div>
              <ul className="space-y-2 p-3">
                {g.rows.map((r) => (
                  <li key={r.qNo}>
                    <AmPriorityTopicCard
                      row={r}
                      onSuggestLesson={() =>
                        toast.message(
                          `Soru ${r.qNo} · ${r.topicName} için ek ders önerisi hazırlanıyor…`
                        )
                      }
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <ul id="am-priority-list" className="grid gap-2 sm:grid-cols-1 lg:grid-cols-2">
          {displayRows.map((r) => (
            <li key={r.qNo}>
              <AmPriorityTopicCard
                row={r}
                onSuggestLesson={() =>
                  toast.message(
                    `Soru ${r.qNo} · ${r.topicName} için ek ders önerisi hazırlanıyor…`
                  )
                }
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
