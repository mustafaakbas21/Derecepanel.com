export type PricingAudience = "ogrenci" | "koc" | "kurum";

export type PricingPlan = {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number | null;
  priceLabel?: string;
  monthlyNote?: string;
  highlighted?: boolean;
  badge?: string;
  cta: string;
  limits: string[];
  features: string[];
};

export const PRICING_AUDIENCE_TABS: { id: PricingAudience; label: string }[] = [
  { id: "ogrenci", label: "Öğrenci" },
  { id: "koc", label: "Bireysel Koç" },
  { id: "kurum", label: "Kurum" },
];

export const PRICING_PLANS: Record<PricingAudience, PricingPlan[]> = {
  ogrenci: [
    {
      id: "ogrenci-ucretsiz",
      name: "Ücretsiz",
      description:
        "Koçunuz Derecepanel kullanıyorsa temel paneli ücretsiz açabilirsiniz. Programınızı görün, deneme sonuçlarınızı takip edin.",
      monthlyPrice: null,
      priceLabel: "Ücretsiz",
      monthlyNote: "Koç bağlantısıyla süresiz temel erişim",
      cta: "Teklif Yolla",
      limits: ["1 koç bağlantısı"],
      features: [
        "Haftalık program ve görev listesi",
        "Deneme sonuçları ve net geçmişi",
        "YKS geri sayım ve hedef kartı",
        "Temel konu takip ekranı",
      ],
    },
    {
      id: "ogrenci-dijital-plus",
      name: "Dijital Plus",
      description:
        "Kendi hızınızda ilerlemek isteyen öğrenciler için. Analiz araçları, tekrar setleri ve sınırlı Onyx desteği dahil.",
      monthlyPrice: 299,
      monthlyNote: "aylık · öğrenci başına · KDV hariç",
      cta: "Teklif Yolla",
      limits: ["Tüm dijital modüller açık"],
      features: [
        "Hata reçetesi ve kişisel tekrar paketleri",
        "YKS simülasyonu ve tercih sihirbazı",
        "12 haftalık net trend grafikleri",
        "Onyx AI öğrenci asistanı (aylık kota)",
      ],
    },
    {
      id: "ogrenci-fiziksel",
      name: "Fiziksel & Deneme Paketi",
      description:
        "Kurum denemelerine katılan, basılı fasikül ve kaynak takibi isteyen öğrenciler için en kapsamlı paket.",
      monthlyPrice: 599,
      monthlyNote: "aylık · öğrenci başına · KDV hariç",
      highlighted: true,
      badge: "En kapsamlı",
      cta: "Teklif Yolla",
      limits: ["Dijital Plus’taki her şey dahil"],
      features: [
        "Kurum denemelerine otomatik katılım",
        "Fasikül ve basılı kaynak ilerlemesi",
        "Koç randevusu ve görüşme odası",
        "Öncelikli destek hattı",
      ],
    },
  ],
  koc: [
    {
      id: "koc-starter",
      name: "Starter",
      description:
        "Paneli tanımak isteyen koçlar için. Az sayıda öğrenciyle deneyip iş akışınızı oturtun — kart bilgisi gerekmez.",
      monthlyPrice: null,
      priceLabel: "Ücretsiz",
      monthlyNote: "14 gün tam sürüm, ardından 3 öğrenciye kadar",
      cta: "Teklif Yolla",
      limits: ["En fazla 3 öğrenci"],
      features: [
        "Öğrenci profili ve manuel net girişi",
        "Haftalık program oluşturucu",
        "Temel grafikler ve YKS geri sayım",
        "Deneme sonuçları arşivi",
      ],
    },
    {
      id: "koc-pro",
      name: "Pro Koç",
      description:
        "Portföyü büyüyen koçlar için. Optik okuma, hata reçetesi ve Test Maker ile operasyonu ciddi ölçüde hafifletin.",
      monthlyPrice: 999,
      monthlyNote: "aylık · KDV hariç",
      cta: "Teklif Yolla",
      limits: ["20 öğrenciye kadar"],
      features: [
        "Deneme analiz motoru ve optik yükleme",
        "Hata reçetesi ve yanlış soru havuzu",
        "Test Maker — PDF’den soru kırpma",
        "Global deneme takvimi entegrasyonu",
      ],
    },
    {
      id: "koc-growth",
      name: "Growth Koç",
      description:
        "Yoğun portföyü olan koçlar için tam paket. Onyx AI, otonom program ve görüşme odası — hepsi açık.",
      monthlyPrice: 1999,
      monthlyNote: "aylık · KDV hariç",
      highlighted: true,
      badge: "En Popüler",
      cta: "Teklif Yolla",
      limits: ["50 öğrenciye kadar"],
      features: [
        "Onyx AI — sınırsız sorgu",
        "Otonom haftalık program üretimi",
        "Smart Session Room (Jitsi + zamanlayıcı)",
        "Veli bilgilendirme mesaj şablonları",
      ],
    },
  ],
  kurum: [
    {
      id: "kurum-butik",
      name: "Butik Kurum",
      description:
        "Tek şubeli dershane veya koçluk merkezi mi? Sınıf analizi, toplu deneme yönetimi ve koç hesapları tek pakette.",
      monthlyPrice: 4999,
      monthlyNote: "aylık · KDV hariç",
      cta: "Teklif Yolla",
      limits: ["200 öğrenciye kadar", "10 koç hesabı"],
      features: [
        "Sınıf bazlı analiz ve kıyaslama",
        "Kurumsal deneme takvimi ve toplu yükleme",
        "Koç atama ve rol bazlı yetkiler",
        "Yönetici dashboard ve Excel export",
      ],
    },
    {
      id: "kurum-enterprise",
      name: "Enterprise",
      description:
        "Çok şubeli yapılar, özel marka ve API ihtiyacı olan kurumlar için. Fiyatı öğrenci ve şube hacminize göre birlikte belirleriz.",
      monthlyPrice: null,
      priceLabel: "Özel Fiyat",
      monthlyNote: "Teklif için bizimle iletişime geçin",
      cta: "Teklif Yolla",
      limits: ["Sınırsız öğrenci ve koç kapasitesi"],
      features: [
        "White-label — kurum logonuz ve renkleriniz",
        "Toplu optik TXT ve anlık sıralama",
        "Kurumsal API ve SSO entegrasyonu",
        "Özel onboarding ve SLA’lı destek",
      ],
    },
  ],
};

export function formatTry(amount: number): string {
  return `₺${Math.round(amount).toLocaleString("tr-TR")}`;
}

export function getPlanPriceDisplay(
  plan: PricingPlan,
  isYearly: boolean
): { price: string; note: string } {
  if (plan.priceLabel && plan.monthlyPrice == null) {
    return {
      price: plan.priceLabel,
      note: isYearly && plan.monthlyPrice != null ? "Yıllık faturalandırılır" : (plan.monthlyNote ?? ""),
    };
  }

  if (plan.monthlyPrice == null) {
    return { price: plan.priceLabel ?? "—", note: plan.monthlyNote ?? "" };
  }

  const amount = isYearly ? plan.monthlyPrice * 0.8 : plan.monthlyPrice;
  const note = isYearly ? "Yıllık faturalandırılır" : (plan.monthlyNote ?? "aylık · KDV hariç");

  return { price: formatTry(amount), note };
}
