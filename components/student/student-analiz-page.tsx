"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Brain,
  ClipboardList,
  Loader2,
  Printer,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import { CompetencyRadarChart } from "@/components/analiz-merkezi/charts/competency-radar-chart";
import { ChartCard } from "@/components/analiz-merkezi/charts/chart-shell";
import { SubjectVerticalBarChart } from "@/components/analiz-merkezi/charts/subject-vertical-bar-chart";
import { TrendLineChart } from "@/components/analiz-merkezi/charts/trend-line-chart";
import { MatrixStatusBanner } from "@/components/analiz-merkezi/matrix-status-banner";
import { VersusPills } from "@/components/analiz-merkezi/versus-pills";
import { AmHataKarnesiPanel } from "@/components/analiz-merkezi/v3/am-hata-karnesi-panel";
import { AmMasteryPanel } from "@/components/analiz-merkezi/v3/am-mastery-panel";
import { AmOtonomPanel } from "@/components/analiz-merkezi/v3/am-otonom-panel";
import { ExamCombobox } from "@/components/exams/upload/exam-combobox";
import { SonucReportModal } from "@/components/exams/sonuc-merkezi/sonuc-report-modal";
import {
  LIBRARY_PAGE_CLASS,
  LIBRARY_PANEL_CLASS,
  LIBRARY_PANEL_INNER,
  LibraryEmptyState,
  LibraryInsights,
  LibraryPageHeader,
} from "@/components/library/library-shell";
import { Button } from "@/components/ui/button";
import { buildStudentAnalizReportFragment } from "@/lib/analiz/build-analiz-report-html";
import { buildTrendChartData, getExamResults } from "@/lib/analiz/analiz-merkezi-ls";
import { buildPriorityList, computeClassQuestionRates } from "@/lib/analiz/class-question-rates";
import {
  aggregateCrossBySubject,
  summarizeCrossMastery,
} from "@/lib/analiz/cross-summary";
import {
  DYB_RADAR_AXIS_NAMES,
  isDyBSummaryGaugeName,
} from "@/lib/analiz/chart-fallbacks";
import { getStudentExamQuestionCells } from "@/lib/analiz/error-karne";
import { getAnswerKeyForExamId } from "@/lib/analiz/hydrate";
import { getAnalizDataQuality } from "@/lib/analiz/matrix-quality";
import {
  buildCompetencyRadarSeries,
  buildStudentSubjectBreakdown,
} from "@/lib/analiz/student-subject-breakdown";
import { getSinavForExamId, sinavScopeLabel } from "@/lib/analiz/mastery-scope";
import {
  analyzeMasteryTrends,
  sinavToExamType,
} from "@/lib/analiz/mastery-trend-engine";
import { calculateSubjectMastery } from "@/lib/analiz/subject-mastery";
import { findExamById } from "@/lib/exams/exam-storage";
import { useLiveKonuTakipTracking } from "@/hooks/use-live-konu-takip-tracking";
import { useStudentAnaliz } from "@/hooks/use-student-analiz";
import { toast } from "@/lib/notify";
import { resolveStudentDisplayName } from "@/lib/student/student-analiz-scope";
import { STUDENT_DENEME_ROUTES } from "@/lib/student/sidebar-nav-config";
import { cn } from "@/lib/utils";

import "@/styles/print-a4-global.css";
import "@/styles/sonuc-merkezi-print.css";
import "@/styles/analiz-merkezi-print.css";
import "@/components/exams/sonuc-merkezi/sonuc-merkezi-modals.css";
import "@/components/analiz-merkezi/analiz-merkezi.css";

