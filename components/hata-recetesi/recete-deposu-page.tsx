"use client";

import { panelGetItem, panelRemoveItem, panelSetItem } from "@/lib/panel-store";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Archive, PenLine, Plus, Search } from "lucide-react";
import { useConfirm } from "@/hooks/use-confirm";
import { toast } from "@/lib/notify";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HataRecetesiShell } from "@/components/hata-recetesi/hata-recetesi-shell";
import {
  HrEmptyState,
  HrField,
  HrFilterActions,
  HrFilterGrid,
  HrPanel,
  HrResultBar,
  HrSectionTitle,
  hrInputClass,
} from "@/components/hata-recetesi/hr-ui";
import { MufredatFilters } from "@/components/hata-recetesi/mufredat-filters";
import { ReceteDeposuStats } from "@/components/hata-recetesi/recete-deposu-stats";
import { ReceteDeposuTable } from "@/components/hata-recetesi/recete-deposu-table";
import { SendToStudentModal } from "@/components/hata-recetesi/send-to-student-modal";
import { HATA_RECETESI_ROUTES } from "@/lib/hata-recetesi/constants";
import { receteDelete, receteList } from "@/lib/hata-recetesi/recete-db";
import {
  computeReceteDeposuStats,
  filterReceteArchive,
} from "@/lib/hata-recetesi/stats";
import type { RecipeArchiveRecord } from "@/lib/hata-recetesi/types";
import { STORAGE_KEYS, TEST_MAKER_ROUTES } from "@/lib/test-maker/constants";

