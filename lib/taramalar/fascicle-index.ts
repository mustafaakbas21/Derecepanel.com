import { readAssigned } from "@/lib/test-maker/fascicle";
import type { FascicleAssignment } from "@/lib/test-maker/types";
import type { FascicleDepotRow, FascicleResultRecord } from "@/lib/taramalar/types";
import type { StudentRecord } from "@/lib/students/types";

import { panelGetItem, panelRemoveItem, panelSetItem } from "@/lib/panel-store";
function readFascicleResults(ogrenciId: string): FascicleResultRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = panelGetItem(`fascicle_results_${ogrenciId}`);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function fascicleStorageCandidates(student: StudentRecord): string[] {
  const keys = new Set<string>();
  if (student.ogrenciId) keys.add(student.ogrenciId);
  if (student.studentCode) keys.add(student.studentCode);
  return [...keys];
}

function mergeAssignedForStudent(student: StudentRecord): FascicleAssignment[] {
  const seen = new Set<string>();
  const merged: FascicleAssignment[] = [];
  for (const key of fascicleStorageCandidates(student)) {
    for (const item of readAssigned(key)) {
      const dedupe = `${item.id}::${item.assignedAt}`;
      if (seen.has(dedupe)) continue;
      seen.add(dedupe);
      merged.push({ ...item, studentId: student.ogrenciId });
    }
  }
  return merged;
}

function enrichRow(
  student: StudentRecord,
  item: FascicleAssignment
): FascicleDepotRow {
  const results = readFascicleResults(student.ogrenciId);
  const match = results.find((r) => r.fascicleId === item.id) ?? results[results.length - 1];
  const completed = Boolean(match?.accuracyPct != null);
  return {
    fascicleId: item.id,
    title: item.title,
    questionCount: item.questionCount,
    answerKey: item.answerKey,
    template: item.template,
    studentId: student.ogrenciId,
    studentName: student.name,
    studentCode: item.studentCode ?? student.studentCode,
    assignedAt: item.assignedAt,
    status: completed ? "tamamlandi" : item.status ?? "bekliyor",
    source: (item.source as FascicleDepotRow["source"]) ?? "test_maker_send",
    pdf_file_id: item.pdf_file_id,
    depoId: item.depoId,
    accuracyPct: match?.accuracyPct,
    lastResultTitle: match?.title,
  };
}

export function listAllAssignedFascicles(students: StudentRecord[]): FascicleDepotRow[] {
  const rows: FascicleDepotRow[] = [];
  for (const student of students) {
    if (student.status !== "aktif") continue;
    for (const item of mergeAssignedForStudent(student)) {
      rows.push(enrichRow(student, item));
    }
  }
  rows.sort(
    (a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()
  );
  return rows;
}
