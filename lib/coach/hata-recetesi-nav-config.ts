import { HATA_RECETESI_ROUTES } from "@/lib/hata-recetesi/constants";

export { HATA_RECETESI_ROUTES };

export const hataRecetesiNavGroup = {
  label: "Hata Reçetesi",
  icon: "clipboard" as const,
  children: [
    { label: "Reçete Yaz", href: HATA_RECETESI_ROUTES.receteYaz },
    { label: "Reçete Deposu", href: HATA_RECETESI_ROUTES.receteDeposu },
    { label: "Hatalı Soru Havuzu", href: HATA_RECETESI_ROUTES.havuz },
  ],
} as const;
