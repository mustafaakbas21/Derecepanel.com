import { TEMPLATE_REGISTRY } from "@/lib/test-maker/template-registry";
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
  questionPoolIdbMigrated: "derece_soru_havuzu_idb_v1",
  wrongPool: "derece_hatali_soru_havuzu",
  exports: "test_maker_exports",
  matrixBundle: "test_maker_matrix_bundle_v1",
  institutionBrief: "tm-brief-kurum",
  transferTarama: "transfer_tarama_sorulari",
  transferRecipe: "aktarilanReceteSorulari",
  transferReceteStudent: "receteOgrenciAdi",
  transferReceteEdit: "transfer_recete_edit",
  transferDers: "aktarilanDers",
  transferKonu: "aktarilanKonu",
  transferDersText: "aktarilanDersText",
  transferKonuText: "aktarilanKonuText",
  transferEdit: "transfer_tarama_edit",
  transferAutoprint: "transfer_tarama_autoprint",
} as const;

export const PDF_MAX_BYTES = 100 * 1024 * 1024;

/** @see lib/test-maker/template-registry.ts — tek kaynak */
export const TEMPLATES: { id: TemplateId; name: string }[] = TEMPLATE_REGISTRY.map(
  ({ id, name }) => ({ id, name })
);

export const TARAMA_DB = {
  name: "derece_tarama_deposu",
  version: 1,
  store: "taramalar",
} as const;

/** Eski panel ile uyumlu IndexedDB adı — mevcut depolar korunur */
export const PDF_DEPOSU_DB = {
  name: "pdfDeposuDB",
  version: 1,
  store: "files",
} as const;

export const PDF_DEPOSU_MAX_BYTES = 150 * 1024 * 1024;

/** Soru havuzu görselleri — localStorage yerine IndexedDB */
export const QUESTION_POOL_DB = {
  name: "derece_question_pool",
  version: 1,
  store: "items",
} as const;
