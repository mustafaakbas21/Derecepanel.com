import { getMufredatPack, getDerslerByTrack, getDersById } from "@/lib/mufredat";
import type { MufredatDers } from "@/lib/mufredat/types";
import { matchTopicLabel, normalizeTopicText } from "@/lib/exams/topic-match";
import type { MatchedMufredatTopic } from "@/lib/onyx/match-topic-from-title";
import type { OnyxDeepErrorDiagnosis } from "@/lib/onyx/deep-error-diagnosis";
import type { OnyxSolveStructured } from "@/lib/onyx/solve-types";

export type CurriculumRagContext = {
  /** En olası ders (snap önceliği) */
  primarySubjectId: string;
  primarySubjectName: string;
  /** Listeye dahil ders kimlikleri */
  subjectIds: string[];
  listText: string;
  topicCount: number;
};

const SUBJECT_KEYWORDS: Record<string, string[]> = {
  turkce: ["türkçe", "turkce", "paragraf", "dil bilgisi", "anlatım", "sözcük", "sozcuk", "cümle", "cumle", "edebi"],
  edebiyat: ["edebiyat", "şiir", "siir", "roman", "hikaye", "metin tür", "sanat", "edebi"],
  matematik: ["matematik", "mat ", " mat", "geometri", "trigonometri", "türev", "turev", "integral", "limit", "fonksiyon", "denklem", "üs", "uslu", "kök", "kok", "eşitsizlik", "esitsizlik", "olasılık", "olasilik"],
  fizik: ["fizik", "kuvvet", "hareket", "elektrik", "manyetik", "optik", "basınç", "basinc", "enerji", "dalga"],
  kimya: ["kimya", "asit", "baz", "mol", "tepkime", "organik", "periyodik", "elektron"],
  biyoloji: ["biyoloji", "hücre", "hucre", "genetik", "ekoloji", "canlı", "canli", "dna", "mitoz", "mayoz"],
  tarih: ["tarih", "osmanlı", "osmanli", "inkılap", "inkilap", "atatürk", "ataturk", "cumhuriyet", "savaş", "savas", "devrim"],
  cografya: ["coğrafya", "cografya", "harita", "iklim", "nüfus", "nufus", "yerleşme", "yerlesme", "bölge", "bolge"],
  felsefe: ["felsefe", "filozof", "bilgi felsefesi", "varlık", "varlik", "ahlak"],
  mantik: ["mantık", "mantik", "önerme", "onerme", "kıyas", "kiyas", "sembolik"],
  psikoloji: ["psikoloji", "algı", "algi", "bellek", "öğrenme", "ogrenme", "kişilik", "kisilik"],
  sosyoloji: ["sosyoloji", "toplum", "kültür", "kultur", "sosyal"],
  din: ["din kültür", "din kultur", "islam", "ayet", "hadis", "ibadet", "ahlak"],
  ingilizce: ["ingilizce", "english", "ydt", "grammar", "vocabulary", "reading"],
};

function normalizeTr(s: string): string {
  return normalizeTopicText(s);
}

function scoreSubject(ders: MufredatDers, text: string): number {
  const hay = normalizeTr(text);
  if (!hay) return 0;

  let score = 0;
  const dersName = normalizeTr(ders.dersAdi);
  if (hay.includes(dersName)) score += 12;

  for (const [key, words] of Object.entries(SUBJECT_KEYWORDS)) {
    if (!dersName.includes(key)) continue;
    for (const w of words) {
      if (hay.includes(normalizeTr(w))) score += 3;
    }
  }

  if (hay.includes("tyt") && getMufredatPack().TYT.some((d) => d.id === ders.id)) {
    score += 2;
  }
  if (hay.includes("ayt") && getMufredatPack().AYT.some((d) => d.id === ders.id)) {
    score += 2;
  }

  for (const konu of ders.konular) {
    const kn = normalizeTr(konu.ad);
    if (kn.length >= 5 && hay.includes(kn)) score += 9;
    else if (kn.length >= 3) {
      const words = kn.split(" ").filter((w) => w.length >= 4);
      for (const w of words) {
        if (hay.includes(w)) score += 2;
      }
    }
  }

  return score;
}

function formatSubjectTopicList(ders: MufredatDers): string {
  const track = getMufredatPack().TYT.some((d) => d.id === ders.id) ? "TYT" : "AYT";
  const lines = ders.konular.map((k, i) => `  ${i + 1}. ${k.ad}`);
  return `${track} — ${ders.dersAdi} (dersId: ${ders.id}):\n${lines.join("\n")}`;
}

