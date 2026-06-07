"use client";

import { Toaster } from "sonner";

import { TOAST_ERROR_MS, TOAST_SUCCESS_MS, TOAST_Z_INDEX } from "@/lib/notify";

/** Tek toast kökü — tüm koç paneli rotalarında aynı konum ve stil */
export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      offset={20}
      closeButton
      expand={false}
      visibleToasts={4}
      gap={10}
      style={{ zIndex: TOAST_Z_INDEX }}
      toastOptions={{
        duration: TOAST_SUCCESS_MS,
        classNames: {
          toast:
            "group !rounded-xl !border !border-slate-200 !bg-white !text-slate-900 !shadow-lg !font-sans !px-4 !py-3",
          title: "!text-[15px] !font-semibold !leading-snug !text-slate-900",
          description: "!text-sm !leading-snug !text-slate-600",
          success: "!border-l-[3px] !border-l-emerald-600",
          error: "!border-l-[3px] !border-l-red-600",
          warning: "!border-l-[3px] !border-l-amber-500",
          info: "!border-l-[3px] !border-l-slate-600",
          closeButton:
            "!absolute !right-2 !top-2 !left-auto !transform-none !border-slate-200 !bg-slate-50 !text-slate-600 hover:!bg-slate-100",
        },
      }}
    />
  );
}

export const toasterDefaults = {
  successMs: TOAST_SUCCESS_MS,
  errorMs: TOAST_ERROR_MS,
} as const;
