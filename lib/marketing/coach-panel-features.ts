import type { LucideIcon } from "lucide-react";
import {
  CalendarRange,
  ClipboardList,
  Layers,
  Library,
  ListChecks,
  Pill,
  Scissors,
  Users,
  Wand2,
} from "lucide-react";

export type CoachModuleVisual =
  | "students"
  | "classes"
  | "exams"
  | "results"
  | "analytics"
  | "topics"
  | "weekly"
  | "library"
  | "recipe"
  | "scans"
  | "testmaker"
  | "yks"
  | "onyx"
  | "session";

export type CoachPanelFeature = {
  icon: LucideIcon;
  tag: string;
  title: string;
  description: string;
  bullets: string[];
  visual: CoachModuleVisual;
  accent: string;
};

export const COACH_PANEL_FEATURES: CoachPanelFeature[] = [
  {
    icon: Users,
    tag: "Öğrenci Yönetimi",
    title: "24 öğrenciyi aklında taşıma",
    description:
      "Her öğrencinin durumu tek bakışta — hedef bölüm, net trendi ve risk etiketi aynı kartta.",
    bullets: ["Anlık durum etiketleri", "Hedef bölüm profili", "Randevu ve görüşme notları"],
    visual: "students",
    accent: "#ea580c",
  },
  {
    icon: ClipboardList,
    tag: "Deneme Analizi",
    title: "Neti giriyorsun, panel hesaplıyor",
    description:
      "TYT/AYT denemelerini konu konu kaydedin; hata haritası ve trend grafikleri otomatik üretilir.",
    bullets: ["Konu bazlı hata dağılımı", "Haftalık trend grafikleri", "Sonuç merkezi entegrasyonu"],
    visual: "exams",
    accent: "#c2410c",
  },
  {
    icon: ListChecks,
    tag: "Konu Takip Merkezi",
    title: "Müfredat ilerlemesi net görünür",
    description:
      "YKS müfredatıyla senkron konu tamamlanma oranları; hangi derste ne kadar eksik kaldığını görün.",
    bullets: ["Konu bazlı tamamlanma", "Genel bakış panosu", "Zayıf konu vurgusu"],
    visual: "topics",
    accent: "#9a3412",
  },
  {
    icon: CalendarRange,
    tag: "Haftalık Program",
    title: "Otonom çalışma planı",
    description:
      "Öğrencinin zayıf konularına göre haftalık program oluşturun, kaydedin ve tek tıkla atayın.",
    bullets: ["Otonom program oluşturucu", "Kayıtlı şablonlar", "Öğrenciye anlık atama"],
    visual: "weekly",
    accent: "#ea580c",
  },
  {
    icon: Library,
    tag: "Kitap Kütüphanesi",
    title: "Kaynak katalogu ve atama",
    description:
      "Kitapları kataloglayın, öğrencilere atayın ve okuma ilerlemesini panelden takip edin.",
    bullets: ["Kitap listesi ve kayıt", "Kaynak atama", "İlerleme görünümü"],
    visual: "library",
    accent: "#b45309",
  },
  {
    icon: Pill,
    tag: "Hata Reçetesi",
    title: "Kişisel çalışma reçeteleri",
    description:
      "Yanlış yapılan sorulardan hedefli reçeteler yazın; depolayın ve öğrenciye gönderin.",
    bullets: ["Reçete yazma aracı", "Reçete deposu", "Hatalı soru havuzu"],
    visual: "recipe",
    accent: "#dc2626",
  },
  {
    icon: Layers,
    tag: "Taramalar & Fasiküller",
    title: "Konu taraması ve fasikül arşivi",
    description:
      "Tarama oluşturun, analiz edin, fasikül halinde paketleyip öğrencilere dağıtın.",
    bullets: ["Tarama oluşturma", "Analiz ve raporlama", "Fasikül deposu"],
    visual: "scans",
    accent: "#7c3aed",
  },
  {
    icon: Scissors,
    tag: "Test Maker",
    title: "Otonom soru kırpıcı",
    description:
      "PDF kaynaklardan soru kırpın, test oluşturun ve merkezi soru havuzunuzu yönetin.",
    bullets: ["Test oluşturucu", "Otomatik soru kırpıcı", "Soru havuzu"],
    visual: "testmaker",
    accent: "#ea580c",
  },
  {
    icon: Wand2,
    tag: "YKS Simülasyon",
    title: "Net, puan ve tercih senaryoları",
    description:
      "YÖK Atlas verisiyle tercih sihirbazı, net senaryoları ve puan hesaplama tek modülde.",
    bullets: ["Tercih sihirbazı", "Net sihirbazı", "Puan hesaplama"],
    visual: "yks",
    accent: "#0f766e",
  },
];
