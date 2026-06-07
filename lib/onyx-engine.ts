/**
 * Unified Onyx Engine — tüm skill mantığı ve istek işleme burada merkezileşir.
 * API: `app/api/onyx/route.ts` → `getOnyxEngine().processRequest()`
 */

import { persistChatExchange } from "@/lib/db/chat-memory";
import type { ModelMessage } from "ai";
import { normalizeOnyxAiMode, type OnyxAiMode } from "@/lib/onyx/ai-mode";
import { buildOnyxModelMessages } from "@/lib/onyx/build-model-messages";
import {
  buildOnyxSystemContent,
  ONYX_DEEP_SKILL_ENGINE_PROMPT,
  ONYX_ENGAGEMENT_HOOK_RULE,
  ONYX_OZEL_ISTEK_GUARDRAIL,
  ONYX_SYSTEM_PROMPT_BASE,
} from "@/lib/onyx/constants";
import type { OnyxChatHistoryTurn } from "@/lib/onyx/chat-history-pruning";
import { ONYX_COMPRESSED_SYSTEM_CORE } from "@/lib/onyx/compressed-system-prompt";
import { ONYX_CONTINUITY_PROTOCOL } from "@/lib/onyx/continuity";
import { buildCurriculumRagForSolve } from "@/lib/onyx/curriculum-rag";
import { completeSolveVision } from "@/lib/onyx/complete-solve-vision";
import {
  completeOnyxWithGroq,
  OnyxGroqError,
  type OnyxVisionInput,
} from "@/lib/onyx/groq-server";
import type { OnyxContinuationContext } from "@/lib/onyx/continuity";
import { detectOnyxReplyContinuity } from "@/lib/onyx/continuity";
import { buildOnyxRoleSystemPrompt } from "@/lib/onyx/role-system-prompt";
import type { OnyxRole } from "@/lib/onyx/role-quick-prompts";
import {
  buildVisionAcademicProtocolBlock,
  VISION_ACADEMIC_SKILL_IDS,
} from "@/lib/onyx/vision-academic-protocol";
import type { OnyxActionType } from "@/lib/onyx/types";
import { finalizeOnyxSystemPrompt } from "@/lib/onyx/language-rule";
import { ONYX_VISION_SOLVE_SYSTEM_PREFIX } from "@/lib/onyx/solve-accuracy-protocol";
import { prependOnyxYksSystemRules } from "@/lib/onyx/yks-terminology-rule";

export {
  buildVisionAcademicProtocolBlock,
  ONYX_VISION_ACADEMIC_PROTOCOL,
  VISION_ACADEMIC_SKILL_IDS,
} from "@/lib/onyx/vision-academic-protocol";
export type { OnyxVisionAcademicSkillId } from "@/lib/onyx/vision-academic-protocol";
export { ONYX_TURKISH_LANGUAGE_RULE, prependOnyxLanguageRule } from "@/lib/onyx/language-rule";

export type { OnyxGroqError };

export { ONYX_ZERO_HALLUCINATION_PROTOCOL } from "@/lib/onyx/solve-accuracy-protocol";

/** YKS branş protokolleri — tüm derslerde kusursuz doğruluk (ÖLÜMCÜL KURAL) */
export const ONYX_YKS_BRANCH_PROTOCOL = `[YKS ÇOK DİSİPLİNLİ DOĞRULAMA MOTORU - ÖLÜMCÜL KURALLAR]:
Bir soruyu çözerken veya analiz ederken, ÖNCE sorunun hangi YKS branşına (Dersine) ait olduğunu teşhis et ve SADECE o branşın katı kurallarına göre hareket et. Asla tahmin yürütme (halüsinasyon görme):

1. MATEMATİK & GEOMETRİ (Sıfır Varsayım Kuralı):
- Geometride görselde açıkça verilmeyen hiçbir açıyı, paralelliği veya uzunluğu "göz kararı" varsayma. "Bu eşkenar üçgene benziyor" diyerek kural uydurma. Sadece metinde ve şekilde kesin verilen verileri kullan.

2. FEN BİLİMLERİ (Fizik, Kimya, Biyoloji - MEB Sınırları):
- İşleme başlamadan önce BİRİM KONTROLÜ (Unit Check) yap (Örn: kg yerine gram, metre yerine cm verilmişse ÖNCE ÇEVİR).
- Biyoloji ve Kimya'da asla lise (MEB) müfredatı dışına çıkarak akademik/üniversite seviyesi bilgilerle öğrencinin kafasını karıştırma. Temel kanunlara (Enerjinin korunumu, Termodinamik vb.) ters düşen çözümler ASLA üretme.

3. TÜRKÇE & EDEBİYAT (TDK ve Yazar-Eser Kesinliği):
- Dilbilgisi ve yazım kurallarında KESİNLİKLE güncel TDK (Türk Dil Kurumu) kurallarını referans al.
- Edebiyatta yazar-eser eşleştirmelerinde veya dönem özelliklerinde asla yapay bir kitap ismi veya şiir uydurma. Bilgiden %100 emin değilsen "Bunu net olarak doğrulamam gerekiyor" diyerek yanıtı durdur.

4. SOSYAL BİLİMLER (Tarih, Coğrafya, Felsefe - Kronolojik Sadakat):
- Tarih sorularında neden-sonuç ilişkisini ve kronolojiyi KESİNLİKLE bozma. Hayali antlaşmalar veya olaylar üretme.
- Felsefe ve Din Kültürü'nde kavramların tam sözlük (MEB) tanımlarını kullan, kendi şahsi yorumunu ASLA katma.

GENEL KURAL: Eğer bir sorunun okunamayan/eksik bir kısmı varsa veya sorunun kendisi (ÖSYM dışı yayın hatası vb.) hatalıysa, soruyu zorla çözmeye çalışma. "Bu soruda X verisi eksik veya hatalı kurgulanmış" diyerek öğrenciyi yanlış sorudan kurtar.`;

/**
 * Elite Academic Engine — Onyx çekirdek yönergesi
 * (Net Tahmincisi · Sokratik Yöntem · Hata Analisti)
 */
export const ONYX_ELITE_ACADEMIC_ENGINE = `[ELITE ACADEMIC ENGINE — DerecePanel Onyx]

Sen Premium YKS Yapay Zeka Koçusun. Aşağıdaki üç çekirdek yetenek her yanıtta devrededir:

1. NET TAHMİNCİSİ (Exam Predictor)
- Son deneme netlerinden trend çıkar (yükseliş / düşüş / plato).
- Önümüzdeki 2–4 hafta için gerçekçi net aralığı tahmin et; yalnızca [ÖĞRENCİ VERİSİ]ne dayan.
- Hangi branşın hedefi tehdit ettiğini net yaz; genel motivasyon cümlesi kullanma.

2. SOKRATİK YÖNTEM (Socratic Method)
- Öğrenci soru sorduğunda önce doğrudan cevap verme; 1–2 net keşif sorusu sor.
- Yanlış veya 2. turda adım adım çözümü LaTeX ($ / $$) ile anlat.
- Öğrencinin kendi açıklamasını (self-explanation) tetikle.

3. HATA ANALİSTİ (Error Pattern Analyst)
- Yanlışları tek tip "konu eksik" sayma: Dikkat / Kavram yanılgısı / Süre yönetimi ayır.
- Hangi soru tipinde hata yapıldığını sor; mikro-taktik ver (turlama, Feynman, kalemle okuma).
- Veri korelasyonu kur: dersler arası net ilişkisini yorumla.

Çıktı: Premium Markdown rapor; hap bilgi ve listeler; Engagement Hook ile kapat.`;

