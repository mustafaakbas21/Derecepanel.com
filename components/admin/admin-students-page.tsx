"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { GraduationCap, Pencil, Plus, Trash2 } from "lucide-react";

import { StudentWizardModal } from "@/components/students/student-wizard-modal";
import {
  ADMIN_PAGE_CLASS,
  ADMIN_PANEL_CLASS,
  AdminDataTable,
  AdminEmptyState,
  AdminFilterBar,
  AdminLoadingSkeleton,
  AdminPageHeader,
  AdminProgressBar,
  AdminStatusBadge,
} from "@/components/admin/admin-ui";
import { ADMIN_ROUTES } from "@/lib/admin/admin-nav-config";
import { getCoachDisplayName, loadCoaches } from "@/lib/admin/coach-storage";
import { refreshAdminPanelData } from "@/lib/admin/refresh-admin-panel";
import { useAdminLiveRefresh } from "@/hooks/use-admin-live-refresh";
import { useConfirm } from "@/hooks/use-confirm";
import { appToast } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DEFAULT_PAGE_SIZE,
  FIELD_LABELS,
  getInitials,
  PAGE_SIZE_OPTIONS,
  STATUS_LABELS,
  type PageSizeOption,
} from "@/lib/students/constants";
import { formatKayitDate, loadStudentsFull, persistStudentsFull } from "@/lib/students/storage";
import { normalizeStudyField } from "@/lib/students/normalize-field";
import type { StudentRecord, StudentStatus } from "@/lib/students/types";

function statusBadgeType(
  status: StudentStatus
): "active" | "inactive" | "new" | "read" {
  if (status === "aktif") return "active";
  if (status === "mezun") return "read";
  return "inactive";
}

function progressForStatus(status: StudentStatus): number {
  if (status === "aktif") return 100;
  if (status === "donduruldu") return 45;
  if (status === "mezun") return 100;
  return 20;
}

