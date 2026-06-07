"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileText, Sparkles, Upload } from "lucide-react";
import { toast } from "@/lib/notify";

import { Button } from "@/components/ui/button";
import { applyPdfRowsToMatrix } from "@/lib/pdfEngine/apply";
import type { PdfParseRow, PdfParseResult } from "@/lib/pdfEngine/types";
import { getExamLayout } from "@/lib/exams/exam-layout";
import { getDersById } from "@/lib/mufredat";
import { createEmptyMatrix, type MatrixState } from "@/hooks/use-exam-matrix";
import type { SinavTipi } from "@/lib/exams/types";

type Props = {
  open: boolean;
  onClose: () => void;
  sinav: SinavTipi;
  matrix: MatrixState;
  onApply: (merged: Pick<MatrixState, "cevaplar" | "zorluk" | "konu" | "konuYazi">) => void;
  onSinavChange?: (sinav: SinavTipi) => void;
};

type Phase = "setup" | "idle" | "scanning" | "preview" | "error";

const SINAV_OPTIONS: { id: SinavTipi; label: string; hint: string }[] = [
  { id: "TYT", label: "TYT", hint: "120 soru · ÖSYM" },
  { id: "AYT", label: "AYT", hint: "160 soru · ÖSYM" },
  { id: "YDT", label: "YDT", hint: "80 soru · Yabancı dil" },
];

