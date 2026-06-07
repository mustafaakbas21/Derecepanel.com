"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Eraser, GraduationCap } from "lucide-react";

import { PhRowInput } from "@/components/yks-sim/ph-row-input";
import { YksSimShell } from "@/components/yks-sim/yks-sim-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LIBRARY_PANEL_CLASS } from "@/components/library/library-shell";
import { YKS_SIM_ROUTES, OGRENCI_YKS_SIM_ROUTES } from "@/lib/coach/yks-sim-nav-config";
import { fmtFixed } from "@/lib/scoring/score-calculator";
import {
  createEmptyRowInputs,
  findPhRowById,
  PH_CARDS,
  type PhCard,
} from "@/lib/yks-sim/puan-hesaplama-config";
import {
  clampRowInput,
  computePuanHesaplama,
  fmtRank,
  hamPayloadFromOutputs,
  pickPrimaryTipi,
  PUAN_HESAPLAMA_MODEL_LABEL,
  type OutputLine,
  type RowInput,
  type ScoreOutputs,
} from "@/lib/yks-sim/puan-hesaplama-engine";
import { saveTercihFromPuanPayload } from "@/lib/yks-sim/tercih-bridge";
import { cn } from "@/lib/utils";

type Props = { mode?: "coach" | "student" };

const OUTPUT_KEYS = ["TYT", "SAY", "EA", "SÖZ", "DİL"] as const;

function PhCardBlock({
  card,
  rows,
  rowNets,
  onRowChange,
}: {
  card: PhCard;
  rows: Record<string, RowInput>;
  rowNets: ScoreOutputs["rowNets"];
  onRowChange: (id: string, next: RowInput) => void;
}) {
  return (
    <section className={cn(LIBRARY_PANEL_CLASS, "overflow-hidden")}>
      <header className="flex items-start justify-between gap-2 border-b border-slate-100 px-4 py-3 sm:px-5">
        <h2 className="text-base font-bold text-slate-900">{card.title}</h2>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
          {card.badge}
        </span>
      </header>
      <div className="px-3 sm:px-4">
        {card.rows.map((row) => (
          <PhRowInput
            key={row.id}
            row={row}
            value={rows[row.id] ?? { d: "", y: "" }}
            net={rowNets[row.id] ?? { has: false, net: 0, invalid: false }}
            onChange={(next) => onRowChange(row.id, next)}
          />
        ))}
      </div>
    </section>
  );
}

function OutputBox({
  label,
  line,
  highlight,
}: {
  label: string;
  line: OutputLine;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2.5",
        highlight ? "border-slate-900/20 bg-slate-900/5" : "border-slate-200 bg-slate-50/80"
      )}
    >
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      {line.rank != null ? (
        <p className="mt-0.5 text-2xl font-bold tabular-nums tracking-tight text-indigo-700">
          {fmtRank(line.rank)}
        </p>
      ) : (
        <p className="mt-0.5 text-2xl font-bold tabular-nums tracking-tight text-slate-300">—</p>
      )}
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        Tahmini sıra
      </p>
      <p className="mt-2 text-lg font-bold tabular-nums text-slate-900">
        {line.value != null ? fmtFixed(line.value) : "—"}
        <span className="ml-1.5 text-xs font-semibold text-slate-500">puan</span>
      </p>
      <p className="mt-1 text-[11px] leading-snug text-slate-500">{line.sub}</p>
    </div>
  );
}