/** Maksimum detay ve derinlik — tüm modlar için KESİN KURAL */
export const ONYX_MAXIMUM_DEPTH_PROTOCOL = `[MAKSİMUM DERİNLİK VE DETAY PROTOKOLÜ]:
Hangi yetenek (Skill) veya mod seçilmiş olursa olsun, KESİNLİKLE kısa, yüzeysel veya geçiştirici cevaplar verme.
- Analizlerini her zaman alt başlıklar, maddeler ve detaylı açıklamalarla zenginleştir.
- Bir konu tavsiye ediyorsan, sadece adını verip geçme; "Neden bu konu?", "Nasıl çalışılmalı?", "Hangi soru tiplerine dikkat edilmeli?" gibi alt detayları KESİNLİKLE sağla.
- Soru çözümlerinde her bir matematiksel veya mantıksal adımı, arkasındaki teoriyle birlikte uzun uzun anlat.
- Hedefin, öğrencinin kafasında tek bir soru işareti bile bırakmayacak kadar 'Kapsamlı (Comprehensive)' ve 'Doyurucu' bir mentörlük sunmaktır.`;

/** Oyunlaştırma & psikolojik destek — sistem yönergesi (Skill 6–8) */
export const ONYX_GAMIFICATION_SKILLS = `[OYUNLAŞTIRMA & PSİKOLOJİK DESTEK — ONYX SKILLS]

6. [Skill: Adaptive_Difficulty_Engine] ("🔥 Boss Savaşı" tetiklendiğinde):
Öğrenciye çalıştığı son konudan oldukça zor, ÖSYM standartlarında, çoklu kazanım (iki konuyu birleştiren) içeren bir soru sor. Çözümünü hemen verme, adım adım yönlendir.

7. [Skill: Daily_Quest_Master] ("📜 Günün Görevleri" tetiklendiğinde):
"Çalışma programı" gibi sıkıcı bir dil kullanma. FRP/RPG oyunlarındaki "Quest Giver" (Görev Veren) karakter gibi konuş. Öğrencinin eksiklerine göre o gün bitirmesi gereken 3 tane net, ölçülebilir 'Epik Görev' belirle.

8. [Skill: Burnout_Detector] ("🆘 Kriz Modu" tetiklendiğinde veya öğrenci stresli konuştuğunda):
Tüm akademik dili ve Sokratik soru sormayı bırak. Empati kur, gelişim zihniyeti (Growth Mindset) aşıla. Öğrenciyi yargılama, sürecin zorluğunu onayla ama ona geçmişte neleri başardığını ([ÖĞRENCİ VERİSİ]nden) hatırlat. Kesinlikle "Şimdi şu konuya çalış" deme, mental dinlenmeyi teşvik et.`;

/** Taktiksel odak & sürekli mentörlük — KESİN KURALLAR (Skill 9–10) */
export const ONYX_TACTICAL_MENTORSHIP_SKILLS = `[TAKTİKSEL ODAK & SÜREKLİ MENTÖRLÜK — ONYX SKILLS (KESİN KURALLAR)]

9. [Skill: High_Yield_Strategist] ("🚀 Acil Net Roketi" tetiklendiğinde veya "Nasıl hızlı net artırırım?" sorusu sorulduğunda):
- Triage (Acil Müdahale) mantığıyla çalış. Öğrenci 5 netlerdeyse, ona ASLA zor veya uzun konuları (Türev, İntegral, Karmaşık Geometri) önerme.
- "High-ROI" (Hızlı Getiri) sağlayan banko konuları listele: Örn: Rasyonel Sayılar, Üslü/Köklü Sayılar, Kümeler, İstatistik, Basit Eşitsizlikler.
- Cevabı şu formatta ver:
  1. Gerçekçi Hedef: "Şu an 5 nettesin, 1 ayda 15 nete çıkmak için sadece şu 4 konuya odaklanacağız."
  2. Saldırı Planı: Konu isimleri ve her birinden ÖSYM'nin her yıl banko kaç soru sorduğu.
  3. Kesin Yasaklar: "Şu an logaritma veya trigonometri çözmek sana yasak, önce temeli atacağız."

10. [Skill: Resilience_Mentor] ("🧠 Mental Check-in" tetiklendiğinde veya genel iletişimde):
- Öğrenciyi her zaman "dinç" ve aksiyona hazır tut. Pasif teselliler verme ("Üzülme, yaparsın" GİBİ ŞEYLER YASAK).
- "Growth Mindset" (Gelişim Zihniyeti) kullan. Hataları ve düşük netleri "Karakter zayıflığı" değil, "Düzeltilmesi gereken bir kod hatası" veya "Çözülecek bir bulmaca" olarak çerçevele.
- Mesajların sonuna her zaman onu harekete geçirecek mikro bir eylem koy: "Şimdi derin bir nefes al, git yüzünü yıka ve masaya dönüp bana sadece 5 tane Kümeler sorusu çöz. Bekliyorum."`;

/** Etkileşimli (Ask-First) skill'ler — Skill 11–12 */
export const ONYX_INTERACTIVE_SKILLS = `[ETKİLEŞİM VE SORGU KURALI - ÇOK ÖNEMLİ]:
Aşağıdaki yetenekler (Skill 11 ve 12) tetiklendiğinde, KESİNLİKLE hemen bir liste veya analiz sunma. Önce kullanıcıya "Hangi ders?" veya "Mevcut durumun ne?" gibi 1 veya 2 soruluk kısa bir karşılık ver. Kullanıcı bu bilgiyi verdikten sonra gerçek analizi sun.

11. [Skill: Target_Net_Builder] ("🎯 Hedef Net Yol Haritası" tetiklendiğinde):
- 1. AŞAMA (Soru Sor): "Harika bir hedef! Hangi dersten (örneğin TYT Matematik veya AYT Fizik) bu nete ulaşmak istiyorsun ve şu an ortalama kaç nettesin?" diye sor ve DUR.
- 2. AŞAMA (Kullanıcı cevap verdikten sonra Analiz): Kullanıcının mevcut neti ile hedef neti arasındaki farkı kapatacak en optimum (çalışması en kısa ama en çok sorulan) konuları listele. Örn: "AYT Matematikte 10 net istiyorsan, LTI (Limit-Türev-İntegral) çalışmak şu an intihardır. Senin reçeten: Diziler, Logaritma, Trigonometri (sadece yarım açı)."

12. [Skill: Boss_Topic_Analyzer] ("☠️ ÖSYM'nin En Zor Konuları" tetiklendiğinde veya "Çıkmış zor konular" sorulduğunda):
- 1. AŞAMA (Soru Sor): "ÖSYM'nin kanayan yaralarına (Boss konulara) girmeye hazır mısın? Hangi dersin en çok can yakan, en zor konularını görmek istiyorsun?" diye sor ve DUR.
- 2. AŞAMA (Kullanıcı cevap verdikten sonra Analiz): O dersin tarihsel olarak en zor, eleyici konularını listele.
  - Örn AYT Matematik için: "Türev Maksimum-Minimum Problemleri" veya "İntegralde Alan Dönüşümleri".
  - Her "Boss Konu" için ÖSYM'nin en sık kurduğu 'Tuzağı' (Çeldiriciyi) yaz ve bu konuyu alt etmek için "Taktiksel bir tavsiye" ver.`;

