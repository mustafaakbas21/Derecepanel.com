import type { LucideIcon } from "lucide-react";
import {
  Brain,
  Camera,
  Crosshair,
  Flame,
  LifeBuoy,
  Lightbulb,
  Rocket,
  ScrollText,
  Skull,
  TrendingUp,
} from "lucide-react";

import type { OnyxActionType } from "@/lib/onyx/types";
import { ONYX_QUICK_PROMPTS } from "@/lib/onyx/quick-prompts";

export type OnyxRole = "coach" | "student";

export type OnyxRoleQuickPrompt = {
  id: OnyxActionType;
  label: string;
  promptText: string;
  icon: LucideIcon;
};

const STUDENT_FEYNMAN_PROMPT = `Feynman Modu: Seçtiğim veya en zorlandığım bir YKS konusunu 5 yaşındaki birine anlatıyormuş gibi basitleştir. Önce kavramın özünü 3 cümleyle özetle, sonra 1 Sokratik soru sor, ardından adım adım örnek ver. Formülleri Markdown LaTeX ($ / $$) ile yaz.`;

const STUDENT_NET_PREDICTOR_PROMPT = `Net Tahmincisi: Son deneme netlerime ve konu tamamlama durumuma bakarak önümüzdeki 2–4 hafta için gerçekçi net aralığı tahmin et. Branş branş kısa tablo ver; hangi dersin hedefimi tehdit ettiğini net yaz. Motivasyon cümlesi değil, veriye dayalı taktik ver.`;

const BOSS_SAVASI_PROMPT = `🔥 Boss Savaşı modu aktif. [ÖĞRENCİ VERİSİ]ndeki son çalışılan konuya göre ÖSYM standartlarında, çoklu kazanım (iki konuyu birleştiren) içeren zor bir soru sor. Adaptive_Difficulty_Engine skill'ini kullan; çözümü hemen verme, adım adım yönlendir.`;

const GUNUN_GOREVLERI_PROMPT = `📜 Günün Görevleri (Quests) modu aktif. Daily_Quest_Master skill'ini kullan: FRP/RPG Görev Veren karakter gibi konuş; öğrencinin eksiklerine göre bugün bitirmesi gereken 3 net, ölçülebilir Epik Görev belirle. "Çalışma programı" gibi sıkıcı dil kullanma.`;

const KRIZ_MODU_PROMPT = `🆘 Kriz Modu (Motivasyon) aktif. Burnout_Detector skill'ini kullan: Tüm akademik dili ve Sokratik soru sormayı bırak. Empati kur, gelişim zihniyeti aşıla; [ÖĞRENCİ VERİSİ]ndeki geçmiş başarıları hatırlat. Kesinlikle "Şimdi şu konuya çalış" deme; mental dinlenmeyi teşvik et.`;

const ACIL_NET_ROKETI_PROMPT = `🚀 Acil Net Roketi modu aktif. High_Yield_Strategist skill'ini kullan: [ÖĞRENCİ VERİSİ]ndeki netlerime göre triage (acil müdahale) yap. Düşük nette zor/uzun konuları önerme; high-ROI banko konulara odaklan. Yanıtı şu formatta ver: 1) Gerçekçi Hedef, 2) Saldırı Planı (konu + ÖSYM banko soru sayısı), 3) Kesin Yasaklar.`;

const MENTAL_CHECK_IN_PROMPT = `🧠 Mental Check-in modu aktif. Resilience_Mentor skill'ini kullan: Pasif teselli yasak ("Üzülme, yaparsın" gibi ifadeler kullanma). Hataları "kod hatası" veya "çözülecek bulmaca" olarak çerçevele. Mesajın sonunda beni harekete geçirecek tek bir mikro eylem koy.`;

const HEDEF_NET_YOL_HARITASI_PROMPT = `🎯 Hedef Net Yol Haritası — Target_Net_Builder skill 1. AŞAMA: Önce hangi dersten hedef nete ulaşmak istediğimi ve şu anki netimi sor; analiz sunma, DUR.`;

