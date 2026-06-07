import { normPuanTip } from "@/lib/yks-sim/atlas-enrich";
import type { YokAtlasProgramEnriched } from "@/lib/yks-sim/atlas-enrich";
import type { NsBranchId } from "@/lib/yks-sim/types";
import type { YokAtlasProgram } from "@/lib/universities/types";

export type BranchSpecItem = {
  id: NsBranchId;
  label: string;
  max: number;
};

export type NetBand = { mid: number; lo: number; hi: number };

export type ResolveNetsResult = {
  nets: Partial<Record<NsBranchId, number>>;
  bands: Partial<Record<NsBranchId, NetBand>>;
  source: "json" | "model";
  spec: BranchSpecItem[];
};

function round1(x: number): number {
  return Math.round(x * 10) / 10;
}

/** Branş net gösterimi — tablo, kart ve radar etiketlerinde ortak */
export function formatNsNet(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function roundInt(x: number): number {
  return Math.round(x);
}

export function parseTaban(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = parseFloat(String(v).replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function getBranchSpec(puanTipi: string): BranchSpecItem[] {
  const t = normPuanTip(puanTipi);
  const tyt: BranchSpecItem[] = [
    { id: "tyt_tr", label: "TYT Türkçe", max: 40 },
    { id: "tyt_mat", label: "TYT Matematik", max: 40 },
    { id: "tyt_fen", label: "TYT Fen Bilimleri", max: 20 },
    { id: "tyt_sos", label: "TYT Sosyal Bilimler", max: 20 },
  ];
  if (t === "SAY") {
    return tyt.concat([
      { id: "ayt_mat", label: "AYT Matematik", max: 40 },
      { id: "ayt_fiz", label: "AYT Fizik", max: 14 },
      { id: "ayt_kim", label: "AYT Kimya", max: 13 },
      { id: "ayt_bio", label: "AYT Biyoloji", max: 13 },
    ]);
  }
  if (t === "SOZ") {
    return tyt.concat([
      { id: "ayt_edb", label: "AYT Türk Dili ve Edebiyatı", max: 24 },
      { id: "ayt_tar1", label: "AYT Tarih-1", max: 10 },
      { id: "ayt_cog1", label: "AYT Coğrafya-1", max: 6 },
      { id: "ayt_tar2", label: "AYT Tarih-2", max: 11 },
    ]);
  }
  if (t === "EA") {
    return tyt.concat([
      { id: "ayt_mat", label: "AYT Matematik", max: 40 },
      { id: "ayt_edb", label: "AYT Türk Dili ve Edebiyatı", max: 24 },
      { id: "ayt_tar1", label: "AYT Tarih-1", max: 10 },
      { id: "ayt_cog1", label: "AYT Coğrafya-1", max: 6 },
    ]);
  }
  if (t === "DIL" || t === "DİL") {
    return tyt.concat([
      { id: "ayt_dil", label: "AYT Dil", max: 80 },
      { id: "ayt_edb", label: "AYT Edebiyat-Sosyal-1", max: 24 },
      { id: "ayt_tar1", label: "AYT Tarih-1", max: 10 },
      { id: "ayt_cog1", label: "AYT Coğrafya-1", max: 6 },
    ]);
  }
  return getBranchSpec("SAY");
}

export function netBand(
  mid: number,
  maxNet: number,
  sourceType: "json" | "model"
): NetBand {
  const m = round1(Math.min(maxNet, Math.max(0, mid)));
  const isModel = sourceType === "model";
  const half = isModel
    ? Math.max(2, Math.min(3.5, maxNet * 0.085))
    : Math.max(1, Math.min(2.4, maxNet * 0.06));
  let lo = roundInt(Math.max(0, m - half));
  let hi = roundInt(Math.min(maxNet, m + half));
  if (hi - lo < 2 && maxNet >= 2) {
    lo = roundInt(Math.max(0, lo - 1));
    hi = roundInt(Math.min(maxNet, hi + 1));
  }
  if (hi < lo) hi = lo;
  return { mid: m, lo, hi };
}

function normKey(s: string): string {
  return normPuanTip(String(s || "")).replace(/[^A-Z0-9]/g, "");
}

type AtlasRowWithNets = YokAtlasProgram & {
  ortalama_netler?: Record<string, number | string>;
  Yerlesen_Ortalama_Netleri?: Record<string, number | string>;
  yerlesen_ortalama_netleri?: Record<string, number | string>;
  [key: string]: unknown;
};

export function extractDeclaredNets(
  row: AtlasRowWithNets,
  spec: BranchSpecItem[]
): { nets: Partial<Record<NsBranchId, number>>; source: "json" } | null {
  const raw =
    row.ortalama_netler || row.Yerlesen_Ortalama_Netleri || row.yerlesen_ortalama_netleri;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const outObj: Partial<Record<NsBranchId, number>> = {};
    for (const k of Object.keys(raw)) {
      const v = raw[k];
      const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
      if (!Number.isFinite(n)) continue;
      const nk = normKey(k);
      for (const br of spec) {
        const sk = normKey(br.label);
        if (sk.includes(nk) || nk.includes(sk)) {
          outObj[br.id] = round1(Math.min(br.max, Math.max(0, n)));
          break;
        }
      }
    }
    if (Object.keys(outObj).length) return { nets: outObj, source: "json" };
  }

  const outFlat: Partial<Record<NsBranchId, number>> = {};
  for (const br of spec) {
    const candidates = [`Net_${br.id}`, `Ort_${br.id}`, `Ortalama_${br.id}`, `OrtNet_${br.id}`, br.id];
    for (const ck of candidates) {
      if (row[ck] != null && String(row[ck]).trim() !== "") {
        const num = parseFloat(String(row[ck]).replace(",", "."));
        if (Number.isFinite(num)) {
          outFlat[br.id] = round1(Math.min(br.max, Math.max(0, num)));
          break;
        }
      }
    }
  }
  if (Object.keys(outFlat).length) return { nets: outFlat, source: "json" };
  return null;
}

export function syntheticNets(
  row: YokAtlasProgram,
  strength: number,
  spec: BranchSpecItem[]
): { nets: Partial<Record<NsBranchId, number>>; source: "model" } {
  const nets: Partial<Record<NsBranchId, number>> = {};
  const s = Math.max(0, Math.min(1, strength));
  for (let i = 0; i < spec.length; i++) {
    const br = spec[i]!;
    const lo = br.max * (0.28 + i * 0.01);
    const hi = br.max * (0.88 - i * 0.008);
    let v = lo + (hi - lo) * s;
    const seed = (String(row.Program_Kodu || "") + br.id)
      .split("")
      .reduce((a, ch) => a + ch.charCodeAt(0), 0);
    v += ((seed % 17) - 8) * 0.08;
    nets[br.id] = round1(Math.min(br.max, Math.max(0, v)));
  }
  return { nets, source: "model" };
}

export function assignStrengthIndex(allRows: YokAtlasProgramEnriched[]): void {
  const byType: Record<string, YokAtlasProgramEnriched[]> = {};
  for (const r of allRows) {
    const k = r.Puan_Tipi || "—";
    (byType[k] = byType[k] || []).push(r);
  }
  for (const arr of Object.values(byType)) {
    arr.sort((a, b) => {
      const pa = parseTaban(a.Taban_Puani_Guncel);
      const pb = parseTaban(b.Taban_Puani_Guncel);
      if (pa == null && pb == null) return 0;
      if (pa == null) return 1;
      if (pb == null) return -1;
      return pb - pa;
    });
    const n = arr.length;
    for (let j = 0; j < n; j++) {
      arr[j]!._nsStrength = n <= 1 ? 0.5 : 1 - j / (n - 1);
    }
  }
}

function buildBandsFromNets(
  nets: Partial<Record<NsBranchId, number>>,
  spec: BranchSpecItem[],
  sourceType: "json" | "model"
): Partial<Record<NsBranchId, NetBand>> {
  const bands: Partial<Record<NsBranchId, NetBand>> = {};
  for (const br of spec) {
    const v = nets[br.id];
    if (v == null) continue;
    bands[br.id] = netBand(v, br.max, sourceType);
  }
  return bands;
}

export function resolveNets(row: YokAtlasProgramEnriched): ResolveNetsResult {
  const spec = getBranchSpec(row.Puan_Tipi);
  const dec = extractDeclaredNets(row as AtlasRowWithNets, spec);
  let nets: Partial<Record<NsBranchId, number>>;
  let source: "json" | "model";
  if (dec) {
    nets = dec.nets;
    source = dec.source;
  } else {
    const str = row._nsStrength != null ? row._nsStrength : 0.5;
    const syn = syntheticNets(row, str, spec);
    nets = syn.nets;
    source = syn.source;
  }
  const bands = buildBandsFromNets(nets, spec, source);
  return { nets, bands, source, spec };
}

export function obpContribution(obp: number): number {
  const o = Number.isFinite(obp) ? obp : 85;
  return o * 5 * 0.12;
}
