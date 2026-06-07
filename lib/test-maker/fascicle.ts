import { dispatchFascicleAssigned } from "@/lib/taramalar/events";
import type { FascicleAssignment, FascicleSource } from "@/lib/test-maker/types";

import { panelGetItem, panelRemoveItem, panelSetItem } from "@/lib/panel-store";
function key(id: string) {
  return `assigned_fascicles_${id}`;
}

export function readAssigned(ogrenciId: string): FascicleAssignment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = panelGetItem(key(ogrenciId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export type AppendFascicleInput = {
  title: string;
  questionCount: number;
  answerKey: string;
  template?: string;
  studentCode?: string;
  pdf_file_id?: string;
  depoId?: string;
  metaName?: string;
  id?: string;
  source?: FascicleSource;
};

export function appendAssigned(ogrenciId: string, data: AppendFascicleInput) {
  const list = readAssigned(ogrenciId);
  const rec: FascicleAssignment = {
    id: data.id ?? `fasc-${Date.now().toString(36)}`,
    title: data.title,
    questionCount: data.questionCount,
    answerKey: data.answerKey,
    template: data.template ?? "",
    studentCode: data.studentCode,
    studentId: ogrenciId,
    source: (data.source as FascicleSource) ?? "test_maker_send",
    assignedAt: new Date().toISOString(),
    status: "bekliyor",
    pdf_file_id: data.pdf_file_id,
    depoId: data.depoId,
    metaName: data.metaName,
  };
  list.push(rec);
  panelSetItem(key(ogrenciId), JSON.stringify(list));
  dispatchFascicleAssigned();
  return rec;
}

export function removeAssigned(ogrenciId: string, fascicleId: string): boolean {
  const list = readAssigned(ogrenciId);
  const next = list.filter((x) => x.id !== fascicleId);
  if (next.length === list.length) return false;
  panelSetItem(key(ogrenciId), JSON.stringify(next));
  dispatchFascicleAssigned();
  return true;
}

export function readLastResultInsight(ogrenciId: string): string | null {
  if (!ogrenciId || typeof window === "undefined") return null;
  try {
    const raw = panelGetItem(`fascicle_results_${ogrenciId}`);
    const list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list) || list.length === 0) return null;
    const last = list[list.length - 1] as { accuracyPct?: number; title?: string };
    if (last.accuracyPct != null) {
      return `Son optik: %${last.accuracyPct}${last.title ? ` · ${last.title}` : ""}`;
    }
    return null;
  } catch {
    return null;
  }
}
