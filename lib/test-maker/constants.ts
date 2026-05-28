import type { TemplateId } from "@/lib/test-maker/types";

export const TEST_MAKER_ROUTES = {
  root: "/dashboard/test-maker",
  olusturucu: "/dashboard/test-maker/olusturucu",
  kirpici: "/dashboard/test-maker/kirpici",
  havuz: "/dashboard/test-maker/havuz",
} as const;

export const TEST_MAKER_SUBNAV = [
  { label: "Test Oluşturucu", href: TEST_MAKER_ROUTES.olusturucu },
  { label: "Otomatik Soru Kırpıcı", href: TEST_MAKER_ROUTES.kirpici },
  { label: "Soru Havuzu", href: TEST_MAKER_ROUTES.havuz },
] as const;

export const STORAGE_KEYS = {
  questionPool: "derece_soru_havuzu",
  wrongPool: "derece_hatali_soru_havuzu",
  exports: "test_maker_exports",
  matrixBundle: "test_maker_matrix_bundle_v1",
  institutionBrief: "tm-brief-kurum",
  transferTarama: "transfer_tarama_sorulari",
  transferRecipe: "aktarilanReceteSorulari",
  transferDers: "aktarilanDers",
  transferKonu: "aktarilanKonu",
  transferDersText: "aktarilanDersText",
  transferKonuText: "aktarilanKonuText",
  transferEdit: "transfer_tarama_edit",
  transferAutoprint: "transfer_tarama_autoprint",
} as const;

export const PDF_MAX_BYTES = 100 * 1024 * 1024;

export const TEMPLATES: { id: TemplateId; name: string }[] = [
  { id: "derece", name: "Derece Kurumsal" },
  { id: "uc-boyutlu", name: "Üç Boyutlu Vizyon" },
  { id: "sarmal", name: "Sarmal Dinamik" },
  { id: "yeni-nesil", name: "Yeni Nesil 3-4-5" },
  { id: "limitless", name: "Limitless Format" },
  { id: "hiz-renk", name: "Hız ve Renk Tarzı" },
  { id: "orijinal-mat", name: "Orijinal Mat" },
  { id: "karekök", name: "Karekök Klasik" },
  { id: "aydinlik", name: "Aydınlık Sayfalar" },
  { id: "paraf", name: "Paraf Özel" },
];

export const TARAMA_DB = {
  name: "derece_tarama_deposu",
  version: 1,
  store: "taramalar",
} as const;
