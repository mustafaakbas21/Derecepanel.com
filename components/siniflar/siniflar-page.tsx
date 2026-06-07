"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";

import { LibraryInsights, LibraryPageHeader } from "@/components/library/library-shell";
import { ClassAssignmentModal } from "@/components/siniflar/class-assignment-modal";
import "@/components/siniflar/siniflar.css";
import { useConfirm } from "@/hooks/use-confirm";
import { useInstitutionClasses } from "@/hooks/use-institution-classes";
import {
  CLASS_ALAN_TABS,
  CLASS_FIELD_BADGE,
  CLASS_FIELD_LABEL,
  classFieldCode,
} from "@/lib/classes/constants";
import {
  applyClassRosterToStudents,
  countStudentsInClass,
  getClassMemberIds,
  reconcileClassesAndStudents,
} from "@/lib/classes/reconcile";
import { persistInstitutionClasses } from "@/lib/classes/storage";
import type { ClassFieldFilterId } from "@/lib/classes/constants";
import type { ClassDraft, InstitutionClass } from "@/lib/classes/types";
import { appToast } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  type PageSizeOption,
} from "@/lib/students/constants";
import { formatKayitDate, persistStudentsFull } from "@/lib/students/storage";
import { useStudentsFull } from "@/lib/students/use-students-full";
import { cn } from "@/lib/utils";