export function PuanHesaplamaPage({ mode = "coach" }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState(createEmptyRowInputs);
  const [diploma, setDiploma] = useState("80");
  const [yerlesenHalf, setYerlesenHalf] = useState(false);

  const outputs = useMemo(
    () => computePuanHesaplama({ rows, diploma, yerlesenHalf }),
    [rows, diploma, yerlesenHalf]
  );

  const primaryTip = useMemo(() => pickPrimaryTipi(outputs.yer), [outputs.yer]);

  const setRow = (id: string, next: RowInput) => {
    const rowDef = findPhRowById(id);
    const clamped = rowDef ? clampRowInput(next, rowDef.maxQ) : next;
    setRows((prev) => ({ ...prev, [id]: clamped }));
  };

  const clearAll = () => {
    setRows(createEmptyRowInputs());
    setDiploma("");
    setYerlesenHalf(false);
  };

  const goTercih = () => {
    saveTercihFromPuanPayload({
      primaryPuanTipi: primaryTip,
      obpContribution: outputs.obp,
      puanlar: {
        TYT: outputs.yer.TYT,
        SAY: outputs.yer.SAY,
        EA: outputs.yer.EA,
        SÖZ: outputs.yer.SÖZ,
        DİL: outputs.yer.DİL,
      },
      ham: hamPayloadFromOutputs(outputs),
    });
    const href =
      mode === "student" ? OGRENCI_YKS_SIM_ROUTES.tercih : YKS_SIM_ROUTES.tercih;
    router.push(href);
  };

  const netHref = mode === "student" ? OGRENCI_YKS_SIM_ROUTES.net : YKS_SIM_ROUTES.net;

  return (
    <YksSimShell
      mode={mode}
      title="Puan Hesaplama"
      subtitle={`${PUAN_HESAPLAMA_MODEL_LABEL}: 100 taban + 0,40×TYT + 0,60×AYT/YDT + OBP (MEB OGM Materyal ile aynı model). Sıralar tahmini eğridir.`}
    >
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={clearAll}>
          <Eraser className="h-4 w-4" />
          Netleri temizle
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Sol: giriş kartları */}
        <div className="space-y-4">
          <section className={cn(LIBRARY_PANEL_CLASS, "p-4 sm:p-5")}>
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <GraduationCap className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">OBP (Okul Puanı)</h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Diploma notu × 5 × 0,12
                    {yerlesenHalf ? " · önceki yıl yerleşen (×0,5)" : ""}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="ph-obp" className="text-xs">
                      Diploma notu (0–100)
                    </Label>
                    <Input
                      id="ph-obp"
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      value={diploma}
                      onChange={(e) => setDiploma(e.target.value)}
                      className="mt-1 h-10"
                    />
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={yerlesenHalf}
                        onChange={(e) => setYerlesenHalf(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      Önceki yıl yerleştim (OBP ×0,5)
                    </label>
                  </div>
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  OBP katkısı: +{fmtFixed(outputs.obp)}
                </p>
              </div>
            </div>
          </section>

          <PhCardBlock
            card={PH_CARDS.tyt}
            rows={rows}
            rowNets={outputs.rowNets}
            onRowChange={setRow}
          />

          <PhCardBlock
            card={PH_CARDS.say}
            rows={rows}
            rowNets={outputs.rowNets}
            onRowChange={setRow}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <PhCardBlock
              card={PH_CARDS.ea}
              rows={rows}
              rowNets={outputs.rowNets}
              onRowChange={setRow}
            />
            <PhCardBlock
              card={PH_CARDS.soz}
              rows={rows}
              rowNets={outputs.rowNets}
              onRowChange={setRow}
            />
          </div>

          <PhCardBlock
            card={PH_CARDS.ydt}
            rows={rows}
            rowNets={outputs.rowNets}
            onRowChange={setRow}
          />
        </div>

        {/* Sağ: çıktı paneli */}
        <aside className="xl:sticky xl:top-4 xl:self-start">
          <div className={cn(LIBRARY_PANEL_CLASS, "space-y-4 p-4 sm:p-5")}>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Tahmini sıra & puan</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                TYT: ham + OBP · SAY/EA/SÖZ/DİL: 0,40×TYT + 0,60×alan + OBP.
                Sıralar tahmini eğridir (OGM ile aynı hesap modeli).
              </p>
            </div>

            {outputs.hasInvalidRows ? (
              <p
                className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-medium text-orange-800"
                role="alert"
              >
                Bazı satırlarda doğru+yanlış toplamı soru sayısını aşıyor; hesaplamada üst sınır
                uygulandı.
              </p>
            ) : null}

            <div className="grid gap-2">
              {OUTPUT_KEYS.map((key) => (
                <OutputBox
                  key={key}
                  label={key}
                  line={outputs.lines[key]}
                  highlight={primaryTip === key}
                />
              ))}
            </div>

            {primaryTip && (
              <p className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-700">
                Tercih köprüsü için önerilen puan tipi:{" "}
                <strong className="text-slate-900">{primaryTip}</strong>
              </p>
            )}

            <div className="space-y-2 border-t border-slate-100 pt-4">
              <Button type="button" variant="primary" className="w-full" onClick={goTercih}>
                Bu puanla nereye girebilirim? → Tercih Sihirbazı
              </Button>
              <Button type="button" variant="outline" className="w-full" asChild>
                <Link href={netHref}>Net Sihirbazı</Link>
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </YksSimShell>
  );
}
