"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  BarChart3,
  MessageSquare,
  Printer,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { ClassBarChart } from "@/components/analiz-merkezi/charts/class-bar-chart";
import { ChartCard } from "@/components/analiz-merkezi/charts/chart-shell";
import { CompetencyRadarChart } from "@/components/analiz-merkezi/charts/competency-radar-chart";
import { NetDistributionChart } from "@/components/analiz-merkezi/charts/net-distribution-chart";
import { SubjectVerticalBarChart } from "@/components/analiz-merkezi/charts/subject-vertical-bar-chart";
import { TrendLineChart } from "@/components/analiz-merkezi/charts/trend-line-chart";
import { AmKpiStrip } from "@/components/analiz-merkezi/v2/am-kpi-strip";
import { AmSubjectGauges } from "@/components/analiz-merkezi/v2/am-subject-gauges";
import { AmHataKarnesiPanel } from "@/components/analiz-merkezi/v3/am-hata-karnesi-panel";
import { AmMasteryPanel } from "@/components/analiz-merkezi/v3/am-mastery-panel";
import { AmOtonomPanel } from "@/components/analiz-merkezi/v3/am-otonom-panel";
import { VersusPills } from "@/components/analiz-merkezi/versus-pills";
import { bucketNetDistribution, rateToLightBg } from "@/lib/analiz/chart-theme";
import { buildAnalizReportFragment } from "@/lib/analiz/build-analiz-report-html";
import { ExamCombobox } from "@/components/exams/upload/exam-combobox";
import { SonucReportModal } from "@/components/exams/sonuc-merkezi/sonuc-report-modal";
import { BetaWarningModal } from "@/components/analiz-merkezi/BetaWarningModal";
import { MatrixStatusBanner } from "@/components/analiz-merkezi/matrix-status-banner";
import {
  DYB_RADAR_AXIS_NAMES,
  isDyBSummaryGaugeName,
} from "@/lib/analiz/chart-fallbacks";
import { getAnalizDataQuality } from "@/lib/analiz/matrix-quality";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buildTrendChartData, getExamResults } from "@/lib/analiz/analiz-merkezi-ls";
import { buildPriorityList, computeClassQuestionRates } from "@/lib/analiz/class-question-rates";
import {
  aggregateCrossBySubject,
  summarizeCrossMastery,
} from "@/lib/analiz/cross-summary";
import { getStudentExamQuestionCells } from "@/lib/analiz/error-karne";
import { getAnswerKeyForExamId } from "@/lib/analiz/hydrate";
import { getSinavForExamId, sinavScopeLabel } from "@/lib/analiz/mastery-scope";
import {
  analyzeMasteryTrends,
  sinavToExamType,
} from "@/lib/analiz/mastery-trend-engine";
import { calculateSubjectMastery } from "@/lib/analiz/subject-mastery";
import { findExamById } from "@/lib/exams/exam-storage";
import {
  buildCompetencyRadarSeries,
  buildStudentSubjectBreakdown,
} from "@/lib/analiz/student-subject-breakdown";
import type { AnalizStudent } from "@/lib/analiz/types";
import { useAnalizData } from "@/hooks/use-analiz-data";
import { useLiveKonuTakipTracking } from "@/hooks/use-live-konu-takip-tracking";
import { toast } from "@/lib/notify";
import { cn } from "@/lib/utils";

import "@/styles/print-a4-global.css";
import "@/styles/sonuc-merkezi-print.css";
import "@/styles/analiz-merkezi-print.css";
import "@/components/exams/sonuc-merkezi/sonuc-merkezi-modals.css";
import "./analiz-merkezi.css";

const TABS = [
  { id: "1", label: "Kurum / Sınıf" },
  { id: "2", label: "Bireysel", badge: "V2" },
  {
    id: "3",
    label: "Öncelikli Konular",
    badge: "OTONOM v3",
    badgeClass: "bg-rose-100 text-rose-800",
  },
  { id: "4", label: "Hata Karnesi", badge: "v3", badgeClass: "bg-slate-900 text-white" },
  {
    id: "5",
    label: "Konu Hakimiyeti",
    badge: "v3",
    badgeClass: "bg-slate-900 text-white",
  },
] as const;

