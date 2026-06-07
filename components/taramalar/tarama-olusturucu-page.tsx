"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckSquare,
  RotateCcw,
  Sparkles,
  Square,
} from "lucide-react";
import { toast } from "@/lib/notify";

import { MufredatFiltersThree } from "@/components/taramalar/mufredat-filters-three";
import { QuestionPickCard } from "@/components/taramalar/question-pick-card";
import {
  TrEmptyState,
  TrField,
  TrPanel,
  TrShell,
  trInputClass,
} from "@/components/taramalar/tr-ui";
import { Button } from "@/components/ui/button";
import { TEST_MAKER_ROUTES } from "@/lib/test-maker/constants";
import { getSubjects, getTopics } from "@/lib/mufredat";
import { autoSelectQuestions, filterPool } from "@/lib/taramalar/auto-select";
import { loadAndEnsurePoolIds, poolItemId } from "@/lib/taramalar/pool-ensure";
import {
  saveTaramaToTestMaker,
  TaramaTransferSaveError,
} from "@/lib/taramalar/transfer";
import type { QuestionPoolItem } from "@/lib/test-maker/types";

export function TaramaOlusturucuPage() {
  const router = useRouter();
  const [pool, setPool] = useState<QuestionPoolItem[]>([]);
  const [dersName, setDersName] = useState("");
  const [konuName, setKonuName] = useState("");
  const [kavramName, setKavramName] = useState("");
  const [count, setCount] = useState(20);
  const [displayed, setDisplayed] = useState<QuestionPoolItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [aiInfo, setAiInfo] = useState<string | null>(null);

  useEffect(() => {
    void loadAndEnsurePoolIds().then(setPool);
  }, []);

  const filters = useMemo(
    () => ({ dersName: dersName || undefined, konuName: konuName || undefined, kavramName: kavramName || undefined }),
    [dersName, konuName, kavramName]
  );

  const selectedCount = useMemo(
    () => Object.values(selectedIds).filter(Boolean).length,
    [selectedIds]
  );

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const clearSelection = () => setSelectedIds({});

  const selectAllDisplayed = () => {
    const next = { ...selectedIds };
    displayed.forEach((q) => {
      next[poolItemId(q)] = true;
    });
    setSelectedIds(next);
  };

  const handleManualFilter = () => {
    const list = filterPool(pool, filters);
    setDisplayed(list);
    setAiInfo(null);
    toast.success(`${list.length} soru vitrine alındı`);
  };

  const handleAiSelect = () => {
    const picked = autoSelectQuestions(count, pool, filters);
    setDisplayed(picked);
    const next: Record<string, boolean> = {};
    picked.forEach((q) => {
      next[poolItemId(q)] = true;
    });
    setSelectedIds(next);
    if (picked.length < count) {
      setAiInfo(`İstenen ${count} soru; havuzda ${picked.length} benzersiz soru bulundu.`);
    } else {
      setAiInfo(null);
    }
    toast.success(`${picked.length} soru otomatik seçildi`);
  };

  const goToDesign = () => {
    const selected = pool.filter((q) => selectedIds[poolItemId(q)]);
    if (!selected.length) {
      toast.error("En az bir soru seçin");
      return;
    }
    const subjects = getSubjects("ALL");
    const dersId = subjects.find((s) => s.name === dersName)?.id;
    const topics = dersId ? getTopics(dersId) : [];
    const konuId = topics.find((t) => t.name === konuName)?.id;
    try {
      saveTaramaToTestMaker(selected, {
        dersId,
        konuId,
        dersText: dersName,
        konuText: konuName,
      });
    } catch (e) {
      const msg =
        e instanceof TaramaTransferSaveError
          ? e.message
          : "Sorular Test Oluşturucuya aktarılamadı.";
      toast.error(msg);
      return;
    }
    router.push(TEST_MAKER_ROUTES.olusturucu);
  };

  return (
    <TrShell
      title="Tarama Oluşturma"
      description="Soru havuzundan tarama seçimi yapın ve Test Oluşturucu'da tasarıma geçin."
    >
      <div className="tr-split">
        <TrPanel className="tr-cockpit space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Tarama kokpiti
          </p>
          <MufredatFiltersThree
            dersName={dersName}
            konuName={konuName}
            kavramName={kavramName}
            onDersChange={setDersName}
            onKonuChange={setKonuName}
            onKavramChange={setKavramName}
          />
          <TrField label="Soru sayısı">
            <input
              type="number"
              min={1}
              max={200}
              className={trInputClass}
              value={count}
              onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))}
            />
          </TrField>
          <div className="flex flex-col gap-2">
            <Button type="button" variant="primary" onClick={handleAiSelect}>
              <Sparkles className="mr-2 h-4 w-4" />
              Yapay Zeka ile Getir
            </Button>
            <Button type="button" variant="outline" onClick={handleManualFilter}>
              Manuel Filtrele
            </Button>
            <Button type="button" variant="outline" onClick={clearSelection}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Seçimleri Temizle
            </Button>
          </div>
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Soru havuzunda <strong>{pool.length}</strong> soru
          </p>
          {aiInfo ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              {aiInfo}
            </p>
          ) : null}
        </TrPanel>

        <TrPanel>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-slate-600">
              {displayed.length} soru · <strong>{selectedCount}</strong> seçili
            </p>
            <Button type="button" size="sm" variant="outline" onClick={selectAllDisplayed}>
              {selectedCount === displayed.length && displayed.length > 0 ? (
                <>
                  <CheckSquare className="mr-1 h-3.5 w-3.5" /> Tümü seçili
                </>
              ) : (
                <>
                  <Square className="mr-1 h-3.5 w-3.5" /> Tümünü seç
                </>
              )}
            </Button>
          </div>

          {!displayed.length ? (
            <TrEmptyState
              title="Vitrin boş"
              description="Sol panelden manuel filtre veya yapay zeka ile soru getirin. Görselsiz sorular elenir."
            />
          ) : (
            <div className="tr-grid">
              {displayed.map((item) => {
                const id = poolItemId(item);
                return (
                  <QuestionPickCard
                    key={id}
                    item={item}
                    selected={Boolean(selectedIds[id])}
                    onToggle={() => toggleSelect(id)}
                  />
                );
              })}
            </div>
          )}

          <div className="tr-sticky-footer">
            <span className="text-sm font-semibold text-slate-800">
              {selectedCount} soru seçildi
            </span>
            <Button type="button" variant="primary" disabled={!selectedCount} onClick={goToDesign}>
              Test Tasarımına Git
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </TrPanel>
      </div>
    </TrShell>
  );
}
