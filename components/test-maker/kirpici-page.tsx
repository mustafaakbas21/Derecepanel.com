"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Crop,
  Hand,
  Loader2,
  Scan,
  Trash2,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { SaveWrongPoolDialog } from "@/components/hata-recetesi/save-wrong-pool-dialog";
import { FastAnswerPanel } from "@/components/test-maker/fast-answer-panel";
import { QuestionPoolCard } from "@/components/test-maker/question-pool-card";
import { Button } from "@/components/ui/button";
import {
  appendWrongPool,
  buildWrongQuestionFromCrop,
  WrongPoolQuotaError,
} from "@/lib/hata-recetesi/storage";
import type { HataKaynagi } from "@/lib/hata-recetesi/types";
import { bulkAddToPool } from "@/lib/test-maker/question-pool";
import type { TagState } from "@/lib/test-maker/use-pdf-cropper";
import { usePdfCropper } from "@/lib/test-maker/use-pdf-cropper";
import { useFastAnswers } from "@/lib/test-maker/use-fast-answers";
import {
  getConcepts,
  getSubjectById,
  getSubjects,
  getTopicById,
  getTopics,
} from "@/lib/mufredat";
import type { AnswerLetter, QuestionPoolItem } from "@/lib/test-maker/types";
import { tmToast } from "@/lib/test-maker/notify";
import { cn } from "@/lib/utils";

import "@/styles/kirpici-studio.css";

