"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { appToast } from "@/lib/notify";
import { toast } from "@/lib/notify";

import { BookletCrossMappingOverlay } from "@/components/exams/kurum-deneme/BookletCrossMappingOverlay";
import { ExamMatrixTable } from "@/components/exams/kurum-deneme/ExamMatrixTable";
import { ExcelOverlay } from "@/components/exams/kurum-deneme/ExcelOverlay";
import {
  createEmptyBookletMaps,
  normalizeBookletMaps,
  type BookletCrossMaps,
  type TargetBooklet,
} from "@/lib/exams/booklet-cross-map";
import { useExamMatrix } from "@/hooks/use-exam-matrix";
import { computeMatrixPct } from "@/lib/exams/exam-evaluate";
import {
  deriveDurum,
  durumLabel,
  isPdfYuklu,
} from "@/lib/exams/enrich-exam";
import {
  createGlobalDenemeId,
  globalExamFromWizard,
} from "@/lib/exams/global-exam-storage";
import { getExamLayout } from "@/lib/exams/exam-layout";
import {
  createKurumDenemeId,
  enrichKurumDeneme,
  getKurumDenemeById,
  todayIso,
} from "@/lib/exams/exam-storage";
import type { GlobalExam, KurumDeneme, SinavTipi } from "@/lib/exams/types";

import "./kurum-deneme-wizard.css";

