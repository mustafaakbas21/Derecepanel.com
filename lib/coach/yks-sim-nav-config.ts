export const YKS_SIM_ROUTES = {
  root: "/dashboard/yks-sim",
  tercih: "/dashboard/yks-sim/tercih-sihirbazi",
  net: "/dashboard/yks-sim/net-sihirbazi",
  puan: "/dashboard/yks-sim/puan-hesaplama",
  konular: "/dashboard/yks-sim/yks-konulari",
} as const;

export const OGRENCI_YKS_SIM_ROUTES = {
  tercih: "/ogrenci/yks-sim/tercih-sihirbazi",
  net: "/ogrenci/yks-sim/net-sihirbazi",
  puan: "/ogrenci/yks-sim/puan-hesaplama",
  konular: "/ogrenci/yks-sim/yks-konulari",
} as const;

export const yksSimNavGroup = {
  label: "YKS Simülasyon",
  children: [
    { label: "Tercih Sihirbazı", href: YKS_SIM_ROUTES.tercih },
    { label: "Net Sihirbazı", href: YKS_SIM_ROUTES.net },
    { label: "Puan Hesaplama", href: YKS_SIM_ROUTES.puan },
    { label: "YKS Konuları", href: YKS_SIM_ROUTES.konular },
  ],
} as const;

export const ogrenciYksSimNav = [
  { label: "Tercih", href: OGRENCI_YKS_SIM_ROUTES.tercih },
  { label: "Net", href: OGRENCI_YKS_SIM_ROUTES.net },
  { label: "Puan", href: OGRENCI_YKS_SIM_ROUTES.puan },
  { label: "Konular", href: OGRENCI_YKS_SIM_ROUTES.konular },
] as const;
