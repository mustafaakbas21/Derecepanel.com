import type { OnyxActionType } from "@/lib/onyx/types";

/** Sorgu-tepki (Ask-First) — hedef net & ÖSYM zor konular */
export type OnyxInteractiveAskAction =
  | "hedef-net-yol-haritasi"
  | "osym-zor-konular";

const INTERACTIVE_ASK_LABELS: Record<OnyxInteractiveAskAction, string> = {
  "hedef-net-yol-haritasi": "🎯 Hedef Net Yol Haritası",
  "osym-zor-konular": "☠️ ÖSYM'nin En Zor Konuları",
};

export function isInteractiveAskAction(
  action: OnyxActionType
): action is OnyxInteractiveAskAction {
  return action === "hedef-net-yol-haritasi" || action === "osym-zor-konular";
}

export function getInteractiveAskDisplayLabel(
  action: OnyxInteractiveAskAction
): string {
  return INTERACTIVE_ASK_LABELS[action];
}

/** İlk tıklamada API yok — Onyx 1. AŞAMA soruları */
export function getInteractiveAskOnyxMessage(
  action: OnyxInteractiveAskAction
): string {
  if (action === "hedef-net-yol-haritasi") {
    return `Harika bir hedef! **Hedef Net Yol Haritası** modunu başlatıyoruz.

Hangi dersten (örneğin TYT Matematik veya AYT Fizik) bu nete ulaşmak istiyorsun ve şu an ortalama kaç nettesin?

Cevabını tek mesajda yaz; ardından sana özel yol haritasını çıkaracağım.`;
  }

  return `**ÖSYM Boss Konular** moduna hoş geldin.

ÖSYM'nin kanayan yaralarına (Boss konulara) girmeye hazır mısın? Hangi dersin en çok can yakan, en zor konularını görmek istiyorsun?

Ders adını yaz; ardından o branşın eleyici konularını, tuzaklarını ve taktiklerini listeleyeceğim.`;
}

export function getInteractiveAskInputPlaceholder(
  action: OnyxInteractiveAskAction
): string {
  if (action === "hedef-net-yol-haritasi") {
    return "Örn: AYT Matematik, hedef 10 net, şu an 3 net…";
  }
  return "Örn: AYT Matematik, TYT Fizik…";
}

/** Kullanıcı cevap verdikten sonra — 2. AŞAMA analiz prompt'u */
export function buildInteractiveAskFinalPrompt(
  action: OnyxInteractiveAskAction,
  userDetails: string
): string {
  const details = userDetails.trim();
  if (action === "hedef-net-yol-haritasi") {
    return `[ETKİLEŞİM — 2. AŞAMA: Target_Net_Builder]
Target_Net_Builder skill'inin 2. AŞAMA yönergelerine %100 uy. Kullanıcı bilgilerini [ÖĞRENCİ VERİSİ] ile birleştir.

Kullanıcının verdiği bilgiler:
${details}

Analiz: Mevcut net ile hedef net arasındaki farkı kapatacak en optimum (çalışması en kısa ama en çok sorulan) konuları listele. Gereksiz zor konuları (ör. düşük nette LTI) yasakla; somut reçete ver.`;
  }

  return `[ETKİLEŞİM — 2. AŞAMA: Boss_Topic_Analyzer]
Boss_Topic_Analyzer skill'inin 2. AŞAMA yönergelerine %100 uy.

Kullanıcının seçtiği ders / branş:
${details}

Analiz: O dersin tarihsel olarak en zor, eleyici Boss konularını listele. Her Boss Konu için ÖSYM'nin en sık kurduğu tuzağı (çeldirici) ve taktiksel tavsiye ver.`;
}
