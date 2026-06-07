"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "@/lib/notify";

import { TaramaDepoPickerModal } from "@/components/taramalar/tarama-depo-picker-modal";
import { TrField, TrPanel, TrShell, trInputClass } from "@/components/taramalar/tr-ui";
import { Button } from "@/components/ui/button";
import { appendAssigned, readLastResultInsight } from "@/lib/test-maker/fascicle";
import { TEST_MAKER_ROUTES } from "@/lib/test-maker/constants";
import { receteList } from "@/lib/hata-recetesi/recete-db";
import type { RecipeArchiveRecord } from "@/lib/hata-recetesi/types";
import { HATA_RECETESI_ROUTES } from "@/lib/hata-recetesi/constants";
import {
  buildFasciclePayloadFromTarama,
  validateFascicleAnswerKey,
} from "@/lib/taramalar/fascicle-bridge";
import { setTaramaEditId } from "@/lib/taramalar/transfer";
import type { TaramaRecord } from "@/lib/taramalar/types";
import { loadStudentsFull } from "@/lib/students/storage";

type SourceKind = "design" | "depo" | "recete";

export function FasikulOlusturmaPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [source, setSource] = useState<SourceKind | "">("");
  const [depoOpen, setDepoOpen] = useState(false);
  const [selectedTarama, setSelectedTarama] = useState<TaramaRecord | null>(null);
  const [recipes, setRecipes] = useState<RecipeArchiveRecord[]>([]);
  const [selectedReceteId, setSelectedReceteId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [title, setTitle] = useState("");

  const students = useMemo(
    () => loadStudentsFull({ seedIfEmpty: true }).filter((s) => s.status === "aktif"),
    []
  );

  useEffect(() => {
    void receteList().then(setRecipes);
  }, []);

  const selectedRecete = recipes.find((r) => r.id === selectedReceteId) ?? null;
  const insight = studentId ? readLastResultInsight(studentId) : null;

  const summary = useMemo(() => {
    if (source === "depo" && selectedTarama) {
      const p = buildFasciclePayloadFromTarama(selectedTarama);
      return { title: p.title, count: p.questionCount, key: p.answerKey };
    }
    if (source === "recete" && selectedRecete) {
      return {
        title: selectedRecete.name,
        count: selectedRecete.questionCount,
        key: selectedRecete.answerKey,
      };
    }
    return { title, count: 0, key: "" };
  }, [source, selectedTarama, selectedRecete, title]);

  const canAdvanceStep1 = Boolean(source);
  const canAdvanceStep2 = Boolean(studentId) && (source !== "design" || title.trim());

  const handleSend = () => {
    if (!studentId) {
      toast.error("Öğrenci seçin");
      return;
    }
    const student = students.find((s) => s.ogrenciId === studentId);

    if (source === "depo" && selectedTarama) {
      const payload = buildFasciclePayloadFromTarama(selectedTarama);
      if (!validateFascicleAnswerKey(payload.answerKey)) {
        toast.error("Cevap anahtarı eksik");
        return;
      }
      appendAssigned(studentId, {
        ...payload,
        template: payload.template ?? "",
        studentCode: student?.studentCode,
        source: "fasikul_wizard",
      });
      toast.success("Fasikül gönderildi");
      setStep(1);
      setSource("");
      setSelectedTarama(null);
      return;
    }

    if (source === "recete" && selectedRecete) {
      if (!validateFascicleAnswerKey(selectedRecete.answerKey)) {
        toast.error("Reçete cevap anahtarı eksik");
        return;
      }
      appendAssigned(studentId, {
        id: selectedRecete.id,
        title: selectedRecete.name,
        questionCount: selectedRecete.questionCount,
        answerKey: selectedRecete.answerKey,
        template: selectedRecete.template ?? "",
        studentCode: student?.studentCode,
        source: "fasikul_wizard",
        pdf_file_id: selectedRecete.pdf_file_id,
      });
      toast.success("Reçete fasikül olarak gönderildi");
      return;
    }

    if (source === "design") {
      router.push(`${TEST_MAKER_ROUTES.olusturucu}?mode=fascicle&ogrenci=${encodeURIComponent(studentId)}`);
    }
  };

  return (
    <TrShell
      title="Fasikül Oluşturma"
      description="Koç odaklı fasikül sihirbazı — Test Maker, tarama deposu veya reçete arşivinden öğrenciye gönderim."
    >
      <div className="tr-wizard-steps tr-no-print">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className={`tr-wizard-step ${step === n ? "tr-wizard-step--active" : step > n ? "tr-wizard-step--done" : ""}`}
          >
            Adım {n}
            {n === 1 ? " · Kaynak" : n === 2 ? " · Öğrenci" : " · Onay"}
          </div>
        ))}
      </div>

      {step === 1 ? (
        <TrPanel className="space-y-4">
          <p className="text-sm font-semibold text-slate-900">Kaynak seçin</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              className={`rounded-xl border p-4 text-left ${source === "design" ? "border-slate-900 bg-slate-50" : "border-slate-200"}`}
              onClick={() => setSource("design")}
            >
              <p className="font-semibold text-slate-900">Sıfırdan tasarla</p>
              <p className="mt-1 text-xs text-slate-500">Test Oluşturucu (fasikül modu)</p>
            </button>
            <button
              type="button"
              className={`rounded-xl border p-4 text-left ${source === "depo" ? "border-slate-900 bg-slate-50" : "border-slate-200"}`}
              onClick={() => {
                setSource("depo");
                setDepoOpen(true);
              }}
            >
              <p className="font-semibold text-slate-900">Tarama deposundan</p>
              <p className="mt-1 text-xs text-slate-500">
                {selectedTarama ? selectedTarama.name : "Depo picker"}
              </p>
            </button>
            <button
              type="button"
              className={`rounded-xl border p-4 text-left ${source === "recete" ? "border-slate-900 bg-slate-50" : "border-slate-200"}`}
              onClick={() => setSource("recete")}
            >
              <p className="font-semibold text-slate-900">Reçete deposundan</p>
              <p className="mt-1 text-xs text-slate-500">Hata reçetesi arşivi</p>
            </button>
          </div>

          {source === "depo" && selectedTarama ? (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setDepoOpen(true)}>
                Başka tarama seç
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setTaramaEditId(selectedTarama.id);
                  router.push(TEST_MAKER_ROUTES.olusturucu);
                }}
              >
                Düzenle ve gönder
              </Button>
            </div>
          ) : null}

          {source === "recete" ? (
            <TrField label="Reçete">
              <select
                className={trInputClass}
                value={selectedReceteId}
                onChange={(e) => setSelectedReceteId(e.target.value)}
              >
                <option value="">Seçin…</option>
                {recipes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} · {r.questionCount} soru
                  </option>
                ))}
              </select>
            </TrField>
          ) : null}

          <div className="flex justify-end">
            <Button type="button" variant="primary" disabled={!canAdvanceStep1} onClick={() => setStep(2)}>
              Devam
            </Button>
          </div>
        </TrPanel>
      ) : null}

      {step === 2 ? (
        <TrPanel className="space-y-4">
          <TrField label="Öğrenci (zorunlu)">
            <select
              className={trInputClass}
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            >
              <option value="">Seçin…</option>
              {students.map((s) => (
                <option key={s.ogrenciId} value={s.ogrenciId}>
                  {s.name}
                  {s.studentCode ? ` (${s.studentCode})` : ""}
                </option>
              ))}
            </select>
          </TrField>
          {source === "design" ? (
            <TrField label="Kapak başlığı">
              <input
                className={trInputClass}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Fasikül başlığı"
              />
            </TrField>
          ) : null}
          {insight ? (
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {insight}
            </p>
          ) : null}
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              Geri
            </Button>
            <Button type="button" variant="primary" disabled={!canAdvanceStep2} onClick={() => setStep(3)}>
              Devam
            </Button>
          </div>
        </TrPanel>
      ) : null}

      {step === 3 ? (
        <TrPanel className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Onay ve gönder</h3>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>
              <strong>Başlık:</strong> {summary.title || title || "—"}
            </li>
            <li>
              <strong>Soru:</strong> {summary.count || "—"}
            </li>
            <li>
              <strong>Cevap anahtarı:</strong>{" "}
              {summary.key
                ? `${summary.key.replace(/\s/g, "").length}/${summary.count || summary.key.length} dolu`
                : source === "design"
                  ? "Test Maker'da tamamlanacak"
                  : "—"}
            </li>
          </ul>
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setStep(2)}>
              Geri
            </Button>
            <Button type="button" variant="primary" onClick={handleSend}>
              {source === "design" ? "Test Maker'a git" : "Öğrenciye gönder"}
            </Button>
          </div>
        </TrPanel>
      ) : null}

      <p className="text-xs text-slate-500">
        Reçete arşivi:{" "}
        <Link href={HATA_RECETESI_ROUTES.receteDeposu} className="underline">
          Reçete Deposu
        </Link>
      </p>

      <TaramaDepoPickerModal
        open={depoOpen}
        onOpenChange={setDepoOpen}
        onSelect={(rec) => {
          setSelectedTarama(rec);
          setSource("depo");
        }}
      />
    </TrShell>
  );
}
