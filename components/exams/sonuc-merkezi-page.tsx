"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, FileSpreadsheet, ListOrdered, MessageCircle, Users } from "lucide-react";
import { toast } from "@/lib/notify";

import { KarnePickerModal } from "@/components/exams/sonuc-merkezi/karne-picker-modal";
import { SonucReportModal } from "@/components/exams/sonuc-merkezi/sonuc-report-modal";
import { SonucWaModal } from "@/components/exams/sonuc-merkezi/wa-modal";
import { ExamTypeBadge } from "@/components/exams/exam-type-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useExamResults } from "@/hooks/use-exam-results";
import { DENEMELER_ROUTES } from "@/lib/coach/denemeler-nav-config";
import { exportExamToCsv } from "@/lib/export/csv-exam-results";
import {
  buildExamNamesFromResultsIndex,
  examSearchHaystack,
  loTrSearch,
} from "@/lib/exams/exam-rank";
import { computeKpiStats, resultsForExam } from "@/lib/exams/exam-results-storage";
import { findExamById, formatTrDate, loadMergedExams } from "@/lib/exams/exam-storage";
import {
  aggAvgNet,
  computeResultsAgg,
  countExamsWithResults,
} from "@/lib/exams/results-agg";
import { onExamMatrixChange, onExamsChange } from "@/lib/exams/events";
import type { ExamResultRow, MergedExam } from "@/lib/exams/types";
import { formatTrNumber } from "@/lib/format/numbers";
import {
  buildRankedReportFragment,
  buildSelectedStudentKarnesFragment,
} from "@/lib/karne";
import { cn } from "@/lib/utils";

import "./sonuc-merkezi/karne-screen.css";
import "./sonuc-merkezi/sonuc-merkezi-modals.css";
import "@/styles/print-a4-global.css";
import "@/styles/sonuc-merkezi-print.css";

