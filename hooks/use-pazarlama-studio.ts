"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { PALETTE_PRESETS, applyBrandToStory, loadBrandState, saveBrandState } from "@/lib/pazarlama/brand";
import { loadCustomState, saveCustomState, DEFAULT_CUSTOM_STATE } from "@/lib/pazarlama/custom-state";
import { findExam, loadMergedExams, resultsForExam } from "@/lib/pazarlama/exams";
import { downloadPngFromStory } from "@/lib/pazarlama/export-story";
import { computePreviewScale } from "@/lib/pazarlama/preview-scale";
import { loadTextState, saveTextState } from "@/lib/pazarlama/text-state";
import { templateMarkup } from "@/lib/pazarlama/templates/markup";
import { renderCountdown } from "@/lib/pazarlama/templates/render-countdown";
import { renderTop10 } from "@/lib/pazarlama/templates/render-leaderboard";
import { renderStar } from "@/lib/pazarlama/templates/render-star";
import { loadTemplateStyleMap, resolveStyle, styleChoicesFor } from "@/lib/pazarlama/template-style";
import type {
  BrandState,
  CountdownCustomState,
  StoryKind,
  TextState,
} from "@/lib/pazarlama/types";
import { onExamResultsChange } from "@/lib/exams/events";
import type { MergedExam } from "@/lib/exams/types";

function bindLeaderboardText(textState: TextState) {
  const lb = textState.leaderboard;
  const badge = document.getElementById("pm-badge");
  const titleEl = document.getElementById("pm-title");
  const boardTitle = document.getElementById("pm-board-title");
  const metric = document.getElementById("pm-board-metric");
  const footRight = document.getElementById("pm-foot-right");
  if (badge && lb.badge) badge.textContent = lb.badge;
  if (titleEl && lb.title) titleEl.textContent = lb.title;
  if (boardTitle && lb.boardTitle) boardTitle.textContent = lb.boardTitle;
  if (metric && lb.metric) metric.textContent = lb.metric;
  if (footRight && lb.footRight) footRight.textContent = lb.footRight;
}

function bindStarText(textState: TextState) {
  const st = textState.star;
  const badge = document.getElementById("pm-badge");
  if (badge && st.badge) badge.textContent = st.badge;
  const sTitle = document.getElementById("pm-star-title");
  const sSub = document.getElementById("pm-star-sub");
  if (sTitle && st.title) sTitle.textContent = st.title;
  if (sSub && st.sub) sSub.textContent = st.sub;
}

