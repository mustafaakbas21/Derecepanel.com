"use client";

import { useCallback, useState } from "react";

import type { WeeklyPrintDocumentProps } from "@/components/weekly-planner/weekly-print-document";
import { renderWeeklyPrintSheetHtml } from "@/lib/weekly-planner/render-weekly-print-html";
import { openWeeklyPlannerPrintPreview } from "@/lib/weekly-planner/weekly-print";

export function useWeeklyPrint() {
  const [printing, setPrinting] = useState(false);

  const openPrintPreview = useCallback(
    async (snapshot: WeeklyPrintDocumentProps, documentTitle: string) => {
      setPrinting(true);
      try {
        const sheetHtml = renderWeeklyPrintSheetHtml(snapshot);
        return openWeeklyPlannerPrintPreview(sheetHtml, documentTitle);
      } catch {
        return false;
      } finally {
        setPrinting(false);
      }
    },
    []
  );

  return { printing, openPrintPreview, printPortal: null };
}
