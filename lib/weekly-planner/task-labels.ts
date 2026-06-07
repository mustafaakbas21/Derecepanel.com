import type { GorevTipi } from "@/lib/weekly-planner/types";

export const GOREV_TIPI_LABELS: Record<GorevTipi, string> = {
  konu_calisma: "Konu çalışması",
  soru_cozme: "Soru çözümü",
  deneme_cozme: "Deneme / analiz",
  etut_mola: "Etüt / Mola",
  tekrar: "Tekrar",
  video: "Video",
};

export function formatTaskDetailLine(task: {
  meta: string;
  targetQuestions?: string;
  durationMin?: string;
  resource?: string;
}): string {
  const bits: string[] = [];
  if (task.durationMin) bits.push(`${task.durationMin} dk`);
  if (task.targetQuestions) bits.push(`${task.targetQuestions} soru`);
  if (task.resource) bits.push(task.resource);
  if (bits.length) return bits.join(" · ");
  return task.meta || "—";
}
