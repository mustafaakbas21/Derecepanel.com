"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  FileText,
  Pencil,
  Send,
  Trash2,
} from "lucide-react";
import { useConfirm } from "@/hooks/use-confirm";
import { toast } from "@/lib/notify";

import { SendFascicleDialog } from "@/components/taramalar/send-fascicle-dialog";
import {
  TrEmptyState,
  TrField,
  TrKpiCard,
  TrKpiGrid,
  TrPanel,
  TrShell,
  trInputClass,
} from "@/components/taramalar/tr-ui";
import { Button } from "@/components/ui/button";
import { TARAMALAR_ROUTES } from "@/lib/coach/taramalar-nav-config";
import { TEST_MAKER_ROUTES } from "@/lib/test-maker/constants";
import {
  TARAMA_ANALIZ_CHANGE,
  TARAMA_DEPO_CHANGE,
} from "@/lib/taramalar/constants";
import {
  computeDepoStats,
  filterTaramaRecords,
  fmtTaramaDate,
  type DepoFilters,
} from "@/lib/taramalar/depo-utils";
import { openTaramaPdfPreviewTab } from "@/lib/taramalar/pdf-preview";
import { mirrorMissingToLs, purgeTaramaLsMirror, syncTaramaDataMirror } from "@/lib/taramalar/tarama-mirror";
import { taramaDelete, taramaList } from "@/lib/taramalar/tarama-db";
import { setTaramaEditId } from "@/lib/taramalar/transfer";
import type { TaramaRecord } from "@/lib/taramalar/types";

const EMPTY_FILTERS: DepoFilters = { q: "", ders: "", konu: "", days: "" };

