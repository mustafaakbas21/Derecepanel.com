"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Pencil,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";

import { AccountingFormDialog } from "@/components/admin/accounting-form-dialog";
import { AdminFinanceBarChart } from "@/components/admin/admin-charts";
import {
  ADMIN_PAGE_CLASS,
  ADMIN_PANEL_CLASS,
  AdminChartCard,
  AdminDataTable,
  AdminEmptyState,
  AdminFilterBar,
  AdminHeroMetric,
  AdminLoadingSkeleton,
  AdminMetricGrid,
  AdminPageHeader,
  AdminStatusBadge,
  AdminWaveMetric,
} from "@/components/admin/admin-ui";
import {
  computeAccountingStats,
  formatTry,
  TRANSACTION_CATEGORY_LABELS,
  type AccountingDraft,
  type AccountingTransaction,
  type PaymentStatus,
  type TransactionType,
} from "@/lib/admin/accounting";
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
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<PaymentStatus, string> = {
  odendi: "Ödendi",
  beklemede: "Beklemede",
  iptal: "İptal",
};

function statusBadge(status: PaymentStatus): "active" | "inactive" | "new" | "read" {
  if (status === "odendi") return "active";
  if (status === "beklemede") return "new";
  return "inactive";
}

export function AccountingPage() {
  const [transactions, setTransactions] = useState<AccountingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"tumu" | TransactionType>("tumu");
  const [statusFilter, setStatusFilter] = useState<"tumu" | PaymentStatus>("tumu");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AccountingTransaction | null>(null);
  const { confirm, ConfirmHost } = useConfirm();

  const load = useCallback(({ silent }: { silent: boolean }) => {
    if (!silent) setLoading(true);
    void fetch("/api/admin/accounting", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { items?: AccountingTransaction[] }) => {
        setTransactions(Array.isArray(data.items) ? data.items : []);
      })
      .catch(() => {
        if (!silent) appToast.error("Kayıtlar yüklenemedi");
      })
      .finally(() => {
        if (!silent) setLoading(false);
      });
  }, []);

  useEffect(() => {
    void load({ silent: false });
  }, [load]);

  useAdminLiveRefresh(load);

  const stats = useMemo(() => computeAccountingStats(transactions), [transactions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((t) => {
      if (typeFilter !== "tumu" && t.type !== typeFilter) return false;
      if (statusFilter !== "tumu" && t.status !== statusFilter) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        TRANSACTION_CATEGORY_LABELS[t.category].toLowerCase().includes(q) ||
        String(t.description || "").toLowerCase().includes(q)
      );
    });
  }, [transactions, search, typeFilter, statusFilter]);

  const handleSave = async (draft: AccountingDraft) => {
    const isEdit = Boolean(editTarget);
    const res = await fetch("/api/admin/accounting", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isEdit ? { id: editTarget!.id, ...draft } : draft),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      item?: AccountingTransaction;
    };
    if (!res.ok) {
      appToast.error(data.error || "Kayıt başarısız");
      return;
    }
    appToast.success(isEdit ? "Kayıt güncellendi" : "Kayıt eklendi");
    setEditTarget(null);
    void load({ silent: true });
  };

  const handleDelete = async (txn: AccountingTransaction) => {
    const ok = await confirm({
      title: "Kayıt silinsin mi?",
      description: `${txn.title} (${formatTry(txn.amount)}) kalıcı olarak silinir.`,
      confirmLabel: "Sil",
      destructive: true,
    });
    if (!ok) return;

    const res = await fetch("/api/admin/accounting", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: txn.id }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      appToast.error(data.error || "Silinemedi");
      return;
    }
    appToast.success("Kayıt silindi");
    void load({ silent: true });
  };

  const exportCsv = () => {
    const header = "Tarih,Tür,Kategori,Başlık,Tutar,Durum,Açıklama\n";
    const rows = filtered
      .map((t) =>
        [
          t.date,
          t.type === "gelir" ? "Gelir" : "Gider",
          TRANSACTION_CATEGORY_LABELS[t.category],
          `"${t.title.replace(/"/g, '""')}"`,
          t.amount,
          STATUS_LABELS[t.status],
          `"${String(t.description || "").replace(/"/g, '""')}"`,
        ].join(",")
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `muhasebe-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <AdminLoadingSkeleton />;

  const trendLabel =
    stats.monthTrendPercent >= 0
      ? `+${stats.monthTrendPercent}% geçen aya göre`
      : `${stats.monthTrendPercent}% geçen aya göre`;

  return (
    <div className={ADMIN_PAGE_CLASS}>
      <AdminPageHeader
        title="Muhasebe"
        description="Gelir, gider ve nakit akışını yönetin."
        showExport
        onExport={exportCsv}
        action={
          <Button
            variant="primary"
            onClick={() => {
              setEditTarget(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni kayıt
          </Button>
        }
      />

      <AdminMetricGrid>
        <AdminHeroMetric
          label="Net bakiye"
          value={formatTry(stats.netBalance)}
          trend={trendLabel}
          trendPositive={stats.monthNet >= 0}
        />
        <AdminWaveMetric
          label="Bu ay gelir"
          value={formatTry(stats.monthIncome)}
          sub={`Bekleyen: ${formatTry(stats.pendingIncome)}`}
        />
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Bu ay gider</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
            {formatTry(stats.monthExpense)}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Bekleyen: {formatTry(stats.pendingExpense)}
          </p>
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
            {stats.monthNet >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-emerald-600" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-600" />
            )}
            <span className="font-medium text-slate-700">
              Aylık net: {formatTry(stats.monthNet)}
            </span>
          </div>
        </div>
      </AdminMetricGrid>

      <section className={ADMIN_PANEL_CLASS}>
        <div className="space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Kayıt listesi</h2>
              <p className="mt-1 text-sm text-slate-500">
                {transactions.length} kayıt · Yeni eklenenler listenin en üstünde görünür
              </p>
            </div>
          </div>

          <AdminFilterBar search={search} onSearchChange={setSearch} placeholder="Kayıt ara…">
            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as "tumu" | TransactionType)}
            >
              <SelectTrigger className="h-11 w-[140px] rounded-xl border-slate-200">
                <SelectValue placeholder="Tür" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tumu">Tüm türler</SelectItem>
                <SelectItem value="gelir">Gelir</SelectItem>
                <SelectItem value="gider">Gider</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as "tumu" | PaymentStatus)}
            >
              <SelectTrigger className="h-11 w-[160px] rounded-xl border-slate-200">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tumu">Tüm durumlar</SelectItem>
                <SelectItem value="odendi">Ödendi</SelectItem>
                <SelectItem value="beklemede">Beklemede</SelectItem>
                <SelectItem value="iptal">İptal</SelectItem>
              </SelectContent>
            </Select>
          </AdminFilterBar>

          {filtered.length === 0 ? (
            <AdminEmptyState
              icon={Wallet}
              title="Kayıt bulunamadı"
              description="Gelir veya gider kaydı ekleyerek başlayın."
              action={
                <Button
                  variant="primary"
                  onClick={() => {
                    setEditTarget(null);
                    setDialogOpen(true);
                  }}
                >
                  İlk kaydı ekle
                </Button>
              }
            />
          ) : (
            <AdminDataTable>
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="pb-3 pr-4">Tarih</th>
                  <th className="pb-3 pr-4">Başlık</th>
                  <th className="pb-3 pr-4">Kategori</th>
                  <th className="pb-3 pr-4">Tür</th>
                  <th className="pb-3 pr-4">Tutar</th>
                  <th className="pb-3 pr-4">Durum</th>
                  <th className="pb-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/80"
                  >
                    <td className="py-3.5 pr-4 text-slate-600">
                      {new Date(t.date).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="py-3.5 pr-4">
                      <p className="font-medium text-slate-900">{t.title}</p>
                      {t.description ? (
                        <p className="text-xs text-slate-400">{t.description}</p>
                      ) : null}
                    </td>
                    <td className="py-3.5 pr-4 text-slate-600">
                      {TRANSACTION_CATEGORY_LABELS[t.category]}
                    </td>
                    <td className="py-3.5 pr-4">
                      <span
                        className={cn(
                          "text-xs font-semibold uppercase",
                          t.type === "gelir" ? "text-emerald-700" : "text-red-600"
                        )}
                      >
                        {t.type === "gelir" ? "Gelir" : "Gider"}
                      </span>
                    </td>
                    <td
                      className={cn(
                        "py-3.5 pr-4 font-semibold tabular-nums",
                        t.type === "gelir" ? "text-emerald-700" : "text-slate-900"
                      )}
                    >
                      {t.type === "gelir" ? "+" : "-"}
                      {formatTry(t.amount)}
                    </td>
                    <td className="py-3.5 pr-4">
                      <AdminStatusBadge status={statusBadge(t.status)}>
                        {STATUS_LABELS[t.status]}
                      </AdminStatusBadge>
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => {
                            setEditTarget(t);
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
                          onClick={() => void handleDelete(t)}
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

      <AdminChartCard title="Gelir / gider özeti (12 ay)">
        <AdminFinanceBarChart data={stats.monthlyFinance} />
      </AdminChartCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={ADMIN_PANEL_CLASS}>
          <div className="p-6">
            <h2 className="mb-4 text-base font-bold text-slate-900">Gelir kategorileri</h2>
            {stats.incomeByCategory.length === 0 ? (
              <p className="text-sm text-slate-500">Henüz gelir kaydı yok.</p>
            ) : (
              <ul className="space-y-3">
                {stats.incomeByCategory.map((row) => (
                  <li key={row.category} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{row.label}</span>
                    <span className="font-semibold text-slate-900">{formatTry(row.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
        <section className={ADMIN_PANEL_CLASS}>
          <div className="p-6">
            <h2 className="mb-4 text-base font-bold text-slate-900">Gider kategorileri</h2>
            {stats.expenseByCategory.length === 0 ? (
              <p className="text-sm text-slate-500">Henüz gider kaydı yok.</p>
            ) : (
              <ul className="space-y-3">
                {stats.expenseByCategory.map((row) => (
                  <li key={row.category} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{row.label}</span>
                    <span className="font-semibold text-slate-900">{formatTry(row.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <AccountingFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editTarget}
        onSave={(draft) => void handleSave(draft)}
      />
      {ConfirmHost}
    </div>
  );
}
