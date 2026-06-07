"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Camera,
  Loader2,
  Sparkles,
  Target,
} from "lucide-react";

import {
  fetchOnyxCoachSolves,
  fetchOnyxInsights,
  OnyxClientError,
  type OnyxCoachSolvesResponse,
  type OnyxInsightsResponse,
} from "@/lib/onyx-client";
import { cn } from "@/lib/utils";

const ICON_SIZE = 18;

type Props = {
  studentId: string | null;
  studentName?: string;
  className?: string;
};

export function OnyxCoachSolvePanel({
  studentId,
  studentName,
  className,
}: Props) {
  const [insights, setInsights] = useState<OnyxInsightsResponse | null>(null);
  const [solves, setSolves] = useState<OnyxCoachSolvesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!studentId) {
      setInsights(null);
      setSolves(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [insightData, solveData] = await Promise.all([
        fetchOnyxInsights(studentId, 7),
        fetchOnyxCoachSolves(studentId, studentName),
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
  }, [studentId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <aside
      className={cn(
        "h-full w-80 flex-shrink-0 overflow-y-auto border-l border-slate-200 bg-slate-50 p-4",
        className
      )}
      aria-label="Onyx destekli soru analizi"
    >
      <div className="mb-4 border-b border-slate-200 pb-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Sparkles size={ICON_SIZE} className="text-amber-500" aria-hidden />
          Onyx Destekli Soru Analizi
        </h3>
        {studentName ? (
          <p className="mt-1 truncate text-xs text-slate-500">{studentName}</p>
        ) : (
          <p className="mt-1 text-xs text-slate-400">Öğrenci seçilmedi</p>
        )}
      </div>

      <div>
        {!studentId ? (
          <p className="text-center text-xs text-slate-400">
            Sol panelden öğrenci seçildiğinde canlı analiz burada görünür.
          </p>
        ) : loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-xs text-slate-500">
            <Loader2 size={ICON_SIZE} className="animate-spin" />
            Veriler yükleniyor…
          </div>
        ) : error ? (
          <p className="text-xs text-rose-600">{error}</p>
        ) : (
          <div className="space-y-6">
            {solves?.deepErrorAlerts && solves.deepErrorAlerts.length > 0 ? (
              <section>
                <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold text-amber-900">
                  <AlertTriangle size={ICON_SIZE} className="text-amber-500" />
                  Onyx derin analiz uyarıları
                </h4>
                <ul className="space-y-2">
                  {solves.deepErrorAlerts.map((a) => (
                    <li
                      key={a.eksikKavram}
                      className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950"
                    >
                      {a.message}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  <BarChart3 size={ICON_SIZE} aria-hidden />
                  Ort. zorluk
                </p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {insights?.avgDifficulty ?? "—"}
                  <span className="text-sm font-normal text-slate-400"> /5</span>
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  <Target size={ICON_SIZE} aria-hidden />
                  7 gün soru
                </p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {insights?.totalQuestions ?? 0}
                </p>
              </div>
            </section>

            <section>
              <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-700">
                <AlertTriangle size={ICON_SIZE} className="text-amber-500" />
                Zayıf konular
              </h4>
              {(insights?.topStrugglingTopics.length ?? 0) === 0 &&
              (solves?.weakTopics.length ?? 0) === 0 ? (
                <p className="text-xs text-slate-400">Henüz yeterli veri yok.</p>
              ) : (
                <ul className="space-y-2">
                  {(insights?.topStrugglingTopics.length
                    ? insights.topStrugglingTopics.map((t) => (
                        <li
                          key={t.topic}
                          className="rounded-lg border border-amber-100 bg-amber-50/70 px-3 py-2 text-xs"
                        >
                          <p className="font-medium text-slate-800">{t.topic}</p>
                          <p className="mt-0.5 text-[10px] text-amber-800">
                            {t.count} soru · ~{t.avgDifficulty.toFixed(1)} zorluk
                          </p>
                        </li>
                      ))
                    : solves!.weakTopics.slice(0, 3).map((t) => (
                        <li
                          key={`${t.konuBasligi}-${t.count}`}
                          className="rounded-lg border border-amber-100 bg-amber-50/70 px-3 py-2 text-xs"
                        >
                          <p className="font-medium text-slate-800">
                            {t.topicName ?? t.konuBasligi}
                          </p>
                          <p className="mt-0.5 text-[10px] text-amber-800">
                            {t.count} soru
                          </p>
                        </li>
                      )))}
                </ul>
              )}
            </section>

            <section>
              <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-700">
                <Camera size={ICON_SIZE} aria-hidden />
                Son çözülen sorular
              </h4>
              {(solves?.struggledQuestions?.length ?? 0) === 0 &&
              (solves?.solves.length ?? 0) === 0 ? (
                <p className="text-xs text-slate-400">Kayıt yok.</p>
              ) : (
                <ul className="space-y-2">
                  {(
                    solves?.struggledQuestions ??
                    solves?.solves.map((s) => ({
                      id: s.id,
                      topic: s.konuBasligi,
                      difficultyScore: s.zorlukSeviyesi,
                      timestamp: s.createdAt,
                      questionImage: null as string | null,
                    })) ??
                    []
                  )
                    .slice(0, 8)
                    .map((s) => (
                      <li
                        key={s.id}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm"
                      >
                        <p className="line-clamp-2 font-medium text-slate-800">
                          {s.topic}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-500">
                          {new Date(s.timestamp).toLocaleDateString("tr-TR")} ·
                          zorluk {s.difficultyScore}/5
                        </p>
                      </li>
                    ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </aside>
  );
}
