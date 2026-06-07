import { randomUUID } from "node:crypto";

import { matchTopicFromTitle } from "@/lib/onyx/match-topic-from-title";
import { createQuestionMemory } from "@/lib/db/question-memory";
import { appendOnyxSolve, listOnyxSolvesByStudent } from "@/lib/db/onyx-solves-repository";
import type {
  OnyxQuestionSolveRecord,
  SaveQuestionToCurriculumInput,
  SaveQuestionToCurriculumResult,
} from "@/lib/db/types";

/**
 * AI soru çözümünü kaydeder ve müfredat eşlemesi yapar.
 * Konu Takip durumu istemcide `applyCurriculumMarkClient` ile güncellenir
 * (MVP localStorage; `bitti` olan konular atlanır).
 */
export async function saveQuestionToCurriculum(
  input: SaveQuestionToCurriculumInput
): Promise<SaveQuestionToCurriculumResult> {
  const { studentId, structured, model } = input;
  const source = input.source ?? "vision";
  const deep = structured.deepDiagnosis;
  const match = matchTopicFromTitle(
    deep?.hataAnalizi.eksikKavram ?? structured.konu_basligi
  );

  const solve: OnyxQuestionSolveRecord = {
    id: randomUUID(),
    studentId,
    cozum: structured.cozum,
    konuBasligi: deep?.hataAnalizi.eksikKavram ?? structured.konu_basligi,
    zorlukSeviyesi: structured.zorluk_seviyesi,
    hataKodu: structured.hata_kodu,
    hataTipi: deep?.hataAnalizi.hataTipi,
    kokNeden: deep?.hataAnalizi.kökNeden,
    eksikKavram: deep?.hataAnalizi.eksikKavram,
    tavsiyeEdilenAksiyon: deep?.aksiyonPlani.tavsiyeEdilenAksiyon,
    onyxMesaji: deep?.aksiyonPlani.OnyxMesaji,
    cozumAdimlari: deep?.cozumAdimlari,
    subjectId: match?.subjectId,
    topicId: match?.topicId,
    subjectName: match?.subjectName,
    topicName: match?.topicName,
    curriculumMarked: Boolean(match),
    curriculumSkippedReason: match ? undefined : "Müfredatta konu eşleşmedi",
    createdAt: new Date().toISOString(),
    model,
    source,
  };

  await appendOnyxSolve(solve);

  await createQuestionMemory({
    studentId,
    topic: solve.konuBasligi,
    questionImage: input.questionImage ?? null,
    solutionText: structured.cozum,
    difficultyScore: structured.zorluk_seviyesi,
  });

  return {
    solve,
    curriculum: {
      applied: Boolean(match),
      subjectId: match?.subjectId,
      topicId: match?.topicId,
      subjectName: match?.subjectName,
      topicName: match?.topicName,
    },
  };
}

export type WeakTopicAggregate = {
  konuBasligi: string;
  subjectName?: string;
  topicName?: string;
  count: number;
  avgZorluk: number;
  hataKodlari: string[];
  /** En sık görülen hata tipi (derin analiz) */
  baskinHataTipi?: string;
};

export type CoachDeepErrorAlert = {
  eksikKavram: string;
  konuBasligi: string;
  count: number;
  baskinHataTipi: string;
  sonTavsiye: string;
  message: string;
};

const KAVRAM_TIPLER = new Set([
  "Kavram Yanılgısı",
  "KAVRAM_YANILGISI",
  "kavram yanılgısı",
]);

/** Koç paneli — Onyx derin analiz uyarıları (son 7 gün) */
export async function getCoachDeepErrorAlerts(
  studentId: string,
  studentDisplayName: string,
  days = 7
): Promise<CoachDeepErrorAlert[]> {
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  const solves = (await listOnyxSolvesByStudent(studentId, 120)).filter(
    (s) => new Date(s.createdAt).getTime() >= since && s.eksikKavram?.trim()
  );

  const byKavram = new Map<
    string,
    {
      count: number;
      tips: Map<string, number>;
      konu: string;
      sonTavsiye: string;
    }
  >();

  for (const s of solves) {
    const key = (s.eksikKavram ?? s.konuBasligi).trim();
    if (!key) continue;
    const prev = byKavram.get(key) ?? {
      count: 0,
      tips: new Map<string, number>(),
      konu: s.konuBasligi,
      sonTavsiye: s.tavsiyeEdilenAksiyon ?? "Konu Tekrarı",
    };
    prev.count += 1;
    const tip = s.hataTipi ?? s.hataKodu;
    prev.tips.set(tip, (prev.tips.get(tip) ?? 0) + 1);
    if (s.tavsiyeEdilenAksiyon) prev.sonTavsiye = s.tavsiyeEdilenAksiyon;
    byKavram.set(key, prev);
  }

  const alerts: CoachDeepErrorAlert[] = [];

  for (const [eksikKavram, agg] of byKavram) {
    if (agg.count < 2) continue;
    let baskinHataTipi = "Kavram Yanılgısı";
    let max = 0;
    for (const [tip, c] of agg.tips) {
      if (c > max) {
        max = c;
        baskinHataTipi = tip;
      }
    }
    const kavramSayisi = [...agg.tips.keys()].filter((t) =>
      KAVRAM_TIPLER.has(t)
    ).length;
    const isKavram =
      KAVRAM_TIPLER.has(baskinHataTipi) || kavramSayisi > 0;

    if (!isKavram && agg.count < 3) continue;

    alerts.push({
      eksikKavram,
      konuBasligi: agg.konu,
      count: agg.count,
      baskinHataTipi,
      sonTavsiye: agg.sonTavsiye,
      message: `Uyarı: ${studentDisplayName} bu hafta "${eksikKavram}" ile ilgili ${agg.count} zor soruda ${baskinHataTipi.toLowerCase()} tespit edildi. Onyx AI tarafından ${agg.sonTavsiye.toLowerCase()} reçetesi yazıldı.`,
    });
  }

  return alerts.sort((a, b) => b.count - a.count).slice(0, 6);
}

/** Koç paneli — öğrencinin zayıf konu özeti */
export async function getWeakTopicsFromSolves(
  studentId: string,
  limit = 8
): Promise<WeakTopicAggregate[]> {
  const solves = await listOnyxSolvesByStudent(studentId, 100);
  const map = new Map<string, WeakTopicAggregate>();

  for (const s of solves) {
    const key = s.topicId
      ? `${s.subjectId}::${s.topicId}`
      : s.konuBasligi.toLocaleLowerCase("tr");
    const prev = map.get(key);
    if (prev) {
      prev.count += 1;
      prev.avgZorluk =
        (prev.avgZorluk * (prev.count - 1) + s.zorlukSeviyesi) / prev.count;
      if (!prev.hataKodlari.includes(s.hataKodu)) {
        prev.hataKodlari.push(s.hataKodu);
      }
    } else {
      map.set(key, {
        konuBasligi: s.konuBasligi,
        subjectName: s.subjectName,
        topicName: s.topicName,
        count: 1,
        avgZorluk: s.zorlukSeviyesi,
        hataKodlari: [s.hataKodu],
        baskinHataTipi: s.hataTipi,
      });
    }
    const entry = map.get(key)!;
    if (s.hataTipi && !entry.baskinHataTipi) {
      entry.baskinHataTipi = s.hataTipi;
    }
  }

  return [...map.values()]
    .sort((a, b) => b.count - a.count || b.avgZorluk - a.avgZorluk)
    .slice(0, limit);
}

export { listOnyxSolvesByStudent };
