export type LandingFeature = {
  id: string;
  title: string;
  description: string;
};

export type LandingUseCase = {
  id: string;
  title: string;
  description: string;
  highlights: string[];
  illustration: "coach" | "institution" | "student";
};

export type LandingGrowthItem = {
  id: string;
  title: string;
  description: string;
  highlights: string[];
  icon: "scale" | "feedback" | "pipeline" | "roles";
};

export const LANDING_GROWTH_HEADING = {
  eyebrow: "Neden Derecepanel",
  title: "Bugün küçük başlayın,",
  titleAccent: "yarın büyük ölçekte devam edin.",
  subtitle:
    "Bireysel koçluktan çok şubeli kuruma — aynı panel, aynı veri hattı, aynı kalite. Büyüdükçe yeni yazılım aramanıza gerek kalmaz.",
};

export const LANDING_GROWTH_PRINCIPLES = [
  { value: "14", label: "entegre modül" },
  { value: "3", label: "panel · koç, öğrenci, kurum" },
  { value: "1", label: "ortak veri hattı" },
] as const;

export const LANDING_NAV_LINKS = [
  { label: "Özellikler", href: "#ozellikler" },
  { label: "Çözümler", href: "#cozumler" },
  { label: "Fiyatlandırma", href: "#fiyatlandirma" },
] as const;

export const LANDING_FEATURES: LandingFeature[] = [
  {
    id: "onyx-ai",
    title: "Onyx AI Asistan",
    description:
      "“Ahmet’in son üç denemesinde fizikte ne oldu?” diye sorun; saniyeler içinde özet alın. Onyx, öğrenci netlerinizi, konu eksiklerinizi ve hedef puan mesafenizi okuyup somut öneriler sunar — gece yarısı Excel açmanıza gerek kalmaz.",
  },
  {
    id: "otonom-program",
    title: "Otonom Program",
    description:
      "Her öğrenci için haftalık planı tek tek yazmak yerine sistemin zayıf konulara göre taslak üretmesine izin verin. Siz onaylayın, öğrenci anında görsün. Koçlar bu modülle program hazırlama süresini ciddi oranda kısaltıyor.",
  },
  {
    id: "deneme-analiz",
    title: "Deneme Analiz Motoru",
    description:
      "Optik dosyayı yükleyin; ders, konu ve soru bazında kırılım birkaç saniyede hazır olsun. 12 haftalık trend grafikleriyle “gerçekten ilerliyor mu?” sorusuna veriyle cevap verin. Sınıf ortalaması ile bireysel performansı aynı ekranda karşılaştırın.",
  },
  {
    id: "session-room",
    title: "Smart Session Room",
    description:
      "Zoom linki aramak, süreyi telefondan tutmak, notları kaybetmek… Hepsi tek odada. Jitsi entegrasyonu, pomodoro zamanlayıcı ve oturum özeti bir arada — görüşme bittiğinde ne konuştuğunuz kayıtlı kalsın.",
  },
  {
    id: "hata-recetesi",
    title: "Hata Reçetesi",
    description:
      "Yanlış yapılan sorulardan otomatik tekrar paketi çıkarın. Öğrenci hangi konudan kaç soru çözeceğini net görsün; siz de tamamlama oranını takip edin. “Bu konuyu bir daha geç” demek artık somut bir görev listesi.",
  },
  {
    id: "yks-sim",
    title: "YKS Simülasyonu",
    description:
      "Net sihirbazıyla “şu nete ulaşırsam puanım ne olur?” sorusunu anında yanıtlayın. YÖK Atlas verisiyle gerçek bölüm listelerine bakın; öğrenciniz hedefini hayal değil, rakam olarak konuşsun.",
  },
];

