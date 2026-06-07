"use client";

import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BookOpen,
  CircleAlert,
  TrendingDown,
} from "lucide-react";

import { TIER_THEME } from "@/components/analiz-merkezi/v3/tier-theme";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { rateToLightBg } from "@/lib/analiz/chart-theme";
import type { TierDetailPayload, PriorityTierDetail } from "@/lib/analiz/tier-detail";
import type { OtonomTierId } from "@/lib/analiz/otonom-v3";
import { cn } from "@/lib/utils";

function TrendIcon({ trend }: { trend: "up" | "down" | "flat" }) {
  if (trend === "up") return <ArrowUp className="h-3.5 w-3.5 text-emerald-600" />;
  if (trend === "down") return <ArrowDown className="h-3.5 w-3.5 text-rose-600" />;
  return <ArrowRight className="h-3.5 w-3.5 text-slate-400" />;
}

function QuestionPill({
  qNo,
  result,
  examName,
  classRate,
}: {
  qNo: number;
  result: "correct" | "wrong" | "empty";
  examName: string;
  classRate: number;
}) {
  const resultLabel =
    result === "wrong" ? "Yanlış" : result === "empty" ? "Boş" : "Doğru";
  return (
    <div
      className={cn(
        "rounded-lg border px-2.5 py-2 text-xs",
        result === "wrong"
          ? "border-rose-200 bg-rose-50/80"
          : result === "empty"
            ? "border-amber-200 bg-amber-50/80"
            : "border-slate-200 bg-slate-50"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono font-bold text-slate-800">S{qNo}</span>
        <span
          className={cn(
            "font-semibold",
            result === "wrong"
              ? "text-rose-700"
              : result === "empty"
                ? "text-amber-700"
                : "text-emerald-700"
          )}
        >
          {resultLabel}
        </span>
      </div>
      <p className="mt-1 truncate text-[10px] text-slate-500" title={examName}>
        {examName}
      </p>
      <p className="mt-0.5 text-[10px] font-semibold text-slate-600">
        Sınıf doğru: %{classRate}
      </p>
    </div>
  );
}

export function AmMasteryTierDetailModal({
  open,
  onOpenChange,
  payload,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payload: TierDetailPayload | null;
}) {
  if (!payload) return null;
  const theme = TIER_THEME[payload.tier];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(88vh,720px)] overflow-hidden sm:max-w-[640px]">
        <DialogHeader>
          <div
            className="mb-1 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
            style={{
              background: theme.bg,
              border: `1px solid ${theme.border}`,
              color: theme.color,
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: theme.color }}
            />
            {payload.label}
          </div>
          <DialogTitle className="text-xl">
            Konu detayı · {payload.studentName}
          </DialogTitle>
          <DialogDescription>{payload.subtitle}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
            {payload.totalTopics} konu
          </span>
          <span className="rounded-full bg-rose-50 px-2.5 py-1 text-rose-700">
            {payload.decliningTopics.length} düşüşte
          </span>
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-800">
            {payload.totalProblemQuestions} riskli soru
          </span>
        </div>

        <div className="-mx-1 max-h-[min(52vh,480px)] space-y-4 overflow-y-auto px-1 pr-1">
          {payload.decliningTopics.length > 0 && (
            <section>
              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-rose-800">
                <TrendingDown className="h-3.5 w-3.5" />
                Düşüşteki konular
              </h4>
              <div className="space-y-2">
                {payload.decliningTopics.map((t) => (
                  <TopicBlock key={`${t.subjectName}-${t.topicName}`} topic={t} theme={theme} />
                ))}
              </div>
            </section>
          )}

          {payload.topics.filter((t) => !t.declining).length > 0 && (
            <section>
              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-600">
                <BookOpen className="h-3.5 w-3.5" />
                Diğer konular
              </h4>
              <div className="space-y-2">
                {payload.topics
                  .filter((t) => !t.declining)
                  .map((t) => (
                    <TopicBlock
                      key={`${t.subjectName}-${t.topicName}`}
                      topic={t}
                      theme={theme}
                    />
                  ))}
              </div>
            </section>
          )}

          {payload.topics.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">
              Bu seviyede gösterilecek konu yok.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TopicBlock({
  topic,
  theme,
}: {
  topic: TierDetailPayload["topics"][number];
  theme: { color: string };
}) {
  const wrongEmpty = topic.problemQuestions;

  return (
    <div
      className="rounded-xl border border-slate-200 bg-white p-3"
      style={{ borderLeftWidth: 3, borderLeftColor: theme.color }}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900">{topic.topicName}</p>
          <p className="text-xs text-slate-500">{topic.subjectName}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-bold",
              rateToLightBg(topic.rate)
            )}
          >
            %{topic.rate}
          </span>
          <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-slate-600">
            <TrendIcon trend={topic.trend} />
            {topic.trend === "down"
              ? "Düşüş"
              : topic.trend === "up"
                ? "Yükseliş"
                : "Sabit"}
          </span>
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-600">
        {topic.correct} doğru · {topic.wrong} yanlış · {topic.empty} boş
      </p>

      {wrongEmpty.length > 0 ? (
        <div className="mt-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Sorular ({wrongEmpty.length})
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {wrongEmpty.map((q) => (
              <QuestionPill
                key={`${q.examId}-${q.qNo}`}
                qNo={q.qNo}
                result={q.result}
                examName={q.examName}
                classRate={q.classRate}
              />
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-2 text-xs text-slate-400">
          Bu konuda kayıtlı yanlış/boş soru yok — özet veriden türetildi.
        </p>
      )}
    </div>
  );
}

export function AmPriorityTierDetailModal({
  open,
  onOpenChange,
  payload,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payload: PriorityTierDetail | null;
}) {
  if (!payload) return null;
  const theme = TIER_THEME[payload.tier];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(88vh,720px)] overflow-hidden sm:max-w-[640px]">
        <DialogHeader>
          <div
            className="mb-1 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
            style={{
              background: theme.bg,
              border: `1px solid ${theme.border}`,
              color: theme.color,
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: theme.color }}
            />
            OTONOM · {payload.label}
          </div>
          <DialogTitle className="text-xl">Sınıf risk detayı</DialogTitle>
          <DialogDescription>
            {payload.subtitle}
            {payload.examName ? ` · ${payload.examName}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
            {payload.rows.length} soru
          </span>
          <span className="rounded-full bg-rose-50 px-2.5 py-1 text-rose-700">
            {payload.decliningRows.length} sınıf doğruluğu düşük
          </span>
        </div>

        <div className="-mx-1 max-h-[min(52vh,480px)] space-y-3 overflow-y-auto px-1 pr-1">
          {payload.tier === "normal" && payload.healthySubjects.length > 0 && (
            <section>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-emerald-800">
                Hedefteki dersler
              </h4>
              <ul className="space-y-1.5">
                {payload.healthySubjects.map((g) => (
                  <li
                    key={g.name}
                    className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50/50 px-3 py-2 text-sm"
                  >
                    <span className="font-semibold text-slate-800">{g.name}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-bold",
                        rateToLightBg(g.rate)
                      )}
                    >
                      %{g.rate}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {payload.bySubject.length === 0 ? (
            payload.tier !== "normal" || payload.healthySubjects.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                Bu seviyede kritik soru yok.
              </p>
            ) : null
          ) : (
            payload.bySubject.map((g) => (
              <div
                key={g.subjectName}
                className="rounded-xl border border-slate-200 p-3"
                style={{ borderLeftWidth: 3, borderLeftColor: theme.color }}
              >
                <p className="text-sm font-bold text-slate-900">{g.subjectName}</p>
                <p className="mb-2 text-xs text-slate-500">{g.rows.length} soru</p>
                <ul className="space-y-2">
                  {g.rows.map((r) => (
                    <li
                      key={r.qNo}
                      className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm"
                    >
                      <CircleAlert
                        className="h-4 w-4 shrink-0"
                        style={{ color: theme.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900">{r.topicName}</p>
                        <p className="text-xs text-slate-500">
                          Soru {r.qNo} · sınıf doğru %{r.classCorrectRate}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-bold",
                          rateToLightBg(r.classCorrectRate)
                        )}
                      >
                        %{r.classCorrectRate}
                      </span>
                      {r.classCorrectRate < 50 && (
                        <span className="text-[10px] font-bold uppercase text-rose-600">
                          Düşüş riski
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
