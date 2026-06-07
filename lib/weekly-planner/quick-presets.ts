import { getDersById } from "@/lib/mufredat";
import {
  type TaskFormPayload,
  weeklyTaskFromForm,
} from "@/lib/weekly-planner/task-build";
import type { WeeklyTask } from "@/lib/weekly-planner/types";

/**
 * Günlük hazır set hedefleri (koçluk / YKS tempo):
 * - Paragraf: TYT Türkçe'de paragraf ağırlığı yüksek; günlük 20 soru yaygın tempo.
 * - Problem: TYT Temel Mat'ta problem blokları; günlük 20 soru orta yoğunluk
 *   (MR önerileri zayıf konuda 30, rutinde 25 — hızlı şablon 20).
 */
export type QuickPresetId = "hazir_problem" | "paragraf";

export type QuickPresetDef = {
  id: QuickPresetId;
  label: string;
  shortHint: string;
  targetQuestions: number;
  durationMin: number;
  subjectId: string;
  topicId: string;
};

export const QUICK_PRESETS: QuickPresetDef[] = [
  {
    id: "paragraf",
    label: "Paragraf",
    shortHint: "20 soru · ~45 dk",
    targetQuestions: 20,
    durationMin: 45,
    subjectId: "tyt-tr",
    topicId: "paragraf",
  },
  {
    id: "hazir_problem",
    label: "Hazır Problem",
    shortHint: "20 soru · ~60 dk",
    targetQuestions: 20,
    durationMin: 60,
    subjectId: "tyt-mat",
    topicId: "problemlerGenel",
  },
];

export function weeklyTaskFromQuickPreset(
  presetId: QuickPresetId,
  dayIndex: number,
  dateISO: string
): WeeklyTask | null {
  const preset = QUICK_PRESETS.find((p) => p.id === presetId);
  if (!preset) return null;

  const ders = getDersById(preset.subjectId);
  const topic = ders?.konular.find((k) => k.id === preset.topicId);

  const payload: TaskFormPayload = {
    dayIndex,
    dateISO,
    taskKind: "soru_cozme",
    subjectId: preset.subjectId,
    subjectName: ders?.dersAdi ?? "",
    topicId: preset.topicId,
    topicName: topic?.ad ?? preset.label,
    conceptNames: [],
    targetQuestions: String(preset.targetQuestions),
    durationMin: String(preset.durationMin),
    resource: preset.id === "paragraf" ? "Hazır paragraf seti" : "Hazır problem seti",
    videoUrl: "",
    coachNote: "",
  };

  const task = weeklyTaskFromForm(payload);
  return {
    ...task,
    title:
      preset.id === "paragraf"
        ? `${ders?.dersAdi ?? "TYT Türkçe"} — Paragraf`
        : `${ders?.dersAdi ?? "TYT Matematik"} — Hazır Problem`,
  };
}
