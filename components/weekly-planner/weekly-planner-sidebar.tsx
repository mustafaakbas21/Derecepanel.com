"use client";

import { useMemo } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  GripVertical,
  Minus,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import type { MufredatTrack } from "@/lib/mufredat";
import { filterInsightsBySubject } from "@/lib/weekly-planner/mr-engine-v3";
import { buildSubjectCatalog, type SubjectCatalogItem } from "@/lib/weekly-planner/subject-catalog";
import type {
  AiSuggestion,
  ExamInsightsResult,
  HeatmapSubject,
  TopicTrend,
  WeeklyTask,
} from "@/lib/weekly-planner/types";
import { cn } from "@/lib/utils";

function ProgressRing({ pct }: { pct: number }) {
  const p = Math.min(100, Math.max(0, pct));
  const color = p < 35 ? "#e11d48" : p < 70 ? "#f59e0b" : "#10b981";
  return (
    <div
      className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(${color} ${p}%, #e2e8f0 0)`,
      }}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[9px] font-bold text-slate-700">
        %{Math.round(p)}
      </span>
    </div>
  );
}

function SubjectCard({
  item,
  selected,
  onSelect,
}: {
  item: SubjectCatalogItem;
  selected: boolean;
  onSelect: () => void;
}) {
  const pct =
    item.mrScore != null
      ? item.mrScore
      : item.topicTotal > 0
        ? Math.round((100 * item.topicStudied) / item.topicTotal)
        : 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-all",
        selected
          ? "border-slate-900 bg-white shadow-md ring-1 ring-slate-900/10"
          : "border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-sm"
      )}
    >
      <ProgressRing pct={pct} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-sm font-bold text-slate-900">{item.name}</span>
          <span className="rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-bold text-sky-700">
            {item.track}
          </span>
        </div>
        <p className="mt-0.5 text-[11px] text-slate-500">
          {item.topicStudied}/{item.topicTotal} konu · {item.questionCount} soru
        </p>
        {item.suggestionCount > 0 && (
          <p className="mt-0.5 text-[10px] font-semibold text-rose-600">
            {item.suggestionCount} AI öneri
          </p>
        )}
      </div>
    </button>
  );
}

const TREND_UI: Record<
  TopicTrend,
  { label: string; className: string; Icon: typeof TrendingDown }
> = {
  persistent: { label: "Sürekli", className: "bg-rose-500/25 text-rose-200", Icon: AlertTriangle },
  falling: { label: "Düşüş", className: "bg-orange-500/25 text-orange-200", Icon: TrendingDown },
  new_weak: { label: "Yeni zayıf", className: "bg-amber-500/25 text-amber-200", Icon: ArrowDownRight },
  recovering: { label: "Toparlanıyor", className: "bg-emerald-500/25 text-emerald-200", Icon: TrendingUp },
  stable: { label: "Stabil", className: "bg-white/10 text-slate-300", Icon: Minus },
};

function TrendBadge({
  trend,
  variant = "dark",
}: {
  trend?: TopicTrend;
  variant?: "dark" | "light";
}) {
  if (!trend) return null;
  const ui = TREND_UI[trend];
  const Icon = ui.Icon;
  const lightClass =
    variant === "light"
      ? {
          persistent: "bg-rose-100 text-rose-700",
          falling: "bg-orange-100 text-orange-700",
          new_weak: "bg-amber-100 text-amber-800",
          recovering: "bg-emerald-100 text-emerald-700",
          stable: "bg-slate-100 text-slate-600",
        }[trend]
      : ui.className;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold",
        lightClass
      )}
    >
      <Icon className="h-2.5 w-2.5" />
      {ui.label}
    </span>
  );
}

