import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bot,
  CalendarDays,
  CalendarRange,
  ClipboardList,
  GraduationCap,
  Layers,
  Library,
  ListChecks,
  Pill,
  Scissors,
  Target,
  Users,
  Video,
  Wand2,
} from "lucide-react";

import type { CoachModuleVisual } from "@/lib/marketing/coach-panel-features";

export type LandingFeatureItem = {
  icon: LucideIcon;
  tag: string;
  title: string;
  description: string;
  detail: string;
  longDetail: string;
  bullets: string[];
  capabilities: string[];
  visual: CoachModuleVisual;
  accent: string;
};

export type LandingFeatureGroup = {
  id: string;
  menuLabel: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  features: LandingFeatureItem[];
};

export const LANDING_ECOSYSTEM_HEADING = {
  eyebrow: "Özellikler",
  title: "Koç panelinin",
  titleAccent: "tüm modülleri.",
  subtitle:
    "Onyx AI ve görüşme odasından deneme analizine, haftalık programdan test üretimine — dört kategoride keşfedin.",
};

/** Platform katmanı — sidebar dışı ama tüm akışa bağlı */
export const LANDING_PLATFORM_FEATURES: LandingFeatureItem[] = [
  {
    icon: Bot,
    tag: "Onyx AI",
    title: "Öğrenci verisiyle konuşan yapay zeka asistanı",
    description: "Net, konu eksikleri ve hedef puan üzerine soru-cevap.",
    detail: "Doğal dilde özet, aksiyon önerisi ve öğrenci karşılaştırması.",
    longDetail:
      "“Ahmet’in son üç denemesinde fizikte ne oldu?” diye sorun; Onyx saniyeler içinde özetler. Deneme sonuçları, konu takibi ve hedef puan verisini okuyarak somut öneriler sunar — Excel’de gece yarısı tablo açmanıza gerek kalmaz.",
    bullets: ["Doğal dilde soru-cevap", "Öğrenci özet raporu", "Aksiyon önerisi listesi"],
    capabilities: [
      "Deneme ve konu verisiyle bağlam",
      "Koç ve öğrenci panelinde erişim",
      "Hızlı karşılaştırmalı analiz",
      "Haftalık program önerisi desteği",
    ],
    visual: "onyx",
    accent: "#0f172a",
  },
  {
    icon: Video,
    tag: "Smart Session Room",
    title: "Jitsi entegreli canlı görüşme odası",
    description: "Pomodoro, gündem notları ve oturum özeti tek yerde.",
    detail: "Zoom linki aramadan koçluk görüşmesi; süre ve notlar kayıtlı kalır.",
    longDetail:
      "Öğrenci profiline bağlı görüşme odası açın. Pomodoro zamanlayıcı, gündem maddeleri ve oturum notları aynı ekranda — görüşme bittiğinde ne konuştuğunuz kaybolmaz, randevu akışına geri dönersiniz.",
    bullets: ["Jitsi video görüşme", "Pomodoro zamanlayıcı", "Oturum notu arşivi"],
    capabilities: [
      "Tek tıkla oda oluşturma",
      "Randevu modülü entegrasyonu",
      "Gündem ve süre takibi",
      "Öğrenci profiline not kaydı",
    ],
    visual: "session",
    accent: "#f97316",
  },
];