function pickSubjectsForPrompt(prompt: string, maxSubjects = 2): MufredatDers[] {
  const all = getDerslerByTrack("ALL");
  const scored = all
    .map((ders) => ({ ders, score: scoreSubject(ders, prompt) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return all;
  if (scored[0]!.score >= 8) {
    return scored.slice(0, maxSubjects).map((x) => x.ders);
  }
  return all;
}

/** Görsel soru çözümü — tam resmi müfredat (OCR sonrası konu eşleştirme) */
export function buildCurriculumRagForVisionSolve(): CurriculumRagContext {
  const subjects = getDerslerByTrack("ALL");
  let topicCount = 0;
  const body = subjects
    .map((d) => {
      topicCount += d.konular.length;
      return formatSubjectTopicList(d);
    })
    .join("\n\n");

  const listText = `[RESMİ YKS MÜFREDAT LİSTESİ — TAM PAKET (TYT + AYT)]
Kaynak: data/yks-mufredat.json — DerecePanel tek resmi müfredat paketi.
Soru hangi dersten olursa olsun (Türkçe, Tarih, Coğrafya, Felsefe, Din, Matematik, Geometri, Fizik, Kimya, Biyoloji, Edebiyat, Mantık, Psikoloji, Sosyoloji, İngilizce…) dersAdi, konuAdi ve eksikKavram alanlarına YALNIZCA aşağıdaki listeden BİREBİR kopyala.
Paragraf sorusu → Türkçe konuları; harita → Coğrafya; tarih metni → Tarih; denklem → Matematik. Uydurma konu adı YASAK.

${body}

[LİSTE SONU]`;

  const primary = subjects[0]!;

  return {
    primarySubjectId: primary.id,
    primarySubjectName: primary.dersAdi,
    subjectIds: subjects.map((d) => d.id),
    listText,
    topicCount,
  };
}

/** Soru çözümü / hata teşhisi için resmi müfredat listesi metni */
export function buildCurriculumRagForSolve(prompt: string): CurriculumRagContext {
  const subjects = pickSubjectsForPrompt(prompt);
  const subjectIds = subjects.map((d) => d.id);
  let topicCount = 0;

  const body = subjects
    .map((d) => {
      topicCount += d.konular.length;
      return formatSubjectTopicList(d);
    })
    .join("\n\n");

  const listText = `[RESMİ YKS MÜFREDAT LİSTESİ]
Kaynak: data/yks-mufredat.json — DerecePanel tek resmi müfredat paketi (@/lib/mufredat).
eksikKavram alanına YALNIZCA aşağıdaki satırlardan bir konu adını BİREBİR kopyala (kendi kelimenle uydurma YASAK).
Tam eşleşme yoksa en yakın kapsayıcı ana konuyu seç.

${body}

[LİSTE SONU]`;

  const primary = subjects[0]!;

  return {
    primarySubjectId: primary.id,
    primarySubjectName: primary.dersAdi,
    subjectIds,
    listText,
    topicCount,
  };
}

/** AI çıktısını resmi konu adına kilitle */
export function resolveOfficialMufredatTopic(
  hint: string,
  subjectIds?: string[]
): MatchedMufredatTopic | null {
  const needle = String(hint ?? "").trim();
  if (needle.length < 2) return null;

  const subjects = (subjectIds?.length
    ? subjectIds.map((id) => getDersById(id)).filter((d): d is MufredatDers => Boolean(d))
    : getDerslerByTrack("ALL")) as MufredatDers[];

  const needleNorm = normalizeTr(needle);

  for (const ders of subjects) {
    for (const konu of ders.konular) {
      if (normalizeTr(konu.ad) === needleNorm) {
        return {
          subjectId: ders.id,
          topicId: konu.id,
          subjectName: ders.dersAdi,
          topicName: konu.ad,
        };
      }
    }
  }

  for (const ders of subjects) {
    const topicId = matchTopicLabel(
      needle,
      ders.konular.map((k) => ({ id: k.id, label: k.ad }))
    );
    if (topicId) {
      const konu = ders.konular.find((k) => k.id === topicId);
      if (konu) {
        return {
          subjectId: ders.id,
          topicId: konu.id,
          subjectName: ders.dersAdi,
          topicName: konu.ad,
        };
      }
    }
  }

  return null;
}

export function snapDiagnosisToOfficialCurriculum(
  diagnosis: OnyxDeepErrorDiagnosis,
  rag?: Pick<CurriculumRagContext, "subjectIds">
): OnyxDeepErrorDiagnosis {
  const match = resolveOfficialMufredatTopic(
    diagnosis.hataAnalizi.eksikKavram,
    rag?.subjectIds
  );
  if (!match) return diagnosis;

  return {
    ...diagnosis,
    hataAnalizi: {
      ...diagnosis.hataAnalizi,
      eksikKavram: match.topicName,
    },
    soruOnAnalizi: {
      ...diagnosis.soruOnAnalizi,
      dersAdi: match.subjectName,
      konuAdi: match.topicName,
      kavramAdi:
        diagnosis.soruOnAnalizi.kavramAdi === diagnosis.soruOnAnalizi.konuAdi
          ? match.topicName
          : diagnosis.soruOnAnalizi.kavramAdi,
    },
    mufredatEslestirme: {
      subjectId: match.subjectId,
      topicId: match.topicId,
      subjectName: match.subjectName,
      topicName: match.topicName,
    },
  };
}

/** Parse sonrası konu başlığı + derin teşhisi müfredata kilitle */
export function enforceCurriculumOnSolveStructured(
  structured: OnyxSolveStructured,
  rag?: Pick<CurriculumRagContext, "subjectIds">
): OnyxSolveStructured {
  const hint =
    structured.deepDiagnosis?.hataAnalizi.eksikKavram ?? structured.konu_basligi;
  const match = resolveOfficialMufredatTopic(hint, rag?.subjectIds);
  if (!match) return structured;

  const next: OnyxSolveStructured = {
    ...structured,
    konu_basligi: match.topicName,
  };

  if (structured.deepDiagnosis) {
    next.deepDiagnosis = snapDiagnosisToOfficialCurriculum(
      structured.deepDiagnosis,
      rag
    );
  }

  return next;
}

export function mergeCurriculumIntoStudentContext(
  contextData: unknown,
  rag: CurriculumRagContext
): Record<string, unknown> {
  const base =
    contextData && typeof contextData === "object" && !Array.isArray(contextData)
      ? { ...(contextData as Record<string, unknown>) }
      : {};
  return {
    ...base,
    mufredatKisitli: true,
    mufredatRag: {
      primarySubjectId: rag.primarySubjectId,
      primarySubjectName: rag.primarySubjectName,
      subjectIds: rag.subjectIds,
      topicCount: rag.topicCount,
      ozetMetin: rag.listText,
    },
  };
}

export function isSolveCurriculumAction(action: string): boolean {
  return action === "soru-fotografi" || action === "soru-metin";
}
