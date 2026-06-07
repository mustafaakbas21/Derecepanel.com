export const KONU_TAKIP_ROUTES = {
  root: "/dashboard/konu-takip",
  takip: "/dashboard/konu-takip/takip",
  genelBakis: "/dashboard/konu-takip/genel-bakis",
} as const;

export const konuTakipNavGroup = {
  label: "Konu Takip Merkezi",
  icon: "listChecks" as const,
  children: [
    { label: "Konu Takibi", href: KONU_TAKIP_ROUTES.takip },
    { label: "Genel Bakış", href: KONU_TAKIP_ROUTES.genelBakis },
  ],
} as const;
