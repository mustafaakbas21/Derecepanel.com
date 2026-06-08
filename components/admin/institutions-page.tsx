"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Pencil, Plus, Trash2 } from "lucide-react";

import { InstitutionFormDialog } from "@/components/admin/institution-form-dialog";
import {
  ADMIN_PAGE_CLASS,
  ADMIN_PANEL_CLASS,
  AdminDataTable,
  AdminEmptyState,
  AdminFilterBar,
  AdminLoadingSkeleton,
  AdminPageHeader,
  AdminStatusBadge,
} from "@/components/admin/admin-ui";
import type { Institution, InstitutionDraft } from "@/lib/admin/institutions";
import { useConfirm } from "@/hooks/use-confirm";
import { appToast } from "@/lib/notify";
import { Button } from "@/components/ui/button";

export function InstitutionsPage() {
  const [items, setItems] = useState<Institution[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Institution | null>(null);
  const { confirm, ConfirmHost } = useConfirm();

  const reload = async () => {
    const res = await fetch("/api/admin/institutions", { cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as {
      institutions?: Institution[];
      error?: string;
    };
    if (!res.ok) {
      throw new Error(data.error || "Kurum listesi yüklenemedi");
    }
    setItems(data.institutions ?? []);
  };

  useEffect(() => {
    void reload()
      .catch((err) => appToast.error(err instanceof Error ? err.message : "Yüklenemedi"))
      .finally(() => setHydrated(true));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        String(i.contactName || "").toLowerCase().includes(q) ||
        String(i.email || "").toLowerCase().includes(q)
    );
  }, [items, search]);

  const handleSave = async (draft: InstitutionDraft) => {
    try {
      const res = await fetch("/api/admin/institutions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, id: editTarget?.id }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Kayıt başarısız");
      await reload();
      appToast.success(editTarget ? "Kurum güncellendi" : "Kurum eklendi");
      setEditTarget(null);
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Kayıt başarısız");
    }
  };

  const handleDelete = async (inst: Institution) => {
    const ok = await confirm({
      title: "Kurum silinsin mi?",
      description: `${inst.name} kalıcı olarak silinir.`,
      confirmLabel: "Sil",
      destructive: true,
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/admin/institutions?id=${encodeURIComponent(inst.id)}`, {
        method: "DELETE",
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Silinemedi");
      await reload();
      appToast.success("Kurum silindi");
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Silinemedi");
    }
  };

  if (!hydrated) return <AdminLoadingSkeleton />;

  return (
    <div className={ADMIN_PAGE_CLASS}>
      <AdminPageHeader
        title="Kurumlar"
        description="Platforma bağlı dershane ve koçluk merkezlerini yönetin."
        action={
          <Button
            variant="primary"
            onClick={() => {
              setEditTarget(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni kurum
          </Button>
        }
      />

      <section className={ADMIN_PANEL_CLASS}>
        <div className="space-y-4 p-6">
          <AdminFilterBar search={search} onSearchChange={setSearch} placeholder="Kurum ara…" />

          {filtered.length === 0 ? (
            <AdminEmptyState
              icon={Building2}
              title="Kurum bulunamadı"
              description="Henüz kurum yok veya arama sonucu boş."
              action={
                <Button
                  variant="primary"
                  onClick={() => {
                    setEditTarget(null);
                    setDialogOpen(true);
                  }}
                >
                  İlk kurumu ekle
                </Button>
              }
            />
          ) : (
            <AdminDataTable>
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="pb-3 pr-4">Kurum</th>
                  <th className="pb-3 pr-4">Yetkili</th>
                  <th className="pb-3 pr-4">İletişim</th>
                  <th className="pb-3 pr-4">Durum</th>
                  <th className="pb-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inst) => (
                  <tr
                    key={inst.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/80"
                  >
                    <td className="py-3.5 pr-4 font-medium text-slate-900">{inst.name}</td>
                    <td className="py-3.5 pr-4 text-slate-600">{inst.contactName || "—"}</td>
                    <td className="py-3.5 pr-4 text-slate-600">
                      {[inst.phone, inst.email].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className="py-3.5 pr-4">
                      <AdminStatusBadge
                        status={inst.status === "Pasif" ? "inactive" : "active"}
                      >
                        {inst.status}
                      </AdminStatusBadge>
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => {
                            setEditTarget(inst);
                            setDialogOpen(true);
                          }}
                          aria-label="Düzenle"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 text-red-600 hover:text-red-700"
                          onClick={() => void handleDelete(inst)}
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
        </div>
      </section>

      <InstitutionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editTarget}
        onSave={(draft) => void handleSave(draft)}
      />

      {ConfirmHost}
    </div>
  );
}
