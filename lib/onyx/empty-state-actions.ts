import type { OnyxRole } from "@/lib/onyx/role-quick-prompts";
import { ONYX_QUICK_PROMPTS } from "@/lib/onyx/quick-prompts";

/** Karşılama kartı aksiyonları — `OnyxChatPanel` ile paylaşılır */
export type OnyxEmptyStateActionId =
  | "photo"
  /** Gizli file input — `photo` ile aynı davranış */
  | "file-upload"
  | "net-strategy"
  | "data-analysis"
  | "youtube-assistant"
  | "mental-coach"
  | "career-counseling"
  | "direct-ask";

export type OnyxWelcomeCardVariant = "default" | "dark";

export type OnyxEmptyStateCard = {
  id: OnyxEmptyStateActionId;
  icon: string;
  title: string;
  subtitle: string;
  hover: {
    nasilCalisir: string;
    neYapar: string;
    ekstra?: string;
  };
  cta: string;
  iconWrapClass: string;
  gridClass?: string;
  variant?: OnyxWelcomeCardVariant;
};

/** Komut paleti — master-detail önizleme alanları */
export type OnyxWelcomeSkill = {
  id: OnyxEmptyStateActionId;
  icon: string;
  title: string;
  shortDesc: string;
  howItWorks: string;
  whatItDoes: string;
  extra?: string;
  cta: string;
  variant?: OnyxWelcomeCardVariant;
};

export function welcomeCardToSkill(card: OnyxEmptyStateCard): OnyxWelcomeSkill {
  return {
    id: card.id,
    icon: card.icon,
    title: card.title,
    shortDesc: card.subtitle,
    howItWorks: card.hover.nasilCalisir,
    whatItDoes: card.hover.neYapar,
    extra: card.hover.ekstra,
    cta: card.cta,
    variant: card.variant,
  };
}

export function getOnyxWelcomeSkills(role: OnyxRole): OnyxWelcomeSkill[] {
  return getOnyxEmptyStateCards(role).map(welcomeCardToSkill);
}

export function filterWelcomeSkills(
  skills: OnyxWelcomeSkill[],
  query: string
): OnyxWelcomeSkill[] {
  const q = query.trim().toLocaleLowerCase("tr");
  if (!q) return skills;
  return skills.filter((s) => {
    const hay = [
      s.title,
      s.shortDesc,
      s.howItWorks,
      s.whatItDoes,
      s.extra ?? "",
    ]
      .join(" ")
      .toLocaleLowerCase("tr");
    return hay.includes(q);
  });
}

