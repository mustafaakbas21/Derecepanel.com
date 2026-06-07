import type { OnyxActionType } from "@/lib/onyx/types";

/** Sorgu tabanlı derin analiz — haftalık program & net avcısı */
export type OnyxDeepQueryAction = "haftalik-program" | "net-avcisi";

export type OnyxQueryStep = "IDLE" | "AWAITING_DETAILS";

const DEEP_QUERY_LABELS: Record<OnyxDeepQueryAction, string> = {
  "haftalik-program": "Haftalık Program",
  "net-avcisi": "Net Avcısı",
};

export function isDeepQueryAction(
  action: OnyxActionType
): action is OnyxDeepQueryAction {
  return action === "haftalik-program" || action === "net-avcisi";
}

export function getDeepQueryDisplayLabel(action: OnyxDeepQueryAction): string {
  return DEEP_QUERY_LABELS[action];
}

/** İlk tıklamada API yok — Onyx soru seti */
export function getDeepQueryOnyxMessage(action: OnyxDeepQueryAction): string {
  const modeLabel = DEEP_QUERY_LABELS[action];
  return `Harika! **${modeLabel}** modunu başlatıyoruz. Bu analizin nokta atışı olması için lütfen şu bilgileri ver:

1. Hangi derslerde zorlanıyorsun? (Örn: Matematik, Fizik)
2. Bu hafta kaç saat çalışma süren var?
3. Hedefin nedir? (Örn: 5 net artırmak)

Hepsini tek mesajda yazabilirsin; ardından öğrenci verilerinle birleştirip derin analiz üreteceğim.`;
}

/** Kullanıcı detayları geldikten sonra API prompt'u */
export function buildDeepAnalysisFinalPrompt(
  action: OnyxDeepQueryAction,
  userDetails: string
): string {
  const modeLabel = DEEP_QUERY_LABELS[action];
  const modeHint =
    action === "haftalik-program"
      ? "Haftalık Program modu: Time_Manager + Deep Work tablosu zorunlu."
      : "Net Avcısı modu: kavramsal mı işlem hatası mı teşhis et; ÖSYM tarzı 3 çeldirici soru tipi ver.";

  return `[DERİN ANALİZ İSTEĞİ — ${modeLabel}]
${modeHint}

Koç/öğrencinin verdiği detaylar:
${userDetails.trim()}

Yukarıdaki detayları [ÖĞRENCİ VERİSİ] ile birleştir. Deep_Skill_Engine sistem talimatına %100 uy.`;
}
