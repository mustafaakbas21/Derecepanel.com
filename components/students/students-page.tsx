"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Pencil,
  Plus,
  SquareCheck,
  Trash2,
  Upload,
} from "lucide-react";

import { BulkImportDialog } from "@/components/students/bulk-import-dialog";
import { StudentDetailModal } from "@/components/students/student-detail-modal";
import { StudentWizardModal } from "@/components/students/student-wizard-modal";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  ALAN_TABS,
  DEFAULT_PAGE_SIZE,
  FIELD_BADGE,
  FIELD_LABELS,
  PAGE_SIZE_OPTIONS,
  SINIF_OPTIONS,
  STATUS_LABELS,
  STATUS_STYLES,
  getInitials,
  type PageSizeOption,
} from "@/lib/students/constants";
import { exportStudentsTsv } from "@/lib/students/import-export";
import { studentRowDataAttributes } from "@/lib/students/row-dataset";
import {
  findStudentById,
  formatKayitDate,
  loadStudentsFull,
  persistStudentsFull,
} from "@/lib/students/storage";
import { normalizeStudyField } from "@/lib/students/normalize-field";
import type { AlanFilterId, StatusFilterId, StudentRecord } from "@/lib/students/types";
import { cn } from "@/lib/utils";

export function StudentsPage() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [alanFilter, setAlanFilter] = useState<AlanFilterId>("tumu");
  const [sinifFilter, setSinifFilter] = useState("tumu");
  const [statusFilter, setStatusFilter] = useState<StatusFilterId>("tumu");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(DEFAULT_PAGE_SIZE);
  const [multiSelect, setMultiSelect] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardMode, setWizardMode] = useState<"add" | "edit">("add");
  const [editTarget, setEditTarget] = useState<StudentRecord | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStudents(loadStudentsFull());
    setHydrated(true);
  }, []);

  const persist = useCallback((list: StudentRecord[]) => {
    setStudents(list);
    persistStudentsFull(list);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      if (alanFilter !== "tumu" && normalizeStudyField(s.alan) !== alanFilter) return false;
      if (sinifFilter !== "tumu" && s.sinifBranch !== sinifFilter) return false;
      if (statusFilter !== "tumu" && s.status !== statusFilter) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.goal.toLowerCase().includes(q) ||
        s.parent.toLowerCase().includes(q) ||
        s.parentPhone.includes(q) ||
        s.studentCode.toLowerCase().includes(q)
      );
    });
  }, [students, alanFilter, sinifFilter, statusFilter, search]);

  useEffect(() => {
    setPage(1);
  }, [alanFilter, sinifFilter, statusFilter, search, pageSize]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const alanCounts = useMemo(() => {
    const counts: Record<AlanFilterId, number> = {
      tumu: students.length,
      tyt: 0,
      sayisal: 0,
      esit: 0,
      sozel: 0,
      dil: 0,
    };
    for (const s of students) {
      counts[normalizeStudyField(s.alan)]++;
    }
    return counts;
  }, [students]);

  const detailStudent = detailId
    ? (findStudentById(students, detailId) ?? null)
    : null;
  const showDetayModal = (ogrenciId: string) => {
    const row = document.querySelector(`tr[data-ogrenci-id="${ogrenciId}"]`);
    if (row) {
      setDetailId(ogrenciId);
      return;
    }
    if (findStudentById(students, ogrenciId)) setDetailId(ogrenciId);
    else toast.error("Öğrenci bulunamadı");
  };

  const handleSave = (record: StudentRecord) => {
    const exists = students.some((s) => s.ogrenciId === record.ogrenciId);
    const next = exists
      ? students.map((s) => (s.ogrenciId === record.ogrenciId ? record : s))
      : [...students, record];
    persist(next);
    toast.success(exists ? "Öğrenci güncellendi" : "Öğrenci kaydedildi");
  };

  const handleDelete = (s: StudentRecord) => {
    if (!window.confirm(`${s.name} kaydını silmek istediğinize emin misiniz?`)) return;
    persist(students.filter((x) => x.ogrenciId !== s.ogrenciId));
    toast.success("Öğrenci silindi");
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`${selectedIds.size} öğrenci silinsin mi?`)) return;
    persist(students.filter((s) => !selectedIds.has(s.ogrenciId)));
    setSelectedIds(new Set());
    setMultiSelect(false);
    toast.success("Seçili öğrenciler silindi");
  };

  const handleImported = useCallback(
    (records: StudentRecord[]) => {
      persist([...students, ...records]);
    },
    [students, persist]
  );

  const openAdd = () => {
    setEditTarget(null);
    setWizardMode("add");
    setWizardOpen(true);
  };

  const openEdit = (s: StudentRecord) => {
    setEditTarget(s);
    setWizardMode("edit");
    setWizardOpen(true);
  };

  if (!hydrated) {
    return <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[1.75rem] font-bold tracking-tight text-slate-900">Öğrencilerim</h1>
          <p className="mt-1 text-[15px] text-slate-500">{students.length} kayıtlı öğrenci</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl border-slate-200 bg-white"
            onClick={() => exportStudentsTsv(multiSelect && selectedIds.size > 0 ? students.filter((s) => selectedIds.has(s.ogrenciId)) : filtered)}
          >
            <Download className="h-4 w-4" />
            PDF / Liste İndir
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl border-slate-200 bg-white"
            onClick={() => setImportOpen(true)}
          >
            <Upload className="h-4 w-4" />
            Toplu içe aktar
          </Button>
          <Button
            type="button"
            variant="outline"
            className={cn("rounded-xl border-slate-200 bg-white", multiSelect && "ring-2 ring-slate-300")}
            onClick={() => {
              setMultiSelect((v) => !v);
              if (multiSelect) setSelectedIds(new Set());
            }}
          >
            <SquareCheck className="h-4 w-4" />
            Toplu Sil Modu
          </Button>
          {multiSelect && selectedIds.size > 0 && (
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-red-200 text-red-600"
              onClick={handleBulkDelete}
            >
              <Trash2 className="h-4 w-4" />
              Sil ({selectedIds.size})
            </Button>
          )}
          <Button
            type="button"
            className="rounded-xl bg-slate-900 text-white hover:bg-slate-800"
            onClick={openAdd}
          >
            <Plus className="h-4 w-4" />
            Öğrenci ekle
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {ALAN_TABS.map((tab) => {
            const count = alanCounts[tab.id];
            const active = alanFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setAlanFilter(tab.id)}
                className={cn(
                  "rounded-full px-5 py-2 text-[14px] font-medium transition",
                  active
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                )}
              >
                {tab.label}{" "}
                <span className={cn(active ? "text-white/85" : "text-slate-400")}>
                  ({count})
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={sinifFilter}
            onChange={(e) => setSinifFilter(e.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-[15px] text-slate-700"
          >
            <option value="tumu">Tüm sınıflar</option>
            {SINIF_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilterId)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-[15px] text-slate-700"
          >
            <option value="tumu">Tüm durumlar</option>
            <option value="aktif">Aktif</option>
            <option value="donduruldu">Kayıt donduruldu</option>
            <option value="mezun">Mezun</option>
          </select>
          <Input
            placeholder="Ad, hedef, veli ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full min-w-[220px] rounded-xl border-slate-200 text-[15px] sm:w-60"
          />
        </div>
      </div>

      {students.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-20 text-center">
          <p className="text-slate-600 font-medium">Henüz öğrenci yok</p>
          <p className="mt-1 text-sm text-slate-400">İlk kaydı ekleyin veya toplu içe aktarın.</p>
          <div className="mt-6 flex justify-center gap-2">
            <Button className="rounded-xl bg-slate-900 text-white" onClick={openAdd}>
              Öğrenci ekle
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={() => setImportOpen(true)}>
              Toplu içe aktar
            </Button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-500">
          Filtrelere uygun öğrenci bulunamadı.
        </div>
      ) : (
        <div
          ref={printRef}
          className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white print:border-0"
          style={{ boxShadow: "var(--card-shadow-sm)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-left">
                  {multiSelect && <th className="w-12 px-4 py-3.5" />}
                  <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Öğrenci
                  </th>
                  <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Veli
                  </th>
                  <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Alan
                  </th>
                  <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Sınıf
                  </th>
                  <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Kayıt
                  </th>
                  <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Durum
                  </th>
                  <th className="px-4 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400 print:hidden">
                    İşlem
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((s) => {
                  const dataAttrs = studentRowDataAttributes(s);
                  return (
                    <tr
                      key={s.ogrenciId}
                      {...dataAttrs}
                      className="border-b border-slate-50 hover:bg-slate-50/60"
                    >
                      {multiSelect && (
                        <td className="px-4 py-4">
                          <Checkbox
                            checked={selectedIds.has(s.ogrenciId)}
                            onCheckedChange={() => {
                              setSelectedIds((prev) => {
                                const n = new Set(prev);
                                if (n.has(s.ogrenciId)) n.delete(s.ogrenciId);
                                else n.add(s.ogrenciId);
                                return n;
                              });
                            }}
                          />
                        </td>
                      )}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-[11px] font-bold text-white">
                            {getInitials(s.name)}
                          </div>
                          <div>
                            <p className="text-[15px] font-semibold text-slate-900">{s.name}</p>
                            <p className="max-w-[260px] truncate text-[13px] text-slate-400">
                              {s.goal || "Hedef belirtilmedi"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-[15px] font-medium text-slate-800">{s.parent}</p>
                        <p className="text-[13px] text-slate-400">{s.parentPhone}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            "inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold",
                            FIELD_BADGE[s.alan]
                          )}
                        >
                          {FIELD_LABELS[s.alan]}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-[15px] font-medium text-slate-700">
                        {s.sinifBranch}
                      </td>
                      <td className="px-4 py-4 text-[14px] text-slate-500">
                        {formatKayitDate(s.kayitDate)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            "inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold",
                            STATUS_STYLES[s.status]
                          )}
                        >
                          {STATUS_LABELS[s.status]}
                        </span>
                      </td>
                      <td className="px-4 py-4 print:hidden">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-white"
                            aria-label="Düzenle"
                            onClick={() => openEdit(s)}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600"
                            aria-label="Sil"
                            onClick={() => handleDelete(s)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-white"
                            aria-label="Detay"
                            onClick={() => showDetayModal(s.ogrenciId)}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-3.5 print:hidden sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2.5">
              <label className="sr-only" htmlFor="students-page-size">
                Sayfa başına öğrenci
              </label>
              <select
                id="students-page-size"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value) as PageSizeOption)}
                className="h-10 min-w-[7.5rem] cursor-pointer rounded-xl border border-slate-200 bg-white px-3.5 text-[14px] font-medium text-slate-700 shadow-sm transition hover:border-slate-300 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size} / sayfa
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, Math.min(p, totalPages) - 1))}
                  className={cn(
                    "inline-flex h-10 items-center gap-1.5 rounded-xl border px-4 text-[14px] font-semibold transition",
                    currentPage <= 1
                      ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
                      : "border-slate-200 bg-white text-slate-700 shadow-sm hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                  )}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Önceki
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() =>
                    setPage((p) => Math.min(totalPages, Math.min(p, totalPages) + 1))
                  }
                  className={cn(
                    "inline-flex h-10 items-center gap-1.5 rounded-xl border px-4 text-[14px] font-semibold transition",
                    currentPage >= totalPages
                      ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
                      : "border-slate-200 bg-white text-slate-700 shadow-sm hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                  )}
                >
                  Sonraki
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <p className="text-[14px] text-slate-500 sm:text-right">
              Sayfa{" "}
              <span className="font-semibold text-slate-800">{currentPage}</span>
              {" / "}
              <span className="font-semibold text-slate-800">{totalPages}</span>
              <span className="text-slate-400">
                {" "}
                ({totalItems} öğrenci)
              </span>
            </p>
          </div>
        </div>
      )}

      <BulkImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        existingStudentCodes={students.map((s) => s.studentCode)}
        onImported={handleImported}
      />

      <StudentWizardModal
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        mode={wizardMode}
        initial={editTarget}
        onSave={handleSave}
      />

      <StudentDetailModal
        student={detailStudent}
        open={!!detailId}
        onOpenChange={(o) => !o && setDetailId(null)}
        onEdit={openEdit}
      />

    </div>
  );
}