export function AdminStudentsPage() {
  const searchParams = useSearchParams();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [coachFilter, setCoachFilter] = useState("tumu");
  const [statusFilter, setStatusFilter] = useState<"tumu" | StudentStatus>("tumu");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(DEFAULT_PAGE_SIZE);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StudentRecord | null>(null);
  const { confirm, ConfirmHost } = useConfirm();

  const coaches = useMemo(() => loadCoaches(), [students]);

  const reload = useCallback(async ({ silent }: { silent: boolean }) => {
    await refreshAdminPanelData();
    setStudents(loadStudentsFull({ seedIfEmpty: false }));
    if (!silent) setHydrated(true);
  }, []);

  useEffect(() => {
    void reload({ silent: false });
  }, [reload]);

  useAdminLiveRefresh(reload);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setSearch(q);
  }, [searchParams]);

  const persist = useCallback((list: StudentRecord[]) => {
    setStudents(list);
    persistStudentsFull(list);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      if (coachFilter !== "tumu" && s.coachId !== coachFilter) return false;
      if (statusFilter !== "tumu" && s.status !== statusFilter) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        String(s.kullaniciAdi || "").toLowerCase().includes(q) ||
        s.studentCode.toLowerCase().includes(q) ||
        getCoachDisplayName(s.coachId).toLowerCase().includes(q)
      );
    });
  }, [students, search, coachFilter, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, coachFilter, statusFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSave = (record: StudentRecord) => {
    const exists = students.some((s) => s.ogrenciId === record.ogrenciId);
    const next = exists
      ? students.map((s) => (s.ogrenciId === record.ogrenciId ? record : s))
      : [...students, record];
    persist(next);
    appToast.studentSaved(exists);
  };

  const openEdit = (s: StudentRecord) => {
    setEditTarget(s);
    setWizardOpen(true);
  };

  const handleDelete = async (s: StudentRecord) => {
    const ok = await confirm({
      title: "Öğrenci silinsin mi?",
      description: `${s.name} kaydı kalıcı olarak silinir.`,
      confirmLabel: "Sil",
      destructive: true,
    });
    if (!ok) return;
    persist(students.filter((x) => x.ogrenciId !== s.ogrenciId));
    appToast.studentDeleted();
  };

  if (!hydrated) return <AdminLoadingSkeleton />;

  const activeCount = students.filter((s) => s.status === "aktif").length;

  return (
    <div className={ADMIN_PAGE_CLASS}>
      <AdminPageHeader
        title="Öğrenci Listesi"
        description="Tüm koçlara bağlı öğrenci hesaplarını görüntüleyin ve yönetin."
        action={
          <Button variant="primary" asChild>
            <Link href={ADMIN_ROUTES.studentNew}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni öğrenci
            </Link>
          </Button>
        }
      />

      <section className={ADMIN_PANEL_CLASS}>
        <div className="space-y-4 p-6">
          <AdminFilterBar search={search} onSearchChange={setSearch} placeholder="Öğrenci ara…">
            <Select value={coachFilter} onValueChange={setCoachFilter}>
              <SelectTrigger className="h-11 w-[200px] rounded-xl border-slate-200">
                <SelectValue placeholder="Koç" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tumu">Tüm koçlar</SelectItem>
                {coaches.map((c) => (
                  <SelectItem key={c.coachId} value={c.coachId}>
                    {c.displayName || c.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as "tumu" | StudentStatus)}
            >
              <SelectTrigger className="h-11 w-[180px] rounded-xl border-slate-200">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tumu">Tüm durumlar</SelectItem>
                <SelectItem value="aktif">Aktif</SelectItem>
                <SelectItem value="donduruldu">Kayıt Donduruldu</SelectItem>
                <SelectItem value="mezun">Mezun</SelectItem>
              </SelectContent>
            </Select>
          </AdminFilterBar>

          {paginated.length === 0 ? (
            <AdminEmptyState
              icon={GraduationCap}
              title="Öğrenci bulunamadı"
              description="Henüz öğrenci yok veya filtre sonucu boş."
              action={
                <Button variant="primary" asChild>
                  <Link href={ADMIN_ROUTES.studentNew}>Yeni öğrenci ekle</Link>
                </Button>
              }
            />
          ) : (
            <AdminDataTable>
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="pb-3 pr-4">Öğrenci</th>
                  <th className="pb-3 pr-4">Koç</th>
                  <th className="pb-3 pr-4">Sınıf / Alan</th>
                  <th className="pb-3 pr-4">Panel kullanıcı</th>
                  <th className="pb-3 pr-4">Kayıt</th>
                  <th className="pb-3 pr-4">Durum</th>
                  <th className="pb-3 pr-4">İlerleme</th>
                  <th className="pb-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((s) => (
                  <tr
                    key={s.ogrenciId}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/80"
                  >
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                          {getInitials(s.name)}
                        </span>
                        <div>
                          <p className="font-medium text-slate-900">{s.name}</p>
                          <p className="text-xs text-slate-500">{s.studentCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 pr-4 text-slate-600">
                      {getCoachDisplayName(s.coachId)}
                    </td>
                    <td className="py-3.5 pr-4 text-slate-600">
                      {s.sinifBranch} · {FIELD_LABELS[normalizeStudyField(s.alan)]}
                    </td>
                    <td className="py-3.5 pr-4 text-slate-600">{s.kullaniciAdi || "—"}</td>
                    <td className="py-3.5 pr-4 text-slate-600">
                      {formatKayitDate(s.kayitDate)}
                    </td>
                    <td className="py-3.5 pr-4">
                      <AdminStatusBadge status={statusBadgeType(s.status)}>
                        {STATUS_LABELS[s.status]}
                      </AdminStatusBadge>
                    </td>
                    <td className="py-3.5 pr-4">
                      <div className="min-w-[100px]">
                        <AdminProgressBar value={progressForStatus(s.status)} />
                      </div>
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => openEdit(s)}
                          aria-label="Düzenle"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 text-red-600 hover:text-red-700"
                          onClick={() => void handleDelete(s)}
                          aria-label="Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdminDataTable>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <p className="text-sm text-slate-500">
              {filtered.length} kayıt · {activeCount} aktif · Sayfa {currentPage}/{totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Select
                value={String(pageSize)}
                onValueChange={(v) => setPageSize(Number(v) as PageSizeOption)}
              >
                <SelectTrigger className="h-9 w-[100px] rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Önceki
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Sonraki
              </Button>
            </div>
          </div>
        </div>
      </section>

      <StudentWizardModal
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        mode={editTarget ? "edit" : "add"}
        initial={editTarget}
        onSave={handleSave}
        showCoachPicker
      />
      {ConfirmHost}
    </div>
  );
}
