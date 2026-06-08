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

export const FALLBACK_QUESTION_HEIGHT_PX = 300;

export function buildHeightsWithFallback(
  questions: TMQuestion[],
  measuredHeights: Record<string, number>
): Record<string, number> {
  const heights: Record<string, number> = { ...measuredHeights };
  for (const q of questions) {
    if (typeof heights[q.id] !== "number") {
      heights[q.id] = FALLBACK_QUESTION_HEIGHT_PX;
    }
  }
  return heights;
}

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

function contentPages(pages: MeasuredQuestionPage[]): MeasuredQuestionPage[] {
  return pages.filter((page) => !page.isOpticPage);
}

/** Ekrandaki veya son kararlı dizgiden önceki yerleşimi seç — yeni kırpmada geriye dönme. */
export function pickPreviousLayout(
  questions: TMQuestion[],
  displayPages: MeasuredQuestionPage[],
  stablePages: MeasuredQuestionPage[]
): MeasuredQuestionPage[] | null {
  const candidates = [contentPages(displayPages), contentPages(stablePages)];

  for (const pages of candidates) {
    if (pages.length === 0) continue;
    const layoutIds = flattenPagesQuestionIds(pages);
    if (layoutIds.length === 0 || layoutIds.length > questions.length) continue;
    const prefix = questions.slice(0, layoutIds.length).map((q) => q.id);
    if (layoutIds.every((id, index) => id === prefix[index])) {
      return pages;
    }
  }

  return null;
}

/** Sayfa sütunlarından soru kimlikleri — sol üstten alta, sonra sağ */
export function flattenPagesQuestionIds(pages: MeasuredQuestionPage[]): string[] {
  const ids: string[] = [];
  for (const page of pages) {
    if (page.isOpticPage) continue;
    ids.push(...page.left.map((q) => q.id), ...page.right.map((q) => q.id));
  }
  return ids;
}

function buildMinPageIndex(pages: MeasuredQuestionPage[]): Map<string, number> {
  const minPageIndex = new Map<string, number>();
  pages.forEach((page, pageIdx) => {
    if (page.isOpticPage) return;
    for (const q of [...page.left, ...page.right]) {
      minPageIndex.set(q.id, pageIdx);
    }
  });
  return minPageIndex;
}

function appendQuestionsToLayout(
  pages: MeasuredQuestionPage[],
  newQuestions: TMQuestion[],
  heights: Record<string, number>,
  maxColumnHeight: number
): MeasuredQuestionPage[] {
  if (newQuestions.length === 0) return pages;

  const result = clonePages(pages);
  if (result.length === 0) result.push(emptyPage());

  let pageIdx = result.length - 1;
  let leftItems = [...result[pageIdx]!.left];
  let rightItems = [...result[pageIdx]!.right];
  let leftUsed = sumColumnHeightsFromItems(leftItems, heights);
  let rightUsed = sumColumnHeightsFromItems(rightItems, heights);

  const syncLastPage = () => {
    result[pageIdx] = {
      left: leftItems,
      right: rightItems,
      leftH: leftUsed,
      rightH: rightUsed,
    };
  };

  const tryPlaceOnCurrentPage = (q: TMQuestion): boolean => {
    const contentH = heights[q.id] ?? FALLBACK_QUESTION_HEIGHT_PX;

    if (leftItems.length === 0) {
      const block = getQuestionBlockHeight(contentH, 0);
      if (block > maxColumnHeight) return false;
      leftItems = [q];
      leftUsed = block;
      syncLastPage();
      return true;
    }

    const leftBlock = getQuestionBlockHeight(contentH, leftItems.length);
    if (leftUsed + leftBlock <= maxColumnHeight) {
      leftItems.push(q);
      leftUsed += leftBlock;
      syncLastPage();
      return true;
    }

    const rightBlock = getQuestionBlockHeight(contentH, rightItems.length);
    if (rightUsed + rightBlock <= maxColumnHeight) {
      rightItems.push(q);
      rightUsed += rightBlock;
      syncLastPage();
      return true;
    }

    return false;
  };

  for (const q of newQuestions) {
    if (tryPlaceOnCurrentPage(q)) continue;

    pageIdx += 1;
    result.push(emptyPage());
    leftItems = [];
    rightItems = [];
    leftUsed = 0;
    rightUsed = 0;

    const contentH = heights[q.id] ?? FALLBACK_QUESTION_HEIGHT_PX;
    const block = getQuestionBlockHeight(contentH, 0);
    leftItems = [q];
    leftUsed = block;
    syncLastPage();
  }

  return result;
}

/**
 * Yeni sayfaya geçildikten sonra eski sayfalara geri doldurma yapma.
 * Önceki dizgiyi baz al: yalnızca sona ekle veya taşmayı ileri kaydır.
 */
