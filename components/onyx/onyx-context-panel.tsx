"use client";

import { panelGetItem, panelRemoveItem, panelSetItem } from "@/lib/panel-store";
import Link from "next/link";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { loadWrongPool } from "@/lib/hata-recetesi/storage";
import { studentDisplayName, studentSelectValue } from "@/lib/onyx/coach-students";
import {
  fetchOnyxCoachSolves,
  fetchOnyxInsights,
  OnyxClientError,
  type OnyxCoachSolvesResponse,
  type OnyxInsightsResponse,
} from "@/lib/onyx-client";
import {
  STUDENT_HATA_RECETESI_ROUTES,
  STUDENT_TARAMA_ROUTES,
} from "@/lib/student/sidebar-nav-config";
import type { StudentRecord } from "@/lib/students/types";
import { todayDayIndex } from "@/lib/weekly-planner/week-utils";
import { useStudentPersonalWeeklyProgram } from "@/lib/weekly-planner/use-student-personal-weekly-program";
import { useStudentWeeklyProgram } from "@/lib/weekly-planner/use-student-weekly-program";
import { cn } from "@/lib/utils";

const ICON = 18;

type CoachProps = {
  role: "coach";
  targetStudentId: string | null;
  students: StudentRecord[];
  studentsReady: boolean;
  onStudentChange: (id: string) => void;
};

type StudentProps = {
  role: "student";
  targetStudentId: string | null;
  currentUserName?: string;
};

type Props = (CoachProps | StudentProps) & {
  open?: boolean;
  onClose?: () => void;
  className?: string;
};

type CoachContextPanelProps = Omit<CoachProps, "role">;
type StudentContextPanelProps = Omit<StudentProps, "role" | "targetStudentId">;