export function TaramaDeposuPage() {
  const { confirm, ConfirmHost } = useConfirm();
  const router = useRouter();
  const [all, setAll] = useState<TaramaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<DepoFilters>(EMPTY_FILTERS);
  const [sendRec, setSendRec] = useState<TaramaRecord | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const items = await taramaList();
      mirrorMissingToLs(items);
      setAll(items);
    } catch {
      toast.error("Tarama deposu yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onChange = () => void refresh();
    window.addEventListener(TARAMA_DEPO_CHANGE, onChange);
    window.addEventListener(TARAMA_ANALIZ_CHANGE, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(TARAMA_DEPO_CHANGE, onChange);
      window.removeEventListener(TARAMA_ANALIZ_CHANGE, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [refresh]);

  const filtered = useMemo(() => filterTaramaRecords(all, filters), [all, filters]);
  const stats = useMemo(() => computeDepoStats(all), [all]);

  const dersOptions = useMemo(() => {
    const set = new Set(all.map((r) => r.ders).filter(Boolean));
    return [...set].sort();
  }, [all]);

  const konuOptions = useMemo(() => {
    const set = new Set(all.map((r) => r.konu).filter(Boolean));
    return [...set].sort();
  }, [all]);

  const goEdit = (id: string) => {
    setTaramaEditId(id);
    router.push(TEST_MAKER_ROUTES.olusturucu);
  };

  const goAnaliz = (rec: TaramaRecord) => {
    syncTaramaDataMirror(rec);
    router.push(`${TARAMALAR_ROUTES.analiz}?examId=${encodeURIComponent(rec.id)}`);
  };

  const handleDelete = async (rec: TaramaRecord) => {
    const ok = await confirm({
      title: `"${rec.name || "Bu tarama"}" silinsin mi?`,
      description: "Tarama kalıcı olarak silinir.",
      confirmLabel: "Sil",
      destructive: true,
    });
    if (!ok) return;
    try {
      await taramaDelete(rec.id);
      purgeTaramaLsMirror(rec.id);
      toast.success("Tarama silindi");
      await refresh();
    } catch {
      toast.error("Silinemedi");
    }
  };

  const handlePdf = (rec: TaramaRecord) => {
    const ok = openTaramaPdfPreviewTab(rec);
    if (!ok) toast.error("Pop-up engellendi — yeni sekme izni verin");
  };

  return (
    <TrShell
      title="Tarama Deposu"
      description="Test Oluşturucu'dan arşivlenen taramalar. PDF önizleme, öğrenciye gönderme ve analiz köprüsü."
      action={
        <Button variant="primary" asChild>
          <Link href={TEST_MAKER_ROUTES.olusturucu}>Test Oluşturucu</Link>
        </Button>
      }
    >
      <TrKpiGrid>
        <TrKpiCard label="Toplam tarama" value={stats.total} />
        <TrKpiCard label="Toplam soru" value={stats.totalQuestions} />
        <TrKpiCard label="En aktif ders" value={stats.topDers} />
        <TrKpiCard label="Bu ay eklenen" value={stats.thisMonth} />
      </TrKpiGrid>

      <TrPanel>
        <div className="tr-filter-bar tr-no-print">
          <TrField label="Ara">
            <input
              className={trInputClass}
              placeholder="Ad, ders, konu, kurum…"
              value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            />
          </TrField>
          <TrField label="Ders">
            <select
              className={trInputClass}
              value={filters.ders}
              onChange={(e) => setFilters((f) => ({ ...f, ders: e.target.value }))}
            >
              <option value="">Tümü</option>
              {dersOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </TrField>
          <TrField label="Konu">
            <select
              className={trInputClass}
              value={filters.konu}
              onChange={(e) => setFilters((f) => ({ ...f, konu: e.target.value }))}
            >
              <option value="">Tümü</option>
              {konuOptions.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </TrField>
          <TrField label="Tarih">
            <select
              className={trInputClass}
              value={filters.days}
              onChange={(e) => setFilters((f) => ({ ...f, days: e.target.value }))}
            >
              <option value="">Tümü</option>
              <option value="7">Son 7 gün</option>
              <option value="30">Son 30 gün</option>
              <option value="90">Son 90 gün</option>
              <option value="365">Son 1 yıl</option>
            </select>
          </TrField>
          <Button type="button" variant="outline" onClick={() => setFilters(EMPTY_FILTERS)}>
            Temizle
          </Button>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-slate-500">Yükleniyor…</p>
        ) : !all.length ? (
          <TrEmptyState
            title="Henüz bir sınav arşivlemediniz"
            description={
              <>
                Test Oluşturucu&apos;da hazırladığınız testleri{" "}
                <strong>Tarama Deposuna Kaydet</strong> diyerek buraya gönderebilirsiniz.
              </>
            }
            action={
              <Button variant="primary" asChild>
                <Link href={TEST_MAKER_ROUTES.olusturucu}>Test Oluşturucu&apos;ya git</Link>
              </Button>
            }
          />
        ) : !filtered.length ? (
          <TrEmptyState
            title="Eşleşen tarama yok"
            description="Filtreleri gevşetmeyi veya aramayı temizlemeyi deneyin."
          />
        ) : (
          <div className="tr-table-wrap mt-4">
            <table className="tr-table">
              <thead>
                <tr>
                  <th>Ad</th>
                  <th>Ders / Konu</th>
                  <th>Soru</th>
                  <th>Tarih</th>
                  <th>Durum</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((rec) => (
                  <tr key={rec.id}>
                    <td>
                      <p className="font-semibold text-slate-900">{rec.name}</p>
                      {rec.coverTitle ? (
                        <p className="text-xs text-slate-500">{rec.coverTitle}</p>
                      ) : null}
                      <button
                        type="button"
                        className="mt-1 text-xs font-semibold text-slate-700 underline-offset-2 hover:underline"
                        onClick={() => goEdit(rec.id)}
                      >
                        Test Maker&apos;da düzenle
                      </button>
                    </td>
                    <td>
                      <span className="tr-pill">{rec.ders || "—"}</span>{" "}
                      {rec.konu ? <span className="tr-pill tr-pill--muted">{rec.konu}</span> : null}
                    </td>
                    <td>{rec.questions?.length ?? 0}</td>
                    <td>{fmtTaramaDate(rec.createdAt)}</td>
                    <td>
                      <span className="tr-pill tr-pill--ok">Hazır</span>
                    </td>
                    <td>
                      <div className="tr-actions">
                        <Button type="button" size="sm" variant="outline" onClick={() => handlePdf(rec)}>
                          <FileText className="mr-1 h-3.5 w-3.5" />
                          PDF
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setSendRec(rec)}
                        >
                          <Send className="mr-1 h-3.5 w-3.5" />
                          Gönder
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => goAnaliz(rec)}>
                          <BarChart3 className="mr-1 h-3.5 w-3.5" />
                          Analiz
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => goEdit(rec.id)}
                        >
                          <Pencil className="mr-1 h-3.5 w-3.5" />
                          Düzenle
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => void handleDelete(rec)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TrPanel>

      <SendFascicleDialog
        open={Boolean(sendRec)}
        onOpenChange={(o) => !o && setSendRec(null)}
        record={sendRec}
      />
      {ConfirmHost}
    </TrShell>
  );
}
