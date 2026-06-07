import {
  normalizeOnyxAiMode,
  ONYX_MODEL_FAST,
  type OnyxAiMode,
} from "@/lib/onyx/ai-mode";
import { ONYX_CONTINUITY_PROTOCOL } from "@/lib/onyx/continuity";
import { ONYX_TURKISH_LANGUAGE_RULE } from "@/lib/onyx/language-rule";
import { prependOnyxYksSystemRules } from "@/lib/onyx/yks-terminology-rule";

/** Groq — varsayılan hızlı model (GROQ_MODEL ile override edilebilir) */
export const ONYX_DEFAULT_MODEL = ONYX_MODEL_FAST;

/**
 * Onyx Uzman Ajan — master system prompt (Groq `messages[0]` role: system).
 * `app/api/onyx/route.ts` → `groq-server.ts` → `buildOnyxSystemContent`
 */
export const ONYX_SYSTEM_PROMPT_BASE = `Sen DerecePanel Onyx YKS koçusun. Veriye dayalı, taktiksel, Türkçe yanıt ver. Genel motivasyon yasak. Markdown + madde kullan; formüller $/$$ (tablo içinde LaTeX yok). [ÖĞRENCİ VERİSİ]'ni yorumla, listeleme.`;

/** Her analiz/özet sonunda zorunlu etkileşim kancası */
export const ONYX_ENGAGEMENT_HOOK_RULE = `Yanıt sonunda kısa soru tetikleyici bırak (ör: "çözemediğin soru tipi var mı?").`;

/** Konu özeti sihirbazı — [ÖZEL İSTEK] satırına uyum (system mesajının sonu) */
export const ONYX_OZEL_ISTEK_GUARDRAIL = `[ÖZEL İSTEK]: Ders/konu parametresine sadık kal; TYT'de AYT konusu verme. ÖSYM tuzaklarını listele.`;

/** Derin Analiz modu — kısa */
export const ONYX_DEEP_MODE_PROMPT = `DERİN MOD: Chain-of-thought; veri korelasyonu + ÖSYM meta + hata teşhisi zorunlu.`;

/** Haftalık Program / Net Avcısı — sorgu sonrası zorunlu motor */
export const ONYX_DEEP_SKILL_ENGINE_PROMPT = `[DERİN ANALİZ YETENEĞİ - SİSTEM TALİMATI — Deep_Skill_Engine]
- Ders Ders Parçala: Eğer kullanıcı "Matematik ve Fizik" dediyse, programı kesinlikle bu iki ders için ayrı 'blok' halinde oluştur.
- Taktiksel Odak: Net Avcısı modunda, sadece 'çalış' deme; o derste 'kavramsal mı' yoksa 'işlem hatası mı' yaptığını teşhis et ve o soru tipine özel 'ÖSYM tarzı' 3 tane kritik soru tipi (çeldirici) yaz.
- Zaman Planlama: Haftalık programı 'Deep Work' (Sabah zihin açıkken zor ders, akşam pratik) mantığına göre diz ve tablo olarak sun (tablo hücrelerinde LaTeX yok — Format_Master).
- Ödevlendirme: Analizin sonuna mutlaka "Bu analiz sonrası ilk yapman gereken şey, X konusundan Y testini çözmektir" şeklinde somut bir ödev ekle.`;

/** Öğrenci soru çözümü — vision / metin soru */
export const ONYX_ACADEMIC_SOLUTION_PROMPT = `[AKADEMİK ÇÖZÜM YETENEĞİ — Academic_Solver]
Görsel veya matematiksel soru metni geldiğinde GÖRSEL VE AKADEMİK SORU ÇÖZÜM PROTOKOLÜne uy; yanıtın tamamı Türkçe:
1. Temel formül kutusu (LaTeX $ / $$)
2. Varsa şekil/grafik analizi
3. **1. Adım**, **2. Adım** … + her adımda gerekçe (İngilizce başlık yasak)
4. **⚠️ ÖSYM Tuzağı**

Müfredat: yanıt sonuna [KONU_TAKIP: dersId::konuId] gizli etiket.
Koç modunda: "Öğrencinin bu soruda takılma sebebi büyük ihtimalle X konusundaki eksikliğidir" raporu ekle.`;

export const ONYX_STUDENT_MODE_PROMPT = `Şu an ÖĞRENCİ ARAYÜZÜ modundasın. Öğrenci kendi adına soru soruyor veya fotoğraf yüklüyor. Kısa, anlaşılır ve motive edici ama abartısız ol.`;

