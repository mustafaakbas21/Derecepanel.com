export const HAFTALIK_PROGRAM_ROUTES = {
  root: "/dashboard/haftalik-program",
  olusturucu: "/dashboard/otonom-haftalik-program",
  kayitli: "/dashboard/haftalik-program/kayitli",
} as const;

export const haftalikProgramNavGroup = {
  label: "Haftalık Program",
  children: [
    {
      label: "Otonom Haftalık Program",
      href: HAFTALIK_PROGRAM_ROUTES.olusturucu,
    },
    {
      label: "Kayıtlı Haftalık Programlar",
      href: HAFTALIK_PROGRAM_ROUTES.kayitli,
    },
  ],
} as const;
