"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckSquare,
  PenLine,
  RotateCcw,
  Search,
  Sparkles,
  Square,
} from "lucide-react";
import { toast } from "@/lib/notify";

import { Button } from "@/components/ui/button";
import { HataKaynagiToggle } from "@/components/hata-recetesi/hata-kaynagi-toggle";
import { HataRecetesiShell } from "@/components/hata-recetesi/hata-recetesi-shell";
import {
  HrCockpit,
  HrEmptyState,
  HrField,
  HrSplitLayout,
  HrStickyBar,
  HrWorkspace,
  hrInputClass,
} from "@/components/hata-recetesi/hr-ui";
import { MufredatFilters } from "@/components/hata-recetesi/mufredat-filters";
import { StudentCombobox } from "@/components/hata-recetesi/student-combobox";
import { WrongQuestionCard } from "@/components/hata-recetesi/wrong-question-card";
import { TEST_MAKER_ROUTES } from "@/lib/test-maker/constants";
import { filterWrongPool } from "@/lib/hata-recetesi/filters";
import { consumeMeetingHandoff } from "@/lib/hata-recetesi/meeting-handoff";
import { loadWrongPool } from "@/lib/hata-recetesi/storage";
import { saveReceteToTestMaker } from "@/lib/hata-recetesi/transfer";
import type { WrongQuestionRecord } from "@/lib/hata-recetesi/types";

