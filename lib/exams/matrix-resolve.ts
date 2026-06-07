/**
 * Deneme konu matrisi çözümleme — ESKİ analiz-merkezi.html buildExamMatrixFromPoolRaw parity.
 */
import { decodeKonuCell } from "@/lib/exams/konu-cell";
import { getExamLayout } from "@/lib/exams/exam-layout";
import { getConcepts, getDersById, getTopicById } from "@/lib/mufredat";
import type { ExamMatrixRecord, MatrixQuestion } from "@/lib/exams/exam-matrix";
import type { KurumDeneme, MergedExam } from "@/lib/exams/types";

/** UTF-8 metnin Latin-1 gibi okunmasından kaynaklanan bozuk karakterleri onarır */
export function repairUtf8Mojibake(text: string): string {
  const s = String(text ?? "");
  if (!s || !/[ÃÄÅÆÇÐÑØÞßà-ÿ]/.test(s)) return s;
  try {
    const bytes = Uint8Array.from(s, (c) => c.charCodeAt(0) & 0xff);
    const fixed = new TextDecoder("utf-8").decode(bytes);
    if (fixed && !fixed.includes("\uFFFD") && fixed !== s) return fixed;
  } catch {
    /* ignore */
  }
  return s
    .replace(/Ã§/g, "ç")
    .replace(/Ã‡/g, "Ç")
    .replace(/Ã¶/g, "ö")
    .replace(/Ã–/g, "Ö")
    .replace(/Ã¼/g, "ü")
    .replace(/Ãœ/g, "Ü")
    .replace(/Ä±/g, "ı")
    .replace(/Ä°/g, "İ")
    .replace(/ÄŸ/g, "ğ")
    .replace(/Äž/g, "Ğ")
    .replace(/ÅŸ/g, "ş")
    .replace(/Åž/g, "Ş")
    .replace(/Ã¾/g, "ş")
    .replace(/Ã°/g, "ğ")
    .replace(/Ã½/g, "ı")
    .replace(/Ã/g, "İ");
}

function isWeakSubject(name: string): boolean {
  const s = repairUtf8Mojibake(String(name ?? "").trim());
  if (!s || s === "—" || s === "-" || s === "Genel") return true;
  return /^(tyt-|ayt-|ydt$)/i.test(s);
}

function isWeakTopic(name: string): boolean {
  const s = repairUtf8Mojibake(String(name ?? "").trim());
  return !s || s === "Genel";
}

export function resolveSubjectLabel(subjectId: string, name: string): string {
  const sid = String(subjectId || "").trim();
  const n = repairUtf8Mojibake(String(name ?? "").trim());
  const fromApi = sid ? getDersById(sid)?.dersAdi || "" : "";
  if (fromApi) {
    const sluggy = /^(tyt-|ayt-|ydt$)/i.test(n) || n === "—" || !n;
    if (sluggy) return fromApi;
  }
  return n || fromApi || "—";
}

export function resolveTopicDisplay(
  subjectId: string,
  topicId: string,
  conceptId: string,
  currentName: string
): string {
  const t = repairUtf8Mojibake(String(currentName ?? "").trim());
  if (t && !isWeakTopic(t)) return t;
  const sid = String(subjectId || "").trim();
  const tid = String(topicId || "").trim();
  const cid = String(conceptId || "").trim();
  const topicBase = tid ? getTopicById(sid, tid)?.name || "" : "";
  const cname = cid && tid ? getConcepts(sid, tid).find((c) => c.id === cid)?.name || "" : "";
  const built = topicBase && cname ? `${topicBase} · ${cname}` : topicBase || cname;
  return repairUtf8Mojibake(built || t || "Genel");
}

/** konu[] hücresi + konuYazi[] → görünen konu / kavram */
export function resolveKonuKavramFromCell(
  cell: string,
  subjectId: string,
  yazi: string
): { konu: string; kavram: string } {
  const y = repairUtf8Mojibake(String(yazi ?? "").trim());
  if (y) {
    for (const sep of [" — ", " · ", " - ", " | ", ": "]) {
      const i = y.indexOf(sep);
      if (i >= 0) {
        return {
          konu: y.slice(0, i).trim(),
          kavram: y.slice(i + sep.length).trim(),
        };
      }
    }
    return { konu: y, kavram: "" };
  }
  const decoded = decodeKonuCell(cell);
  const sid = decoded.subjectId || subjectId;
  const topicName = decoded.topicId
    ? getTopicById(sid, decoded.topicId)?.name || ""
    : "";
  const conceptName =
    decoded.conceptId && decoded.topicId
      ? getConcepts(sid, decoded.topicId).find((c) => c.id === decoded.conceptId)?.name || ""
      : "";
  return {
    konu: repairUtf8Mojibake(topicName),
    kavram: repairUtf8Mojibake(conceptName),
  };
}

