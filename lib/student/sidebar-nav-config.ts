import { OGRENCI_DENEME_ROUTES } from "@/lib/coach/denemeler-nav-config";
import { OGRENCI_YKS_SIM_ROUTES } from "@/lib/coach/yks-sim-nav-config";

export { OGRENCI_DENEME_ROUTES, OGRENCI_YKS_SIM_ROUTES };

export const STUDENT_ROUTES = {
  home: "/ogrenci",
  onyx: "/ogrenci/onyx",
  randevular: "/ogrenci/randevular",
  hedefler: "/ogrenci/hedefler",
  mesajlar: "/ogrenci/mesajlar",
} as const;

export const STUDENT_HAFTALIK_PROGRAM_ROUTES = {
  root: "/ogrenci/haftalik-program",
  buHafta: "/ogrenci/haftalik-program",
  gecmis: "/ogrenci/haftalik-program/gecmis",
  bireysel: "/ogrenci/haftalik-program/bireysel",
  bireyselKayitli: "/ogrenci/haftalik-program/bireysel/kayitli",
} as const;

export const STUDENT_KONU_TAKIP_ROUTES = {
  root: "/ogrenci/konu-takip",
  durum: "/ogrenci/konu-takip",
  genelBakis: "/ogrenci/konu-takip/genel-bakis",
} as const;

export const STUDENT_KITAP_ROUTES = {
  root: "/ogrenci/kitaplarim",
  atanan: "/ogrenci/kitaplarim",
  ilerleme: "/ogrenci/kitaplarim/ilerleme",
} as const;

export const STUDENT_DENEME_ROUTES = {
  root: "/ogrenci/kurum-denemeler",
  kurumsal: OGRENCI_DENEME_ROUTES.kurum,
  global: OGRENCI_DENEME_ROUTES.global,
  sonuclar: OGRENCI_DENEME_ROUTES.sonuclar,
  analiz: "/ogrenci/analiz",
} as const;

export const STUDENT_YKS_SIM_ROUTES = {
  root: "/ogrenci/yks-sim/tercih-sihirbazi",
  tercih: OGRENCI_YKS_SIM_ROUTES.tercih,
  net: OGRENCI_YKS_SIM_ROUTES.net,
  puan: OGRENCI_YKS_SIM_ROUTES.puan,
  konular: OGRENCI_YKS_SIM_ROUTES.konular,
} as const;

export const STUDENT_HATA_RECETESI_ROUTES = {
  root: "/ogrenci/hata-recetesi",
  verilen: "/ogrenci/hata-recetesi",
  tamamlanan: "/ogrenci/hata-recetesi/tamamlanan",
} as const;

export const STUDENT_TARAMA_ROUTES = {
  taramalar: "/ogrenci/taramalar",
  fasikuller: "/ogrenci/fasikuller",
} as const;

export const studentTopNavItems = [
  { label: "Ana Sayfa", href: STUDENT_ROUTES.home, icon: "home" as const },
  { label: "Onyx AI", href: STUDENT_ROUTES.onyx, icon: "sparkles" as const },
  { label: "Randevular", href: STUDENT_ROUTES.randevular, icon: "calendar" as const },
  { label: "Hedeflerim", href: STUDENT_ROUTES.hedefler, icon: "target" as const },
  { label: "Mesajlar", href: STUDENT_ROUTES.mesajlar, icon: "message" as const },
] as const;

export const studentHaftalikProgramNavGroup = {
  label: "Haftalık Program",
  children: [
    { label: "Bu Haftaki Program", href: STUDENT_HAFTALIK_PROGRAM_ROUTES.buHafta },
    { label: "Geçmiş Programlar", href: STUDENT_HAFTALIK_PROGRAM_ROUTES.gecmis },
    {
      label: "Bireysel Haftalık Programım",
      href: STUDENT_HAFTALIK_PROGRAM_ROUTES.bireysel,
    },
  ],
} as const;

export const studentKonuTakipNavGroup = {
  label: "Konu Takibi",
  icon: "listChecks" as const,
  children: [
    { label: "Konu Durumum", href: STUDENT_KONU_TAKIP_ROUTES.durum },
    { label: "Genel Bakış", href: STUDENT_KONU_TAKIP_ROUTES.genelBakis },
  ],
} as const;

export const studentKitapNavGroup = {
  label: "Kitaplarım",
  icon: "library" as const,
  children: [
    { label: "Atanan Kitaplar", href: STUDENT_KITAP_ROUTES.atanan },
    { label: "Kitap ilerlemem", href: STUDENT_KITAP_ROUTES.ilerleme },
  ],
} as const;

export const studentDenemelerNavGroup = {
  label: "Denemeler",
  icon: "clipboardList" as const,
  children: [
    { label: "Kurumsal Denemeler", href: STUDENT_DENEME_ROUTES.kurumsal },
    { label: "Global Deneme Takvimi", href: STUDENT_DENEME_ROUTES.global },
    { label: "Sonuçlarım", href: STUDENT_DENEME_ROUTES.sonuclar },
    { label: "Analiz Merkezim", href: STUDENT_DENEME_ROUTES.analiz },
  ],
} as const;

export const studentYksSimNavGroup = {
  label: "YKS Simülasyon",
  icon: "graduationCap" as const,
  children: [
    { label: "Tercih Sihirbazı", href: STUDENT_YKS_SIM_ROUTES.tercih },
    { label: "Net Sihirbazı", href: STUDENT_YKS_SIM_ROUTES.net },
    { label: "Puan Hesaplama", href: STUDENT_YKS_SIM_ROUTES.puan },
    { label: "YKS Konuları", href: STUDENT_YKS_SIM_ROUTES.konular },
  ],
} as const;

export const studentHataRecetesiNavGroup = {
  label: "Hata Reçetesi",
  icon: "pill" as const,
  children: [
    { label: "Bana Verilen Reçeteler", href: STUDENT_HATA_RECETESI_ROUTES.verilen },
    { label: "Tamamlananlar", href: STUDENT_HATA_RECETESI_ROUTES.tamamlanan },
  ],
} as const;

export const studentTaramalarNavGroup = {
  label: "Taramalar & Fasiküller",
  icon: "layers" as const,
  children: [
    { label: "Atanan Taramalar", href: STUDENT_TARAMA_ROUTES.taramalar },
    { label: "Fasiküllerim", href: STUDENT_TARAMA_ROUTES.fasikuller },
  ],
} as const;