export function paginateForwardOnly(
  questions: TMQuestion[],
  heights: Record<string, number>,
  maxColumnHeight: number,
  previousPages: MeasuredQuestionPage[] | null
): MeasuredQuestionPage[] {
  if (questions.length === 0) return [];
  if (!previousPages?.length) {
    return paginateByMeasuredHeights(questions, heights, maxColumnHeight);
  }

  const contentPages = previousPages.filter((page) => !page.isOpticPage);
  const prevIds = flattenPagesQuestionIds(contentPages);
  const currIds = questions.map((q) => q.id);

  const isAppendOnly =
    currIds.length > prevIds.length &&
    prevIds.every((id, index) => currIds[index] === id);

  if (isAppendOnly) {
    const appended = questions.slice(prevIds.length);
    return finalizeForwardPages(
      appendQuestionsToLayout(clonePages(contentPages), appended, heights, maxColumnHeight),
      heights
    );
  }

  const sameOrder =
    currIds.length === prevIds.length &&
    currIds.every((id, index) => id === prevIds[index]);

  if (sameOrder) {
    return paginateWithMinPageConstraints(
      questions,
      heights,
      maxColumnHeight,
      buildMinPageIndex(contentPages)
    );
  }

  return paginateByMeasuredHeights(questions, heights, maxColumnHeight);
}

function finalizeForwardPages(
  pages: MeasuredQuestionPage[],
  heights: Record<string, number>
): MeasuredQuestionPage[] {
  return pruneEmptyPages(normalizePagesLeftFirst(pages, heights));
}

function paginateWithMinPageConstraints(
  questions: TMQuestion[],
  heights: Record<string, number>,
  maxColumnHeight: number,
  minPageIndex: Map<string, number>
): MeasuredQuestionPage[] {
  if (questions.length === 0) return [];

  const pages: MeasuredQuestionPage[] = [];
  let left = emptyColumn();
  let right = emptyColumn();
  let pageIdx = 0;
  let lastAssignedPage = 0;

  const commitPage = () => {
    if (left.items.length === 0 && right.items.length === 0) return;
    while (pages.length <= pageIdx) pages.push(emptyPage());
    syncPageFromColumns(pages[pageIdx]!, left, right);
    pageIdx += 1;
    left = emptyColumn();
    right = emptyColumn();
  };

  const placeOnOpenPage = (q: TMQuestion): boolean => {
    const contentH = heights[q.id] ?? FALLBACK_QUESTION_HEIGHT_PX;

    if (left.items.length === 0) {
      addToColumn(left, q, getQuestionBlockHeight(contentH, 0));
      return true;
    }

    const leftBlock = getQuestionBlockHeight(contentH, left.items.length);
    if (canAddToColumn(left, leftBlock, maxColumnHeight)) {
      addToColumn(left, q, leftBlock);
      return true;
    }

    const rightBlock = getQuestionBlockHeight(contentH, right.items.length);
    if (canAddToColumn(right, rightBlock, maxColumnHeight)) {
      addToColumn(right, q, rightBlock);
      return true;
    }

    return false;
  };

  for (const q of questions) {
    const minPage = minPageIndex.has(q.id) ? minPageIndex.get(q.id)! : lastAssignedPage;

    while (pageIdx < minPage) commitPage();

    if (!placeOnOpenPage(q)) {
      commitPage();
      while (pageIdx < minPage) commitPage();
      while (!placeOnOpenPage(q)) commitPage();
    }

    lastAssignedPage = Math.max(lastAssignedPage, pageIdx);
  }

  commitPage();
  return finalizeForwardPages(pages, heights);
}

export function layoutFlatKey(pages: MeasuredQuestionPage[]): string {
  return flattenPagesQuestionIds(contentPages(pages)).join("|");
}

/** Tek soru eklendiğinde mevcut ekran dizgisinin sonuna yerleştir. */
export function appendQuestionToDisplayLayout(
  questions: TMQuestion[],
  heights: Record<string, number>,
  maxColumnHeight: number,
  displayPages: MeasuredQuestionPage[]
): MeasuredQuestionPage[] | null {
  const previous = pickPreviousLayout(questions, displayPages, []);
  if (!previous) return null;

  const prevIds = flattenPagesQuestionIds(previous);
  const appended = questions.slice(prevIds.length);
  if (appended.length === 0) return null;

  return finalizeForwardPages(
    appendQuestionsToLayout(clonePages(previous), appended, heights, maxColumnHeight),
    heights
  );
}

/**
 * Render sonrası dizgi rafine — yalnızca taşmayı ileri kaydırır.
 * Eski sayfalara geri doldurma yapılmaz (yeni sayfadan sonra geri sarma yok).
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

  // Taşan sütundan son soruyu önce aynı sayfanın diğer sütununa, olmazsa sonraki sayfaya aktar
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
