"use client";

import { useEffect, useMemo, useRef } from "react";
import Sortable from "sortablejs";
import { Trash2 } from "lucide-react";

import { QuestionItem } from "@/components/test-maker/question-item";
import {
  computePagination,
  flattenPagination,
  splitAnswerKeyColumns,
} from "@/lib/test-maker/paginate";
import type { QPerPage, TemplateId, TMConfig, TMQuestion } from "@/lib/test-maker/types";
import { cn } from "@/lib/utils";

type A4DocumentProps = {
  config: TMConfig;
  template: TemplateId;
  templateName: string;
  questions: TMQuestion[];
  qPerPage: QPerPage;
  manualExtraPages: number;
  showCover: boolean;
  showAnswerKey: boolean;
  onQuestionsChange: (q: TMQuestion[]) => void;
  onAnswer: (id: string, letter: import("@/lib/test-maker/types").AnswerLetter) => void;
  onDelete: (id: string) => void;
  onRemoveExtraPage: (pageIndex: number) => void;
};

function collectIds(container: HTMLElement | null): string[] {
  if (!container) return [];
  return Array.from(container.querySelectorAll(".tm-q-item"))
    .map((el) => el.getAttribute("data-q-id"))
    .filter(Boolean) as string[];
}

export function A4Document({
  config,
  template,
  questions,
  qPerPage,
  manualExtraPages,
  showCover,
  showAnswerKey,
  onQuestionsChange,
  onAnswer,
  onDelete,
  onRemoveExtraPage,
}: A4DocumentProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const mainListRef = useRef<HTMLUListElement>(null);
  const extraWrapRef = useRef<HTMLDivElement>(null);

  const { main, extras } = useMemo(
    () => computePagination(questions, qPerPage, manualExtraPages),
    [questions, qPerPage, manualExtraPages]
  );

  const allOrdered = useMemo(
    () => flattenPagination(main, extras),
    [main, extras]
  );

  const akCols = splitAnswerKeyColumns(allOrdered);
  const dateStr = new Date().toLocaleDateString("tr-TR");
  const dersKonu = [config.dersLabel, config.konuLabel].filter(Boolean).join(" — ");

  const applyReorder = () => {
    const root = rootRef.current;
    if (!root) return;
    const ids = collectIds(root);
    const map = new Map(questions.map((q) => [q.id, q]));
    const next = ids.map((id) => map.get(id)).filter(Boolean) as TMQuestion[];
    if (next.length === questions.length) onQuestionsChange(next);
  };

  useEffect(() => {
    const instances: Sortable[] = [];
    const opts: Sortable.Options = {
      animation: 160,
      handle: ".tm-q-handle",
      ghostClass: "opacity-50",
      group: "tm-questions",
      onEnd: () => setTimeout(applyReorder, 0),
    };
    if (mainListRef.current) {
      instances.push(Sortable.create(mainListRef.current, opts));
    }
    extraWrapRef.current?.querySelectorAll(".tm-q-extra-list").forEach((el) => {
      instances.push(Sortable.create(el as HTMLElement, opts));
    });
    return () => instances.forEach((s) => s.destroy());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [main.length, extras.length, questions.length]);

  let globalIndex = 0;

  return (
    <div id="tm-a4-page" ref={rootRef} data-tpl={template} className="space-y-8">
      <section
        id="tm-sheet-cover"
        className={cn(
          "tm-a4-sheet flex flex-col justify-between p-8 print:break-after-page",
          !showCover && "hidden"
        )}
        aria-hidden={!showCover}
      >
          <div className="text-center">
            <p className="tm-sync-institution text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
              {config.kurum || "KURUM ADI"}
            </p>
            <div className="mx-auto mt-4 h-px w-24 bg-slate-800" aria-hidden />
            <h1
              id="live-cover-title"
              className="tm-tpl-font-head mt-6 font-serif text-2xl font-bold text-slate-900"
            >
              {config.coverTitle}
            </h1>
            <p id="tm-cover-line-ders-konu" className="mt-3 text-sm font-semibold text-slate-700">
              {dersKonu}
            </p>
          </div>
          <div
            id="tm-cover-student-form"
            className="space-y-3 border-t border-slate-100 pt-6 text-sm text-slate-600"
          >
            <p className="border-b border-slate-200 pb-2">Ad Soyad: _________________________________</p>
            <p className="border-b border-slate-200 pb-2">Sınıf / No: _________________________________</p>
            <p>Tarih: {dateStr}</p>
          </div>
          <div
            id="tm-cover-footer"
            className="tm-tpl-hdr-bg mt-6 flex items-center justify-center py-3 text-xs font-semibold uppercase tracking-widest"
          >
            <span className="tm-sync-institution">{config.kurum}</span>
          </div>
      </section>

      <section
        id="tm-sheet-questions"
        className="tm-a4-sheet flex flex-col overflow-hidden print:break-after-page"
      >
        <div className="tm-tpl-hdr-bg flex shrink-0 items-start justify-between px-5 pb-2 pt-4 text-[11px]">
          <span className="tm-sync-institution font-bold uppercase">{config.kurum}</span>
          <span className="font-medium opacity-80">{dateStr}</span>
        </div>
        <div className="tm-tpl-divider border-b px-5 pb-3 pt-2 text-center">
          <p id="tm-sh-q-ders" className="tm-tpl-font-head text-sm font-bold text-slate-900">
            {config.dersLabel}
          </p>
          <p id="tm-sh-q-konu" className="text-xs font-semibold text-slate-800">
            {config.konuLabel}
          </p>
        </div>
        <ul
          ref={mainListRef}
          id="sortable-list"
          className={cn(
            "tm-strict-grid tm-tpl-gap relative flex-1 p-4",
            qPerPage === 6 && "grid-rows-3"
          )}
        >
          {main.map((q) => {
            const idx = globalIndex++;
            return (
              <li key={q.id} className="list-none">
                <QuestionItem
                  question={q}
                  index={idx}
                  config={config}
                  showChoices
                  onAnswer={(letter) => onAnswer(q.id, letter)}
                  onDelete={() => onDelete(q.id)}
                />
              </li>
            );
          })}
        </ul>
        <div className="tm-q-footer tm-tpl-hdr-bg flex shrink-0 items-center justify-center px-6 py-3 text-xs font-semibold uppercase tracking-widest">
          <span className="tm-sync-institution">{config.kurum}</span>
        </div>
      </section>

      <div id="tm-q-extra-pages" ref={extraWrapRef}>
        {extras.map((pageQs, pageIdx) => (
          <section
            key={`extra-${pageIdx}`}
            className="tm-q-extra-page tm-a4-sheet group relative mb-8 flex flex-col overflow-hidden print:break-after-page"
          >
            <button
              type="button"
              className="teacher-only-ui tm-delete-page-btn absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-400 opacity-0 shadow-sm transition group-hover:opacity-100 hover:bg-red-500 hover:text-white print:hidden"
              onClick={() => onRemoveExtraPage(pageIdx)}
              title="Sayfayı sil"
            >
              <Trash2 className="h-5 w-5" />
            </button>
            <div className="tm-tpl-hdr-bg flex shrink-0 items-start justify-between px-5 pb-2 pt-4 text-[11px]">
              <span className="tm-sync-institution font-bold uppercase">{config.kurum}</span>
              <span>{dateStr}</span>
            </div>
            <div className="tm-tpl-divider border-b px-5 pb-3 pt-2 text-center">
              <p className="text-sm font-bold">{config.dersLabel}</p>
              <p className="text-xs font-semibold">{config.konuLabel}</p>
            </div>
            <ul className="tm-q-extra-list tm-strict-grid tm-tpl-gap relative flex-1 p-4">
              {pageQs.map((q) => {
                const idx = globalIndex++;
                return (
                  <li key={q.id} className="list-none">
                    <QuestionItem
                      question={q}
                      index={idx}
                      config={config}
                      showChoices
                      onAnswer={(letter) => onAnswer(q.id, letter)}
                      onDelete={() => onDelete(q.id)}
                    />
                  </li>
                );
              })}
            </ul>
            <div className="tm-q-footer tm-tpl-hdr-bg flex shrink-0 items-center justify-center px-6 py-3 text-xs font-semibold uppercase tracking-widest">
              <span className="tm-sync-institution">{config.kurum}</span>
            </div>
          </section>
        ))}
      </div>

      {allOrdered.length > 0 && (
        <section
          id="tm-sheet-answer"
          className={cn(
            "tm-a4-sheet tm-ak-sheet p-8 print:break-before-page",
            !showAnswerKey && "hidden"
          )}
          aria-hidden={!showAnswerKey}
        >
          <h2 className="tm-ak-sheet__title">Cevap Anahtarı</h2>
          <div className="grid grid-cols-3 gap-6">
            {[akCols[0], akCols[1], akCols[2]].map((col, ci) => (
              <div key={ci} id={`tm-ak-col-${ci + 1}`}>
                {col.map((q, i) => {
                  const num =
                    ci === 0
                      ? i + 1
                      : ci === 1
                        ? akCols[0].length + i + 1
                        : akCols[0].length + akCols[1].length + i + 1;
                  const letter = q.answer?.toUpperCase();
                  const valid =
                    letter && ["A", "B", "C", "D", "E"].includes(letter);
                  return (
                    <div key={q.id} className="tm-ak-row" data-q-id={q.id}>
                      <span className="tm-ak-row__num">{num}.</span>
                      <div className="tm-ak-row__line" aria-hidden />
                      <span
                        className={cn(
                          "tm-ak-row__ans",
                          !valid && "tm-ak-row__ans--empty"
                        )}
                      >
                        {valid ? letter : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