export function SiniflarPage() {
  const { classes, hydrated, saveClass, removeClass, setClassesOptimistic } =
    useInstitutionClasses();
  const { students, reload: reloadStudents } = useStudentsFull({
    seedIfEmpty: true,
  });
  const reconciledOnce = useRef(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<InstitutionClass | null>(null);
  const [alanFilter, setAlanFilter] = useState<ClassFieldFilterId>("tumu");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(DEFAULT_PAGE_SIZE);
  const { confirm, ConfirmHost } = useConfirm();

  useEffect(() => {
    if (!hydrated || reconciledOnce.current) return;
    if (!students.length) return;
    reconciledOnce.current = true;
    const { classes: nextC, students: nextS, changed } = reconcileClassesAndStudents(
      classes,
      students
    );
    if (changed) {
      persistInstitutionClasses(nextC, { silent: true });
      persistStudentsFull(nextS, { silent: true });
      setClassesOptimistic(nextC);
      reloadStudents();
    }
  }, [
    hydrated,
    classes,
    students,
    setClassesOptimistic,
    reloadStudents,
  ]);

  const classesWithCounts = useMemo(() => {
    return classes.map((c) => ({
      ...c,
      memberCount: countStudentsInClass(c, students),
    }));
  }, [classes, students]);

  const totalStudentsInRoster = useMemo(() => {
    const seen = new Set<string>();
    for (const c of classes) {
      for (const id of c.studentIds) seen.add(id);
    }
    for (const s of students) {
      if (classes.some((c) => studentInClassRow(s, c))) seen.add(s.ogrenciId);
    }
    return seen.size;
  }, [classes, students]);

  const alanCounts = useMemo(() => {
    const counts: Record<ClassFieldFilterId, number> = {
      tumu: classes.length,
      tyt: 0,
      sayisal: 0,
      esit: 0,
      sozel: 0,
      dil: 0,
    };
    for (const c of classes) counts[c.field]++;
    return counts;
  }, [classes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return classesWithCounts.filter((c) => {
      if (alanFilter !== "tumu" && c.field !== alanFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        CLASS_FIELD_LABEL[c.field].toLowerCase().includes(q)
      );
    });
  }, [classesWithCounts, alanFilter, search]);

  useEffect(() => {
    setPage(1);
  }, [alanFilter, search, pageSize]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const unassignedCount = Math.max(0, students.length - totalStudentsInRoster);

  const openCreate = () => {
    setEditTarget(null);
    setModalOpen(true);
  };

  const openEdit = (institutionClass: InstitutionClass) => {
    setEditTarget({
      ...institutionClass,
      studentIds: getClassMemberIds(institutionClass, students),
    });
    setModalOpen(true);
  };

  const handleSave = useCallback(
    (draft: ClassDraft) => {
      const saved = saveClass(draft);
      const nextStudents = applyClassRosterToStudents(students, saved);
      persistStudentsFull(nextStudents);
      reloadStudents();
      appToast.success(
        draft.id ? `"${saved.name}" güncellendi` : `"${saved.name}" oluşturuldu`
      );
    },
    [saveClass, students, reloadStudents]
  );

  const handleDelete = async (c: InstitutionClass) => {
    const ok = await confirm({
      title: "Sınıf silinsin mi?",
      description: `${c.name} silinir; öğrencilerin sınıf bağlantısı kaldırılır.`,
      confirmLabel: "Sil",
      destructive: true,
    });
    if (!ok) return;
    removeClass(c.id);
    const nextStudents = students.map((s) =>
      s.institutionClassId === c.id
        ? { ...s, institutionClassId: undefined, sinifBranch: "" }
        : s
    );
    persistStudentsFull(nextStudents);
    reloadStudents();
    appToast.success(`"${c.name}" silindi`);
  };

  const insightMetrics = useMemo(
    () => [
      {
        label: "Kayıtlı sınıf",
        value: classes.length,
        sub: "Kurum sınıf grupları",
        icon: GraduationCap,
      },
      {
        label: "Sınıflı öğrenci",
        value: totalStudentsInRoster,
        sub: `${students.length} kayıt içinden`,
        icon: Users,
      },
      {
        label: "Boştaki öğrenci",
        value: unassignedCount,
        sub: unassignedCount > 0 ? "Sınıfa atanmayı bekliyor" : "Tümü atandı",
        icon: UserPlus,
      },
    ],
    [classes.length, totalStudentsInRoster, students.length, unassignedCount]
  );

  if (!hydrated) {
    return <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />;
  }

  return (
    <div className="space-y-6">
      <LibraryPageHeader
        title="Sınıflarım"
        description="Sınıf gruplarını oluşturun; öğrenci atamaları Öğrencilerim listesiyle senkron kalır."
        action={
          <Button type="button" variant="primary" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Yeni sınıf oluştur
          </Button>
        }
      />

      <LibraryInsights metrics={insightMetrics} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {CLASS_ALAN_TABS.map((tab) => {
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
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Sınıf adı veya alan ara…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-xl border-slate-200 pl-9 text-[15px]"
          />
        </div>
      </div>

      {classes.length === 0 ? (
        <div
          className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-20 text-center"
          style={{ boxShadow: "var(--card-shadow-sm)" }}
        >
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 text-white">
            <GraduationCap className="h-7 w-7" strokeWidth={2} />
          </span>
          <p className="text-lg font-semibold text-slate-800">Henüz sınıf yok</p>
          <p className="mt-2 max-w-md text-[15px] leading-relaxed text-slate-500">
            İlk sınıfınızı oluşturun; öğrencilerinizdeki sınıf bilgisi otomatik eşleşir ve
            Öğrencilerim tablosunda görünür.
          </p>
          <Button variant="primary" className="mt-8 rounded-xl" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Yeni sınıf oluştur
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
          <p className="font-medium text-slate-700">Filtrelere uygun sınıf yok</p>
          <p className="mt-1 text-sm text-slate-400">
            Alan sekmesini veya aramayı değiştirin.
          </p>
        </div>
      ) : (
        <div
          className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white"
          style={{ boxShadow: "var(--card-shadow-sm)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-left">
                  <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Sınıf
                  </th>
                  <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Alan
                  </th>
                  <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Öğrenci
                  </th>
                  <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Güncelleme
                  </th>
                  <th className="px-4 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    İşlem
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((c) => (
                  <tr
                    key={c.id}
                    className="cursor-pointer border-b border-slate-50 hover:bg-slate-50/60"
                    onClick={() => openEdit(c)}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 text-[13px] font-bold text-white">
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[15px] font-semibold text-slate-900">
                            {c.name}
                          </p>
                          <p className="text-[13px] text-slate-400">
                            {classFieldCode(c.field)} · {CLASS_FIELD_LABEL[c.field]}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          "inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold",
                          CLASS_FIELD_BADGE[c.field]
                        )}
                      >
                        {CLASS_FIELD_LABEL[c.field]}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-slate-400" />
                        <span className="text-[15px] font-semibold tabular-nums text-slate-800">
                          {c.memberCount}
                        </span>
                        <span className="text-[13px] text-slate-400">öğrenci</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[14px] text-slate-500">
                      {formatKayitDate(c.updatedAt.slice(0, 10))}
                    </td>
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-white"
                          aria-label="Düzenle"
                          onClick={() => openEdit(c)}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600"
                          aria-label="Sil"
                          onClick={() => handleDelete(c)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value) as PageSizeOption)}
                className="h-10 min-w-[7.5rem] cursor-pointer rounded-xl border border-slate-200 bg-white px-3.5 text-[14px] font-medium text-slate-700 shadow-sm"
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
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
              Sayfa <span className="font-semibold text-slate-800">{currentPage}</span>
              {" / "}
              <span className="font-semibold text-slate-800">{totalPages}</span>
              <span className="text-slate-400"> ({totalItems} sınıf)</span>
            </p>
          </div>
        </div>
      )}

      <ClassAssignmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={editTarget}
        allStudents={students}
        onSave={handleSave}
      />

      {ConfirmHost}
    </div>
  );
}

function studentInClassRow(
  s: { ogrenciId: string; institutionClassId?: string; sinifBranch: string },
  c: InstitutionClass
): boolean {
  if (c.studentIds.includes(s.ogrenciId)) return true;
  const branch = (s.sinifBranch || "").trim().toLowerCase();
  const name = c.name.trim().toLowerCase();
  if (!branch || !name) return false;
  if (branch === name) return true;
  if (name.startsWith(branch) || branch.startsWith(name)) return true;
  return false;
}
