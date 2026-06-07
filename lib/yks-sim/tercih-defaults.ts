import { normPuanTip } from "@/lib/yks-sim/atlas-enrich";

/** Tercih sihirbazı açılışında seçili (TYT hariç lisans puan türleri) */
export const TERCIH_DEFAULT_PUAN_TYPES = ["SAY", "EA", "SÖZ", "DİL"] as const;

const PUAN_CHIP_ORDER = ["SAY", "EA", "SÖZ", "DİL", "TYT"] as const;

export function orderPuanTypesForTercih(types: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const key of PUAN_CHIP_ORDER) {
    const match = types.find((t) => normPuanTip(t) === normPuanTip(key));
    if (match && !seen.has(normPuanTip(match))) {
      seen.add(normPuanTip(match));
      out.push(match);
    }
  }
  for (const t of types) {
    const k = normPuanTip(t);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(t);
    }
  }
  return out;
}

/** Meta listesinden varsayılan seçim: SAY + EA + SÖZ + DİL (TYT kapalı) */
export function pickDefaultPuanTypes(metaTypes: string[]): string[] {
  const want = new Set(TERCIH_DEFAULT_PUAN_TYPES.map((p) => normPuanTip(p)));
  const picked = metaTypes.filter((t) => want.has(normPuanTip(t)));
  if (picked.length) return orderPuanTypesForTercih(picked);
  return orderPuanTypesForTercih(metaTypes.filter((t) => normPuanTip(t) !== "TYT"));
}

export function isPuanTypeSelected(selected: string[], option: string): boolean {
  const k = normPuanTip(option);
  return selected.some((s) => normPuanTip(s) === k);
}

export function togglePuanTypeSelection(selected: string[], option: string): string[] {
  const k = normPuanTip(option);
  const has = selected.some((s) => normPuanTip(s) === k);
  if (has) return selected.filter((s) => normPuanTip(s) !== k);
  const without = selected.filter((s) => normPuanTip(s) !== k);
  return [...without, option];
}
