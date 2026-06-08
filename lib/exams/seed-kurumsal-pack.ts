/**
 * Koç paneli — 5 kurumsal deneme + öğrencilerimle eşleşen sonuçlar (localStorage).
 * Sabit exam id'leri: yeniden çalıştırınca günceller (replace).
 */
import { addMatrixResult } from "@/lib/exams/exam-matrix";
import {
  buildKeyStringFromExam,
  evaluateRow,
} from "@/lib/exams/exam-evaluate";
import { getExamLayout } from "@/lib/exams/exam-layout";
import { encodeKonuCell } from "@/lib/exams/konu-cell";
import { getActiveCoachId } from "@/lib/exams/coach-scope";
import { saveExamResultsBatch } from "@/lib/exams/storage/exam-results-storage";
import { upsertKurumDeneme } from "@/lib/exams/storage/exam-storage";
import type { KurumDeneme, ParseRow, SinavTipi } from "@/lib/exams/types";
import { getTopics } from "@/lib/mufredat";
import { DEFAULT_COACH_ID } from "@/lib/students/constants";
import { loadStudentsFull } from "@/lib/students/storage";
import type { StudentRecord } from "@/lib/students/types";

const DEMO_PDF_NAME = "kurumsal-demo-kitapcik.pdf";
const DEMO_PDF_URL = "data:application/pdf;base64,ZGVtby1raXRhcGFjaA==";
const LETTERS = ["A", "B", "C", "D", "E"] as const;

export const KURUM_SEED_EXAM_IDS = [
  "kurum-seed-tyt-01",
  "kurum-seed-tyt-02",
  "kurum-seed-tyt-03",
  "kurum-seed-tyt-04",
  "kurum-seed-ayt-01",
] as const;

type SeedExamDef = {
  id: (typeof KURUM_SEED_EXAM_IDS)[number];
  ad: string;
  tarih: string;
  sinav: SinavTipi;
};

const SEED_EXAMS: SeedExamDef[] = [
  {
    id: "kurum-seed-tyt-01",
    ad: "Kurumsal TYT 1 — Kasım 2025",
    tarih: "2025-11-16",
    sinav: "TYT",
  },
  {
    id: "kurum-seed-tyt-02",
    ad: "Kurumsal TYT 2 — Aralık 2025",
    tarih: "2025-12-14",
    sinav: "TYT",
  },
  {
    id: "kurum-seed-tyt-03",
    ad: "Kurumsal TYT 3 — Ocak 2026",
    tarih: "2026-01-18",
    sinav: "TYT",
  },
  {
    id: "kurum-seed-tyt-04",
    ad: "Kurumsal TYT 4 — Şubat 2026",
    tarih: "2026-02-22",
    sinav: "TYT",
  },
  {
    id: "kurum-seed-ayt-01",
    ad: "Kurumsal AYT Sayısal — Mart 2026",
    tarih: "2026-03-08",
    sinav: "AYT",
  },
];

export type KurumsalSeedResult = {
  examCount: number;
  resultRows: number;
  studentCount: number;
  examIds: string[];
};

function hash32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Müfredattan layout’a uygun konu + cevap anahtarı matrisi */
export function buildSeedExamMatrices(
  sinav: SinavTipi,
  examSeed: number
): Pick<KurumDeneme, "cevaplar" | "zorluk" | "konu" | "konuYazi" | "soruSayisi"> {
  const layout = getExamLayout(sinav);
  const n = layout.n;
  const rng = mulberry32(examSeed);
  const topicCursor: Record<string, number> = {};

  const cevaplar: string[] = [];
  const zorluk: string[] = [];
  const konu: string[] = [];
  const konuYazi: string[] = [];

  for (let i = 0; i < n; i++) {
    const meta = layout.byIndex[i] || { subjectId: "", sectionTitle: "" };
    const sid = String(meta.subjectId || "").trim();
    const topics = sid ? getTopics(sid) : [];
    const cursor = topicCursor[sid] ?? 0;
    const topic = topics.length ? topics[cursor % topics.length] : null;
    topicCursor[sid] = cursor + 1;

    konu.push(
      encodeKonuCell({
        subjectId: sid,
        topicId: topic?.id,
      })
    );
    konuYazi.push(topic?.name || meta.sectionTitle || "Genel");
    cevaplar.push(LETTERS[Math.floor(rng() * LETTERS.length)]!);
    zorluk.push(String(1 + Math.floor(rng() * 3)));
  }

  return { cevaplar, zorluk, konu, konuYazi, soruSayisi: n };
}