function formatTopicLabel(konu: string, kavram: string): string {
  const k = repairUtf8Mojibake(konu);
  const v = repairUtf8Mojibake(kavram);
  if (k && v) return `${k} · ${v}`;
  return k || v || "Genel";
}

/** Kurum/global deneme kaydından tam ExamMatrixRecord üret */
export function buildMatrixFromExam(exam: KurumDeneme | MergedExam): ExamMatrixRecord {
  const sinav = (exam.sinav || "TYT") as KurumDeneme["sinav"];
  const layout = getExamLayout(sinav);
  const n = exam.soruSayisi || layout.n;
  const konuArr = Array.isArray(exam.konu) ? exam.konu : [];
  const yaziArr = Array.isArray(exam.konuYazi) ? exam.konuYazi : [];

  const questions: MatrixQuestion[] = [];
  for (let i = 0; i < n; i++) {
    const rowMeta = layout.byIndex[i] || { subjectId: "", sectionTitle: "" };
    const cell = String(konuArr[i] ?? "").trim();
    const decoded = decodeKonuCell(cell);
    const sid = String(rowMeta.subjectId || decoded.subjectId || "").trim();
    let subjName = resolveSubjectLabel(sid, rowMeta.sectionTitle || "");

    const pk = resolveKonuKavramFromCell(cell, sid, String(yaziArr[i] ?? ""));
    let topicName = formatTopicLabel(pk.konu, pk.kavram);
    if (isWeakTopic(topicName)) {
      topicName = resolveTopicDisplay(
        sid,
        decoded.topicId,
        decoded.conceptId,
        topicName
      );
    }

    questions.push({
      qNo: i + 1,
      subjectId: sid,
      subjectName: subjName,
      topicId: decoded.topicId || null,
      topicName: repairUtf8Mojibake(topicName),
    });
  }

  return {
    examId: exam.id,
    name: exam.ad || (exam as MergedExam).name || exam.id,
    date: exam.tarih || (exam as MergedExam).date,
    questionCount: questions.length,
    questions,
  };
}

/**
 * İki matris kaynağını birleştir.
 * @param primary — dolu konu/cevap varsa öncelik (takvim / pool)
 * @param fallback — primary zayıfsa doldurur (LS önbelleği)
 */
export function mergeExamMatrixWithPool(
  primary: ExamMatrixRecord | null,
  fallback: ExamMatrixRecord | null
): ExamMatrixRecord | null {
  if (!primary?.questions?.length) return fallback;
  if (!fallback?.questions?.length) return primary;

  const primaryByQ: Record<number, MatrixQuestion> = {};
  primary.questions.forEach((q) => {
    if (q?.qNo) primaryByQ[q.qNo] = q;
  });

  const fallbackMap: Record<number, MatrixQuestion> = {};
  fallback.questions.forEach((q, idx) => {
    const qn = Number(q.qNo) || idx + 1;
    fallbackMap[qn] = q;
  });

  const n = Math.max(
    primary.questionCount || 0,
    fallback.questionCount || 0,
    primary.questions.length,
    fallback.questions.length
  );

  const merged: MatrixQuestion[] = [];
  for (let qi = 1; qi <= n; qi++) {
    const sq = primaryByQ[qi] || ({} as MatrixQuestion);
    const pq = fallbackMap[qi] || ({} as MatrixQuestion);
    const sid = String(sq.subjectId || pq.subjectId || "").trim();
    let pickSubj = !isWeakSubject(sq.subjectName || "")
      ? String(sq.subjectName).trim()
      : String(pq.subjectName || "").trim();
    pickSubj = resolveSubjectLabel(sid, pickSubj);
    const tid = String(sq.topicId || pq.topicId || "").trim();
    let pickTopic = !isWeakTopic(sq.topicName || "")
      ? String(sq.topicName).trim()
      : String(pq.topicName || "").trim();
    pickTopic = resolveTopicDisplay(sid, tid, "", pickTopic);
    merged.push({
      qNo: qi,
      subjectId: sid,
      subjectName: pickSubj,
      topicId: tid || null,
      topicName: repairUtf8Mojibake(pickTopic),
    });
  }

  return {
    examId: String(primary.examId || fallback.examId || ""),
    name: primary.name || fallback.name,
    date: primary.date || fallback.date,
    questionCount: merged.length,
    questions: merged,
  };
}