function HeatmapRow({ h, examCount }: { h: HeatmapSubject; examCount: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-[10px] text-slate-300" title={h.label}>
          {h.topicName || h.label.split("—").pop()?.trim() || h.label}
        </span>
        <TrendBadge trend={h.trend} />
        <span className="w-8 shrink-0 text-right text-[10px] font-bold text-slate-400">%{h.score}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className={cn(
              "h-full rounded-full",
              h.score < 40 ? "bg-rose-500" : h.score < 65 ? "bg-amber-400" : "bg-emerald-400"
            )}
            style={{ width: `${h.score}%` }}
          />
        </div>
        {examCount > 1 && h.perExamScores && (
          <div className="flex shrink-0 gap-0.5">
            {h.perExamScores.map((s, i) => (
              <span
                key={i}
                title={`Deneme ${i + 1}`}
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  s == null
                    ? "bg-white/15"
                    : s < 40
                      ? "bg-rose-400"
                      : s < 65
                        ? "bg-amber-300"
                        : "bg-emerald-400"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SuggestionMiniCard({
  suggestion,
  examCount,
  onAddToCalendar,
  onOpenInModal,
}: {
  suggestion: AiSuggestion;
  examCount: number;
  onAddToCalendar: () => void;
  onOpenInModal: () => void;
}) {
  const high = suggestion.priority === "high";
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start gap-2">
        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-1">
            <p className="text-sm font-semibold text-slate-900">{suggestion.title}</p>
            <div className="flex shrink-0 flex-col items-end gap-0.5">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase",
                  high ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"
                )}
              >
                {high ? "Yüksek" : "Rutin"}
              </span>
              <TrendBadge trend={suggestion.trend} variant="light" />
            </div>
          </div>
          <p className="mt-1 text-xs text-slate-500">{suggestion.subtitle}</p>
          {suggestion.examBreakdown && (
            <p className="mt-1 font-mono text-[10px] text-slate-400">{suggestion.examBreakdown}</p>
          )}
          {suggestion.score != null && (
            <p className="mt-1 text-[11px] font-semibold text-rose-600">
              {examCount} deneme başarı: %{suggestion.score}
              {suggestion.wrongCount != null && (
                <span className="font-normal text-slate-500">
                  {" "}
                  · {suggestion.wrongCount} hatalı soru
                </span>
              )}
            </p>
          )}
        </div>
      </div>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          onClick={onOpenInModal}
        >
          Detaylı ekle
        </button>
        <button
          type="button"
          className="flex-1 rounded-lg bg-slate-900 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
          onClick={onAddToCalendar}
        >
          Takvime at
        </button>
      </div>
    </div>
  );
}

function formatExamDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

export function WeeklyPlannerSidebar({
  trackFilter,
  onTrackFilterChange,
  selectedSubjectId,
  onSelectSubject,
  insights,
  tasks,
  onSuggestionDragStart,
  onSuggestionAdd,
  onSuggestionOpenModal,
}: {
  trackFilter: MufredatTrack | "ALL";
  onTrackFilterChange: (t: MufredatTrack | "ALL") => void;
  selectedSubjectId: string;
  onSelectSubject: (id: string) => void;
  insights: ExamInsightsResult;
  tasks: WeeklyTask[];
  onSuggestionDragStart: (id: string) => void;
  onSuggestionAdd: (s: AiSuggestion) => void;
  onSuggestionOpenModal: (s: AiSuggestion) => void;
}) {
  const catalog = useMemo(
    () => buildSubjectCatalog(trackFilter, insights, tasks),
    [trackFilter, insights, tasks]
  );

  const scoped = useMemo(
    () => filterInsightsBySubject(insights, selectedSubjectId),
    [insights, selectedSubjectId]
  );

  const selected = catalog.find((c) => c.id === selectedSubjectId);
  const examLabel =
    insights.examCount >= 3
      ? "son 3 deneme"
      : insights.examCount > 0
        ? `son ${insights.examCount} deneme`
        : "deneme yok";

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="shrink-0 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Dersler</p>
          <div className="mt-2 flex rounded-xl bg-slate-100 p-1">
            {(
              [
                { id: "TYT" as const, label: "TYT" },
                { id: "AYT" as const, label: "AYT" },
                { id: "ALL" as const, label: "İkisi de" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onTrackFilterChange(t.id)}
                className={cn(
                  "flex-1 rounded-lg py-1.5 text-xs font-bold transition-all",
                  trackFilter === t.id
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="max-h-[min(42vh,380px)] space-y-2 overflow-y-auto p-3">
          {catalog.map((item) => (
            <SubjectCard
              key={item.id}
              item={item}
              selected={selectedSubjectId === item.id}
              onSelect={() => onSelectSubject(item.id)}
            />
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 shadow-xl">
        <div className="shrink-0 border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-orange-400" />
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-white">MR Teşhis & AI</h2>
              <p className="text-[11px] text-slate-400">
                {selected?.name ?? "Ders seçin"} · {examLabel}
              </p>
            </div>
          </div>

          {insights.examSnapshots.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {insights.examSnapshots.map((snap, i) => (
                <span
                  key={snap.examId}
                  className="max-w-[7rem] truncate rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-semibold text-slate-300"
                  title={snap.name}
                >
                  D{i + 1} {formatExamDate(snap.dateISO)}
                </span>
              ))}
            </div>
          )}

          {!insights.emptyReason && insights.examCount > 0 && selectedSubjectId && (
            <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
              {scoped.suggestions.length} öneri · {scoped.heatmap.length} konu
            </p>
          )}
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          {insights.emptyReason ? (
            <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-100">
              {insights.emptyReason}
            </p>
          ) : (
            <>
              {scoped.criticalTopic && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3">
                  <div className="flex gap-2">
                    <TrendingDown className="h-4 w-4 shrink-0 text-rose-300" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase text-rose-300">Kritik</p>
                      <p className="truncate text-xs font-semibold text-white">{scoped.criticalTopic}</p>
                    </div>
                  </div>
                </div>
              )}

              {scoped.heatmap.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Konu ısı haritası · {selected?.name ?? "—"}
                  </p>
                  {scoped.heatmap.map((h) => (
                    <HeatmapRow key={h.id} h={h} examCount={insights.examCount} />
                  ))}
                </div>
              )}

              <div>
                <p className="mb-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <AlertTriangle className="h-3 w-3" />
                  AI önerileri ({scoped.suggestions.length})
                </p>
                <div className="space-y-2">
                  {!selectedSubjectId ? (
                    <p className="text-xs text-slate-400">Öneri için üstten bir ders seçin.</p>
                  ) : scoped.subjectEmptyHint ? (
                    <p className="text-xs leading-relaxed text-slate-400">{scoped.subjectEmptyHint}</p>
                  ) : scoped.suggestions.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      Bu derste hatalı konu kaydı yok; başka ders seçin.
                    </p>
                  ) : (
                    scoped.suggestions.map((s) => (
                      <div
                        key={s.id}
                        draggable
                        onDragStart={() => onSuggestionDragStart(s.id)}
                        className="cursor-grab active:cursor-grabbing"
                      >
                        <SuggestionMiniCard
                          suggestion={s}
                          examCount={insights.examCount}
                          onAddToCalendar={() => onSuggestionAdd(s)}
                          onOpenInModal={() => onSuggestionOpenModal(s)}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
