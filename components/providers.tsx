"use client";

import { Toaster } from "sonner";

import { TOAST_ERROR_MS, TOAST_SUCCESS_MS } from "@/lib/students/import/constants";

export function AppToaster() {
  return (
    <Toaster
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        duration: TOAST_SUCCESS_MS,
        classNames: {
          toast:
            "rounded-xl border border-slate-200 bg-white text-slate-900 shadow-lg font-medium",
          success: "border-emerald-200 bg-emerald-50 text-emerald-900",
          error: "border-red-200 bg-red-50 text-red-900",
          warning: "border-amber-200 bg-amber-50 text-amber-900",
          info: "border-sky-200 bg-sky-50 text-sky-900",
        },
      }}
      /** Hata toast'ları daha uzun gösterilir */
      expand
    />
  );
}

/** Sonner global süre — notify.ts içinde toast başına override edilir */
export const toasterDefaults = {
  successMs: TOAST_SUCCESS_MS,
  errorMs: TOAST_ERROR_MS,
} as const;
