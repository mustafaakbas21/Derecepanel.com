import type { TMQuestion } from "@/lib/test-maker/types";

/** Varsayılan sütun tavanı — probe ile gerçek değer alınır */
export const TM_MAX_COLUMN_HEIGHT_PX = 800;

/** Sütun içi soru aralığı — Tailwind gap-8 (32px) */
export const TM_QUESTION_GAP_PX = 32;

export type MeasuredQuestionPage = {
  left: TMQuestion[];
  right: TMQuestion[];
  leftH: number;
  rightH: number;
  /** Optik form sayfası — soru sütunları boş */
  isOpticPage?: boolean;
};

export function createOpticPage(): MeasuredQuestionPage {
  return { left: [], right: [], leftH: 0, rightH: 0, isOpticPage: true };
}

export function isOpticQuestionPage(page: MeasuredQuestionPage): boolean {
  return page.isOpticPage === true;
}

export type QuestionSheetPage = {
  left: TMQuestion[];
  right: TMQuestion[];
};

/** @deprecated MeasuredQuestionPage kullanın */
export type DynamicQuestionPage = QuestionSheetPage;

const FALLBACK_QUESTION_HEIGHT_PX = 300;

type ColumnSlot = {
  items: TMQuestion[];
  usedPx: number;
};

function emptyPage(): MeasuredQuestionPage {
  return { left: [], right: [], leftH: 0, rightH: 0 };
}

function emptyColumn(): ColumnSlot {
  return { items: [], usedPx: 0 };
}

/** Tek soru bloğu — yalnızca içerik; gap sütunda ayrı eklenir */
export function getQuestionContentHeight(contentHeightPx: number): number {
  return contentHeightPx;
}

/** Sütuna eklenecek blok yüksekliği (içerik + aralık) */
export function getQuestionBlockHeight(
  contentHeightPx: number,
  indexInColumn: number
): number {
  const content = getQuestionContentHeight(contentHeightPx);
  return content + (indexInColumn > 0 ? TM_QUESTION_GAP_PX : 0);
}

/** @deprecated getQuestionBlockHeight(content, index) kullanın */
export function getQuestionHeight(contentHeightPx: number): number {
  return contentHeightPx + TM_QUESTION_GAP_PX;
}

function canAddToColumn(
  column: ColumnSlot,
  blockPx: number,
  maxColumnHeight: number
): boolean {
  return column.usedPx + blockPx <= maxColumnHeight;
}

function addToColumn(column: ColumnSlot, q: TMQuestion, blockPx: number): void {
  column.items.push(q);
  column.usedPx += blockPx;
}

function syncPageFromColumns(
  page: MeasuredQuestionPage,
  left: ColumnSlot,
  right: ColumnSlot
): void {
  page.left = left.items;
  page.right = right.items;
  page.leftH = left.usedPx;
  page.rightH = right.usedPx;
}

function clonePages(pages: MeasuredQuestionPage[]): MeasuredQuestionPage[] {
  return pages.map((page) => ({
    left: [...page.left],
    right: [...page.right],
    leftH: page.leftH,
    rightH: page.rightH,
  }));
}

function pruneEmptyPages(pages: MeasuredQuestionPage[]): MeasuredQuestionPage[] {
  return pages.filter((page) => page.left.length > 0 || page.right.length > 0);
}

/** Sol sütun boş, sağ dolu sayfaları düzelt */
function normalizePagesLeftFirst(
  pages: MeasuredQuestionPage[],
  heights: Record<string, number>
): MeasuredQuestionPage[] {
  for (const page of pages) {
    while (page.left.length === 0 && page.right.length > 0) {
      page.left.push(page.right.shift()!);
    }
    resyncPageHeights(page, heights);
  }
  return pages;
}

function sumColumnHeightsFromItems(
  items: TMQuestion[],
  heights: Record<string, number> | null
): number {
  let total = 0;
  items.forEach((q, index) => {
    const h = heights
      ? heights[q.id] ?? FALLBACK_QUESTION_HEIGHT_PX
      : FALLBACK_QUESTION_HEIGHT_PX;
    total += getQuestionBlockHeight(h, index);
  });
  return total;
}

function resyncPageHeights(
  page: MeasuredQuestionPage,
  heights: Record<string, number>
): void {
  page.leftH = sumColumnHeightsFromItems(page.left, heights);
  page.rightH = sumColumnHeightsFromItems(page.right, heights);
}

