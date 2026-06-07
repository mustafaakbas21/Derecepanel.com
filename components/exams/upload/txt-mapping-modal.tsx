"use client";

import { useMemo } from "react";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  FileSpreadsheet,
  GraduationCap,
  Hash,
  Info,
  Sparkles,
  User,
  UserX,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  buildMappingStudentPreview,
  buildMappingSummary,
  canSimulateMapping,
  COLUMN_ROLE_OPTIONS,
  formatCellPreview,
  getMappedRole,
  hypothesisForColumn,
  type ColumnMappingState,
  type ColumnRole,
  type ConfidenceLevel,
  type ParsedTxtFile,
  updateColumnMapping,
} from "@/lib/txtParser";
import type { CatalogStudent } from "@/lib/exams/types";
import { cn } from "@/lib/utils";

import "./txt-upload.css";

type TxtMappingModalProps = {
  open: boolean;
  fileName: string;
  parsed: ParsedTxtFile | null;
  mapping: ColumnMappingState;
  students?: CatalogStudent[];
  onMappingChange: (next: ColumnMappingState) => void;
  onClose: () => void;
  onSimulate: () => void;
  simulating?: boolean;
};

const PREVIEW_LIMIT = 8;

const CONFIDENCE_STYLES: Record<
  ConfidenceLevel,
  { dot: string; badge: string; label: string }
> = {
  high: {
    dot: "bg-emerald-500",
    badge: "border-emerald-200/80 bg-emerald-50 text-emerald-800",
    label: "Yüksek",
  },
  medium: {
    dot: "bg-amber-400",
    badge: "border-amber-200/80 bg-amber-50 text-amber-900",
    label: "Orta",
  },
  low: {
    dot: "bg-slate-300",
    badge: "border-slate-200 bg-slate-50 text-slate-600",
    label: "Düşük",
  },
};

const SUMMARY_ICONS: Partial<Record<ColumnRole, typeof User>> = {
  tc: Hash,
  student_no: Hash,
  student_id_name: Hash,
  name: User,
  class_branch: GraduationCap,
  booklet: BookOpen,
  test_block: FileSpreadsheet,
};

function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  const s = CONFIDENCE_STYLES[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
        s.badge
      )}
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", s.dot)} aria-hidden />
      {s.label}
    </span>
  );
}

function roleLabel(role: ColumnRole, hypothesisLabel: string): string {
  const opt = COLUMN_ROLE_OPTIONS.find((o) => o.value === role);
  if (role === "test_block" && hypothesisLabel && !hypothesisLabel.startsWith("Bilinmiyor")) {
    return hypothesisLabel;
  }
  return opt?.label ?? hypothesisLabel;
}

function CellContent({ role, value }: { role: ColumnRole; value: string }) {
  const v = value.trim();
  if (!v) return <span className="text-slate-400">—</span>;

  if (role === "booklet") {
    return (
      <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-md border border-violet-200 bg-violet-50 px-1.5 text-xs font-bold text-violet-900">
        {v.charAt(0).toUpperCase()}
      </span>
    );
  }

  if (role === "class_branch") {
    return (
      <span className="inline-flex rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-900">
        {v}
      </span>
    );
  }

  if (role === "test_block") {
    const len = v.replace(/\s/g, "").length;
    return (
      <span className="block min-w-0">
        <span className="mb-0.5 inline-flex rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
          {len} cevap
        </span>
        <span className="block truncate font-mono text-[11px] text-slate-700" title={v}>
          {v.slice(0, 24)}
          {len > 24 ? "…" : ""}
        </span>
      </span>
    );
  }

  if (role === "name" || role === "student_id_name") {
    return <span className="font-medium text-slate-900">{formatCellPreview(role, v)}</span>;
  }

  if (role === "student_no" || role === "tc") {
    return <span className="font-mono text-xs font-semibold text-slate-800">{v}</span>;
  }

  return (
    <span className="truncate font-mono text-xs text-slate-800" title={v}>
      {formatCellPreview(role, v)}
    </span>
  );
}

