"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CircleSlash,
  ClipboardList,
  Printer,
  XCircle,
} from "lucide-react";

import {
  AmDersFilterBar,
  type DersFilterOption,
} from "@/components/analiz-merkezi/v3/am-ders-filter-bar";
import { Button } from "@/components/ui/button";
import { rateToLightBg } from "@/lib/analiz/chart-theme";
import {
  filterCellsByResult,
  filterCellsBySubject,
  groupErrorsBySubject,
} from "@/lib/analiz/error-karne-group";
import { heatmapColor, type QuestionResultCell } from "@/lib/analiz/error-karne";
import {
  buildKonuTakipLookupByQNo,
  konuTakipStatusShortLabel,
  type KonuTakipQuestionContext,
} from "@/lib/analiz/konu-takip-bridge";
import type { AnalizDataQuality } from "@/lib/analiz/matrix-quality";
import { KonuTakipQuestionBadge } from "@/components/analiz-merkezi/v3/konu-takip-question-badge";
import { useLiveKonuTakipTracking } from "@/hooks/use-live-konu-takip-tracking";
import { cn } from "@/lib/utils";

function buildErrorDersOptions(cells: QuestionResultCell[]): DersFilterOption[] {
  const groups = groupErrorsBySubject(cells);
  return groups.map((g) => ({
    id: g.subjectName,
    label: g.subjectName,
    count: g.cells.length,
    kritikCount: g.errorCount,
  }));
}

function heatmapCols(count: number) {
  if (count <= 12) return count;
  if (count <= 24) return 12;
  if (count <= 40) return 10;
  return 12;
}

function heatmapKonuTakipTitle(
  c: QuestionResultCell,
  kt?: KonuTakipQuestionContext
): string {
  const res =
    c.result === "wrong" ? "Yanlış" : c.result === "empty" ? "Boş" : "Doğru";
  const ktLine = kt
    ? `Konu takip: ${konuTakipStatusShortLabel(kt.status)}${
        kt.solved > 0 ? ` · ${kt.solved} soru çözüldü` : ""
      }`
    : "";
  return [`S${c.qNo} · ${c.topicName}`, res, `Sınıf %${c.classRate}`, ktLine]
    .filter(Boolean)
    .join(" · ");
}

function SubjectHeatmap({
  cells,
  konuTakipByQ,
}: {
  cells: QuestionResultCell[];
  konuTakipByQ: Map<number, KonuTakipQuestionContext>;
}) {
  const cols = heatmapCols(cells.length);
  return (
    <div
      className="am-v3-hata-heatmap grid gap-1.5"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {cells.map((c) => {
        const isError = c.result === "wrong" || c.result === "empty";
        const kt = konuTakipByQ.get(c.qNo);
        return (
          <div
            key={c.qNo}
            title={heatmapKonuTakipTitle(c, kt)}
            className={cn(
              "am-v3-hata-cell relative",
              heatmapColor(c.classRate),
              isError && "am-v3-hata-cell--error",
              !isError && "am-v3-hata-cell--ok opacity-55"
            )}
          >
            {kt?.status === "bitti" && (
              <span
                className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-emerald-200 ring-1 ring-emerald-600"
                aria-hidden
              />
            )}
            {kt?.status === "calisiliyor" && (
              <span
                className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-sky-200 ring-1 ring-sky-600"
                aria-hidden
              />
            )}
            <span className="font-mono text-[10px] font-extrabold">{c.qNo}</span>
          </div>
        );
      })}
    </div>
  );
}

function ErrorQuestionRow({
  cell,
  konuTakip,
}: {
  cell: QuestionResultCell;
  konuTakip: KonuTakipQuestionContext;
}) {
  const isWrong = cell.result === "wrong";
  const isCorrect = cell.result === "correct";
  return (
    <li
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2.5 text-sm",
        isWrong
          ? "border-rose-200/90 bg-rose-50/50"
          : isCorrect
            ? "border-emerald-200/80 bg-emerald-50/40"
            : "border-amber-200/90 bg-amber-50/50"
      )}
    >
      <span
        className={cn(
          "flex h-7 min-w-[2rem] items-center justify-center rounded-md font-mono text-xs font-bold",
          isWrong ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-900"
        )}
      >
        S{cell.qNo}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900">{cell.topicName}</p>
        <p className="text-[11px] text-slate-500">{cell.subjectName}</p>
      </div>
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
          isWrong ? "text-rose-700" : isCorrect ? "text-emerald-800" : "text-amber-800"
        )}
      >
        {isWrong ? "Yanlış" : isCorrect ? "Doğru" : "Boş"}
      </span>
      <KonuTakipQuestionBadge context={konuTakip} />
      <span
        className={cn(
          "rounded-full border px-2 py-0.5 text-xs font-bold",
          rateToLightBg(cell.classRate)
        )}
      >
        Sınıf %{cell.classRate}
      </span>
    </li>
  );
}