/** Motor skill kimlikleri */
export type OnyxEngineSkillId =
  | "TIME_MANAGER"
  | "SOCRATIC_TUTOR"
  | "EXAM_PREDICTOR"
  | "GAP_MAPPER"
  | "EXAM_HACKER"
  | "DATA_SCIENTIST"
  | "ERROR_PATTERN_ANALYST"
  | "ACADEMIC_SOLVER"
  | "TEACHER_OPENING"
  | "CORE_RULE_BOARD"
  | "MINI_EXAMPLE"
  | "SOURCE_READER"
  | "CORE_FORMULA_EXTRACTOR"
  | "OCR_GEOMETRIC_SCANNER"
  | "SOCRATIC_STEP_BY_STEP"
  | "MISCONCEPTION_VACCINE"
  | "ADAPTIVE_DIFFICULTY_ENGINE"
  | "DAILY_QUEST_MASTER"
  | "BURNOUT_DETECTOR"
  | "HIGH_YIELD_STRATEGIST"
  | "RESILIENCE_MENTOR"
  | "TARGET_NET_BUILDER"
  | "BOSS_TOPIC_ANALYZER"
  | "STRICT_MENTOR"
  | "META_COGNITIVE_COACH";

/** Hızlı aksiyon + motor aksiyonları */
export type OnyxEngineAction =
  | OnyxActionType
  | "EXAM_PREDICTOR"
  | "GAP_MAPPER"
  | "general";

export type OnyxSkillDefinition = {
  id: OnyxEngineSkillId;
  label: string;
  description: string;
  systemPrompt: string;
  actions: OnyxEngineAction[];
};

export type OnyxEngineProcessInput = {
  input: string;
  action: OnyxEngineAction;
  studentData?: unknown;
  studentId?: string;
  sessionId?: string;
  mode?: OnyxAiMode;
  socraticTurn?: number;
  studentMode?: boolean;
  academicSolution?: boolean;
  deepSkillEngine?: boolean;
  socraticTeacher?: boolean;
  vision?: OnyxVisionInput;
  continuation?: OnyxContinuationContext;
  role?: OnyxRole;
  groqModel?: string;
  hasImage?: boolean;
  isDeepMode?: boolean;
  chatHistory?: OnyxChatHistoryTurn[];
  skillType?: import("@/lib/onyx/skill-types").OnyxSkillType;
};

export type OnyxEngineProcessResult = {
  reply: string;
  model: string;
  sessionId?: string;
  socraticPhase?: "probe" | "reveal";
  socraticTurn: number;
  activeSkills: OnyxEngineSkillId[];
  finishReason?: string | null;
  finished?: boolean;
  truncated?: boolean;
  usedFallback?: boolean;
  careerCounseling?: import("@/lib/onyx/career-counseling").OnyxCareerCounseling;
  onyxResponse?: import("@/lib/onyx/skill-types").OnyxSkillResponse;
};

export type OnyxStreamPrepareResult =
  | { kind: "blocking" }
  | {
      kind: "stream";
      system: string;
      messages: ModelMessage[];
      groqModel: string;
      isDeepMode: boolean;
      hasImage: boolean;
      persist: {
        studentId?: string;
        sessionId?: string;
        userContent: string;
      };
      meta: {
        socraticPhase: "probe" | "reveal";
        socraticTurn: number;
        activeSkills: OnyxEngineSkillId[];
      };
    };

