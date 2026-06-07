"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardList, Filter, RotateCcw, Trash2 } from "lucide-react";
import { useConfirm } from "@/hooks/use-confirm";
import { toast } from "@/lib/notify";

import { Button } from "@/components/ui/button";
import { HataKaynagiToggle } from "@/components/hata-recetesi/hata-kaynagi-toggle";
import { HataRecetesiShell } from "@/components/hata-recetesi/hata-recetesi-shell";
import { HataTipSelect } from "@/components/hata-recetesi/hata-tip-select";
import {
  HrEmptyState,
  HrField,
  HrFilterActions,
  HrFilterGrid,
  HrMetrics,
  HrPanel,
  HrResultBar,
  HrSectionTitle,
  hrInputClass,
} from "@/components/hata-recetesi/hr-ui";
import { MufredatFilters } from "@/components/hata-recetesi/mufredat-filters";
import { WrongQuestionCard } from "@/components/hata-recetesi/wrong-question-card";
import { filterWrongPool, type WrongPoolFilters } from "@/lib/hata-recetesi/filters";
import { studentSelectOptions } from "@/lib/hata-recetesi/students";
import {
  clearWrongPool,
  loadWrongPool,
  removeWrongById,
  updateWrongAnswer,
  WrongPoolQuotaError,
} from "@/lib/hata-recetesi/storage";
import type { HataTipi, WrongQuestionRecord } from "@/lib/hata-recetesi/types";
import type { AnswerLetter } from "@/lib/test-maker/types";

const EMPTY_FILTERS = {
  ogrenciCanonical: "",
  dersName: "",
  konuName: "",
  kavramName: "",
  hataTipi: "" as HataTipi | "",
  hataKaynagi: { deneme: true, soru_bankasi: true },
};

