"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { printSonucReportInPage } from "@/lib/exams/sonuc-print";
import { toast } from "@/lib/notify";
import { cn } from "@/lib/utils";

import { ModalPortal } from "./modal-portal";
import "./sonuc-merkezi-modals.css";
import "@/styles/print-a4-global.css";
import "@/styles/sonuc-merkezi-print.css";

type SonucReportModalProps = {
  open: boolean;
  title: string;
  html: string;
  onClose: () => void;
};

/** Eski #bds-modal — tam ekran önizleme + Yazdır / PDF */
export function SonucReportModal({ open, title, html, onClose }: SonucReportModalProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const handlePrint = () => {
    if (!html.trim()) {
      toast.message("Yazdırılacak içerik yok.");
      return;
    }
    printSonucReportInPage();
  };

  return (
    <ModalPortal>
      <div
        id="bds-modal"
        className="sm-modal-root sm-modal-root--report"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bds-modal-title"
      >
        <button
          type="button"
          id="bds-modal-backdrop"
          className="sm-modal-backdrop"
          aria-label="Kapat"
          onClick={onClose}
        />
        <div id="bds-modal-panel" className="sm-modal-panel sm-modal-panel--report">
          <div className="bds-no-print sm-modal-toolbar">
            <h2 id="bds-modal-title" className="truncate text-sm font-extrabold text-slate-900 sm:text-base">
              {title}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" id="bds-modal-print" variant="outline" size="sm" onClick={handlePrint}>
                <span aria-hidden="true" className="mr-1">
                  🖨️
                </span>
                Yazdır / PDF Al
              </Button>
              <Button type="button" id="bds-modal-close" variant="primary" size="sm" onClick={onClose}>
                Kapat
              </Button>
            </div>
          </div>
          <div
            id="bds-modal-body"
            className={cn("sm-modal-body sm-modal-body--report", "bds-karne-print-host")}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </ModalPortal>
  );
}