export function usePazarlamaStudio() {
  const [mounted, setMounted] = useState(false);
  const [exams, setExams] = useState<MergedExam[]>([]);
  const [kind, setKind] = useState<StoryKind>("leaderboard");
  const [style, setStyle] = useState("1");
  const [examId, setExamId] = useState("");
  const [brand, setBrand] = useState<BrandState>(() => loadBrandState());
  const [textState, setTextState] = useState<TextState>(() => loadTextState());
  const [customState, setCustomState] = useState<CountdownCustomState>(() => loadCustomState());
  const [exporting, setExporting] = useState(false);
  const styleMapRef = useRef(loadTemplateStyleMap());
  const renderGenRef = useRef(0);

  const styleOptions = useMemo(() => styleChoicesFor(kind), [kind]);
  const selectedExam = useMemo(
    () => (examId ? findExam(exams, examId) : null),
    [exams, examId]
  );

  const meta = useMemo(() => {
    if (kind !== "leaderboard" || !examId) {
      return { count: "—", top: "—" };
    }
    const all = resultsForExam(examId);
    return { count: String(all.length), top: String(Math.min(10, all.length)) };
  }, [kind, examId, exams]);

  const refreshExams = useCallback(() => {
    setExams(loadMergedExams());
  }, []);

  const renderFromSelection = useCallback(() => {
    if (typeof document === "undefined") return;
    const gen = ++renderGenRef.current;
    const styleVal = resolveStyle(kind, style, styleMapRef.current);
    if (styleVal !== style) setStyle(styleVal);

    const host = document.getElementById("pm-template-host");
    if (host) host.innerHTML = templateMarkup(kind, styleVal);

    applyBrandToStory(brand);

    const exam = examId ? findExam(exams, examId) : null;
    const metaCount = document.getElementById("pm-meta-count");
    const metaTop = document.getElementById("pm-meta-top");

    if (kind !== "leaderboard") {
      if (metaCount) metaCount.textContent = "—";
      if (metaTop) metaTop.textContent = "—";
    }

    if (kind === "leaderboard") {
      bindLeaderboardText(textState);
      renderTop10(exam, brand, styleVal);
      if (metaCount && exam) metaCount.textContent = String(resultsForExam(exam.id).length);
      if (metaTop && exam) {
        const top = resultsForExam(exam.id).length;
        metaTop.textContent = String(Math.min(10, top));
      }
    } else if (kind === "star") {
      bindStarText(textState);
      renderStar(exams, exam, brand, textState);
    } else {
      renderCountdown(customState, brand, textState);
    }

    if (gen === renderGenRef.current) {
      requestAnimationFrame(() => computePreviewScale());
    }
  }, [kind, style, examId, exams, brand, textState, customState]);

  useEffect(() => {
    setMounted(true);
    refreshExams();
    const unsub = onExamResultsChange(() => refreshExams());
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === "examResults" ||
        e.key === "kurum_denemeler_v1" ||
        e.key === "global_denemeler_v1" ||
        e.key === "globalExams"
      ) {
        refreshExams();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      unsub();
      window.removeEventListener("storage", onStorage);
    };
  }, [refreshExams]);

  useEffect(() => {
    if (!mounted) return;
    renderFromSelection();
  }, [mounted, renderFromSelection]);

  useEffect(() => {
    if (!mounted) return;
    applyBrandToStory(brand);
  }, [mounted, brand]);

  useEffect(() => {
    if (!mounted) return;
    const onResize = () => computePreviewScale();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [mounted]);

  const updateBrand = useCallback((patch: Partial<BrandState>) => {
    setBrand((prev) => {
      const next = { ...prev, ...patch };
      saveBrandState(next);
      return next;
    });
  }, []);

  const applyPalette = useCallback((paletteId: string) => {
    const p = PALETTE_PRESETS[paletteId];
    if (!p) return;
    updateBrand({ ...p, logoDataUrl: brand.logoDataUrl });
  }, [brand.logoDataUrl, updateBrand]);

  const updateText = useCallback((section: keyof TextState, patch: Partial<TextState[keyof TextState]>) => {
    setTextState((prev) => {
      const next = {
        ...prev,
        [section]: { ...prev[section], ...patch },
      } as TextState;
      saveTextState(next);
      return next;
    });
  }, []);

  const updateCustom = useCallback((patch: Partial<CountdownCustomState>) => {
    setCustomState((prev) => {
      const next = { ...prev, ...patch };
      saveCustomState(next);
      return next;
    });
  }, []);

  const onKindChange = (k: StoryKind) => {
    setKind(k);
    const resolved = resolveStyle(k, undefined, styleMapRef.current);
    setStyle(resolved);
  };

  const onStyleChange = (s: string) => {
    styleMapRef.current[kind] = s;
    setStyle(s);
  };

  const exportPng = async () => {
    setExporting(true);
    try {
      await downloadPngFromStory({ kind, style, examId: examId || undefined });
    } catch (err) {
      console.error("[Pazarlama] PNG render hatası:", err);
      alert("PNG oluşturulamadı. Konsolu kontrol edin.");
    } finally {
      setExporting(false);
    }
  };

  const resetCustom = () => {
    setCustomState(DEFAULT_CUSTOM_STATE);
    saveCustomState(DEFAULT_CUSTOM_STATE);
  };

  return {
    mounted,
    exams,
    kind,
    setKind: onKindChange,
    style,
    setStyle: onStyleChange,
    styleOptions,
    examId,
    setExamId,
    brand,
    updateBrand,
    applyPalette,
    textState,
    updateText,
    customState,
    updateCustom,
    resetCustom,
    meta,
    selectedExam,
    refreshExams,
    renderFromSelection,
    exportPng,
    exporting,
    fitPreview: computePreviewScale,
  };
}
