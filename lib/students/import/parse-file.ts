import * as XLSX from "xlsx";

import { validateImportFile } from "@/lib/students/import/file-validation";
import { ImportError } from "@/lib/students/import/errors";
import { normKey } from "@/lib/students/import/normalize";

export type RawSheetRow = Record<string, string>;

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function detectDelimiter(line: string): "," | ";" {
  const semi = (line.match(/;/g) ?? []).length;
  const comma = (line.match(/,/g) ?? []).length;
  return semi > comma ? ";" : ",";
}

/** CSV metnini satır listesine çevirir (test ve iç kullanım) */
export function parseCsvText(text: string): RawSheetRow[] {
  const clean = stripBom(text).trim();
  if (!clean) return [];

  const lines = clean.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const delimiter = detectDelimiter(lines[0]);
  const splitLine = (line: string) => {
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (!inQuotes && ch === delimiter) {
        out.push(cur.trim().replace(/^"|"$/g, ""));
        cur = "";
        continue;
      }
      cur += ch;
    }
    out.push(cur.trim().replace(/^"|"$/g, ""));
    return out;
  };

  const headers = splitLine(lines[0]);
  const rows: RawSheetRow[] = [];

  for (let r = 1; r < lines.length; r++) {
    const cols = splitLine(lines[r]);
    const row: RawSheetRow = {};
    let hasValue = false;
    headers.forEach((h, i) => {
      const val = (cols[i] ?? "").trim();
      if (val) hasValue = true;
      row[h] = val;
    });
    if (hasValue) rows.push(row);
  }

  return rows;
}

function sheetRowsToRaw(wb: XLSX.WorkBook): RawSheetRow[] {
  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    throw new ImportError("NO_SHEET");
  }
  const sheet = wb.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  }) as (string | number)[][];

  if (matrix.length < 2) return [];

  const headerRow = matrix[0].map((c) => String(c ?? "").trim());
  const rows: RawSheetRow[] = [];

  for (let r = 1; r < matrix.length; r++) {
    const line = matrix[r];
    const row: RawSheetRow = {};
    let hasValue = false;
    headerRow.forEach((h, i) => {
      if (!h) return;
      const val = String(line[i] ?? "").trim();
      if (val) hasValue = true;
      row[h] = val;
    });
    if (hasValue) rows.push(row);
  }

  return rows;
}

/** Dosyayı ham satır listesine çevirir (başlıklar orijinal metin) */
export async function parseImportFile(file: File): Promise<RawSheetRow[]> {
  validateImportFile(file);
  const name = file.name.toLowerCase();

  try {
    if (name.endsWith(".csv")) {
      const text = await file.text();
      const rows = parseCsvText(text);
      if (rows.length === 0) {
        throw new ImportError("EMPTY_FILE");
      }
      return rows;
    }

    if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      const buffer = await file.arrayBuffer();
      let wb: XLSX.WorkBook;
      try {
        wb = XLSX.read(buffer, { type: "array" });
      } catch {
        throw new ImportError("EXCEL_READ_ERROR");
      }
      const rows = sheetRowsToRaw(wb);
      if (rows.length === 0) {
        throw new ImportError("EMPTY_FILE");
      }
      return rows;
    }

    throw new ImportError("INVALID_FILE_TYPE");
  } catch (e) {
    if (e instanceof ImportError) throw e;
    throw new ImportError("FILE_READ_ERROR");
  }
}

export function getHeaderKeysFromRows(rows: RawSheetRow[]): string[] {
  if (rows.length === 0) return [];
  return Object.keys(rows[0]);
}

/** Ham satırı canonical alan adlarıyla eşleştirir */
export function canonicalizeRow(raw: RawSheetRow): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [header, value] of Object.entries(raw)) {
    const key = normKey(header);
    const field =
      {
        ogrencino: "studentNo",
        ad: "firstName",
        soyad: "lastName",
        tckimlik: "tc",
        tc: "tc",
        cinsiyet: "gender",
        dogumtarihi: "birthDate",
        sinifsube: "classRoom",
        sinif: "classRoom",
        sube: "branch",
        alan: "alan",
        ogrencitelefon: "phone",
        telefon: "phone",
        veliadsoyad: "parentName",
        velitelefon: "parentPhone",
        velitelefonu: "parentPhone",
        veliyakinlik: "parentRelation",
        kayitpaketi: "package",
        hedefuniversitebolum: "target",
        hedef: "target",
        veli: "parentName",
        name: "name",
      }[key] ?? "";

    if (field) out[field] = String(value ?? "").trim();
  }
  return out;
}
