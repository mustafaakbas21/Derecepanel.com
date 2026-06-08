"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  Cloud,
  Download,
  FilePlus,
  Grid3X3,
  Layers,
  Plus,
  RotateCcw,
  ScanLine,
  Save,
  Send,
} from "lucide-react";

import { A4Document } from "@/components/test-maker/a4-document";
import { CloudBeforeExportModal } from "@/components/test-maker/cloud-before-export-modal";
import { CropStudioModal } from "@/components/test-maker/crop-studio-modal";
import { ExportOverlay } from "@/components/test-maker/export-overlay";
import { HavuzModal } from "@/components/test-maker/havuz-modal";
import { MatrixModal } from "@/components/test-maker/matrix-modal";
import { ImageSourcePanel } from "@/components/test-maker/image-source-panel";
import { PdfPanel } from "@/components/test-maker/pdf-panel";
import { ResetModal } from "@/components/test-maker/reset-modal";
import { TestMakerUnsavedLeaveDialog } from "@/components/test-maker/unsaved-leave-dialog";
import { TemplatePopover } from "@/components/test-maker/template-popover";
import {
  applyTemplate,
  getTemplateName,
  resolveTemplateId,
  saveLastTemplate,
} from "@/lib/test-maker/templates";
import { DEFAULT_TEMPLATE } from "@/lib/test-maker/template-registry";
import {
  exportTestPdfToCloud,
  isCloudPdfConfigured,
  printA4Local,
} from "@/lib/test-maker/cloud-pdf";
import { cacheKurum, defaultTMConfig, syncTMConfig } from "@/lib/test-maker/default-config";
import { appendAssigned, readLastResultInsight } from "@/lib/test-maker/fascicle";
import {
  consumeStudioEntryAsync,
  type TransferDersKonu,
} from "@/lib/test-maker/intake";
import {
  registerTestMakerLeaveGuard,
  registerTestMakerLeaveModal,
} from "@/lib/test-maker/leave-guard";
import { buildStudioSnapshot } from "@/lib/test-maker/studio-session";
import { genReceteId, receteGet, recetePut } from "@/lib/hata-recetesi/recete-db";
import type { RecipeArchiveRecord } from "@/lib/hata-recetesi/types";
import { tmToast } from "@/lib/test-maker/notify";
import { buildAnswerKey } from "@/lib/test-maker/paginate";
import { usePdfDocument } from "@/lib/test-maker/use-pdf-document";
import { ensureQuestionPoolInit } from "@/lib/test-maker/question-pool";
import {
  adjustLastWorkedIndexAfterDelete,
  createQuestion,
  lastFilledQuestionIndex,
} from "@/lib/test-maker/questions";
import {
  genTaramaId,
  pushExportMeta,
  taramaGet,
  taramaPut,
} from "@/lib/test-maker/tarama-db";
import { syncTaramaDataMirror } from "@/lib/taramalar/tarama-mirror";
import type {
  AnswerLetter,
  CropAnswerChoice,
  QuestionAnswer,
  QuestionPoolItem,
  TemplateId,
  TMConfig,
  TMQuestion,
} from "@/lib/test-maker/types";
import {
  findStudentIdByCanonical,
  mergeArchiveIntoConfig,
} from "@/lib/test-maker/resolve-config";
import { getSubjectById, getSubjects, getTopicById, getTopics } from "@/lib/mufredat";
import { loadStudentsFull } from "@/lib/students/storage";
import { cn } from "@/lib/utils";
import {
  TestMakerField,
  TestMakerMetrics,
  TestMakerPageHeader,
  TestMakerSection,
  TM_PAGE_CLASS,
  TM_STUDIO_CARD,
  TM_STUDIO_CARD_INNER,
  tmFieldInputClass,
} from "@/components/test-maker/tm-ui";

import "@/styles/test-maker-studio.css";
import "@/styles/test-maker.css";
import "@/styles/test-maker-templates.css";
import "@/styles/test-maker-v2.css";