/**
 * Dizgi motoru — katı sıra: sol sütun → sağ sütun → yeni sayfa (yine sol).
 * Her sayfa önce soldan başlar; sağa yalnızca sol dolunca geçilir.
 */
export function paginateByMeasuredHeights(
  questions: TMQuestion[],
  heights: Record<string, number>,
  maxColumnHeight: number = TM_MAX_COLUMN_HEIGHT_PX
): MeasuredQuestionPage[] {
  if (questions.length === 0) return [];

  const pages: MeasuredQuestionPage[] = [];
  let left = emptyColumn();
  let right = emptyColumn();

  const flushPage = () => {
    if (left.items.length === 0 && right.items.length === 0) return;
    const page = emptyPage();
    syncPageFromColumns(page, left, right);
    pages.push(page);
    left = emptyColumn();
    right = emptyColumn();
  };

  for (const q of questions) {
    const contentH = heights[q.id] ?? FALLBACK_QUESTION_HEIGHT_PX;

    // Yeni sayfa veya sol boş — her zaman önce sol
    if (left.items.length === 0) {
      addToColumn(left, q, getQuestionBlockHeight(contentH, 0));
      continue;
    }

    const leftBlock = getQuestionBlockHeight(contentH, left.items.length);
    if (canAddToColumn(left, leftBlock, maxColumnHeight)) {
      addToColumn(left, q, leftBlock);
      continue;
    }

    const rightBlock = getQuestionBlockHeight(contentH, right.items.length);
    if (canAddToColumn(right, rightBlock, maxColumnHeight)) {
      addToColumn(right, q, rightBlock);
      continue;
    }

    flushPage();
    addToColumn(left, q, getQuestionBlockHeight(contentH, 0));
  }

  flushPage();
  return pruneEmptyPages(normalizePagesLeftFirst(pages, heights));
}

/** DOM sütun ölçümü */
export type ColumnDomMetrics = {
  clientHeight: number;
  usedHeight: number;
};

export function readColumnDomMetrics(col: HTMLElement | null): ColumnDomMetrics {
  if (!col) return { clientHeight: 0, usedHeight: 0 };

  const slots = Array.from(col.querySelectorAll(".tm-q-slot")) as HTMLElement[];
  let used = 0;
  slots.forEach((slot, index) => {
    used += Math.ceil(slot.getBoundingClientRect().height);
    if (index > 0) used += TM_QUESTION_GAP_PX;
  });

  return { clientHeight: col.clientHeight, usedHeight: used };
}

export function columnRemainingPx(metrics: ColumnDomMetrics, bufferPx = 4): number {
  const gap = metrics.usedHeight > 0 ? TM_QUESTION_GAP_PX : 0;
  return metrics.clientHeight - metrics.usedHeight - gap - bufferPx;
}

/** DOM'da kalan alana soru sığar mı? */
export function questionFitsColumnDom(
  metrics: ColumnDomMetrics,
  questionHeightPx: number,
  bufferPx = 4
): boolean {
  if (metrics.clientHeight <= 0) return false;
  return columnRemainingPx(metrics, bufferPx) >= questionHeightPx;
}

function popFromColumn(
  page: MeasuredQuestionPage,
  side: "left" | "right"
): TMQuestion | null {
  const col = side === "left" ? page.left : page.right;
  if (col.length === 0) return null;
  const q = col.pop()!;
  return q;
}

function unshiftToColumn(
  page: MeasuredQuestionPage,
  side: "left" | "right",
  q: TMQuestion
): void {
  if (side === "left") page.left.unshift(q);
  else page.right.unshift(q);
}

function pushToColumn(
  page: MeasuredQuestionPage,
  side: "left" | "right",
  q: TMQuestion
): void {
  if (side === "left") page.left.push(q);
  else page.right.push(q);
}

/**
 * Render sonrası dizgi rafine — taşmayı gider, boş sayfaları sil,
 * sonraki sayfadan önceki sayfaya DOM ile gerçek sığma kontrolü.
 */
