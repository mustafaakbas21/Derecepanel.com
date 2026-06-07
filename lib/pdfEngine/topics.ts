import { getExamLayout } from "@/lib/exams/exam-layout";
import { matchTopicLabel, normalizeTopicText } from "@/lib/exams/topic-match";
import { getDersById, getTopicOptions, getTopics } from "@/lib/mufredat";
import type { SinavTipi } from "@/lib/exams/types";

export type TopicIndexEntry = {
  subjectId: string;
  topicId: string;
  topicLabel: string;
  norm: string;
};

export function buildTopicIndex(sinav: SinavTipi): TopicIndexEntry[] {
  const layout = getExamLayout(sinav);
  const subjectIds = [...new Set(layout.byIndex.map((c) => c.subjectId).filter(Boolean))];
  const out: TopicIndexEntry[] = [];

  for (const subjectId of subjectIds) {
    for (const topic of getTopics(subjectId)) {
      const norm = normalizeTopicText(topic.name);
      if (!norm || norm.length < 5) continue;
      out.push({
        subjectId,
        topicId: topic.id,
        topicLabel: topic.name,
        norm,
      });
    }
  }

  return out.sort((a, b) => b.norm.length - a.norm.length);
}

function hasWordBoundary(textNorm: string, wordNorm: string): boolean {
  if (!wordNorm || wordNorm.length < 5) return false;
  const escaped = wordNorm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  try {
    return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`).test(textNorm);
  } catch {
    return textNorm.includes(wordNorm);
  }
}

/** PDF gövdesinden açık konu/kavram etiketi */
export function extractExplicitTopicFromChunk(chunk: string): string {
  const patterns = [
    /konu\s*[:\-–]\s*([^\n]{3,80})/i,
    /kavram\s*[:\-–]\s*([^\n]{3,80})/i,
    /mufredat\s*[:\-–]\s*([^\n]{3,80})/i,
    /unite\s*[:\-–]\s*([^\n]{3,80})/i,
  ];
  for (const re of patterns) {
    const m = chunk.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return "";
}

export function matchTopicForSubject(
  chunkRaw: string,
  subjectId: string,
  index: TopicIndexEntry[]
): { topicId: string; topicLabel: string; confidence: number } {
  const explicit = extractExplicitTopicFromChunk(chunkRaw);
  const chunkNorm = normalizeTopicText(explicit || chunkRaw);

  if (explicit) {
    const topicId = matchTopicLabel(explicit, getTopicOptions(subjectId));
    if (topicId) {
      const label = getTopicOptions(subjectId).find((o) => o.id === topicId)?.label || explicit;
      return { topicId, topicLabel: label, confidence: 92 };
    }
  }

  const scoped = index.filter((e) => e.subjectId === subjectId);
  let best = { topicId: "", topicLabel: "", confidence: 0 };

  for (const entry of scoped) {
    let sc = 0;
    if (hasWordBoundary(chunkNorm, entry.norm)) sc = 90;
    else if (entry.norm.length >= 8 && chunkNorm.includes(entry.norm)) sc = 82;

    if (sc > best.confidence) {
      best = { topicId: entry.topicId, topicLabel: entry.topicLabel, confidence: sc };
    }
  }

  if (best.confidence >= 82) return best;

  const fuzzyId = matchTopicLabel(
    chunkNorm.slice(0, 200),
    getTopicOptions(subjectId)
  );
  if (fuzzyId) {
    const label = getTopicOptions(subjectId).find((o) => o.id === fuzzyId)?.label || "";
    return { topicId: fuzzyId, topicLabel: label, confidence: 78 };
  }

  return best.confidence >= 70 ? best : { topicId: "", topicLabel: "", confidence: 0 };
}

export function splitQuestionChunks(
  bodyText: string,
  maxQ: number
): Map<number, string> {
  const chunks = new Map<number, string>();
  const re = /(?:^|\n|\s)(\d{1,3})\s*[\.\)]\s+/g;
  const indices: { q: number; start: number }[] = [];
  let m: RegExpExecArray | null;

  while ((m = re.exec(bodyText)) !== null) {
    const q = parseInt(m[1]!, 10);
    if (q > 0 && q <= maxQ) {
      indices.push({ q, start: m.index + m[0].length });
    }
  }

  for (let i = 0; i < indices.length; i++) {
    const cur = indices[i]!;
    const end = i + 1 < indices.length ? indices[i + 1]!.start : bodyText.length;
    const slice = bodyText.slice(cur.start, end);
    if (!chunks.has(cur.q) || chunks.get(cur.q)!.length < slice.length) {
      chunks.set(cur.q, slice);
    }
  }
  return chunks;
}

export function subjectLabelFor(subjectId: string, fallback?: string): string {
  return getDersById(subjectId)?.dersAdi || fallback || "—";
}
