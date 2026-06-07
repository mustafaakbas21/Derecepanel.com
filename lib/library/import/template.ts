import * as XLSX from "xlsx";

import { BOOK_KIND_LABELS } from "@/lib/library/constants";

const TEMPLATE_HEADERS = [
  "Kitap Adı",
  "Yayınevi",
  "Tür",
  "Ders",
  "Konular",
  "Yayın Yılı",
  "Tahmini Soru Sayısı",
  "Zorluk (1-5)",
  "Video Desteği",
  "Stil",
] as const;

const EXAMPLE_ROW = [
  "Örnek Kitap",
  "Örnek Yayın",
  "Soru Bankası",
  "TYT Matematik",
  "Temel Kavramlar, Sayılar",
  "2025-2026 MEB Uyumlu",
  "1200",
  "3",
  "Hayır",
  "ÖSYM Tarzı",
];

const NOTE_ROW = [
  "NOT: Örnek Kitap satırı içe aktarımda otomatik atlanır. Tür: Soru Bankası, Konu Anlatımı, Deneme, Fasikül.",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
];

const COL_WIDTHS = [28, 18, 16, 22, 32, 22, 14, 12, 14, 16];

const KIND_HINT = Object.values(BOOK_KIND_LABELS).join(" · ");

/** İstemcide Kitap_Import_Sablonu.xlsx indirir */
export function downloadBookImportTemplate() {
  const wb = XLSX.utils.book_new();
  const data: string[][] = [
    [...TEMPLATE_HEADERS],
    [...EXAMPLE_ROW],
    [...NOTE_ROW],
    ["", "", `Tür seçenekleri: ${KIND_HINT}`, "", "", "", "", "", "", ""],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = COL_WIDTHS.map((wch) => ({ wch }));
  XLSX.utils.book_append_sheet(wb, ws, "Kitaplar");
  XLSX.writeFile(wb, "Kitap_Import_Sablonu.xlsx");
}

export { TEMPLATE_HEADERS };