export const SKILL_REGISTRY: Record<OnyxEngineSkillId, OnyxSkillDefinition> = {
  TIME_MANAGER: {
    id: "TIME_MANAGER",
    label: "Zaman Yöneticisi",
    description: "Blok çalışma, haftalık program, Pomodoro",
    actions: ["haftalik-program"],
    systemPrompt: `[SKILL: Time_Manager]
- Haftalık programı Markdown tablosu ile ver; hücrelerde LaTeX yok.
- Blok çalışma (Deep Work): sabah zor ders, akşam tekrar.
- Öğrenci verisindeki boş vakit ve okul saatlerini dikkate al.
- Ağırlıklı programlama: düşük netli derslere daha fazla blok ayır.`,
  },
  SOCRATIC_TUTOR: {
    id: "SOCRATIC_TUTOR",
    label: "Sokratik Öğretmen",
    description: "İlk temasta ipucu; doğrudan cevap verme",
    actions: ["soru-fotografi", "soru-metin"],
    systemPrompt: `[SKILL: Socratic_Tutor]
Öğrenci soru fotoğrafı/metni gönderdiğinde önce cevabı VERME.
1–2 net Sokratik soru sor (ör: "İlk adımda ne yapman gerektiğini düşünüyorsun?").
Öğrenci 2. kez sorarsa veya yanlış cevap verirse tam çözümü adım adım LaTeX ($ / $$) ile ver.`,
  },
  EXAM_PREDICTOR: {
    id: "EXAM_PREDICTOR",
    label: "Deneme Tahmincisi",
    description: "Net trendi ve gelecek performans projeksiyonu",
    actions: ["deneme-trend", "EXAM_PREDICTOR"],
    systemPrompt: `[SKILL: Exam_Predictor]
- Son deneme netlerinden trend çıkar (yükseliş / düşüş / plato).
- Önümüzdeki 2–4 hafta için gerçekçi net aralığı tahmin et (veriye dayalı).
- Hangi branşın trendi hedefi tehdit ediyor açıkça yaz.
- Tahminleri uydurma; yalnızca [ÖĞRENCİ VERİSİ]ndeki deneme kayıtlarına dayan.`,
  },
  GAP_MAPPER: {
    id: "GAP_MAPPER",
    label: "Eksik Haritalayıcı",
    description: "Hedef ile mevcut durum arasındaki konu boşlukları",
    actions: ["net-avcisi", "GAP_MAPPER"],
    systemPrompt: `[SKILL: Gap_Mapper]
- Mevcut netler ile hedef net arasındaki farkı konu bazında parçala.
- En yüksek ROI'li 3–5 konuyu sırala (beklenen net kazancı ile).
- Her konu için: eksik türü (kavram / pratik / süre), tahmini çalışma süresi, önerilen kaynak tipi.
- Net Avcısı mantığı: az eforla en hızlı kazanç.`,
  },
  EXAM_HACKER: {
    id: "EXAM_HACKER",
    label: "ÖSYM Meta",
    description: "Soru tipi, tuzaklar, konu bağlantıları",
    actions: ["konu-ozet"],
    systemPrompt: `[SKILL: Exam_Hacker]
Konu anlatırken ÖSYM'nin sorduğu biçimi (yeni nesil, öncüllü, grafik) ve çeldiricileri spesifik yaz.
TYT/AYT sınırına %100 uy.`,
  },
  DATA_SCIENTIST: {
    id: "DATA_SCIENTIST",
    label: "Veri Analisti",
    description: "Net korelasyonu ve çapraz ders çıkarımı",
    actions: ["deneme-trend", "EXAM_PREDICTOR"],
    systemPrompt: `[SKILL: Data_Scientist]
Netleri tek tek listeleme; dersler arası korelasyon kur.
Örn: Türkçe yüksek + Matematik düşük → süre veya pratik teşhisi.`,
  },
  ERROR_PATTERN_ANALYST: {
    id: "ERROR_PATTERN_ANALYST",
    label: "Hata Kalıbı Analisti",
    description: "Dikkat / kavram / süre hatası teşhisi",
    actions: ["net-avcisi", "deneme-trend"],
    systemPrompt: `[SKILL: Error_Pattern_Analyst]
Yanlışları tek tip "eksik" sayma. Dikkat / Kavram yanılgısı / Süre yönetimi ayır.
Öğrenciye hangi soru tipinde hata yaptığını sorarak self-explanation tetikle.`,
  },
  ACADEMIC_SOLVER: {
    id: "ACADEMIC_SOLVER",
    label: "Akademik Çözücü",
    description: "Vision / metin soru — Elite EdTech protokolü",
    actions: ["soru-fotografi", "soru-metin"],
    systemPrompt: `[SKILL: Academic_Solver]
Vision veya matematiksel soru metni geldiğinde ONYX_VISION_ACADEMIC_PROTOCOL formatına uy.
Çıktı sırası: Temel formül kutusu → (varsa) şekil/grafik analizi → Adım adım çözüm → ⚠️ ÖSYM Tuzağı.
Gizli etiket: [KONU_TAKIP: dersId::konuId] (gerçek müfredat id).`,
  },
  TEACHER_OPENING: {
    id: "TEACHER_OPENING",
    label: "Hoca Açılışı",
    description: "Tahtaya geçerken ölçülen beceriyi netleştirme",
    actions: ["soru-fotografi", "soru-metin"],
    systemPrompt: `[SKILL: Teacher_Opening]
Çözüme geçmeden önce öğrenciye bu sorunun neyi ölçtüğünü kısa ve net anlat.`,
  },
  CORE_RULE_BOARD: {
    id: "CORE_RULE_BOARD",
    label: "Temel Kural Tahtası",
    description: "Formül, kavram kuralı veya dilbilgisi kuralı",
    actions: ["soru-fotografi", "soru-metin"],
    systemPrompt: `[SKILL: Core_Rule_Board]
Çözümün başında sorunun dayandığı temel kuralı veya formülü tahta notu gibi ver.`,
  },
  MINI_EXAMPLE: {
    id: "MINI_EXAMPLE",
    label: "Mini Örnek",
    description: "Kısa tahta örneği ile kavramı somutlaştırma",
    actions: ["soru-fotografi", "soru-metin"],
    systemPrompt: `[SKILL: Mini_Example]
Ana çözümden önce 2-4 satırlık mini örnekle kavramı somutlaştır.`,
  },
  SOURCE_READER: {
    id: "SOURCE_READER",
    label: "Kaynak Okuyucu",
    description: "Paragraf, harita veya alıntı metin analizi",
    actions: ["soru-fotografi", "soru-metin"],
    systemPrompt: `[SKILL: Source_Reader]
Paragraf, tarih metni, harita veya İngilizce cümle varsa kaynak alıntısını analiz et.`,
  },
  CORE_FORMULA_EXTRACTOR: {
    id: "CORE_FORMULA_EXTRACTOR",
    label: "Temel Formül Çıkarıcı",
    description: "ÖSYM'nin beklediği çekirdek formül / kural",
    actions: ["soru-fotografi", "soru-metin"],
    systemPrompt: `[SKILL: Core_Formula_Extractor]
Çözümün EN BAŞINDA, sorunun çözülebilmesi için ÖSYM'nin bilmemizi istediği temel formülü veya kuralı şık bir Markdown kutusunda ver.
LaTeX: satır içi $...$ veya blok $$...$$ — asla tablo hücresine formül koyma.`,
  },
  OCR_GEOMETRIC_SCANNER: {
    id: "OCR_GEOMETRIC_SCANNER",
    label: "Görsel / Geometri Tarayıcı",
    description: "Grafik, tablo, şekil analizi",
    actions: ["soru-fotografi", "soru-metin"],
    systemPrompt: `[SKILL: OCR_Geometric_Scanner]
Soruda grafik, tablo veya geometrik şekil varsa çözümden ÖNCE şeklin analizini yap.
Örn: "Grafikte x=3 noktasında yerel maksimum olduğunu görüyoruz."
Görsel yoksa bu adımı atla; uydurma.`,
  },
  SOCRATIC_STEP_BY_STEP: {
    id: "SOCRATIC_STEP_BY_STEP",
    label: "Sokratik Adım Adım",
    description: "Pedagojik gerekçeli çözüm adımları",
    actions: ["soru-fotografi", "soru-metin"],
    systemPrompt: `[SKILL: Socratic_Step_By_Step]
Çözümü asla tek parça yazma. **Adım 1**, **Adım 2** … şeklinde böl.
Her adımda "Bu işlemi neden yaptığımızı" pedagojik olarak açıkla (self-explanation tetikle).`,
  },
  MISCONCEPTION_VACCINE: {
    id: "MISCONCEPTION_VACCINE",
    label: "Kavram Yanılgısı Aşısı",
    description: "ÖSYM tuzağı ve bilişsel hata uyarısı",
    actions: ["soru-fotografi", "soru-metin"],
    systemPrompt: `[SKILL: Misconception_Vaccine]
Çözümün sonuna mutlaka **⚠️ ÖSYM Tuzağı** başlığı aç.
Öğrencilerin bu soru tipinde en çok yaptığı bilişsel hatayı veya düştüğü çeldiriciyi spesifik yaz.`,
  },
  STRICT_MENTOR: {
    id: "STRICT_MENTOR",
    label: "Sert Mentor",
    description: "Gerçekçi, otoriter koçluk dili",
    actions: ["general", "deneme-trend"],
    systemPrompt: `[SKILL: Strict_Mentor]
Gerekirse acımasız ama yol gösterici ol. Düşük net + yüksek hedef = kriz planı.`,
  },
  META_COGNITIVE_COACH: {
    id: "META_COGNITIVE_COACH",
    label: "Üstbiliş Koçu",
    description: "Growth mindset, direnç, Feynman",
    actions: ["general", "konu-ozet", "feynman-modu", "kriz-modu"],
    systemPrompt: `[SKILL: Meta_Cognitive_Coach]
Motivasyon klişesi yok. Gelişim zihniyeti ve Feynman tekniği öner.`,
  },
  ADAPTIVE_DIFFICULTY_ENGINE: {
    id: "ADAPTIVE_DIFFICULTY_ENGINE",
    label: "Uyarlanabilir Zorluk Motoru",
    description: "Boss Savaşı — çoklu kazanım, adım adım yönlendirme",
    actions: ["boss-savasi"],
    systemPrompt: `[Skill: Adaptive_Difficulty_Engine] ("🔥 Boss Savaşı" tetiklendiğinde):
Öğrenciye çalıştığı son konudan oldukça zor, ÖSYM standartlarında, çoklu kazanım (iki konuyu birleştiren) içeren bir soru sor. Çözümünü hemen verme, adım adım yönlendir.`,
  },
  DAILY_QUEST_MASTER: {
    id: "DAILY_QUEST_MASTER",
    label: "Günün Görevleri Ustası",
    description: "RPG tarzı Epik Görevler",
    actions: ["gunun-gorevleri"],
    systemPrompt: `[Skill: Daily_Quest_Master] ("📜 Günün Görevleri" tetiklendiğinde):
"Çalışma programı" gibi sıkıcı bir dil kullanma. FRP/RPG oyunlarındaki "Quest Giver" (Görev Veren) karakter gibi konuş. Öğrencinin eksiklerine göre o gün bitirmesi gereken 3 tane net, ölçülebilir 'Epik Görev' belirle.`,
  },
  BURNOUT_DETECTOR: {
    id: "BURNOUT_DETECTOR",
    label: "Tükenmişlik Dedektörü",
    description: "Kriz Modu — empati ve mental dinlenme",
    actions: ["kriz-modu"],
    systemPrompt: `[Skill: Burnout_Detector] ("🆘 Kriz Modu" tetiklendiğinde veya öğrenci stresli konuştuğunda):
Tüm akademik dili ve Sokratik soru sormayı bırak. Empati kur, gelişim zihniyeti (Growth Mindset) aşıla. Öğrenciyi yargılama, sürecin zorluğunu onayla ama ona geçmişte neleri başardığını ([ÖĞRENCİ VERİSİ]nden) hatırlat. Kesinlikle "Şimdi şu konuya çalış" deme, mental dinlenmeyi teşvik et.`,
  },
  HIGH_YIELD_STRATEGIST: {
    id: "HIGH_YIELD_STRATEGIST",
    label: "Yüksek Getiri Stratejisti",
    description: "Acil Net Roketi — triage, banko konular, yasak listesi",
    actions: ["acil-net-roketi", "net-avcisi"],
    systemPrompt: `[Skill: High_Yield_Strategist] ("🚀 Acil Net Roketi" tetiklendiğinde veya "Nasıl hızlı net artırırım?" sorusu sorulduğunda):
- Triage (Acil Müdahale) mantığıyla çalış. Öğrenci 5 netlerdeyse, ona ASLA zor veya uzun konuları (Türev, İntegral, Karmaşık Geometri) önerme.
- "High-ROI" (Hızlı Getiri) sağlayan banko konuları listele: Örn: Rasyonel Sayılar, Üslü/Köklü Sayılar, Kümeler, İstatistik, Basit Eşitsizlikler.
- Cevabı şu formatta ver:
  1. Gerçekçi Hedef: "Şu an 5 nettesin, 1 ayda 15 nete çıkmak için sadece şu 4 konuya odaklanacağız."
  2. Saldırı Planı: Konu isimleri ve her birinden ÖSYM'nin her yıl banko kaç soru sorduğu.
  3. Kesin Yasaklar: "Şu an logaritma veya trigonometri çözmek sana yasak, önce temeli atacağız."`,
  },
  RESILIENCE_MENTOR: {
    id: "RESILIENCE_MENTOR",
    label: "Dayanıklılık Mentoru",
    description: "Mental Check-in — growth mindset, mikro eylem",
    actions: ["mental-check-in", "general"],
    systemPrompt: `[Skill: Resilience_Mentor] ("🧠 Mental Check-in" tetiklendiğinde veya genel iletişimde):
- Öğrenciyi her zaman "dinç" ve aksiyona hazır tut. Pasif teselliler verme ("Üzülme, yaparsın" GİBİ ŞEYLER YASAK).
- "Growth Mindset" (Gelişim Zihniyeti) kullan. Hataları ve düşük netleri "Karakter zayıflığı" değil, "Düzeltilmesi gereken bir kod hatası" veya "Çözülecek bir bulmaca" olarak çerçevele.
- Mesajların sonuna her zaman onu harekete geçirecek mikro bir eylem koy: "Şimdi derin bir nefes al, git yüzünü yıka ve masaya dönüp bana sadece 5 tane Kümeler sorusu çöz. Bekliyorum."`,
  },
  TARGET_NET_BUILDER: {
    id: "TARGET_NET_BUILDER",
    label: "Hedef Net Yol Haritası",
    description: "Ask-First — ders/hedef net sor, optimum konu reçetesi",
    actions: ["hedef-net-yol-haritasi"],
    systemPrompt: `[Skill: Target_Net_Builder] ("🎯 Hedef Net Yol Haritası" tetiklendiğinde):
- 1. AŞAMA (Soru Sor): "Harika bir hedef! Hangi dersten (örneğin TYT Matematik veya AYT Fizik) bu nete ulaşmak istiyorsun ve şu an ortalama kaç nettesin?" diye sor ve DUR.
- 2. AŞAMA (Kullanıcı cevap verdikten sonra Analiz): Kullanıcının mevcut neti ile hedef neti arasındaki farkı kapatacak en optimum (çalışması en kısa ama en çok sorulan) konuları listele. Örn: "AYT Matematikte 10 net istiyorsan, LTI (Limit-Türev-İntegral) çalışmak şu an intihardır. Senin reçeten: Diziler, Logaritma, Trigonometri (sadece yarım açı)."`,
  },
  BOSS_TOPIC_ANALYZER: {
    id: "BOSS_TOPIC_ANALYZER",
    label: "Boss Konu Analisti",
    description: "Ask-First — ders sor, eleyici konular + tuzaklar",
    actions: ["osym-zor-konular"],
    systemPrompt: `[Skill: Boss_Topic_Analyzer] ("☠️ ÖSYM'nin En Zor Konuları" tetiklendiğinde veya "Çıkmış zor konular" sorulduğunda):
- 1. AŞAMA (Soru Sor): "ÖSYM'nin kanayan yaralarına (Boss konulara) girmeye hazır mısın? Hangi dersin en çok can yakan, en zor konularını görmek istiyorsun?" diye sor ve DUR.
- 2. AŞAMA (Kullanıcı cevap verdikten sonra Analiz): O dersin tarihsel olarak en zor, eleyici konularını listele.
  - Örn AYT Matematik için: "Türev Maksimum-Minimum Problemleri" veya "İntegralde Alan Dönüşümleri".
  - Her "Boss Konu" için ÖSYM'nin en sık kurduğu 'Tuzağı' (Çeldiriciyi) yaz ve bu konuyu alt etmek için "Taktiksel bir tavsiye" ver.`,
  },
};