function SonucMerkeziInner() {
  const searchParams = useSearchParams();
  const deepExamId = searchParams.get("examId") || searchParams.get("exam");
  const deepOpen = searchParams.get("open");
  const { results, hydrated, refresh } = useExamResults();
  const [examRevision, setExamRevision] = useState(0);
  const [search, setSearch] = useState("");
  const [turFilter, setTurFilter] = useState("tumu");
  const [sort, setSort] = useState<"new" | "old">("new");
  const [openId, setOpenId] = useState<string | null>(null);
  const [waOpen, setWaOpen] = useState(false);
  const [karneOpen, setKarneOpen] = useState(false);
  const [karneExam, setKarneExam] = useState<MergedExam | null>(null);
  const [waExam, setWaExam] = useState<MergedExam | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState("Rapor");
  const [reportHtml, setReportHtml] = useState("");
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});
  const deepLinked = useRef(false);

  const exams = useMemo(() => loadMergedExams(), [results, hydrated, examRevision]);
  const agg = useMemo(() => computeResultsAgg(results), [results]);
  const namesIdx = useMemo(() => buildExamNamesFromResultsIndex(results), [results]);
  const kpi = useMemo(
    () =>
      computeKpiStats(results, exams.length, countExamsWithResults(agg)),
    [results, exams.length, agg]
  );

  const filteredExams = useMemo(() => {
    const q = loTrSearch(search.trim());
    let list = exams.filter((e) => {
      if (turFilter === "kurumsal" && e.isGlobal) return false;
      if (turFilter === "global" && !e.isGlobal) return false;
      if (q && !examSearchHaystack(e, namesIdx).includes(q)) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      const da = Date.parse(String(a.tarih || a.date || ""));
      const db = Date.parse(String(b.tarih || b.date || ""));
      return sort === "new" ? db - da : da - db;
    });
    return list;
  }, [exams, search, turFilter, sort, namesIdx]);

  useEffect(() => {
    const bump = () => setExamRevision((n) => n + 1);
    const offExams = onExamsChange(bump);
    const offMatrix = onExamMatrixChange(bump);
    return () => {
      offExams();
      offMatrix();
    };
  }, []);

  const openReport = (html: string, title: string) => {
    setReportHtml(html);
    setReportTitle(title);
    setReportOpen(true);
  };

  const openKarnePicker = (exam: MergedExam) => {
    setKarneExam(exam);
    setKarneOpen(true);
  };

  const openRankedForExam = (exam: MergedExam) => {
    const rows = resultsForExam(exam.id);
    if (!rows.length) {
      toast.message("Bu sınav için examResults kaydı yok.");
      return;
    }
    const resolvedExam = findExamById(exam.id) ?? exam;
    openReport(
      buildRankedReportFragment(resolvedExam, rows),
      `Kurum sıralı liste · ${exam.name || exam.ad || exam.id}`
    );
  };

  const handleKarneGenerate = (selected: ExamResultRow[]) => {
    if (!karneExam) return;
    setKarneOpen(false);
    const resolvedExam = findExamById(karneExam.id) ?? karneExam;
    const html = buildSelectedStudentKarnesFragment(resolvedExam, selected);
    openReport(
      html,
      `Öğrenci karneleri · ${karneExam.name || karneExam.ad || karneExam.id}`
    );
  };

  useEffect(() => {
    if (!deepExamId || !hydrated || deepLinked.current) return;
    const exam = exams.find((e) => e.id === deepExamId);
    if (!exam) return;

    setOpenId(deepExamId);
    deepLinked.current = true;

    if (deepOpen === "karne") {
      const rows = resultsForExam(deepExamId);
      if (rows.length) openKarnePicker(exam);
      else toast.message("Bu sınav için henüz sonuç yok — önce sonuç yükleyin.");
    } else if (deepOpen === "ranked") {
      openRankedForExam(exam);
    }

    requestAnimationFrame(() => {
      cardRefs.current[deepExamId]?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [deepExamId, deepOpen, hydrated, exams]);

  if (!hydrated) {
    return <div className="py-12 text-center text-slate-500">Yükleniyor…</div>;
  }

  const calendarEmpty = exams.length === 0;
  const filterEmpty = !calendarEmpty && filteredExams.length === 0;

  return (
    <div className="sonuc-merkezi-shell space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Sonuç Merkezi</h1>
        <p className="mt-1 text-sm text-slate-600">
          Kurum ve global sınav sonuçları — sıralı liste, öğrenci karne ve veli iletişimi. Özet ve
          listeler <strong>examResults</strong> + takvim sınav kaydından hesaplanır; arama yalnızca
          görünümü filtreler, yeni veri üretmez.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Takvim sınavı", value: formatTrNumber(kpi.examCount), sub: null },
          {
            label: "Katılım kaydı",
            value: formatTrNumber(kpi.participationRecords),
            sub: `${kpi.participationExamIds} farklı sınav`,
          },
          { label: "Sonuçlu sınav", value: formatTrNumber(kpi.examsWithResults), sub: null },
          {
            label: "Genel ort. net",
            value: kpi.avgNet != null ? String(kpi.avgNet) : "—",
            sub: null,
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {card.label}
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{card.value}</p>
            {card.sub && <p className="mt-1 text-xs text-slate-500">{card.sub}</p>}
          </div>
        ))}
      </div>

      <div className="no-print flex flex-wrap gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <Input
          placeholder="Sınav adı, tarih ara…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={turFilter} onValueChange={setTurFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tumu">Tümü</SelectItem>
            <SelectItem value="kurumsal">Kurumsal</SelectItem>
            <SelectItem value="global">Global</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as "new" | "old")}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">Yeni → Eski</SelectItem>
            <SelectItem value="old">Eski → Yeni</SelectItem>
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" size="sm" onClick={() => refresh()}>
          Yenile
        </Button>
      </div>

      {calendarEmpty ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
          <p className="font-medium text-slate-800">Henüz deneme tanımlanmadı</p>
          <p className="mt-2 text-sm text-slate-600">
            Önce kurumsal veya global takvime sınav ekleyin; ardından sonuç yükleyin.
          </p>
          <Button variant="primary" className="mt-4" asChild>
            <Link href={DENEMELER_ROUTES.kurumsal}>Kurumsal deneme takvimine git</Link>
          </Button>
        </div>
      ) : filterEmpty ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
          <p className="text-slate-600">Arama veya filtreye uyan sınav yok.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredExams.map((exam) => {
            const rows = resultsForExam(exam.id);
            const st = agg[exam.id];
            const open = openId === exam.id;
            const resolvedExam = findExamById(exam.id) ?? exam;
            const hasKey = Boolean(
              resolvedExam.cevaplar?.some((c) => String(c || "").trim())
            );
            const hasKonu = Boolean(
              resolvedExam.konu?.some((k) => String(k || "").trim()) ||
                resolvedExam.konuYazi?.some((k) => String(k || "").trim())
            );

            return (
              <article
                key={exam.id}
                ref={(el) => {
                  cardRefs.current[exam.id] = el;
                }}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
              >
                <button
                  type="button"
                  className="flex w-full flex-wrap items-center gap-3 px-5 py-4 text-left hover:bg-slate-50/80"
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? null : exam.id)}
                >
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 shrink-0 text-slate-400 transition-transform",
                      open && "rotate-180"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                          exam.isGlobal
                            ? "bg-blue-100 text-blue-800"
                            : "bg-emerald-100 text-emerald-800"
                        )}
                      >
                        {exam.isGlobal ? "Deneme" : "Kurumsal"}
                      </span>
                      <p className="font-semibold text-slate-900">{exam.name || exam.ad}</p>
                    </div>
                    <p className="text-xs text-slate-500">
                      {formatTrDate(exam.tarih || exam.date)}
                      {!hasKey && rows.length > 0 && (
                        <span className="ml-2 text-amber-700"> · Cevap anahtarı eksik</span>
                      )}
                      {hasKey && !hasKonu && rows.length > 0 && (
                        <span className="ml-2 text-amber-700"> · Konu matrisi eksik</span>
                      )}
                    </p>
                  </div>
                  <ExamTypeBadge sinav={exam.sinav} />
                  {!st?.count ? (
                    <span className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                      Sonuç bekleniyor
                    </span>
                  ) : (
                    <span className="text-sm text-slate-600">
                      <strong>{st.count}</strong> katılım · Ort.{" "}
                      <strong className="text-emerald-600">{aggAvgNet(st)}</strong> net
                    </span>
                  )}
                </button>

                {open && (
                  <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <Button
                        type="button"
                        variant="primary"
                        className="justify-center gap-2"
                        disabled={rows.length === 0}
                        onClick={() => openRankedForExam(exam)}
                      >
                        <ListOrdered className="h-4 w-4" />
                        Kurum sıralı liste
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        className="justify-center gap-2"
                        disabled={rows.length === 0}
                        onClick={() => openKarnePicker(exam)}
                      >
                        <Users className="h-4 w-4" />
                        Öğrenci karneleri
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="justify-center gap-2 border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                        disabled={rows.length === 0}
                        onClick={() => {
                          const n = exportExamToCsv(exam.id, rows);
                          toast.success(`${n} satır CSV indirildi`);
                        }}
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                        Excel indir
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="justify-center gap-2"
                        disabled={rows.length === 0}
                        onClick={() => {
                          setWaExam(exam);
                          setWaOpen(true);
                        }}
                      >
                        <MessageCircle className="h-4 w-4" />
                        WhatsApp / SMS
                      </Button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          href={`/dashboard/analiz-merkezi?examId=${encodeURIComponent(exam.id)}&tab=3`}
                        >
                          Analiz merkezi
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          href={`${DENEMELER_ROUTES.yukleme}?examId=${encodeURIComponent(exam.id)}`}
                        >
                          Sonuç yükle
                        </Link>
                      </Button>
                    </div>
                    {rows.length === 0 ? (
                      <p className="mt-3 text-sm text-slate-500">
                        Bu sınav için henüz sonuç yok — Deneme Sonuçları Yükleme ile optik aktarın.
                      </p>
                    ) : (
                      <p className="mt-3 text-xs text-slate-500">
                        {rows.length} kayıt · Liste veya karne aksiyonunda tam ekran önizleme
                        açılır; <strong>Yazdır</strong> ile A4 kaydedin.
                      </p>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <KarnePickerModal
        open={karneOpen}
        exam={karneExam}
        rows={karneExam ? resultsForExam(karneExam.id) : []}
        onClose={() => setKarneOpen(false)}
        onGenerate={handleKarneGenerate}
      />

      <SonucWaModal
        open={waOpen}
        exam={waExam}
        rows={waExam ? resultsForExam(waExam.id) : []}
        onClose={() => {
          setWaOpen(false);
          setWaExam(null);
        }}
      />

      <SonucReportModal
        open={reportOpen}
        title={reportTitle}
        html={reportHtml}
        onClose={() => setReportOpen(false)}
      />
    </div>
  );
}

export function SonucMerkeziPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-slate-500">Yükleniyor…</div>}>
      <SonucMerkeziInner />
    </Suspense>
  );
}
