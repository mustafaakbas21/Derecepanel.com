"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  computeAccountingStats,
  formatTry,
  TRANSACTION_CATEGORY_LABELS,
  type AccountingStats,
  type AccountingTransaction,
} from "@/lib/admin/accounting";
import type { RegistrationRequestRecord } from "@/lib/admin/registration-requests";
import { refreshAdminPanelData } from "@/lib/admin/refresh-admin-panel";
import {
  AdminFinanceBarChart,
  AdminFinanceNetChart,
  AdminRegistrationScatter,
  AdminStatusRadial,
} from "@/components/admin/admin-charts";
import {
  ADMIN_PAGE_CLASS,
  ADMIN_PANEL_CLASS,
  AdminChartCard,
  AdminChartGrid,
  AdminDataTable,
  AdminHeroMetric,
  AdminLoadingSkeleton,
  AdminMetricGrid,
  AdminPageHeader,
  AdminSegmentedProgress,
  AdminStatusBadge,
  AdminWaveMetric,
} from "@/components/admin/admin-ui";
import type { AdminDashboardStats } from "@/lib/admin/admin-stats";
import { ADMIN_ROUTES } from "@/lib/admin/admin-nav-config";
import { RegistrationRequestsSummary } from "@/components/admin/registration-requests-summary";
import { useAdminLiveRefresh } from "@/hooks/use-admin-live-refresh";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DashboardData = {
  platform: AdminDashboardStats;
  finance: AccountingStats;
  registrationRequests: RegistrationRequestRecord[];
};

