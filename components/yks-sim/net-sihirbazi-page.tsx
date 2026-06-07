"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GraduationCap, Loader2, RefreshCw, Target, TrendingUp } from "lucide-react";
import { toast } from "@/lib/notify";

import { AtlasSinglePicker } from "@/components/yks-sim/atlas-single-picker";
import {
  NetSihirbaziBranchRow,
  shortRadarLabel,
} from "@/components/yks-sim/net-sihirbazi-branch-row";
import { YksSimShell } from "@/components/yks-sim/yks-sim-shell";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LIBRARY_PANEL_CLASS } from "@/components/library/library-shell";
import { YKS_SIM_ROUTES } from "@/lib/coach/yks-sim-nav-config";
import { STUDENT_ROUTES } from "@/lib/student/sidebar-nav-config";
import {
  fetchAtlasMeta,
  fetchAtlasProgram,
  fetchAtlasPrograms,
  fetchAtlasUniversities,
} from "@/lib/yks-sim/fetch-atlas";
import { obpContribution, parseTaban, formatNsNet, type BranchSpecItem, type NetBand } from "@/lib/yks-sim/net-resolve";
import {
  computeNsBranchNetsFromRecord,
  formatGoalLabelFromTarget,
  getCurrentUser,
  getLastExamRecord,
  readStudentTargetForUser,
} from "@/lib/yks-sim/student-sim-bridge";
import type { NsBranchId } from "@/lib/yks-sim/types";
import { bursLabelFromEkBilgi } from "@/lib/yks-sim/atlas-program-display";
import { bursDisplayLabel, type YokAtlasProgramEnriched } from "@/lib/yks-sim/atlas-enrich";
import type { YokAtlasProgram } from "@/lib/universities/types";
import { cn } from "@/lib/utils";

const NetRadarChart = dynamic(
  () => import("@/components/yks-sim/net-radar-chart").then((m) => m.NetRadarChart),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[300px] items-center justify-center rounded-xl bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    ),
  }
);

type Props = { mode?: "coach" | "student" };

function programOptionLabel(p: YokAtlasProgram): string {
  const sub = (p.Fakulte_YO || "").trim();
  const bolum = p.Bolum || "—";
  return sub ? `${bolum} · ${sub}` : bolum;
}

