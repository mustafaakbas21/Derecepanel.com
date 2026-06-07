import type { QuestionResultCell } from "@/lib/analiz/error-karne";
import { getDerslerByTrack, getTopics } from "@/lib/mufredat";
import { loadStudentTracking, topicKey } from "@/lib/konu-takip/storage";
import type { StudentTracking, TopicProgress, TopicStatus } from "@/lib/konu-takip/types";

export type KonuTakipQuestionContext = {
  status: TopicStatus;
  solved: number;
  target?: number;
  /** Müfredat id ile eşleşti */
  matchedById: boolean;
  /** İsim benzerliği ile eşleşti */
  matchedByName: boolean;
};

const DEFAULT_CTX: KonuTakipQuestionContext = {
  status: "baslanmadi",
  solved: 0,
  matchedById: false,
  matchedByName: false,
};

function normalizeTopicName(s: string): string {
  return String(s ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[·—–|-]/g, " ")
    .trim();
}

function progressToContext(
  progress: TopicProgress | undefined,
  matchedById: boolean,
  matchedByName: boolean
): KonuTakipQuestionContext {
  if (!progress) {
    return { ...DEFAULT_CTX, matchedById, matchedByName };
  }
  return {
    status: progress.status,
    solved: progress.solved ?? 0,
    target: progress.target,
    matchedById,
    matchedByName,
  };
}

function findTopicIdByName(subjectId: string, topicName: string): string | null {
  const want = normalizeTopicName(topicName);
  if (!want || !subjectId) return null;
  const hit = getTopics(subjectId).find((t) => normalizeTopicName(t.name) === want);
  return hit?.id ?? null;
}

function findTopicIdByNameAnySubject(topicName: string): {
  subjectId: string;
  topicId: string;
} | null {
  const want = normalizeTopicName(topicName);
  if (!want) return null;
  for (const ders of getDerslerByTrack("ALL")) {
    const hit = ders.konular.find((k) => normalizeTopicName(k.ad) === want);
    if (hit) return { subjectId: ders.id, topicId: hit.id };
  }
  return null;
}

/** Tek soru — Konu Takip Merkezi kaydı */
export function resolveKonuTakipForQuestion(
  studentId: string,
  cell: Pick<QuestionResultCell, "subjectId" | "topicId" | "topicName" | "subjectName">,
  trackingSnapshot?: StudentTracking
): KonuTakipQuestionContext {
  const sid = String(studentId || "").trim();
  if (!sid) return DEFAULT_CTX;

  const tracking = trackingSnapshot ?? loadStudentTracking(sid);
  let subjectId = String(cell.subjectId || "").trim();
  let topicId = String(cell.topicId || "").trim();

  if (subjectId && topicId) {
    const p = tracking[topicKey(subjectId, topicId)];
    if (p) return progressToContext(p, true, false);
  }

  if (subjectId && !topicId && cell.topicName) {
    topicId = findTopicIdByName(subjectId, cell.topicName) || "";
    if (topicId) {
      const p = tracking[topicKey(subjectId, topicId)];
      return progressToContext(p, false, true);
    }
  }

  if (!subjectId && cell.topicName) {
    const found = findTopicIdByNameAnySubject(cell.topicName);
    if (found) {
      subjectId = found.subjectId;
      topicId = found.topicId;
      const p = tracking[topicKey(subjectId, topicId)];
      return progressToContext(p, false, true);
    }
  }

  if (!subjectId && cell.subjectName) {
    const ders = getDerslerByTrack("ALL").find(
      (d) => normalizeTopicName(d.dersAdi) === normalizeTopicName(cell.subjectName)
    );
    if (ders && cell.topicName) {
      topicId = findTopicIdByName(ders.id, cell.topicName) || "";
      if (topicId) {
        const p = tracking[topicKey(ders.id, topicId)];
        return progressToContext(p, false, true);
      }
    }
  }

  return DEFAULT_CTX;
}

export function buildKonuTakipLookupByQNo(
  studentId: string,
  cells: QuestionResultCell[],
  trackingSnapshot?: StudentTracking
): Map<number, KonuTakipQuestionContext> {
  const map = new Map<number, KonuTakipQuestionContext>();
  if (!studentId) return map;
  const tracking = trackingSnapshot ?? loadStudentTracking(studentId);
  cells.forEach((c) => {
    map.set(c.qNo, resolveKonuTakipForQuestion(studentId, c, tracking));
  });
  return map;
}

/** Hata karnesi / analiz rozetleri — “Konu …” önekli */
export function konuTakipStatusShortLabel(status: TopicStatus): string {
  if (status === "bitti") return "Konu bitti";
  if (status === "calisiliyor") return "Konu çalışılıyor";
  return "Konu başlanmadı";
}

export function konuTakipSolvedLabel(ctx: KonuTakipQuestionContext): string | null {
  if (ctx.solved <= 0) return null;
  if (ctx.target && ctx.target > 0) {
    return `${ctx.solved}/${ctx.target} soru`;
  }
  return `${ctx.solved} soru çözüldü`;
}
