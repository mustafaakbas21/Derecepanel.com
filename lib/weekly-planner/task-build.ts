import { getDersById } from "@/lib/mufredat";
import type {
  AiSuggestion,
  GorevTipi,
  TaskAccent,
  WeeklyTask,
} from "@/lib/weekly-planner/types";
import { newTaskId } from "@/lib/weekly-planner/storage";

export function accentFromSubjectName(name: string): TaskAccent {
  const n = name.toLowerCase();
  if (n.includes("türk") || n.includes("paragraf") || n.includes("edeb")) return "turkish";
  if (n.includes("fizik") || n.includes("kimya") || n.includes("biyoloji") || n.includes("fen"))
    return "science";
  if (n.includes("mat")) return "math";
  return "default";
}

export function accentFromTitle(title: string): TaskAccent {
  if (title.includes("Paragraf") || title.includes("Türkçe") || title.includes("Edebiyat"))
    return "turkish";
  if (
    title.includes("Fizik") ||
    title.includes("Kimya") ||
    title.includes("Biyoloji") ||
    title.includes("Fen")
  )
    return "science";
  if (title.includes("Mat")) return "math";
  return "default";
}

export type TaskFormPayload = {
  dayIndex: number;
  dateISO: string;
  taskKind: GorevTipi;
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  conceptNames: string[];
  targetQuestions: string;
  durationMin: string;
  resource: string;
  videoUrl: string;
  coachNote: string;
};

function gorevTipiLabel(kind: GorevTipi): string {
  const m: Record<GorevTipi, string> = {
    konu_calisma: "Konu çalışması",
    soru_cozme: "Soru çözümü",
    deneme_cozme: "Deneme / analiz",
    etut_mola: "Etüt / Mola",
    tekrar: "Tekrar",
    video: "Video",
  };
  return m[kind] || kind;
}

export function buildMetaFromForm(p: TaskFormPayload): string {
  if (p.taskKind === "etut_mola") {
    const bits: string[] = [];
    if (p.durationMin) bits.push(`${p.durationMin} dk`);
    if (p.coachNote) bits.push(p.coachNote.slice(0, 40));
    return bits.length ? bits.join(" · ") : "Etüt / Mola";
  }
  const bits: string[] = [];
  if (p.durationMin) bits.push(`${p.durationMin} dk`);
  if (p.targetQuestions) bits.push(`${p.targetQuestions} soru`);
  if (p.conceptNames.length) bits.push(p.conceptNames.slice(0, 2).join(", "));
  const core = `${gorevTipiLabel(p.taskKind)}`;
  return bits.length ? `${core} · ${bits.join(" · ")}` : core;
}

export function buildTitleFromForm(p: TaskFormPayload): string {
  if (p.taskKind === "etut_mola") {
    return (p.coachNote || "Etüt / Mola").trim().slice(0, 80) || "Etüt / Mola";
  }
  const sub = p.subjectName || getDersById(p.subjectId)?.dersAdi || "";
  const topic = p.topicName || "";
  if (topic && sub) return `${sub} — ${topic}`;
  return topic || sub || gorevTipiLabel(p.taskKind);
}

export function weeklyTaskFromForm(p: TaskFormPayload, existingId?: string): WeeklyTask {
  const title = buildTitleFromForm(p);
  return {
    id: existingId ?? newTaskId(),
    dayIndex: p.dayIndex,
    title,
    meta: buildMetaFromForm(p),
    accent: p.taskKind === "etut_mola" ? "default" : accentFromSubjectName(p.subjectName),
    taskKind: p.taskKind,
    subjectId: p.subjectId || undefined,
    subjectName: p.subjectName || undefined,
    topicId: p.topicId || undefined,
    topicName: p.topicName || undefined,
    conceptNames: p.conceptNames.length ? p.conceptNames : undefined,
    targetQuestions: p.targetQuestions || undefined,
    durationMin: p.durationMin || undefined,
    resource: p.resource || undefined,
    videoUrl: p.videoUrl || undefined,
    coachNote: p.coachNote || undefined,
    dateISO: p.dateISO,
  };
}

export function weeklyTaskFromSuggestion(
  suggestion: AiSuggestion,
  dayIndex: number,
  dateISO: string
): WeeklyTask {
  const title =
    suggestion.subjectName && suggestion.topicName
      ? `${suggestion.subjectName} — ${suggestion.topicName}`
      : suggestion.title;
  return {
    id: newTaskId(),
    dayIndex,
    title,
    meta: suggestion.priority === "high" ? "MR teşhis · yüksek öncelik" : "MR teşhis · rutin",
    accent: accentFromTitle(title),
    taskKind: suggestion.taskKind,
    subjectId: suggestion.subjectId,
    subjectName: suggestion.subjectName,
    topicId: suggestion.topicId,
    topicName: suggestion.topicName,
    targetQuestions: suggestion.targetQuestions,
    durationMin: suggestion.suggestedDurationMin,
    coachNote: suggestion.coachNote,
    suggestionKey: suggestion.id,
  };
}