const TABS = [
  { id: "1", label: "Genel bilgiler", hint: "Ad, tarih, sınav" },
  { id: "2", label: "Optik ve soru dağılımı", hint: "Matris & cevaplar" },
  { id: "3", label: "Yayın ayarları", hint: "Kitle & erişim" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export type DenemeWizardContext = "kurum" | "global";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: KurumDeneme | GlobalExam | null;
  initialStep?: number;
  onSave: (item: KurumDeneme | GlobalExam) => void;
  context?: DenemeWizardContext;
};

export function KurumDenemeWizardModal({
  open,
  onOpenChange,
  initial,
  initialStep = 0,
  onSave,
  context = "kurum",
}: Props) {
  const isGlobal = context === "global";
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("1");
  const [excelOpen, setExcelOpen] = useState(false);
  const [bookletOpen, setBookletOpen] = useState(false);
  const [bookletInitialTarget, setBookletInitialTarget] =
    useState<TargetBooklet>("B");
  const [selectedBookletPill, setSelectedBookletPill] = useState<
    "A" | "B" | "C" | "D"
  >("A");
  const [kitapcikHaritalari, setKitapcikHaritalari] = useState<BookletCrossMaps>(() =>
    createEmptyBookletMaps(getExamLayout("TYT").n)
  );
  const [ad, setAd] = useState("");
  const [tarih, setTarih] = useState(todayIso());
  const [saat, setSaat] = useState("09:00");
  const [pdfName, setPdfName] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | undefined>();
  const [prevPdfName, setPrevPdfName] = useState<string | undefined>();
  const [bulkKey, setBulkKey] = useState("");
  const [ogrenciKapsam, setOgrenciKapsam] = useState<"tum" | "secili">("secili");
  const [editId, setEditId] = useState<string | null>(null);
  const [dropOver, setDropOver] = useState(false);
  const matrixScrollRef = useRef<HTMLDivElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const openInitializedRef = useRef(false);

  const {
    sinav,
    matrix,
    layout,
    rebuildForSinav,
    loadFromExam,
    resetEmpty,
    applyBulkKey,
    updateRow,
    mergeExcel,
    getRowDecoded,
    layoutHint,
  } = useExamMatrix("TYT");

  const tabFromIndex = (i: number): TabId =>
    TABS[Math.min(Math.max(i, 0), TABS.length - 1)]!.id;

  const openNew = useCallback(() => {
    setEditId(null);
    setAd("");
    setTarih(todayIso());
    setSaat("09:00");
    setPdfName("");
    setPdfUrl(undefined);
    setPrevPdfName(undefined);
    setBulkKey("");
    setOgrenciKapsam("secili");
    resetEmpty("TYT");
    setKitapcikHaritalari(createEmptyBookletMaps(getExamLayout("TYT").n));
    setSelectedBookletPill("A");
    setActiveTab("1");
  }, [resetEmpty]);

  const openEdit = useCallback(
    (src: KurumDeneme | GlobalExam, tab: TabId) => {
      const fresh =
        getKurumDenemeById(src.id) ?? (src as KurumDeneme);
      setEditId(fresh.id);
      setAd(fresh.ad);
      setTarih(fresh.tarih || todayIso());
      setSaat(fresh.saat || "09:00");
      setPdfName(fresh.pdfName || "");
      setPdfUrl(fresh.pdfUrl);
      setPrevPdfName(fresh.pdfName);
      setOgrenciKapsam(fresh.ogrenciKapsam || "secili");
      loadFromExam(fresh);
      const n = fresh.soruSayisi || getExamLayout(fresh.sinav).n;
      setKitapcikHaritalari(normalizeBookletMaps(fresh.kitapcikHaritalari, n));
      setActiveTab(tab);

      void import("@/lib/exams/storage/kurum-pdf-storage").then(({ hydrateKurumExamPdfAsync }) =>
        hydrateKurumExamPdfAsync(fresh).then((hydrated) => {
          if (hydrated.pdfUrl) setPdfUrl(hydrated.pdfUrl);
        })
      );
    },
    [loadFromExam]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      openInitializedRef.current = false;
      return;
    }
    document.body.style.overflow = "hidden";
    if (!openInitializedRef.current) {
      openInitializedRef.current = true;
      if (initial) {
        openEdit(initial, tabFromIndex(initialStep));
      } else {
        openNew();
      }
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, initial?.id, initialStep, openEdit, openNew, initial]);

  useEffect(() => {
    if (open && activeTab === "2" && matrixScrollRef.current) {
      matrixScrollRef.current.scrollTop = 0;
    }
  }, [open, activeTab, sinav, matrix.n]);

  useEffect(() => {
    if (!open) return;
    setKitapcikHaritalari((prev) => normalizeBookletMaps(prev, matrix.n));
  }, [open, matrix.n]);

  const openBookletMapping = (target: TargetBooklet = "B") => {
    setBookletInitialTarget(target);
    setBookletOpen(true);
  };

  const handleBookletPill = (pill: "A" | "B" | "C" | "D") => {
    setSelectedBookletPill(pill);
    if (pill === "A") {
      toast.message("A kitapçığı master matris — aşağıdaki tablo kaynak doğruluktur.");
      return;
    }
    if (pill === "B") {
      toast.info(
        "Kitapçık B için farklı kitapçıklar otonom eşlemesi mevcut. İsterseniz «Farklı Kitapçıklar» ile manuel eşleştirme de yapabilirsiniz."
      );
      return;
    }
    openBookletMapping(pill);
  };

  const matrixBookletBar = (
    <div className="kdy-matrix-booklet-bar">
      <span className="kdy-matrix-booklet-bar__label">Kitapçık</span>
      <div className="kdy-booklet-pills" role="group" aria-label="Kitapçık seçimi">
        {(["A", "B", "C", "D"] as const).map((pill) => (
          <button
            key={pill}
            type="button"
            className={`kdy-booklet-pill${selectedBookletPill === pill ? " is-active" : ""}`}
            aria-pressed={selectedBookletPill === pill}
            onClick={() => handleBookletPill(pill)}
          >
            <span className="kdy-booklet-pill__letter">{pill}</span>
            <span className="kdy-booklet-pill__text">Kitapçığı</span>
          </button>
        ))}
      </div>
    </div>
  );

  const handleSinavChange = (next: SinavTipi) => {
    rebuildForSinav(next);
    if (matrixScrollRef.current) matrixScrollRef.current.scrollTop = 0;
  };

  const handlePdf = (file: File | null) => {
    if (!file) return;
    setPdfName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setPdfUrl(typeof reader.result === "string" ? reader.result : undefined);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const pct = computeMatrixPct(matrix.cevaplar, matrix.n);
    const finalPdfName = pdfName || prevPdfName;
    const base = {
      id: editId || (isGlobal ? createGlobalDenemeId() : createKurumDenemeId()),
      ad: ad.trim() || (isGlobal ? "Adsız global deneme" : "Adsız deneme"),
      tarih,
      saat: saat || "09:00",
      sinav,
      soruSayisi: matrix.n,
      pdfName: finalPdfName,
      pdfUrl: pdfUrl || (initial?.pdfUrl && !pdfName ? initial.pdfUrl : undefined),
      pdfYuklu: isPdfYuklu({ pdfName: finalPdfName, pdfUrl }),
      matrixPct: pct,
      ogrenciKapsam,
      sinifler: [] as string[],
      cevaplar: matrix.cevaplar.slice(),
      zorluk: matrix.zorluk.slice(),
      konu: matrix.konu.slice(),
      konuYazi: matrix.konuYazi.slice(),
      kitapcikHaritalari,
      atanan: 0,
    };
    const payload = isGlobal
      ? globalExamFromWizard(
          { ...base, scope: "kurumsal" } as KurumDeneme,
          (initial as GlobalExam | null) ?? null
        )
      : enrichKurumDeneme({ ...base, scope: "kurumsal" });
    onSave(payload);
    onOpenChange(false);
    setActiveTab("1");
    appToast.examCreated(Boolean(editId));
  };

  const closeAll = () => {
    if (excelOpen) {
      setExcelOpen(false);
      return;
    }
    if (bookletOpen) {
      setBookletOpen(false);
      return;
    }
    onOpenChange(false);
    setEditId(null);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAll();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!mounted || !open) return null;

  const curTabNum = parseInt(activeTab, 10);
  const pct = computeMatrixPct(matrix.cevaplar, matrix.n);
  const pdfOk = isPdfYuklu({ pdfName: pdfName || prevPdfName, pdfUrl });

  const modal = (
    <div className="kdy-wizard-root">
      <div
        className="modal-overlay modal-overlay--kdy is-open"
        id="kdy-modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kdy-modal-title"
        data-dnm-context={context}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeAll();
        }}
      >
        <div className="modal modal--kdy" id="kdy-modal-panel" onClick={(e) => e.stopPropagation()}>
          <div className="kdy-modal__head">
            <div>
              <h2 id="kdy-modal-title" className="kdy-modal__title">
                {isGlobal
                  ? editId
                    ? "Global denemeyi düzenle"
                    : "Yeni Global Deneme"
                  : editId
                    ? "Kurumsal denemeyi düzenle"
                    : "Yeni Kurum Denemesi"}
              </h2>
              <p id="kdy-modal-subtitle" className="kdy-modal__subtitle">
                {isGlobal
                  ? "Merkezi takvim — üç adımda matris ve yayın ayarları."
                  : "Sınav hazırlama laboratuvarı — üç adımda tamamlayın."}
              </p>
            </div>
            <button
              type="button"
              className="kdy-modal__close btn-icon"
              id="kdy-modal-close"
              aria-label="Kapat"
              onClick={closeAll}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div
            className={`kdy-tabs kdy-stepstrip${isGlobal ? " kdy-stepstrip--global" : ""}`}
            role="tablist"
            aria-label="Deneme adımları"
          >
            {TABS.map((t, i) => {
              const n = i + 1;
              let stateClass = "";
              if (t.id === activeTab) stateClass = "kdy-tab--active";
              else if (n < curTabNum) stateClass = "kdy-tab--done";
              else stateClass = "kdy-tab--pending";
              return (
                <span key={t.id} style={{ display: "contents" }}>
                  {i > 0 && <span className="kdy-stepstrip__connector" aria-hidden />}
                  <button
                    type="button"
                    className={`kdy-tab ${stateClass}`}
                    role="tab"
                    aria-selected={t.id === activeTab}
                    id={`kdy-tab-${t.id}`}
                    data-kdy-tab={t.id}
                    onClick={() => setActiveTab(t.id)}
                  >
                    <span className="kdy-tab__step" aria-hidden>
                      <span className="kdy-tab__circle">{t.id}</span>
                    </span>
                    <span className="kdy-tab__text">
                      <span className="kdy-tab__label">{t.label}</span>
                      <span className="kdy-tab__hint">{t.hint}</span>
                    </span>
                  </button>
                </span>
              );
            })}
          </div>

          <div className="kdy-tab-panels">
            <section
              className={`kdy-panel ${activeTab === "1" ? "kdy-panel--active" : ""}`}
              role="tabpanel"
              id="kdy-panel-1"
              hidden={activeTab !== "1"}
              data-kdy-panel="1"
            >
              <div className="kdy-form-grid">
                <label className="kdy-field kdy-field--full">
                  <span className="kdy-field__label">Deneme adı</span>
                  <input
                    type="text"
                    id="kdy-f-name"
                    className="kdy-input"
                    placeholder="Örn. Aralık TYT Deneme 3"
                    value={ad}
                    onChange={(e) => setAd(e.target.value)}
                    autoComplete="off"
                  />
                </label>
                <label className="kdy-field">
                  <span className="kdy-field__label">Tarih</span>
                  <input
                    type="date"
                    id="kdy-f-date"
                    className="kdy-input"
                    value={tarih}
                    onChange={(e) => setTarih(e.target.value)}
                  />
                </label>
                <label className="kdy-field">
                  <span className="kdy-field__label">Başlangıç saati</span>
                  <input
                    type="time"
                    id="kdy-f-time"
                    className="kdy-input"
                    value={saat}
                    onChange={(e) => setSaat(e.target.value)}
                  />
                </label>
                <fieldset className="kdy-field kdy-field--radio">
                  <legend className="kdy-field__label">Sınav tipi</legend>
                  <div className="kdy-segment" id="kdy-f-sinav">
                    {(["TYT", "AYT", "YDT"] as const).map((t) => (
                      <label key={t} className="kdy-segment__lbl">
                        <input
                          type="radio"
                          name="kdy-sinav"
                          value={t}
                          checked={sinav === t}
                          onChange={() => handleSinavChange(t)}
                        />
                        {t}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>

              <div
                className={`kdy-dropzone ${dropOver ? "kdy-dropzone--over" : ""}`}
                id="kdy-dropzone"
                tabIndex={0}
                onClick={() => pdfInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDropOver(true);
                }}
                onDragLeave={() => setDropOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDropOver(false);
                  handlePdf(e.dataTransfer.files?.[0] ?? null);
                }}
              >
                <input
                  ref={pdfInputRef}
                  type="file"
                  id="kdy-f-pdf"
                  className="kdy-dropzone__input"
                  accept=".pdf,application/pdf"
                  onChange={(e) => handlePdf(e.target.files?.[0] ?? null)}
                />
                <div className="kdy-dropzone__visual">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <path d="M14 2v6h6M12 18v-6M9 15l3 3 3-3" />
                  </svg>
                  <strong>PDF / kitapçık</strong>
                  <span>Sürükleyip bırakın veya tıklayarak seçin</span>
                  <span id="kdy-dropzone-name" className="kdy-dropzone__file">
                    {pdfName || prevPdfName || ""}
                  </span>
                </div>
              </div>
            </section>

            <section
              className="kdy-panel"
              role="tabpanel"
              id="kdy-panel-2"
              hidden={activeTab !== "2"}
              data-kdy-panel="2"
            >
              <p className="kdy-panel__hint" id="kdy-matrix-hint">
                {layoutHint}
              </p>

              <div className="kdy-bulk">
                <label className="kdy-bulk__label">
                  <span className="kdy-field__label">Toplu cevap anahtarı yapıştır</span>
                  <input
                    type="text"
                    id="kdy-bulk-key"
                    className="kdy-input kdy-input--mono"
                    placeholder="Örn. ABDCEED..."
                    value={bulkKey}
                    onChange={(e) => setBulkKey(e.target.value)}
                    autoComplete="off"
                  />
                </label>
                <button
                  type="button"
                  className="btn-export"
                  id="kdy-bulk-apply"
                  onClick={() => {
                    applyBulkKey(bulkKey);
                    toast.success("Anahtar matrise uygulandı");
                  }}
                >
                  Satırlara dağıt
                </button>
              </div>

              {!isGlobal && (
                <div className="kdy-quick-import">
                  <div className="kdy-quick-import__head">
                    <span className="kdy-field__label">Hızlı içe aktarma</span>
                    <span className="kdy-quick-import__sub">
                      Excel, PDF veya çapraz kitapçık eşlemesi ile matrisi doldurun.
                    </span>
                  </div>
                  <div className="kdy-import-toolbar">
                    <button
                      type="button"
                      className="kdy-import-btn"
                      id="kdy-excel-open"
                      onClick={() => setExcelOpen(true)}
                    >
                      <span className="kdy-import-btn__icon" aria-hidden>
                        📊
                      </span>
                      <span className="kdy-import-btn__text">Excel Şablonu ile Yükle</span>
                    </button>
                    <button
                      type="button"
                      className="kdy-import-btn kdy-import-btn--soon"
                      id="kdy-pdf-open"
                      onClick={() => {
                        toast.info(
                          "PDF otonom aktarım yakında. Şimdilik Excel şablonu ile içe aktarabilirsiniz."
                        );
                      }}
                    >
                      <span className="kdy-import-btn__icon" aria-hidden>
                        ✨
                      </span>
                      <span className="kdy-import-btn__text">PDF&apos;den Otonom Aktar</span>
                      <span className="kdy-import-btn__badge">Yakında</span>
                    </button>
                    <button
                      type="button"
                      className="kdy-import-btn"
                      id="kdy-booklet-open"
                      onClick={() => openBookletMapping("B")}
                    >
                      <span className="kdy-import-btn__icon" aria-hidden>
                        📑
                      </span>
                      <span className="kdy-import-btn__text">Farklı Kitapçıklar</span>
                    </button>
                  </div>
                </div>
              )}

              {isGlobal && (
                <div className="kdy-quick-import kdy-quick-import--single">
                  <div className="kdy-quick-import__head">
                    <span className="kdy-field__label">Kitapçık eşleştirme</span>
                    <span className="kdy-quick-import__sub">
                      B, C ve D kitapçıklarını A matrisine manuel bağlayın.
                    </span>
                  </div>
                  <div className="kdy-import-toolbar kdy-import-toolbar--single">
                    <button
                      type="button"
                      className="kdy-import-btn"
                      onClick={() => openBookletMapping("B")}
                    >
                      <span className="kdy-import-btn__icon" aria-hidden>
                        📑
                      </span>
                      <span className="kdy-import-btn__text">Farklı Kitapçıklar</span>
                    </button>
                  </div>
                </div>
              )}

              {matrixBookletBar}

              <div ref={matrixScrollRef}>
                <ExamMatrixTable
                  matrix={matrix}
                  layout={layout}
                  onUpdateRow={updateRow}
                  getRowDecoded={getRowDecoded}
                />
              </div>
            </section>

            <section
              className="kdy-panel kdy-panel--publish"
              role="tabpanel"
              id="kdy-panel-3"
              hidden={activeTab !== "3"}
              data-kdy-panel="3"
            >
              <div className="kdy-publish-hero">
                <div className="kdy-publish-hero__icon" aria-hidden>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                  </svg>
                </div>
                <div>
                  <h3 className="kdy-publish-hero__title" style={{ margin: 0, fontWeight: 700 }}>
                    Hedef kitleyi netleştirin
                  </h3>
                  <p style={{ margin: "6px 0 0", fontSize: "0.84rem", color: "var(--text-muted)" }}>
                    Denemenin hangi öğrenci kümesine açılacağını seçin.
                  </p>
                </div>
              </div>

              <fieldset className="kdy-publish-fieldset">
                <legend className="visually-hidden" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>
                  Öğrenci kapsamı
                </legend>
                <div className="kdy-publish-scope">
                  <label className="kdy-publish-scope-card">
                    <input
                      type="radio"
                      name="kdy-ogrenci"
                      value="secili"
                      className="kdy-publish-scope-card__input"
                      checked={ogrenciKapsam === "secili"}
                      onChange={() => setOgrenciKapsam("secili")}
                    />
                    <span className="kdy-publish-scope-card__body">
                      <span className="kdy-publish-scope-card__check" aria-hidden />
                      <span>
                        <span className="kdy-publish-scope-card__title" style={{ display: "block", fontWeight: 700 }}>
                          Kurum içi hedefli yayın
                        </span>
                        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                          Varsayılan: kurum içi hedefli görünürlük.
                        </span>
                      </span>
                    </span>
                  </label>
                  <label className="kdy-publish-scope-card">
                    <input
                      type="radio"
                      name="kdy-ogrenci"
                      value="tum"
                      className="kdy-publish-scope-card__input"
                      checked={ogrenciKapsam === "tum"}
                      onChange={() => setOgrenciKapsam("tum")}
                    />
                    <span className="kdy-publish-scope-card__body">
                      <span className="kdy-publish-scope-card__check" aria-hidden />
                      <span>
                        <span style={{ display: "block", fontWeight: 700 }}>Tüm kayıtlı öğrenciler</span>
                        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                          Kurumdaki tüm aktif öğrenci hesaplarına açılır.
                        </span>
                      </span>
                    </span>
                  </label>
                </div>
              </fieldset>

              <p className="kdy-panel__hint" style={{ marginTop: 16 }}>
                Durum önizleme: <strong>{durumLabel(deriveDurum(pct, pdfOk))}</strong> · Matris {pct}%
              </p>
            </section>
          </div>

          <div className="kdy-modal__footer">
            <button type="button" className="btn-export" id="kdy-modal-cancel" onClick={closeAll}>
              Vazgeç
            </button>
            <button type="button" className="btn-add" id="kdy-modal-save" onClick={handleSave}>
              Kaydet
            </button>
          </div>
        </div>
      </div>

      {!isGlobal && (
        <ExcelOverlay
          open={excelOpen}
          onClose={() => setExcelOpen(false)}
          sinav={sinav}
          matrix={matrix}
          onApply={mergeExcel}
        />
      )}
      <BookletCrossMappingOverlay
        open={bookletOpen}
        onClose={() => setBookletOpen(false)}
        matrix={matrix}
        initialMaps={kitapcikHaritalari}
        initialTargetBooklet={bookletInitialTarget}
        getRowDecoded={getRowDecoded}
        onApply={setKitapcikHaritalari}
      />
    </div>
  );

  return createPortal(modal, document.body);
}