/** Koç sidebar sırasına yakın: 4 + 4 + 4 */
export const LANDING_FEATURE_GROUPS: LandingFeatureGroup[] = [
  {
    id: "yonetim",
    menuLabel: "Yönetim",
    eyebrow: "Grup 1 · Yönetim",
    title: "Öğrenci, sınıf ve müfredat takibi",
    subtitle:
      "Önce öğrenciyi tanırsınız, sınıfa ve randevuya bağlarsınız; konu takibi tüm sonraki modüllere veri sağlar.",
    features: [
      {
        icon: Users,
        tag: "Öğrenciler",
        title: "Profil, hedef bölüm ve risk etiketi",
        description: "Kayıt, YÖK Atlas hedefi ve durum kartları.",
        detail: "Öğrenci listesi, hedef üniversite/bölüm profili ve Yolunda / Takipte / Dikkat etiketleri.",
        longDetail:
          "Sidebar’daki Öğrenciler ekranında her öğrencinin hedefi, son netleri ve risk durumu tek kartta. Veli görüşmesine girmeden önce profilden özet alırsınız; filtreler sınıf ve hedef bölüme göre çalışır.",
        bullets: ["Öğrenci kayıt ve profil", "Hedef bölüm (YÖK Atlas)", "Durum etiketleri"],
        capabilities: [
          "Lisans / önlisans hedef eşleştirme",
          "Net trendi profil kartında",
          "Toplu filtre ve arama",
          "Deneme geçmişine hızlı erişim",
        ],
        visual: "students",
        accent: "#ea580c",
      },
      {
        icon: GraduationCap,
        tag: "Sınıflarım",
        title: "Grup koçluğu ve sınıf bazlı atama",
        description: "TYT / AYT grupları, toplu işlemler.",
        detail: "Sınıf oluşturma, öğrenci atama ve gruba özel program / kaynak dağıtımı.",
        longDetail:
          "Sınıflarım modülünde grupları tanımlayıp öğrencileri atarsınız. Haftalık program, kitap ataması ve deneme takibi sınıf filtresiyle toplu yönetilir.",
        bullets: ["Sınıf grupları", "Öğrenci atama", "Sınıf bazlı filtre"],
        capabilities: [
          "Çoklu sınıf yönetimi",
          "Gruba toplu program atama",
          "Gruba kaynak atama",
          "Sınıf performans özeti",
        ],
        visual: "classes",
        accent: "#c2410c",
      },
      {
        icon: CalendarDays,
        tag: "Randevular",
        title: "Görüşme takvimi ve veli randevuları",
        description: "Planlama, hatırlatma, görüşme notları.",
        detail: "Randevu oluşturma; öğrenci panelinde eş zamanlı görünüm.",
        longDetail:
          "Randevular modülünde veli görüşmesi, birebir koçluk ve grup seanslarını planlarsınız. Notlar öğrenci profiline bağlanır; öğrenci panelinde randevu anlık yansır.",
        bullets: ["Takvim görünümü", "Görüşme notları", "Öğrenci paneli senkron"],
        capabilities: [
          "Haftalık / aylık takvim",
          "Randevu türü etiketleme",
          "Profil bağlantılı notlar",
          "Hatırlatma akışı",
        ],
        visual: "classes",
        accent: "#b45309",
      },
      {
        icon: ListChecks,
        tag: "Konu Takip Merkezi",
        title: "Müfredat ilerlemesi ve genel bakış",
        description: "Konu Takibi + Genel Bakış panoları.",
        detail: "Resmi YKS müfredatıyla senkron tamamlanma; zayıf konu vurgusu.",
        longDetail:
          "Konu Takibi ekranında ders/konu tamamlanma yüzdesi; Genel Bakış’ta tüm öğrencilerin eksikleri. Haftalık program ve reçete modülleri bu veriyi kullanır.",
        bullets: ["Konu Takibi", "Genel Bakış", "Zayıf konu alarmı"],
        capabilities: [
          "TYT / AYT müfredat senkronu",
          "Konu bazlı tamamlanma %",
          "Sınıf geneli pano",
          "Eksik konu listesi export",
        ],
        visual: "topics",
        accent: "#9a3412",
      },
    ],
  },
  {
    id: "olcum",
    menuLabel: "Ölçüm & Hedef",
    eyebrow: "Grup 2 · Ölçüm & Hedef",
    title: "Program, deneme ve hedef simülasyonu",
    subtitle:
      "Haftalık plan konu verisinden beslenir; deneme sonuçları analiz merkezine akar; YKS Sim hedef mesafesini gösterir.",
    features: [
      {
        icon: CalendarRange,
        tag: "Haftalık Program",
        title: "Otonom plan ve kayıtlı şablonlar",
        description: "Otonom Haftalık Program + arşiv.",
        detail: "Zayıf konuya göre plan üretimi; öğrenciye veya sınıfa tek tıkla atama.",
        longDetail:
          "Otonom Haftalık Program oluşturucu konu takip verisini kullanır. Kayıtlı Haftalık Programlar arşivinden şablon kopyalayın; öğrenci panelinde günlük görev listesi olarak görünür.",
        bullets: ["Otonom oluşturucu", "Kayıtlı programlar", "Anlık atama"],
        capabilities: [
          "Zayıf konuya göre otomatik plan",
          "Şablon kütüphanesi",
          "Sınıfa toplu atama",
          "Geçmiş hafta karşılaştırma",
        ],
        visual: "weekly",
        accent: "#ea580c",
      },
      {
        icon: ClipboardList,
        tag: "Denemeler",
        title: "Kurumsal deneme ve global takvim",
        description: "Kurumsal Denemeler + Global Deneme Takvimi.",
        detail: "Deneme tanımlama, takvim ve sonuç yükleme öncesi hazırlık.",
        longDetail:
          "Kurumsal Denemeler ile kurum içi sınavları yönetin; Global Deneme Takvimi ulusal denemeleri takip eder. Sonuç Yükleme ile toplu import sonrası analiz merkezi devreye girer.",
        bullets: ["Kurumsal denemeler", "Global takvim", "Sonuç yükleme"],
        capabilities: [
          "Deneme tanımlama ve tarih",
          "Global takvim entegrasyonu",
          "Toplu sonuç import",
          "Sınıf bazlı deneme listesi",
        ],
        visual: "exams",
        accent: "#c2410c",
      },
      {
        icon: Target,
        tag: "Sonuç & Analiz Merkezi",
        title: "Sonuç merkezi, heatmap ve triage",
        description: "Sonuç Merkezi + Analiz Merkezi (beta).",
        detail: "Toplu karşılaştırma, gelişim heatmap'i ve risk triage matrisi.",
        longDetail:
          "Sonuç Merkezi’nde sınıf ve bireysel kıyaslama; Analiz Merkezi’nde 12 haftalık heatmap ve Acil Müdahale Matrisi. Neti düşen öğrenciler otomatik kritik bandına düşer.",
        bullets: ["Sonuç merkezi", "Gelişim heatmap", "Triage matrisi"],
        capabilities: [
          "Toplu sonuç karşılaştırma",
          "Konu bazlı heatmap",
          "Kritik / Dikkat / Normal triage",
          "Çoklu deneme kırılımı",
        ],
        visual: "analytics",
        accent: "#b45309",
      },
      {
        icon: Wand2,
        tag: "YKS Simülasyon",
        title: "Tercih, net ve puan sihirbazları",
        description: "Tercih / Net / Puan / YKS Konuları.",
        detail: "YÖK Atlas ile hedefe mesafe ve tercih senaryoları.",
        longDetail:
          "Tercih Sihirbazı gerçek taban puanlarla listeyi test eder; Net Sihirbazı hangi derste kaç net gerektiğini gösterir. Puan Hesaplama ve YKS Konuları tam simülasyon hattını tamamlar.",
        bullets: ["Tercih sihirbazı", "Net sihirbazı", "Puan hesaplama"],
        capabilities: [
          "Lisans / önlisans atlas",
          "Hedef bölüme mesafe",
          "Net artış senaryoları",
          "YKS konu haritası",
        ],
        visual: "yks",
        accent: "#0f766e",
      },
    ],
  },
  {
    id: "uretim",
    menuLabel: "İçerik & Üretim",
    eyebrow: "Grup 3 · İçerik & Üretim",
    title: "Kaynak, reçete, test ve tarama hattı",
    subtitle:
          "Kütüphaneden reçeteye, Test Maker’dan fasikül arşivine — deneme analizinden gelen veri içerik modüllerine aktarılır.",
    features: [
      {
        icon: Library,
        tag: "Kitap Kütüphanesi",
        title: "Kitap listesi ve kaynak atama",
        description: "Kitap Listesi & Kayıt + Kaynak Atama.",
        detail: "Katalog, atama ve öğrenci panelinde ilerleme takibi.",
        longDetail:
          "Kitap Listesi & Kayıt ile kaynakları tanımlayın; Kaynak Atama ile öğrenci veya sınıfa dağıtın. Okuma ilerlemesi koç panelinden ve öğrenci panelinden izlenir.",
        bullets: ["Kitap katalogu", "Kaynak atama", "İlerleme takibi"],
        capabilities: [
          "Kitap meta ve kapak",
          "Bireysel / sınıf ataması",
          "İlerleme yüzdesi",
          "Öğrenci paneli görünümü",
        ],
        visual: "library",
        accent: "#fb923c",
      },
      {
        icon: Pill,
        tag: "Hata Reçetesi",
        title: "Reçete yaz, depola, havuzdan seç",
        description: "Reçete Yaz + Depo + Hatalı Soru Havuzu.",
        detail: "Denemeden gelen yanlışlara hedefli çalışma paketi.",
        longDetail:
          "Reçete Yaz ile kişisel paket oluşturun; Reçete Deposu’ndan şablon kopyalayın. Hatalı Soru Havuzu deneme analiziyle beslenir; tamamlanma koça bildirilir.",
        bullets: ["Reçete yaz", "Reçete deposu", "Hatalı soru havuzu"],
        capabilities: [
          "Denemeden soru aktarımı",
          "Şablon arşivi",
          "Havuz arama ve filtre",
          "Tamamlanma bildirimi",
        ],
        visual: "recipe",
        accent: "#f87171",
      },
      {
        icon: Scissors,
        tag: "Test Maker",
        title: "Test oluşturucu ve soru kırpıcı",
        description: "Oluşturucu + Otomatik Kırpıcı + Soru Havuzu.",
        detail: "PDF’ten test; merkezi havuzdan tekrar kullanım.",
        longDetail:
          "Test Oluşturucu ile paket hazırlayın; Otomatik Soru Kırpıcı PDF kaynakları işler. Soru Havuzu kurumsal soru bankanız — aynı soruyu her seferinde yeniden kırpmazsınız.",
        bullets: ["Test oluşturucu", "Soru kırpıcı", "Soru havuzu"],
        capabilities: [
          "PDF’ten otom kırpma",
          "Konu etiketleme",
          "Test paketi export",
          "Merkezi havuz yönetimi",
        ],
        visual: "testmaker",
        accent: "#ea580c",
      },
      {
        icon: Layers,
        tag: "Taramalar ve Fasiküller",
        title: "Tarama analizi, oluşturma ve arşiv",
        description: "Analiz, oluşturma, depo ve fasikül modülleri.",
        detail: "Tarama Analiz, Tarama Oluşturma, Tarama/Fasikül depoları.",
        longDetail:
          "Tarama Analiz ve Raporlama sonuçları konu kırılımına ayırır; Tarama Oluşturma yeni set üretir. Fasikül Oluşturma ve depolar kurumsal arşivinizi oluşturur.",
        bullets: ["Tarama analizi", "Tarama oluşturma", "Fasikül arşivi"],
        capabilities: [
          "Tarama raporlama",
          "Tarama deposu",
          "Fasikül paketleme",
          "Fasikül deposu",
        ],
        visual: "scans",
        accent: "#a78bfa",
      },
    ],
  },
];