const TABS = [
  { id: "performans", label: "Performansım", icon: TrendingUp },
  { id: "oncelik", label: "Öncelikli Konular", icon: Target },
  { id: "hata", label: "Hata Karnesi", icon: ClipboardList },
  { id: "hakimiyet", label: "Konu Hakimiyeti", icon: Brain },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function StudentAnalizPage() {
  const {
    data,
    examId,
    setExamId,
    studentExams,
    selectedStudent,
    resolvedStudentId,
    currentExam,
    examMeta,
    hydrated,
  } = useStudentAnaliz();

  const [activeTab, setActiveTab] = useState<TabId>("performans");
  const [versus, setVersus] = useState({ student: true, class: true, top: false });
  const [drillSubject, setDrillSubject] = useState<string | null>(null);
  const [priorityDersFilter, setPriorityDersFilter] = useState("all");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState("Analiz raporu");
  const [reportHtml, setReportHtml] = useState("");

  const studentName = useMemo(() => resolveStudentDisplayName(data), [data]);

  useLiveKonuTakipTracking(resolvedStudentId);

  useEffect(() => {
    setDrillSubject(null);
    setVersus({ student: true, class: true, top: false });
  }, [examId, resolvedStudentId]);

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

  const answerKeyStr = useMemo(
    () => (examId ? getAnswerKeyForExamId(examId) : ""),
    [examId, data]
  );

  const studentSubjectBreakdown = useMemo(() => {
    if (!examId || !selectedStudent) {
      return { gauges: [], drillDown: {} as Record<string, { name: string; rate: number }[]> };
    }
    return buildStudentSubjectBreakdown(examId, selectedStudent.id, answerKeyStr);
  }, [examId, selectedStudent, answerKeyStr, data]);

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
    if (!examId || !currentExam || !selectedStudent) return [];
    return buildCompetencyRadarSeries(
      examId,
      selectedStudent,
      currentExam.students,
      answerKeyStr
    );
  }, [examId, currentExam, selectedStudent, answerKeyStr, data]);

  const radarIsDyBFallback = useMemo(
    () =>
      radarData.length > 0 &&
      DYB_RADAR_AXIS_NAMES.includes(
        radarData[0]!.subject as (typeof DYB_RADAR_AXIS_NAMES)[number]
      ),
    [radarData]
  );

  const trendData = useMemo(() => {
    if (!selectedStudent) return null;
    return buildTrendChartData(selectedStudent.id, examMeta);
  }, [selectedStudent, examMeta]);

  const trendChartRows = useMemo(() => {
    if (!trendData) return [];
    return trendData.categories.map((cat, i) => ({
      name: cat,
      actual: trendData.actualSeries[i],
      forecast: trendData.forecastSeries[i],
    }));
  }, [trendData]);

  const topBottomSubjects = useMemo(() => {
    const g = studentSubjectBreakdown.gauges;
    if (!g.length) return { top: null as string | null, bottom: null as string | null };
    const sorted = [...g].sort((a, b) => b.rate - a.rate);
    return { top: sorted[0]?.name ?? null, bottom: sorted[sorted.length - 1]?.name ?? null };
  }, [studentSubjectBreakdown]);

  const masterySinav = useMemo(() => {
    if (!examId) return null;
    return getSinavForExamId(examId);
  }, [examId, data]);

  const crossMastery = useMemo(() => {
    if (!resolvedStudentId || !masterySinav) return [];
    return calculateSubjectMastery(resolvedStudentId, { sinav: masterySinav });
  }, [resolvedStudentId, masterySinav, data]);

  const topicTrends = useMemo(() => {
    const examType = sinavToExamType(masterySinav);
    if (!resolvedStudentId || !examId || !examType) return [];
    const ex = findExamById(examId);
    const currentExamDate = ex?.tarih || examMeta[examId]?.date || "";
    return analyzeMasteryTrends({
      studentId: resolvedStudentId,
      currentExamId: examId,
      currentExamType: examType,
      currentExamDate,
    });
  }, [resolvedStudentId, examId, masterySinav, examMeta, data]);

  const crossSummary = useMemo(() => {
    if (!resolvedStudentId) {
      return { examCount: 0, correct: 0, wrong: 0, empty: 0, avgRate: 0 };
    }
    return summarizeCrossMastery(resolvedStudentId, crossMastery, { sinav: masterySinav });
  }, [resolvedStudentId, crossMastery, masterySinav]);

  const crossSubjectBarData = useMemo(
    () => aggregateCrossBySubject(crossMastery),
    [crossMastery]
  );

  const errorCells = useMemo(() => {
    if (!examId || !resolvedStudentId) return [];
    return getStudentExamQuestionCells(examId, resolvedStudentId, classRatesMap);
  }, [examId, resolvedStudentId, classRatesMap]);

  const studentPriorityRows = useMemo(() => {
    const wrongQs = new Set(
      errorCells
        .filter((c) => c.result === "wrong" || c.result === "empty")
        .map((c) => c.qNo)
    );
    if (!wrongQs.size) return priorityRows;
    const mine = priorityRows.filter((r) => wrongQs.has(r.qNo));
    return mine.length ? mine : priorityRows;
  }, [priorityRows, errorCells]);

  const priorityDersOptions = useMemo(() => {
    const set = new Set(studentPriorityRows.map((r) => r.subjectName));
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b, "tr"))];
  }, [studentPriorityRows]);

  const filteredPriorityRows = useMemo(() => {
    if (priorityDersFilter === "all") return studentPriorityRows;
    return studentPriorityRows.filter((r) => r.subjectName === priorityDersFilter);
  }, [studentPriorityRows, priorityDersFilter]);

  const dataQuality = useMemo(() => {
    if (!examId || !currentExam) return getAnalizDataQuality(examId || "", 0);
    return getAnalizDataQuality(examId, currentExam.students.length);
  }, [examId, currentExam]);

  const openAnalizPdfReport = () => {
    if (!examId || !currentExam || !selectedStudent) {
      toast.message("Rapor için sınav ve sonuç gerekli.");
      return;
    }
    const topicRows = studentSubjectBreakdown.gauges.map((g) => ({
      name: g.name,
      rate: g.rate,
    }));
    const html = buildStudentAnalizReportFragment({
      exam: currentExam,
      student: selectedStudent,
      studentTopicRows: topicRows,
      priorityRows: studentPriorityRows,
      crossMastery,
      crossSummary,
      errorCells: errorCells.filter((c) => c.result !== "correct"),
    });
    if (!html.trim()) {
      toast.message("Rapor içeriği oluşturulamadı.");
      return;
    }
    setReportHtml(html);
    setReportTitle(`Analiz raporum · ${currentExam.name}`);
    setReportOpen(true);
  };

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const hasExams = studentExams.length > 0;

  return (
    <div id="am-scope" className={cn(LIBRARY_PAGE_CLASS, "pb-10")}>
      <SonucReportModal
        open={reportOpen}
        title={reportTitle}
        html={reportHtml}
        onClose={() => setReportOpen(false)}
      />

      <LibraryPageHeader
        title="Analiz Merkezim"
        description="Deneme sonuçlarınıza özel konu, ders ve net analizleri. Koç panelindeki analiz motoru ile aynı veri kaynağını kullanır."
        meta={
          hasExams
            ? `${studentName} · ${studentExams.length} analizlenebilir deneme`
            : "Henüz analizlenebilir deneme yok"
        }
        action={
          hasExams ? (
            <Button variant="primary" size="sm" onClick={openAnalizPdfReport}>
              <Printer className="mr-2 h-4 w-4" />
              Rapor / PDF
            </Button>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link href={STUDENT_DENEME_ROUTES.sonuclar}>Sonuçlarım</Link>
            </Button>
          )
        }
      />

      {hasExams ? (
        <LibraryInsights
          metrics={[
            {
              label: "Analizlenen deneme",
              value: studentExams.length,
              sub: crossSummary.examCount
                ? `${crossSummary.examCount} sınav cross-analiz`
                : "Sonuç kayıtlı",
              icon: BarChart3,
            },
            {
              label: "Son net",
              value: selectedStudent?.net ?? "—",
              sub: selectedStudent ? `Sıra ${selectedStudent.rank}` : "Sınav seçin",
              icon: TrendingUp,
            },
            {
              label: "Konu hakimiyeti",
              value: crossSummary.avgRate ? `%${crossSummary.avgRate}` : "—",
              sub: `${crossSummary.correct}D · ${crossSummary.wrong}Y · ${crossSummary.empty}B`,
              icon: Brain,
            },
            {
              label: "Öncelik konu",
              value: filteredPriorityRows.length,
              sub: errorCells.filter((c) => c.result !== "correct").length
                ? `${errorCells.filter((c) => c.result !== "correct").length} hatalı soru`
                : "Hata karnesi",
              icon: Target,
            },
          ]}
        />
      ) : null}

      {!hasExams ? (
        <LibraryEmptyState
          title="Analiz için deneme sonucu yok"
          description="Koçunuz sonuç yüklediğinde veya deneme sonucunuz sisteme işlendiğinde analiz panonuz burada açılır."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" asChild>
                <Link href={STUDENT_DENEME_ROUTES.kurumsal}>Deneme takvimi</Link>
              </Button>
              <Button variant="primary" asChild>
                <Link href={STUDENT_DENEME_ROUTES.sonuclar}>Sonuçlarım</Link>
              </Button>
            </div>
          }
        />
      ) : (
        <>
          <div
            className={cn(LIBRARY_PANEL_CLASS, "no-print-am overflow-visible p-4 sm:p-5")}
            style={{ boxShadow: "var(--card-shadow-sm)" }}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-[220px] flex-1">
                <label className="mb-1 block text-xs font-semibold text-slate-500">
                  Deneme seçin
                </label>
                <ExamCombobox
                  triggerId="student-am-exam-select"
                  value={examId}
                  onValueChange={setExamId}
                  exams={studentExams}
                  placeholder="Deneme seçin veya arayın…"
                />
              </div>
              {examId && currentExam && selectedStudent ? (
                <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                    {currentExam.name}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-900 px-3 py-1 text-white">
                    {selectedStudent.net} net
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                    Kurum ort. {currentExam.kpi.avgNet}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {examId && currentExam && selectedStudent ? (
            <div className="flex flex-col gap-4">
              <section
                className="overflow-hidden rounded-2xl bg-slate-900 text-white"
                style={{ boxShadow: "var(--card-shadow)" }}
              >
                <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div>
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <Sparkles className="h-4 w-4 text-orange-400" />
                      {studentName}
                    </p>
                    <p className="mt-2 text-3xl font-bold tabular-nums">{selectedStudent.net} net</p>
                    <p className="mt-2 text-sm text-slate-300">
                      Sıra {selectedStudent.rank} · Yüzdelik {selectedStudent.percentile} ·{" "}
                      {selectedStudent.correct}D / {selectedStudent.wrong}Y / {selectedStudent.blank}B
                    </p>
                    {(topBottomSubjects.top || topBottomSubjects.bottom) && (
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        {topBottomSubjects.top ? (
                          <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-emerald-100">
                            Güçlü: {topBottomSubjects.top}
                          </span>
                        ) : null}
                        {topBottomSubjects.bottom ? (
                          <span className="rounded-full bg-orange-500/20 px-2.5 py-1 text-orange-100">
                            Gelişim: {topBottomSubjects.bottom}
                          </span>
                        ) : null}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                    onClick={openAnalizPdfReport}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Rapor al
                  </Button>
                </div>
              </section>

              <MatrixStatusBanner quality={dataQuality} />

              <div className="flex flex-wrap gap-2">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition",
                        activeTab === tab.id
                          ? "bg-slate-900 text-white shadow-sm"
                          : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {activeTab === "performans" && (
                <div className="space-y-4">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <ChartCard
                      title="Konu bazlı performansım"
                      subtitle={
                        !subjectBarData.length
                          ? "Konu matrisi + cevap anahtarı gerekli"
                          : drillSubject
                            ? `${drillSubject} · alt konular`
                            : "Çubuğa tıklayarak alt konulara inin"
                      }
                      action={
                        drillSubject ? (
                          <button
                            type="button"
                            className="am-breadcrumb text-sm font-semibold text-slate-600"
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
                          ? "Özet (D/Y/B) — konu matrisi yok"
                          : "Ders doğruluk % — ben · sınıf · en iyi"
                      }
                    >
                      <CompetencyRadarChart data={radarData} versus={versus} />
                      <VersusPills value={versus} onChange={setVersus} />
                    </ChartCard>
                  </div>
                  <ChartCard title="Net gelişim trendi" subtitle="Geçmiş denemelerim ve tahmin">
                    <p className="mb-3 text-xs text-slate-600">{trendData?.forecastText}</p>
                    <TrendLineChart data={trendChartRows} />
                  </ChartCard>
                  <div className={cn(LIBRARY_PANEL_CLASS, "overflow-hidden")}>
                    <div className={LIBRARY_PANEL_INNER}>
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
                          <tr>
                            <th className="p-3">Konu</th>
                            <th className="p-3">Hakimiyet</th>
                            <th className="p-3">Sıra</th>
                          </tr>
                        </thead>
                        <tbody>
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
                </div>
              )}

              {activeTab === "oncelik" && (
                <AmOtonomPanel
                  priorityRows={studentPriorityRows}
                  filteredRows={filteredPriorityRows}
                  exam={currentExam}
                  students={currentExam.students}
                  dataQuality={dataQuality}
                  dersOptions={priorityDersOptions}
                  dersFilter={priorityDersFilter}
                  onDersFilterChange={setPriorityDersFilter}
                  onOpenPdf={openAnalizPdfReport}
                />
              )}

              {activeTab === "hata" && (
                <AmHataKarnesiPanel
                  studentId={resolvedStudentId}
                  studentName={studentName}
                  errorCells={errorCells}
                  dataQuality={dataQuality}
                  onOpenPdf={openAnalizPdfReport}
                />
              )}

              {activeTab === "hakimiyet" && (
                <AmMasteryPanel
                  studentId={resolvedStudentId}
                  studentName={studentName}
                  sinavScope={masterySinav}
                  examScopeName={examId ? findExamById(examId)?.ad : undefined}
                  crossSummary={crossSummary}
                  crossMastery={crossMastery}
                  topicTrends={topicTrends}
                  crossSubjectBarData={crossSubjectBarData}
                  emptyMessage={
                    masterySinav
                      ? `${sinavScopeLabel(masterySinav)} denemelerinde konu matrisi / sonuç bulunamadı.`
                      : dataQuality.message
                  }
                />
              )}
            </div>
          ) : (
            <LibraryEmptyState
              title="Deneme seçin"
              description="Üstten analiz etmek istediğiniz denemeyi seçin."
            />
          )}
        </>
      )}
    </div>
  );
}
