"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Inbox, Pencil, Trash2 } from "lucide-react";

import {
  RegistrationRequestFormDialog,
  type RegistrationRequestDraft,
} from "@/components/admin/registration-request-form-dialog";
import {
  ADMIN_PANEL_CLASS,
  AdminDataTable,
  AdminEmptyState,
  AdminStatusBadge,
} from "@/components/admin/admin-ui";
import { ADMIN_ROUTES } from "@/lib/admin/admin-nav-config";
import type { RegistrationRequestRecord } from "@/lib/admin/registration-requests";
import { useAdminLiveRefresh } from "@/hooks/use-admin-live-refresh";
import { useConfirm } from "@/hooks/use-confirm";
import { REGISTER_ROLE_LABELS } from "@/lib/marketing/registration-request";
import { appToast } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  /** Yalnızca yeni kayıtları göster */
  onlyNew?: boolean;
  /** Liste üst limiti */
  limit?: number;
  /** Başlık */
  title?: string;
  /** Tümünü gör linki göster */
  showViewAll?: boolean;
  className?: string;
  /** Üst bileşenden beslenen liste (dashboard canlı yenileme) */
  controlledItems?: RegistrationRequestRecord[];
  /** Düzenleme / silme sonrası üst bileşeni yenile */
  onMutate?: () => void;
};

export function RegistrationRequestsSummary({
  onlyNew = false,
  limit = 8,
  title = "Yeni kayıtlar",
  showViewAll = true,
  className,
  controlledItems,
  onMutate,
}: Props) {
  const isControlled = controlledItems !== undefined;
  const [items, setItems] = useState<RegistrationRequestRecord[]>([]);
  const [loading, setLoading] = useState(!isControlled);
  const [editTarget, setEditTarget] = useState<RegistrationRequestRecord | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { confirm, ConfirmHost } = useConfirm();

  const filterList = useCallback(
    (list: RegistrationRequestRecord[]) => {
      let next = list;
      if (onlyNew) next = next.filter((i) => i.status === "yeni");
      return next.slice(0, limit);
    },
    [onlyNew, limit]
  );

  const displayItems = isControlled ? filterList(controlledItems) : items;

  const load = useCallback(
    ({ silent }: { silent: boolean }) => {
      if (isControlled) return;
      if (!silent) setLoading(true);
      void fetch("/api/admin/registration-requests", { cache: "no-store" })
        .then((r) => r.json())
        .then((data: { items?: RegistrationRequestRecord[] }) => {
          const list = Array.isArray(data.items) ? data.items : [];
          setItems(filterList(list));
        })
        .catch(() => {
          if (!silent) appToast.error("Kayıtlar yüklenemedi");
        })
        .finally(() => {
          if (!silent) setLoading(false);
        });
    },
    [filterList, isControlled]
  );

  useEffect(() => {
    if (isControlled) return;
    void load({ silent: false });
  }, [load, isControlled]);

  useAdminLiveRefresh(load, { enabled: !isControlled });

  const handleSave = async (draft: RegistrationRequestDraft) => {
    if (!editTarget) return;
    const res = await fetch("/api/admin/registration-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editTarget.id, ...draft }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      appToast.error(data.error || "Güncellenemedi");
      return;
    }
    appToast.success("Kayıt güncellendi");
    if (onMutate) onMutate();
    else load({ silent: true });
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
    appToast.success("Kayıt silindi");
    if (onMutate) onMutate();
    else load({ silent: true });
  };

  const openEdit = (item: RegistrationRequestRecord) => {
    setEditTarget(item);
    setDialogOpen(true);
  };

  return (
    <section className={cn(ADMIN_PANEL_CLASS, className)}>
      <div className="p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Landing ve paket teklif formlarından gelen kayıtlar
            </p>
          </div>
          {showViewAll ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={ADMIN_ROUTES.leads}>Tüm teklifler</Link>
            </Button>
          ) : null}
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : displayItems.length === 0 ? (
          <AdminEmptyState
            icon={Inbox}
            title={onlyNew ? "Yeni kayıt yok" : "Kayıt yok"}
            description="Yeni teklif talepleri burada listelenecek."
          />
        ) : (
          <AdminDataTable>
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="pb-3 pr-4">Tarih</th>
                <th className="pb-3 pr-4">Kişi</th>
                <th className="pb-3 pr-4">Paket</th>
                <th className="pb-3 pr-4">İletişim</th>
                <th className="pb-3 pr-4">Durum</th>
                <th className="pb-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {displayItems.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50/80"
                >
                  <td className="py-3 pr-4 text-sm text-slate-600">
                    {new Date(item.createdAt).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "short",
                    })}
                  </td>
                  <td className="py-3 pr-4">
                    <p
                      className={cn(
                        "text-sm",
                        item.status === "yeni" ? "font-bold text-slate-900" : "font-medium text-slate-900"
                      )}
                    >
                      {item.firstName} {item.lastName}
                    </p>
                    <p className="text-xs text-slate-400">{REGISTER_ROLE_LABELS[item.role]}</p>
                  </td>
                  <td className="py-3 pr-4 text-sm text-slate-600">
                    {item.planName || "—"}
                  </td>
                  <td className="py-3 pr-4 text-sm text-slate-600">
                    <p className="truncate max-w-[160px]">{item.email}</p>
                    {item.phone ? (
                      <p className="text-xs text-slate-400">{item.phone}</p>
                    ) : null}
                  </td>
                  <td className="py-3 pr-4">
                    <AdminStatusBadge status={item.status === "yeni" ? "new" : "read"}>
                      {item.status === "yeni" ? "Yeni" : "Okundu"}
                    </AdminStatusBadge>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(item)}
                        aria-label="Düzenle"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                        onClick={() => void handleDelete(item)}
                        aria-label="Sil"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminDataTable>
        )}
      </div>

      <RegistrationRequestFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editTarget}
        onSave={handleSave}
      />
      {ConfirmHost}
    </section>
  );
}
