import {
  analyzeMasteryTrends,
  sinavToExamType,
} from "@/lib/analiz/mastery-trend-engine";
import { calculateSubjectMastery } from "@/lib/analiz/subject-mastery";
import { findExamById } from "@/lib/exams/exam-storage";
import type { SinavTipi } from "@/lib/exams/types";
import {
  buildKurumsalStratejiOzeti,
  loadKurumsalSonDenemelerForStudent,
  resolveStudentMatchIds,
  type KurumsalDenemeStratejiOzeti,
} from "@/lib/onyx/kurumsal-exam-results";
import { resolveStudentHedef } from "@/lib/onyx/resolve-student-hedef";
import type { OnyxActionType } from "@/lib/onyx/types";
import { loadStudentsFull } from "@/lib/students/storage";

export type OnyxStudentContextData = {
  uretimZamani: string;
  aksiyonTipi?: OnyxActionType;
  ogrenci: {
    id: string;
    ad: string;
    alan?: string;
    hedef?: {
      universite?: string;
      bolum?: string;
      aciklama?: string;
    };
  };
  /** Son kurumsal deneme özeti (en fazla 5 kayıt) */
  sonUcDeneme: {
    examId: string;
    ad: string;
    tarih: string;
    sinav: SinavTipi | string;
    net?: number | null;
    dogru?: number;
    yanlis?: number;
    bos?: number;
    kaynak?: "kurumsal";
  }[];
  /** Kurumsal deneme kaynaklı TYT/AYT özeti — strateji skill için */
  kurumsalDenemeOzeti?: KurumsalDenemeStratejiOzeti;
  eksikKonular: string[];
  kritikKonuTrendleri: {
    konu: string;
    ders: string;
    trend: string;
    simdikiBasari: number;
    gecmisOrtalama: number;
    gecmisSoruSayisi: number;
  }[];
  zayifKonuHakimiyeti: {
    ders: string;
    konu: string;
    basariYuzdesi: number;
    dogru: number;
    yanlis: number;
    bos: number;
  }[];
};

/**
 * Seçili öğrencinin gerçek deneme / konu verisini Onyx bağlamına dönüştürür.
 * Deneme netleri: kurumsal deneme sonuçları (examResults + kurum_denemeler_v1).
 */
export function buildStudentContextData(
  studentId: string,
  actionType?: OnyxActionType
): OnyxStudentContextData | undefined {
  if (typeof window === "undefined") return undefined;

  const sid = String(studentId || "").trim();
  if (!sid) return undefined;

  const matchIds = resolveStudentMatchIds(sid);

  const students = loadStudentsFull({ seedIfEmpty: false });
  const student = students.find(
    (s) =>
      String(s.ogrenciId) === sid ||
      String(s.studentCode) === sid ||
      matchIds.includes(String(s.ogrenciId)) ||
      matchIds.includes(String(s.studentCode))
  );
  const canonicalId = student?.ogrenciId || sid;
  const ad = student?.name?.trim() || sid;

  const sonUcDeneme = loadKurumsalSonDenemelerForStudent(
    student?.ogrenciId || sid,
    5
  );
  const kurumsalDenemeOzeti = buildKurumsalStratejiOzeti(sonUcDeneme);

  const latest = sonUcDeneme[0];
  const latestExam = latest ? findExamById(latest.examId) : null;
  const sinav = latestExam?.sinav ?? null;
  const examType = sinavToExamType(sinav);

  let kritikKonuTrendleri: OnyxStudentContextData["kritikKonuTrendleri"] = [];
  if (latest && examType) {
    const trends = analyzeMasteryTrends({
      studentId: canonicalId,
      currentExamId: latest.examId,
      currentExamType: examType,
      currentExamDate: latest.tarih,
    });
    kritikKonuTrendleri = trends
      .filter(
        (t) =>
          t.trendStatus === "CRITICAL_DROP" ||
          t.trendStatus === "CHRONIC_WEAK" ||
          t.trendStatus === "RISING"
      )
      .slice(0, 20)
      .map((t) => ({
        konu: t.konuAdi,
        ders: t.dersAdi,
        trend: t.trendStatus,
        simdikiBasari: t.simdikiBasari,
        gecmisOrtalama: t.gecmisOrtalama,
        gecmisSoruSayisi: t.gecmisSoruSayisi,
      }));
  }

  const mastery = calculateSubjectMastery(canonicalId, { sinav });
  const zayifKonuHakimiyeti = mastery
    .filter((m) => m.total > 0 && m.rate < 60)
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 25)
    .map((m) => ({
      ders: m.subjectName,
      konu: m.topicName,
      basariYuzdesi: m.rate,
      dogru: m.correct,
      yanlis: m.wrong,
      bos: m.empty,
    }));

  const eksikKonular = zayifKonuHakimiyeti.map(
    (z) => `${z.konu} (${z.ders}, %${z.basariYuzdesi})`
  );

  const hedefResolved = student
    ? resolveStudentHedef({
        ogrenci: {
          hedef: {
            universite: student.targetUniversity,
            bolum: student.targetDepartment,
            aciklama: student.goal,
          },
        },
      })
    : null;

  return {
    uretimZamani: new Date().toISOString(),
    aksiyonTipi: actionType,
    ogrenci: {
      id: canonicalId,
      ad,
      alan: student?.alan,
      hedef: hedefResolved
        ? {
            universite: hedefResolved.universite,
            bolum: hedefResolved.bolum,
            aciklama: hedefResolved.aciklama,
          }
        : undefined,
    },
    sonUcDeneme,
    kurumsalDenemeOzeti,
    eksikKonular,
    kritikKonuTrendleri,
    zayifKonuHakimiyeti,
  };
}