export const LANDING_GROWTH_ITEMS: LandingGrowthItem[] = [
  {
    id: "scale",
    icon: "scale",
    title: "Beş öğrenciden beş yüze, aynı düzen",
    description:
      "Portföyünüz büyüdükçe panel sizinle birlikte genişler. Sınıf, şube ve kampüs kırılımı eklenir; modüller aynı kalitede çalışmaya devam eder.",
    highlights: [
      "Sınıf ve şube bazlı filtreleme",
      "Toplu program ve kaynak ataması",
      "Büyüme için yeni yazılım gerekmez",
    ],
  },
  {
    id: "feedback",
    icon: "feedback",
    title: "Sahadan gelen seslerle şekillenen ürün",
    description:
      "Önceliklerimizi masa başında değil, gerçek koçlardan gelen geri bildirimler belirliyor. Her ay yeni iyileştirmeler ve modüller ekleniyor.",
    highlights: [
      "Koç geri bildirim döngüsü",
      "Aylık modül ve arayüz güncellemeleri",
      "Kullandıkça gelişen platform",
    ],
  },
  {
    id: "pipeline",
    icon: "pipeline",
    title: "Denemeden programa, programdan reçeteye",
    description:
      "Tek öğrenci profili altında tüm modüller konuşur. Net düştüğünde analiz, haftalık plan ve hata reçetesi aynı veriden beslenir — veri hattı kopmaz.",
    highlights: [
      "Deneme → analiz → program zinciri",
      "Konu takibi tüm modüllere veri sağlar",
      "Excel arasında kopyala-yapıştır yok",
    ],
  },
  {
    id: "roles",
    icon: "roles",
    title: "Koç, yönetici, öğrenci — herkes kendi panelinde",
    description:
      "Rol bazlı erişimle koç operasyonu, öğrenci görev listesi ve kurum yönetimi aynı platformda ama ayrı deneyimler olarak çalışır.",
    highlights: [
      "Koç atama ve yetki yönetimi",
      "Öğrenci panelinde anlık program görünümü",
      "Yönetici dashboard ve raporlama",
    ],
  },
];

export const LANDING_USE_CASES: LandingUseCase[] = [
  {
    id: "bireysel-koc",
    title: "Bireysel Koçlar",
    description:
      "Sabahtan akşama Excel, WhatsApp grupları ve dağınık notlar… Tanıdık geliyorsa yalnız değilsiniz. Derecepanel ile tüm öğrencilerinizi tek yerden yönetir, deneme analizini dakikalara indirir, haftalık programı sisteme bırakırsınız.",
    highlights: [
      "50’ye kadar öğrenciyi tek panelden takip",
      "Onyx AI ile hızlı öğrenci özeti ve aksiyon listesi",
      "Randevu ve canlı görüşme odası aynı akışta",
    ],
    illustration: "coach",
  },
  {
    id: "kurum",
    title: "Eğitim Kurumları",
    description:
      "Sınıf ortalaması, şube kıyaslaması, kurumsal deneme takvimi… Yöneticilerin istediği raporlar ve koçların ihtiyaç duyduğu araçlar aynı çatı altında. Toplu optik yükleme ile yüzlerce sonuç dakikalar içinde işlenir.",
    highlights: [
      "Sınıf ve şube bazlı karşılaştırmalı analiz",
      "Koç atama, yetki ve rol yönetimi",
      "Yönetici dashboard ve dışa aktarım raporları",
    ],
    illustration: "institution",
  },
  {
    id: "ogrenci",
    title: "YKS Öğrencileri",
    description:
      "Hedefiniz net ama “bugün ne çalışmalıyım?” sorusu belirsiz mi? Haftalık programınız, deneme geri bildiriminiz ve tekrar setleriniz tek ekranda. Koçunuzla aynı veriye bakarak konuşursunuz — kim ne dedi diye tartışmaya gerek kalmaz.",
    highlights: [
      "Günlük görevler ve tamamlama takibi",
      "Deneme sonrası anlık konu analizi",
      "YKS simülasyonu ve tercih sihirbazı",
    ],
    illustration: "student",
  },
];

export const LANDING_FOOTER_LINKS = {
  product: [
    { label: "Özellikler", href: "#ozellikler" },
    { label: "Çözümler", href: "#cozumler" },
    { label: "Fiyatlandırma", href: "#fiyatlandirma" },
    { label: "Onyx AI", href: "#ozellikler" },
  ],
  corporate: [
    { label: "Hakkımızda", href: "#cozumler" },
    { label: "Derecepanel Yayınları", href: "#ozellikler" },
    { label: "Kariyer", href: "mailto:info@derecepanel.com?subject=Kariyer%20Ba%C5%9Fvurusu" },
    { label: "İletişim", href: "mailto:info@derecepanel.com" },
  ],
} as const;

export const LANDING_FOOTER_TAGLINE =
  "YKS koçları ve eğitim kurumları için veri odaklı, yapay zeka destekli otonom operasyon merkezi.";

export const TEKMER_PARTNER = {
  href: "https://halicaitekmer.com",
  logoSrc: "/images/450x150_tekmer-logo-white.png",
  logoAlt: "Haliç AI Tekmer — Teknoloji Geliştirme Merkezi",
  label: "Ar-Ge ve Kuluçka Partnerimiz",
} as const;

export const LANDING_INSTAGRAM = {
  href: "https://www.instagram.com/derecepanel",
  label: "DerecePanel Instagram",
} as const;