export function refineLayoutWithDom(
  pages: MeasuredQuestionPage[],
  heights: Record<string, number>,
  pageMetrics: Array<{ left: ColumnDomMetrics; right: ColumnDomMetrics }>
): MeasuredQuestionPage[] | null {
  if (pages.length === 0) return null;
  if (pageMetrics.length !== pages.length) return null;

  const result = clonePages(pages);
  let changed = false;

  // 1) Sonraki sayfadan önceki sayfaya çek — önce sağ, sonra sol (DOM kalan alan)
  for (let pageIdx = 0; pageIdx < result.length - 1; pageIdx += 1) {
    const metrics = pageMetrics[pageIdx];
    const page = result[pageIdx]!;
    const nextPage = result[pageIdx + 1]!;
    if (!metrics) continue;

    const targets: Array<"right" | "left"> =
      page.left.length > 0 ? ["right", "left"] : ["left"];

    while (nextPage.left.length > 0) {
      const candidate = nextPage.left[0]!;
      const blockH = heights[candidate.id] ?? FALLBACK_QUESTION_HEIGHT_PX;
      let placed = false;

      for (const side of targets) {
        const colMetrics = side === "left" ? metrics.left : metrics.right;
        if (!questionFitsColumnDom(colMetrics, blockH)) continue;

        nextPage.left.shift();
        pushToColumn(page, side, candidate);
        resyncPageHeights(page, heights);
        resyncPageHeights(nextPage, heights);
        changed = true;
        placed = true;
        break;
      }

      if (!placed) break;
    }
  }

  // 2) Taşan sütundan son soruyu önce aynı sayfanın diğer sütununa, olmazsa sonraki sayfaya aktar
  for (let pageIdx = 0; pageIdx < result.length; pageIdx += 1) {
    const metrics = pageMetrics[pageIdx];
    const page = result[pageIdx]!;
    if (!metrics) continue;

    for (const side of ["left", "right"] as const) {
      const colMetrics = side === "left" ? metrics.left : metrics.right;
      const col = side === "left" ? page.left : page.right;
      if (col.length === 0) continue;

      const max = colMetrics.clientHeight;
      if (max <= 0) continue;

      const used = colMetrics.usedHeight;
      if (used <= max + 2) continue;

      const overflowQ = popFromColumn(page, side);
      if (!overflowQ) continue;

      const blockH = heights[overflowQ.id] ?? FALLBACK_QUESTION_HEIGHT_PX;
      let placed = false;

      if (side === "left") {
        const rightMetrics = metrics.right;
        if (questionFitsColumnDom(rightMetrics, blockH)) {
          pushToColumn(page, "right", overflowQ);
          placed = true;
        }
      }

      if (!placed) {
        const nextPage =
          result[pageIdx + 1] ??
          (() => {
            const fresh = emptyPage();
            result.push(fresh);
            return fresh;
          })();

        unshiftToColumn(nextPage, "left", overflowQ);
        resyncPageHeights(nextPage, heights);
      }

      resyncPageHeights(page, heights);
      changed = true;
      break;
    }
  }

  const normalized = normalizePagesLeftFirst(result, heights);
  const pruned = pruneEmptyPages(normalized);

  if (!changed && pruned.length === pages.length) {
    const same = pruned.every((page, i) => {
      const prev = pages[i];
      if (!prev) return false;
      return (
        page.left.map((q) => q.id).join() === prev.left.map((q) => q.id).join() &&
        page.right.map((q) => q.id).join() === prev.right.map((q) => q.id).join()
      );
    });
    if (same) return null;
  }

  return pruned;
}

/** Sayfa sütunlarından soru sırası — sol üstten alta, sonra sağ */
export function concatPageColumnIds(leftIds: string[], rightIds: string[]): string[] {
  return [...leftIds, ...rightIds];
}

export function collectPageColumnIdsFromDom(container: ParentNode): string[] {
  const left = Array.from(container.querySelectorAll(".tm-q-col-left .tm-q-item"))
    .map((el) => el.getAttribute("data-q-id"))
    .filter(Boolean) as string[];
  const right = Array.from(container.querySelectorAll(".tm-q-col-right .tm-q-item"))
    .map((el) => el.getAttribute("data-q-id"))
    .filter(Boolean) as string[];
  return concatPageColumnIds(left, right);
}

/** @deprecated collectPageColumnIdsFromDom kullanın */
export const collectSplitColumnIdsFromDom = collectPageColumnIdsFromDom;

export function buildAnswerKey(questions: TMQuestion[]): string {
  return questions
    .map((q) => {
      if (q.answer === "blank") return "-";
      const a = q.answer?.toUpperCase() ?? "";
      return /^[A-E]$/.test(a) ? a : " ";
    })
    .join("");
}

export function splitAnswerKeyColumns(questions: TMQuestion[]) {
  const n = questions.length;
  if (n === 0) return [[], [], []] as TMQuestion[][];
  const perCol = Math.ceil(n / 3);
  return [
    questions.slice(0, perCol),
    questions.slice(perCol, perCol * 2),
    questions.slice(perCol * 2),
  ];
}
