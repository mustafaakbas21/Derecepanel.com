import { matchTopicFromTitle } from "@/lib/onyx/match-topic-from-title";
import { setNote, setStatus } from "@/lib/konu-takip/storage";
import { getDerslerByTrack } from "@/lib/mufredat";

const KONU_TAKIP_TAG_RE =
  /\[KONU_TAKIP:\s*([a-zA-Z0-9_-]+)\s*::\s*([a-zA-Z0-9_-]+)\s*\]/i;

export type KonuTakipOnyxMarkResult = {
  applied: boolean;
  subjectId?: string;
  topicId?: string;
  subjectName?: string;
  topicName?: string;
};

function extractTopicHint(reply: string): string | null {
  const soruTipi = reply.match(
    /(?:💡\s*)?Soru Tipi\s*:?\s*([^\n]+)/i
  )?.[1];
  if (soruTipi?.trim()) return soruTipi.trim();

  const hata = reply.match(
    /(?:🎯\s*)?Hata Reçetesi\s*:?\s*([^\n]+)/i
  )?.[1];
  if (hata?.trim()) return hata.trim();

  return null;
}

/** Onyx yanıtından konuyu çıkarıp Konu Takip'e "tekrar gerekli" işaretler */
export function applyKonuTakipFromOnyxReply(
  studentId: string,
  reply: string
): KonuTakipOnyxMarkResult {
  if (!studentId?.trim()) return { applied: false };

  const tag = reply.match(KONU_TAKIP_TAG_RE);
  let subjectId = tag?.[1];
  let topicId = tag?.[2];
  let subjectName: string | undefined;
  let topicName: string | undefined;

  if (!subjectId || !topicId) {
    const hint = extractTopicHint(reply);
    if (!hint) return { applied: false };
    const match = matchTopicFromTitle(hint);
    if (!match) return { applied: false };
    subjectId = match.subjectId;
    topicId = match.topicId;
    subjectName = match.subjectName;
    topicName = match.topicName;
  } else {
    const ders = getDerslerByTrack("ALL").find((d) => d.id === subjectId);
    const konu = ders?.konular.find((k) => k.id === topicId);
    subjectName = ders?.dersAdi;
    topicName = konu?.ad;
  }

  setStatus(studentId, subjectId, topicId, "calisiliyor");
  setNote(
    studentId,
    subjectId,
    topicId,
    `[Onyx] Tekrar gerekli — ${new Date().toLocaleDateString("tr-TR")} soru çözümü`
  );

  return {
    applied: true,
    subjectId,
    topicId,
    subjectName,
    topicName,
  };
}

export function stripKonuTakipTag(reply: string): string {
  return reply.replace(KONU_TAKIP_TAG_RE, "").trim();
}