function AnalizMerkeziInner() {
  const searchParams = useSearchParams();
  const {
    data,
    examId,
    setExamId,
    activeTab,
    setActiveTab,
    studentId,
    setStudentId,
    classFilter,
    setClassFilter,
    currentExam,
    classOptions,
    filteredStudents,
    examMeta,
  } = useAnalizData();

  const [tab1Ready, setTab1Ready] = useState(false);
  const [tab2Search, setTab2Search] = useState("");
  const [globalStudentSearch, setGlobalStudentSearch] = useState("");
  const [comboOpen, setComboOpen] = useState(false);
  const [tab2StudentId, setTab2StudentId] = useState("");
  const [versus, setVersus] = useState({ student: true, class: true, top: false });
  const [drillSubject, setDrillSubject] = useState<string | null>(null);
  const [priorityDersFilter, setPriorityDersFilter] = useState("all");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState("Analiz raporu");
  const [reportHtml, setReportHtml] = useState("");
  const deepLinked = useRef(false);

  useEffect(() => {
    if (deepLinked.current) return;
    const eid = searchParams.get("examId") || searchParams.get("exam");
    const tab = searchParams.get("tab");
    if (eid) setExamId(eid);
    if (tab) setActiveTab(String(tab));
    deepLinked.current = true;
  }, [searchParams, setExamId, setActiveTab]);

  useEffect(() => {
    setTab1Ready(false);
    if (!examId) return;
    const t = window.setTimeout(() => setTab1Ready(true), 400);
    return () => window.clearTimeout(t);
  }, [examId]);

  useEffect(() => {
    if (tab2StudentId) setStudentId(tab2StudentId);
  }, [tab2StudentId, setStudentId]);

  useEffect(() => {
    setDrillSubject(null);
    setVersus({ student: true, class: true, top: false });
  }, [tab2StudentId, examId]);

  const priorityRows = useMemo(() => {
    if (!examId) return [];
    return buildPriorityList(examId, getExamResults());
  }, [examId, data]);

  const classRatesMap = useMemo(() => {
    if (!examId) return {} as Record<number, number>;
    const key = getAnswerKeyForExamId(examId);
    const rows = computeClassQuestionRates(examId, getExamResults(), key);
    const m: Record<number, number> = {};
    rows.forEach((r) => {
      m[r.qNo] = r.classCorrectRate;
    });
    return m;
  }, [examId, data]);

  const tab2Students = useMemo(() => {
    const q = tab2Search.trim().toLowerCase();
    let list = filteredStudents;
    if (q) list = list.filter((s) => s.name.toLowerCase().includes(q));
    return list;
  }, [filteredStudents, tab2Search]);

  const selectedTab2 = tab2Students.find((s) => s.id === tab2StudentId) || tab2Students[0];

  useEffect(() => {
    if (!tab2StudentId && tab2Students[0]) setTab2StudentId(tab2Students[0].id);
  }, [tab2Students, tab2StudentId]);

  const allStudentsForCombo = useMemo(() => {
    const map = new Map<string, AnalizStudent>();
    Object.values(data.exams).forEach((ex) => {
      ex.students.forEach((s) => map.set(s.id, s));
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }, [data.exams]);

  const comboStudents = useMemo(() => {
    const q = globalStudentSearch.trim().toLowerCase();
    if (!q) return allStudentsForCombo;
    return allStudentsForCombo.filter((s) => s.name.toLowerCase().includes(q));
  }, [allStudentsForCombo, globalStudentSearch]);

  const crossStudentId = studentId || tab2StudentId;

  /** Tüm sekmelerde Konu Takip store aboneliği — Hata Karnesi canlı güncelleme */
  useLiveKonuTakipTracking(crossStudentId);

  /** Konu hakimiyeti: üstte seçilen denemenin sınav tipine göre (TYT/AYT/YDT) tüm aynı tip denemeler */
  const masterySinav = useMemo(() => {
    if (!examId) return null;
    return getSinavForExamId(examId);
  }, [examId, data]);

  const crossMastery = useMemo(() => {
    if (!crossStudentId || !masterySinav) return [];
    return calculateSubjectMastery(crossStudentId, { sinav: masterySinav });
  }, [crossStudentId, masterySinav, data]);

  const topicTrends = useMemo(() => {
    const examType = sinavToExamType(masterySinav);
    if (!crossStudentId || !examId || !examType) return [];
    const ex = findExamById(examId);
    const currentExamDate = ex?.tarih || examMeta[examId]?.date || "";
    return analyzeMasteryTrends({
      studentId: crossStudentId,
      currentExamId: examId,
      currentExamType: examType,
      currentExamDate,
    });
  }, [crossStudentId, examId, masterySinav, examMeta, data]);

  const trendData = useMemo(() => {
    if (!selectedTab2) return null;
    return buildTrendChartData(selectedTab2.id, examMeta);
  }, [selectedTab2, examMeta]);

  const trendChartRows = useMemo(() => {
    if (!trendData) return [];
    return trendData.categories.map((cat, i) => ({
      name: cat,
      actual: trendData.actualSeries[i],
      forecast: trendData.forecastSeries[i],
    }));
  }, [trendData]);

  const classBarData = useMemo(() => {
    if (!currentExam) return [];
    return currentExam.classes.labels.map((label, i) => ({
      name: label,
      doğru: currentExam.classes.correct[i] ?? 0,
      yanlış: currentExam.classes.wrong[i] ?? 0,
      boş: currentExam.classes.empty[i] ?? 0,
    }));
  }, [currentExam]);

  const answerKeyStr = useMemo(
    () => (examId ? getAnswerKeyForExamId(examId) : ""),
    [examId, data]
  );

  const studentSubjectBreakdown = useMemo(() => {
    if (!examId || !selectedTab2) return { gauges: [], drillDown: {} as Record<string, { name: string; rate: number }[]> };
    return buildStudentSubjectBreakdown(examId, selectedTab2.id, answerKeyStr);
  }, [examId, selectedTab2, answerKeyStr, data]);

  const subjectBarData = useMemo(() => {
    if (drillSubject && studentSubjectBreakdown.drillDown[drillSubject]) {
      return studentSubjectBreakdown.drillDown[drillSubject].map((g) => ({
        name: g.name,
        rate: g.rate,
      }));
    }
    return studentSubjectBreakdown.gauges.map((g) => ({ name: g.name, rate: g.rate }));
  }, [drillSubject, studentSubjectBreakdown]);

  const radarData = useMemo(() => {
    if (!examId || !currentExam || !selectedTab2) return [];
    return buildCompetencyRadarSeries(
      examId,
      selectedTab2,
      currentExam.students,
      answerKeyStr
    );
  }, [examId, currentExam, selectedTab2, answerKeyStr, data]);

  const crossSummary = useMemo(() => {
    if (!crossStudentId) {
      return { examCount: 0, correct: 0, wrong: 0, empty: 0, avgRate: 0 };
    }
    return summarizeCrossMastery(crossStudentId, crossMastery, { sinav: masterySinav });
  }, [crossStudentId, crossMastery, masterySinav]);

  const crossSubjectBarData = useMemo(
    () => aggregateCrossBySubject(crossMastery),
    [crossMastery]
  );

  const priorityDersOptions = useMemo(() => {
    const set = new Set(priorityRows.map((r) => r.subjectName));
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b, "tr"))];
  }, [priorityRows]);

  const filteredPriorityRows = useMemo(() => {
    if (priorityDersFilter === "all") return priorityRows;
    return priorityRows.filter((r) => r.subjectName === priorityDersFilter);
  }, [priorityRows, priorityDersFilter]);

  const dataQuality = useMemo(() => {
    if (!examId || !currentExam) {
      return getAnalizDataQuality(examId || "", 0);
    }
    return getAnalizDataQuality(examId, currentExam.students.length);
  }, [examId, currentExam]);

  const radarIsDyBFallback = useMemo(
    () =>
      radarData.length > 0 &&
      DYB_RADAR_AXIS_NAMES.includes(
        radarData[0]!.subject as (typeof DYB_RADAR_AXIS_NAMES)[number]
      ),
    [radarData]
  );

  const subjectGaugesSubtitle = useMemo(() => {
    const mode = currentExam?.subjectGaugeMode;
    if (mode === "matrix") return "Konu matrisi + optik — ders doğruluk oranları";
    if (mode === "layout") return "Sınav blokları + cevap anahtarı — ders doğruluk oranları";
    if (currentExam?.subjectGauges.some((g) => isDyBSummaryGaugeName(g.name))) {
      return "Özet (D/Y/B) — konu matrisi veya cevap anahtarı eksik";
    }
    return "Sınıf geneli doğruluk oranları";
  }, [currentExam]);

  const netDistData = useMemo(() => {
    if (!currentExam) return [];
    return bucketNetDistribution(currentExam.students.map((s) => s.net));
  }, [currentExam]);

  const topBottomSubjects = useMemo(() => {
    const g = studentSubjectBreakdown.gauges;
    if (!g.length) return { top: null as string | null, bottom: null as string | null };
    const sorted = [...g].sort((a, b) => b.rate - a.rate);
    return { top: sorted[0]?.name ?? null, bottom: sorted[sorted.length - 1]?.name ?? null };
  }, [studentSubjectBreakdown]);

  const errorCells = useMemo(() => {
    if (!examId || !crossStudentId) return [];
    return getStudentExamQuestionCells(examId, crossStudentId, classRatesMap);
  }, [examId, crossStudentId, classRatesMap]);


  const handleVeliPrint = () => {
    setActiveTab("2");
    window.setTimeout(() => window.print(), 300);
  };

  const attendPct = currentExam
    ? Math.min(
        100,
        Math.round(
          (1000 * currentExam.kpi.attendance.done) /
            Math.max(currentExam.kpi.attendance.total, 1)
        ) / 10
      )
    : 0;

  const openAnalizPdfReport = () => {
    if (!examId || !currentExam) {
      toast.message("Önce bir sınav seçin.");
      return;
    }
    const topicRows = studentSubjectBreakdown.gauges.map((g) => ({
      name: g.name,
      rate: g.rate,
    }));
    const html = buildAnalizReportFragment({
      exam: currentExam,
      classFilter,
      attendPct,
      priorityRows,
      students: filteredStudents,
      selectedStudent: selectedTab2 ?? null,
      studentTopicRows: topicRows,
      crossStudentName:
        allStudentsForCombo.find((s) => s.id === crossStudentId)?.name || "",
      crossMastery,
      crossSummary,
      errorCells: errorCells.filter((c) => c.result !== "correct"),
    });
    if (!html.trim()) {
      toast.message("Rapor içeriği oluşturulamadı.");
      return;
    }
    setReportHtml(html);
    setReportTitle(`Analiz raporu · ${currentExam.name}`);
    setReportOpen(true);
  };

  return (
    <div id="am-scope" className="relative space-y-6 pb-10">
      <BetaWarningModal />
      <SonucReportModal
        open={reportOpen}
        title={reportTitle}
        html={reportHtml}
        onClose={() => setReportOpen(false)}
      />

      <header className="no-print-am space-y-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
          <Sparkles className="h-3 w-3" />
          Analiz V3
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Analiz &amp; Raporlama Merkezi
        </h1>
        <p className="max-w-2xl text-sm text-slate-600">
          Triage kartları, otonom öncelik motoru ve konu hakimiyeti — sınıf ve bireysel raporları
          tek merkezde yönetin.
        </p>
        {examId && currentExam && (
          <div className="flex flex-wrap gap-2 pt-1 text-xs font-semibold text-slate-700">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
              {currentExam.name}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
              {currentExam.students.length} katılım
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-900 px-3 py-1 text-white">
              Ort. {currentExam.kpi.avgNet} net
            </span>
          </div>
        )}
      </header>

      <div id="am-filterbar" className="am-filterbar no-print-am flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block text-xs font-semibold text-slate-500">Sınav</label>
          <ExamCombobox
            triggerId="am-exam-select"
            value={examId}
            onValueChange={setExamId}
            exams={data.examList}
            disabled={!data.examList.length}
            placeholder={
              data.examList.length ? "Sınav seçin veya arayın…" : "Kayıtlı sınav yok"
            }
          />
        </div>
        <div className="w-36">
          <label className="mb-1 block text-xs font-semibold text-slate-500">Sınıf</label>
          <Select value={classFilter} onValueChange={setClassFilter} disabled={!examId}>
            <SelectTrigger id="am-class-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {classOptions.map((c) => (
                <SelectItem key={c} value={c}>
                  {c === "all" ? "Tümü" : c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="relative min-w-[200px] flex-1">
          <label className="mb-1 block text-xs font-semibold text-slate-500">
            Öğrenci (Tab 5)
          </label>
          <input type="hidden" id="am-student-global" value={crossStudentId} readOnly />
          <button
            type="button"
            id="am-student-trigger"
            className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 text-sm"
            onClick={() => setComboOpen((o) => !o)}
          >
            {allStudentsForCombo.find((s) => s.id === crossStudentId)?.name || "Öğrenci seçin"}
          </button>
          {comboOpen && (
            <div
              id="am-student-popover"
              className="absolute left-0 right-0 top-full z-30 mt-1 rounded-lg border border-slate-200 bg-white p-2 shadow-lg"
            >
              <Input
                id="am-student-search"
                placeholder="Ara…"
                value={globalStudentSearch}
                onChange={(e) => setGlobalStudentSearch(e.target.value)}
                className="mb-2 h-8 text-sm"
              />
              <ul id="am-student-list" className="max-h-48 overflow-y-auto text-sm">
                {comboStudents.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      className="w-full rounded px-2 py-1.5 text-left hover:bg-slate-100"
                      onClick={() => {
                        setStudentId(s.id);
                        setTab2StudentId(s.id);
                        setComboOpen(false);
                      }}
                    >
                      {s.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            id="am-btn-pdf"
            variant="outline"
            size="sm"
            disabled={!examId || !currentExam}
            onClick={openAnalizPdfReport}
          >
            <Printer className="mr-1 h-4 w-4" />
            Yazdır / PDF
          </Button>
          <Button
            id="am-btn-sms"
            variant="outline"
            size="sm"
            onClick={() =>
              toast.message(
                `${filteredStudents.length} öğrenciye SMS gönderimi hazırlanıyor…`
              )
            }
          >
            <MessageSquare className="mr-1 h-4 w-4" />
            SMS
          </Button>
        </div>
      </div>

      {!examId && (
        <div
          id="am-empty"
          className="am-card flex min-h-[280px] flex-col items-center justify-center p-10 text-center"
        >
          <p className="text-lg font-semibold text-slate-800">Analiz edilecek bir sınav seçin</p>
          <p className="mt-2 text-sm text-slate-500">
            Üst çubuktan kurumsal veya global bir sınav seçtiğinizde pano açılır.
          </p>
        </div>
      )}

      {examId && currentExam && (
        <div id="am-board" className="flex flex-col gap-4">
          <MatrixStatusBanner quality={dataQuality} />
          <div className="am-tabs no-print-am" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={activeTab === t.id}
                className="am-tab-btn flex items-center gap-2"
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
                {"badge" in t && t.badge && (
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                      "badgeClass" in t && t.badgeClass
                        ? t.badgeClass
                        : "bg-slate-100 text-slate-600"
                    )}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {activeTab === "1" && (
            <section data-am-tab="1" data-am-tab-panel="1" role="tabpanel">
              <div id="am-insight-1" className="am-insight-banner am-insight-banner--indigo mb-4">
                <BarChart3 className="mr-2 inline h-4 w-4 text-slate-600" />
                <span id="am-insight-1-text">{currentExam.insight}</span>
              </div>
              {!tab1Ready ? (
                <div id="am-tab-1-skel" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="am-skel" />
                  ))}
                </div>
              ) : (
                <div
                  id="am-tab-1-content"
                  className={cn("am-fade space-y-5", tab1Ready && "is-in")}
                >
                  <AmKpiStrip exam={currentExam} attendPct={attendPct} />
                  <div className="grid gap-4 lg:grid-cols-2">
                    <ChartCard
                      title="Şubeler arası karşılaştırma"
                      subtitle="Doğru · yanlış · boş dağılımı"
                    >
                      <ClassBarChart data={classBarData} />
                    </ChartCard>
                    <ChartCard
                      title="Net dağılımı"
                      subtitle="Öğrenci sayısı — 20'lik aralıklar"
                    >
                      <NetDistributionChart data={netDistData} />
                    </ChartCard>
                  </div>
                  <ChartCard
                    title="Ders başarıları"
                    subtitle={subjectGaugesSubtitle}
                    id="am-chart-gauges"
                  >
                    <AmSubjectGauges gauges={currentExam.subjectGauges} />
                  </ChartCard>
                </div>
              )}
            </section>
          )}

          {activeTab === "2" && (
            <section
              data-am-tab="2"
              data-am-tab-panel="2"
              role="tabpanel"
              className="grid gap-4 lg:grid-cols-[minmax(272px,320px)_1fr]"
            >
              <aside className="am-card p-3">
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="am-tab2-student-search"
                    className="pl-8"
                    placeholder="Öğrenci ara"
                    value={tab2Search}
                    onChange={(e) => setTab2Search(e.target.value)}
                  />
                </div>
                <p id="am-tab2-student-count" className="mb-2 text-xs text-slate-500">
                  {tab2Students.length} öğrenci
                </p>
                <ul
                  id="am-tab2-student-list"
                  role="listbox"
                  className="am-tab2-student-scroll space-y-1"
                >
                  {tab2Students.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={s.id === tab2StudentId}
                        className={cn(
                          "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-slate-100",
                          s.id === tab2StudentId && "am-tab2-student-item--active"
                        )}
                        onClick={() => setTab2StudentId(s.id)}
                      >
                        <span className="font-semibold">{s.name}</span>
                        <span className="mt-0.5 block text-xs opacity-80">
                          {s.net} net · {s.meta}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </aside>

              {selectedTab2 && (
                <div id="am-report-card" className="space-y-4">
                  <div className="am-student-hero flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">{selectedTab2.name}</h2>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="am-stat-pill">
                          <TrendingUp className="h-3.5 w-3.5 text-indigo-600" />
                          Net{" "}
                          <strong id="am-tab2-student-net">{selectedTab2.net}</strong>
                        </span>
                        <span className="am-stat-pill">
                          Sıra <strong id="am-tab2-student-rank">{selectedTab2.rank}</strong>
                        </span>
                        <span className="am-stat-pill">
                          Yüzdelik{" "}
                          <strong id="am-tab2-student-percentile">
                            {selectedTab2.percentile}
                          </strong>
                        </span>
                      </div>
                      {(topBottomSubjects.top || topBottomSubjects.bottom) && (
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                          {topBottomSubjects.top && (
                            <span className="am-strength-chip">
                              Güçlü: {topBottomSubjects.top}
                            </span>
                          )}
                          {topBottomSubjects.bottom && (
                            <span className="am-weak-chip">
                              Gelişim: {topBottomSubjects.bottom}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <Button
                      id="am-btn-parent-pdf"
                      variant="primary"
                      size="sm"
                      onClick={handleVeliPrint}
                    >
                      <Printer className="mr-1 h-4 w-4" />
                      Veli Raporu
                    </Button>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <ChartCard
                      title="Konu bazlı performans"
                      subtitle={
                        !subjectBarData.length
                          ? "Konu matrisi + cevap anahtarı + optik gerekli"
                          : drillSubject
                            ? `${drillSubject} · alt konular`
                            : "Çubuğa tıklayarak drill-down"
                      }
                      action={
                        drillSubject ? (
                          <button
                            type="button"
                            id="am-subjects-back"
                            className="am-breadcrumb"
                            onClick={() => setDrillSubject(null)}
                          >
                            ← Geri
                          </button>
                        ) : undefined
                      }
                    >
                      <SubjectVerticalBarChart
                        data={subjectBarData}
                        onBarClick={(name) => {
                          if (!drillSubject && studentSubjectBreakdown.drillDown[name]) {
                            setDrillSubject(name);
                          }
                        }}
                      />
                    </ChartCard>
                    <ChartCard
                      title="Yetkinlik radarı"
                      subtitle={
                        radarIsDyBFallback
                          ? "Özet (D/Y/B) — konu/ders matrisi yok"
                          : "Ders doğruluk % — öğrenci · sınıf · en iyi"
                      }
                    >
                      <CompetencyRadarChart data={radarData} versus={versus} />
                      <VersusPills value={versus} onChange={setVersus} />
                    </ChartCard>
                  </div>
                  <ChartCard
                    title="Gelişim trendi"
                    subtitle="Geçmiş sınavlar ve tahmin"
                    action={
                      <span
                        id="am-forecast-badge"
                        className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase text-violet-800"
                      >
                        Tahmin
                      </span>
                    }
                  >
                    <p id="am-forecast-text" className="mb-3 text-xs text-slate-600">
                      {trendData?.forecastText}
                    </p>
                    <TrendLineChart data={trendChartRows} />
                  </ChartCard>
                  <div className="am-card overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
                        <tr>
                          <th className="p-3">Konu</th>
                          <th className="p-3">Hakimiyet</th>
                          <th className="p-3">Sıra</th>
                        </tr>
                      </thead>
                      <tbody id="am-dd-body">
                        {(drillSubject
                          ? studentSubjectBreakdown.drillDown[drillSubject] || []
                          : studentSubjectBreakdown.gauges
                        ).map((g, i) => (
                          <tr key={g.name} className="border-t border-slate-100">
                            <td className="p-3">{g.name}</td>
                            <td className="p-3">%{g.rate}</td>
                            <td className="p-3">{i + 1}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          )}

          {activeTab === "3" && (
            <AmOtonomPanel
              priorityRows={priorityRows}
              filteredRows={filteredPriorityRows}
              exam={currentExam}
              students={filteredStudents}
              dataQuality={dataQuality}
              dersOptions={priorityDersOptions}
              dersFilter={priorityDersFilter}
              onDersFilterChange={setPriorityDersFilter}
              onOpenPdf={openAnalizPdfReport}
            />
          )}

          {activeTab === "4" && (
            <>
              {!crossStudentId ? (
                <div className="am-card p-8 text-center text-slate-600">
                  Hata karnesi için Tab 2&apos;den veya üst combobox&apos;tan öğrenci seçin.
                </div>
              ) : (
                <AmHataKarnesiPanel
                  studentId={crossStudentId}
                  studentName={
                    allStudentsForCombo.find((s) => s.id === crossStudentId)?.name || "—"
                  }
                  errorCells={errorCells}
                  dataQuality={dataQuality}
                  onOpenPdf={openAnalizPdfReport}
                />
              )}
            </>
          )}

          {activeTab === "5" && (
            <section data-am-tab="5" role="tabpanel">
              {!examId ? (
                <div className="am-card p-8 text-center text-slate-600">
                  Konu hakimiyeti için üstten bir deneme seçin (TYT veya AYT kapsamı deneme tipine
                  göre belirlenir).
                </div>
              ) : !crossStudentId ? (
                <div className="am-card p-8 text-center text-slate-600">
                  Cross-exam analiz için öğrenci seçin.
                </div>
              ) : (
                <AmMasteryPanel
                  studentId={crossStudentId}
                  studentName={
                    allStudentsForCombo.find((s) => s.id === crossStudentId)?.name || "—"
                  }
                  sinavScope={masterySinav}
                  examScopeName={findExamById(examId)?.ad}
                  crossSummary={crossSummary}
                  crossMastery={crossMastery}
                  topicTrends={topicTrends}
                  crossSubjectBarData={crossSubjectBarData}
                  emptyMessage={
                    masterySinav
                      ? `${sinavScopeLabel(masterySinav)} denemelerinde bu öğrenci için konu matrisi / sonuç bulunamadı.`
                      : dataQuality.message
                  }
                />
              )}
            </section>
          )}
        </div>
      )}

    </div>
  );
}

export function AnalizMerkeziPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-slate-500">Analiz Merkezi yükleniyor…</div>
      }
    >
      <AnalizMerkeziInner />
    </Suspense>
  );
}