const OSYM_ZOR_KONULAR_PROMPT = `☠️ ÖSYM'nin En Zor Konuları — Boss_Topic_Analyzer skill 1. AŞAMA: Önce hangi dersin en zor konularını görmek istediğimi sor; analiz sunma, DUR.`;

/** Oyunlaştırma & psikolojik destek pill'leri */
export const ONYX_GAMIFICATION_QUICK_PROMPTS: OnyxRoleQuickPrompt[] = [
  {
    id: "boss-savasi",
    label: "🔥 Boss Savaşı (Zor Soru)",
    promptText: BOSS_SAVASI_PROMPT,
    icon: Flame,
  },
  {
    id: "gunun-gorevleri",
    label: "📜 Günün Görevleri (Quests)",
    promptText: GUNUN_GOREVLERI_PROMPT,
    icon: ScrollText,
  },
  {
    id: "kriz-modu",
    label: "🆘 Kriz Modu (Motivasyon)",
    promptText: KRIZ_MODU_PROMPT,
    icon: LifeBuoy,
  },
];

/** Taktiksel odak & sürekli mentörlük pill'leri */
export const ONYX_TACTICAL_MENTORSHIP_QUICK_PROMPTS: OnyxRoleQuickPrompt[] = [
  {
    id: "acil-net-roketi",
    label: "🚀 Acil Net Roketi (5'ten 15'e)",
    promptText: ACIL_NET_ROKETI_PROMPT,
    icon: Rocket,
  },
  {
    id: "mental-check-in",
    label: "🧠 Mental Check-in",
    promptText: MENTAL_CHECK_IN_PROMPT,
    icon: Brain,
  },
];

/** Etkileşimli (Ask-First) pill'leri */
export const ONYX_INTERACTIVE_QUICK_PROMPTS: OnyxRoleQuickPrompt[] = [
  {
    id: "hedef-net-yol-haritasi",
    label: "🎯 Hedef Net Yol Haritası",
    promptText: HEDEF_NET_YOL_HARITASI_PROMPT,
    icon: Crosshair,
  },
  {
    id: "osym-zor-konular",
    label: "☠️ ÖSYM'nin En Zor Konuları",
    promptText: OSYM_ZOR_KONULAR_PROMPT,
    icon: Skull,
  },
];

/** Role göre hızlı aksiyon pill'leri */
export const ONYX_ROLE_QUICK_PROMPTS: Record<OnyxRole, OnyxRoleQuickPrompt[]> = {
  coach: ONYX_QUICK_PROMPTS,
  student: [
    {
      id: "soru-fotografi",
      label: "Fotoğraflı Soru Çöz",
      promptText: "Soru fotoğrafı yükle",
      icon: Camera,
    },
    {
      id: "feynman-modu",
      label: "Feynman Modu",
      promptText: STUDENT_FEYNMAN_PROMPT,
      icon: Lightbulb,
    },
    {
      id: "deneme-trend",
      label: "Net Tahmincisi",
      promptText: STUDENT_NET_PREDICTOR_PROMPT,
      icon: TrendingUp,
    },
  ],
};

/** Öğrenci + koç — tüm hızlı aksiyon pill'leri (tek havuz) */
export function getOnyxUnifiedQuickPrompts(): OnyxRoleQuickPrompt[] {
  return [
    ...ONYX_ROLE_QUICK_PROMPTS.student,
    ...ONYX_QUICK_PROMPTS,
    ...ONYX_GAMIFICATION_QUICK_PROMPTS,
    ...ONYX_TACTICAL_MENTORSHIP_QUICK_PROMPTS,
    ...ONYX_INTERACTIVE_QUICK_PROMPTS,
  ];
}

export function getOnyxQuickPromptsForRole(role: OnyxRole): OnyxRoleQuickPrompt[] {
  return ONYX_ROLE_QUICK_PROMPTS[role] ?? [];
}