export function TxtMappingModal({
  open,
  fileName,
  parsed,
  mapping,
  students = [],
  onMappingChange,
  onClose,
  onSimulate,
  simulating,
}: TxtMappingModalProps) {
  const colCount = parsed?.columns.length ?? 0;
  const previewRows = useMemo(
    () => (parsed ? parsed.rows.slice(0, PREVIEW_LIMIT) : []),
    [parsed]
  );

  const mappingSummary = useMemo(
    () => (parsed ? buildMappingSummary(parsed, mapping) : []),
    [parsed, mapping]
  );

  const studentPreview = useMemo(() => {
    if (!parsed || !students.length) return [];
    return buildMappingStudentPreview(parsed, mapping, students);
  }, [parsed, mapping, students]);

  const unmatchedPreview = useMemo(
    () => studentPreview.filter((r) => !r.matched),
    [studentPreview]
  );

  const visibleColumns = useMemo(() => {
    if (!parsed) return [];
    return parsed.columns.filter((col) => {
      const role = getMappedRole(mapping, col.index, col);
      return role !== "ignore";
    });
  }, [parsed, mapping]);

  const simulateReady = canSimulateMapping(mapping);
  const highCount =
    visibleColumns.filter((c) => c.confidence === "high").length ?? 0;
  const report = parsed?.report;

  const filteredWarnings = useMemo(() => {
    if (!report?.warnings.length) return [];
    if (report.compositeCellsSplit <= 0) return report.warnings;
    return report.warnings.filter((w) => !w.includes("birleşik alan ayrıldı"));
  }, [report]);

  const hasBooklet = mappingSummary.some((s) => s.role === "booklet");
  const hasClass = mappingSummary.some((s) => s.role === "class_branch");
  const testBlockCount = mappingSummary.filter((s) => s.role === "test_block").length;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[min(92vh,900px)] w-[min(96vw,1400px)] max-w-[min(96vw,1400px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(96vw,1400px)]">
        <DialogHeader className="shrink-0 border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white px-6 py-4 text-left">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
              <FileSpreadsheet className="h-5 w-5 text-slate-700" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="text-lg font-extrabold tracking-tight text-slate-900">
                  Otonom sütun eşleme
                </DialogTitle>
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  <Sparkles className="h-3 w-3" aria-hidden />
                  Motor v2
                </span>
              </div>
              <DialogDescription className="mt-0.5 truncate font-mono text-xs text-slate-600">
                {fileName}
              </DialogDescription>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                  {parsed?.rawLineCount ?? 0} satır
                </span>
                <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                  {visibleColumns.length} sütun
                  {parsed && visibleColumns.length < parsed.columns.length
                    ? ` (${parsed.columns.length - visibleColumns.length} yoksay)`
                    : ""}
                </span>
                {report && (
                  <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    {report.delimiterLabel}
                  </span>
                )}
                <span className="rounded-md border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                  {highCount} yüksek güven
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {report && (filteredWarnings.length > 0 || report.compositeCellsSplit > 0) && (
            <div className="mb-4 space-y-2">
              {report.compositeCellsSplit > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-sky-200/80 bg-sky-50/80 px-3 py-2 text-xs text-sky-900">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span>
                    <strong>{report.compositeCellsSplit}</strong> birleşik alan ayrıldı — öğrenci
                    no+ad, sınıf+kitapçık+cevap blokları ayrı sütunlara taşındı.
                  </span>
                </div>
              )}
              {filteredWarnings.map((w) => (
                <div
                  key={w}
                  className="flex items-start gap-2 rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs text-amber-950"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          {!parsed || !colCount ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-4 py-12 text-center">
              <p className="text-sm font-medium text-slate-700">Geçerli sütun bulunamadı</p>
            </div>
          ) : (
            <div className="flex min-h-0 flex-col gap-4 lg:flex-row">
              <aside className="txt-map-sidebar shrink-0 lg:w-[240px]">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Tespit edilen alanlar
                </p>
                <ul className="space-y-1.5">
                  {mappingSummary.map((item) => {
                    const Icon = SUMMARY_ICONS[item.role] ?? FileSpreadsheet;
                    return (
                      <li
                        key={`${item.role}-${item.index}`}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs"
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-800">{item.label}</p>
                          <p className="text-[10px] text-slate-500">Sütun {item.index + 1}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                  <p>
                    <span className="font-semibold text-slate-800">{testBlockCount}</span> cevap
                    bloğu
                    {hasClass && (
                      <>
                        {" · "}
                        <span className="font-semibold text-slate-800">sınıf</span>
                      </>
                    )}
                    {hasBooklet && (
                      <>
                        {" · "}
                        <span className="font-semibold text-slate-800">kitapçık</span>
                      </>
                    )}
                  </p>
                </div>

                {studentPreview.length > 0 && (
                  <div className="mt-4 border-t border-slate-200 pt-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Öğrenci eşleşmesi
                      </p>
                      {unmatchedPreview.length > 0 && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                          {unmatchedPreview.length} eşleşmedi
                        </span>
                      )}
                    </div>
                    <ul className="max-h-44 space-y-1 overflow-y-auto">
                      {studentPreview.map((row) => (
                        <li
                          key={row.rowIndex}
                          className={cn(
                            "rounded-lg border px-2 py-1.5 text-[11px]",
                            row.matched
                              ? "border-emerald-200 bg-emerald-50/80"
                              : "border-amber-200 bg-amber-50/90"
                          )}
                        >
                          <div className="flex items-start gap-1.5">
                            {row.matched ? (
                              <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
                            ) : (
                              <UserX className="mt-0.5 h-3 w-3 shrink-0 text-amber-700" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-semibold text-slate-900">
                                {row.name || "—"}
                              </p>
                              <p className="text-[10px] text-slate-600">
                                {row.no ? `No ${row.no}` : "Numara yok"}
                                {row.booklet ? ` · Kitapçık ${row.booklet}` : ""}
                              </p>
                              {row.matched && row.catalogName && row.catalogName !== row.name ? (
                                <p className="truncate text-[10px] text-emerald-800">
                                  Katalog: {row.catalogName}
                                </p>
                              ) : null}
                              {!row.matched && (
                                <p className="text-[10px] font-medium text-amber-800">
                                  Katalogda bulunamadı — simülasyon sonrası eşleştirin
                                </p>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </aside>

              <div className="min-w-0 flex-1">
                <p className="mb-2 text-sm text-slate-600">
                  Önizleme — sütun başlığından alanı düzeltebilirsiniz.
                </p>
                <div className="txt-map-table-wrap max-h-[min(52vh,520px)] overflow-auto">
                  <table className="txt-map-table w-full min-w-max border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="sticky left-0 z-10 min-w-[2.5rem] border-r border-slate-200 bg-slate-100 px-2 py-2 text-[10px] font-bold text-slate-500">
                          #
                        </th>
                        {visibleColumns.map((col) => {
                          const role = getMappedRole(mapping, col.index, col);
                          const hypo = hypothesisForColumn(parsed, col.index);
                          const score = report?.columnScores.find((s) => s.index === col.index);
                          return (
                            <th
                              key={col.index}
                              className="min-w-[128px] border-r border-slate-200 p-3 font-normal last:border-r-0"
                            >
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                    Sütun {col.index + 1}
                                  </span>
                                  <ConfidenceBadge level={col.confidence} />
                                </div>
                                <select
                                  className="txt-map-select"
                                  value={role}
                                  onChange={(e) => {
                                    onMappingChange(
                                      updateColumnMapping(
                                        mapping,
                                        col.index,
                                        e.target.value as ColumnRole
                                      )
                                    );
                                  }}
                                  aria-label={`Sütun ${col.index + 1} eşlemesi`}
                                >
                                  {COLUMN_ROLE_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.value === col.role && col.role !== "unknown"
                                        ? `${opt.label} · öneri`
                                        : opt.label}
                                    </option>
                                  ))}
                                </select>
                                <span className="truncate text-[10px] font-medium text-slate-500">
                                  {roleLabel(role, hypo?.label ?? col.label)}
                                  {score != null && (
                                    <span className="opacity-60"> · %{score.score}</span>
                                  )}
                                </span>
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((cells, rowIdx) => (
                        <tr key={rowIdx} className="border-b border-slate-100 last:border-b-0">
                          <td className="sticky left-0 z-10 border-r border-slate-200 bg-inherit px-2 py-2 text-center text-[10px] font-semibold text-slate-400">
                            {rowIdx + 1}
                          </td>
                          {visibleColumns.map((col) => {
                            const colIdx = col.index;
                            const role = getMappedRole(mapping, colIdx, col);
                            const cell = cells[colIdx] ?? "";
                            return (
                              <td
                                key={colIdx}
                                className="max-w-[220px] border-r border-slate-100 px-3 py-2 last:border-r-0"
                              >
                                <CellContent role={role} value={cell} />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsed.rawLineCount > PREVIEW_LIMIT && (
                  <p className="mt-2 text-center text-xs text-slate-500">
                    İlk {PREVIEW_LIMIT} / {parsed.rawLineCount} satır
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 flex-col gap-3 border-t border-slate-100 bg-slate-50/90 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-2">
            {simulateReady ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden />
            )}
            <p className="text-xs leading-relaxed text-slate-600">
              {simulateReady ? (
                <>
                  <span className="font-semibold text-slate-800">Simülasyona hazır.</span> Kimlik,
                  ad, {hasBooklet ? "kitapçık ve " : ""}
                  {testBlockCount} cevap bloğu tanımlı.
                  {unmatchedPreview.length > 0 && (
                    <>
                      {" "}
                      <span className="text-amber-800">
                        {unmatchedPreview.length} öğrenci katalogda eşleşmedi — dosyadaki adları
                        yine de aktarılır.
                      </span>
                    </>
                  )}
                </>
              ) : (
                <>
                  <span className="font-semibold text-slate-800">Eksik eşleme.</span> TC veya öğrenci
                  no, ad ve en az bir cevap sütunu gerekli.
                </>
              )}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              İptal
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={!simulateReady || simulating || !parsed?.rows.length}
              onClick={onSimulate}
            >
              {simulating ? "Hazırlanıyor…" : "Sonuçları simüle et"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
