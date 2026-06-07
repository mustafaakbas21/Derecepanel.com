import { readMergedResultsForStudent } from "@/lib/exams/exam-results-storage";
import { loadKurumDenemeler } from "@/lib/exams/exam-storage";
import type { ExamResultRow, SinavTipi } from "@/lib/exams/types";
import { loadStudentsFull } from "@/lib/students/storage";

/** ogrenciId + studentCode — Sonuç Merkezi ile aynı eşleştirme */
export function resolveStudentMatchIds(studentId: string): string[] {
  const sid = String(studentId || "").trim();
  if (!sid) return [];

  const ids = new Set<string>([sid]);
  const students = loadStudentsFull({ seedIfEmpty: false });
  const match = students.find(
    (s) => String(s.ogrenciId) === sid || String(s.studentCode) === sid
  );
  if (match) {
    if (match.ogrenciId) ids.add(String(match.ogrenciId));
    if (match.studentCode) ids.add(String(match.studentCode));
  }
  return [...ids];
}

export type KurumsalDenemeOzet = {
  examId: string;
  ad: string;
  tarih: string;
  sinav: SinavTipi | string;
  net?: number | null;
  dogru?: number;
  yanlis?: number;
  bos?: number;
  kaynak: "kurumsal";
};

export type KurumsalDenemeStratejiOzeti = {
  kaynak: "kurumsal";
  denemeSayisi: number;
  sonTyTNet: number | null;
  sonAytNet: number | null;
  sonDenemeAdi: string | null;
  sonDenemeTarihi: string | null;
};

function pickLatestResultPerExam(
  rows: ExamResultRow[]
): Map<string, ExamResultRow> {
  const byExam = new Map<string, ExamResultRow>();
  for (const row of rows) {
    if (!row?.examId) continue;
    const key = String(row.examId);
    const prev = byExam.get(key);
    if (!prev || String(row.savedAt || "") >= String(prev.savedAt || "")) {
      byExam.set(key, row);
    }
  }
  return byExam;
}

/** Kurumsal deneme tanımı + examResults birleşimi (Sonuç Merkezi kaynağı) */
export function loadKurumsalSonDenemelerForStudent(
  studentId: string,
  limit = 5
): KurumsalDenemeOzet[] {
  if (typeof window === "undefined") return [];

  const matchIds = resolveStudentMatchIds(studentId);
  if (!matchIds.length) return [];

  const kurumsalExams = loadKurumDenemeler();
  const kurumsalIds = new Set(kurumsalExams.map((e) => e.id));
  const results = readMergedResultsForStudent(matchIds).filter(
    (r) => r?.examId && kurumsalIds.has(String(r.examId))
  );
  const byExam = pickLatestResultPerExam(results);

  return kurumsalExams
    .filter((e) => byExam.has(e.id))
    .sort((a, b) => {
      const da = Date.parse(a.tarih || "") || 0;
      const db = Date.parse(b.tarih || "") || 0;
      if (da !== db) return db - da;
      return b.id.localeCompare(a.id);
    })
    .slice(0, limit)
    .map((e) => {
      const row = byExam.get(e.id)!;
      return {
        examId: e.id,
        ad: e.ad || e.id,
        tarih: e.tarih || "",
        sinav: e.sinav,
        net:
          row.net != null && Number.isFinite(Number(row.net))
            ? Number(row.net)
            : null,
        dogru: row.correct,
        yanlis: row.wrong,
        bos: row.blank,
        kaynak: "kurumsal" as const,
      };
    });
}

function findLatestNetBySinav(
  denemeler: KurumsalDenemeOzet[],
  kind: "TYT" | "AYT"
): KurumsalDenemeOzet | undefined {
  return denemeler.find((d) => {
    const s = String(d.sinav).toUpperCase();
    if (kind === "TYT") {
      return s.includes("TYT") && !s.includes("AYT");
    }
    return s.includes("AYT");
  });
}

export function buildKurumsalStratejiOzeti(
  denemeler: KurumsalDenemeOzet[]
): KurumsalDenemeStratejiOzeti {
  const sonTyT = findLatestNetBySinav(denemeler, "TYT");
  const sonAyt = findLatestNetBySinav(denemeler, "AYT");
  const latest = denemeler[0];

  return {
    kaynak: "kurumsal",
    denemeSayisi: denemeler.length,
    sonTyTNet:
      sonTyT?.net != null && Number.isFinite(sonTyT.net) ? sonTyT.net : null,
    sonAytNet:
      sonAyt?.net != null && Number.isFinite(sonAyt.net) ? sonAyt.net : null,
    sonDenemeAdi: latest?.ad ?? null,
    sonDenemeTarihi: latest?.tarih ?? null,
  };
}

/** Strateji kartı — öncelik: son TYT net; yoksa null (0 uydurma) */
export function pickStrategyMevcutNet(
  denemeler: KurumsalDenemeOzet[]
): number | null {
  const tyt = findLatestNetBySinav(denemeler, "TYT");
  if (tyt?.net != null && Number.isFinite(tyt.net)) return tyt.net;

  for (const d of denemeler) {
    const s = String(d.sinav).toUpperCase();
    if (s.includes("TYT") && d.net != null && Number.isFinite(d.net)) {
      return d.net;
    }
  }
  return null;
}
