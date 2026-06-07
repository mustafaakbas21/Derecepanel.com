import type { AiSuggestion, TopicDiagnostic } from "@/lib/weekly-planner/types";

/** Otonom panel + AI dağıtımı için üst sınır */
export const MR_MAX_GLOBAL_SUGGESTIONS = 48;
const PER_SUBJECT_MIN = 2;
const PER_SUBJECT_CAP = 6;

function topicKey(d: TopicDiagnostic): string {
  if (d.subjectId && d.topicId) return `${d.subjectId}::${d.topicId}`;
  return d.label;
}

/**
 * Tüm hatalı konuları dersler arasında dengeli öneri havuzuna çevirir.
 * Önce her dersten en az PER_SUBJECT_MIN, sonra round-robin ile genişletir.
 */
export function buildBalancedSuggestionPool(
  diagnostics: TopicDiagnostic[],
  examCount: number,
  toSuggestion: (d: TopicDiagnostic, examCount: number) => AiSuggestion
): AiSuggestion[] {
  const withWrongs = diagnostics
    .filter((d) => d.wrongCount >= 1)
    .sort((a, b) => b.priority - a.priority);

  if (withWrongs.length === 0) return [];

  const bySubject = new Map<string, TopicDiagnostic[]>();
  for (const d of withWrongs) {
    const sid = d.subjectId || `unknown:${d.subjectName || d.label}`;
    const list = bySubject.get(sid) ?? [];
    list.push(d);
    bySubject.set(sid, list);
  }

  const picked: TopicDiagnostic[] = [];
  const seen = new Set<string>();

  const take = (d: TopicDiagnostic) => {
    const k = topicKey(d);
    if (seen.has(k)) return;
    seen.add(k);
    picked.push(d);
  };

  for (const list of bySubject.values()) {
    for (let i = 0; i < PER_SUBJECT_MIN && i < list.length; i++) {
      take(list[i]!);
      if (picked.length >= MR_MAX_GLOBAL_SUGGESTIONS) break;
    }
    if (picked.length >= MR_MAX_GLOBAL_SUGGESTIONS) break;
  }

  let round = PER_SUBJECT_MIN;
  while (picked.length < MR_MAX_GLOBAL_SUGGESTIONS) {
    let added = false;
    for (const list of bySubject.values()) {
      if (round >= PER_SUBJECT_CAP || round >= list.length) continue;
      take(list[round]!);
      added = true;
      if (picked.length >= MR_MAX_GLOBAL_SUGGESTIONS) break;
    }
    if (!added) break;
    round++;
  }

  for (const d of withWrongs) {
    if (picked.length >= MR_MAX_GLOBAL_SUGGESTIONS) break;
    take(d);
  }

  return picked.map((d) => toSuggestion(d, examCount));
}
