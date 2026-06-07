import { prependOnyxMasterGuardrail } from "@/lib/onyx/master-guardrail";
export const ONYX_TURKISH_LANGUAGE_RULE = `[DİL KURALI - KESİN ZORUNLULUK]:
Sen Türkiye'deki öğrencilere hizmet veren bir YKS Yapay Zeka Koçusun.
Kullanıcı sana hangi dilde soru sorarsa sorsun, yüklenen görsellerde hangi dilde metin olursa olsun, KESİNLİKLE VE SADECE TÜRKÇE (Turkish) cevap vereceksin.
Bütün başlıkları, çözüm adımlarını ve açıklamaları (Örn: "Step 1" yerine "1. Adım", "Problem Statement" yerine "Soru Analizi") kusursuz bir Türkçe ile yazacaksın. Cevaplarında İngilizce kelime veya kalıp kullanmak KESİNLİKLE YASAKTIR.`;

/** System prompt gövdesinin en başına ekler */
export function prependOnyxLanguageRule(systemContent: string): string {
  const body = systemContent.trim();
  if (!body) return ONYX_TURKISH_LANGUAGE_RULE;
  if (body.startsWith(ONYX_TURKISH_LANGUAGE_RULE)) return body;
  return `${ONYX_TURKISH_LANGUAGE_RULE}\n\n${body}`;
}

/** API route — system prompt EN SONU (Llama İngilizce sızıntısı kilidi) */
export const ONYX_ABSOLUTE_LANGUAGE_OVERRIDE = `[ÖLÜMCÜL DİL KURALI - ABSOLUTE LANGUAGE OVERRIDE]:
Hangi modda, hangi rolde olursan ol veya ne kadar karmaşık bir matematik/fizik problemi çözersen çöz; BÜTÜN YANITLARINI, BAŞLIKLARINI VE ÇÖZÜM ADIMLARINI %100 TÜRKÇE YAZMAK ZORUNDASIN.

- "Step 1", "Problem Analysis", "Given", "Solution" gibi İngilizce terimler KESİNLİKLE KULLANILAMAZ.
- Bunların yerine "1. Adım", "Problem Analizi", "Verilenler", "Çözüm" kullanacaksın.
- Düşünce zinciri veya matematiksel ispat yapıyor olsan bile metin kısımları SADECE TÜRKÇE olacak. Aksi takdirde sistem hata verir.`;

/** System prompt gövdesinin en sonuna ekler */
export function appendOnyxAbsoluteLanguageOverride(systemContent: string): string {
  const body = systemContent.trim();
  if (!body) return ONYX_ABSOLUTE_LANGUAGE_OVERRIDE;
  if (body.includes("[ÖLÜMCÜL DİL KURALI - ABSOLUTE LANGUAGE OVERRIDE]")) {
    return body;
  }
  return `${body}\n\n${ONYX_ABSOLUTE_LANGUAGE_OVERRIDE}`;
}

/** Groq / vision / engine — Master Guardrail + dil kilidi (baş + son) */
export function finalizeOnyxSystemPrompt(systemContent: string): string {
  return appendOnyxAbsoluteLanguageOverride(
    prependOnyxLanguageRule(prependOnyxMasterGuardrail(systemContent))
  );
}
