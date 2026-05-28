import type { FascicleAssignment } from "@/lib/test-maker/types";

function key(id: string) {
  return `assigned_fascicles_${id}`;
}

export function readAssigned(ogrenciId: string): FascicleAssignment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key(ogrenciId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendAssigned(
  ogrenciId: string,
  data: Omit<FascicleAssignment, "id" | "assignedAt" | "status" | "source"> &
    Partial<Pick<FascicleAssignment, "id">>
) {
  const list = readAssigned(ogrenciId);
  const rec: FascicleAssignment = {
    id: data.id ?? `fasc-${Date.now().toString(36)}`,
    title: data.title,
    questionCount: data.questionCount,
    answerKey: data.answerKey,
    template: data.template,
    studentCode: data.studentCode,
    source: "test_maker_send",
    assignedAt: new Date().toISOString(),
    status: "bekliyor",
    pdf_file_id: data.pdf_file_id,
  };
  list.push(rec);
  localStorage.setItem(key(ogrenciId), JSON.stringify(list));
  return rec;
}

export function readLastResultInsight(ogrenciId: string): string | null {
  if (!ogrenciId || typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`fascicle_results_${ogrenciId}`);
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
