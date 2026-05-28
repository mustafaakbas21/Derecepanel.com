import { TEST_MAKER_ROUTES } from "@/lib/test-maker/constants";

export const testMakerNavGroup = {
  label: "Test Maker",
  icon: "penTool" as const,
  defaultOpen: true,
  children: [
    { label: "Test Oluşturucu", href: TEST_MAKER_ROUTES.olusturucu },
    { label: "Otomatik Soru Kırpıcı", href: TEST_MAKER_ROUTES.kirpici },
    { label: "Soru Havuzu", href: TEST_MAKER_ROUTES.havuz },
  ],
} as const;
