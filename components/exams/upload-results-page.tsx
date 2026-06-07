"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Library,
  RotateCcw,
  Users,
} from "lucide-react";
import { appToast, toast } from "@/lib/notify";

import { ExamCombobox } from "@/components/exams/upload/exam-combobox";
import { PreviewTable } from "@/components/exams/upload/preview-table";
import {
  UploadModeHint,
  UploadModeModal,
  type UploadParseMode,
} from "@/components/exams/upload/upload-mode-modal";
import { TxtMappingModal } from "@/components/exams/upload/txt-mapping-modal";
import { TxtUploadDropzone } from "@/components/exams/upload/txt-upload-dropzone";

const BulkMatchModal = dynamic(
  () => import("@/components/exams/upload/bulk-match-modal").then((m) => m.BulkMatchModal),
  { ssr: false }
);
const MatchModal = dynamic(
  () => import("@/components/exams/upload/match-modal").then((m) => m.MatchModal),
  { ssr: false }
);
const TemplateLibraryDialog = dynamic(
  () =>
    import("@/components/exams/upload/template-library-dialog").then(
      (m) => m.TemplateLibraryDialog
    ),
  { ssr: false }
);
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  catalogForApi,
  useExamResultsImport,
} from "@/hooks/use-exam-results-import";
import { DENEMELER_ROUTES } from "@/lib/coach/denemeler-nav-config";
import { decodeOpticalFile } from "@/lib/exams/decode-optical-file";
import { getAnswerKeyFromExam } from "@/lib/exams/exam-evaluate";
import { loadExamsBuckets } from "@/lib/exams/exam-storage";
import {
  isRowDirty,
  parseTextAsync,
  type ParseProgress,
} from "@/lib/exams/exam-parser";
import {
  loadParserTemplates,
  onFmtStoreChange,
  resolveActiveParserTemplate,
  setActiveTemplateId,
} from "@/lib/exams/fmt-store";
import { onExamsChange } from "@/lib/exams/events";
import {
  applyCreateMissingStudents,
  loadCatalogStudents,
} from "@/lib/exams/student-catalog-bridge";
import type { CatalogStudent, KurumDeneme, ParseRow } from "@/lib/exams/types";
import {
  applyColumnMapping,
  buildInitialMapping,
  parseTxtFile,
  type ColumnMappingState,
  type ParsedTxtFile,
} from "@/lib/txtParser";
import { mappedTxtRowsToParseRows } from "@/lib/txtParser/to-parse-rows";

type RowFilter = "all" | "matched" | "dirty" | "unmatched" | "clean";

