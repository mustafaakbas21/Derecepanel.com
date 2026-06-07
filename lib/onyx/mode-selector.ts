import type { OnyxActionType } from "@/lib/onyx/types";

/** Onyx yetenek (mod) kimliği */
export type OnyxModeId =
  | "sokratik"
  | "acil-net-roketi"
  | "hedef-net-yol-haritasi"
  | "osym-zor-konular"
  | "gunun-gorevleri"
  | "kriz-modu";

export type OnyxModeBehavior =
  | "sokratik-text"
  | "interactive-ask"
  | "instant";

export type OnyxModeOption = {
  id: OnyxModeId;
  label: string;
  description: string;
  actionId: OnyxActionType;
  promptText: string;
  behavior: OnyxModeBehavior;
};

export const ONYX_MODE_SELECTOR_PLACEHOLDER = "⚡ Onyx Modu Seç";

export const ONYX_MODE_OPTIONS: OnyxModeOption[] = [
  {
    id: "sokratik",
    label: "🎓 Sokratik Soru Çözümü",
    description: "Adım adım yönlendirme — önce ipucu, sonra çözüm",
    actionId: "soru-metin",
    promptText:
      "Sokratik Soru Çözümü modu: Soruyu adım adım çöz, önce ipucu ver, çözümü hemen verme.",
    behavior: "sokratik-text",
  },
  {
    id: "acil-net-roketi",
    label: "🚀 Acil Net Roketi",
    description: "Düşük nette high-ROI banko konulara triage",
    actionId: "acil-net-roketi",
    promptText: `🚀 Acil Net Roketi modu aktif. High_Yield_Strategist skill'ini kullan: [ÖĞRENCİ VERİSİ]ndeki netlerime göre triage (acil müdahale) yap. Düşük nette zor/uzun konuları önerme; high-ROI banko konulara odaklan. Yanıtı şu formatta ver: 1) Gerçekçi Hedef, 2) Saldırı Planı (konu + ÖSYM banko soru sayısı), 3) Kesin Yasaklar.`,
    behavior: "instant",
  },
  {
    id: "hedef-net-yol-haritasi",
    label: "🎯 Hedef Net Yol Haritası",
    description: "Ders ve hedef nete göre optimum konu reçetesi",
    actionId: "hedef-net-yol-haritasi",
    promptText: `🎯 Hedef Net Yol Haritası — Target_Net_Builder skill 1. AŞAMA: Önce hangi dersten hedef nete ulaşmak istediğimi ve şu anki netimi sor; analiz sunma, DUR.`,
    behavior: "interactive-ask",
  },
  {
    id: "osym-zor-konular",
    label: "☠️ ÖSYM Boss Konuları",
    description: "Eleyici konular, tuzaklar ve taktikler",
    actionId: "osym-zor-konular",
    promptText: `☠️ ÖSYM'nin En Zor Konuları — Boss_Topic_Analyzer skill 1. AŞAMA: Önce hangi dersin en zor konularını görmek istediğimi sor; analiz sunma, DUR.`,
    behavior: "interactive-ask",
  },
  {
    id: "gunun-gorevleri",
    label: "📜 Günün Görevleri (Quests)",
    description: "RPG tarzı 3 Epik Görev",
    actionId: "gunun-gorevleri",
    promptText: `📜 Günün Görevleri (Quests) modu aktif. Daily_Quest_Master skill'ini kullan: FRP/RPG Görev Veren karakter gibi konuş; öğrencinin eksiklerine göre bugün bitirmesi gereken 3 net, ölçülebilir Epik Görev belirle. "Çalışma programı" gibi sıkıcı dil kullanma.`,
    behavior: "instant",
  },
  {
    id: "kriz-modu",
    label: "🆘 Kriz & Motivasyon Modu",
    description: "Empati, growth mindset, mental dinlenme",
    actionId: "kriz-modu",
    promptText: `🆘 Kriz Modu (Motivasyon) aktif. Burnout_Detector skill'ini kullan: Tüm akademik dili ve Sokratik soru sormayı bırak. Empati kur, gelişim zihniyeti aşıla; [ÖĞRENCİ VERİSİ]ndeki geçmiş başarıları hatırlat. Kesinlikle "Şimdi şu konuya çalış" deme; mental dinlenmeyi teşvik et.`,
    behavior: "instant",
  },
];

export function getOnyxModeById(id: OnyxModeId): OnyxModeOption | undefined {
  return ONYX_MODE_OPTIONS.find((m) => m.id === id);
}
