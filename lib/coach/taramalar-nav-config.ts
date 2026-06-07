export const TARAMALAR_ROUTES = {
  root: "/dashboard/taramalar",
  analiz: "/dashboard/taramalar/analiz",
  olusturma: "/dashboard/taramalar/olusturma",
  deposu: "/dashboard/taramalar/deposu",
  fasikulOlusturma: "/dashboard/taramalar/fasikul/olusturma",
  fasikulDeposu: "/dashboard/taramalar/fasikul/deposu",
} as const;

export const taramalarNavGroup = {
  label: "Taramalar ve Fasiküller",
  children: [
    { label: "Tarama Analiz ve Raporlama", href: TARAMALAR_ROUTES.analiz },
    { label: "Tarama Oluşturma", href: TARAMALAR_ROUTES.olusturma },
    { label: "Tarama Deposu", href: TARAMALAR_ROUTES.deposu },
    { label: "Fasikül Oluşturma", href: TARAMALAR_ROUTES.fasikulOlusturma },
    { label: "Fasikül Deposu", href: TARAMALAR_ROUTES.fasikulDeposu },
  ],
} as const;