export function UploadResultsPage() {
  const searchParams = useSearchParams();
  const preExamId = searchParams.get("examId") || "";
  const { importRows } = useExamResultsImport();

  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [buckets, setBuckets] = useState<{ kurumsal: KurumDeneme[]; global: KurumDeneme[] }>({
    kurumsal: [],
    global: [],
  });
  const [examId, setExamId] = useState("");
  const [templates, setTemplates] = useState<{ id: string; label: string }[]>([]);
  const [templateId, setTemplateId] = useState("");
  const [updateExisting, setUpdateExisting] = useState(true);
  const [createMissing, setCreateMissing] = useState(false);
  const [rows, setRows] = useState<ParseRow[]>([]);
  const [filter, setFilter] = useState<RowFilter>("all");
  const [search, setSearch] = useState("");
  const [fileName, setFileName] = useState("");
  const [progress, setProgress] = useState<ParseProgress | null>(null);
  const [parsing, setParsing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const cancelRef = useRef(false);
  const [txtParsed, setTxtParsed] = useState<ParsedTxtFile | null>(null);
  const [txtMapping, setTxtMapping] = useState<ColumnMappingState>({ byIndex: {} });
  const [modeModalOpen, setModeModalOpen] = useState(false);
  const [mappingOpen, setMappingOpen] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [matchRow, setMatchRow] = useState<ParseRow | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [tplLibOpen, setTplLibOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [students, setStudents] = useState<CatalogStudent[]>([]);

  const refreshBuckets = useCallback(() => {
    setBuckets(loadExamsBuckets());
    setStudents(loadCatalogStudents());
  }, []);

  const refreshTemplates = useCallback(async (preferredId?: string) => {
    const list = await loadParserTemplates();
    setTemplates(list.map((x) => ({ id: x.id, label: x.label })));
    const activeId = preferredId || (await resolveActiveParserTemplate())?.id || "";
    const pick = list.find((t) => t.id === activeId) || list[0];
    if (pick) {
      setTemplateId(pick.id);
      setActiveTemplateId(pick.id);
    }
  }, []);

  useEffect(() => {
    refreshBuckets();
    void refreshTemplates();
    return onExamsChange(refreshBuckets);
  }, [refreshBuckets, refreshTemplates]);

  useEffect(() => {
    return onFmtStoreChange(() => {
      void refreshTemplates();
    });
  }, [refreshTemplates]);

  useEffect(() => {
    if (preExamId) setExamId(preExamId);
  }, [preExamId]);

  const totalExams = buckets.kurumsal.length + buckets.global.length;
  const selectedExam = useMemo(() => {
    const pool = [...buckets.kurumsal, ...buckets.global];
    return pool.find((e) => e.id === examId) ?? null;
  }, [buckets, examId]);

  const answerKey = useMemo(() => {
    const k = getAnswerKeyFromExam(selectedExam);
    return k?.key ?? null;
  }, [selectedExam]);

  const stats = useMemo(() => {
    const total = rows.length;
    const matched = rows.filter((r) => r.matched).length;
    const dirty = rows.filter(isRowDirty).length;
    const clean = rows.filter((r) => r.matched && !isRowDirty(r)).length;
    return {
      total,
      matched,
      dirty,
      clean,
      noBook: rows.filter((r) => r.issues.includes("no-book")).length,
      dup: rows.filter((r) => r.issues.includes("duplicate")).length,
      unmatched: rows.filter((r) => !r.matched).length,
      matchPct: total ? Math.round((matched / total) * 100) : 0,
    };
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "matched" && !r.matched) return false;
      if (filter === "unmatched" && r.matched) return false;
      if (filter === "dirty" && !isRowDirty(r)) return false;
      if (filter === "clean" && (isRowDirty(r) || !r.matched)) return false;
      if (q && !r.name.toLowerCase().includes(q) && !r.no.includes(q)) return false;
      return true;
    });
  }, [rows, filter, search]);

  const unmatchedRows = useMemo(() => rows.filter((r) => !r.matched), [rows]);

  const hasUploadSession = useMemo(
    () =>
      rows.length > 0 ||
      !!fileName ||
      phase > 1 ||
      !!pendingText ||
      parsing ||
      mappingOpen ||
      modeModalOpen,
    [rows.length, fileName, phase, pendingText, parsing, mappingOpen, modeModalOpen]
  );

  const resetUploadSession = useCallback(() => {
    cancelRef.current = true;
    setPhase(1);
    setRows([]);
    setFileName("");
    setFilter("all");
    setSearch("");
    setLastError(null);
    setProgress(null);
    setParsing(false);
    setTxtParsed(null);
    setTxtMapping({ byIndex: {} });
    setModeModalOpen(false);
    setMappingOpen(false);
    setSimulating(false);
    setPendingText(null);
    setConfirmOpen(false);
    setResetConfirmOpen(false);
    setMatchRow(null);
    setBulkOpen(false);
    cancelRef.current = false;
    toast.message("Yükleme oturumu sıfırlandı — yeni dosya yükleyebilirsiniz");
  }, []);

  const handleResetClick = useCallback(() => {
    if (rows.length > 0 || fileName) {
      setResetConfirmOpen(true);
      return;
    }
    resetUploadSession();
  }, [rows.length, fileName, resetUploadSession]);

  const runTemplateParse = useCallback(
    async (text: string, fileLabel: string) => {
      const tplList = await loadParserTemplates();
      let tplEntry = tplList.find((t) => t.id === templateId);
      if (!tplEntry) {
        const activeId = (await resolveActiveParserTemplate())?.id;
        tplEntry =
          (activeId ? tplList.find((t) => t.id === activeId) : undefined) || tplList[0];
        if (tplEntry) {
          setTemplateId(tplEntry.id);
          setActiveTemplateId(tplEntry.id);
        }
      }
      if (!tplEntry) {
        throw new Error("Optik şablon bulunamadı. Şablon kütüphanesinden bir şablon yükleyin.");
      }

      setPhase(2);
      setProgress({ pct: 0, processed: 0, total: 0 });

      let parsed = await parseTextAsync(text, tplEntry.template, students, answerKey, {
        onProgress: (p) => {
          setProgress({
            pct: Math.min(99, 12 + Math.round(p.pct * 0.86)),
            processed: p.processed,
            total: p.total,
          });
        },
        shouldCancel: () => cancelRef.current,
        onTemplateMismatch: (avg, exp) => {
          toast.warning(`Satır uzunluğu şablonla uyumsuz (ortalama ~${avg}, beklenen ~${exp})`);
        },
      });

      if (cancelRef.current) {
        toast.message("Parse iptal edildi");
        setPhase(1);
        return;
      }

      if (!parsed.length) {
        const m =
          "Dosyada geçerli satır bulunamadı. Sütun eşlemesini veya optik şablonu kontrol edin.";
        setLastError(m);
        toast.error("Geçerli satır bulunamadı.");
        setPhase(1);
        return;
      }

      if (createMissing) {
        const applied = applyCreateMissingStudents(parsed, students, true);
        parsed = applied.rows;
        setStudents(applied.students);
        if (applied.created) {
          toast.info(`${applied.created} yeni öğrenci otomatik kaydedildi`);
        }
      }

      setRows(parsed);
      setPhase(3);
      appToast.success(
        `${parsed.length} satır okundu (${fileLabel})`,
        "Önizleme tablosundan kayıt edebilirsiniz"
      );
    },
    [templateId, students, answerKey, createMissing]
  );

  const handleOpticalFile = useCallback(
    async (file: File | null | undefined) => {
      if (!file) return;

      setLastError(null);

      if (!examId) {
        const m = "Önce hedef denemeyi seçin, sonra dosyayı yükleyin.";
        setLastError(m);
        toast.error("Lütfen sonuçları yüklemeden önce hedef denemeyi seçiniz!");
        return;
      }

      cancelRef.current = false;
      setParsing(true);
      setFileName(file.name);
      refreshBuckets();

      try {
        const text = await decodeOpticalFile(file);
        setPendingText(text);
        setModeModalOpen(true);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "bilinmeyen hata";
        console.error("[upload] optik dosya işlenemedi:", err);
        setLastError(msg);
        toast.error(`Dosya okunamadı: ${msg}`);
        setPhase(1);
      } finally {
        setParsing(false);
        setProgress(null);
      }
    },
    [examId, refreshBuckets]
  );

  const handleParseModeSelect = useCallback(
    async (mode: UploadParseMode) => {
      setModeModalOpen(false);
      const text = pendingText;
      if (!text) return;

      if (mode === "fmt") {
        setParsing(true);
        try {
          await runTemplateParse(text, fileName || "upload.txt");
        } catch (err) {
          const msg = err instanceof Error ? err.message : "bilinmeyen hata";
          setLastError(msg);
          toast.error(`Şablon okuma hatası: ${msg}`);
        } finally {
          setParsing(false);
          setProgress(null);
          setPendingText(null);
        }
        return;
      }

      const heuristic = parseTxtFile(text);
      setPendingText(null);

      if (!heuristic.rows.length || !heuristic.columns.length) {
        toast.warning("Otonom motor sütun çıkaramadı — FMT şablon deneniyor…");
        setParsing(true);
        try {
          await runTemplateParse(text, fileName || "upload.txt");
        } finally {
          setParsing(false);
          setProgress(null);
        }
        return;
      }

      setTxtParsed(heuristic);
      setTxtMapping(buildInitialMapping(heuristic));
      setMappingOpen(true);
    },
    [pendingText, fileName, runTemplateParse]
  );

  const handleSimulateMapping = useCallback(async () => {
    if (!txtParsed || !examId) return;
    setSimulating(true);
    try {
      const mapped = applyColumnMapping(txtParsed, txtMapping);
      let parsed = mappedTxtRowsToParseRows(mapped, students, answerKey);

      if (!parsed.length) {
        toast.error("Eşlemeden geçerli öğrenci satırı üretilemedi.");
        return;
      }

      if (createMissing) {
        const applied = applyCreateMissingStudents(parsed, students, true);
        parsed = applied.rows;
        setStudents(applied.students);
        if (applied.created) {
          toast.info(`${applied.created} yeni öğrenci otomatik kaydedildi`);
        }
      }

      setRows(parsed);
      setPhase(3);
      setMappingOpen(false);
      appToast.success(
        `${parsed.length} satır simüle edildi`,
        "Önizleme tablosundan kayıt edebilirsiniz"
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "bilinmeyen hata";
      toast.error(`Simülasyon başarısız: ${msg}`);
    } finally {
      setSimulating(false);
    }
  }, [txtParsed, txtMapping, examId, students, answerKey, createMissing]);

  const applyMatch = (rowId: string, student: CatalogStudent) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        return {
          ...r,
          matched: true,
          status: "matched" as const,
          matchedId: student.id,
          studentId: student.id,
          no: student.code,
          name: student.name,
          sube: student.sube || student.alan || "",
          issues: r.issues.filter((x) => x !== "unmatched" && x !== "no-code"),
        };
      })
    );
    appToast.examMatchSaved();
  };

  const saveClean = async (clean: ParseRow[]) => {
    if (!selectedExam || !examId) return;
    setSaving(true);
    try {
      const tpl = templates.find((t) => t.id === templateId);
      const result = await importRows({
        examId,
        examName: selectedExam.ad,
        templateId,
        templateLabel: tpl?.label || templateId,
        updateExisting,
        createMissingStudents: createMissing,
        source: fileName || "upload.txt",
        rows: clean,
        catalog: catalogForApi(students),
      });
      const keep = new Set(clean.map((r) => r.id));
      setRows((prev) => {
        const next = prev.filter((r) => !keep.has(r.id));
        if (!next.length) setPhase(1);
        return next;
      });
      appToast.examResultsUploaded(result.persisted);
      setConfirmOpen(false);
    } catch {
      /* toast in hook */
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    if (!examId) {
      toast.error("Hedef deneme seçin");
      return;
    }
    const selected = rows.filter((r) => r.selected);
    if (!selected.length) {
      toast.error("Seçili satır yok");
      return;
    }
    const dirty = selected.filter(isRowDirty);
    const clean = selected.filter((r) => !isRowDirty(r));
    if (dirty.length > 0) {
      if (!clean.length) {
        toast.error("Tüm seçili satırlar hatalı — önce düzeltin veya eşleştirin");
        return;
      }
      setConfirmOpen(true);
      return;
    }
    void saveClean(clean);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Deneme Sonuçları Yükleme</h1>
          <p className="mt-1 text-sm text-slate-600">
            Faz {phase}/3 — Optik dosyayı parse edin, önizleyin ve kanonik sonuç havuzuna kaydedin.
          </p>
        </div>
        {hasUploadSession && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            disabled={parsing || saving}
            onClick={handleResetClick}
          >
            <RotateCcw className="mr-1.5 h-4 w-4" aria-hidden />
            Sıfırla
          </Button>
        )}
      </div>

      {/* Faz 1 */}
      <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Faz 1 — Kontrol paneli
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <Label>Hedef deneme *</Label>
            <ExamCombobox
              className="mt-1"
              value={examId}
              onValueChange={setExamId}
              buckets={buckets}
              disabled={!totalExams}
              placeholder={
                totalExams ? "Deneme seçin veya arayın…" : "Sistemde kayıtlı deneme bulunamadı"
              }
            />
          </div>
          <div>
            <Label>Optik şablon *</Label>
            <div className="mt-1 flex gap-2">
              <Select
                value={templateId || undefined}
                onValueChange={(v) => {
                  setTemplateId(v);
                  setActiveTemplateId(v);
                  if (rows.length) {
                    toast.message("Şablon değişti — dosyayı tekrar yükleyin");
                  }
                }}
                disabled={!templates.length}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Şablon seçin" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Şablon kütüphanesi"
                onClick={() => setTplLibOpen(true)}
              >
                <Library className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <Checkbox checked={updateExisting} onCheckedChange={(c) => setUpdateExisting(!!c)} />
            Sonuçları güncelle (aynı examId + studentId)
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <Checkbox checked={createMissing} onCheckedChange={(c) => setCreateMissing(!!c)} />
            Kayıt oluştur (eşleşmeyen + numaralı satır)
          </label>
        </div>

        {fileName && rows.length > 0 && (
          <p className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            <FileText className="h-4 w-4 text-slate-400" />
            <span className="font-medium">{fileName}</span>
            <span className="text-slate-500">· {rows.length} satır</span>
          </p>
        )}

        <TxtUploadDropzone
          disabled={!examId}
          parsing={parsing}
          onFile={(f) => void handleOpticalFile(f)}
        />
        <UploadModeHint />
        {!examId && (
          <p className="text-center text-sm text-slate-500">
            Dosya yüklemek için önce hedef deneme seçin.
          </p>
        )}

        {lastError && phase === 1 && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{lastError}</span>
          </div>
        )}
      </div>

      {(parsing || phase === 2) && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="mb-2 text-sm font-medium text-slate-900">Faz 2 — Parse</p>
          <div className="mb-2 flex justify-between text-sm">
            <span>{progress?.total ? "Satırlar işleniyor…" : "Dosya okunuyor…"}</span>
            <span>{progress?.pct ?? 0}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full bg-slate-900 transition-all"
              style={{ width: `${progress?.pct ?? 0}%` }}
            />
          </div>
          {progress?.total ? (
            <p className="mt-2 text-xs text-slate-500">
              {progress.processed} / {progress.total} satır
            </p>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => {
              cancelRef.current = true;
            }}
          >
            İptal
          </Button>
        </div>
      )}

      {phase >= 3 && rows.length > 0 && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { label: "Toplam", value: stats.total, icon: FileText },
              { label: "Eşleşen %", value: `${stats.matchPct}%`, icon: CheckCircle2 },
              { label: "Temiz", value: stats.clean, icon: CheckCircle2 },
              { label: "Mükerrer", value: stats.dup, icon: AlertTriangle },
              { label: "Eşleşmeyen", value: stats.unmatched, icon: AlertTriangle },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <Icon className="mb-2 h-5 w-5 text-slate-400" />
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-xl font-bold text-slate-900">{value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase text-slate-500">Faz 3 — Önizleme</p>
            {(
              [
                ["all", "Tümü"],
                ["clean", "Temiz"],
                ["matched", "Eşleşen"],
                ["dirty", "Hatalı"],
                ["unmatched", "Eşleşmeyen"],
              ] as const
            ).map(([f, label]) => (
              <Button
                key={f}
                type="button"
                size="sm"
                variant={filter === f ? "primary" : "outline"}
                onClick={() => setFilter(f)}
              >
                {label}
              </Button>
            ))}
            {unmatchedRows.length > 0 && (
              <Button type="button" size="sm" variant="outline" onClick={() => setBulkOpen(true)}>
                <Users className="mr-1 h-4 w-4" />
                Toplu eşleştir ({unmatchedRows.length})
              </Button>
            )}
            <Input
              placeholder="Ad / no ara"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ml-auto max-w-[180px]"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={saving || parsing}
              onClick={handleResetClick}
            >
              <RotateCcw className="mr-1 h-4 w-4" aria-hidden />
              Sıfırla
            </Button>
            <Button variant="primary" disabled={saving} onClick={handleSave}>
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </div>

          <PreviewTable
            rows={filteredRows}
            onToggle={(id, checked) =>
              setRows((prev) => prev.map((r) => (r.id === id ? { ...r, selected: checked } : r)))
            }
            onMatch={setMatchRow}
          />
        </>
      )}

      {matchRow && (
        <MatchModal
          row={matchRow}
          students={students}
          open
          onClose={() => setMatchRow(null)}
          onApply={(s) => applyMatch(matchRow.id, s)}
        />
      )}

      {bulkOpen && (
        <BulkMatchModal
          open
          onClose={() => setBulkOpen(false)}
          unmatchedRows={unmatchedRows}
          students={students}
          onApplyAll={(pairs) => {
            pairs.forEach(({ rowId, student }) => applyMatch(rowId, student));
          }}
        />
      )}

      <UploadModeModal
        open={modeModalOpen}
        fileName={fileName}
        onClose={() => {
          setModeModalOpen(false);
          setPendingText(null);
        }}
        onSelect={(mode) => void handleParseModeSelect(mode)}
      />

      <TxtMappingModal
        open={mappingOpen}
        fileName={fileName}
        parsed={txtParsed}
        mapping={txtMapping}
        students={students}
        onMappingChange={setTxtMapping}
        onClose={() => {
          setMappingOpen(false);
          setTxtParsed(null);
        }}
        onSimulate={() => void handleSimulateMapping()}
        simulating={simulating}
      />

      {tplLibOpen && (
        <TemplateLibraryDialog
          open
          activeId={templateId}
          onClose={() => {
            setTplLibOpen(false);
            void refreshTemplates();
          }}
          onSelect={(id) => {
            setTemplateId(id);
            setActiveTemplateId(id);
            if (rows.length) {
              toast.message("Şablon değişti — dosyayı tekrar yükleyin");
            }
          }}
        />
      )}

      <Dialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Yüklemeyi sıfırla</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            {fileName ? (
              <>
                <span className="font-mono text-xs text-slate-800">{fileName}</span> dosyasına ait
                önizleme ve parse verisi silinecek. Hedef deneme ve şablon seçimi korunur.
              </>
            ) : (
              <>Devam eden yükleme oturumu iptal edilecek.</>
            )}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetConfirmOpen(false)}>
              Vazgeç
            </Button>
            <Button variant="primary" onClick={resetUploadSession}>
              Sıfırla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kısmen hatalı seçim</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Seçili satırların bir kısmı kirli (eksik kitapçık, mükerrer, eşleşmeyen). Yalnızca
            temiz kayıtları kaydetmek istiyor musunuz?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              İptal
            </Button>
            <Button
              variant="primary"
              disabled={saving}
              onClick={() => {
                const selected = rows.filter((r) => r.selected);
                void saveClean(selected.filter((r) => !isRowDirty(r)));
              }}
            >
              Temizleri kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!totalExams && (
        <p className="text-center text-sm text-slate-500">
          <Link
            href={DENEMELER_ROUTES.kurumsal}
            className="font-medium text-slate-900 underline underline-offset-2 hover:text-slate-700"
          >
            Kurumsal deneme oluşturun
          </Link>
        </p>
      )}
    </div>
  );
}
