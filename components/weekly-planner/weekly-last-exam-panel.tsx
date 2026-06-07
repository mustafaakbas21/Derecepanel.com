"use client";

import { useMemo, useState } from "react";
import { BarChart3, ChevronRight, ExternalLink } from "lucide-react";

import { AmMasteryTierDetailModal } from "@/components/analiz-merkezi/v3/am-tier-detail-modal";
import { GuardedCoachLink } from "@/components/coach/guarded-coach-link";
import { rateToLightBg, rateToTextClass } from "@/lib/analiz/chart-theme";
import {
  buildLastExamBreakdownForStudent,
  buildLastExamSubjectTierDetail,
  type LastExamBreakdown,
  type LastExamSubjectRow,
} from "@/lib/weekly-planner/last-exam-breakdown";
import { cn } from "@/lib/utils";

const TIER_LABEL = {
  kritik: "Kritik",
  dikkat: "Dikkat",
  normal: "Normal",
} as const;

function formatDateShort(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

function SegmentedBar({ row }: { row: LastExamSubjectRow }) {
  if (row.total === 0) return null;
  const cPct = (100 * row.correct) / row.total;
  const wPct = (100 * row.wrong) / row.total;
  const ePct = (100 * row.empty) / row.total;

  return (
    <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-slate-100">
      {cPct > 0 && <div className="bg-emerald-500" style={{ width: `${cPct}%` }} />}
      {wPct > 0 && <div className="bg-rose-500" style={{ width: `${wPct}%` }} />}
      {ePct > 0 && <div className="bg-slate-300" style={{ width: `${ePct}%` }} />}
    </div>
  );
}

function SubjectCard({
  row,
  onOpen,
}: {
  row: LastExamSubjectRow;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group w-full rounded-xl border bg-white p-3 text-left transition-all hover:shadow-md",
        row.tier === "kritik"
          ? "border-rose-200 hover:border-rose-300"
          : row.tier === "dikkat"
            ? "border-amber-200/80 hover:border-amber-300"
            : "border-slate-200 hover:border-slate-300"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-xs font-bold text-slate-900">{row.name}</span>
            <span
              className={cn(
                "rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase",
                rateToLightBg(row.rate)
              )}
            >
              {TIER_LABEL[row.tier]}
            </span>
          </div>
          <p className="mt-0.5 text-[10px] text-slate-600">
            {row.total} soru ·{" "}
            <span className="text-emerald-700">{row.correct}D</span> ·{" "}
            <span className="text-rose-600">{row.wrong}Y</span>
            {row.empty > 0 && <> · {row.empty}B</>}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <span className={cn("text-sm font-bold tabular-nums", rateToTextClass(row.rate))}>
            %{row.rate}
          </span>
          <span className="flex items-center gap-0.5 text-[9px] font-semibold text-slate-400 group-hover:text-slate-700">
            Detay <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      </div>
      <SegmentedBar row={row} />
    </button>
  );
}

export function WeeklyLastExamPanel({
  studentId,
  studentName = "Öğrenci",
}: {
  studentId: string;
  studentName?: string;
}) {
  const breakdown = useMemo(
    () => buildLastExamBreakdownForStudent(studentId),
    [studentId]
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<LastExamSubjectRow | null>(null);

  const modalPayload = useMemo(() => {
    if (!selectedSubject) return null;
    return buildLastExamSubjectTierDetail(
      breakdown,
      selectedSubject,
      studentId,
      studentName
    );
  }, [breakdown, selectedSubject, studentId, studentName]);

  const openSubject = (row: LastExamSubjectRow) => {
    setSelectedSubject(row);
    setModalOpen(true);
  };

  if (!studentId) return null;

  return (
    <>
      <div
        id="wp-last-exam"
        className="rounded-2xl border border-stone-200/70 bg-white/90 p-3 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-slate-500">
              <BarChart3 className="h-3.5 w-3.5 shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Son deneme
              </span>
            </div>
            {breakdown.emptyReason ? (
              <p className="mt-1 text-xs text-slate-500">{breakdown.emptyReason}</p>
            ) : (
              <p className="mt-0.5 truncate text-xs font-semibold text-slate-800">
                {breakdown.examName}
                <span className="font-normal text-slate-500">
                  {" "}
                  · {formatDateShort(breakdown.examDateISO)}
                  {breakdown.net != null && ` · Net ${breakdown.net}`}
                  {" · "}
                  {breakdown.totalQuestions} soru
                </span>
              </p>
            )}
          </div>
          {breakdown.examId && (
            <GuardedCoachLink
              href={breakdown.analizHref}
              className="inline-flex h-7 shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-2 text-[10px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              Analiz
              <ExternalLink className="h-3 w-3" />
            </GuardedCoachLink>
          )}
        </div>

        {!breakdown.emptyReason && breakdown.subjects.length > 0 && (
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {breakdown.subjects.map((row) => (
              <SubjectCard key={row.name} row={row} onOpen={() => openSubject(row)} />
            ))}
          </div>
        )}
      </div>

      <AmMasteryTierDetailModal
        open={modalOpen}
        onOpenChange={(o) => {
          setModalOpen(o);
          if (!o) setSelectedSubject(null);
        }}
        payload={modalPayload}
      />
    </>
  );
}
