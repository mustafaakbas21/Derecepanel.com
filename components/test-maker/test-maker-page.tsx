"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";

import { A4Document } from "@/components/test-maker/a4-document";
import { CropStudioModal } from "@/components/test-maker/crop-studio-modal";
import { ExportOverlay } from "@/components/test-maker/export-overlay";
import { HavuzModal } from "@/components/test-maker/havuz-modal";
import { MatrixModal } from "@/components/test-maker/matrix-modal";
import { PdfPanel } from "@/components/test-maker/pdf-panel";
import { ResetModal } from "@/components/test-maker/reset-modal";
import { TemplatePopover } from "@/components/test-maker/template-popover";
import { STORAGE_KEYS } from "@/lib/test-maker/constants";
import { applyTemplate } from "@/lib/test-maker/templates";
import {
  exportTestPdfToCloud,
  isCloudPdfConfigured,
  printA4Local,
} from "@/lib/test-maker/cloud-pdf";
import { cacheKurum, defaultTMConfig, syncTMConfig } from "@/lib/test-maker/default-config";
import { appendAssigned, readLastResultInsight } from "@/lib/test-maker/fascicle";
import {
  consumeAutoprintFlag,
  consumeQuestionTransfer,
  consumeTaramaEditId,
  consumeTransferDersKonu,
} from "@/lib/test-maker/intake";
import { tmToast } from "@/lib/test-maker/notify";
import { buildAnswerKey } from "@/lib/test-maker/paginate";
import { usePdfDocument } from "@/lib/test-maker/use-pdf-document";
import { loadQuestionPool } from "@/lib/test-maker/question-pool";
import { createQuestion } from "@/lib/test-maker/questions";
import {
  genTaramaId,
  pushExportMeta,
  taramaGet,
  taramaPut,
} from "@/lib/test-maker/tarama-db";
import type {
  AnswerLetter,
  QPerPage,
  QuestionPoolItem,
  TemplateId,
  TMConfig,
  TMQuestion,
} from "@/lib/test-maker/types";
import { getSubjectById, getSubjects, getTopicById, getTopics } from "@/lib/mufredat";
import { loadStudentsFull } from "@/lib/students/storage";
import { cn } from "@/lib/utils";

import "@/styles/test-maker-theme.css";
import "@/styles/test-maker-studio.css";
import "@/styles/test-maker.css";
import "@/styles/test-maker-templates.css";

