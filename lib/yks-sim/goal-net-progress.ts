import type { BranchSpecItem } from "@/lib/yks-sim/net-resolve";
import type { NsBranchId } from "@/lib/yks-sim/types";

export type BranchNetProgress = {
  id: NsBranchId;
  label: string;
  pct: number;
  remaining: number | null;
  student: number;
  target: number;
};

export type GoalNetProgress = {
  progressPct: number;
  remaining: number;
  branchCount: number;
  branches: BranchNetProgress[];
};

export function computeGoalNetProgress(
  spec: BranchSpecItem[],
  placedNets: Partial<Record<NsBranchId, number>>,
  studentNets: Partial<Record<NsBranchId, number>>
): GoalNetProgress | null {
  if (!spec.length) return null;

  let requiredTotal = 0;
  let achievedCredit = 0;
  let remaining = 0;
  let hasExam = false;
  const branches: BranchNetProgress[] = [];

  for (const br of spec) {
    const st = studentNets[br.id];
    const mid = placedNets[br.id];
    if (st == null || !Number.isFinite(st)) continue;
    if (mid == null || !Number.isFinite(mid)) continue;
    hasExam = true;
    requiredTotal += mid;
    achievedCredit += Math.min(st, mid);
    const def = Math.max(0, mid - st);
    remaining += def;
    branches.push({
      id: br.id,
      label: br.label,
      pct: mid > 0 ? Math.min(100, Math.round((st / mid) * 1000) / 10) : st >= mid ? 100 : 0,
      remaining: def > 0 ? Math.round(def * 10) / 10 : null,
      student: st,
      target: mid,
    });
  }

  if (!hasExam || requiredTotal <= 0) return null;

  return {
    progressPct: Math.min(100, Math.round((achievedCredit / requiredTotal) * 1000) / 10),
    remaining: Math.round(remaining * 10) / 10,
    branchCount: branches.length,
    branches,
  };
}