export const ACTION_SKILL_MAP: Record<string, OnyxEngineSkillId[]> = {
  "haftalik-program": ["TIME_MANAGER", "DATA_SCIENTIST"],
  "net-avcisi": ["GAP_MAPPER", "ERROR_PATTERN_ANALYST"],
  "deneme-trend": ["EXAM_PREDICTOR", "DATA_SCIENTIST", "STRICT_MENTOR"],
  "konu-ozet": ["EXAM_HACKER", "META_COGNITIVE_COACH"],
  "soru-fotografi": [
    "SOCRATIC_TUTOR",
    "ACADEMIC_SOLVER",
    "CORE_FORMULA_EXTRACTOR",
    "OCR_GEOMETRIC_SCANNER",
    "SOCRATIC_STEP_BY_STEP",
    "MISCONCEPTION_VACCINE",
  ],
  "soru-metin": [
    "SOCRATIC_TUTOR",
    "ACADEMIC_SOLVER",
    "CORE_FORMULA_EXTRACTOR",
    "OCR_GEOMETRIC_SCANNER",
    "SOCRATIC_STEP_BY_STEP",
    "MISCONCEPTION_VACCINE",
  ],
  "feynman-modu": ["META_COGNITIVE_COACH", "SOCRATIC_TUTOR"],
  "boss-savasi": ["ADAPTIVE_DIFFICULTY_ENGINE", "SOCRATIC_TUTOR", "EXAM_HACKER"],
  "gunun-gorevleri": ["DAILY_QUEST_MASTER", "GAP_MAPPER", "TIME_MANAGER"],
  "kriz-modu": ["BURNOUT_DETECTOR", "META_COGNITIVE_COACH"],
  "acil-net-roketi": [
    "HIGH_YIELD_STRATEGIST",
    "GAP_MAPPER",
    "EXAM_PREDICTOR",
    "ERROR_PATTERN_ANALYST",
  ],
  "mental-check-in": ["RESILIENCE_MENTOR", "META_COGNITIVE_COACH"],
  "hedef-net-yol-haritasi": [
    "TARGET_NET_BUILDER",
    "GAP_MAPPER",
    "EXAM_HACKER",
    "EXAM_PREDICTOR",
  ],
  "osym-zor-konular": [
    "BOSS_TOPIC_ANALYZER",
    "EXAM_HACKER",
    "ERROR_PATTERN_ANALYST",
  ],
  "kariyer-tercih": [
    "TARGET_NET_BUILDER",
    "EXAM_PREDICTOR",
    "DATA_SCIENTIST",
    "META_COGNITIVE_COACH",
  ],
  EXAM_PREDICTOR: ["EXAM_PREDICTOR", "DATA_SCIENTIST"],
  GAP_MAPPER: ["GAP_MAPPER", "ERROR_PATTERN_ANALYST"],
  general: [
    "STRICT_MENTOR",
    "META_COGNITIVE_COACH",
    "DATA_SCIENTIST",
    "RESILIENCE_MENTOR",
  ],
};

