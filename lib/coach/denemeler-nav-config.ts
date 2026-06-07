export const DENEMELER_ROUTES = {
  root: "/dashboard/denemeler",
  kurumsal: "/dashboard/denemeler/kurumsal",
  globalTakvim: "/dashboard/denemeler/global-takvim",
  yukleme: "/dashboard/denemeler/yukleme",
  sonucMerkezi: "/dashboard/denemeler/sonuc-merkezi",
} as const;

export const ANALIZ_MERKEZI_ROUTE = "/dashboard/analiz-merkezi";

export const denemelerNavGroup = {
  label: "Denemeler",
  icon: "clipboardList" as const,
  children: [
    { label: "Kurumsal Denemeler", href: DENEMELER_ROUTES.kurumsal },
    { label: "Global Deneme Takvimi", href: DENEMELER_ROUTES.globalTakvim },
    { label: "Sonuç Merkezi", href: DENEMELER_ROUTES.sonucMerkezi },
    { label: "Analiz Merkezi", href: ANALIZ_MERKEZI_ROUTE, beta: true as const },
    { label: "Sonuç Yükleme", href: DENEMELER_ROUTES.yukleme },
  ],
} as const;

export const OGRENCI_DENEME_ROUTES = {
  kurum: "/ogrenci/kurum-denemeler",
  global: "/ogrenci/global-deneme",
  sonuclar: "/ogrenci/deneme-sonuclari",
} as const;