export function studentSeedAccuracy(
  student: StudentRecord,
  examIndex: number
): number {
  const h = hash32(student.ogrenciId);
  let base = 0.54 + (h % 24) / 100;
  if (student.alan === "sayisal") base += 0.05;
  if (student.alan === "esit") base += 0.02;
  if (student.alan === "sozel") base -= 0.02;
  if (student.status === "mezun") base += 0.04;
  base += examIndex * 0.018;
  return Math.min(0.87, Math.max(0.5, base));
}

export function generateStudentAnswersForKey(
  answerKey: string,
  accuracy: number,
  rngSeed: number
): string {
  const rng = mulberry32(rngSeed);
  let out = "";
  for (let i = 0; i < answerKey.length; i++) {
    const k = answerKey.charAt(i);
    if (!k || k === " ") {
      out += " ";
      continue;
    }
    const r = rng();
    if (r < 0.05) {
      out += " ";
      continue;
    }
    if (r < accuracy) {
      out += k;
      continue;
    }
    const wrong = LETTERS.filter((l) => l !== k);
    out += wrong[Math.floor(rng() * wrong.length)] ?? k;
  }
  return out;
}

export function getStudentsForKurumSeed(): StudentRecord[] {
  const cid = getActiveCoachId() || DEFAULT_COACH_ID;
  let list = loadStudentsFull({ seedIfEmpty: false });
  if (!list.length) return [];
  return list.filter((s) => {
    const coachOk =
      !s.coachId || s.coachId === cid || s.coachId === DEFAULT_COACH_ID;
    const statusOk = s.status === "aktif" || s.status === "mezun";
    return coachOk && statusOk;
  });
}

function buildParseRows(
  exam: KurumDeneme,
  students: StudentRecord[],
  examIndex: number
): ParseRow[] {
  const key = buildKeyStringFromExam(exam, exam.soruSayisi);
  return students.map((st) => {
    const acc = studentSeedAccuracy(st, examIndex);
    const seed = hash32(`${exam.id}:${st.ogrenciId}`);
    const answers = generateStudentAnswersForKey(key, acc, seed);
    const ev = evaluateRow(answers, key);
    const book = hash32(st.ogrenciId) % 2 === 0 ? "A" : "B";
    return {
      id: `seed-row-${exam.id}-${st.ogrenciId}`,
      no: st.studentCode,
      name: st.name,
      book,
      answers,
      correct: ev.correct,
      wrong: ev.wrong,
      blank: ev.blank,
      net: ev.net,
      sube: st.sinifBranch || "",
      matched: true,
      matchedId: st.ogrenciId,
      studentId: st.ogrenciId,
      status: "matched" as const,
      selected: true,
      issues: [],
    };
  });
}

/**
 * 5 kurumsal deneme (tam matris + PDF) ve öğrencilerim kayıtlarına bağlı sonuçlar.
 * Tarayıcıda çalışır; `window` yoksa boş sonuç döner.
 */
export function seedKurumsalDemoPack(): KurumsalSeedResult {
  const empty: KurumsalSeedResult = {
    examCount: 0,
    resultRows: 0,
    studentCount: 0,
    examIds: [],
  };
  if (typeof window === "undefined") return empty;

  const students = getStudentsForKurumSeed();
  if (!students.length) return empty;

  const coachId = getActiveCoachId() || DEFAULT_COACH_ID;
  let resultRows = 0;
  const savedIds: string[] = [];

  SEED_EXAMS.forEach((def, examIndex) => {
    const matrices = buildSeedExamMatrices(def.sinav, hash32(def.id));
    const exam: KurumDeneme = {
      id: def.id,
      ad: def.ad,
      tarih: def.tarih,
      saat: "10:00",
      sinav: def.sinav,
      pdfName: DEMO_PDF_NAME,
      pdfUrl: DEMO_PDF_URL,
      ogrenciKapsam: "tum",
      sinifler: [],
      coachId,
      scope: "kurumsal",
      ...matrices,
    };

    const saved = upsertKurumDeneme(exam);
    savedIds.push(saved.id);

    const rows = buildParseRows(saved, students, examIndex);
    const n = saveExamResultsBatch({
      examId: saved.id,
      examName: saved.ad,
      fileName: "kurumsal-demo-seed.txt",
      templateLabel: "Demo paket",
      templateId: "kurum-seed",
      updateExisting: true,
      rows,
    });
    resultRows += n;

    const key = buildKeyStringFromExam(saved, saved.soruSayisi);
    rows.forEach((r) => {
      if (!r.matchedId) return;
      addMatrixResult({
        examId: saved.id,
        studentId: r.matchedId,
        studentName: r.name,
        date: saved.tarih,
        studentAnswers: r.answers,
        answerKey: key,
      });
    });
  });

  return {
    examCount: savedIds.length,
    resultRows,
    studentCount: students.length,
    examIds: savedIds,
  };
}