function normalizeAction(action: string): OnyxEngineAction {
  const key = String(action || "general").trim();
  if (key in ACTION_SKILL_MAP) return key as OnyxEngineAction;
  return "general";
}

function resolveSkills(
  action: OnyxEngineAction,
  opts: {
    deepSkillEngine?: boolean;
    academicSolution?: boolean;
    useSocratic: boolean;
  }
): OnyxEngineSkillId[] {
  if (action === "kriz-modu") {
    return ["BURNOUT_DETECTOR", "META_COGNITIVE_COACH"];
  }

  if (action === "mental-check-in") {
    return ["RESILIENCE_MENTOR", "META_COGNITIVE_COACH"];
  }

  const base = ACTION_SKILL_MAP[action] ?? ACTION_SKILL_MAP.general;
  const set = new Set<OnyxEngineSkillId>(base);

  if (opts.deepSkillEngine) {
    set.add("TIME_MANAGER");
    set.add("GAP_MAPPER");
  }
  if (opts.useSocratic) {
    set.add("SOCRATIC_TUTOR");
    set.delete("ACADEMIC_SOLVER");
    for (const id of VISION_ACADEMIC_SKILL_IDS) set.delete(id);
  } else if (opts.academicSolution) {
    set.add("ACADEMIC_SOLVER");
    for (const id of VISION_ACADEMIC_SKILL_IDS) set.add(id);
  }

  return [...set];
}

export class OnyxEngine {
  readonly skills = SKILL_REGISTRY;

  resolveSkillsForAction(
    action: string,
    options?: {
      deepSkillEngine?: boolean;
      academicSolution?: boolean;
      socraticTurn?: number;
      studentMode?: boolean;
      socraticTeacher?: boolean;
    }
  ): OnyxEngineSkillId[] {
    const normalized = normalizeAction(action);
    const socraticTurn = Math.max(1, options?.socraticTurn ?? 1);
    const useSocratic =
      normalized !== "kriz-modu" &&
      (Boolean(options?.socraticTeacher) ||
        (Boolean(options?.studentMode) &&
          (normalized === "soru-fotografi" ||
            normalized === "soru-metin" ||
            Boolean(options?.academicSolution)) &&
          socraticTurn < 2));

    return resolveSkills(normalized, {
      deepSkillEngine: options?.deepSkillEngine,
      academicSolution: options?.academicSolution,
      useSocratic,
    });
  }

  buildSystemPrompt(
    activeSkills: OnyxEngineSkillId[],
    studentData: unknown,
    mode: OnyxAiMode = "FAST",
    options?: {
      deepSkillEngine?: boolean;
      academicSolution?: boolean;
      studentMode?: boolean;
      socraticTeacher?: boolean;
      socraticTurn?: number;
      role?: OnyxRole;
    }
  ): string {
    const roleBlock = options?.role
      ? `\n${buildOnyxRoleSystemPrompt(options.role)}\n`
      : "";

    const useVisionProtocol =
      Boolean(options?.academicSolution) && !options?.socraticTeacher;
    const visionProtocolBlock = useVisionProtocol
      ? `\n${ONYX_VISION_SOLVE_SYSTEM_PREFIX}\n${buildVisionAcademicProtocolBlock(options?.role)}\n`
      : "";

    const activeLine =
      activeSkills.length > 0
        ? `\n[AKTİF SKILLS]: ${activeSkills.join(", ")}`
        : "";

    const overlay = `${ONYX_COMPRESSED_SYSTEM_CORE}
${roleBlock}${activeLine}
${options?.deepSkillEngine ? `\n${ONYX_DEEP_SKILL_ENGINE_PROMPT}` : ""}${visionProtocolBlock}`;

    const standard = buildOnyxSystemContent(studentData, mode, {
      deepSkillEngine: options?.deepSkillEngine,
      academicSolution: options?.academicSolution,
      studentMode: options?.studentMode,
      socraticTeacher: options?.socraticTeacher,
      socraticTurn: options?.socraticTurn,
      compact: true,
    });

    const merged = standard.replace(ONYX_SYSTEM_PROMPT_BASE, overlay.trim());
    return prependOnyxYksSystemRules(
      finalizeOnyxSystemPrompt(merged)
    );
  }

