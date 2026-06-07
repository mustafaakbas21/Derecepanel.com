export const KUTUPHANE_ROUTES = {
  root: "/dashboard/kutuphane",
  kitaplar: "/dashboard/kutuphane/kitaplar",
  atama: "/dashboard/kutuphane/atama",
} as const;

export const kutuphaneNavGroup = {
  label: "Kitap Kütüphanesi",
  children: [
    { label: "Kitap Listesi & Kayıt", href: KUTUPHANE_ROUTES.kitaplar },
    { label: "Kaynak Atama", href: KUTUPHANE_ROUTES.atama },
  ],
} as const;
