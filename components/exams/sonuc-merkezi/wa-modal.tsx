"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  buildVeliMessage,
  pickPhoneForStudent,
  whatsAppUrl,
} from "@/lib/messaging/whatsapp-veli";
import { studentRowKey } from "@/lib/exams/exam-rank";
import type { ExamResultRow, MergedExam } from "@/lib/exams/types";
import { prepareExamRowsWithPuan } from "@/lib/scoring/four-areas";

import { ModalPortal } from "./modal-portal";
import "./sonuc-merkezi-modals.css";

type WaModalProps = {
  open: boolean;
  exam: MergedExam | null;
  rows: ExamResultRow[];
  onClose: () => void;
};

/** Eski #bds-wa-modal */
export function SonucWaModal({ open, exam, rows, onClose }: WaModalProps) {
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

  if (!open || !exam) return null;

  const examName = exam.name || exam.ad || exam.id;
  const prepared = prepareExamRowsWithPuan(rows, exam);

  return (
    <ModalPortal>
    <div
      id="bds-wa-modal"
      className="sm-modal-root sm-modal-root--picker"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bds-wa-modal-title"
    >
      <button
        type="button"
        className="sm-modal-backdrop"
        data-bds-wa-backdrop
        aria-label="Kapat"
        onClick={onClose}
      />
      <div className="sm-modal-panel sm-modal-panel--wa">
        <div className="border-b border-slate-100 bg-gradient-to-r from-violet-50 to-emerald-50/50 px-4 py-3 sm:px-5">
          <h2 id="bds-wa-modal-title" className="text-base font-extrabold text-slate-900">
            Mesaj gönderimi
          </h2>
          <p id="bds-wa-modal-sub" className="mt-0.5 text-xs font-medium text-slate-600">
            {examName} · {prepared.length} öğrenci
          </p>
        </div>
        <div
          id="bds-wa-modal-body"
          className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4 sm:p-5"
          role="list"
        >
          {!prepared.length ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              Bu sınav için sonuç kaydı yok.
            </p>
          ) : (
            prepared.map((r) => {
              const nm = r.name || r.studentName || "—";
              const net = r.net != null ? Number(r.net).toFixed(2) : "0.00";
              const phone = pickPhoneForStudent(r);
              const msg = buildVeliMessage(nm, String(examName), net);
              const href = whatsAppUrl(phone, msg);
              return (
                <div
                  key={studentRowKey(r)}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-3 py-3 shadow-sm ring-1 ring-slate-900/[0.03]"
                  role="listitem"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-900">{nm}</div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      Net: <strong className="text-slate-800">{net}</strong>
                      {phone ? (
                        <>
                          {" "}
                          · <span className="font-mono text-slate-700">{phone}</span>
                        </>
                      ) : (
                        <span className="text-amber-600"> · Telefon yok</span>
                      )}
                    </div>
                  </div>
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bds-wa-send shrink-0 rounded-lg bg-[#25D366] px-3 py-2 text-xs font-bold text-white shadow hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    >
                      WhatsApp&apos;tan gönder
                    </a>
                  ) : (
                    <span className="text-xs font-semibold text-amber-600">Telefon yok</span>
                  )}
                </div>
              );
            })
          )}
        </div>
        <div className="flex justify-end border-t border-slate-100 bg-slate-50/80 px-4 py-3 sm:px-5">
          <Button type="button" id="bds-wa-modal-close" variant="outline" onClick={onClose}>
            Kapat
          </Button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
