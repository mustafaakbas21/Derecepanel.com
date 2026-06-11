"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import Sortable from "sortablejs";

import { OptikForm } from "@/components/test-maker/optik-form";
import { QuestionItem, QuestionSolveSpace } from "@/components/test-maker/question-item";
import {
  estimateQuestionHeightFromImage,
  TM_COLUMN_CONTENT_WIDTH_PX,
} from "@/lib/test-maker/estimate-question-height";
import {
  appendQuestionToDisplayLayout,
  buildHeightsWithFallback,
  collectPageColumnIdsFromDom,
  createOpticPage,
  flattenPagesQuestionIds,
  isOpticQuestionPage,
  layoutFlatKey,
  paginateForwardOnly,
  pickPreviousLayout,
  splitAnswerKeyColumns,
  TM_MAX_COLUMN_HEIGHT_PX,
  type MeasuredQuestionPage,
} from "@/lib/test-maker/paginate";
import type { TemplateId, TMConfig, TMQuestion } from "@/lib/test-maker/types";
import { cn } from "@/lib/utils";

const MEASURE_DELAY_MS = 200;

/** Katı A4 — JS dizgi motoru */
const STRICT_A4_PAGE_CLASS =
  "tm-a4-sheet mx-auto mb-12 flex h-[297mm] w-[210mm] shrink-0 flex-col overflow-hidden bg-white shadow-lg print:m-0 print:shadow-none";

const A4_QUESTION_PAGE_CLASS = cn(STRICT_A4_PAGE_CLASS, "tm-q-question-sheet");

type A4DocumentProps = {
  config: TMConfig;
  template: TemplateId;
  templateName: string;
  questions: TMQuestion[];
  showCover: boolean;
  showAnswerKey: boolean;
  showOptic: boolean;
  onQuestionsChange: (q: TMQuestion[]) => void;
  onAnswer: (id: string, letter: import("@/lib/test-maker/types").QuestionAnswer) => void;
  onDelete: (id: string) => void;
};

function collectIds(container: HTMLElement | null): string[] {
  if (!container) return [];
  const bodies = container.querySelectorAll(".tm-q-sheet-body");
  if (bodies.length === 0) {
    return Array.from(container.querySelectorAll(".tm-q-item"))
      .map((el) => el.getAttribute("data-q-id"))
      .filter(Boolean) as string[];
  }
  return Array.from(bodies).flatMap((body) => collectPageColumnIdsFromDom(body));
}

async function waitForImages(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll("img"));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
        })
    )
  );
}

function readMeasuredHeights(container: HTMLElement, questions: TMQuestion[]): Record<string, number> {
  const heights: Record<string, number> = {};
  for (const q of questions) {
    const wrapper = container.querySelector(`#measure-${CSS.escape(q.id)}`);
    heights[q.id] = wrapper ? Math.ceil(wrapper.getBoundingClientRect().height) : 300;
  }
  return heights;
}

function readProbeColumnMaxHeight(probeBody: HTMLElement | null): number {
  if (!probeBody) return TM_MAX_COLUMN_HEIGHT_PX;
  const h = Math.floor(probeBody.clientHeight);
  if (h <= 0) return TM_MAX_COLUMN_HEIGHT_PX;
  return h;
}

function SheetHeaderBlock({ config }: { config: TMConfig }) {
  return (
    <>
      <div className="tm-tpl-hdr-bg flex items-center justify-center px-6 pb-2.5 pt-4 text-[11px]">
        <span className="tm-sync-institution font-bold uppercase">{config.kurum}</span>
      </div>
      <div className="tm-tpl-divider border-b px-6 pb-3 pt-2.5 text-center">
        <p id="tm-sh-q-ders" className="tm-tpl-font-head text-sm font-bold text-slate-900">
          {config.dersLabel}
        </p>
        <p id="tm-sh-q-konu" className="text-xs font-semibold text-slate-800">
          {config.konuLabel}
        </p>
      </div>
    </>
  );
}

function SheetFooterBlock({ kurum }: { kurum: string }) {
  return (
    <div className="tm-q-footer tm-tpl-hdr-bg flex items-center justify-center px-6 py-3 text-xs font-semibold uppercase tracking-widest">
      <span className="tm-sync-institution">{kurum}</span>
    </div>
  );
}