/** Sokratik Öğretmen — ilk temas (cevap verme, soru sor) */
export const ONYX_SOCRATIC_TEACHER_PROMPT = `[SOKRATİK ÖĞRETMEN PROTOKOLÜ — Skill: Socratic_Tutor]
Öğrenci bir soru fotoğrafı veya metni gönderdiğinde; önce cevabı VERME.
Önce öğrencinin sorunun neresinde takıldığını anlamak için Sokratik soru sor (Örn: "Bu soruda ilk adımda ne yapman gerektiğini düşünüyorsun?").
Eğer öğrenci 2. kez sorarsa veya yanlış cevap verirse, o zaman tam çözümü adım adım, LaTeX formülleriyle anlat ($ ve $$ — Format_Master kurallarına uy).
İlk yanıtta: kısa, 1–2 net Sokratik soru + gerekirse soruyu yeniden çerçevele; çözüm adımlarını veya nihai cevabı paylaşma.`;

export type OnyxSystemBuildOptions = {
  deepSkillEngine?: boolean;
  academicSolution?: boolean;
  studentMode?: boolean;
  socraticTeacher?: boolean;
  socraticTurn?: number;
  /** Token tasarrufu — kısa guardrail'ler */
  compact?: boolean;
};

export const ONYX_STUDENT_CONTEXT_MAX_CHARS = 2200;

export const ONYX_COMPLETION_TEMPERATURE = 0.1;
/** Veri / analiz rotaları — yaratıcılık kapalı (üst sınır) */
export const ONYX_STRUCTURED_MAX_TEMPERATURE = 0.2;
export const ONYX_COMPLETION_MAX_TOKENS = 2048;

/** YouTube / Mental gibi uzun JSON skill yanıtları */
export const ONYX_SKILL_COMPLETION_MAX_TOKENS = 4096;

/** YouTube ders föyü — TPM dostu çıktı */
export const ONYX_YOUTUBE_COMPLETION_MAX_TOKENS = 2048;

/** Net & Strateji — Groq TPM dostu (Atlas + şema zaten büyük) */
export const ONYX_STRATEGY_COMPLETION_MAX_TOKENS = 2048;

export function buildOnyxSystemContent(
  contextData?: unknown,
  mode: OnyxAiMode = "FAST",
  options?: OnyxSystemBuildOptions
): string {
  const normalizedMode = normalizeOnyxAiMode(mode);
  const compact = Boolean(options?.compact);
  let content = compact
    ? ONYX_SYSTEM_PROMPT_BASE
    : `${ONYX_TURKISH_LANGUAGE_RULE}\n\n${ONYX_SYSTEM_PROMPT_BASE}\n\n${ONYX_OZEL_ISTEK_GUARDRAIL}\n\n${ONYX_ENGAGEMENT_HOOK_RULE}\n\n${ONYX_CONTINUITY_PROTOCOL}`;
  if (normalizedMode === "DEEP") {
    content = `${content}\n\n${ONYX_DEEP_MODE_PROMPT}`;
  }
  if (options?.deepSkillEngine) {
    content = `${content}\n\n${ONYX_DEEP_SKILL_ENGINE_PROMPT}`;
  }
  if (options?.studentMode) {
    content = `${content}\n\n${ONYX_STUDENT_MODE_PROMPT}`;
  }
  const socraticTurn = options?.socraticTurn ?? 1;
  const useSocraticProbe =
    Boolean(options?.socraticTeacher) && socraticTurn < 2;
  if (useSocraticProbe) {
    content = `${content}\n\n${ONYX_SOCRATIC_TEACHER_PROMPT}`;
  } else if (options?.academicSolution) {
    content = `${content}\n\n${ONYX_ACADEMIC_SOLUTION_PROMPT}`;
  }
  if (contextData == null) return prependOnyxYksSystemRules(content);

  const isEmptyObject =
    typeof contextData === "object" &&
    contextData !== null &&
    !Array.isArray(contextData) &&
    Object.keys(contextData).length === 0;

  if (isEmptyObject) return prependOnyxYksSystemRules(content);

  let stringified =
    typeof contextData === "string"
      ? contextData.trim()
      : JSON.stringify(contextData);

  if (!stringified || stringified === "{}" || stringified === "null") {
    return prependOnyxYksSystemRules(content);
  }

  if (stringified.length > ONYX_STUDENT_CONTEXT_MAX_CHARS) {
    stringified = `${stringified.slice(0, ONYX_STUDENT_CONTEXT_MAX_CHARS)}… [kırpıldı]`;
  }

  return prependOnyxYksSystemRules(`${content}

[ÖĞRENCİ VERİSİ]:
${stringified}

Veriyi yorumla; sadece listeleme.`);
}