export function TestMakerPage() {
  const [hydrated, setHydrated] = useState(false);
  const [config, setConfig] = useState<TMConfig>(defaultTMConfig);
  const [questions, setQuestions] = useState<TMQuestion[]>([]);
  const [template, setTemplate] = useState<TemplateId>("derece");
  const [templateName, setTemplateName] = useState("Derece Kurumsal");
  const [qPerPage, setQPerPage] = useState<QPerPage>(4);
  const [showCover, setShowCover] = useState(true);
  const [showAnswerKey, setShowAnswerKey] = useState(true);
  const [manualExtraPages, setManualExtraPages] = useState(0);
  const [pool, setPool] = useState<QuestionPoolItem[]>([]);
  const [havuzOpen, setHavuzOpen] = useState(false);
  const [matrixOpen, setMatrixOpen] = useState(false);
  const [lastMatrixKey, setLastMatrixKey] = useState<string | null>(null);
  const [currentTaramaId, setCurrentTaramaId] = useState<string | null>(null);
  const [lastPdfId, setLastPdfId] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);
  const [exportOverlay, setExportOverlay] = useState<string | null>(null);
  const [cloudReady, setCloudReady] = useState<boolean | null>(null);
  const pdf = usePdfDocument();
  const pendingAutoprint = useRef(false);

  useEffect(() => {
    void isCloudPdfConfigured().then(setCloudReady);
  }, []);

  useEffect(() => {
    let cfg = defaultTMConfig();
    const dk = consumeTransferDersKonu();
    if (dk) {
      if (dk.dersId) {
        const sub = getSubjectById(dk.dersId);
        if (sub) cfg = { ...cfg, dersId: sub.id, dersLabel: sub.name };
      } else if (dk.dersText) {
        const sub = getSubjects("ALL").find(
          (s) => s.name === dk.dersText || s.name.includes(dk.dersText!)
        );
        if (sub) cfg = { ...cfg, dersId: sub.id, dersLabel: sub.name };
      }
      if (dk.konuId && cfg.dersId) {
        const top = getTopicById(cfg.dersId, dk.konuId);
        if (top) cfg = { ...cfg, konuId: top.id, konuLabel: top.name };
      } else if (dk.konuText && cfg.dersId) {
        const top = getTopics(cfg.dersId).find((t) => t.name.includes(dk.konuText!));
        if (top) cfg = { ...cfg, konuId: top.id, konuLabel: top.name };
      }
    }

    let qs: TMQuestion[] = [];
    const fromTarama = consumeQuestionTransfer(STORAGE_KEYS.transferTarama);
    const fromRecipe = consumeQuestionTransfer(STORAGE_KEYS.transferRecipe);
    if (fromTarama?.length) qs = [...qs, ...fromTarama];
    if (fromRecipe?.length) qs = [...qs, ...fromRecipe];

    pendingAutoprint.current = consumeAutoprintFlag();

    const editId = consumeTaramaEditId();
    if (editId) {
      void taramaGet(editId).then((rec) => {
        if (!rec) return;
        setCurrentTaramaId(rec.id);
        setConfig((c) => ({
          ...c,
          dersLabel: rec.ders,
          konuLabel: rec.konu,
          kurum: rec.kurum,
          coverTitle: rec.coverTitle,
        }));
        setQuestions(
          rec.questions.map((q, i) => ({
            id: q.id || `q-${i}`,
            imageDataUrl: q.imageDataUrl,
            answer: (q.answer as AnswerLetter) || null,
          }))
        );
        if (rec.layout?.qPerPage === "6") setQPerPage(6);
        if (rec.layout?.sablon) setTemplate(rec.layout.sablon as TemplateId);
        tmToast.taramaLoaded(rec.name);
      });
    }

    setConfig(syncTMConfig(cfg));
    if (!editId && qs.length) setQuestions(qs);
    setPool(loadQuestionPool());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    applyTemplate(template, templateName);
  }, [hydrated, template, templateName]);

  useEffect(() => {
    if (!hydrated || !pendingAutoprint.current) return;
    pendingAutoprint.current = false;
    const t = window.setTimeout(() => {
      if (printA4Local()) tmToast.success("Yazdırma penceresi açıldı");
    }, 600);
    return () => window.clearTimeout(t);
  }, [hydrated, questions.length]);

  const students = useMemo(() => (hydrated ? loadStudentsFull() : []), [hydrated]);
  const fascicleInsight = useMemo(
    () => (config.ogrenciId ? readLastResultInsight(config.ogrenciId) : null),
    [config.ogrenciId]
  );

  const answerStats = useMemo(() => {
    const total = questions.length;
    const filled = questions.filter((q) => {
      const a = q.answer?.toUpperCase();
      return a && ["A", "B", "C", "D", "E"].includes(a);
    }).length;
    return { total, filled, complete: total > 0 && filled === total };
  }, [questions]);

  const patchConfig = useCallback((patch: Partial<TMConfig>) => {
    setConfig((prev) => {
      const next = syncTMConfig({ ...prev, ...patch });
      if (patch.kurum) cacheKurum(patch.kurum);
      return next;
    });
  }, []);

  const addFromPool = (items: QuestionPoolItem[]) => {
    const added = items.map((item) =>
      createQuestion({
        imageDataUrl: item.dataUrl,
        correctLetter: item.answer ?? undefined,
        fromHavuz: true,
        poolUuid: item.uuid,
      })
    );
    setQuestions((q) => [...q, ...added]);
    tmToast.poolAdded(added.length);
  };

  const handleAnswer = (id: string, letter: AnswerLetter) => {
    setQuestions((qs) =>
      qs.map((q) =>
        q.id === id ? { ...q, answer: q.answer === letter ? null : letter } : q
      )
    );
  };

  const handleSaveTarama = async () => {
    if (questions.length === 0) {
      tmToast.needQuestions();
      return;
    }
    const key = buildAnswerKey(questions);
    if (key.includes(" ")) {
      tmToast.needAnswerKey();
      return;
    }
    const id = currentTaramaId ?? genTaramaId();
    const name = config.coverTitle || "Tarama";
    const rec = {
      id,
      name,
      ders: config.dersLabel,
      konu: config.konuLabel,
      kurum: config.kurum,
      coverTitle: config.coverTitle,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      layout: { qPerPage: String(qPerPage), sablon: template },
      questions: questions.map((q) => ({
        id: q.id,
        imageDataUrl: q.imageDataUrl,
        answer: q.answer,
      })),
      thumbs: questions.slice(0, 4).map((q) => q.imageDataUrl),
      pdf_file_id: lastPdfId ?? undefined,
      matrixSnapshot: lastMatrixKey,
      cevapAnahtari: key,
    };
    try {
      await taramaPut(rec);
      pushExportMeta({
        id,
        name,
        soruSayisi: questions.length,
        savedAt: new Date().toISOString(),
      });
      setCurrentTaramaId(id);
      tmToast.taramaSaved(name, questions.length, Boolean(currentTaramaId));
    } catch {
      tmToast.storageFull();
    }
  };

  const handleSendFascicle = () => {
    if (!config.ogrenciId) {
      tmToast.needStudent();
      return;
    }
    if (questions.length === 0) {
      tmToast.needQuestions();
      return;
    }
    const answerKey = buildAnswerKey(questions);
    if (!answerKey.trim() || answerKey.includes(" ")) {
      tmToast.needAnswerKey();
      return;
    }
    const student = students.find((s) => s.ogrenciId === config.ogrenciId);
    appendAssigned(config.ogrenciId, {
      title: config.coverTitle || "Test",
      questionCount: questions.length,
      answerKey,
      template,
      studentCode: student?.studentCode,
      pdf_file_id: lastPdfId ?? undefined,
    });
    tmToast.sentToStudent(config.coverTitle, questions.length);
  };

  const doReset = () => {
    setQuestions([]);
    setManualExtraPages(0);
    setCurrentTaramaId(null);
    setLastPdfId(null);
    setLastMatrixKey(null);
    setConfig(defaultTMConfig());
    setTemplate("derece");
    setTemplateName("Derece Kurumsal");
    setShowCover(true);
    setShowAnswerKey(true);
    setQPerPage(4);
    tmToast.resetDone();
  };

  const addCroppedQuestion = (dataUrl: string, letter?: AnswerLetter) => {
    setQuestions((q) => [
      ...q,
      createQuestion({
        imageDataUrl: dataUrl,
        correctLetter: letter,
        fromHavuz: Boolean(letter),
      }),
    ]);
    if (letter) {
      tmToast.success(`Soru eklendi — cevap: ${letter}`);
    }
  };

  const handleCloudPdf = async () => {
    if (questions.length === 0) {
      tmToast.needQuestions();
      return;
    }
    if (cloudReady === false) {
      tmToast.cloudDisabled();
      return;
    }
    try {
      setExportOverlay("PDF oluşturuluyor…");
      const fileId = await exportTestPdfToCloud(config.coverTitle, setExportOverlay);
      setLastPdfId(fileId);
      if (currentTaramaId) {
        const existing = await taramaGet(currentTaramaId);
        if (existing) {
          await taramaPut({ ...existing, pdf_file_id: fileId });
        }
      }
      tmToast.pdfUploaded();
    } catch (e) {
      const msg = (e as Error).message;
      if (msg === "NOT_CONFIGURED") tmToast.cloudDisabled();
      else tmToast.error("PDF yüklenemedi", msg);
    } finally {
      setExportOverlay(null);
    }
  };

  if (!hydrated) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-sm text-slate-500">
        Test Oluşturucu yükleniyor…
      </div>
    );
  }

  return (
    <div
      id="tw-scope"
      className="tm-saas-shell tm-saas-shell--document-scroll tm-saas-shell--studio space-y-4 p-5 pb-12"
    >
      <header className="tm-studio-header">
        <h1>Test Oluşturucu</h1>
        <p>A4 test stüdyosu — PDF kırp, şablon, cevap anahtarı ve öğrenciye gönderim.</p>
      </header>

      <section className="tm-studio-card tm-studio-config grid gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <div>
          <label className="tm-config-label" htmlFor="tm-select-ders">
            Ders
          </label>
          <select
            id="tm-select-ders"
            className="tm-config-input"
            value={config.dersId}
            onChange={(e) => {
              const sub = getSubjectById(e.target.value);
              const t0 = getTopics(e.target.value)[0];
              patchConfig({
                dersId: e.target.value,
                dersLabel: sub?.name ?? "",
                konuId: t0?.id ?? "",
                konuLabel: t0?.name ?? "",
              });
            }}
          >
            {getSubjects("ALL").map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="tm-config-label" htmlFor="tm-select-konu">
            Konu
          </label>
          <select
            id="tm-select-konu"
            className="tm-config-input"
            value={config.konuId}
            onChange={(e) => {
              const top = getTopicById(config.dersId, e.target.value);
              patchConfig({ konuId: e.target.value, konuLabel: top?.name ?? "" });
            }}
          >
            {getTopics(config.dersId).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="tm-config-label" htmlFor="tm-input-kurum">
            Kurum adı
          </label>
          <input
            id="tm-input-kurum"
            className="tm-config-input"
            value={config.kurum}
            onChange={(e) => patchConfig({ kurum: e.target.value })}
          />
        </div>
        <div>
          <label className="tm-config-label" htmlFor="cover-title-input">
            Kapak başlığı
          </label>
          <input
            id="cover-title-input"
            className="tm-config-input"
            value={config.coverTitle}
            onChange={(e) => patchConfig({ coverTitle: e.target.value })}
          />
        </div>
        <div>
          <label className="tm-config-label" htmlFor="tm-select-ogrenci">
            Öğrenci
          </label>
          <select
            id="tm-select-ogrenci"
            className="tm-config-input"
            value={config.ogrenciId}
            onChange={(e) => patchConfig({ ogrenciId: e.target.value })}
          >
            <option value="">Seçin…</option>
            {students.map((s) => (
              <option key={s.ogrenciId} value={s.ogrenciId}>
                {s.name} ({s.studentCode})
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col justify-end">
          <p className="tm-config-label">Insight</p>
          <p id="tm-fascicle-insight" className="text-xs text-slate-500">
            {fascicleInsight ?? "Öğrenci seçince son optik özeti görünür"}
          </p>
        </div>
      </section>

      <section className="tm-studio-card print:hidden">
        <div className="tm-studio-actions">
          <div className="tm-studio-actions__group">
            <button
              type="button"
              id="btn-open-havuz-modal"
              className="tm-studio-btn tm-studio-btn--primary"
              onClick={() => setHavuzOpen(true)}
            >
              Soru Havuzu
            </button>
            <button
              type="button"
              className="tm-studio-btn tm-studio-btn--secondary"
              onClick={() => setQuestions((q) => [...q, createQuestion()])}
            >
              <Plus className="h-3.5 w-3.5" />
              Boş soru
            </button>
          </div>
          <div className="tm-studio-actions__group">
            <button
              type="button"
              id="tm-btn-fascicle-send"
              className="tm-studio-btn tm-studio-btn--secondary"
              onClick={handleSendFascicle}
            >
              Öğrenciye gönder
            </button>
            <button
              type="button"
              id="tm-btn-save-tarama"
              className="tm-studio-btn tm-studio-btn--secondary"
              onClick={() => void handleSaveTarama()}
            >
              Tarama kaydet
            </button>
            <button
              type="button"
              id="tm-btn-matrix"
              className="tm-studio-btn tm-studio-btn--secondary"
              onClick={() => setMatrixOpen(true)}
            >
              Matrix
            </button>
          </div>
          <div className="tm-studio-actions__group">
            <button
              type="button"
              id="tm-btn-chrome-pdf"
              className="tm-studio-btn tm-studio-btn--secondary"
              onClick={() => {
                if (!printA4Local()) tmToast.error("Önizleme açılamadı", "A4 alanı bulunamadı");
              }}
            >
              PDF önizle
            </button>
            <button
              type="button"
              id="tm-btn-pdf-indir"
              className={cn(
                "tm-studio-btn tm-studio-btn--secondary",
                cloudReady === false && "opacity-60"
              )}
              onClick={() => void handleCloudPdf()}
              title={
                cloudReady === false
                  ? "APPWRITE_* env gerekli"
                  : "html2pdf + Appwrite Storage"
              }
            >
              PDF → Bulut
            </button>
            <button
              type="button"
              id="tm-btn-reset"
              className="tm-studio-btn tm-studio-btn--ghost"
              onClick={() => setResetOpen(true)}
            >
              Sıfırla
            </button>
          </div>
        </div>

        <div className="tm-studio-design">
          <TemplatePopover
            activeTpl={template}
            activeName={templateName}
            onSelect={(tpl, name) => {
              setTemplate(tpl);
              setTemplateName(name);
            }}
          />
          <button
            type="button"
            id="tm-btn-add-page"
            className="tm-studio-btn tm-studio-btn--secondary"
            onClick={() => setManualExtraPages((m) => m + 1)}
          >
            Sayfa ekle
          </button>
          <div className="tm-segment-group">
            <button
              type="button"
              id="tm-qpp-4"
              className={cn("tm-segment-btn", qPerPage === 4 && "tm-segment-btn--active")}
              onClick={() => setQPerPage(4)}
            >
              4 / sayfa
            </button>
            <button
              type="button"
              id="tm-qpp-6"
              className={cn("tm-segment-btn", qPerPage === 6 && "tm-segment-btn--active")}
              onClick={() => setQPerPage(6)}
            >
              6 / sayfa
            </button>
          </div>
          <button
            type="button"
            id="tm-cb-cover"
            className={cn("tm-studio-toggle", showCover && "is-on")}
            onClick={() => setShowCover((v) => !v)}
            aria-pressed={showCover}
          >
            <span className="tm-studio-toggle__dot" />
            Kapak sayfası
          </button>
          <button
            type="button"
            id="tm-cb-answer"
            className={cn("tm-studio-toggle", showAnswerKey && "is-on")}
            onClick={() => setShowAnswerKey((v) => !v)}
            aria-pressed={showAnswerKey}
          >
            <span className="tm-studio-toggle__dot" />
            Cevap anahtarı
          </button>
          <div
            className={cn(
              "tm-studio-ak-strip",
              answerStats.total > 0 && !answerStats.complete && "tm-studio-ak-strip--warn"
            )}
            id="tm-answer-key-status"
          >
            <span>
              Cevap:{" "}
              <strong>
                {answerStats.filled}/{answerStats.total}
              </strong>
            </span>
            {answerStats.total > 0 && !answerStats.complete && (
              <span className="text-amber-700">Eksik şıkları işaretleyin</span>
            )}
          </div>
        </div>
      </section>

      <div className="tm-studio-workspace">
        <div className="tm-studio-a4-col min-w-0">
          <div className="tm-a4-preview-wrap">
          <A4Document
            config={config}
            template={template}
            templateName={templateName}
            questions={questions}
            qPerPage={qPerPage}
            manualExtraPages={manualExtraPages}
            showCover={showCover}
            showAnswerKey={showAnswerKey}
            onQuestionsChange={setQuestions}
            onAnswer={handleAnswer}
            onDelete={(id) => setQuestions((q) => q.filter((x) => x.id !== id))}
            onRemoveExtraPage={() =>
              setManualExtraPages((m) => Math.max(0, m - 1))
            }
          />
          </div>
        </div>
        <div className="tm-studio-pdf-col print:hidden">
          <PdfPanel
            pdf={pdf}
            onCrop={addCroppedQuestion}
            onOpenStudio={() => setStudioOpen(true)}
          />
        </div>
      </div>

      <ExportOverlay visible={Boolean(exportOverlay)} message={exportOverlay ?? ""} />

      <CropStudioModal
        open={studioOpen}
        onClose={() => setStudioOpen(false)}
        pdf={pdf}
        onCrop={addCroppedQuestion}
      />

      <ResetModal open={resetOpen} onOpenChange={setResetOpen} onConfirm={doReset} />

      <HavuzModal
        open={havuzOpen}
        onOpenChange={setHavuzOpen}
        pool={pool}
        onConfirm={addFromPool}
      />
      <MatrixModal
        open={matrixOpen}
        onOpenChange={setMatrixOpen}
        defaultName={config.coverTitle}
        questionCount={questions.length || 40}
        onSaved={setLastMatrixKey}
      />
    </div>
  );
}