function A4QuestionSheetPage({
  page,
  config,
  questionIndexById,
  onAnswer,
  onDelete,
  shellRef,
  listId,
  sectionId,
  isFirstPage,
}: {
  page: MeasuredQuestionPage;
  config: TMConfig;
  questionIndexById: Map<string, number>;
  onAnswer: (id: string, letter: import("@/lib/test-maker/types").QuestionAnswer) => void;
  onDelete: (id: string) => void;
  shellRef?: RefObject<HTMLDivElement | null>;
  listId?: string;
  sectionId?: string;
  isFirstPage?: boolean;
}) {
  const renderColumn = (columnQuestions: TMQuestion[]) =>
    columnQuestions.map((q) => (
      <div key={q.id} className="tm-q-slot relative shrink-0">
        <QuestionItem
          question={q}
          index={questionIndexById.get(q.id) ?? 0}
          config={config}
          showChoices
          choicesDetachedFromLayout
          onAnswer={(letter) => onAnswer(q.id, letter)}
          onDelete={() => onDelete(q.id)}
        />
        <QuestionSolveSpace />
      </div>
    ));

  return (
    <section
      id={sectionId}
      className={cn(A4_QUESTION_PAGE_CLASS, isFirstPage && "tm-q-first-page")}
      style={{ pageBreakAfter: "always" }}
    >
      <div className="tm-q-sheet-header flex h-20 min-h-20 max-h-20 w-full shrink-0 flex-col justify-center overflow-hidden">
        <SheetHeaderBlock config={config} />
      </div>

      <div
        ref={shellRef}
        id={listId}
        className="tm-q-sheet-body relative flex min-h-0 w-full flex-1 flex-row items-start gap-8 overflow-hidden px-8 py-4"
      >
        <div
          className="tm-q-col-spine pointer-events-none absolute bottom-0 left-1/2 top-0 z-[1] w-px -translate-x-1/2"
          aria-hidden
        />

        <div className="tm-q-col-left relative z-[2] flex h-full w-full min-w-0 flex-1 flex-col justify-start gap-8 overflow-hidden">
          {renderColumn(page.left)}
        </div>

        <div className="tm-q-col-right relative z-[2] flex h-full w-full min-w-0 flex-1 flex-col justify-start gap-8 overflow-hidden">
          {renderColumn(page.right)}
        </div>
      </div>

      <div className="tm-q-sheet-footer mt-auto flex h-20 min-h-20 max-h-20 w-full shrink-0 flex-col justify-center overflow-hidden">
        <SheetFooterBlock kurum={config.kurum} />
      </div>
    </section>
  );
}

function A4OpticSheetPage({
  config,
  totalQuestions,
}: {
  config: TMConfig;
  totalQuestions: number;
}) {
  return (
    <section
      id="tm-sheet-optic"
      className={cn(STRICT_A4_PAGE_CLASS, "tm-optic-sheet p-8 print:m-0")}
      style={{ pageBreakAfter: "always" }}
    >
      <div className="flex h-full w-full flex-col items-stretch justify-center print:h-full print:w-full">
        <OptikForm
          totalQuestions={totalQuestions}
          dersLabel={config.dersLabel}
          kurum={config.kurum}
          className="print:h-full print:w-full"
        />
      </div>
    </section>
  );
}

