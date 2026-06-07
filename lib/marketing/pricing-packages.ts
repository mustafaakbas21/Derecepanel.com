export type PricingPackage = {
  id: string;
  name: string;
  description: string;
  price: string;
  priceNote: string;
  highlighted?: boolean;
  badge?: string;
  cta: string;
  ctaHref: string;
  features: string[];
  limits: string[];
};

export const PRICING_PACKAGES: PricingPackage[] = [
  {
    id: "baslangic",
    name: "Başlangıç",
    description: "Sistemi test etmek isteyen bireysel koçlar için.",
    price: "Ücretsiz",
    priceNote: "14 günlük tam sürüm veya kalıcı temel kullanım.",
    cta: "Demo Talep Et",
    ctaHref: "#demo",
    limits: ["Maksimum 2 Öğrenci"],
    features: [
      "Temel öğrenci yönetimi ve manuel net girişi",
      "Haftalık program oluşturucu",
      "Standart grafikler ve YKS geri sayım",
    ],
  },
  {
    id: "profesyonel",
    name: "Profesyonel",
    description: "Portföyünü büyüten ve otomasyon arayan koçlar için.",
    price: "₺1.999",
    priceNote: "aylık · yıllık ödemede %20 indirim",
    highlighted: true,
    badge: "En popüler",
    cta: "Demo Talep Et",
    ctaHref: "#demo",
    limits: ["20 Öğrenciye kadar kapasite"],
    features: [
      "Test Maker (PDF'den soru kırpma)",
      "Hata Reçetesi ve Yanlış Havuzu",
      "Global deneme takvimi entegrasyonu",
      "Veliye otomatik WhatsApp bilgilendirme şablonları",
    ],
  },
  {
    id: "kurumsal",
    name: "Kurumsal",
    description: "Operasyonel yükünü sıfırlamak isteyen dershane ve merkezler için.",
    price: "Özel Fiyat",
    priceNote: "Şube ve öğrenci hacmine göre ölçeklenir",
    cta: "Demo Talep Et",
    ctaHref: "#demo",
    limits: ["Sınırsız öğrenci ve sınıf yönetimi"],
    features: [
      "Çoklu koç (Sub-accounts) yetkilendirme",
      "Toplu optik TXT yükleme ve anlık sıralama",
      "White-Label (Kurumunuza özel logo ve marka renkleri)",
      "Kurumsal API ve özel onboarding",
    ],
  },
];