/** Tüm modüller — platform + 3 grup */
export function getAllLandingFeatures(): LandingFeatureItem[] {
  return [
    ...LANDING_PLATFORM_FEATURES,
    ...LANDING_FEATURE_GROUPS.flatMap((g) => g.features),
  ];
}

/** Özellikler sekmesi — 4 elit kategori */
export type LandingFeatureTab = {
  id: string;
  label: string;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  subtitle: string;
  features: LandingFeatureItem[];
  /** Platform kartları yatay featured layout */
  featuredLayout?: boolean;
  moduleCount: number;
};

export const LANDING_FEATURE_TABS: LandingFeatureTab[] = [
  {
    id: "platform",
    label: "Platform",
    icon: Bot,
    eyebrow: "Katman · Platform",
    title: "Onyx AI ve canlı görüşme altyapısı",
    subtitle:
      "Tüm modüllerin üzerinde çalışan yapay zeka ve görüşme katmanı — veriyi okur, önerir ve koçluk seansını tek ekranda toplar.",
    features: LANDING_PLATFORM_FEATURES,
    moduleCount: 2,
  },
  ...LANDING_FEATURE_GROUPS.map((group) => ({
    id: group.id,
    label: group.menuLabel,
    icon:
      group.id === "yonetim"
        ? Users
        : group.id === "olcum"
          ? Target
          : Layers,
    eyebrow: group.eyebrow,
    title: group.title,
    subtitle: group.subtitle,
    features: group.features,
    moduleCount: group.features.length,
  })),
];
