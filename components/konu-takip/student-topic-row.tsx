"use client";

import { useMemo } from "react";
import { BookOpen, Clock, StickyNote, Target } from "lucide-react";

import { QuestionCounter } from "@/components/konu-takip/question-counter";
import { StatusSegment } from "@/components/konu-takip/status-segment";
import { useLibrary } from "@/hooks/use-library";
import { bookSubjectLabel } from "@/lib/library/book-meta";
import { addSolved, setSolved, setStatus } from "@/lib/konu-takip/storage";
import { formatRelativeDate } from "@/lib/konu-takip/format";
import type { TopicProgress, TopicStatus } from "@/lib/konu-takip/types";
import { toast } from "@/lib/notify";
import { cn } from "@/lib/utils";

const EMPTY: TopicProgress = {
  status: "baslanmadi",
  solved: 0,
  bookIds: [],
  updatedAt: "",
};

export function StudentTopicRow({
  studentId,
  subjectId,
  topicId,
  topicName,
  progress,
  highlighted = false,
}: {
  studentId: string;
  subjectId: string;
  topicId: string;
  topicName: string;
  progress?: TopicProgress;
  highlighted?: boolean;
}) {
  const p = progress ?? EMPTY;
  const { books } = useLibrary();

  const assignedBooks = useMemo(
    () =>
      (p.bookIds ?? [])
        .map((id) => books.find((b) => b.id === id))
        .filter(Boolean),
    [p.bookIds, books]
  );

  const handleStatus = (status: TopicStatus) => {
    setStatus(studentId, subjectId, topicId, status);
    if (status === "bitti") {
      toast.success(`“${topicName}” bitti olarak kaydedildi`);
    } else if (status === "calisiliyor") {
      toast.message(`“${topicName}” çalışılıyor`);
    }
  };

  const targetRatio = p.target && p.target > 0 ? Math.min(1, p.solved / p.target) : 0;

  return (
    <article
      id={`konu-row-${topicId}`}
      className={cn(
        "overflow-hidden rounded-2xl border transition-colors",
        highlighted && "ring-2 ring-red-400 ring-offset-2",
        p.status === "bitti"
          ? "border-emerald-200/80 bg-emerald-50/40"
          : p.status === "calisiliyor"
            ? "border-amber-200/80 bg-amber-50/30"
            : "border-slate-200/80 bg-white"
      )}
      style={{ boxShadow: "var(--card-shadow-sm)" }}
    >
      <div className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h4 className="min-w-0 text-[15px] font-semibold leading-snug text-slate-900">
            {topicName}
          </h4>
          <StatusSegment value={p.status} onChange={handleStatus} />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-3">
          <QuestionCounter
            value={p.solved}
            onAdd={(delta) => addSolved(studentId, subjectId, topicId, delta)}
            onSet={(next) => setSolved(studentId, subjectId, topicId, next)}
          />
          {p.target && p.target > 0 ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <Target className="h-3.5 w-3.5 text-slate-400" />
              Koç hedefi:{" "}
              <span className="font-bold tabular-nums text-slate-900">
                {p.solved}/{p.target}
              </span>
            </span>
          ) : null}
        </div>

        {p.target && p.target > 0 ? (
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-slate-500">
              <span>Hedefe ilerleme</span>
              <span className="tabular-nums">%{Math.round(targetRatio * 100)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  targetRatio >= 1 ? "bg-emerald-500" : "bg-slate-900"
                )}
                style={{ width: `${Math.max(2, targetRatio * 100)}%` }}
              />
            </div>
          </div>
        ) : null}

        {assignedBooks.length > 0 ? (
          <div className="mt-3">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Koçun önerdiği kaynaklar
            </p>
            <div className="flex flex-wrap gap-1.5">
              {assignedBooks.map((book) => (
                <span
                  key={book!.id}
                  className="inline-flex max-w-full items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700"
                  title={bookSubjectLabel(book!)}
                >
                  <BookOpen className="h-3 w-3 shrink-0 text-slate-400" />
                  <span className="truncate">{book!.title}</span>
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {p.note ? (
          <div className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-800">
              <StickyNote className="h-3.5 w-3.5" />
              Koç notu
            </p>
            <p className="mt-1 text-sm leading-relaxed text-amber-950">{p.note}</p>
          </div>
        ) : null}

        {p.updatedAt ? (
          <p className="mt-3 inline-flex items-center gap-1 text-[11px] text-slate-400">
            <Clock className="h-3 w-3" />
            Son güncelleme: {formatRelativeDate(p.updatedAt)}
          </p>
        ) : null}
      </div>
    </article>
  );
}