export function WrongPoolPage() {
  const { confirm, ConfirmHost } = useConfirm();
  const [pool, setPool] = useState<WrongQuestionRecord[]>([]);
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);

  const refresh = useCallback(() => setPool(loadWrongPool()), []);

  useEffect(() => {
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key.includes("hatali_soru")) refresh();
    };
    const onCustom = () => refresh();
    window.addEventListener("storage", onStorage);
    window.addEventListener("hata-recetesi:wrong-pool-change", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("hata-recetesi:wrong-pool-change", onCustom);
    };
  }, [refresh]);

  const filtered = useMemo(() => {
    const f: WrongPoolFilters = {
      ogrenciCanonical: applied.ogrenciCanonical || undefined,
      dersName: applied.dersName || undefined,
      konuName: applied.konuName || undefined,
      kavramName: applied.kavramName || undefined,
      hataTipi: applied.hataTipi || undefined,
      hataKaynagi: applied.hataKaynagi,
    };
    return filterWrongPool(pool, f);
  }, [pool, applied]);

  const ogrenciOptions = useMemo(() => studentSelectOptions(), []);

  const yanlisCount = useMemo(
    () => pool.filter((q) => (q.hataTipi ?? "yanlis") !== "bos").length,
    [pool]
  );
  const bosCount = pool.length - yanlisCount;

  const applyFilters = () => setApplied({ ...draft });
  const resetFilters = () => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
  };

  const handleAnswer = (id: string, letter: AnswerLetter | null) => {
    try {
      updateWrongAnswer(id, letter);
      refresh();
    } catch (e) {
      if (e instanceof WrongPoolQuotaError) toast.error(e.message);
      else toast.error("Kayıt başarısız");
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Soru silinsin mi?",
      description: "Bu soru hatalı soru havuzundan kaldırılır.",
      confirmLabel: "Sil",
      destructive: true,
    });
    if (!ok) return;
    removeWrongById(id);
    refresh();
    toast.success("Soru silindi");
  };

  const handleClearAll = async () => {
    const ok = await confirm({
      title: "Tüm arşiv temizlensin mi?",
      description: "Hatalı soru arşivi kalıcı olarak silinir.",
      confirmLabel: "Evet, temizle",
      destructive: true,
    });
    if (!ok) return;
    clearWrongPool();
    refresh();
    toast.success("Arşiv temizlendi");
  };

  return (
    <>
    <HataRecetesiShell
      title="Hatalı Soru Havuzu"
      description="Deneme ve soru bankasından gelen yanlış/boş soruların merkezi arşivi. Cevapları güncelleyebilir veya reçeteye aktarabilirsiniz."
    >
      <HrMetrics
        metrics={[
          { label: "Toplam arşiv", value: pool.length, icon: ClipboardList },
          { label: "Gösterilen", value: filtered.length, icon: Filter },
          { label: "Yanlış", value: yanlisCount, icon: ClipboardList },
          { label: "Boş", value: bosCount, icon: ClipboardList },
        ]}
      />

      <HrPanel>
        <HrSectionTitle
          title="Filtreler"
          subtitle="Öğrenci, müfredat ve hata kaynağına göre daraltın"
        />
        <HrFilterGrid>
          <HrField label="Öğrenci" htmlFor="hr-ogrenci">
            <select
              id="hr-ogrenci"
              className={hrInputClass}
              value={draft.ogrenciCanonical}
              onChange={(e) =>
                setDraft((d) => ({ ...d, ogrenciCanonical: e.target.value }))
              }
            >
              {ogrenciOptions.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </HrField>
          <MufredatFilters
            dersName={draft.dersName}
            konuName={draft.konuName}
            kavramName={draft.kavramName}
            onDersChange={(v) => setDraft((d) => ({ ...d, dersName: v }))}
            onKonuChange={(v) => setDraft((d) => ({ ...d, konuName: v }))}
            onKavramChange={(v) => setDraft((d) => ({ ...d, kavramName: v }))}
          />
          <HrField label="Hata tipi">
            <HataTipSelect
              value={draft.hataTipi}
              onChange={(v) => setDraft((d) => ({ ...d, hataTipi: v }))}
            />
          </HrField>
          <HrField label="Kaynak">
            <HataKaynagiToggle
              deneme={draft.hataKaynagi.deneme ?? true}
              soruBankasi={draft.hataKaynagi.soru_bankasi ?? true}
              onChange={(hk) =>
                setDraft((d) => ({
                  ...d,
                  hataKaynagi: { deneme: hk.deneme, soru_bankasi: hk.soru_bankasi },
                }))
              }
            />
          </HrField>
        </HrFilterGrid>
        <HrFilterActions>
          <Button variant="primary" size="sm" onClick={applyFilters}>
            <Filter className="h-4 w-4" />
            Filtrele
          </Button>
          <Button variant="outline" size="sm" onClick={resetFilters}>
            <RotateCcw className="h-4 w-4" />
            Sıfırla
          </Button>
        </HrFilterActions>
      </HrPanel>

      <HrResultBar
        trailing={
          <Button variant="destructive" size="sm" onClick={handleClearAll}>
            <Trash2 className="h-4 w-4" />
            Arşivi temizle
          </Button>
        }
      >
        <strong className="text-slate-900">{filtered.length}</strong> soru listeleniyor ·
        arşivde <strong className="text-slate-900">{pool.length}</strong> kayıt
      </HrResultBar>

      {filtered.length === 0 ? (
        <HrEmptyState
          icon={ClipboardList}
          title="Gösterilecek soru yok"
          description="Kırpıcıdan «Reçete havuzuna» ile ekleyin veya filtreleri genişletin. Deneme entegrasyonu yakında."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <WrongQuestionCard
              key={item.id}
              item={item}
              mode="pool"
              onAnswer={(letter) => handleAnswer(item.id, letter)}
              onDelete={() => handleDelete(item.id)}
            />
          ))}
        </div>
      )}
    </HataRecetesiShell>
    {ConfirmHost}
    </>
  );
}
