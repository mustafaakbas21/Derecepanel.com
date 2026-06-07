"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Inbox, Pencil, Trash2 } from "lucide-react";

import {
  RegistrationRequestFormDialog,
  type RegistrationRequestDraft,
} from "@/components/admin/registration-request-form-dialog";
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
import type { RegistrationRequestRecord } from "@/lib/admin/registration-requests";
import { useAdminLiveRefresh } from "@/hooks/use-admin-live-refresh";
import { useConfirm } from "@/hooks/use-confirm";
import { REGISTER_ROLE_LABELS } from "@/lib/marketing/registration-request";
import { appToast } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RegistrationRequestsPage() {
  const [items, setItems] = useState<RegistrationRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<RegistrationRequestRecord | null>(null);
  const [editTarget, setEditTarget] = useState<RegistrationRequestRecord | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { confirm, ConfirmHost } = useConfirm();

  const load = useCallback(({ silent }: { silent: boolean }) => {
    if (!silent) setLoading(true);
    void fetch("/api/admin/registration-requests", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { items?: RegistrationRequestRecord[] }) => {
        setItems(Array.isArray(data.items) ? data.items : []);
      })
      .catch(() => {
        if (!silent) appToast.error("Talepler yüklenemedi");
      })
      .finally(() => {
        if (!silent) setLoading(false);
      });
  }, []);

  useEffect(() => {
    void load({ silent: false });
  }, [load]);

  useAdminLiveRefresh(load);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.firstName.toLowerCase().includes(q) ||
        i.lastName.toLowerCase().includes(q) ||
        i.email.toLowerCase().includes(q) ||
        String(i.phone || "").includes(q) ||
        String(i.planName || "").toLowerCase().includes(q)
    );
  }, [items, search]);

  const newCount = items.filter((i) => i.status === "yeni").length;

  const handleSave = async (draft: RegistrationRequestDraft) => {
    if (!editTarget) return;
    const res = await fetch("/api/admin/registration-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editTarget.id, ...draft }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; item?: RegistrationRequestRecord };
    if (!res.ok) {
      appToast.error(data.error || "Güncellenemedi");
      return;
    }
    appToast.success("Kayıt güncellendi");
    if (data.item) {
      setSelected((prev) => (prev?.id === data.item!.id ? data.item! : prev));
    }
    void load({ silent: true });
  };

  const handleDelete = async (item: RegistrationRequestRecord) => {
    const ok = await confirm({
      title: "Kayıt silinsin mi?",
      description: `${item.firstName} ${item.lastName} talebi kalıcı olarak silinir.`,
      confirmLabel: "Sil",
      destructive: true,
    });
    if (!ok) return;

    const res = await fetch("/api/admin/registration-requests", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      appToast.error(data.error || "Silinemedi");
      return;
    }
    if (selected?.id === item.id) setSelected(null);
    appToast.success("Kayıt silindi");
    void load({ silent: true });
  };

  const openEdit = (item: RegistrationRequestRecord) => {
    setEditTarget(item);
    setDialogOpen(true);
  };

  if (loading) return <AdminLoadingSkeleton />;

  return (
    <div className={ADMIN_PAGE_CLASS}>
      <AdminPageHeader
        title="Teklif Talepleri"
        description={`Landing sayfasından gelen kayıt ve teklif talepleri · ${newCount} yeni`}
      />

      <section className={ADMIN_PANEL_CLASS}>
        <div className="space-y-4 p-6">
          <AdminFilterBar
            search={search}
            onSearchChange={setSearch}
            placeholder="Ad, e-posta, paket veya telefon ara…"
          />

          {filtered.length === 0 ? (
            <AdminEmptyState
              icon={Inbox}
              title="Henüz talep yok"
              description="Yeni talepler burada listelenecek."
            />
          ) : (
            <AdminDataTable>
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="pb-3 pr-4">Tarih</th>
                  <th className="pb-3 pr-4">Ad</th>
                  <th className="pb-3 pr-4">Paket</th>
                  <th className="pb-3 pr-4">Rol</th>
                  <th className="pb-3 pr-4">İletişim</th>
                  <th className="pb-3 pr-4">Durum</th>
                  <th className="pb-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50/80"
                    onClick={() => setSelected(item)}
                  >
                    <td className="py-3.5 pr-4 text-slate-600">
                      {new Date(item.createdAt).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="py-3.5 pr-4">
                      <p
                        className={cn(
                          item.status === "yeni" ? "font-bold text-slate-900" : "font-medium text-slate-900"
                        )}
                      >
                        {item.firstName} {item.lastName}
                      </p>
                    </td>
                    <td className="py-3.5 pr-4">
                      {item.planName ? (
                        <p className="font-medium text-slate-900">{item.planName}</p>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                      {item.billingPeriod ? (
                        <p className="text-xs text-slate-400">
                          {item.billingPeriod === "yillik" ? "Yıllık" : "Aylık"}
                        </p>
                      ) : null}
                    </td>
                    <td className="py-3.5 pr-4 text-slate-600">
                      {REGISTER_ROLE_LABELS[item.role]}
                    </td>
                    <td className="py-3.5 pr-4 text-slate-600">
                      <p>{item.email}</p>
                      {item.phone ? (
                        <p className="text-xs text-slate-400">{item.phone}</p>
                      ) : null}
                    </td>
                    <td className="py-3.5 pr-4">
                      <AdminStatusBadge status={item.status === "yeni" ? "new" : "read"}>
                        {item.status === "yeni" ? "Yeni" : "Okundu"}
                      </AdminStatusBadge>
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => openEdit(item)}
                          aria-label="Düzenle"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 text-red-600 hover:text-red-700"
                          onClick={() => void handleDelete(item)}
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

      {selected ? (
        <section className={ADMIN_PANEL_CLASS}>
          <div className="space-y-3 p-6">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900">
                {selected.firstName} {selected.lastName}
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(selected)}>
                  Düzenle
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelected(null)}>
                  Kapat
                </Button>
              </div>
            </div>
            {selected.planName ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                <p className="font-semibold text-slate-900">Paket: {selected.planName}</p>
                {selected.billingPeriod ? (
                  <p className="mt-1 text-slate-600">
                    Faturalandırma:{" "}
                    {selected.billingPeriod === "yillik" ? "Yıllık" : "Aylık"}
                  </p>
                ) : null}
                {selected.teamSize ? (
                  <p className="mt-1 text-slate-600">Ekip / ölçek: {selected.teamSize}</p>
                ) : null}
              </div>
            ) : null}
            <p className="text-sm text-slate-600">Rol: {REGISTER_ROLE_LABELS[selected.role]}</p>
            <p className="text-sm text-slate-600">E-posta: {selected.email}</p>
            {selected.phone ? (
              <p className="text-sm text-slate-600">Telefon: {selected.phone}</p>
            ) : null}
            {selected.organization ? (
              <p className="text-sm text-slate-600">Kurum / okul: {selected.organization}</p>
            ) : null}
            {selected.message ? (
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">{selected.message}</p>
            ) : null}
          </div>
        </section>
      ) : null}

      <RegistrationRequestFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editTarget}
        onSave={handleSave}
      />
      {ConfirmHost}
    </div>
  );
}
