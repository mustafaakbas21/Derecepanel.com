import {
  HAM_BY_TUR,
  type YksHamProfile,
  type YksPuanTuru,
} from "@/lib/scoring/yks-2025-coefficients";
import { obpContribution, roundTo } from "@/lib/scoring/score-calculator";

/** Netler: row id → net (boş satır 0) */
export type RowNetMap = Record<string, number>;

export function computeHamFromProfile(
  profile: YksHamProfile,
  nets: RowNetMap
): number {
  let sum = profile.base;
  for (const [rowId, coeff] of Object.entries(profile.coeffs)) {
    sum += (nets[rowId] ?? 0) * coeff;
  }
  return roundTo(sum, 3);
}

export function computeHamForTur(tur: YksPuanTuru, nets: RowNetMap): number {
  return computeHamFromProfile(HAM_BY_TUR[tur], nets);
}

/** Yerleştirme puanı = ham + OBP (ÖSYM; 0,4/0,6 karışımı değil) */
export function computePlacementFromHam(
  ham: number,
  diplomaNotu: number,
  yerlesenHalf: boolean
): { ham: number; obp: number; placement: number } {
  const obp = obpContribution(diplomaNotu, yerlesenHalf);
  const placement = roundTo(ham + obp, 3);
  return { ham: roundTo(ham, 3), obp: roundTo(obp, 3), placement };
}
