"use client";

import { useEffect, useState } from "react";
import { Clock, StickyNote, Target } from "lucide-react";

import { BookMultiSelect } from "@/components/konu-takip/book-multi-select";
import { QuestionCounter } from "@/components/konu-takip/question-counter";
import { StatusSegment } from "@/components/konu-takip/status-segment";
import {
  addSolved,
  setBooks,
  setNote,
  setSolved,
  setStatus,
  setTarget,
} from "@/lib/konu-takip/storage";
import { formatRelativeDate } from "@/lib/konu-takip/format";
import type { TopicProgress, TopicStatus } from "@/lib/konu-takip/types";
import { cn } from "@/lib/utils";

const EMPTY: TopicProgress = {
  status: "baslanmadi",
  solved: 0,
  bookIds: [],
  updatedAt: "",
};

export function TopicRow({
  studentId,
  subjectId,
  topicId,
  topicName,
  progress,
}: {
  studentId: string;
  subjectId: string;
  topicId: string;
  topicName: string;
  progress?: TopicProgress;
}) {
  const p = progress ?? EMPTY;
  const [noteOpen, setNoteOpen] = useState(false);

  const handleStatus = (status: TopicStatus) =>
    setStatus(studentId, subjectId, topicId, status);

  const targetRatio =
    p.target && p.target > 0 ? Math.min(1, p.solved / p.target) : 0;

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-colors",
        p.status === "bitti"
          ? "border-emerald-200 bg-emerald-50/40"
          : p.status === "calisiliyor"
            ? "border-amber-200 bg-amber-50/30"
            : "border-slate-200 bg-white"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h4 className="min-w-0 text-[15px] font-semibold text-slate-900">{topicName}</h4>
        <StatusSegment value={p.status} onChange={handleStatus} />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-slate-100 pt-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <QuestionCounter
            value={p.solved}
            onAdd={(delta) => addSolved(studentId, subjectId, topicId, delta)}
            onSet={(next) => setSolved(studentId, subjectId, topicId, next)}
          />
          <TargetField
            value={p.target ?? 0}
            onSet={(next) => setTarget(studentId, subjectId, topicId, next)}
          />
        </div>
        <BookMultiSelect
          subjectId={subjectId}
          value={p.bookIds}
          onChange={(ids) => setBooks(studentId, subjectId, topicId, ids)}
        />
      </div>

      {p.target && p.target > 0 ? (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-slate-500">
            <span>Hedefe ilerleme</span>
            <span className="tabular-nums">
              {p.solved}/{p.target} ({Math.round(targetRatio * 100)}%)
            </span>
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

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {noteOpen || p.note ? (
          <NoteField
            value={p.note ?? ""}
            autoFocus={noteOpen && !p.note}
            onSet={(next) => {
              setNote(studentId, subjectId, topicId, next);
              if (!next) setNoteOpen(false);
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setNoteOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <StickyNote className="h-3.5 w-3.5" />
            Not ekle
          </button>
        )}

        {p.updatedAt && (
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
            <Clock className="h-3 w-3" />
            {formatRelativeDate(p.updatedAt)}
          </span>
        )}
      </div>
    </div>
  );
}

function TargetField({
  value,
  onSet,
}: {
  value: number;
  onSet: (next: number) => void;
}) {
  const [draft, setDraft] = useState(String(value || ""));

  useEffect(() => {
    setDraft(String(value || ""));
  }, [value]);

  const commit = () => {
    const next = Math.max(0, Math.round(Number(draft) || 0));
    if (next !== value) onSet(next);
    setDraft(String(next || ""));
  };

  return (
    <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
      <Target className="h-3.5 w-3.5 text-slate-400" />
      Hedef
      <input
        inputMode="numeric"
        value={draft}
        onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ""))}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        placeholder="—"
        aria-label="Hedef soru sayısı"
        className="h-8 w-16 rounded-lg border border-slate-200 bg-white text-center text-sm font-bold tabular-nums text-slate-900 placeholder:font-normal placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200"
      />
    </label>
  );
}

function NoteField({
  value,
  autoFocus,
  onSet,
}: {
  value: string;
  autoFocus?: boolean;
  onSet: (next: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = () => {
    if (draft.trim() !== value.trim()) onSet(draft);
  };

  return (
    <div className="relative min-w-0 flex-1">
      <StickyNote className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
      <input
        autoFocus={autoFocus}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        placeholder="Konuya not ekle…"
        aria-label="Konu notu"
        className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
      />
    </div>
  );
}
