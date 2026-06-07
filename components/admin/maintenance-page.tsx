"use client";

import { useEffect, useState } from "react";
import { Wrench } from "lucide-react";

import {
  ADMIN_PAGE_CLASS,
  ADMIN_PANEL_CLASS,
  AdminInfoBanner,
  AdminLoadingSkeleton,
  AdminPageHeader,
} from "@/components/admin/admin-ui";
import { useConfirm } from "@/hooks/use-confirm";
import { setMaintenanceModeLocal } from "@/lib/admin/maintenance";
import { ADMIN_ROUTES } from "@/lib/admin/admin-nav-config";
import { appToast } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function MaintenancePage() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const { confirm, ConfirmHost } = useConfirm();

  const load = () => {
    void fetch("/api/admin/maintenance")
      .then((r) => r.json())
      .then((data: { enabled?: boolean }) => {
        const on = Boolean(data.enabled);
        setEnabled(on);
        setMaintenanceModeLocal(on);
      })
      .catch(() => setEnabled(false));
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async () => {
    if (enabled === null) return;
    const next = !enabled;
    if (next) {
      const ok = await confirm({
        title: "Bakım modu açılsın mı?",
        description: "Tüm koç ve öğrenci girişleri engellenecek.",
        confirmLabel: "Aç",
        destructive: true,
      });
      if (!ok) return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Güncellenemedi");
      setEnabled(next);
      setMaintenanceModeLocal(next);
      appToast.success(next ? "Bakım modu açıldı" : "Bakım modu kapatıldı");
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "İşlem başarısız");
    } finally {
      setSaving(false);
    }
  };

  if (enabled === null) return <AdminLoadingSkeleton />;

  return (
    <div className={ADMIN_PAGE_CLASS}>
      <AdminPageHeader
        title="Yönetim"
        description="Platform bakım modu ve sistem ayarları."
      />

      <section className={ADMIN_PANEL_CLASS}>
        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <Wrench className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Bakım modu</h2>
                <p className="mt-1 max-w-lg text-sm text-slate-500">
                  Açıkken koç ve öğrenci giriş sayfası engellenir. Kurucu paneli çalışmaya devam eder.
                </p>
                <p className="mt-3 text-sm font-semibold text-slate-700">
                  Durum: {enabled ? "Aktif" : "Kapalı"}
                </p>
              </div>
            </div>
            <Button
              variant={enabled ? "destructive" : "primary"}
              onClick={() => void toggle()}
              disabled={saving}
            >
              {saving ? "Kaydediliyor…" : enabled ? "Bakımı kapat" : "Bakımı aç"}
            </Button>
          </div>
          {enabled ? (
            <div className="mt-6">
              <AdminInfoBanner variant="warning">
                Bakım modu şu an aktif. Koç ve öğrenciler giriş yapamaz.
              </AdminInfoBanner>
            </div>
          ) : null}
        </div>
      </section>

      <section className={ADMIN_PANEL_CLASS}>
        <div className="flex flex-wrap gap-3 p-6">
          <Button variant="outline" asChild>
            <Link href={ADMIN_ROUTES.accounting}>Muhasebe</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={ADMIN_ROUTES.globalExam}>Global deneme takvimi</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={ADMIN_ROUTES.institutions}>Kurumlar</Link>
          </Button>
        </div>
      </section>

      {ConfirmHost}
    </div>
  );
}
