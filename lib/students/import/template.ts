import * as XLSX from "xlsx";

const TEMPLATE_HEADERS = [
  "Öğrenci No",
  "Ad",
  "Soyad",
  "TC Kimlik",
  "Cinsiyet",
  "Doğum Tarihi",
  "Sınıf/Şube",
  "Alan",
  "Öğrenci Telefon",
  "Veli Ad Soyad",
  "Veli Telefon",
  "Veli Yakınlık",
  "Kayıt Paketi",
  "Hedef Üniversite/Bölüm",
] as const;

const EXAMPLE_ROW = [
  "ÖRN-001",
  "Örnek",
  "Öğrenci",
  "",
  "Erkek",
  "01.01.2008",
  "12-A",
  "Sayısal",
  "532 000 00 00",
  "Veli Adı",
  "532 111 11 11",
  "Baba",
  "Standart",
  "Boğaziçi Üniversitesi — Bilgisayar Mühendisliği",
];

const NOTE_ROW = [
  "NOT: Ad=Örnek ve Soyad=Öğrenci satırı içe aktarımda otomatik atlanır.",
  "",
  "",
  "",
  "",
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

const COL_WIDTHS = [14, 12, 12, 14, 12, 14, 14, 12, 16, 18, 14, 14, 14, 36];

/** İstemcide Ogrenci_Import_Sablonu.xlsx indirir */
export function downloadImportTemplate() {
  const wb = XLSX.utils.book_new();
  const data: string[][] = [
    [...TEMPLATE_HEADERS],
    [...EXAMPLE_ROW],
    [...NOTE_ROW],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);

  ws["!cols"] = COL_WIDTHS.map((wch) => ({ wch }));

  XLSX.utils.book_append_sheet(wb, ws, "Ogrenciler");
  XLSX.writeFile(wb, "Ogrenci_Import_Sablonu.xlsx");
}

export { TEMPLATE_HEADERS };
