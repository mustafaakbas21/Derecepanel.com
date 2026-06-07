"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  TrEmptyState,
  TrField,
  TrKpiCard,
  TrKpiGrid,
  TrPanel,
  TrShell,
  trInputClass,
} from "@/components/taramalar/tr-ui";
import { Button } from "@/components/ui/button";
import { TARAMALAR_ROUTES } from "@/lib/coach/taramalar-nav-config";
import { TEST_MAKER_ROUTES } from "@/lib/test-maker/constants";
import { TARAMA_ANALIZ_CHANGE, TARAMA_LS } from "@/lib/taramalar/constants";
import { hydrateTaramaExams } from "@/lib/taramalar/analiz-hydrate";
import type { TaramaAnalizStudent, TaramaExamShell } from "@/lib/taramalar/types";
import { loadStudentsFull } from "@/lib/students/storage";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Printer } from "lucide-react";

type TabId = "overview" | "veli" | "konu" | "drill";

export function TaramaAnalizPage() {
  const searchParams = useSearchParams();
  const initialExamId = searchParams.get("examId") ?? "";

  const [exams, setExams] = useState<Record<string, TaramaExamShell>>({});
  const [examId, setExamId] = useState(initialExamId);
  const [classFilter, setClassFilter] = useState("");
  const [studentId, setStudentId] = useState("");
  const [tab, setTab] = useState<TabId>("overview");

  const refresh = useCallback(() => {
    setExams(hydrateTaramaExams());
  }, []);

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener(TARAMA_ANALIZ_CHANGE, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(TARAMA_ANALIZ_CHANGE, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [refresh]);

  useEffect(() => {
    if (initialExamId) setExamId(initialExamId);
  }, [initialExamId]);

  const examIds = useMemo(() => Object.keys(exams).sort(), [exams]);
  const exam = examId ? exams[examId] : null;

  const studentsCatalog = useMemo(
    () => loadStudentsFull({ seedIfEmpty: true }).filter((s) => s.status === "aktif"),
    []
  );

  const classOptions = useMemo(() => {
    const set = new Set<string>();
    (exam?.students ?? []).forEach((s) => {
      const c = String(s.meta || "Genel").split("·")[0].trim();
      if (c) set.add(c);
    });
    return [...set].sort();
  }, [exam]);

  const filteredStudents = useMemo(() => {
    let list = exam?.students ?? [];
    if (classFilter) {
      list = list.filter(
        (s) => (String(s.meta || "Genel").split("·")[0].trim() || "Genel") === classFilter
      );
    }
    return list;
  }, [exam, classFilter]);

  const selectedStudent: TaramaAnalizStudent | null = useMemo(() => {
    if (!studentId) return filteredStudents[0] ?? null;
    return filteredStudents.find((s) => s.id === studentId) ?? filteredStudents[0] ?? null;
  }, [filteredStudents, studentId]);

  const classChartData = useMemo(() => {
    if (!exam?.classes?.labels?.length) return [];
    return exam.classes.labels.map((label, i) => ({
      sinif: label,
      dogru: exam.classes.correct[i] ?? 0,
      yanlis: exam.classes.wrong[i] ?? 0,
      bos: exam.classes.empty[i] ?? 0,
    }));
  }, [exam]);

  const radarData = useMemo(() => {
    const radar = selectedStudent?.radar;
    if (!radar?.labels?.length) return [];
    return radar.labels.map((label, i) => ({
      konu: label,
      ogrenci: radar.student[i] ?? 0,
      sinifOrt: radar.classAvg[i] ?? 0,
    }));
  }, [selectedStudent]);

  const topicData = useMemo(() => {
    const topics = selectedStudent?.topics;
    if (!topics?.labels?.length) return [];
    return topics.labels.map((label, i) => ({
      konu: label,
      oran: topics.values[i] ?? 0,
    }));
  }, [selectedStudent]);

  const kpi = exam?.kpi;
  const attendancePct = kpi?.attendance?.total
    ? Math.round((1000 * (kpi.attendance.done ?? 0)) / kpi.attendance.total) / 10
    : 0;
  const accuracyGauge = exam?.subjectGauges?.find((g) => g.name.includes("Doğruluk"));
  const fillGauge = exam?.subjectGauges?.find((g) => g.name.includes("doluluk"));

  const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: "Genel Bakış" },
    { id: "veli", label: "Veli Raporu" },
    { id: "konu", label: "Konu / öncelik" },
    { id: "drill", label: "Drill-down" },
  ];

  return (
    <TrShell
      title="Tarama Analiz ve Raporlama"
      description="Test Maker → Tarama Deposu köprüsü ve öğrenci sonuçları. Deneme merkezi verisi kullanılmaz."
      action={
        <Button type="button" variant="outline" className="tr-no-print" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Yazdır
        </Button>
      }
    >
      <TrPanel className="tr-no-print">
        <div className="tr-filter-bar">
          <TrField label="Sınav">
            <select
              className={trInputClass}
              value={examId}
              onChange={(e) => {
                setExamId(e.target.value);
                setStudentId("");
                setClassFilter("");
              }}
            >
              <option value="">Seçin…</option>
              <optgroup label="Test Maker — Tarama arşivi">
                {examIds.map((id) => (
                  <option key={id} value={id}>
                    {exams[id]?.name ?? id}
                  </option>
                ))}
              </optgroup>
            </select>
          </TrField>
          <TrField label="Sınıf">
            <select
              className={trInputClass}
              value={classFilter}
              disabled={!exam}
              onChange={(e) => {
                setClassFilter(e.target.value);
                setStudentId("");
              }}
            >
              <option value="">Tümü</option>
              {classOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </TrField>
          <TrField label="Öğrenci">
            <select
              className={trInputClass}
              value={selectedStudent?.id ?? ""}
              disabled={!exam}
              onChange={(e) => setStudentId(e.target.value)}
            >
              {filteredStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </TrField>
        </div>
      </TrPanel>

      {!examIds.length ? (
        <TrEmptyState
          title="Kayıtlı tarama yok"
          description="Test Oluşturucu ile Tarama Deposu'na kaydedin; analiz listesi otomatik güncellenir."
          action={
            <Button variant="primary" asChild>
              <Link href={TEST_MAKER_ROUTES.olusturucu}>Test Oluşturucu</Link>
            </Button>
          }
        />
      ) : !exam ? (
        <TrEmptyState title="Sınav seçin" description="Üst filtreden bir tarama seçerek raporu görüntüleyin." />
      ) : (
        <div className="tr-print-root space-y-4">
          <TrKpiGrid>
            <TrKpiCard label="Ort. net" value={kpi?.avgNet ?? 0} />
            <TrKpiCard
              label="Katılım"
              value={`${kpi?.attendance?.done ?? 0} / ${kpi?.attendance?.total ?? 0}`}
              hint={`%${attendancePct}`}
            />
            <TrKpiCard label="Doğruluk %" value={accuracyGauge ? `%${accuracyGauge.rate}` : "—"} />
            <TrKpiCard label="Cevap doluluk" value={fillGauge ? `%${fillGauge.rate}` : "—"} />
          </TrKpiGrid>

          <div className="tr-analiz-tabs tr-no-print">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`tr-analiz-tab ${tab === t.id ? "tr-analiz-tab--active" : ""}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "overview" ? (
            <TrPanel>
              <h3 className="mb-3 text-sm font-bold text-slate-900">{exam.name}</h3>
              <p className="mb-4 text-xs text-slate-500">
                {exam.soruSayisi} soru · {exam.students.length} sonuç satırı
              </p>
              {classChartData.length ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={classChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="sinif" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="dogru" name="Doğru" fill="#10b981" />
                      <Bar dataKey="yanlis" name="Yanlış" fill="#ef4444" />
                      <Bar dataKey="bos" name="Boş" fill="#94a3b8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Henüz sonuç yok — {TARAMA_LS.examResults} anahtarına kayıt eklendiğinde grafikler dolacak.
                </p>
              )}
            </TrPanel>
          ) : null}

          {tab === "veli" ? (
            <TrPanel>
              <h3 className="text-base font-bold text-slate-900">Veli Raporu</h3>
              <p className="mt-1 text-sm text-slate-600">
                {selectedStudent?.name ?? "Öğrenci"} · {exam.name}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">Net</p>
                  <p className="text-2xl font-bold text-slate-900">{selectedStudent?.net ?? 0}</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">Doğru / Yanlış / Boş</p>
                  <p className="text-lg font-bold text-slate-900">
                    {selectedStudent?.correct ?? 0} / {selectedStudent?.wrong ?? 0} /{" "}
                    {selectedStudent?.blank ?? 0}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">Sıra</p>
                  <p className="text-lg font-bold text-slate-900">{selectedStudent?.rank ?? "—"}</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">Yüzdelik</p>
                  <p className="text-lg font-bold text-slate-900">{selectedStudent?.percentile ?? "—"}</p>
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-500">
                Kayıtlı öğrenci kataloğu: {studentsCatalog.length} aktif öğrenci
              </p>
            </TrPanel>
          ) : null}

          {tab === "konu" ? (
            <TrPanel>
              <h3 className="mb-3 text-sm font-bold text-slate-900">Konu dağılımı</h3>
              {topicData.length ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topicData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="konu" width={120} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="oran" name="Başarı %" fill="#0f172a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Konu verisi yok (sonuç satırında topics beklenir).</p>
              )}
            </TrPanel>
          ) : null}

          {tab === "drill" ? (
            <TrPanel>
              <h3 className="mb-3 text-sm font-bold text-slate-900">Öğrenci vs sınıf ortalaması</h3>
              {radarData.length ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="konu" tick={{ fontSize: 10 }} />
                      <Radar name="Öğrenci" dataKey="ogrenci" stroke="#0f172a" fill="#0f172a" fillOpacity={0.35} />
                      <Radar name="Sınıf ort." dataKey="sinifOrt" stroke="#64748b" fill="#64748b" fillOpacity={0.2} />
                      <Legend />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Radar verisi yok — sonuç kaydında radar alanı beklenir.
                </p>
              )}
              {selectedStudent?.errors?.length ? (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                  {selectedStudent.errors.length} hata kaydı mevcut
                </div>
              ) : null}
            </TrPanel>
          ) : null}

          <p className="tr-no-print text-center text-xs text-slate-400">
            Depo →{" "}
            <Link href={TARAMALAR_ROUTES.deposu} className="underline">
              Tarama Deposu
            </Link>
          </p>
        </div>
      )}
    </TrShell>
  );
}
