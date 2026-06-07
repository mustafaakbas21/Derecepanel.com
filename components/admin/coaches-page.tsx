"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Pencil, Plus, Trash2, Users } from "lucide-react";

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
import {
  countStudentsByCoach,
  deleteCoach,
  loadCoaches,
} from "@/lib/admin/coach-storage";
import type { LocalCoachAccount } from "@/lib/auth/local-auth";
import { refreshAdminPanelData } from "@/lib/admin/refresh-admin-panel";
import { useAdminLiveRefresh } from "@/hooks/use-admin-live-refresh";
import { useConfirm } from "@/hooks/use-confirm";
import { appToast } from "@/lib/notify";
import { Button } from "@/components/ui/button";

type CoachRow = LocalCoachAccount & { studentCount: number };

export function CoachesPage() {
  const searchParams = useSearchParams();
  const [coaches, setCoaches] = useState<CoachRow[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const { confirm, ConfirmHost } = useConfirm();

  const maxStudents = useMemo(
    () => Math.max(1, ...coaches.map((c) => c.studentCount)),
    [coaches]
  );

  const reload = useCallback(async ({ silent }: { silent: boolean }) => {
    await refreshAdminPanelData();
    setCoaches(
      loadCoaches().map((c) => ({
        ...c,
        studentCount: countStudentsByCoach(c.coachId),
      }))
    );
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return coaches;
    return coaches.filter(
      (c) =>
        c.displayName?.toLowerCase().includes(q) ||
        c.username.toLowerCase().includes(q) ||
        c.specialty?.toLowerCase().includes(q)
    );
  }, [coaches, search]);

  const activeCount = coaches.filter((c) => c.status !== "Pasif").length;

  const handleDelete = async (coach: CoachRow) => {
    if (coach.studentCount > 0) {
      appToast.error("Öğrencisi olan koç silinemez.");
      return;
    }
    const ok = await confirm({
      title: "Koç silinsin mi?",
      description: `${coach.displayName || coach.username} hesabı kalıcı olarak silinir.`,
      confirmLabel: "Sil",
      destructive: true,
    });
    if (!ok) return;
    try {
      deleteCoach(coach.coachId);
      void reload({ silent: true });
      appToast.success("Koç silindi");
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Silinemedi");
    }
  };

  if (!hydrated) return <AdminLoadingSkeleton />;

  return (
    <div className={ADMIN_PAGE_CLASS}>
      <AdminPageHeader
        title="Koç Listesi"
        description="Platformdaki tüm koç hesaplarını yönetin."
        action={
          <Button variant="primary" asChild>
            <Link href={ADMIN_ROUTES.coachNew}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni koç
            </Link>
          </Button>
        }
      />

      <section className={ADMIN_PANEL_CLASS}>
        <div className="space-y-4 p-6">
          <AdminFilterBar
            search={search}
            onSearchChange={setSearch}
            placeholder="Koç ara…"
          />

          {filtered.length === 0 ? (
            <AdminEmptyState
              icon={Users}
              title="Koç bulunamadı"
              description="Henüz koç yok veya arama sonucu boş."
              action={
                <Button variant="primary" asChild>
                  <Link href={ADMIN_ROUTES.coachNew}>İlk koçu ekle</Link>
                </Button>
              }
            />
          ) : (
            <AdminDataTable>
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="pb-3 pr-4">Koç</th>
                  <th className="pb-3 pr-4">Kullanıcı adı</th>
                  <th className="pb-3 pr-4">Öğrenci yükü</th>
                  <th className="pb-3 pr-4">Uzmanlık</th>
                  <th className="pb-3 pr-4">Durum</th>
                  <th className="pb-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.coachId}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/80"
                  >
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                          {(c.displayName || c.username).slice(0, 2).toUpperCase()}
                        </span>
                        <span className="font-medium text-slate-900">
                          {c.displayName || c.username}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 pr-4 text-slate-600">{c.username}</td>
                    <td className="py-3.5 pr-4">
                      <div className="min-w-[120px] space-y-1">
                        <AdminProgressBar
                          value={Math.round((c.studentCount / maxStudents) * 100)}
                        />
                        <p className="text-xs text-slate-500">{c.studentCount} öğrenci</p>
                      </div>
                    </td>
                    <td className="py-3.5 pr-4 text-slate-600">{c.specialty || "—"}</td>
                    <td className="py-3.5 pr-4">
                      <AdminStatusBadge
                        status={c.status === "Pasif" ? "inactive" : "active"}
                      >
                        {c.status === "Pasif" ? "Pasif" : "Aktif"}
                      </AdminStatusBadge>
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="outline" size="icon" className="h-9 w-9" asChild>
                          <Link
                            href={`${ADMIN_ROUTES.coaches}/${c.coachId}`}
                            aria-label="Düzenle"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 text-red-600 hover:text-red-700"
                          onClick={() => void handleDelete(c)}
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

          <p className="text-sm text-slate-500">
            {coaches.length} koç · {activeCount} aktif
          </p>
        </div>
      </section>

      {ConfirmHost}
    </div>
  );
}