export function ReceteYazPage() {
  const router = useRouter();
  const [student, setStudent] = useState("");
  const [dersName, setDersName] = useState("");
  const [konuName, setKonuName] = useState("");
  const [kavramName, setKavramName] = useState("");
  const [havuzScope, setHavuzScope] = useState("son3");
  const [hataKaynagi, setHataKaynagi] = useState({ deneme: true, soru_bankasi: true });
  const [displayed, setDisplayed] = useState<WrongQuestionRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    const handoff = consumeMeetingHandoff();
    if (handoff?.receteCanonical) setStudent(handoff.receteCanonical);
    else if (handoff?.name) setStudent(handoff.name);
  }, []);

  const selectedCount = useMemo(
    () => Object.values(selectedIds).filter(Boolean).length,
    [selectedIds]
  );

  const vitrinSelected = useMemo(
    () => displayed.filter((q) => selectedIds[q.id]).length,
    [displayed, selectedIds]
  );

  const fetchQuestions = () => {
    if (!student) {
      toast.error("Önce öğrenci seçin");
      return;
    }
    const list = filterWrongPool(loadWrongPool(), {
      ogrenciCanonical: student,
      dersName: dersName || undefined,
      konuName: konuName || undefined,
      kavramName: kavramName || undefined,
      hataKaynagi,
      requireImage: true,
    });
    void havuzScope;
    setDisplayed(list);
    setFetched(true);
    toast.success(`${list.length} soru vitrine alındı`);
  };

  const clearSelection = () => setSelectedIds({});

  const selectAllDisplayed = () => {
    const next: Record<string, boolean> = { ...selectedIds };
    for (const q of displayed) next[q.id] = true;
    setSelectedIds(next);
  };

  const clearDisplayedSelection = () => {
    const next = { ...selectedIds };
    for (const q of displayed) delete next[q.id];
    setSelectedIds(next);
  };

  const goToDesign = () => {
    if (!student) {
      toast.error("Öğrenci seçin");
      return;
    }
    const selected = loadWrongPool().filter((q) => selectedIds[q.id]);
    if (!selected.length) {
      toast.error("En az bir soru seçin");
      return;
    }
    saveReceteToTestMaker({ studentCanonical: student, questions: selected });
    router.push(TEST_MAKER_ROUTES.olusturucu);
  };

  const toggleSelect = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => ({ ...prev, [id]: checked }));
  }, []);

  const disabled = !student;

  return (
    <HataRecetesiShell
      title="Reçete Yaz"
      description="Öğrencinin hatalı sorularını seçin, Test Oluşturucu'da kişisel fasikül tasarlayın ve arşivleyin."
      action={
        <Button variant="outline" size="sm" asChild>
          <Link href={TEST_MAKER_ROUTES.kirpici}>Kırpıcıdan soru ekle</Link>
        </Button>
      }
    >
      <HrSplitLayout>
        <HrCockpit>
          <div className="hr-cockpit__head">
            <p className="hr-cockpit__head-title">Reçete kokpiti</p>
            <p className="hr-cockpit__head-sub">
              Öğrenci ve filtreler — ardından vitrinden seçim
            </p>
          </div>
          <div className="hr-cockpit__body">
            <HrField label="Öğrenci" hint="Zorunlu — görüşme odasından da doldurulabilir">
              <StudentCombobox value={student} onChange={setStudent} />
            </HrField>

            <div className="hr-cockpit__section">
              <p className="hr-cockpit__section-title">Müfredat</p>
              <MufredatFilters
                idPrefix="ry"
                dersName={dersName}
                konuName={konuName}
                kavramName={kavramName}
                onDersChange={setDersName}
                onKonuChange={setKonuName}
                onKavramChange={setKavramName}
              />
            </div>

            <HrField label="Hata kaynağı">
              <HataKaynagiToggle
                deneme={hataKaynagi.deneme}
                soruBankasi={hataKaynagi.soru_bankasi}
                onChange={setHataKaynagi}
              />
            </HrField>

            <HrField label="Deneme kapsamı" htmlFor="hr-scope" hint="Faz 2: son 3 deneme filtresi">
              <select
                id="hr-scope"
                className={hrInputClass}
                value={havuzScope}
                onChange={(e) => setHavuzScope(e.target.value)}
              >
                <option value="son3">Son 3 deneme</option>
                <option value="tum">Tüm denemeler</option>
              </select>
            </HrField>

            <Button
              variant="primary"
              className="w-full"
              disabled={disabled}
              onClick={fetchQuestions}
            >
              <Search className="h-4 w-4" />
              Hatalı soruları getir
            </Button>
            <Button variant="outline" className="w-full" onClick={clearSelection}>
              <RotateCcw className="h-4 w-4" />
              Tüm seçimleri temizle
            </Button>
          </div>
        </HrCockpit>

        <HrWorkspace>
          <div className="hr-vitrin-stats">
            <div className="hr-vitrin-stat">
              <p className="hr-vitrin-stat__n">{displayed.length}</p>
              <p className="hr-vitrin-stat__l">Vitrinde</p>
            </div>
            <div className="hr-vitrin-stat">
              <p className="hr-vitrin-stat__n">{vitrinSelected}</p>
              <p className="hr-vitrin-stat__l">İşaretli</p>
            </div>
            <div className="hr-vitrin-stat">
              <p className="hr-vitrin-stat__n">{selectedCount}</p>
              <p className="hr-vitrin-stat__l">Toplam seçili</p>
            </div>
          </div>

          {fetched && displayed.length > 0 ? (
            <div className="mb-4 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={selectAllDisplayed}>
                <CheckSquare className="h-4 w-4" />
                Tümünü seç
              </Button>
              <Button variant="ghost" size="sm" onClick={clearDisplayedSelection}>
                <Square className="h-4 w-4" />
                Vitrin seçimini kaldır
              </Button>
            </div>
          ) : null}

          {!fetched ? (
            <HrEmptyState
              icon={PenLine}
              title="Vitrin boş"
              description="Sol kokpitte öğrenciyi seçip «Hatalı soruları getir» ile görselli soruları listeleyin."
            />
          ) : displayed.length === 0 ? (
            <HrEmptyState
              icon={Sparkles}
              title="Bu filtrede soru yok"
              description="Başka ders/konu deneyin veya Kırpıcıdan reçete havuzuna yeni soru ekleyin."
              action={
                <Button variant="primary" size="sm" asChild>
                  <Link href={TEST_MAKER_ROUTES.kirpici}>Soru kırpıcı</Link>
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {displayed.map((item) => (
                <WrongQuestionCard
                  key={item.id}
                  item={item}
                  mode="recete"
                  selected={!!selectedIds[item.id]}
                  onSelect={(checked) => toggleSelect(item.id, checked)}
                />
              ))}
            </div>
          )}

          <HrStickyBar>
            <p className="hr-sticky-bar__stat">
              <strong>{selectedCount}</strong> soru reçeteye hazır
            </p>
            <Button
              variant="primary"
              disabled={disabled || selectedCount === 0}
              onClick={goToDesign}
            >
              Reçete tasarımına git
              <ArrowRight className="h-4 w-4" />
            </Button>
          </HrStickyBar>
        </HrWorkspace>
      </HrSplitLayout>
    </HataRecetesiShell>
  );
}