export function getOnyxEmptyStateCards(_role: OnyxRole): OnyxEmptyStateCard[] {
  return [
    {
      id: "photo",
      icon: "📸",
      title: "Fotoğraf Yükle",
      subtitle: "Eksik kazanım teşhisi",
      iconWrapClass: "bg-violet-50 text-violet-600",
      hover: {
        nasilCalisir: "Çözemediğin sorunun fotoğrafını yükle veya kameradan çek.",
        neYapar:
          "AI adım adım çözer; yalnızca cevap değil, hata tipini ve eksik kazanımı tespit eder.",
        ekstra: "Konu Takip Merkezine tek tıkla yönlendirme alırsın.",
      },
      cta: "Fotoğraf seç",
    },
    {
      id: "net-strategy",
      icon: "🚀",
      title: "Net & Strateji",
      subtitle: "Haftalık program önerisi",
      iconWrapClass: "bg-sky-50 text-sky-600",
      hover: {
        nasilCalisir: "Net hedefini veya «bugün ne çalışmalıyım?» sorunu yaz.",
        neYapar:
          "Mevcut–hedef net farkına göre haftalık görev listesi (JSON) üretir.",
        ekstra: "Seçtiğin görevleri tek tıkla haftalık programına ekleyebilirsin.",
      },
      cta: "Strateji sor",
    },
    {
      id: "data-analysis",
      icon: "📊",
      title: "Veri Analizi",
      subtitle: "Trend & zayıf halka",
      iconWrapClass: "bg-emerald-50 text-emerald-600",
      hover: {
        nasilCalisir: "Son denemeler panel verisinden otomatik okunur.",
        neYapar:
          "Trend grafiği çizer, zayıf konuları listeler ve turuncu uyarı kutuları üretir.",
        ekstra: "Koç modunda seçili öğrencinin son 5 denemesi karşılaştırılır.",
      },
      cta: "Analiz başlat",
    },
    {
      id: "youtube-assistant",
      icon: "▶️",
      title: "YouTube Asistanı",
      subtitle: "Video not & soru çıkarıcı",
      iconWrapClass: "bg-red-50 text-red-500",
      hover: {
        nasilCalisir: "Konu anlatım videosunun linkini sohbete yapıştır.",
        neYapar:
          "Kritik formülleri ve kavramları «Ders Notu Kartı» olarak özetler.",
        ekstra: "Videoya uygun 3 soruluk mini anlama kontrolü hazırlar.",
      },
      cta: "Linki yapıştır",
    },
    {
      id: "mental-coach",
      icon: "🧠",
      title: "Mental Koç & Psikolog",
      subtitle: "Kriz anı desteği",
      iconWrapClass: "bg-slate-800 text-violet-200",
      variant: "dark",
      gridClass: "md:col-span-2",
      hover: {
        nasilCalisir: "Stres, panik veya motivasyon düşüşünde duygunu yaz.",
        neYapar:
          "BDT temelli kısa müdahale, nefes egzersizi ve kanıta dayalı sakinleştirme sunar.",
        ekstra: "Geçmiş net artışların varsa bunları kanıt olarak gösterir.",
      },
      cta: "Destek al",
    },
    {
      id: "career-counseling",
      icon: "🧭",
      title: "Kariyer & Tercih",
      subtitle: "YÖK Atlas ile plan",
      iconWrapClass: "bg-indigo-50 text-indigo-600",
      gridClass: "md:col-span-2 lg:col-span-1",
      hover: {
        nasilCalisir: "Hedef bölümünü veya tercih sorunu yaz.",
        neYapar:
          "Gerçek taban puan verileriyle mevcut netini karşılaştırır; alternatifleri listeler.",
        ekstra: "Halüsinasyon önlemli Strict RAG — uydurma puan yok.",
      },
      cta: "Geleceğini planla",
    },
    {
      id: "direct-ask",
      icon: "💬",
      title: "Doğrudan Sor",
      subtitle: "Sokratik sohbet",
      iconWrapClass: "bg-slate-100 text-slate-600",
      hover: {
        nasilCalisir: "Konuyu veya sorunu doğal dille yaz.",
        neYapar:
          "Sokratik öğretmen gibi ezberletmeden mantığını tartışarak ilerler.",
        ekstra: "Hızlı veya Derin mod ile yanıt derinliğini seçebilirsin.",
      },
      cta: "Sohbete başla",
    },
  ];
}

export function getCareerCounselingStarterPrompt(role: OnyxRole): string {
  return role === "coach"
    ? "Seçili öğrencinin hedef bölümü için kariyer ve tercih analizi yap: taban puan karşılaştırması, alternatif bölümler ve gelecek vizyonu."
    : "Bilgisayar Mühendisliği hedefliyorum. Mevcut netlerimle taban puanlar karşılaştır; alternatif bölümler ve kariyer önerisi ver.";
}

export function getYoutubeAssistantStarterPrompt(): string {
  return "YouTube ders videosu linkini aşağıya yapıştırdım. Videodan ders notu kartları, kritik formüller ve 3 soruluk mini anlama testi çıkar.";
}

export function getMentalCoachStarterPrompt(role: OnyxRole): string {
  return role === "coach"
    ? "Seçili öğrenci stresli ve motivasyonu düştü. BDT temelli kısa destek, kanıta dayalı sakinleştirme ve nefes egzersizi öner."
    : "Şu an çok stresliyim ve sınav kaygım arttı. Bana kanıta dayalı sakinleştirme, nefes egzersizi ve kısa bir mental destek ver.";
}

export function isOnyxFileUploadAction(
  action: OnyxEmptyStateActionId | string
): boolean {
  return action === "photo" || action === "file-upload";
}

/** Karşılama kartı tıklanınca input'a yazılacak örnek metin (`null` → yalnızca odak) */
export function getEmptyStateStarterPrompt(
  action: OnyxEmptyStateActionId,
  role: OnyxRole
): string | null {
  switch (action) {
    case "photo":
    case "file-upload":
    case "direct-ask":
      return null;
    case "net-strategy":
      return "Netim düşük, nasıl artırırım? Bugün ne çalışmalıyım?";
    case "data-analysis": {
      const trend = ONYX_QUICK_PROMPTS.find((p) => p.id === "deneme-trend");
      return trend?.promptText ?? null;
    }
    case "youtube-assistant":
      return getYoutubeAssistantStarterPrompt();
    case "mental-coach":
      return getMentalCoachStarterPrompt(role);
    case "career-counseling":
      return getCareerCounselingStarterPrompt(role);
    default:
      return null;
  }
}