export function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  const load = useCallback(async ({ silent }: { silent: boolean }) => {
    await refreshAdminPanelData();

    try {
      const res = await fetch("/api/admin/dashboard", { cache: "no-store" });
      const json = (await res.json()) as {
        accounting?: unknown[];
        registrationRequests?: RegistrationRequestRecord[];
        stats?: AdminDashboardStats;
      };
      const accounting = Array.isArray(json.accounting) ? json.accounting : [];
      const registrationRequests = Array.isArray(json.registrationRequests)
        ? json.registrationRequests
        : [];
      const platform = json.stats ?? {
        totalCoaches: 0,
        activeCoaches: 0,
        totalStudents: 0,
        activeStudents: 0,
        studentsWithPanel: 0,
        recentStudents: 0,
        studentTrendPercent: 0,
        monthlyRegistrations: [],
        statusBreakdown: { aktif: 0, donduruldu: 0, mezun: 0, other: 0 },
        segmentProgress: [],
      };

      setData({
        platform,
        finance: computeAccountingStats(accounting as AccountingTransaction[]),
        registrationRequests,
      });
    } catch {
      if (!silent) {
        setData({
          platform: {
            totalCoaches: 0,
            activeCoaches: 0,
            totalStudents: 0,
            activeStudents: 0,
            studentsWithPanel: 0,
            recentStudents: 0,
            studentTrendPercent: 0,
            monthlyRegistrations: [],
            statusBreakdown: { aktif: 0, donduruldu: 0, mezun: 0, other: 0 },
            segmentProgress: [],
          },
          finance: computeAccountingStats([]),
          registrationRequests: [],
        });
      }
    }
  }, []);

  useEffect(() => {
    void load({ silent: false });
  }, [load]);

  useAdminLiveRefresh(load);

  if (!data) {
    return <AdminLoadingSkeleton />;
  }

  const { platform: stats, finance, registrationRequests } = data;

  const trendLabel =
    stats.studentTrendPercent >= 0
      ? `+${stats.studentTrendPercent}% son 30 gün`
      : `${stats.studentTrendPercent}% son 30 gün`;

  const financeTrend =
    finance.monthTrendPercent >= 0
      ? `+${finance.monthTrendPercent}% geçen aya göre`
      : `${finance.monthTrendPercent}% geçen aya göre`;

  const segments = stats.segmentProgress.map((s) => ({
    label: s.label,
    percent: s.value,
    color: s.color,
  }));

  return (
    <div className={ADMIN_PAGE_CLASS}>
      <AdminPageHeader
        title="Platform Özeti"
        description="Koç, öğrenci ve finans istatistiklerinin güncel görünümü."
        tabs={[
          { label: "Özet", active: true },
          { label: "Koçlar", href: ADMIN_ROUTES.coaches },
          { label: "Öğrenciler", href: ADMIN_ROUTES.students },
          { label: "Muhasebe", href: ADMIN_ROUTES.accounting },
        ]}
        action={
          <>
            <Button variant="outline" asChild>
              <Link href={ADMIN_ROUTES.accounting}>Muhasebe</Link>
            </Button>
            <Button variant="primary" asChild>
              <Link href={ADMIN_ROUTES.coachNew}>Yeni koç</Link>
            </Button>
          </>
        }
      />

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Platform
        </h2>
        <AdminMetricGrid>
          <AdminHeroMetric
            label="Toplam Öğrenci"
            value={stats.totalStudents}
            trend={trendLabel}
            trendPositive={stats.studentTrendPercent >= 0}
          />
          <AdminWaveMetric
            label="Toplam Koç"
            value={stats.totalCoaches}
            sub={`${stats.activeCoaches} aktif koç`}
          />
          <AdminSegmentedProgress
            title="Hesap dağılımı"
            value={`${stats.studentsWithPanel} panel`}
            segments={segments}
          />
        </AdminMetricGrid>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Finans özeti
          </h2>
          <Button variant="outline" size="sm" asChild>
            <Link href={ADMIN_ROUTES.accounting}>
              Tüm muhasebe
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <AdminMetricGrid>
          <AdminHeroMetric
            label="Net bakiye"
            value={formatTry(finance.netBalance)}
            trend={financeTrend}
            trendPositive={finance.monthNet >= 0}
          />
          <AdminWaveMetric
            label="Bu ay gelir"
            value={formatTry(finance.monthIncome)}
            sub={`Toplam gelir: ${formatTry(finance.totalIncome)}`}
          />
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Bu ay gider</p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
              {formatTry(finance.monthExpense)}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Bekleyen tahsilat: {formatTry(finance.pendingIncome)}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Bekleyen ödeme: {formatTry(finance.pendingExpense)}
            </p>
          </div>
        </AdminMetricGrid>
      </div>

      <AdminChartGrid>
        <AdminChartCard title="Kayıt özeti" className="lg:col-span-2">
          <AdminRegistrationScatter data={stats.monthlyRegistrations} />
        </AdminChartCard>
        <AdminChartCard title="Öğrenci durumu">
          <AdminStatusRadial breakdown={stats.statusBreakdown} />
        </AdminChartCard>
      </AdminChartGrid>

      <AdminChartGrid>
        <AdminChartCard title="Gelir / gider (12 ay)" className="lg:col-span-2">
          <AdminFinanceBarChart data={finance.monthlyFinance} />
        </AdminChartCard>
        <AdminChartCard title="Aylık net nakit">
          <AdminFinanceNetChart data={finance.monthlyFinance} />
        </AdminChartCard>
      </AdminChartGrid>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className={cn(ADMIN_PANEL_CLASS, "lg:col-span-2")}>
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-slate-900">Son işlemler</h2>
              <Button variant="outline" size="sm" asChild>
                <Link href={ADMIN_ROUTES.accounting}>Tümünü gör</Link>
              </Button>
            </div>
            {finance.recentTransactions.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">
                Henüz muhasebe kaydı yok.
              </p>
            ) : (
              <AdminDataTable>
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="pb-3 pr-4">Tarih</th>
                    <th className="pb-3 pr-4">Başlık</th>
                    <th className="pb-3 pr-4">Kategori</th>
                    <th className="pb-3 pr-4">Tutar</th>
                    <th className="pb-3">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {finance.recentTransactions.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/80"
                    >
                      <td className="py-3 pr-4 text-slate-600">
                        {new Date(t.date).toLocaleDateString("tr-TR")}
                      </td>
                      <td className="py-3 pr-4 font-medium text-slate-900">{t.title}</td>
                      <td className="py-3 pr-4 text-slate-600">
                        {TRANSACTION_CATEGORY_LABELS[t.category]}
                      </td>
                      <td
                        className={cn(
                          "py-3 pr-4 font-semibold tabular-nums",
                          t.type === "gelir" ? "text-emerald-700" : "text-slate-900"
                        )}
                      >
                        {t.type === "gelir" ? "+" : "-"}
                        {formatTry(t.amount)}
                      </td>
                      <td className="py-3">
                        <AdminStatusBadge
                          status={
                            t.status === "odendi"
                              ? "active"
                              : t.status === "beklemede"
                                ? "new"
                                : "inactive"
                          }
                        >
                          {t.status === "odendi"
                            ? "Ödendi"
                            : t.status === "beklemede"
                              ? "Beklemede"
                              : "İptal"}
                        </AdminStatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </AdminDataTable>
            )}
          </div>
        </section>

        <section className={ADMIN_PANEL_CLASS}>
          <div className="space-y-6 p-6">
            <div>
              <h2 className="mb-3 text-base font-bold text-slate-900">Gelir dağılımı</h2>
              {finance.incomeByCategory.length === 0 ? (
                <p className="text-sm text-slate-500">Veri yok</p>
              ) : (
                <ul className="space-y-2">
                  {finance.incomeByCategory.slice(0, 5).map((row) => (
                    <li
                      key={row.category}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-slate-600">{row.label}</span>
                      <span className="font-semibold text-emerald-700">
                        {formatTry(row.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h2 className="mb-3 text-base font-bold text-slate-900">Gider dağılımı</h2>
              {finance.expenseByCategory.length === 0 ? (
                <p className="text-sm text-slate-500">Veri yok</p>
              ) : (
                <ul className="space-y-2">
                  {finance.expenseByCategory.slice(0, 5).map((row) => (
                    <li
                      key={row.category}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-slate-600">{row.label}</span>
                      <span className="font-semibold text-slate-900">
                        {formatTry(row.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-xl bg-slate-50 p-4 text-sm">
              <p className="font-semibold text-slate-900">Özet</p>
              <p className="mt-2 text-slate-600">
                {finance.paidTransactionCount} ödenmiş işlem
              </p>
              <p className="text-slate-600">
                Aylık net:{" "}
                <span
                  className={cn(
                    "font-semibold",
                    finance.monthNet >= 0 ? "text-emerald-700" : "text-red-600"
                  )}
                >
                  {formatTry(finance.monthNet)}
                </span>
              </p>
            </div>
          </div>
        </section>
      </div>

      <RegistrationRequestsSummary
        onlyNew
        limit={10}
        title="Yeni kayıtlar"
        controlledItems={registrationRequests}
        onMutate={() => void load({ silent: true })}
      />
    </div>
  );
}
