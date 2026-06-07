"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Check,
  Copy,
  Grid3x3,
  MoreHorizontal,
  Pencil,
  Plus,
  Settings2,
  Trash2,
} from "lucide-react";
import { useConfirm } from "@/hooks/use-confirm";
import { appToast, toast } from "@/lib/notify";

const KurumDenemeWizardModal = dynamic(
  () =>
    import("@/components/exams/kurum-deneme/KurumDenemeWizardModal").then(
      (m) => m.KurumDenemeWizardModal
    ),
  { ssr: false }
);
import { DurumBadge, ExamTypeBadge } from "@/components/exams/exam-type-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useKurumDenemeler } from "@/hooks/use-kurum-denemeler";
import { DENEMELER_ROUTES } from "@/lib/coach/denemeler-nav-config";
import {
  copyKurumDeneme,
  formatTrDateTime,
  getKurumDenemeById,
} from "@/lib/exams/exam-storage";
import type { KurumDeneme } from "@/lib/exams/types";
import { seedKurumsalDemoPack } from "@/lib/exams/seed-kurumsal-pack";
import { cn } from "@/lib/utils";

export function KurumsalDenemelerPage() {
  const { confirm, ConfirmHost } = useConfirm();
  const { list, hydrated, save, remove, refresh } = useKurumDenemeler();
  const [search, setSearch] = useState("");
  const [durumFilter, setDurumFilter] = useState("tumu");
  const [sinavFilter, setSinavFilter] = useState("tumu");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<KurumDeneme | null>(null);
  const [wizardStep, setWizardStep] = useState(0);
  const [menuId, setMenuId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((item) => {
      if (q && !String(item.ad || "").toLowerCase().includes(q)) return false;
      if (durumFilter !== "tumu" && item.durum !== durumFilter) return false;
      if (sinavFilter !== "tumu" && item.sinav !== sinavFilter) return false;
      return true;
    });
  }, [list, search, durumFilter, sinavFilter]);

  const openNew = () => {
    setEditTarget(null);
    setWizardStep(0);
    setModalOpen(true);
  };

  const openEdit = (item: KurumDeneme, step = 0) => {
    setEditTarget(getKurumDenemeById(item.id) ?? item);
    setWizardStep(step);
    setModalOpen(true);
    setMenuId(null);
  };

  const handleDelete = async (id: string, ad: string) => {
    const ok = await confirm({
      title: `"${ad}" silinsin mi?`,
      description:
        "Bu denemeye ait sonuç kayıtları (examResults) otomatik silinmez.",
      confirmLabel: "Sil",
      destructive: true,
    });
    if (!ok) return;
    remove(id);
    appToast.examDeleted();
  };

  const handleCopy = (id: string) => {
    const c = copyKurumDeneme(id);
    if (c) {
      refresh();
      toast.success("Deneme kopyalandı (taslak)");
    }
  };

  const handleSeedDemo = async () => {
    const ok = await confirm({
      title: "5 örnek kurumsal deneme yüklensin mi?",
      description:
        "Öğrencilerim listesindeki aktif ve mezun öğrenciler için tam cevap/konu matrisi ve sonuç kayıtları oluşturulur. Aynı paket tekrar yüklendiğinde güncellenir.",
      confirmLabel: "Yükle",
    });
    if (!ok) return;
    const res = seedKurumsalDemoPack();
    if (!res.studentCount) {
      toast.error("Öğrenci bulunamadı. Önce Öğrencilerim sayfasından kayıt ekleyin.");
      return;
    }
    refresh();
    toast.success(
      `${res.examCount} deneme, ${res.resultRows} sonuç (${res.studentCount} öğrenci) yüklendi`
    );
  };

  if (!hydrated) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-slate-500">
        Yükleniyor…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kurumsal Denemeler</h1>
          <p className="mt-1 text-sm text-slate-600">
            Cevap anahtarı ve konu matrisi ile sonuç yükleme ve analiz merkezine zemin hazırlayın.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleSeedDemo}>
            Örnek paket (5 deneme)
          </Button>
          <Button variant="primary" onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni deneme oluştur
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <Input
          placeholder="Deneme adı ara…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={durumFilter} onValueChange={setDurumFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tumu">Tüm durumlar</SelectItem>
            <SelectItem value="taslak">Taslak</SelectItem>
            <SelectItem value="aktif">Yayında</SelectItem>
            <SelectItem value="tamamlandi">Tamamlandı</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sinavFilter} onValueChange={setSinavFilter}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Sınav" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tumu">Tümü</SelectItem>
            <SelectItem value="TYT">TYT</SelectItem>
            <SelectItem value="AYT">AYT</SelectItem>
            <SelectItem value="YDT">YDT</SelectItem>
          </SelectContent>
        </Select>
        <span className="ml-auto text-sm text-slate-500">
          {filtered.length === list.length
            ? `${list.length} deneme`
            : `${filtered.length} / ${list.length} deneme`}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-8 py-16 text-center">
          <p className="text-slate-600">Henüz kurumsal deneme yok.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button variant="primary" onClick={openNew}>
              İlk denemeyi oluştur
            </Button>
            <Button variant="outline" asChild>
              <Link href={DENEMELER_ROUTES.yukleme}>Sonuç yükleme</Link>
            </Button>
            <Button variant="outline" onClick={handleSeedDemo}>
              Örnek paket (5 deneme)
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Deneme</th>
                    <th className="px-4 py-3">Sınav</th>
                    <th className="px-4 py-3">Matris</th>
                    <th className="px-4 py-3">Katılımcı</th>
                    <th className="px-4 py-3">Durum</th>
                    <th className="px-4 py-3 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => {
                    const pct = item.matrixPct ?? 0;
                    return (
                      <tr
                        key={item.id}
                        className="border-t border-slate-50 hover:bg-slate-50/50"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{item.ad}</div>
                          <div className="text-xs text-slate-500">
                            {formatTrDateTime(item.tarih, item.saat || "09:00")}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <ExamTypeBadge sinav={item.sinav} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  pct >= 100 ? "bg-emerald-500" : "bg-blue-500"
                                )}
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                            {pct >= 100 ? (
                              <Check className="h-4 w-4 text-emerald-600" aria-label="Matris tam" />
                            ) : (
                              <span className="text-xs text-slate-500">{pct}%</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{item.atanan ?? 0}</td>
                        <td className="px-4 py-3">
                          <DurumBadge durum={item.durum || "taslak"} />
                        </td>
                        <td className="relative px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openEdit(item, 0)}
                            >
                              <Pencil className="mr-1 h-3.5 w-3.5" />
                              Düzenle
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setMenuId(menuId === item.id ? null : item.id)}
                              aria-expanded={menuId === item.id}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                          {menuId === item.id && (
                            <div className="absolute right-4 top-10 z-10 min-w-[180px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
                                onClick={() => openEdit(item, 1)}
                              >
                                <Grid3x3 className="h-4 w-4" />
                                Matris / Optik
                              </button>
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
                                onClick={() => handleCopy(item.id)}
                              >
                                <Copy className="h-4 w-4" />
                                Kopyala
                              </button>
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
                                onClick={() => openEdit(item, 2)}
                              >
                                <Settings2 className="h-4 w-4" />
                                Yayın ayarları
                              </button>
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                onClick={() => handleDelete(item.id, item.ad)}
                              >
                                <Trash2 className="h-4 w-4" />
                                Sil
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <ul className="space-y-3 md:hidden">
            {filtered.map((item) => (
              <li
                key={item.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-semibold text-slate-900">{item.ad}</h2>
                    <p className="text-xs text-slate-500">
                      {formatTrDateTime(item.tarih, item.saat || "09:00")}
                    </p>
                  </div>
                  <ExamTypeBadge sinav={item.sinav} />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        (item.matrixPct ?? 0) >= 100 ? "bg-emerald-500" : "bg-blue-500"
                      )}
                      style={{ width: `${item.matrixPct ?? 0}%` }}
                    />
                  </div>
                  {(item.matrixPct ?? 0) >= 100 ? (
                    <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <span className="text-xs text-slate-500">{item.matrixPct}%</span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <DurumBadge durum={item.durum || "taslak"} />
                  <span className="text-xs text-slate-500">{item.atanan} katılımcı</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(item, 0)}>
                    Düzenle
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEdit(item, 1)}>
                    Matris
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {modalOpen && (
        <KurumDenemeWizardModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          initial={editTarget}
          initialStep={wizardStep}
          onSave={(item) => save(item as KurumDeneme)}
        />
      )}
      {ConfirmHost}
    </div>
  );
}