export function AmHataKarnesiPanel({
  studentId,
  studentName,
  errorCells,
  dataQuality,
  onOpenPdf,
}: {
  studentId: string;
  studentName: string;
  errorCells: QuestionResultCell[];
  dataQuality: AnalizDataQuality;
  onOpenPdf?: () => void;
}) {
  const [dersFilter, setDersFilter] = useState("all");
  const [resultFilter, setResultFilter] = useState<"all" | "wrong" | "empty" | "correct">(
    "all"
  );
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  const { tracking: konuTakipTracking } = useLiveKonuTakipTracking(studentId);

  const konuTakipByQ = useMemo(
    () => buildKonuTakipLookupByQNo(studentId, errorCells, konuTakipTracking),
    [studentId, errorCells, konuTakipTracking]
  );

  const wrongCount = useMemo(
    () => errorCells.filter((c) => c.result === "wrong").length,
    [errorCells]
  );
  const emptyCount = useMemo(
    () => errorCells.filter((c) => c.result === "empty").length,
    [errorCells]
  );
  const correctCount = useMemo(
    () => errorCells.filter((c) => c.result === "correct").length,
    [errorCells]
  );
  const konuBittiOnErrors = useMemo(() => {
    return errorCells.filter((c) => {
      if (c.result === "correct") return false;
      return konuTakipByQ.get(c.qNo)?.status === "bitti";
    }).length;
  }, [errorCells, konuTakipByQ]);

  const dersOptions = useMemo(() => buildErrorDersOptions(errorCells), [errorCells]);

  const subjectGroups = useMemo(() => {
    const byDers = filterCellsBySubject(errorCells, dersFilter);
    return groupErrorsBySubject(byDers);
  }, [errorCells, dersFilter]);

  const listCells = useMemo(() => {
    const errs = filterCellsByResult(
      filterCellsBySubject(errorCells, dersFilter),
      resultFilter === "all" ? "all" : resultFilter
    );
    return errs.sort((a, b) => a.qNo - b.qNo);
  }, [errorCells, dersFilter, resultFilter]);

  const listBySubject = useMemo(() => groupErrorsBySubject(listCells), [listCells]);

  useEffect(() => {
    if (!subjectGroups.length) {
      setExpandedSubject(null);
      return;
    }
    const open = subjectGroups.some((g) => g.subjectName === expandedSubject);
    if (!open) setExpandedSubject(subjectGroups[0]!.subjectName);
  }, [subjectGroups, expandedSubject]);

  if (!errorCells.length) {
    return (
      <div className="am-card grid min-h-[220px] place-items-center p-10 text-center">
        <p className="text-sm font-semibold text-slate-700">
          {dataQuality.message || "Bu sınav için soru matrisi veya sonuç bulunamadı."}
        </p>
      </div>
    );
  }

  return (
    <section data-am-tab="4" role="tabpanel" className="am-v3-hata space-y-4">
      <div className="am-v3-hata-hero am-card overflow-hidden">
        <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50/90 to-white px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="am-v3-pill am-v3-pill--slate mb-2 inline-flex items-center gap-1.5">
                <ClipboardList className="h-3 w-3" />
                Hata karnesi v3
              </span>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                {studentName}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Sınav soruları ders ders — Konu Takip durumu ile birlikte
              </p>
            </div>
            {onOpenPdf && (
              <Button variant="outline" size="sm" onClick={onOpenPdf}>
                <Printer className="mr-1.5 h-4 w-4" />
                Yazdır / PDF
              </Button>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-rose-700">
              <XCircle className="h-3.5 w-3.5" />
              {wrongCount} yanlış
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-amber-800">
              <CircleSlash className="h-3.5 w-3.5" />
              {emptyCount} boş
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
              {errorCells.length} soru
            </span>
            {studentId && konuBittiOnErrors > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800">
                {konuBittiOnErrors} hata · konu bitti işaretli
              </span>
            )}
          </div>
        </div>

        <div className="px-5 py-4 sm:px-6">
          <AmDersFilterBar
            value={dersFilter}
            onChange={setDersFilter}
            subjects={dersOptions}
            totalCount={errorCells.length}
          />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: "all" as const, label: "Tüm hatalar", count: wrongCount + emptyCount },
                  { id: "wrong" as const, label: "Yanlış", count: wrongCount },
                  { id: "empty" as const, label: "Boş", count: emptyCount },
                  { id: "correct" as const, label: "Doğru", count: correctCount },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={cn(
                    "am-filter-chip",
                    resultFilter === f.id && "am-filter-chip--active"
                  )}
                  onClick={() => setResultFilter(f.id)}
                >
                  {f.label}
                  <span className="ml-1 opacity-80">({f.count})</span>
                </button>
              ))}
            </div>
            <div className="am-heatmap-legend flex flex-wrap gap-3">
              <span>
                <i className="bg-emerald-500" /> ≥%70
              </span>
              <span>
                <i className="bg-amber-400" /> %40–70
              </span>
              <span>
                <i className="bg-red-500" /> &lt;%40
              </span>
              <span className="text-slate-500">
                <i className="inline-block h-2 w-2 rounded-full bg-emerald-600 ring-1 ring-emerald-200" />{" "}
                Konu bitti
              </span>
              <span className="text-slate-500">
                <i className="inline-block h-2 w-2 rounded-full bg-sky-600 ring-1 ring-sky-200" />{" "}
                Konu çalışılıyor
              </span>
              <span className="text-slate-500">
                <i className="inline-block h-2 w-2 rounded-full bg-slate-400 ring-1 ring-slate-200" />{" "}
                Konu başlanmadı
              </span>
            </div>
          </div>
        </div>
      </div>

      <div id="am-hata-by-subject" className="space-y-3">
        {subjectGroups.map((g) => {
          const open = expandedSubject === g.subjectName;
          return (
            <div key={g.subjectName} className="am-card overflow-hidden">
              <button
                type="button"
                className="flex w-full items-center gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3.5 text-left transition-colors hover:bg-slate-100/80"
                onClick={() => setExpandedSubject(open ? null : g.subjectName)}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white">
                  {g.cells.length}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900">{g.subjectName}</p>
                  <p className="text-xs text-slate-500">
                    {g.wrong} yanlış · {g.empty} boş · {g.correct} doğru
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-1.5">
                  {g.errorCount > 0 && (
                    <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                      {g.errorCount} hata
                    </span>
                  )}
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold",
                      rateToLightBg(g.minClassRate)
                    )}
                  >
                    min. sınıf %{g.minClassRate}
                  </span>
                </div>
              </button>

              {open && (
                <div className="space-y-4 p-4">
                  <div>
                    <p className="mb-2 text-xs font-semibold text-slate-500">
                      Soru ısı haritası · halka = öğrenci hatası
                    </p>
                    <SubjectHeatmap cells={g.cells} konuTakipByQ={konuTakipByQ} />
                  </div>

                  {(() => {
                    const subjectList = listBySubject.find(
                      (s) => s.subjectName === g.subjectName
                    );
                    const rows = subjectList?.cells ?? [];
                    if (!rows.length) {
                      return (
                        <p className="rounded-lg bg-slate-50 py-4 text-center text-xs text-slate-500">
                          Bu filtrede bu derste listelenecek hata yok.
                        </p>
                      );
                    }
                    return (
                      <div>
                        <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-slate-500">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Konu listesi ({rows.length})
                        </p>
                        <ul className="space-y-1.5">
                          {rows.map((c) => (
                            <ErrorQuestionRow
                              key={c.qNo}
                              cell={c}
                              konuTakip={
                                konuTakipByQ.get(c.qNo) ?? {
                                  status: "baslanmadi",
                                  solved: 0,
                                  matchedById: false,
                                  matchedByName: false,
                                }
                              }
                            />
                          ))}
                        </ul>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {listCells.length === 0 && resultFilter !== "all" && (
        <p className="am-card py-6 text-center text-sm text-slate-500">
          Seçilen filtrede hata yok. &quot;Tüm hatalar&quot; görünümünü deneyin.
        </p>
      )}
    </section>
  );
}