function applyDersKonuToConfig(cfg: TMConfig, dk: TransferDersKonu | null): TMConfig {
  if (!dk) return cfg;
  let next = { ...cfg };
  if (dk.dersId) {
    const sub = getSubjectById(dk.dersId);
    if (sub) next = { ...next, dersId: sub.id, dersLabel: sub.name };
  } else if (dk.dersText) {
    const sub = getSubjects("ALL").find(
      (s) => s.name === dk.dersText || s.name.includes(dk.dersText!)
    );
    if (sub) next = { ...next, dersId: sub.id, dersLabel: sub.name };
  }
  if (dk.konuId && next.dersId) {
    const top = getTopicById(next.dersId, dk.konuId);
    if (top) next = { ...next, konuId: top.id, konuLabel: top.name };
  } else if (dk.konuText && next.dersId) {
    const top = getTopics(next.dersId).find((t) => t.name.includes(dk.konuText!));
    if (top) next = { ...next, konuId: top.id, konuLabel: top.name };
  }
  return next;
}

export function TestMakerPage() {
  const [hydrated, setHydrated] = useState(false);
  const [config, setConfig] = useState<TMConfig>(defaultTMConfig);
  const [questions, setQuestions] = useState<TMQuestion[]>([]);
  const [template, setTemplate] = useState<TemplateId>(DEFAULT_TEMPLATE.id);
  const [templateName, setTemplateName] = useState(DEFAULT_TEMPLATE.name);
  const [showCover, setShowCover] = useState(true);
  const [showAnswerKey, setShowAnswerKey] = useState(true);
  const [showOptic, setShowOptic] = useState(false);
  const [pool, setPool] = useState<QuestionPoolItem[]>([]);
  const [havuzOpen, setHavuzOpen] = useState(false);
  const [matrixOpen, setMatrixOpen] = useState(false);
  const [lastMatrixKey, setLastMatrixKey] = useState<string | null>(null);
  const [currentTaramaId, setCurrentTaramaId] = useState<string | null>(null);
  const [currentReceteId, setCurrentReceteId] = useState<string | null>(null);
  const [lastPdfId, setLastPdfId] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [exportCloudPromptOpen, setExportCloudPromptOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);
  const [pdfDeposuOpen, setPdfDeposuOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [imageLetter, setImageLetter] = useState<CropAnswerChoice | null>(null);
  const [exportOverlay, setExportOverlay] = useState<string | null>(null);
  const [cloudReady, setCloudReady] = useState<boolean | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const fascicleMode = searchParams.get("mode") === "fascicle";
  const fascicleOgrenciParam = searchParams.get("ogrenci") ?? "";
  const pdf = usePdfDocument();
  const pendingAutoprint = useRef(false);
  const initOnceRef = useRef(false);
  const baselineRef = useRef("");
  const pendingNavRef = useRef<string | null>(null);
  /** Kırpma / cevap girişinde son işlenen soru — yeni kırpma bunun altına eklenir. */
  const lastWorkedQuestionIndexRef = useRef(-1);

  const syncLastWorkedFromQuestions = useCallback((qs: TMQuestion[]) => {
    lastWorkedQuestionIndexRef.current = lastFilledQuestionIndex(qs);
  }, []);

  useEffect(() => {
    void isCloudPdfConfigured().then(setCloudReady);
  }, []);

  useEffect(() => {
    if (!hydrated || !fascicleMode || !fascicleOgrenciParam) return;
    setConfig((prev) => {
      if (prev.ogrenciId) return prev;
      const sid = findStudentIdByCanonical(fascicleOgrenciParam);
      return sid ? syncTMConfig({ ...prev, ogrenciId: sid }) : prev;
    });
  }, [hydrated, fascicleMode, fascicleOgrenciParam]);

  useEffect(() => {
    if (initOnceRef.current) return;
    initOnceRef.current = true;

    const emptyBaseline = (): Parameters<typeof buildStudioSnapshot>[0] => {
      const base = syncTMConfig(defaultTMConfig());
      return {
        questions: [],
        config: {
          dersId: base.dersId,
          konuId: base.konuId,
          kurum: base.kurum,
          coverTitle: base.coverTitle,
          ogrenciId: base.ogrenciId,
        },
        pdfFileCount: 0,
        matrixKey: null,
      };
    };

    const syncBaselineFrom = (input: Parameters<typeof buildStudioSnapshot>[0]) => {
      baselineRef.current = buildStudioSnapshot(input);
    };

    const applyFreshStudio = () => {
      pdf.clearAllFiles();
      lastWorkedQuestionIndexRef.current = -1;
      setQuestions([]);
      setCurrentTaramaId(null);
      setCurrentReceteId(null);
      setLastPdfId(null);
      setLastMatrixKey(null);
      setConfig(syncTMConfig(defaultTMConfig()));
      setTemplate(DEFAULT_TEMPLATE.id);
      setTemplateName(DEFAULT_TEMPLATE.name);
      setShowCover(true);
      setShowAnswerKey(true);
      applyTemplate(DEFAULT_TEMPLATE.id, DEFAULT_TEMPLATE.name);
      syncBaselineFrom(emptyBaseline());
    };

    void (async () => {
      const pool = await ensureQuestionPoolInit();
      setPool(pool);
      const entry = await consumeStudioEntryAsync();

      if (entry.type === "fresh") {
        applyFreshStudio();
        setHydrated(true);
        return;
      }

      if (entry.type === "import") {
        applyFreshStudio();
        let cfg = applyDersKonuToConfig(defaultTMConfig(), entry.dersKonu);
        if (entry.ogrenciId) {
          const sid = findStudentIdByCanonical(entry.ogrenciId);
          if (sid) cfg = { ...cfg, ogrenciId: sid };
        }
        cfg = syncTMConfig(cfg);
        setConfig(cfg);
        if (entry.questions.length) {
          setQuestions(entry.questions);
          lastWorkedQuestionIndexRef.current = lastFilledQuestionIndex(entry.questions);
        }
        pendingAutoprint.current = entry.autoprint;
        syncBaselineFrom(emptyBaseline());
        setHydrated(true);
        return;
      }

      applyFreshStudio();

      if (entry.type === "edit-tarama") {
        void taramaGet(entry.id).then((rec) => {
          if (!rec) return;
          setCurrentTaramaId(rec.id);
          setCurrentReceteId(null);
          const merged = syncTMConfig(mergeArchiveIntoConfig(defaultTMConfig(), rec));
          const qs = rec.questions.map((q, i) => ({
            id: q.id || `q-${i}`,
            imageDataUrl: q.imageDataUrl,
            answer: (q.answer as AnswerLetter) || null,
          }));
          const tpl = resolveTemplateId(rec.layout?.sablon);
          setConfig(merged);
          setQuestions(qs);
          lastWorkedQuestionIndexRef.current = lastFilledQuestionIndex(qs);
          setTemplate(tpl);
          setTemplateName(getTemplateName(tpl));
          syncBaselineFrom({
            questions: qs,
            config: {
              dersId: merged.dersId,
              konuId: merged.konuId,
              kurum: merged.kurum,
              coverTitle: merged.coverTitle,
              ogrenciId: merged.ogrenciId,
            },
            pdfFileCount: 0,
            matrixKey: rec.matrixSnapshot ?? null,
          });
          if (rec.matrixSnapshot) setLastMatrixKey(rec.matrixSnapshot);
          tmToast.taramaLoaded(rec.name);
        });
      } else if (entry.type === "edit-recete") {
        void receteGet(entry.id).then((rec) => {
          if (!rec) return;
          setCurrentReceteId(rec.id);
          setCurrentTaramaId(null);
          const merged = syncTMConfig(mergeArchiveIntoConfig(defaultTMConfig(), rec));
          const qs = rec.questions.map((q, i) => ({
            id: q.id || `q-${i}`,
            imageDataUrl: q.imageDataUrl,
            answer: (q.answer as AnswerLetter) || null,
          }));
          const tpl = resolveTemplateId(rec.layout?.sablon);
          const sid = findStudentIdByCanonical(rec.studentCanonical);
          const cfg = sid ? { ...merged, ogrenciId: sid } : merged;
          setConfig(cfg);
          setQuestions(qs);
          lastWorkedQuestionIndexRef.current = lastFilledQuestionIndex(qs);
          setTemplate(tpl);
          setTemplateName(getTemplateName(tpl));
          syncBaselineFrom({
            questions: qs,
            config: {
              dersId: cfg.dersId,
              konuId: cfg.konuId,
              kurum: cfg.kurum,
              coverTitle: cfg.coverTitle,
              ogrenciId: cfg.ogrenciId,
            },
            pdfFileCount: 0,
            matrixKey: null,
          });
          tmToast.success("Reçete yüklendi", rec.name);
        });
      }

      setHydrated(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- yalnızca ilk girişte sıfır oturum
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    applyTemplate(template, templateName);
  }, [hydrated, template, templateName]);

  useEffect(() => {
    if (!hydrated || !pendingAutoprint.current) return;
    pendingAutoprint.current = false;
    const t = window.setTimeout(() => {
      setExportCloudPromptOpen(true);
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

  const snapshotNow = useCallback(
    () =>
      buildStudioSnapshot({
        questions,
        config: {
          dersId: config.dersId,
          konuId: config.konuId,
          kurum: config.kurum,
          coverTitle: config.coverTitle,
          ogrenciId: config.ogrenciId,
        },
        pdfFileCount: pdf.files.length,
        matrixKey: lastMatrixKey,
      }),
    [
      questions,
      config.dersId,
      config.konuId,
      config.kurum,
      config.coverTitle,
      config.ogrenciId,
      pdf.files.length,
      lastMatrixKey,
    ]
  );

  const syncBaseline = useCallback(() => {
    baselineRef.current = snapshotNow();
  }, [snapshotNow]);

  const hasUnsavedChanges = useCallback(() => {
    return snapshotNow() !== baselineRef.current;
  }, [snapshotNow]);

  const discardWorkspace = useCallback(() => {
    pdf.clearAllFiles();
    lastWorkedQuestionIndexRef.current = -1;
    setQuestions([]);
    setCurrentTaramaId(null);
    setCurrentReceteId(null);
    setLastPdfId(null);
    setLastMatrixKey(null);
    setConfig(syncTMConfig(defaultTMConfig()));
    setTemplate(DEFAULT_TEMPLATE.id);
    setTemplateName(DEFAULT_TEMPLATE.name);
    saveLastTemplate(DEFAULT_TEMPLATE.id, DEFAULT_TEMPLATE.name);
    setShowCover(true);
    setShowAnswerKey(true);
    applyTemplate(DEFAULT_TEMPLATE.id, DEFAULT_TEMPLATE.name);
    baselineRef.current = buildStudioSnapshot({
      questions: [],
      config: {
        dersId: defaultTMConfig().dersId,
        konuId: defaultTMConfig().konuId,
        kurum: defaultTMConfig().kurum,
        coverTitle: defaultTMConfig().coverTitle,
        ogrenciId: defaultTMConfig().ogrenciId,
      },
      pdfFileCount: 0,
      matrixKey: null,
    });
  }, [pdf]);

  useEffect(() => {
    registerTestMakerLeaveGuard({
      hasUnsavedChanges,
      discardChanges: discardWorkspace,
    });
    registerTestMakerLeaveModal((href) => {
      pendingNavRef.current = href;
      setLeaveOpen(true);
    });
    return () => {
      registerTestMakerLeaveGuard(null);
      registerTestMakerLeaveModal(null);
    };
  }, [hasUnsavedChanges, discardWorkspace]);

  const applyPendingNav = useCallback(() => {
    const href = pendingNavRef.current;
    pendingNavRef.current = null;
    if (href) router.push(href);
  }, [router]);

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
    setQuestions((q) => {
      const next = [...q, ...added];
      lastWorkedQuestionIndexRef.current = next.length - 1;
      return next;
    });
    tmToast.poolAdded(added.length);
  };

  const handleAnswer = (id: string, letter: QuestionAnswer) => {
    setQuestions((qs) => {
      const idx = qs.findIndex((q) => q.id === id);
      if (idx >= 0) lastWorkedQuestionIndexRef.current = idx;
      return qs.map((q) =>
        q.id === id ? { ...q, answer: q.answer === letter ? null : letter } : q
      );
    });
  };

  const handleDeleteQuestion = useCallback((id: string) => {
    setQuestions((q) => {
      const deletedIndex = q.findIndex((x) => x.id === id);
      const next = q.filter((x) => x.id !== id);
      lastWorkedQuestionIndexRef.current = adjustLastWorkedIndexAfterDelete(
        lastWorkedQuestionIndexRef.current,
        deletedIndex
      );
      return next;
    });
  }, []);

  const handleQuestionsReorder = useCallback(
    (next: TMQuestion[]) => {
      setQuestions(next);
      syncLastWorkedFromQuestions(next);
    },
    [syncLastWorkedFromQuestions]
  );

  const handleSaveRecete = async () => {
    if (questions.length === 0) {
      tmToast.needQuestions();
      return;
    }
    const key = buildAnswerKey(questions);
    if (key.includes(" ")) {
      tmToast.needAnswerKey();
      return;
    }
    const student = students.find((s) => s.ogrenciId === config.ogrenciId);
    const studentCanonical = student
      ? `${student.name} (${student.studentCode || student.ogrenciId})`
      : "";
    const id = currentReceteId ?? genReceteId();
    const existing = currentReceteId ? await receteGet(currentReceteId) : null;
    const name =
      config.coverTitle ||
      `${config.dersLabel || "Reçete"} · ${config.konuLabel || ""}`.trim();
    const rec: RecipeArchiveRecord = {
      id,
      name,
      studentCanonical,
      studentId: config.ogrenciId || undefined,
      studentCode: student?.studentCode,
      ders: config.dersLabel,
      konu: config.konuLabel,
      kurum: config.kurum,
      coverTitle: config.coverTitle,
      questionCount: questions.length,
      answerKey: key,
      template,
      layout: { sablon: template },
      questions: questions.map((q) => ({
        id: q.id,
        imageDataUrl: q.imageDataUrl,
        answer: q.answer,
      })),
      thumbs: questions.slice(0, 4).map((q) => q.imageDataUrl),
      pdf_file_id: lastPdfId ?? existing?.pdf_file_id,
      createdAt: existing?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
      status: existing?.status ?? "arsiv",
    };
    try {
      await recetePut(rec);
      setCurrentReceteId(id);
      tmToast.success(
        currentReceteId ? "Reçete güncellendi" : "Reçete arşivlendi",
        `${name} · ${questions.length} soru`
      );
      syncBaseline();
    } catch {
      tmToast.storageFull();
    }
  };

  const handleSaveTarama = async (): Promise<boolean> => {
    if (questions.length === 0) {
      tmToast.needQuestions();
      return false;
    }
    const key = buildAnswerKey(questions);
    if (key.includes(" ")) {
      tmToast.needAnswerKey();
      return false;
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
      layout: { sablon: template },
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
      const saved = await taramaPut(rec);
      syncTaramaDataMirror(saved);
      pushExportMeta({
        id,
        name,
        soruSayisi: questions.length,
        savedAt: new Date().toISOString(),
      });
      setCurrentTaramaId(id);
      tmToast.taramaSaved(name, questions.length, Boolean(currentTaramaId));
      syncBaseline();
      return true;
    } catch {
      tmToast.storageFull();
      return false;
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
    discardWorkspace();
    tmToast.resetDone();
  };

  const handleLeaveSave = async () => {
    const ok = await handleSaveTarama();
    if (ok) {
      setLeaveOpen(false);
      applyPendingNav();
    }
  };

  const addCroppedQuestion = (dataUrl: string, letter?: CropAnswerChoice) => {
    const newQ = createQuestion({
      imageDataUrl: dataUrl,
      correctLetter: letter,
      fromHavuz: Boolean(letter),
    });
    setQuestions((q) => {
      const next = [...q, newQ];
      lastWorkedQuestionIndexRef.current = next.length - 1;
      return next;
    });
    if (letter) {
      const label = letter === "blank" ? "Boş" : letter;
      tmToast.success(`Soru eklendi — cevap: ${label}`);
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document
          .querySelector(`[data-q-id="${newQ.id}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    });
  };

  const handleImagePreviewChange = (dataUrl: string | null, fileName: string | null) => {
    setImagePreview(dataUrl);
    setImageFileName(fileName);
    setImageLetter(null);
  };

  const handleImageConfirm = () => {
    if (imagePreview && imageLetter) {
      addCroppedQuestion(imagePreview, imageLetter);
      setImagePreview(null);
      setImageFileName(null);
      setImageLetter(null);
    }
  };

  const handleImageCancel = () => {
    setImagePreview(null);
    setImageFileName(null);
    setImageLetter(null);
  };

  const uploadCloudPdf = useCallback(async (): Promise<boolean> => {
    if (cloudReady === false) return false;
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
      return true;
    } catch (e) {
      const msg = (e as Error).message;
      if (msg === "NOT_CONFIGURED") tmToast.cloudDisabled();
      else tmToast.error("PDF yüklenemedi", msg);
      return false;
    } finally {
      setExportOverlay(null);
    }
  }, [cloudReady, config.coverTitle, currentTaramaId]);

  const runLocalExport = useCallback(() => {
    const ok = printA4Local();
    if (!ok) tmToast.error("İndirilemedi", "A4 alanı bulunamadı");
    return ok;
  }, []);

  const handleExportClick = () => {
    if (questions.length === 0) {
      tmToast.needQuestions();
      return;
    }
    setExportCloudPromptOpen(true);
  };

  const handleExportWithCloudChoice = async (uploadToCloud: boolean) => {
    setExportCloudPromptOpen(false);
    if (questions.length === 0) {
      tmToast.needQuestions();
      return;
    }

    if (uploadToCloud) {
      if (cloudReady === false) {
        tmToast.cloudDisabled();
      } else {
        const uploaded = await uploadCloudPdf();
        if (uploaded) tmToast.pdfUploaded();
      }
    }

    if (runLocalExport()) {
      tmToast.success(
        uploadToCloud && cloudReady !== false
          ? "Buluta kaydedildi; indirme penceresi açıldı"
          : "İndirme penceresi açıldı"
      );
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
    const uploaded = await uploadCloudPdf();
    if (uploaded) tmToast.pdfUploaded();
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
      className={cn(
        TM_PAGE_CLASS,
        "tm-saas-shell tm-saas-shell--document-scroll tm-studio-page print:px-0"
      )}
    >
      <TestMakerPageHeader
        title={fascicleMode ? "Test Oluşturucu · Fasikül modu" : "Test Oluşturucu"}
        description={
          fascicleMode
            ? "Öğrenci seçimi zorunlu — tasarımı tamamlayıp Öğrenciye Gönder ile dijital fasikül atayın."
            : "PDF kaynağından soru kırpın, şablon seçin, testi arşivleyin veya öğrenciye gönderin."
        }
      />

      {fascicleMode ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 print:hidden">
          <strong>Fasikül modu:</strong> Öğrenci alanını doldurun, cevap anahtarını tamamlayın ve{" "}
          <strong>Öğrenciye Gönder</strong> ile kütüphaneye aktarın. Tarama deposuna kayıt isteğe bağlıdır.
        </div>
      ) : null}

      <TestMakerMetrics
        items={[
          { label: "Soru", value: answerStats.total, icon: Layers },
          {
            label: "Cevap anahtarı",
            value: `${answerStats.filled}/${answerStats.total || 0}`,
            sub: answerStats.complete ? "Tamam" : "Eksik var",
            icon: BookOpen,
          },
          { label: "Şablon", value: templateName, icon: FilePlus },
          {
            label: "PDF kaynağı",
            value: pdf.hasPdf ? "Yüklü" : "Bekliyor",
            sub: pdf.fileName ?? undefined,
            icon: Cloud,
          },
        ]}
      />

      <div className={cn(TM_STUDIO_CARD, "print:hidden")}>
        <div className={TM_STUDIO_CARD_INNER}>
          <TestMakerSection
            title="Test bilgileri"
            description="Kapak ve optik özeti için ders, konu ve öğrenci seçin."
            className="border-b border-slate-100 pb-5"
          >
            <div className="tm-v2-config-grid">
        <TestMakerField label="Ders" htmlFor="tm-select-ders">
          <select
            id="tm-select-ders"
            className={tmFieldInputClass}
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
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </TestMakerField>
        <TestMakerField label="Konu" htmlFor="tm-select-konu">
          <select
            id="tm-select-konu"
            className={tmFieldInputClass}
            value={config.konuId}
            onChange={(e) => {
              const top = getTopicById(config.dersId, e.target.value);
              patchConfig({ konuId: e.target.value, konuLabel: top?.name ?? "" });
            }}
          >
            {getTopics(config.dersId).map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </TestMakerField>
        <TestMakerField label="Kurum" htmlFor="tm-input-kurum">
          <input
            id="tm-input-kurum"
            className={tmFieldInputClass}
            value={config.kurum}
            onChange={(e) => patchConfig({ kurum: e.target.value })}
          />
        </TestMakerField>
        <TestMakerField label="Kapak başlığı" htmlFor="cover-title-input">
          <input
            id="cover-title-input"
            className={tmFieldInputClass}
            value={config.coverTitle}
            onChange={(e) => patchConfig({ coverTitle: e.target.value })}
          />
        </TestMakerField>
        <TestMakerField label="Öğrenci" htmlFor="tm-select-ogrenci">
          <select
            id="tm-select-ogrenci"
            className={cn(
              tmFieldInputClass,
              fascicleMode && !config.ogrenciId && "border-amber-400 ring-2 ring-amber-100"
            )}
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
        </TestMakerField>
        <TestMakerField label="Optik özet">
          <p id="tm-fascicle-insight" className="truncate text-xs text-slate-500">
            {fascicleInsight ?? "Öğrenci seçince son optik özeti görünür"}
          </p>
        </TestMakerField>
            </div>
          </TestMakerSection>

          <div className="mt-5 grid gap-6 lg:grid-cols-2">
            <TestMakerSection title="Soru ekle" description="Havuzdan seçin veya PDF üzerinden kırpın.">
              <div className="tm-studio-controls__actions">
                <button
                  type="button"
                  id="btn-open-havuz-modal"
                  className="tm-toolbar-btn tm-toolbar-btn--primary"
                  onClick={() => {
                    void ensureQuestionPoolInit().then((list) => {
                      setPool(list);
                      setHavuzOpen(true);
                    });
                  }}
                >
                  <BookOpen className="h-4 w-4" />
                  Soru havuzu
                </button>
                <button
                  type="button"
                  className="tm-toolbar-btn tm-toolbar-btn--secondary"
                  onClick={() => setStudioOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Geniş ekran kırpıcı
                </button>
              </div>
            </TestMakerSection>

            <TestMakerSection
              title="Kaydet ve gönder"
              description="Arşivleyin veya öğrenci kütüphanesine iletin."
            >
              <div className="tm-studio-controls__actions">
                <button
                  type="button"
                  id="tm-btn-fascicle-send"
                  className="tm-toolbar-btn tm-toolbar-btn--secondary"
                  onClick={handleSendFascicle}
                >
                  <Send className="h-4 w-4" />
                  Öğrenciye gönder
                </button>
                <button
                  type="button"
                  id="tm-btn-save-tarama"
                  className="tm-toolbar-btn tm-toolbar-btn--secondary"
                  onClick={() => void handleSaveTarama()}
                >
                  <Save className="h-4 w-4" />
                  Tarama
                </button>
                <button
                  type="button"
                  id="tm-btn-save-recete"
                  className="tm-toolbar-btn tm-toolbar-btn--secondary"
                  onClick={() => void handleSaveRecete()}
                >
                  <Layers className="h-4 w-4" />
                  Reçete
                </button>
                <button
                  type="button"
                  id="tm-btn-matrix"
                  className="tm-toolbar-btn tm-toolbar-btn--secondary"
                  onClick={() => setMatrixOpen(true)}
                >
                  <Grid3X3 className="h-4 w-4" />
                  Matrix
                </button>
              </div>
            </TestMakerSection>
          </div>

          <TestMakerSection
            title="Sayfa düzeni ve çıktı"
            description="Kapak ve yazdırma seçenekleri."
            className="mt-6 border-t border-slate-100 pt-5"
          >
            <div className="tm-studio-controls__layout-row">
              <TemplatePopover
                activeTpl={template}
                activeName={templateName}
                onSelect={(tpl, name) => {
                  setTemplate(tpl);
                  setTemplateName(name);
                  saveLastTemplate(tpl, name);
                }}
              />
              <button
                type="button"
                id="tm-cb-cover"
                className={cn("tm-toggle-chip", showCover && "tm-toggle-chip--on")}
                onClick={() => setShowCover((v) => !v)}
                aria-pressed={showCover}
              >
                <Layers className="h-4 w-4" />
                Kapak
              </button>
              <button
                type="button"
                id="tm-cb-answer"
                className={cn("tm-toggle-chip", showAnswerKey && "tm-toggle-chip--on")}
                onClick={() => setShowAnswerKey((v) => !v)}
                aria-pressed={showAnswerKey}
              >
                <span
                  className={cn(
                    "inline-block h-2 w-2 rounded-full",
                    showAnswerKey ? "bg-emerald-400" : "bg-slate-300"
                  )}
                />
                Cevap anahtarı
              </button>
              <button
                type="button"
                id="tm-cb-optic"
                className={cn("tm-toggle-chip", showOptic && "tm-toggle-chip--on")}
                onClick={() => setShowOptic((v) => !v)}
                aria-pressed={showOptic}
                disabled={questions.length === 0}
                title={
                  questions.length === 0
                    ? "Optik form için en az bir soru ekleyin"
                    : undefined
                }
              >
                <ScanLine className="h-4 w-4" />
                Optik formu ekle
              </button>

              <div className="ml-auto flex flex-wrap gap-2">
                <button
                  type="button"
                  id="tm-btn-chrome-pdf"
                  className="tm-toolbar-btn tm-toolbar-btn--secondary"
                  onClick={handleExportClick}
                >
                  <Download className="h-4 w-4" />
                  İndir
                </button>
                <button
                  type="button"
                  id="tm-btn-pdf-indir"
                  className={cn(
                    "tm-toolbar-btn tm-toolbar-btn--secondary",
                    cloudReady === false && "opacity-50"
                  )}
                  onClick={() => void handleCloudPdf()}
                  title={cloudReady === false ? "Bulut yapılandırması gerekli" : undefined}
                >
                  <Cloud className="h-4 w-4" />
                  Bulut
                </button>
                <button
                  type="button"
                  id="tm-btn-reset"
                  className="tm-toolbar-btn tm-toolbar-btn--ghost-danger"
                  onClick={() => setResetOpen(true)}
                >
                  <RotateCcw className="h-4 w-4" />
                  Sıfırla
                </button>
              </div>
            </div>
          </TestMakerSection>
        </div>
      </div>

      <div className="tm-studio-workspace">
        <div className="tm-studio-a4-col min-w-0">
          <div className="tm-a4-preview-wrap">
          <A4Document
            config={config}
            template={template}
            templateName={templateName}
            questions={questions}
            showCover={showCover}
            showAnswerKey={showAnswerKey}
            showOptic={showOptic}
            onQuestionsChange={handleQuestionsReorder}
            onAnswer={handleAnswer}
            onDelete={handleDeleteQuestion}
          />
          </div>
        </div>
        <div className="tm-studio-pdf-col flex flex-col gap-4 print:hidden">
          <PdfPanel
            pdf={pdf}
            onCrop={addCroppedQuestion}
            onOpenStudio={() => setStudioOpen(true)}
            deposuOpen={pdfDeposuOpen}
            onDeposuOpenChange={setPdfDeposuOpen}
          />
          <ImageSourcePanel
            previewDataUrl={imagePreview}
            fileName={imageFileName}
            selectedLetter={imageLetter}
            onPreviewChange={handleImagePreviewChange}
            onSelectLetter={setImageLetter}
            onConfirm={handleImageConfirm}
            onCancel={handleImageCancel}
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

      <CloudBeforeExportModal
        open={exportCloudPromptOpen}
        onOpenChange={setExportCloudPromptOpen}
        cloudAvailable={cloudReady !== false}
        onConfirm={(uploadToCloud) => void handleExportWithCloudChoice(uploadToCloud)}
      />

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

      <TestMakerUnsavedLeaveDialog
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        onDiscard={() => {
          discardWorkspace();
          setLeaveOpen(false);
          applyPendingNav();
        }}
        onSave={() => {
          void handleLeaveSave();
        }}
      />
    </div>
  );
}
