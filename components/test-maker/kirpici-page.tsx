"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Crop,
  Hand,
  Loader2,
  Scan,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { QuestionPoolCard } from "@/components/test-maker/question-pool-card";
import { bulkAddToPool } from "@/lib/test-maker/question-pool";
import type { TagState } from "@/lib/test-maker/use-pdf-cropper";
import { usePdfCropper } from "@/lib/test-maker/use-pdf-cropper";
import { getConcepts, getSubjects, getTopics, getSubjectById, getTopicById } from "@/lib/mufredat";
import type { AnswerLetter, QuestionPoolItem } from "@/lib/test-maker/types";
import { tmToast } from "@/lib/test-maker/notify";

const LETTERS: AnswerLetter[] = ["A", "B", "C", "D", "E"];

export function KirpiciPage() {
  const c = usePdfCropper();
  const [dersId, setDersId] = useState("");
  const [konuId, setKonuId] = useState("");
  const [kavramId, setKavramId] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [aktifIndex, setAktifIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const subjects = useMemo(() => getSubjects("ALL"), []);
  const topics = useMemo(() => (dersId ? getTopics(dersId) : []), [dersId]);
  const concepts = useMemo(
    () => (dersId && konuId ? getConcepts(dersId, konuId) : []),
    [dersId, konuId]
  );

  const tag: TagState = useMemo(() => {
    const sub = getSubjectById(dersId);
    const top = getTopicById(dersId, konuId);
    const kav = concepts.find((x) => x.id === kavramId);
    return {
      ders: sub?.name ?? "",
      konu: top?.name ?? "",
      kavram: kav?.name ?? "",
    };
  }, [dersId, konuId, kavramId, concepts]);

  const tagPreview = [tag.ders, tag.konu, tag.kavram].filter(Boolean).join(" › ");

  const getTag = (): TagState => tag;

  const onCropClick = () => {
    if (c.toolMode === "pan") {
      c.setToolMode("crop");
      return;
    }
    void c.cropSelection(getTag());
  };

  const persistSelected = useCallback(
    (items: typeof c.gallery) => {
      const payload: Omit<QuestionPoolItem, "uuid" | "savedAt">[] = items.map(
        (it) => ({
          dataUrl: it.dataUrl,
          ders: it.ders,
          konu: it.konu,
          kavram: it.kavram,
          answer: it.answer,
          page: it.page,
          qNumber: it.qNumber,
          auto: it.auto,
        })
      );
      try {
        bulkAddToPool(payload);
        tmToast.success(`${items.length} soru başarıyla Soru Havuzuna kaydedildi!`);
      } catch {
        tmToast.error("Kayıt başarısız — depolama dolu");
      }
    },
    []
  );

  const saveSelectedToPool = () => {
    const ids =
      selected.size > 0 ? selected : new Set(c.gallery.map((g) => g.id));
    const items = c.gallery.filter((g) => ids.has(g.id));
    if (!items.length) {
      tmToast.warning("Kaydedilecek soru yok");
      return;
    }
    persistSelected(items);
  };

  const deleteSelected = () => {
    const ids = selected.size > 0 ? selected : new Set(c.gallery.map((g) => g.id));
    c.setGallery((g) => g.filter((x) => !ids.has(x.id)));
    setSelected(new Set());
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!c.gallery.length) return;
      const idx = Math.min(aktifIndex, c.gallery.length - 1);
      const item = c.gallery[idx];
      if (!item) return;
      if (LETTERS.includes(e.key.toUpperCase() as AnswerLetter)) {
        const letter = e.key.toUpperCase() as AnswerLetter;
        c.setGallery((g) =>
          g.map((q, i) => (i === idx ? { ...q, answer: letter } : q))
        );
        setAktifIndex((i) => Math.min(i + 1, c.gallery.length - 1));
      }
      if (e.key === "Backspace") {
        c.setGallery((g) =>
          g.map((q, i) => (i === idx ? { ...q, answer: null } : q))
        );
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [c.gallery, aktifIndex, c]);

  const progressPct =
    c.scanProgress.total > 0
      ? Math.round((c.scanProgress.page / c.scanProgress.total) * 100)
      : 0;

  return (
    <div id="tw-scope" className="flex min-h-0 flex-1 overflow-hidden">
      {/* Sol kokpit */}
      <aside id="aks-left-panel" className="tm-filter-panel !w-72">
        <div id="aks-kokpit-header" className="tm-panel-header">
          <h2>PDF Kokpiti</h2>
          <p>PDF yükleyin, etiketleyin ve kırpın</p>
        </div>
        <div className="tm-filter-body text-sm">
          <div
            id="aks-dropzone"
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files[0];
              if (f?.type === "application/pdf") void c.loadPdf(f);
            }}
            className="tm-dropzone"
          >
            <Upload className="h-8 w-8 text-slate-400" />
            <span className="font-medium text-slate-600">PDF sürükle veya seç</span>
            <input
              ref={fileInputRef}
              id="aks-file-input"
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void c.loadPdf(f);
              }}
            />
          </div>
          {c.fileName && (
            <div className="tm-kirpici-file-card">
              <p id="aks-file-name-text" className="truncate text-xs font-semibold text-slate-800">
                {c.fileName}
              </p>
              <p id="aks-file-page-count" className="text-[11px] text-slate-500">
                {c.totalPages} sayfa
              </p>
              <button
                id="aks-btn-clear-pdf"
                type="button"
                onClick={c.clearPdf}
                className="mt-2 text-xs text-red-600 hover:underline"
              >
                PDF&apos;i kaldır
              </button>
            </div>
          )}

          <div>
            <p className="tm-field-label">YKS Etiketleme</p>
            <select
              id="aks-sel-ders"
              value={dersId}
              onChange={(e) => {
                setDersId(e.target.value);
                setKonuId("");
                setKavramId("");
              }}
              className={`tm-field-select mb-2 text-xs ${!dersId && c.gallery.length ? "!border-red-500" : ""}`}
            >
              <option value="">Ders seçin</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              id="aks-sel-konu"
              disabled={!dersId}
              value={konuId}
              onChange={(e) => {
                setKonuId(e.target.value);
                setKavramId("");
              }}
              className={`tm-field-select mb-2 text-xs ${!konuId && c.gallery.length ? "!border-red-500" : ""}`}
            >
              <option value="">Konu seçin</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <select
              id="aks-sel-kavram"
              disabled={!konuId}
              value={kavramId}
              onChange={(e) => setKavramId(e.target.value)}
              className="tm-field-select text-xs"
            >
              <option value="">Kavram (isteğe bağlı)</option>
              {concepts.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name}
                </option>
              ))}
            </select>
            <p id="aks-tag-text" className="mt-2 text-[11px] text-slate-500">
              {tagPreview || "Etiket önizlemesi"}
            </p>
          </div>

          <div>
            <p className="tm-field-label">PDF Düzeni</p>
            <div className="tm-segment-group">
              <button
                id="aks-mode-single"
                type="button"
                onClick={() => c.setColumnMode("single")}
                className={`tm-segment-btn ${c.columnMode === "single" ? "tm-segment-btn--active" : ""}`}
              >
                Tek sütun
              </button>
              <button
                id="aks-mode-double"
                type="button"
                onClick={() => c.setColumnMode("double")}
                className={`tm-segment-btn ${c.columnMode === "double" ? "tm-segment-btn--active" : ""}`}
              >
                Çift sütun
              </button>
            </div>
            <p id="aks-mode-desc" className="mt-1 text-[10px] text-slate-500">
              {c.columnMode === "double"
                ? "Ortadan ikiye bölünmüş PDF"
                : "Tek sütun tam sayfa"}
            </p>
          </div>

          <div className="space-y-2">
            <p className="tm-field-label">Araçlar</p>
            <div className="tm-kirpici-tool-row">
              <button
                id="aks-btn-crop-mode"
                type="button"
                onClick={() => c.setToolMode("crop")}
                className={`tm-kirpici-tool-btn ${c.toolMode === "crop" ? "tm-kirpici-tool-btn--active" : ""}`}
              >
                <Crop className="h-3.5 w-3.5" />
                Kırp
              </button>
              <button
                id="aks-btn-pan"
                type="button"
                onClick={() => c.setToolMode("pan")}
                className={`tm-kirpici-tool-btn ${c.toolMode === "pan" ? "tm-kirpici-tool-btn--active" : ""}`}
              >
                <Hand className="h-3.5 w-3.5" />
                Gez
              </button>
            </div>
            <button
              id="aks-btn-crop"
              type="button"
              disabled={!c.pdfDoc || !c.marqueeVisible}
              onClick={onCropClick}
              className="tm-btn-primary flex w-full items-center justify-center gap-2 py-2.5 text-xs disabled:opacity-45"
            >
              <Crop className="h-4 w-4" />
              Seçili alanı kırp
            </button>
            <button
              id="aks-btn-auto"
              type="button"
              disabled={c.scanning || !c.pdfDoc}
              onClick={() => void c.runAutoScan(getTag())}
              className="tm-kirpici-scan-btn"
            >
              {c.scanning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Scan className="h-4 w-4" />
              )}
              {c.scanning ? "Taranıyor…" : "Tüm PDF'i Tara"}
            </button>
            <button
              id="aks-btn-reset"
              type="button"
              onClick={() => {
                c.clearPdf();
                c.setGallery([]);
                setDersId("");
                setKonuId("");
                setKavramId("");
              }}
              className="w-full rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Sıfırla
            </button>
          </div>

          {c.pdfDoc && (
            <div id="aks-page-nav" className="flex items-center justify-between rounded-lg bg-slate-100 p-2">
              <button
                id="aks-prev-page"
                type="button"
                disabled={c.pageIndex <= 1}
                onClick={() => c.setPageIndex((p) => Math.max(1, p - 1))}
                className="rounded px-2 py-1 text-xs font-semibold disabled:opacity-40"
              >
                ‹
              </button>
              <span id="aks-page-info" className="text-xs font-medium">
                {c.pageIndex} / {c.totalPages}
              </span>
              <button
                id="aks-next-page"
                type="button"
                disabled={c.pageIndex >= c.totalPages}
                onClick={() => c.setPageIndex((p) => Math.min(c.totalPages, p + 1))}
                className="rounded px-2 py-1 text-xs font-semibold disabled:opacity-40"
              >
                ›
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Orta radar */}
      <section id="aks-middle-panel" className="tm-radar-panel">
        <div id="aks-radar-toolbar" className="tm-kirpici-radar-toolbar">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Radar — PDF Çalışma Alanı</h3>
            <p id="aks-radar-hint" className="text-[11px] text-slate-500">
              {c.pdfDoc
                ? c.toolMode === "pan"
                  ? "Sürükleyerek PDF üzerinde gezinin"
                  : "Fare ile soru alanı çizin, ardından «Seçili alanı kırp»"
                : "Sol kokpitten PDF yükleyin"}
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-1 py-0.5">
            <button
              type="button"
              id="aks-zoom-out"
              className="tm-kirpici-zoom-btn"
              onClick={() => c.setZoom(c.zoom - 0.1)}
              aria-label="Uzaklaştır"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span id="aks-zoom-label" className="min-w-[3rem] text-center text-xs font-bold text-slate-700">
              {Math.round(c.zoom * 100)}%
            </span>
            <button
              type="button"
              id="aks-zoom-in"
              className="tm-kirpici-zoom-btn"
              onClick={() => c.setZoom(c.zoom + 0.1)}
              aria-label="Yakınlaştır"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
        </div>

        {c.scanning && (
          <div id="aks-progress-wrap" className="shrink-0 border-b border-slate-200 bg-white px-4 py-2">
            <div className="mb-1 flex justify-between text-[11px]">
              <span id="aks-progress-text">Taranıyor…</span>
              <span id="aks-progress-page">
                Sayfa {c.scanProgress.page}/{c.scanProgress.total}
              </span>
            </div>
            <div className="tm-progress-track">
              <div
                id="aks-progress-bar"
                className="tm-progress-fill"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between">
              <span id="aks-progress-found">{c.scanProgress.found} bulundu</span>
              <button
                id="aks-btn-stop-scan"
                type="button"
                onClick={c.stopScan}
                className="text-[11px] font-semibold text-red-600"
              >
                Durdur
              </button>
            </div>
          </div>
        )}

        <div
          ref={c.wrapRef}
          id="aks-canvas-wrap"
          className={`relative flex-1 overflow-auto p-6 ${c.toolMode === "pan" ? "tm-tool-pan" : "tm-tool-crop"}`}
          onPointerDown={c.onWrapPointerDown}
          onPointerMove={c.onWrapPointerMove}
          onPointerUp={c.onWrapPointerUp}
          onPointerCancel={c.onWrapPointerUp}
        >
          {!c.pdfDoc ? (
            <div
              id="aks-empty-state"
              className="flex h-full min-h-[280px] flex-col items-center justify-center gap-2 text-center"
            >
              <p className="text-sm font-semibold text-slate-600">PDF çalışma alanı</p>
              <p className="max-w-xs text-xs text-slate-500">
                Sol panelden PDF yükleyin. Kırp modunda alan seçin; Gez modunda sürükleyerek kaydırın.
              </p>
            </div>
          ) : (
            <div className="flex w-full justify-center">
              <div
                ref={c.canvasHostRef}
                id="aks-pdf-stage"
                className="relative inline-block leading-none"
              >
                <canvas
                  ref={c.pdfCanvasRef}
                  id="aks-pdf-canvas"
                  className="block max-w-none rounded-sm bg-white"
                />
                <div
                  ref={c.marqueeRef}
                  id="aks-crop-marquee"
                  className="pointer-events-none absolute z-10 box-border"
                  style={{
                    display: c.marqueeVisible ? "block" : "none",
                    left: `${c.marqueeStyle.left}px`,
                    top: `${c.marqueeStyle.top}px`,
                    width: `${c.marqueeStyle.width}px`,
                    height: `${c.marqueeStyle.height}px`,
                  }}
                  aria-hidden
                />
                {c.scanning && (
                  <div
                    id="aks-scan-badge"
                    className="absolute right-2 top-2 rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white shadow-md"
                  >
                    Taranıyor…
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div id="aks-status-bar" className="tm-status-bar flex items-center justify-between">
          <span id="aks-status">{c.statusText}</span>
          <span id="aks-sel-dims" className="text-slate-400">
            {c.toolMode === "crop" ? "Kırpma" : "Gezme"} · {c.gallery.length} soru
          </span>
        </div>
      </section>

      {/* Sağ cephanelik */}
      <aside id="aks-right-panel" className="tm-gallery-panel !w-[30rem] max-w-[42vw]">
        <div className="tm-kirpici-gallery-head">
          <h3>Soru Galerisi</h3>
          <p>Kırpılan sorular — hızlı cevap ve havuza kayıt</p>
        </div>
        <div id="hizliCevapSeridi" className="shrink-0 border-b border-slate-200 bg-slate-50/80 p-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Hızlı cevap
          </p>
          <div className="flex flex-wrap gap-1">
            {c.gallery.map((g, i) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setAktifIndex(i)}
                className={`h-7 w-7 rounded text-xs font-bold ${i === aktifIndex ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 border-b border-slate-200 p-3">
          <button
            id="aks-select-all"
            type="button"
            onClick={() => setSelected(new Set(c.gallery.map((g) => g.id)))}
            className="tm-btn-link text-xs"
          >
            Tümünü seç
          </button>
          <button
            id="aks-btn-delete-selected"
            type="button"
            onClick={deleteSelected}
            className="text-xs font-semibold text-red-600"
          >
            Seçilileri sil
          </button>
          <button
            id="aks-btn-save-selected"
            type="button"
            onClick={saveSelectedToPool}
            className="tm-btn-primary ml-auto px-3 py-1.5 text-xs"
          >
            Havuza kaydet
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {c.gallery.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500">Henüz kırpılan soru yok</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {c.gallery.map((item) => (
                <QuestionPoolCard
                  key={item.id}
                  item={{
                    uuid: item.id,
                    dataUrl: item.dataUrl,
                    ders: item.ders,
                    konu: item.konu,
                    kavram: item.kavram,
                    answer: item.answer,
                    page: item.page,
                    qNumber: item.qNumber,
                    auto: item.auto,
                    savedAt: "",
                  }}
                  variant="kirpici"
                  selected={selected.has(item.id)}
                  onSelect={(checked) => {
                    setSelected((s) => {
                      const n = new Set(s);
                      if (checked) n.add(item.id);
                      else n.delete(item.id);
                      return n;
                    });
                  }}
                  onAnswer={(letter) => {
                    c.setGallery((g) =>
                      g.map((q) => (q.id === item.id ? { ...q, answer: letter } : q))
                    );
                  }}
                  onDelete={() => c.setGallery((g) => g.filter((x) => x.id !== item.id))}
                  onSaveOne={() => persistSelected([item])}
                />
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