export function NetSihirbaziPage({ mode = "coach" }: Props) {
  const [cities, setCities] = useState<string[]>([]);
  const [puanTipleri, setPuanTipleri] = useState<string[]>([]);
  const [universities, setUniversities] = useState<string[]>([]);
  const [programsForUni, setProgramsForUni] = useState<YokAtlasProgram[]>([]);
  const [city, setCity] = useState("");
  const [puanTipi, setPuanTipi] = useState("");
  const [selectedUni, setSelectedUni] = useState("");
  const [selectedProgram, setSelectedProgram] = useState<YokAtlasProgram | null>(null);
  const [spec, setSpec] = useState<BranchSpecItem[]>([]);
  const [placedNets, setPlacedNets] = useState<Partial<Record<NsBranchId, number>>>({});
  const [bands, setBands] = useState<Partial<Record<NsBranchId, NetBand>>>({});
  const [netSource, setNetSource] = useState<"json" | "model" | "">("");
  const [studentNets, setStudentNets] = useState<Partial<Record<NsBranchId, string>>>({});
  const [obp, setObp] = useState(85);
  const [targetLabel, setTargetLabel] = useState("");
  const [hasTarget, setHasTarget] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uniLoading, setUniLoading] = useState(false);
  const [programsLoading, setProgramsLoading] = useState(false);
  const [cardLoading, setCardLoading] = useState(false);

  const tercihHref =
    mode === "student" ? STUDENT_ROUTES.hedefler : YKS_SIM_ROUTES.tercih;

  useEffect(() => {
    const u = getCurrentUser();
    const t = readStudentTargetForUser(u);
    const label = formatGoalLabelFromTarget(t);
    setTargetLabel(label || "");
    setHasTarget(!!label);

    fetchAtlasMeta("lisans")
      .then((meta) => {
        setCities(meta.cities ?? []);
        setPuanTipleri(meta.puanTipleri ?? []);
      })
      .catch(() => toast.error("Atlas yüklenemedi"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading) return;
    setUniLoading(true);
    setSelectedUni("");
    setSelectedProgram(null);
    setSpec([]);
    setProgramsForUni([]);

    fetchAtlasUniversities({
      level: "lisans",
      sehir: city || undefined,
      puanTipi: puanTipi || undefined,
    })
      .then((data) => setUniversities(data.universities ?? []))
      .catch(() => {
        setUniversities([]);
        toast.error("Üniversite listesi yüklenemedi");
      })
      .finally(() => setUniLoading(false));
  }, [loading, city, puanTipi]);

  useEffect(() => {
    if (!selectedUni) {
      setProgramsForUni([]);
      return;
    }
    setProgramsLoading(true);
    setSelectedProgram(null);
    setSpec([]);

    fetchAtlasPrograms({
      level: "lisans",
      sehir: city || undefined,
      puanTipi: puanTipi || undefined,
      universite: selectedUni,
      limit: 500,
    })
      .then((data) => setProgramsForUni(data.programs ?? []))
      .catch(() => {
        setProgramsForUni([]);
        toast.error("Program listesi yüklenemedi");
      })
      .finally(() => setProgramsLoading(false));
  }, [selectedUni, city, puanTipi]);

  const fillFromLastExam = useCallback((branchIds: NsBranchId[]) => {
    const u = getCurrentUser();
    const last = getLastExamRecord(u);
    if (!last) return false;
    const auto = computeNsBranchNetsFromRecord(last);
    setStudentNets((prev) => {
      const next = { ...prev };
      for (const id of branchIds) {
        if (auto[id] != null) next[id] = String(auto[id]);
      }
      return next;
    });
    return true;
  }, []);

  const loadProgram = async (prog: YokAtlasProgram) => {
    setCardLoading(true);
    setSelectedProgram(prog);
    try {
      const detail = await fetchAtlasProgram(prog.Program_Kodu);
      setSpec(detail.spec);
      setPlacedNets(detail.nets);
      setBands(detail.bands);
      setNetSource(detail.source);
      fillFromLastExam(detail.spec.map((s) => s.id));
    } catch {
      toast.error("Program netleri yüklenemedi");
      setSelectedProgram(null);
    } finally {
      setCardLoading(false);
    }
  };

  useEffect(() => {
    if (programsForUni.length === 1 && selectedUni && !programsLoading) {
      void loadProgram(programsForUni[0]!);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tek program otomatik seç
  }, [programsForUni, selectedUni, programsLoading]);

  const radarData = useMemo(() => {
    return spec.map((br) => ({
      subject: shortRadarLabel(br.id, br.label),
      yerlesen: placedNets[br.id] ?? 0,
      ogrenci:
        studentNets[br.id] != null && studentNets[br.id] !== ""
          ? Number(studentNets[br.id])
          : 0,
    }));
  }, [spec, placedNets, studentNets]);

  const placedTotal = useMemo(() => {
    if (!spec.length) return null;
    let sum = 0;
    let count = 0;
    for (const br of spec) {
      const v = placedNets[br.id];
      if (v == null || !Number.isFinite(v)) continue;
      sum += v;
      count += 1;
    }
    return count > 0 ? Math.round(sum * 10) / 10 : null;
  }, [spec, placedNets]);

  const diagnosis = useMemo(() => {
    if (!spec.length) return { total: null as number | null, worst: "" };
    let totalDef = 0;
    let worstLabel = "";
    let worstAmt = -1;
    let anyInput = false;
    for (const br of spec) {
      const raw = studentNets[br.id];
      if (raw == null || raw === "") continue;
      anyInput = true;
      const st = Number(raw);
      if (!Number.isFinite(st)) continue;
      const mid = placedNets[br.id];
      if (mid == null || !Number.isFinite(mid)) continue;
      const def = Math.max(0, mid - st);
      totalDef += def;
      if (def > worstAmt) {
        worstAmt = def;
        worstLabel = br.label;
      }
    }
    if (!anyInput) return { total: null, worst: "" };
    return { total: Math.round(totalDef * 10) / 10, worst: worstAmt > 0 ? worstLabel : "" };
  }, [spec, placedNets, studentNets]);

  const obpPts = obpContribution(obp);
  const tabanVal = selectedProgram ? parseTaban(selectedProgram.Taban_Puani_Guncel) : null;
  const hamNeed = tabanVal != null ? Math.round((tabanVal - obpPts) * 10) / 10 : null;

  const uniOptions = useMemo(
    () => (universities ?? []).map((u) => ({ value: u, label: u })),
    [universities]
  );

  const cityOptions = useMemo(
    () => [
      { value: "", label: "Tüm şehirler" },
      ...(cities ?? []).map((c) => ({ value: c, label: c })),
    ],
    [cities]
  );

  const programOptions = useMemo(
    () =>
      (programsForUni ?? []).map((p) => {
        const enriched = p as YokAtlasProgramEnriched;
        const burs =
          bursLabelFromEkBilgi(p) ?? bursDisplayLabel(enriched.bursTuru || "Burssuz");
        return {
          value: p.Program_Kodu,
          label: programOptionLabel(p),
          meta: [p.Puan_Tipi, burs].filter(Boolean).join(" · "),
        };
      }),
    [programsForUni]
  );

  const resetFilters = () => {
    setCity("");
    setPuanTipi("");
    setSelectedUni("");
    setSelectedProgram(null);
    setSpec([]);
    setProgramsForUni([]);
    setStudentNets({});
  };

  return (
    <YksSimShell
      mode={mode}
      title="Net Sihirbazı"
      subtitle="Hedef programa göre yerleşen net bandı — son deneme netlerinle karşılaştır."
    >
      {/* Hedef kartı */}
      {hasTarget ? (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <Target className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-800">
              Kariyer hedefin
            </p>
            <p className="mt-0.5 font-semibold leading-snug text-emerald-950">{targetLabel}</p>
            <Button variant="ghost" className="mt-1 h-auto p-0 text-xs text-emerald-800" asChild>
              <Link href={tercihHref}>
                {mode === "student" ? "Hedeflerim'de değiştir" : "Tercih Sihirbazında değiştir"}
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-600">
            <GraduationCap className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-800">Henüz hedef program yok</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
              {mode === "student"
                ? "Hedeflerim sayfasından üniversite ve bölüm seçebilirsiniz."
                : "Tercih Sihirbazından «Tercih listesine ekle» ile program seçebilirsiniz."}
            </p>
            <Button variant="outline" size="sm" className="mt-2" asChild>
              <Link href={tercihHref}>
                {mode === "student" ? "Hedeflerime git" : "Tercih Sihirbazına git"}
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Program seçimi */}
      <section className={cn(LIBRARY_PANEL_CLASS, "overflow-visible p-4 sm:p-5")}>
        <h2 className="text-sm font-bold text-slate-900">Program seç</h2>
        <p className="mt-1 text-xs text-slate-500">
          Lisans YÖK Atlas — önce filtreleyin, üniversite ve bölüm seçin.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <AtlasSinglePicker
            label="Şehir"
            options={cityOptions}
            value={city}
            onChange={setCity}
            placeholder="Tüm şehirler"
            disabled={loading}
            loading={loading}
            emptyHint="Şehir bulunamadı"
          />

          <Select value={puanTipi || "all"} onValueChange={(v) => setPuanTipi(v === "all" ? "" : v)}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Puan tipi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm puanlar</SelectItem>
              {puanTipleri.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <AtlasSinglePicker
            label="Üniversite"
            options={uniOptions}
            value={selectedUni}
            onChange={(u) => {
              setSelectedUni(u);
              setSelectedProgram(null);
              setSpec([]);
            }}
            placeholder="Üniversite seçin veya arayın…"
            disabled={uniLoading || (universities?.length ?? 0) === 0}
            loading={uniLoading}
            emptyHint={
              uniLoading
                ? "Üniversiteler yükleniyor…"
                : "Filtreye uygun üniversite yok"
            }
          />

          <AtlasSinglePicker
            label="Program"
            options={programOptions}
            value={selectedProgram?.Program_Kodu ?? ""}
            onChange={(code) => {
              const prog = programsForUni.find((p) => p.Program_Kodu === code);
              if (prog) void loadProgram(prog);
            }}
            placeholder={
              !selectedUni
                ? "Önce üniversite seçin"
                : programsLoading
                  ? "Programlar yükleniyor…"
                  : "Bölüm / program seçin veya arayın…"
            }
            disabled={!selectedUni || programsLoading || programsForUni.length === 0}
            loading={programsLoading}
            emptyHint={
              !selectedUni
                ? "Önce üniversite seçin"
                : programsLoading
                  ? "Programlar yükleniyor…"
                  : "Bu üniversitede program bulunamadı"
            }
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            {loading || uniLoading ? (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Güncelleniyor…
              </span>
            ) : (
              <>
                <strong className="text-slate-700">{universities?.length ?? 0}</strong> üniversite
                {selectedUni && programsForUni.length > 0 && (
                  <>
                    {" "}
                    · <strong className="text-slate-700">{programsForUni.length}</strong> program
                  </>
                )}
              </>
            )}
          </span>
          <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={resetFilters}>
            Filtreleri sıfırla
          </Button>
        </div>
      </section>

      {/* Sonuç alanı */}
      {!selectedProgram && !cardLoading && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-14 text-center">
          <TrendingUp className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 font-medium text-slate-800">Program seçin</p>
          <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-slate-500">
            Üniversite ve bölüm seçildiğinde yerleşen ortalama net bantları, radar grafiği ve
            teşhis burada görünür.
          </p>
        </div>
      )}

      {cardLoading && (
        <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      )}

      {selectedProgram && !cardLoading && spec.length > 0 && (
        <div className="space-y-6">
          {/* Program özeti */}
          <section className={cn(LIBRARY_PANEL_CLASS, "p-4 sm:p-5")}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  {selectedProgram.Universite} · {selectedProgram.Sehir}
                </p>
                <h2 className="mt-1 text-lg font-bold leading-snug text-slate-900">
                  {selectedProgram.Bolum}
                </h2>
                {selectedProgram.Fakulte_YO ? (
                  <p className="mt-0.5 text-sm text-slate-600">{selectedProgram.Fakulte_YO}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-800">
                  {selectedProgram.Puan_Tipi}
                </span>
                <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  {bursLabelFromEkBilgi(selectedProgram) ??
                    bursDisplayLabel(
                      (selectedProgram as YokAtlasProgramEnriched).bursTuru || "Burssuz"
                    )}
                </span>
                <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  Taban: {selectedProgram.Taban_Puani_Guncel ?? "—"}
                </span>
                <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  Sıra: {selectedProgram.Basari_Sirasi_Guncel ?? "—"}
                </span>
                {netSource && (
                  <span
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-semibold",
                      netSource === "json"
                        ? "bg-emerald-100 text-emerald-900"
                        : "bg-amber-100 text-amber-950"
                    )}
                  >
                    {netSource === "json" ? "Atlas (gerçek net)" : "Model tahmini"}
                  </span>
                )}
              </div>
            </div>
            {netSource === "model" ? (
              <p className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50/70 px-3 py-2.5 text-xs leading-relaxed text-amber-950">
                Bu programda YÖK Atlas branş neti yok. Gösterilen değerler aynı puan tipindeki taban
                sırasına göre üretilen referans netlerdir; kesin yerleşen ortalaması değildir.
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {placedTotal != null ? (
                <div className="rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Toplam referans net
                  </p>
                  <p className="text-lg font-bold tabular-nums text-slate-900">
                    {formatNsNet(placedTotal)}
                  </p>
                </div>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!fillFromLastExam(spec.map((s) => s.id))) {
                    toast.error("Birleşik deneme sonucu bulunamadı");
                    return;
                  }
                  toast.success("Son denemeden netler yüklendi");
                }}
              >
                <RefreshCw className="h-4 w-4" />
                Son denemeden doldur
              </Button>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            {/* Branş listesi */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Branş karşılaştırması</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {netSource === "json"
                    ? "YÖK Atlas yerleşen ortalama netler — son deneme netlerinle karşılaştır"
                    : "Referans netler — son deneme netlerinle karşılaştır"}
                </p>
              </div>
              <div className="space-y-2">
                {spec.map((br) => (
                  <NetSihirbaziBranchRow
                    key={br.id}
                    branch={br}
                    band={bands[br.id]}
                    placedMid={placedNets[br.id] ?? bands[br.id]?.mid ?? 0}
                    netSource={netSource}
                    studentValue={studentNets[br.id] ?? ""}
                    onStudentChange={(v) =>
                      setStudentNets((prev) => ({ ...prev, [br.id]: v }))
                    }
                  />
                ))}
              </div>
            </div>

            {/* Sağ panel — OBP, radar, teşhis (ayrı kartlar, sıkışık değil) */}
            <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
              <section className={cn(LIBRARY_PANEL_CLASS, "p-4 sm:p-5")}>
                <h3 className="text-sm font-bold text-slate-900">OBP & ham puan</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Diploma notu × 5 × 0,12 — taban puanından OBP düşülür.
                </p>
                <label className="mt-4 block text-xs font-semibold text-slate-600">
                  OBP notu: <span className="text-slate-900">{obp}</span>
                  <span className="font-normal text-slate-500">
                    {" "}
                    (+{obpPts.toFixed(1)} puan)
                  </span>
                </label>
                <input
                  type="range"
                  min={50}
                  max={100}
                  value={obp}
                  onChange={(e) => setObp(Number(e.target.value))}
                  className="mt-2 w-full accent-slate-900"
                />
                <p className="mt-3 text-sm leading-relaxed text-slate-800">
                  {hamNeed != null ? (
                    <>
                      Tahmini <strong>ham puan ihtiyacı:</strong>{" "}
                      <span className="font-bold tabular-nums">{hamNeed}</span>
                      <span className="block text-xs text-slate-500 mt-1">
                        (taban − OBP etkisi)
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-500">Taban puanı yok</span>
                  )}
                </p>
              </section>

              <section className={cn(LIBRARY_PANEL_CLASS, "overflow-hidden p-4 sm:p-5")}>
                <h3 className="text-sm font-bold text-slate-900">Yetkinlik radarı</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {netSource === "json" ? "Yerleşen ortalama" : "Referans net"} vs senin netin
                </p>
                <div className="mt-4 -mx-1">
                  <NetRadarChart data={radarData} />
                </div>
              </section>

              <section
                className={cn(
                  LIBRARY_PANEL_CLASS,
                  "p-4 sm:p-5",
                  diagnosis.total != null && diagnosis.total > 0
                    ? "border-amber-200/80 bg-amber-50/50"
                    : ""
                )}
              >
                <h3 className="text-sm font-bold text-slate-900">Teşhis</h3>
                <div className="mt-2 space-y-2 text-sm leading-relaxed text-slate-700">
                  {diagnosis.total == null ? (
                    <p>
                      «Senin netin» alanlarını doldurun; toplam eksik net ve en zayıf branş burada
                      özetlenir.
                    </p>
                  ) : diagnosis.total <= 0 ? (
                    <p className="text-emerald-800">
                      Girdiğiniz netler yerleşen referansa uygun veya üzerinde görünüyor.
                    </p>
                  ) : (
                    <>
                      <p>
                        Hedefe yaklaşmak için yaklaşık{" "}
                        <strong className="text-slate-900">{diagnosis.total} net</strong> daha
                        artırmanız önerilir.
                      </p>
                      {diagnosis.worst ? (
                        <p className="rounded-lg bg-white/80 px-3 py-2 text-xs">
                          Öncelik: <strong>{diagnosis.worst}</strong>
                        </p>
                      ) : null}
                    </>
                  )}
                </div>
              </section>
            </aside>
          </div>
        </div>
      )}
    </YksSimShell>
  );
}