export function A4Document({
  config,
  template,
  questions,
  showCover,
  showAnswerKey,
  showOptic,
  onQuestionsChange,
  onAnswer,
  onDelete,
}: A4DocumentProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const firstPageShellRef = useRef<HTMLDivElement>(null);
  const pagesWrapRef = useRef<HTMLDivElement>(null);
  const measuringContainerRef = useRef<HTMLDivElement>(null);
  const columnProbeBodyRef = useRef<HTMLDivElement>(null);
  const measureSignatureRef = useRef("");
  const stableLayoutRef = useRef<MeasuredQuestionPage[]>([]);
  const paginatedPagesRef = useRef<MeasuredQuestionPage[]>([]);
  const prevQuestionCountRef = useRef(0);

  const [measuredHeights, setMeasuredHeights] = useState<Record<string, number>>({});
  const [columnMaxPx, setColumnMaxPx] = useState(TM_MAX_COLUMN_HEIGHT_PX);
  const [paginatedPages, setPaginatedPages] = useState<MeasuredQuestionPage[]>([]);
  paginatedPagesRef.current = paginatedPages;

  const questionIndexById = useMemo(() => {
    const map = new Map<string, number>();
    questions.forEach((q, i) => map.set(q.id, i));
    return map;
  }, [questions]);

  const measureSignature = useMemo(
    () =>
      questions
        .map(
          (q) =>
            `${q.id}:${q.imageDataUrl.length}:${q.answer ?? ""}:${config.dersLabel}:${config.konuLabel}`
        )
        .join("|"),
    [questions, config.dersLabel, config.konuLabel]
  );

  const paginationReady = useMemo(
    () =>
      questions.length === 0 ||
      questions.every((q) => typeof measuredHeights[q.id] === "number"),
    [questions, measuredHeights]
  );

  useLayoutEffect(() => {
    if (questions.length === 0) {
      setPaginatedPages([]);
      stableLayoutRef.current = [];
      prevQuestionCountRef.current = 0;
      return;
    }

    const heights = buildHeightsWithFallback(questions, measuredHeights);
    const prevCount = prevQuestionCountRef.current;
    const isSingleAppend = questions.length === prevCount + 1 && prevCount > 0;

    let nextPages: MeasuredQuestionPage[] | null = null;

    if (isSingleAppend && paginatedPagesRef.current.length > 0) {
      nextPages = appendQuestionToDisplayLayout(
        questions,
        heights,
        columnMaxPx,
        paginatedPagesRef.current
      );
    }

    if (!nextPages) {
      const heightsProvisional = questions.some((q) => measuredHeights[q.id] === undefined);
      const previousLayout = heightsProvisional
        ? null
        : pickPreviousLayout(questions, paginatedPagesRef.current, stableLayoutRef.current);
      nextPages = paginateForwardOnly(questions, heights, columnMaxPx, previousLayout);
    }

    const currentKey = layoutFlatKey(paginatedPagesRef.current);
    const nextKey = layoutFlatKey(nextPages);

    if (currentKey !== nextKey || paginatedPagesRef.current.length === 0) {
      setPaginatedPages(nextPages);
      stableLayoutRef.current = nextPages.filter((page) => !page.isOpticPage);
    }

    prevQuestionCountRef.current = questions.length;
  }, [questions, measuredHeights, columnMaxPx, measureSignature]);

  useLayoutEffect(() => {
    if (questions.length === 0) {
      setMeasuredHeights({});
      setColumnMaxPx(TM_MAX_COLUMN_HEIGHT_PX);
      measureSignatureRef.current = "";
      return;
    }

    let cancelled = false;

    const runMeasurePass = async () => {
      const container = measuringContainerRef.current;
      const colWidth =
        columnProbeBodyRef.current?.querySelector(".tm-q-col-left")?.clientWidth ??
        TM_COLUMN_CONTENT_WIDTH_PX;

      const provisionalEntries = await Promise.all(
        questions
          .filter((q) => q.imageDataUrl)
          .map(
            async (q) =>
              [q.id, await estimateQuestionHeightFromImage(q.imageDataUrl, colWidth)] as const
          )
      );
      if (!cancelled && provisionalEntries.length > 0) {
        setMeasuredHeights((prev) => {
          const next = { ...prev };
          for (const [id, heightPx] of provisionalEntries) {
            if (next[id] === undefined) next[id] = heightPx;
          }
          return next;
        });
      }

      await new Promise<void>((resolve) => window.setTimeout(resolve, MEASURE_DELAY_MS));
      if (cancelled || !container) return;

      await waitForImages(container);
      if (cancelled) return;

      requestAnimationFrame(() => {
        if (cancelled || !measuringContainerRef.current) return;

        const heights = readMeasuredHeights(measuringContainerRef.current, questions);
        const probeMax = readProbeColumnMaxHeight(columnProbeBodyRef.current);
        const signature = `${measureSignature}:${probeMax}:${JSON.stringify(heights)}`;

        if (signature === measureSignatureRef.current) return;
        measureSignatureRef.current = signature;

        setMeasuredHeights(heights);
        setColumnMaxPx(probeMax);
      });
    };

    void runMeasurePass();

    return () => {
      cancelled = true;
    };
  }, [measureSignature, questions]);

  const displayPages = paginatedPages;

  const akCols = splitAnswerKeyColumns(questions);
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
      draggable: ".tm-q-item",
      group: "tm-questions",
      onEnd: () => setTimeout(applyReorder, 0),
    };

    const attachSortable = (root: ParentNode | null | undefined) => {
      root?.querySelectorAll(".tm-q-col-left, .tm-q-col-right").forEach((el) => {
        instances.push(Sortable.create(el as HTMLElement, opts));
      });
    };

    attachSortable(firstPageShellRef.current);
    pagesWrapRef.current?.querySelectorAll(".tm-q-sheet-body").forEach((el) => {
      if (el !== firstPageShellRef.current) attachSortable(el);
    });

    return () => instances.forEach((s) => s.destroy());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayPages.length, questions.length]);

  const questionPagesToRender = displayPages.length > 0 ? displayPages : [];

  const pagesToRender = useMemo(() => {
    if (!showOptic || questions.length === 0) return questionPagesToRender;
    return [...questionPagesToRender, createOpticPage()];
  }, [questionPagesToRender, showOptic, questions.length]);

  return (
    <div id="tm-a4-page" ref={rootRef} data-tpl={template} className="relative space-y-8">
      <div
        ref={measuringContainerRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 -z-50 opacity-0 print:hidden"
      >
        <div className="flex h-[297mm] w-[210mm] flex-col overflow-hidden bg-white">
          <div className="h-20 min-h-20 max-h-20 shrink-0" aria-hidden />
          <div
            ref={columnProbeBodyRef}
            className="tm-q-sheet-body flex min-h-0 flex-1 flex-row items-start gap-8 overflow-hidden px-8 py-4"
          >
            {/* Gerçek sayfa ile aynı sütun genişliği — tam genişlik ölçümü sağ boşken yeni sayfa açtırıyordu */}
            <div className="tm-q-col-left flex h-full min-w-0 flex-1 flex-col justify-start gap-8 overflow-hidden">
              {questions.map((q) => (
                <div key={`measure-${q.id}`} id={`measure-${q.id}`} className="tm-q-measure-slot shrink-0">
                  <QuestionItem
                    question={q}
                    index={questionIndexById.get(q.id) ?? 0}
                    config={config}
                    showChoices={false}
                    measurementOnly
                    onAnswer={() => {}}
                    onDelete={() => {}}
                  />
                  <QuestionSolveSpace />
                </div>
              ))}
            </div>
            <div
              className="tm-q-col-right flex h-full min-w-0 flex-1 flex-col gap-8 overflow-hidden"
              aria-hidden
            />
          </div>
          <div className="h-20 min-h-20 max-h-20 shrink-0" aria-hidden />
        </div>
      </div>

      <section
        id="tm-sheet-cover"
        className={cn(
          STRICT_A4_PAGE_CLASS,
          "justify-between p-8 print:break-after-page",
          !showCover && "hidden"
        )}
        style={{ pageBreakAfter: "always" }}
        aria-hidden={!showCover}
      >
        <div id="tm-cover-header" className="text-center">
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
        </div>
        <div
          id="tm-cover-footer"
          className="tm-tpl-hdr-bg mt-6 flex items-center justify-center py-3 text-xs font-semibold uppercase tracking-widest"
        >
          <span className="tm-sync-institution">{config.kurum}</span>
        </div>
      </section>

      <div id="tm-q-pages" ref={pagesWrapRef}>
        {pagesToRender.length === 0 ? (
          !paginationReady ? (
            <A4QuestionSheetPage
              sectionId="tm-sheet-questions"
              isFirstPage
              shellRef={firstPageShellRef}
              listId="sortable-list"
              page={{ left: [], right: [], leftH: 0, rightH: 0 }}
              config={config}
              questionIndexById={questionIndexById}
              onAnswer={onAnswer}
              onDelete={onDelete}
            />
          ) : null
        ) : (
          pagesToRender.map((page, pageIdx) =>
            isOpticQuestionPage(page) ? (
              <A4OpticSheetPage
                key="tm-optic-page"
                config={config}
                totalQuestions={questions.length}
              />
            ) : (
              <A4QuestionSheetPage
                key={`page-${pageIdx}-${page.left.map((q) => q.id).join("-")}-${page.right.map((q) => q.id).join("-")}`}
                sectionId={pageIdx === 0 ? "tm-sheet-questions" : undefined}
                isFirstPage={pageIdx === 0}
                shellRef={pageIdx === 0 ? firstPageShellRef : undefined}
                listId={pageIdx === 0 ? "sortable-list" : undefined}
                page={page}
                config={config}
                questionIndexById={questionIndexById}
                onAnswer={onAnswer}
                onDelete={onDelete}
              />
            )
          )
        )}
      </div>

      <section
        id="tm-sheet-answer"
        className={cn(
          "tm-ak-sheet tm-a4-sheet mx-auto min-h-[297mm] w-[210mm] bg-white p-8 print:break-before-page",
          !showAnswerKey && "hidden"
        )}
        aria-hidden={!showAnswerKey}
      >
        <h2 className="tm-ak-sheet__title">Cevap Anahtarı</h2>
        {questions.length > 0 ? (
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
                  const letter = q.answer === "blank" ? null : q.answer?.toUpperCase();
                  const isBlank = q.answer === "blank";
                  const valid =
                    letter && ["A", "B", "C", "D", "E"].includes(letter);
                  return (
                    <div key={q.id} className="tm-ak-row" data-q-id={q.id}>
                      <span className="tm-ak-row__num">{num}.</span>
                      <div className="tm-ak-row__line" aria-hidden />
                      <span
                        className={cn(
                          "tm-ak-row__ans",
                          !valid && !isBlank && "tm-ak-row__ans--empty"
                        )}
                      >
                        {isBlank ? "Boş" : valid ? letter : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-8 text-center text-sm text-slate-400">
            Henüz soru eklenmedi — sorular eklenince cevap anahtarı burada görünür.
          </p>
        )}
      </section>
    </div>
  );
}
