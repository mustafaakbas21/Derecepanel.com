"use client";

import { useRef, useState } from "react";
import { toast } from "@/lib/notify";

import {
  applyExcelBundlesToMatrix,
  bundleToPreview,
  downloadExcelTemplate,
  parseExcelToBundles,
  type ExcelPreviewRow,
  type ExcelRowBundle,
} from "@/lib/exams/excel-matrix";
import type { MatrixState } from "@/hooks/use-exam-matrix";
import type { SinavTipi } from "@/lib/exams/types";

type Props = {
  open: boolean;
  onClose: () => void;
  sinav: SinavTipi;
  matrix: MatrixState;
  onApply: (merged: Pick<MatrixState, "cevaplar" | "zorluk" | "konu" | "konuYazi">) => void;
};

export function ExcelOverlay({ open, onClose, sinav, matrix, onApply }: Props) {
  const [preview, setPreview] = useState<ExcelPreviewRow[] | null>(null);
  const [bundles, setBundles] = useState<ExcelRowBundle[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFile = async (file: File) => {
    try {
      const isCsv = /\.csv$/i.test(file.name);
      const payload = isCsv ? await file.text() : await file.arrayBuffer();
      const parsed = await parseExcelToBundles(payload, { isCsv });
      if (!parsed.length) {
        toast.error("Excel dosyasında geçerli satır bulunamadı");
        return;
      }
      setBundles(parsed);
      setPreview(parsed.map((b, i) => bundleToPreview(b, i)));
      toast.success("Dosya okundu — önizlemeyi kontrol edin");
    } catch {
      toast.error("Excel kütüphanesi yüklenemedi veya dosya okunamadı");
    }
  };

  return (
    <div
      className="kdy-excel-overlay is-open"
      id="kdy-excel-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="kdy-excel-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="kdy-excel-modal" role="document" onClick={(e) => e.stopPropagation()}>
        <div className="kdy-excel-head">
          <div className="kdy-excel-head__text">
            <h3 className="kdy-excel-title" id="kdy-excel-title">
              Excel Şablon Sihirbazı
            </h3>
            <p className="kdy-excel-sub">Matris bilgilerini Excel ile hızlı ve hatasız doldurun.</p>
          </div>
          <button
            type="button"
            className="kdy-modal__close btn-icon kdy-excel-close"
            id="kdy-excel-close"
            aria-label="Kapat"
            onClick={onClose}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="kdy-excel-grid">
          <button
            type="button"
            className="kdy-excel-card kdy-excel-card--download"
            id="kdy-excel-download"
            onClick={() => void downloadExcelTemplate(sinav, "deneme_sablonu.xlsx")}
          >
            <span className="kdy-excel-card__icon" aria-hidden>
              📥
            </span>
            <span className="kdy-excel-card__title">Hazır Şablonu İndir</span>
            <span className="kdy-excel-card__desc">
              Sisteme tam uyumlu boş Excel formatını bilgisayarınıza indirin.
            </span>
          </button>

          <button
            type="button"
            className="kdy-excel-card kdy-excel-card--import"
            id="kdy-excel-import"
            onClick={() => fileRef.current?.click()}
          >
            <span className="kdy-excel-card__icon" aria-hidden>
              🚀
            </span>
            <span className="kdy-excel-card__title">Şablonu İçeri Aktar</span>
            <span className="kdy-excel-card__desc">
              Doldurduğunuz Excel dosyasını yükleyin ve soruları otomatik dağıtın.
            </span>
            <input
              ref={fileRef}
              type="file"
              id="kdy-excel-file"
              className="kdy-excel-file"
              accept=".xlsx,.xls,.csv"
              aria-label="Excel dosyası seç"
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
                e.target.value = "";
              }}
            />
          </button>
        </div>

        {preview && (
          <div id="kdy-excel-preview" className="kdy-excel-preview">
            <p id="kdy-excel-preview-meta" className="kdy-excel-preview__meta">
              {preview.length} satır okundu
              {preview.length > 20 ? " — tabloda kaydırarak tümünü görün" : ""} — matrise
              aktarın.
            </p>
            <div className="kdy-excel-preview__scroll kdy-excel-preview__scroll--tall">
              <table className="kdy-excel-preview__table" aria-label="Excel önizleme">
                <thead>
                  <tr>
                    <th>Soru No</th>
                    <th>Doğru Cevap</th>
                    <th>Konu (ders)</th>
                    <th>Kavram</th>
                    <th>Zorluk</th>
                  </tr>
                </thead>
                <tbody id="kdy-excel-preview-tbody">
                  {preview.map((r) => (
                    <tr key={r.soruNo}>
                      <td>{r.soruNo}</td>
                      <td>{r.cevap || "—"}</td>
                      <td>{r.dersLabel || "—"}</td>
                      <td>{r.kavramLabel || "—"}</td>
                      <td>{r.zorluk}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="kdy-excel-preview__actions">
              <button
                type="button"
                className="btn-add"
                id="kdy-excel-apply"
                onClick={() => {
                  if (!bundles?.length) return;
                  const next = applyExcelBundlesToMatrix(bundles, sinav, matrix);
                  const applied = next.cevaplar.filter(Boolean).length;
                  onApply(next);
                  setPreview(null);
                  setBundles(null);
                  onClose();
                  toast.success(
                    `${bundles.length} satır işlendi · ${applied} cevap matrise yazıldı`
                  );
                }}
              >
                Matrise aktar
              </button>
            </div>
          </div>
        )}

        <p className="kdy-excel-footnote" role="note">
          Sütun başlıkları: Soru No, Doğru Cevap, Konu (ders adı), Kavram (müfredat konusu), Zorluk
        </p>
      </div>
    </div>
  );
}