  /** Streaming yolu — vision reveal gibi senkron dallar hariç */
  prepareStreamRequest(req: OnyxEngineProcessInput): OnyxStreamPrepareResult {
    const prompt = String(req.input ?? "").trim();
    const hasVision = Boolean(req.vision?.base64?.trim());
    const hasContinuation = Boolean(req.continuation?.partialReply?.trim());
    if (!prompt && !hasVision && !hasContinuation) {
      throw new OnyxGroqError(
        "prompt, vision veya continuation gerekli.",
        "BAD_REQUEST"
      );
    }

    const action = normalizeAction(req.action);
    const mode = normalizeOnyxAiMode(req.mode);
    const socraticTurn = Math.max(1, Number(req.socraticTurn) || 1);
    const studentMode = Boolean(req.studentMode);
    const academicSolution =
      Boolean(req.academicSolution) ||
      action === "soru-fotografi" ||
      action === "soru-metin";

    const useSocratic =
      action !== "kriz-modu" &&
      (Boolean(req.socraticTeacher) ||
        (studentMode && (hasVision || academicSolution) && socraticTurn < 2));

    const activeSkills = resolveSkills(action, {
      deepSkillEngine: req.deepSkillEngine,
      academicSolution,
      useSocratic,
    });

    const studentId = String(req.studentId ?? "").trim();
    const isVisionReveal =
      hasVision &&
      studentMode &&
      socraticTurn >= 2 &&
      (action === "soru-fotografi" || action === "soru-metin");

    if (isVisionReveal && studentId) {
      return { kind: "blocking" };
    }

    if (action === "kariyer-tercih" && !hasVision && !hasContinuation) {
      return { kind: "blocking" };
    }

    if (
      (action === "net-avcisi" ||
        action === "deneme-trend" ||
        req.skillType === "strategy") &&
      !hasVision &&
      !hasContinuation
    ) {
      return { kind: "blocking" };
    }

    const skillType = req.skillType;
    if (
      (skillType === "youtube_assistant" ||
        skillType === "mental_coach" ||
        action === "feynman-modu" ||
        action === "kriz-modu" ||
        action === "mental-check-in") &&
      !hasVision &&
      !hasContinuation
    ) {
      return { kind: "blocking" };
    }

    const systemContent = this.buildSystemPrompt(
      activeSkills,
      req.studentData,
      mode,
      {
        deepSkillEngine: req.deepSkillEngine,
        academicSolution,
        studentMode,
        socraticTeacher: useSocratic,
        socraticTurn,
        role: req.role,
      }
    );

    const messages = buildOnyxModelMessages({
      prompt:
        prompt ||
        (hasVision
          ? "Bu soru görselini analiz et."
          : "Öğrenci verisine göre yanıtla."),
      vision: req.vision,
      continuation: req.continuation,
      chatHistory: req.chatHistory,
    });

    const userLabel = hasVision ? prompt || "📷 Soru fotoğrafı" : prompt;

    return {
      kind: "stream",
      system: systemContent,
      messages,
      groqModel: String(req.groqModel ?? "").trim(),
      isDeepMode: Boolean(req.isDeepMode) || mode === "DEEP",
      hasImage: Boolean(req.hasImage) || hasVision,
      persist: {
        studentId: studentId || undefined,
        sessionId: String(req.sessionId ?? "").trim() || undefined,
        userContent: req.continuation ? "[Onyx devam]" : userLabel,
      },
      meta: {
        socraticPhase: useSocratic ? "probe" : "reveal",
        socraticTurn,
        activeSkills,
      },
    };
  }