export function PdfAutonomousOverlay({
  open,
  onClose,
  sinav: wizardSinav,
  matrix,
  onApply,
  onSinavChange,
}: Props) {
  const [scanSinav, setScanSinav] = useState<SinavTipi>(wizardSinav);
  const [phase, setPhase] = useState<Phase>("setup");
  const [rows, setRows] = useState<PdfParseRow[] | null>(null);
  const [meta, setMeta] = useState<PdfParseResult["meta"] | null>(null);
  const [booklet, setBooklet] = useState<PdfParseResult["booklet"]>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [fileLabel, setFileLabel] = useState("");
  const [dropOver, setDropOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const subjectBlocks = useMemo(() => {
    const layout = getExamLayout(scanSinav);
    const seen = new Set<string>();
    const blocks: { subjectId: string; title: string; count: number; topicCount: number }[] = [];
    for (const cell of layout.byIndex) {
      if (!cell.subjectId || seen.has(cell.subjectId)) continue;
      seen.add(cell.subjectId);
      const n = layout.byIndex.filter((c) => c.subjectId === cell.subjectId).length;
      const ders = getDersById(cell.subjectId);
      blocks.push({
        subjectId: cell.subjectId,
        title: ders?.dersAdi || cell.sectionTitle,
        count: n,
        topicCount: ders?.konular?.length ?? 0,
      });
    }
    return blocks;
  }, [scanSinav]);

  const reset = useCallback(() => {
    setPhase("setup");
    setRows(null);
    setMeta(null);
    setBooklet(null);
    setWarnings([]);
    setFileLabel("");
    setDropOver(false);
    setScanSinav(wizardSinav);
  }, [wizardSinav]);

  useEffect(() => {
    if (!open) reset();
    else setScanSinav(wizardSinav);
  }, [open, reset, wizardSinav]);

  const lowCount =
    rows?.filter((r) => r.confidence < 60 || (!r.topicId && !r.topicLabel && !!r.cevap)).length ?? 0;

  const previewSections = useMemo(() => {
    if (!rows) return [];
    const layout = getExamLayout(scanSinav);
    const out: { title: string; rows: PdfParseRow[] }[] = [];
    let lastSubject = "";
    for (const row of rows) {
      const cell = layout.byIndex[row.soruNo - 1];
      const title = row.subjectLabel || cell?.sectionTitle || "—";
      if (title !== lastSubject) {
        out.push({ title, rows: [] });
        lastSubject = title;
      }
      out[out.length - 1]!.rows.push(row);
    }
    return out;
  }, [rows, scanSinav]);

  if (!open) return null;

  const runScan = async (file: File) => {
    if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") {
      toast.error("Lütfen PDF dosyası seçin");
      return;
    }
    setFileLabel(file.name);
    setPhase("scanning");
    setRows(null);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("sinav", scanSinav);

      const res = await fetch("/api/exams/pdf-parse", { method: "POST", body: form });
      const json = (await res.json()) as PdfParseResult & { error?: string };

      if (!res.ok) {
        throw new Error(json.error || "PDF analizi başarısız");
      }

      setRows(json.rows);
      setMeta(json.meta);
      setBooklet(json.booklet);
      setWarnings(json.warnings || []);
      setPhase("preview");

      if (json.meta.answersFound === 0) {
        toast.error("Cevap anahtarı okunamadı. PDF metin katmanını kontrol edin.");
      } else if (json.warnings?.length) {
        toast.warning(json.warnings[0]!);
      } else {
        toast.success(
          `${json.meta.answersFound} cevap · ${json.meta.topicsMatched} konu (${json.meta.answerKeyMethod})`
        );
      }
    } catch (e) {
      setPhase("error");
      toast.error(e instanceof Error ? e.message : "PDF okunamadı");
    }
  };

  return (
    <div
      className="kdy-pdf-overlay is-open"
      id="kdy-pdf-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="kdy-pdf-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="kdy-pdf-modal" role="document" onClick={(e) => e.stopPropagation()}>
        <div className="kdy-pdf-head">
          <div className="kdy-pdf-head__text">
            <p className="kdy-pdf-eyebrow">
              <Sparkles size={14} aria-hidden />
              Otonom analiz
            </p>
            <h3 className="kdy-pdf-title" id="kdy-pdf-title">
              Otonom Sınav Analiz Merkezi
            </h3>
            <p className="kdy-pdf-sub">
              Önce sınav tipini seçin; müfredat ve matris {scanSinav} düzenine göre hazırlanır.
            </p>
          </div>
          <button
            type="button"
            className="kdy-modal__close btn-icon kdy-pdf-close"
            aria-label="Kapat"
            onClick={onClose}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {phase === "setup" ? (
          <div className="kdy-pdf-setup">
            <fieldset className="kdy-pdf-sinav-field">
              <legend className="kdy-field__label">Sınav tipi</legend>
              <div className="kdy-pdf-sinav-segment">
                {SINAV_OPTIONS.map((opt) => (
                  <label
                    key={opt.id}
                    className={`kdy-pdf-sinav-opt ${scanSinav === opt.id ? "kdy-pdf-sinav-opt--active" : ""}`}
                  >
                    <input
                      type="radio"
                      name="kdy-pdf-sinav"
                      value={opt.id}
                      checked={scanSinav === opt.id}
                      onChange={() => setScanSinav(opt.id)}
                    />
                    <span className="kdy-pdf-sinav-opt__label">{opt.label}</span>
                    <span className="kdy-pdf-sinav-opt__hint">{opt.hint}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="kdy-pdf-subjects">
              <p className="kdy-pdf-subjects__title">
                {scanSinav} ders blokları ve müfredat kapsamı
              </p>
              <ul className="kdy-pdf-subjects__list">
                {subjectBlocks.map((b) => (
                  <li key={b.subjectId} className="kdy-pdf-subjects__chip">
                    <span className="kdy-pdf-subjects__name">{b.title}</span>
                    <span className="kdy-pdf-subjects__meta">
                      {b.count} soru · {b.topicCount} konu
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="kdy-pdf-setup__actions">
              <Button type="button" variant="primary" onClick={() => setPhase("idle")}>
                PDF yükle
              </Button>
            </div>
          </div>
        ) : null}

        {phase === "idle" || phase === "error" ? (
          <div
            className={`kdy-pdf-dropzone ${dropOver ? "kdy-pdf-dropzone--over" : ""} ${phase === "error" ? "kdy-pdf-dropzone--error" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDropOver(true);
            }}
            onDragLeave={() => setDropOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDropOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) void runScan(f);
            }}
            onClick={() => fileRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") fileRef.current?.click();
            }}
            role="button"
            tabIndex={0}
          >
            <input
              ref={fileRef}
              type="file"
              className="kdy-pdf-file"
              accept=".pdf,application/pdf"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void runScan(f);
                e.target.value = "";
              }}
            />
            <p className="kdy-pdf-dropzone__badge">{scanSinav} · {getExamLayout(scanSinav).n} soru</p>
            <div className="kdy-pdf-dropzone__icon" aria-hidden>
              <Upload size={28} strokeWidth={1.5} />
            </div>
            <strong>PDF kitapçığını sürükleyip bırakın</strong>
            <span>veya tıklayarak seçin · Maks. 20 MB</span>
            <button
              type="button"
              className="kdy-pdf-back-link"
              onClick={(e) => {
                e.stopPropagation();
                setPhase("setup");
              }}
            >
              ← Sınav tipini değiştir
            </button>
            {phase === "error" && (
              <span className="kdy-pdf-dropzone__err">Tekrar denemek için yeni bir PDF yükleyin.</span>
            )}
          </div>
        ) : null}

        {phase === "scanning" ? (
          <div className="kdy-pdf-scan" aria-live="polite">
            <div className="kdy-pdf-scan__doc">
              <FileText size={48} strokeWidth={1.25} className="kdy-pdf-scan__doc-icon" />
              <span className="kdy-pdf-scan__laser" aria-hidden />
            </div>
            <p className="kdy-pdf-scan__label">Taranıyor…</p>
            <p className="kdy-pdf-scan__file">
              {fileLabel} · {scanSinav}
            </p>
            <p className="kdy-pdf-scan__hint">Son sayfalardan cevap anahtarı ve müfredat eşlemesi</p>
          </div>
        ) : null}

        {phase === "preview" && rows ? (
          <>
            <div className="kdy-pdf-meta">
              <span>{fileLabel}</span>
              <span className="kdy-pdf-meta__booklet">{scanSinav}</span>
              {meta ? (
                <span>
                  {meta.pageCount} sayfa · {meta.answersFound} cevap · {meta.topicsMatched} konu
                  {meta.answerKeyMethod ? ` · ${meta.answerKeyMethod}` : ""}
                </span>
              ) : null}
              {booklet ? <span className="kdy-pdf-meta__booklet">Kitapçık {booklet}</span> : null}
              {lowCount > 0 ? (
                <span className="kdy-pdf-meta__warn">{lowCount} satır düşük güven</span>
              ) : null}
            </div>
            {warnings.length > 0 && (
              <p className="kdy-pdf-warnings" role="status">
                {warnings.join(" · ")}
              </p>
            )}
            <div className="kdy-pdf-preview__scroll">
              <table className="kdy-pdf-preview__table" aria-label="PDF analiz önizleme">
                <thead>
                  <tr>
                    <th>Soru</th>
                    <th>Cevap</th>
                    <th>Ders</th>
                    <th>Konu (müfredat)</th>
                    <th>Güven</th>
                  </tr>
                </thead>
                <tbody>
                  {previewSections.map((sec) => (
                    <Fragment key={sec.title}>
                      <tr className="kdy-pdf-preview__sec">
                        <td colSpan={5}>{sec.title}</td>
                      </tr>
                      {sec.rows.map((r) => {
                        const low =
                          r.confidence < 60 || (!r.topicId && !r.topicLabel && !!r.cevap);
                        return (
                          <tr
                            key={r.soruNo}
                            className={low ? "kdy-pdf-preview__row--low" : undefined}
                          >
                            <td>{r.soruNo}</td>
                            <td>{r.cevap || "—"}</td>
                            <td>{r.subjectLabel}</td>
                            <td>{r.topicLabel || "—"}</td>
                            <td>
                              <span
                                className={`kdy-pdf-confidence ${low ? "kdy-pdf-confidence--low" : ""}`}
                              >
                                %{r.confidence}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="kdy-pdf-footer">
              <Button type="button" variant="outline" onClick={() => setPhase("idle")}>
                Başka PDF
              </Button>
              <Button
                type="button"
                variant="primary"
                className="kdy-pdf-apply"
                onClick={() => {
                  const base =
                    scanSinav !== wizardSinav ? createEmptyMatrix(scanSinav) : matrix;
                  const merged = applyPdfRowsToMatrix(rows, scanSinav, base);
                  if (scanSinav !== wizardSinav) onSinavChange?.(scanSinav);
                  onApply(merged);
                  onClose();
                  toast.success(`${scanSinav} matrisi PDF analizinden güncellendi`);
                }}
              >
                <Sparkles size={16} aria-hidden />
                Matrisi Dağıt ve Kaydet
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