export function KirpiciPage() {
  const c = usePdfCropper();
  const [dersId, setDersId] = useState("");
  const [konuId, setKonuId] = useState("");
  const [kavramId, setKavramId] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [wrongPoolOpen, setWrongPoolOpen] = useState(false);
  const [enterIds, setEnterIds] = useState<Set<string>>(() => new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevGalleryLenRef = useRef(0);

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
  const tagIncomplete = Boolean(c.gallery.length && (!tag.ders || !tag.konu));

  const setAnswerAtIndex = useCallback(
    (index: number, letter: AnswerLetter | null) => {
      c.setGallery((g) => g.map((q, i) => (i === index ? { ...q, answer: letter } : q)));
    },
    [c.setGallery]
  );

  const fast = useFastAnswers({
    items: c.gallery,
    onSetAnswer: setAnswerAtIndex,
    keyboardEnabled: !wrongPoolOpen,
  });

  useEffect(() => {
    if (c.gallery.length > prevGalleryLenRef.current) {
      const newIds = c.gallery.slice(prevGalleryLenRef.current).map((g) => g.id);
      setEnterIds((prev) => new Set([...prev, ...newIds]));
      window.setTimeout(() => {
        setEnterIds((prev) => {
          const next = new Set(prev);
          newIds.forEach((id) => next.delete(id));
          return next;
        });
      }, 360);
    }
    prevGalleryLenRef.current = c.gallery.length;
  }, [c.gallery]);

  const onCropClick = () => {
    if (c.toolMode === "pan") {
      c.setToolMode("crop");
      return;
    }
    void c.cropSelection(tag);
  };

  const persistSelected = useCallback(async (items: typeof c.gallery) => {
    const payload: Omit<QuestionPoolItem, "uuid" | "savedAt">[] = items.map((it) => ({
      dataUrl: it.dataUrl,
      ders: it.ders,
      konu: it.konu,
      kavram: it.kavram,
      answer: it.answer,
      page: it.page,
      qNumber: it.qNumber,
      auto: it.auto,
      sourcePdf: it.sourcePdf,
    }));
    try {
      await bulkAddToPool(payload);
      tmToast.poolSavedToHavuz(items.length);
    } catch {
      tmToast.storageFull();
    }
  }, []);

  const saveSelectedToPool = () => {
    const ids = selected.size > 0 ? selected : new Set(c.gallery.map((g) => g.id));
    const items = c.gallery.filter((g) => ids.has(g.id));
    if (!items.length) {
      tmToast.warning("Kaydedilecek soru yok");
      return;
    }
    void persistSelected(items);
  };

  const pendingWrongItems = () => {
    const ids = selected.size > 0 ? selected : new Set(c.gallery.map((g) => g.id));
    return c.gallery.filter((g) => ids.has(g.id));
  };

  const saveSelectedToWrongPool = (kaynak: HataKaynagi) => {
    const items = pendingWrongItems();
    if (!items.length) {
      tmToast.warning("Kaydedilecek soru yok");
      return;
    }
    try {
      appendWrongPool(
        items.map((it) =>
          buildWrongQuestionFromCrop({
            dataUrl: it.dataUrl,
            ders: it.ders,
            konu: it.konu,
            kavram: it.kavram,
            answer: it.answer,
            hataKaynagi: kaynak,
            page: it.page,
            qNumber: it.qNumber,
          })
        )
      );
      tmToast.success(`${items.length} soru hatalı havuza kaydedildi`);
    } catch (e) {
      if (e instanceof WrongPoolQuotaError) tmToast.error(e.message);
      else tmToast.error("Kayıt başarısız — depolama dolu");
    }
  };

  const deleteSelected = () => {
    const ids = selected.size > 0 ? selected : new Set(c.gallery.map((g) => g.id));
    c.setGallery((g) => g.filter((x) => !ids.has(x.id)));
    setSelected(new Set());
  };

  const resetAll = () => {
    c.clearPdf();
    c.setGallery([]);
    setDersId("");
    setKonuId("");
    setKavramId("");
    setSelected(new Set());
    fast.setActiveIndex(0);
    prevGalleryLenRef.current = 0;
    setEnterIds(new Set());
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (e.target instanceof HTMLTextAreaElement) return;

      if (wrongPoolOpen && e.key === "Escape") {
        e.preventDefault();
        setWrongPoolOpen(false);
        return;
      }

      if (e.key === "Enter" && c.marqueeVisible && c.toolMode === "crop" && !c.scanning) {
        e.preventDefault();
        void c.cropSelection(tag);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [c, tag, wrongPoolOpen]);

  const progressPct =
    c.scanProgress.total > 0
      ? Math.round((c.scanProgress.page / c.scanProgress.total) * 100)
      : 0;

  return (
    <div id="tw-scope" className="kirpici-studio">
      <header className="kirpici-studio__top">
        <div>
          <h1>Otomatik Soru Kırpıcı</h1>
          <p>PDF ortada · kırpılan sorular sağda · otonom tarama sol kokpitte</p>
        </div>
        <div className="kirpici-studio__stats">
          <span className="kirpici-studio__stat">
            Soru <strong>{c.gallery.length}</strong>
          </span>
          {c.fileName ? (
            <span className="kirpici-studio__stat" title={c.fileName}>
              PDF <strong className="max-w-[8rem] truncate inline-block align-bottom">{c.fileName}</strong>
            </span>
          ) : null}
          {c.pdfDoc ? (
            <span className="kirpici-studio__stat">
              Sayfa <strong>{c.pageIndex}/{c.totalPages}</strong>
            </span>
          ) : null}
          {c.scanning ? (
            <span className="kirpici-studio__stat kirpici-studio__stat--accent">
              Taranıyor <strong>{progressPct}%</strong>
            </span>
          ) : null}
        </div>
      </header>

      <div className="kirpici-studio__body">
        {/* Sol kokpit */}
        <aside className="kirpici-cockpit" aria-label="Kırpıcı kokpit">
          <div className="kirpici-cockpit__scroll">
            <section className="kirpici-cockpit__section">
              <p className="kirpici-cockpit__section-title">PDF kaynağı</p>
              <div
                role="button"
                tabIndex={0}
                className="kirpici-dropzone"
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files[0];
                  if (f?.type === "application/pdf") void c.loadPdf(f);
                }}
              >
                <Upload className="h-7 w-7 text-slate-400" />
                <span className="text-sm font-semibold text-slate-700">PDF sürükle veya seç</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void c.loadPdf(f);
                  }}
                />
              </div>
              {c.fileName ? (
                <div className="kirpici-file-chip">
                  <p className="truncate text-xs font-semibold text-slate-800">{c.fileName}</p>
                  <p className="text-[11px] text-slate-500">{c.totalPages} sayfa</p>
                  <button
                    type="button"
                    onClick={c.clearPdf}
                    className="mt-1.5 text-xs font-semibold text-red-600 hover:underline"
                  >
                    PDF&apos;i kaldır
                  </button>
                </div>
              ) : null}
            </section>

            <section className="kirpici-cockpit__section">
              <p className="kirpici-cockpit__section-title">YKS etiketleri</p>
              <select
                value={dersId}
                onChange={(e) => {
                  setDersId(e.target.value);
                  setKonuId("");
                  setKavramId("");
                }}
                className={cn("kirpici-field mb-2", tagIncomplete && !dersId && "kirpici-field--warn")}
              >
                <option value="">Ders seçin</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <select
                disabled={!dersId}
                value={konuId}
                onChange={(e) => {
                  setKonuId(e.target.value);
                  setKavramId("");
                }}
                className={cn("kirpici-field mb-2", tagIncomplete && !konuId && "kirpici-field--warn")}
              >
                <option value="">Konu seçin</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <select
                disabled={!konuId}
                value={kavramId}
                onChange={(e) => setKavramId(e.target.value)}
                className="kirpici-field"
              >
                <option value="">Kavram (isteğe bağlı)</option>
                {concepts.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-[11px] text-slate-500">{tagPreview || "Etiket önizlemesi"}</p>
            </section>

            <section className="kirpici-cockpit__section">
              <p className="kirpici-cockpit__section-title">PDF düzeni</p>
              <div className="kirpici-segment">
                <button
                  type="button"
                  className={cn(
                    "kirpici-segment__btn",
                    c.columnMode === "single" && "kirpici-segment__btn--on"
                  )}
                  onClick={() => c.setColumnMode("single")}
                >
                  Tek sütun
                </button>
                <button
                  type="button"
                  className={cn(
                    "kirpici-segment__btn",
                    c.columnMode === "double" && "kirpici-segment__btn--on"
                  )}
                  onClick={() => c.setColumnMode("double")}
                >
                  Çift sütun
                </button>
              </div>
            </section>

            <section className="kirpici-cockpit__section">
              <p className="kirpici-cockpit__section-title">Araçlar</p>
              <div className="kirpici-tool-pair mb-2">
                <button
                  type="button"
                  className={cn(
                    "kirpici-tool-pair__btn",
                    c.toolMode === "crop" && "kirpici-tool-pair__btn--on"
                  )}
                  onClick={() => c.setToolMode("crop")}
                >
                  <Crop className="h-3.5 w-3.5" />
                  Kırp
                </button>
                <button
                  type="button"
                  className={cn(
                    "kirpici-tool-pair__btn",
                    c.toolMode === "pan" && "kirpici-tool-pair__btn--on"
                  )}
                  onClick={() => c.setToolMode("pan")}
                >
                  <Hand className="h-3.5 w-3.5" />
                  Gez
                </button>
              </div>
              <Button
                type="button"
                variant="primary"
                className="mb-2 w-full text-xs"
                disabled={!c.pdfDoc || !c.marqueeVisible || c.scanning}
                onClick={onCropClick}
              >
                <Crop className="h-4 w-4" />
                Seçili alanı kırp
              </Button>
              <button
                type="button"
                disabled={c.scanning || !c.pdfDoc}
                onClick={() => void c.runAutoScan(tag)}
                className="kirpici-scan-btn mb-2"
              >
                {c.scanning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Scan className="h-4 w-4" />
                )}
                {c.scanning ? "Taranıyor…" : "Otonom tarama (tüm PDF)"}
              </button>
              <Button
                type="button"
                variant="outline"
                className="w-full text-xs"
                onClick={resetAll}
              >
                Sıfırla
              </Button>
            </section>

            {c.pdfDoc ? (
              <section className="kirpici-cockpit__section">
                <p className="kirpici-cockpit__section-title">Sayfa</p>
                <div className="kirpici-page-nav">
                  <button
                    type="button"
                    disabled={c.pageIndex <= 1}
                    onClick={() => c.setPageIndex((p) => Math.max(1, p - 1))}
                  >
                    ‹
                  </button>
                  <span className="text-xs font-semibold text-slate-700">
                    {c.pageIndex} / {c.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={c.pageIndex >= c.totalPages}
                    onClick={() => c.setPageIndex((p) => Math.min(c.totalPages, p + 1))}
                  >
                    ›
                  </button>
                </div>
              </section>
            ) : null}
          </div>
        </aside>

        {/* Orta — PDF önizleme */}
        <section className="kirpici-radar" aria-label="PDF önizleme">
          <div className="kirpici-radar__toolbar">
            <div className="kirpici-radar__hint">
              <strong>PDF çalışma alanı</strong>
              {c.pdfDoc
                ? c.toolMode === "pan"
                  ? "Sürükleyerek gezinin"
                  : "Alan seçin → «Seçili alanı kırp» veya Enter"
                : "Sol panelden PDF yükleyin"}
            </div>
            <div className="kirpici-zoom">
              <button type="button" onClick={() => c.setZoom(c.zoom - 0.1)} aria-label="Uzaklaştır">
                <ZoomOut className="h-4 w-4" />
              </button>
              <span>{Math.round(c.zoom * 100)}%</span>
              <button type="button" onClick={() => c.setZoom(c.zoom + 0.1)} aria-label="Yakınlaştır">
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>
          </div>

          {c.scanning ? (
            <div className="kirpici-radar__progress">
              <div className="mb-1 flex justify-between text-[11px] font-medium text-amber-900">
                <span>Sayfa {c.scanProgress.page}/{c.scanProgress.total}</span>
                <span>{c.scanProgress.found} soru bulundu</span>
              </div>
              <div className="tm-progress-track">
                <div className="tm-progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
              <button
                type="button"
                onClick={c.stopScan}
                className="mt-1 text-[11px] font-bold text-red-600"
              >
                Taramayı durdur
              </button>
            </div>
          ) : null}

          <div
            ref={c.wrapRef}
            className={cn(
              "kirpici-radar__canvas",
              c.toolMode === "pan" ? "kirpici-radar__canvas--pan" : "kirpici-radar__canvas--crop"
            )}
            onPointerDown={c.onWrapPointerDown}
            onPointerMove={c.onWrapPointerMove}
            onPointerUp={c.onWrapPointerUp}
            onPointerCancel={c.onWrapPointerUp}
          >
            {!c.pdfDoc ? (
              <div className="kirpici-radar__empty">
                <Upload className="h-10 w-10 text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">PDF önizleme alanı</p>
                <p className="max-w-sm text-xs text-slate-500">
                  Deneme veya kaynak PDF&apos;inizi yükleyin. Ortada sayfa önizlemesi, sağda kırpılan
                  sorular listelenir.
                </p>
                <Button variant="primary" size="sm" onClick={() => fileInputRef.current?.click()}>
                  PDF seç
                </Button>
              </div>
            ) : (
              <div className="kirpici-radar__stage-wrap">
                <div ref={c.canvasHostRef} className="kirpici-radar__stage relative h-max w-max">
                  <canvas ref={c.pdfCanvasRef} />
                  <div ref={c.marqueeRef} className="kirpici-marquee" aria-hidden />
                  {c.toolMode === "crop" ? (
                    <div
                      ref={c.overlayRef}
                      className="absolute inset-0 z-10 h-full w-full cursor-crosshair select-none touch-none"
                      aria-hidden
                    />
                  ) : null}
                </div>
              </div>
            )}
          </div>

          <div className="kirpici-radar__status">
            <span>{c.statusText}</span>
            <span className="text-slate-400">
              {c.toolMode === "crop" ? "Kırpma" : "Gezme"} · {c.gallery.length} soru
            </span>
          </div>
        </section>

        {/* Sağ — Cephanelik */}
        <aside className="kirpici-gallery" aria-label="Cephanelik">
          <div className="kirpici-gallery__head">
            <div className="flex items-center gap-2">
              <h2>Cephanelik</h2>
              <span className="kirpici-gallery__count">{c.gallery.length}</span>
            </div>
            <p>Kırpılan sorular · hızlı cevap girişi · havuza kayıt</p>

            <FastAnswerPanel
              items={c.gallery}
              activeIndex={fast.activeIndex}
              stripRef={fast.stripRef}
              onSelectIndex={fast.activateAndScroll}
            />
          </div>

          <div className="kirpici-gallery__actions">
            <button
              type="button"
              onClick={() => setSelected(new Set(c.gallery.map((g) => g.id)))}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Tümünü seç
            </button>
            <button
              type="button"
              onClick={deleteSelected}
              className="inline-flex items-center gap-1 text-xs font-semibold text-red-600"
            >
              <Trash2 className="h-3 w-3" />
              Sil
            </button>
            <Button variant="primary" size="sm" className="ml-auto text-xs" onClick={saveSelectedToPool}>
              Havuza kaydet
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                if (!pendingWrongItems().length) {
                  tmToast.warning("Kaydedilecek soru yok");
                  return;
                }
                setWrongPoolOpen(true);
              }}
            >
              Hatalı havuz
            </Button>
          </div>

          <SaveWrongPoolDialog
            open={wrongPoolOpen}
            count={pendingWrongItems().length}
            onOpenChange={setWrongPoolOpen}
            onConfirm={saveSelectedToWrongPool}
          />

          <div className="kirpici-gallery__list">
            {c.gallery.length === 0 ? (
              <p className="kirpici-gallery__empty">
                Henüz kırpılan soru yok.
                <br />
                PDF&apos;te alan seçin veya otonom tarama çalıştırın.
              </p>
            ) : (
              c.gallery.map((item, index) => (
                <QuestionPoolCard
                  key={item.id}
                  cardRef={(el) => fast.registerCardRef(item.id, el)}
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
                    sourcePdf: item.sourcePdf,
                    savedAt: "",
                  }}
                  variant="kirpici"
                  col={item.col}
                  active={index === fast.activeIndex}
                  animateEnter={enterIds.has(item.id)}
                  selected={selected.has(item.id)}
                  onActivate={() => fast.activateAndScroll(index)}
                  onSelect={(checked) => {
                    setSelected((s) => {
                      const n = new Set(s);
                      if (checked) n.add(item.id);
                      else n.delete(item.id);
                      return n;
                    });
                  }}
                  onAnswer={(letter) => {
                    fast.setAnswer(index, letter);
                  }}
                  onDelete={() => {
                    c.setGallery((g) => g.filter((x) => x.id !== item.id));
                    setSelected((s) => {
                      const n = new Set(s);
                      n.delete(item.id);
                      return n;
                    });
                  }}
                  onSaveOne={() => persistSelected([item])}
                />
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