  /** Skill seç → LLM → veritabanına log → yanıt */
  async processRequest(
    req: OnyxEngineProcessInput
  ): Promise<OnyxEngineProcessResult> {
    const prompt = String(req.input ?? "").trim();
    const hasVision = Boolean(req.vision?.base64?.trim());
    const hasContinuation = Boolean(req.continuation?.partialReply?.trim());
    if (!prompt && !hasVision && !hasContinuation) {
      throw new OnyxGroqError(
        "prompt, vision veya continuation gerekli.",
        "BAD_REQUEST"
      );
    }

    const action = normalizeAction(req.action);
    const mode = normalizeOnyxAiMode(req.mode);
    const socraticTurn = Math.max(1, Number(req.socraticTurn) || 1);
    const studentMode = Boolean(req.studentMode);
    const academicSolution =
      Boolean(req.academicSolution) ||
      action === "soru-fotografi" ||
      action === "soru-metin";

    const useSocratic =
      action !== "kriz-modu" &&
      (Boolean(req.socraticTeacher) ||
        (studentMode && (hasVision || academicSolution) && socraticTurn < 2));

    const activeSkills = resolveSkills(action, {
      deepSkillEngine: req.deepSkillEngine,
      academicSolution,
      useSocratic,
    });

    const studentId = String(req.studentId ?? "").trim();
    const role: OnyxRole =
      req.role === "student" ? "student" : req.role === "coach" ? "coach" : req.studentMode ? "student" : "coach";
    let sessionId = String(req.sessionId ?? "").trim() || undefined;

    const isVisionReveal =
      hasVision &&
      studentMode &&
      socraticTurn >= 2 &&
      (action === "soru-fotografi" || action === "soru-metin");

    if (isVisionReveal && studentId) {
      const curriculumRag = buildCurriculumRagForSolve(
        prompt || "soru fotoğrafı analizi"
      );
      const solved = await completeSolveVision({
        prompt: prompt || "",
        vision: req.vision,
        role,
        curriculumRag,
      });

      const userLabel = prompt || "📷 Soru fotoğrafı";
      const { deepDiagnosisToSkillResponse } = await import(
        "@/lib/onyx/skill-adapters"
      );
      const onyxResponse = solved.structured.deepDiagnosis
        ? deepDiagnosisToSkillResponse(solved.structured.deepDiagnosis, role)
        : undefined;

      const saved = await persistChatExchange({
        studentId,
        sessionId,
        userContent: userLabel,
        onyxContent: solved.reply,
        userImage: req.vision?.base64
          ? {
              base64: req.vision.base64,
              mimeType: req.vision.mimeType,
            }
          : undefined,
        onyxMetadata: onyxResponse
          ? {
              onyxResponse,
              deepErrorDiagnosis: solved.structured.deepDiagnosis,
            }
          : undefined,
      });

      return {
        reply: solved.reply,
        model: solved.model,
        usedFallback: solved.usedFallback,
        sessionId: saved.sessionId,
        socraticPhase: "reveal",
        socraticTurn,
        activeSkills,
        onyxResponse,
      };
    }

    if (action === "kariyer-tercih" && !hasVision && !hasContinuation) {
      const { completeCareerCounseling } = await import(
        "@/lib/onyx/career-counseling-server"
      );
      const solved = await completeCareerCounseling({
        prompt: prompt || "Kariyer ve tercih danışmanlığı",
        studentData: req.studentData,
        role,
      });

      const { careerCounselingToSkillResponse } = await import(
        "@/lib/onyx/skill-adapters"
      );
      const onyxResponse = careerCounselingToSkillResponse(solved.career);

      if (studentId) {
        const saved = await persistChatExchange({
          studentId,
          sessionId,
          userContent: prompt,
          onyxContent: solved.reply,
          onyxMetadata: {
            onyxResponse,
            careerCounseling: solved.career,
          },
        });
        sessionId = saved.sessionId;
      }

      return {
        reply: solved.reply,
        model: solved.model,
        usedFallback: solved.usedFallback,
        sessionId,
        socraticPhase: "reveal",
        socraticTurn,
        activeSkills,
        careerCounseling: solved.career,
        onyxResponse,
      };
    }

    if (
      (action === "net-avcisi" || req.skillType === "strategy") &&
      !hasVision &&
      !hasContinuation
    ) {
      const { completeStrategySkill } = await import(
        "@/lib/onyx/skill-complete-server"
      );
      const solved = await completeStrategySkill({
        prompt: prompt || "Net ve strateji analizi",
        studentData: req.studentData,
        role,
      });
      const onyxResponse = solved.skillResponse;

      if (studentId) {
        const saved = await persistChatExchange({
          studentId,
          sessionId,
          userContent: prompt,
          onyxContent: solved.reply,
          onyxMetadata: { onyxResponse },
        });
        sessionId = saved.sessionId;
      }

      return {
        reply: solved.reply,
        model: solved.model,
        usedFallback: solved.usedFallback,
        sessionId,
        socraticPhase: "reveal",
        socraticTurn,
        activeSkills,
        onyxResponse,
      };
    }

    if (action === "deneme-trend" && !hasVision && !hasContinuation) {
      const { completeAnalyticsSkill } = await import(
        "@/lib/onyx/skill-complete-server"
      );
      const solved = await completeAnalyticsSkill({
        prompt: prompt || "Deneme trend analizi",
        studentData: req.studentData,
        role,
      });
      const onyxResponse = solved.skillResponse;

      if (studentId) {
        const saved = await persistChatExchange({
          studentId,
          sessionId,
          userContent: prompt,
          onyxContent: solved.reply,
          onyxMetadata: { onyxResponse },
        });
        sessionId = saved.sessionId;
      }

      return {
        reply: solved.reply,
        model: solved.model,
        usedFallback: solved.usedFallback,
        sessionId,
        socraticPhase: "reveal",
        socraticTurn,
        activeSkills,
        onyxResponse,
      };
    }

    const resolvedSkill = req.skillType;
    if (
      (resolvedSkill === "youtube_assistant" || action === "feynman-modu") &&
      !hasVision &&
      !hasContinuation
    ) {
      const { completeYoutubeAssistantSkill } = await import(
        "@/lib/onyx/skill-complete-server"
      );
      const solved = await completeYoutubeAssistantSkill({
        prompt: prompt || "YouTube ders videosu özeti",
        studentData: req.studentData,
        role,
      });
      const onyxResponse = solved.skillResponse;

      if (studentId) {
        const saved = await persistChatExchange({
          studentId,
          sessionId,
          userContent: prompt,
          onyxContent: solved.reply,
          onyxMetadata: { onyxResponse },
        });
        sessionId = saved.sessionId;
      }

      return {
        reply: solved.reply,
        model: solved.model,
        usedFallback: solved.usedFallback,
        sessionId,
        socraticPhase: "reveal",
        socraticTurn,
        activeSkills,
        onyxResponse,
      };
    }

    if (
      (resolvedSkill === "mental_coach" ||
        action === "kriz-modu" ||
        action === "mental-check-in") &&
      !hasVision &&
      !hasContinuation
    ) {
      const { completeMentalCoachSkill } = await import(
        "@/lib/onyx/skill-complete-server"
      );
      const solved = await completeMentalCoachSkill({
        prompt: prompt || "Mental destek ve sakinleştirme",
        studentData: req.studentData,
        role,
      });
      const onyxResponse = solved.skillResponse;

      if (studentId) {
        const saved = await persistChatExchange({
          studentId,
          sessionId,
          userContent: prompt,
          onyxContent: solved.reply,
          onyxMetadata: { onyxResponse },
        });
        sessionId = saved.sessionId;
      }

      return {
        reply: solved.reply,
        model: solved.model,
        usedFallback: solved.usedFallback,
        sessionId,
        socraticPhase: "reveal",
        socraticTurn,
        activeSkills,
        onyxResponse,
      };
    }

    const systemContent = this.buildSystemPrompt(
      activeSkills,
      req.studentData,
      mode,
      {
        deepSkillEngine: req.deepSkillEngine,
        academicSolution,
        studentMode,
        socraticTeacher: useSocratic,
        socraticTurn,
        role,
      }
    );

    const groq = await completeOnyxWithGroq({
      prompt:
        prompt ||
        (hasVision
          ? "Bu soru görselini analiz et."
          : "Öğrenci verisine göre yanıtla."),
      contextData: req.studentData,
      mode,
      deepSkillEngine: req.deepSkillEngine,
      academicSolution,
      studentMode,
      socraticTeacher: useSocratic,
      socraticTurn,
      vision: req.vision,
      systemContentOverride: systemContent,
      continuation: req.continuation,
      groqModel: req.groqModel,
      hasImage: req.hasImage ?? hasVision,
      isDeepMode: req.isDeepMode ?? mode === "DEEP",
      chatHistory: req.chatHistory,
    });

    const continuity = detectOnyxReplyContinuity(groq.finishReason);

    if (studentId) {
      const userLabel = hasVision ? prompt || "📷 Soru fotoğrafı" : prompt;
      const saved = await persistChatExchange({
        studentId,
        sessionId,
        userContent: req.continuation
          ? "[Onyx devam]"
          : userLabel,
        onyxContent: groq.reply,
      });
      sessionId = saved.sessionId;
    }

    return {
      reply: groq.reply,
      model: groq.model,
      usedFallback: groq.usedFallback,
      sessionId,
      socraticPhase: useSocratic ? "probe" : "reveal",
      socraticTurn,
      activeSkills,
      finishReason: continuity.finishReason,
      finished: continuity.finished,
      truncated: continuity.truncated,
    };
  }
}

let engineSingleton: OnyxEngine | null = null;

export function getOnyxEngine(): OnyxEngine {
  if (!engineSingleton) engineSingleton = new OnyxEngine();
  return engineSingleton;
}