function WeakTopicHeatmap({
  topics,
}: {
  topics: Array<{ label: string; count: number; intensity: number }>;
}) {
  if (topics.length === 0) {
    return <p className="text-xs text-slate-400">Henüz yeterli veri yok.</p>;
  }

  return (
    <ul className="space-y-2" aria-label="Zayıf konular ısı haritası">
      {topics.map((t) => (
        <li key={t.label}>
          <div className="mb-1 flex items-center justify-between gap-2 text-xs">
            <span className="truncate font-medium text-slate-800">{t.label}</span>
            <span className="shrink-0 text-slate-500">{t.count} soru</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                t.intensity >= 0.66
                  ? "bg-rose-500"
                  : t.intensity >= 0.33
                    ? "bg-amber-500"
                    : "bg-amber-300"
              )}
              style={{ width: `${Math.round(t.intensity * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function OnyxCoachContextPanel({
  targetStudentId,
  students,
  studentsReady,
  onStudentChange,
}: CoachContextPanelProps) {
  const [insights, setInsights] = useState<OnyxInsightsResponse | null>(null);
  const [solves, setSolves] = useState<OnyxCoachSolvesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!targetStudentId) {
      setInsights(null);
      setSolves(null);
      return;
    }
    const name =
      students.find((s) => studentSelectValue(s) === targetStudentId) ??
      null;
    const displayName = name ? studentDisplayName(name) : "Öğrenci";

    setLoading(true);
    setError(null);
    try {
      const [insightData, solveData] = await Promise.all([
        fetchOnyxInsights(targetStudentId, 7),
        fetchOnyxCoachSolves(targetStudentId, displayName),
      ]);
      setInsights(insightData);
      setSolves(solveData);
    } catch (err) {
      setInsights(null);
      setSolves(null);
      setError(
        err instanceof OnyxClientError
          ? err.message
          : "Analiz verisi yüklenemedi."
      );
    } finally {
      setLoading(false);
    }
  }, [targetStudentId, students]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- öğrenci analiz verisi
    void load();
  }, [load]);

  const heatmapTopics = useMemo(() => {
    const raw =
      insights?.topStrugglingTopics?.map((t) => ({
        label: t.topic,
        count: t.count,
        avgDifficulty: t.avgDifficulty,
      })) ??
      solves?.weakTopics?.map((t) => ({
        label: t.topicName ?? t.konuBasligi,
        count: t.count,
        avgDifficulty: t.avgZorluk,
      })) ??
      [];
    const max = Math.max(1, ...raw.map((t) => t.count));
    return raw.slice(0, 6).map((t) => ({
      label: t.label,
      count: t.count,
      intensity: t.count / max,
    }));
  }, [insights, solves]);

  const selectedStudent = students.find(
    (s) => studentSelectValue(s) === targetStudentId
  );

  return (
    <>
      <div className="mb-4">
        <label
          htmlFor="onyx-context-student"
          className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-500"
        >
          Öğrenci seçici
        </label>
        <Select
          value={targetStudentId || undefined}
          onValueChange={onStudentChange}
          disabled={!studentsReady || students.length === 0}
        >
          <SelectTrigger id="onyx-context-student" className="h-9 w-full text-xs">
            <SelectValue placeholder="Öğrenci seçin" />
          </SelectTrigger>
          <SelectContent>
            {students.map((s) => (
              <SelectItem key={studentSelectValue(s)} value={studentSelectValue(s)}>
                {studentDisplayName(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedStudent ? (
          <p className="mt-1 truncate text-[11px] text-slate-500">
            {studentDisplayName(selectedStudent)}
          </p>
        ) : null}
      </div>

      {!targetStudentId ? (
        <p className="text-center text-xs text-slate-400">
          Öğrenci seçildiğinde ortalama zorluk ve zayıf konu haritası burada görünür.
        </p>
      ) : loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-xs text-slate-500">
          <Loader2 size={ICON} className="animate-spin" />
          Veriler yükleniyor…
        </div>
      ) : error ? (
        <p className="text-xs text-rose-600">{error}</p>
      ) : (
        <div className="space-y-6">
          {solves?.deepErrorAlerts && solves.deepErrorAlerts.length > 0 ? (
            <section aria-label="Onyx derin analiz uyarıları">
              <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold text-amber-900">
                <AlertTriangle size={ICON} aria-hidden />
                Onyx Koç Uyarıları
              </h4>
              <ul className="space-y-2">
                {solves.deepErrorAlerts.map((alert) => (
                  <li
                    key={alert.eksikKavram}
                    className="rounded-lg border border-amber-200/90 bg-amber-50/90 px-3 py-2.5 text-xs leading-relaxed text-amber-950 shadow-sm"
                  >
                    {alert.message}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <BarChart3 size={ICON} aria-hidden />
              Ortalama zorluk
            </p>
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <p className="text-2xl font-bold text-slate-900">
                {insights?.avgDifficulty ?? "—"}
                <span className="text-sm font-normal text-slate-400"> /5</span>
              </p>
              <p className="mt-1 text-[10px] text-slate-500">
                Son 7 gün · {insights?.totalQuestions ?? 0} soru
              </p>
            </div>
          </section>

          <section>
            <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-700">
              <AlertTriangle size={ICON} className="text-amber-500" />
              Zayıf konular (ısı haritası)
            </h4>
            <WeakTopicHeatmap topics={heatmapTopics} />
          </section>
        </div>
      )}
    </>
  );
}

function OnyxStudentContextPanel({
  currentUserName,
}: StudentContextPanelProps) {
  const coachProgram = useStudentWeeklyProgram();
  const personalProgram = useStudentPersonalWeeklyProgram();
  const todayIdx = todayDayIndex();

  const program =
    coachProgram.program && personalProgram.program
      ? coachProgram.program
      : coachProgram.program ?? personalProgram.program;
  const completedIds = coachProgram.program
    ? coachProgram.completedIds
    : personalProgram.completedIds;

  const todayTasks = useMemo(() => {
    const tasks = program?.tasks ?? [];
    return tasks.filter((t) => t.dayIndex === todayIdx && t.taskKind !== "etut_mola");
  }, [program?.tasks, todayIdx]);

  const wrongQuestions = useMemo(() => {
    if (typeof window === "undefined") return [];
    const pool = loadWrongPool();
    const name = (currentUserName ?? "").trim().toLowerCase();
    if (!name) return pool.slice(0, 5);
    return pool
      .filter((q) => (q.ogrenciAdi ?? q.ogrenci ?? "").toLowerCase().includes(name))
      .slice(0, 5);
  }, [currentUserName]);

  const miniQuizCount = useMemo(() => {
    if (typeof window === "undefined") return 0;
    try {
      const raw = JSON.parse(
        panelGetItem("tarama_exam_results_v1") || "[]"
      );
      return Array.isArray(raw) ? raw.length : 0;
    } catch {
      return 0;
    }
  }, []);

  const doneToday = todayTasks.filter((t) => completedIds.has(t.id)).length;

  return (
    <div className="space-y-6">
      <section>
        <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-700">
          <ClipboardList size={ICON} aria-hidden />
          Bugünkü görevlerim
        </h4>
        {!coachProgram.hydrated && !personalProgram.hydrated ? (
          <p className="text-xs text-slate-400">Yükleniyor…</p>
        ) : todayTasks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-4 text-xs text-slate-500">
            Bugün için görev yok.
          </p>
        ) : (
          <>
            <p className="mb-2 text-[10px] text-slate-500">
              {doneToday}/{todayTasks.length} tamamlandı
            </p>
            <ul className="space-y-2">
              {todayTasks.slice(0, 6).map((task) => (
                <li
                  key={task.id}
                  className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm"
                >
                  {completedIds.has(task.id) ? (
                    <CheckCircle2
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600"
                      aria-hidden
                    />
                  ) : (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                  )}
                  <span
                    className={cn(
                      "font-medium text-slate-800",
                      completedIds.has(task.id) && "text-slate-500 line-through"
                    )}
                  >
                    {task.title || task.subjectName || "Görev"}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section>
        <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-700">
          <BookOpen size={ICON} aria-hidden />
          Çözülecek hatalı sorularım
        </h4>
        {wrongQuestions.length === 0 ? (
          <p className="text-xs text-slate-400">
            Havuzda kayıtlı hatalı soru yok.
          </p>
        ) : (
          <ul className="space-y-2">
            {wrongQuestions.map((q) => (
              <li
                key={q.id}
                className="rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2 text-xs"
              >
                <p className="font-medium text-slate-800">
                  {q.ders || "Ders"} · {q.konu || "Konu"}
                </p>
              </li>
            ))}
          </ul>
        )}
        <Link
          href={STUDENT_HATA_RECETESI_ROUTES.verilen}
          className="mt-2 inline-block text-[11px] font-medium text-slate-600 underline hover:text-slate-900"
        >
          Hata reçetesine git →
        </Link>
      </section>

      <section>
        <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Sparkles size={ICON} className="text-amber-500" aria-hidden />
          Mini quizlerim
        </h4>
        <p className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-xs text-slate-600 shadow-sm">
          {miniQuizCount > 0
            ? `${miniQuizCount} tarama kaydı bulundu.`
            : "Atanan tarama henüz yok."}
        </p>
        <Link
          href={STUDENT_TARAMA_ROUTES.taramalar}
          className="mt-2 inline-block text-[11px] font-medium text-slate-600 underline hover:text-slate-900"
        >
          Taramalara git →
        </Link>
      </section>
    </div>
  );
}

function OnyxContextPanelComponent(props: Props) {
  const { className, open = true, onClose } = props;

  return (
    <aside
      aria-label={props.role === "coach" ? "Koç bağlam paneli" : "Öğrenci bağlam paneli"}
      aria-hidden={!open}
      className={cn(
        "onyx-sidebar-drawer onyx-sidebar-drawer--right",
        open && "onyx-sidebar-drawer--open",
        className
      )}
    >
      <div className="flex h-full flex-col overflow-y-auto p-4">
      <div className="mb-4 flex items-start justify-between gap-2 border-b border-slate-200/80 pb-4">
        <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Sparkles size={ICON} className="text-amber-500" aria-hidden />
          {props.role === "coach" ? "Öğrenci analizi" : "Günün özeti"}
        </h3>
        <p className="mt-1 text-[11px] text-slate-500">
          {props.role === "coach"
            ? "Seçili öğrenci için canlı Onyx bağlamı"
            : "Görevler, hatalar ve mini quizler"}
        </p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="onyx-toolbar-btn shrink-0"
            aria-label="Paneli kapat"
          >
            <X size={18} aria-hidden />
          </button>
        ) : null}
      </div>

      {props.role === "coach" ? (
        <OnyxCoachContextPanel
          targetStudentId={props.targetStudentId}
          students={props.students}
          studentsReady={props.studentsReady}
          onStudentChange={props.onStudentChange}
        />
      ) : (
        <OnyxStudentContextPanel currentUserName={props.currentUserName} />
      )}
      </div>
    </aside>
  );
}

export const OnyxContextPanel = memo(OnyxContextPanelComponent);