export function ReceteDeposuPage() {
  const { confirm, ConfirmHost } = useConfirm();
  const [all, setAll] = useState<RecipeArchiveRecord[]>([]);
  const [q, setQ] = useState("");
  const [ders, setDers] = useState("");
  const [konu, setKonu] = useState("");
  const [days, setDays] = useState<number | "">("");
  const [preview, setPreview] = useState<RecipeArchiveRecord | null>(null);
  const [sendRec, setSendRec] = useState<RecipeArchiveRecord | null>(null);
  const [sendOpen, setSendOpen] = useState(false);

  const reload = useCallback(async () => {
    try {
      setAll(await receteList());
    } catch {
      toast.error("Reçete deposu yüklenemedi");
    }
  }, []);

  useEffect(() => {
    void reload();
    const onChange = () => void reload();
    window.addEventListener("hata-recetesi:recete-deposu-change", onChange);
    return () => window.removeEventListener("hata-recetesi:recete-deposu-change", onChange);
  }, [reload]);

  const filtered = useMemo(
    () =>
      filterReceteArchive(all, {
        q,
        ders: ders || undefined,
        konu: konu || undefined,
        days: days ? Number(days) : undefined,
      }),
    [all, q, ders, konu, days]
  );

  const stats = useMemo(() => computeReceteDeposuStats(all), [all]);

  const handleEdit = (rec: RecipeArchiveRecord) => {
    panelSetItem(STORAGE_KEYS.transferReceteEdit, rec.id);
    window.location.href = TEST_MAKER_ROUTES.olusturucu;
  };

  const handleDelete = async (rec: RecipeArchiveRecord) => {
    const ok = await confirm({
      title: `"${rec.name}" silinsin mi?`,
      confirmLabel: "Sil",
      destructive: true,
    });
    if (!ok) return;
    await receteDelete(rec.id);
    toast.success("Reçete silindi");
    void reload();
  };

  const handlePdf = (rec: RecipeArchiveRecord) => {
    if (!rec.pdf_file_id) return;
    toast.info("PDF önizleme", { description: rec.pdf_file_id });
  };

  return (
    <>
    <HataRecetesiShell
      title="Reçete Deposu"
      description="Kayıtlı hata reçetelerinizi arayın, önizleyin, düzenleyin ve öğrenci kütüphanesine gönderin."
      action={
        <Button variant="primary" size="sm" asChild>
          <Link href={TEST_MAKER_ROUTES.olusturucu}>
            <Plus className="h-4 w-4" />
            Yeni reçete
          </Link>
        </Button>
      }
    >
      <ReceteDeposuStats stats={stats} />

      <HrPanel>
        <HrSectionTitle title="Arşiv filtreleri" subtitle="Canlı arama — tablo anında güncellenir" />
        <HrFilterGrid>
          <HrField label="Arama" htmlFor="rd-q" className="sm:col-span-2">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                id="rd-q"
                type="search"
                className={`${hrInputClass} pl-9`}
                placeholder="Reçete adı, öğrenci, kurum…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </HrField>
          <MufredatFilters
            idPrefix="rd"
            showKavram={false}
            dersName={ders}
            konuName={konu}
            kavramName=""
            onDersChange={(v) => {
              setDers(v);
              setKonu("");
            }}
            onKonuChange={setKonu}
            onKavramChange={() => {}}
          />
          <HrField label="Tarih" htmlFor="rd-days">
            <select
              id="rd-days"
              className={hrInputClass}
              value={days === "" ? "" : String(days)}
              onChange={(e) => setDays(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">Tüm zamanlar</option>
              <option value="7">Son 7 gün</option>
              <option value="30">Son 30 gün</option>
              <option value="90">Son 90 gün</option>
              <option value="365">Son 1 yıl</option>
            </select>
          </HrField>
        </HrFilterGrid>
        <HrFilterActions>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setQ("");
              setDers("");
              setKonu("");
              setDays("");
            }}
          >
            Filtreleri temizle
          </Button>
        </HrFilterActions>
      </HrPanel>

      <HrResultBar>
        <strong className="text-slate-900">{filtered.length}</strong> / {all.length} reçete
        listeleniyor
      </HrResultBar>

      <HrPanel noPadding>
        {all.length === 0 ? (
          <div className="p-6 sm:p-8">
            <HrEmptyState
              icon={Archive}
              title="Henüz reçete yok"
              description="Test Oluşturucu'da soruları hazırlayıp «Reçete deposuna kaydet» ile arşive ekleyin. Veya Reçete Yaz ile havuzdan aktarın."
              action={
                <>
                  <Button variant="primary" size="sm" asChild>
                    <Link href={HATA_RECETESI_ROUTES.receteYaz}>
                      <PenLine className="h-4 w-4" />
                      Reçete yaz
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={TEST_MAKER_ROUTES.olusturucu}>Test oluşturucu</Link>
                  </Button>
                </>
              }
            />
          </div>
        ) : (
          <ReceteDeposuTable
            rows={filtered}
            onPreview={setPreview}
            onEdit={handleEdit}
            onSend={(rec) => {
              setSendRec(rec);
              setSendOpen(true);
            }}
            onDelete={(rec) => void handleDelete(rec)}
            onPdf={handlePdf}
          />
        )}
      </HrPanel>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b border-slate-100 px-5 py-4">
            <DialogTitle className="text-left">{preview?.name}</DialogTitle>
            {preview?.studentCanonical ? (
              <p className="text-left text-sm text-slate-500">{preview.studentCanonical}</p>
            ) : null}
          </DialogHeader>
          {preview ? (
            <div className="grid max-h-[min(60vh,520px)] grid-cols-2 gap-3 overflow-y-auto p-4 sm:grid-cols-3">
              {preview.questions.map((q, i) => (
                <div
                  key={q.id}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                >
                  <div className="border-b border-slate-100 bg-white px-2 py-1 text-center text-[10px] font-bold text-slate-500">
                    Soru {i + 1}
                    {q.answer ? ` · ${q.answer}` : ""}
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={q.imageDataUrl}
                    alt=""
                    className="max-h-36 w-full object-contain p-2"
                  />
                </div>
              ))}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <SendToStudentModal
        rec={sendRec}
        open={sendOpen}
        onOpenChange={(o) => {
          setSendOpen(o);
          if (!o) setSendRec(null);
        }}
      />
    </HataRecetesiShell>
    {ConfirmHost}
    </>
  );
}
