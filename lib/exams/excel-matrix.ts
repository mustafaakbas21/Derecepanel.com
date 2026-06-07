import { getConcepts, getDersById, getTopicOptions } from "@/lib/mufredat";
import { encodeKonuCell } from "@/lib/exams/konu-cell";
import { matchTopicLabel, normalizeTopicText, parseZorluk } from "@/lib/exams/topic-match";
import type { SinavTipi } from "@/lib/exams/types";
import { getExamLayout } from "@/lib/exams/exam-layout";

export type ExcelRowBundle = {
  norm: Record<string, string>;
  raw: Record<string, string>;
};

export type ExcelPreviewRow = {
  soruNo: number;
  cevap: string;
  /** Excel «Konu» sütunu — ders adı veya eski şablonda konu metni */
  dersLabel: string;
  /** Müfredat konusu (Kavram sütunu veya Konu’dan çıkarılan) */
  konuLabel: string;
  kavramLabel: string;
  zorluk: string;
};

const DEFAULT_COL_MAP = { soru: 0, cevap: 1, konu: 2, kavram: 3, zorluk: 4 };

type ColumnMap = typeof DEFAULT_COL_MAP;

async function loadXlsx() {
  return import("xlsx");
}

function trimExcelCell(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

function cleanHeaderLabel(k: string): string {
  return String(k || "")
    .replace(/^\uFEFF/, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\u00A0/g, " ")
    .trim();
}

type CanonicalField = "soruNo" | "cevap" | "konu" | "kavram" | "zorluk";

/** Başlık metnini kanonik sütuna eşle — sıra önemli (kavram, konu’dan önce) */
function classifyHeaderSlug(slug: string): CanonicalField | null {
  if (!slug) return null;
  if (
    slug.includes("soruno") ||
    slug.includes("sorunumarasi") ||
    slug.includes("qno") ||
    (slug.includes("soru") && slug.includes("no"))
  ) {
    return "soruNo";
  }
  if (
    slug.includes("kavram") ||
    slug.includes("mufredat") ||
    slug.includes("altkonu") ||
    slug.includes("altkavram") ||
    slug.includes("concept")
  ) {
    return "kavram";
  }
  if (
    (slug.includes("dogru") && slug.includes("cevap")) ||
    slug === "cevap" ||
    slug === "dogru" ||
    slug.includes("cevapanahtar") ||
    (slug.includes("cevap") && !slug.includes("konu") && !slug.includes("kavram")) ||
    slug.includes("answer") ||
    slug.includes("correct")
  ) {
    return "cevap";
  }
  if (slug.includes("zorluk") || slug.includes("difficulty")) {
    return "zorluk";
  }
  if (slug.includes("ders") || slug.includes("subject") || slug.includes("konuders")) {
    return "konu";
  }
  if (slug === "konu") return "konu";
  if (slug.includes("konu") && !slug.includes("mufredat")) return "konu";
  return null;
}

/** ESKİ kurum-deneme-takvimi.js — slugTr + boşluksuz anahtar */
function slugExcelHeader(k: string): string {
  return normalizeTopicText(cleanHeaderLabel(k))
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "");
}

function buildExcelRowBundle(rawRow: Record<string, unknown>): ExcelRowBundle {
  const norm: Record<string, string> = {};
  const raw: Record<string, string> = {};
  for (const [k, v] of Object.entries(rawRow || {})) {
    const label = cleanHeaderLabel(k);
    if (!label) continue;
    const val = trimExcelCell(v);
    raw[label] = val;
    const nk = slugExcelHeader(label);
    if (nk) norm[nk] = val;
  }
  return { norm, raw };
}

/** Tüm ham başlıkları tarayıp standart sütun adlarına indirger */
export function canonicalizeBundle(bundle: ExcelRowBundle): ExcelRowBundle {
  const fields: Record<CanonicalField, string> = {
    soruNo: "",
    cevap: "",
    konu: "",
    kavram: "",
    zorluk: "",
  };

  for (const [label, val] of Object.entries(bundle.raw)) {
    const v = trimExcelCell(val);
    if (!v) continue;
    const kind = classifyHeaderSlug(slugExcelHeader(label));
    if (kind && !fields[kind]) fields[kind] = v;
  }

  for (const [nk, val] of Object.entries(bundle.norm)) {
    const v = trimExcelCell(val);
    if (!v) continue;
    const kind = classifyHeaderSlug(nk);
    if (kind && !fields[kind]) fields[kind] = v;
  }

  return buildExcelRowBundle({
    "Soru No": fields.soruNo,
    "Doğru Cevap": fields.cevap,
    Konu: fields.konu,
    Kavram: fields.kavram,
    Zorluk: fields.zorluk,
  });
}

function pickCanonical(bundle: ExcelRowBundle, field: CanonicalField): string {
  const c = canonicalizeBundle(bundle);
  const map: Record<CanonicalField, string> = {
    soruNo: pickExcelField(c, ["Soru No", "Soru"], ["soruno", "soru", "no"]),
    cevap: pickExcelField(c, ["Doğru Cevap", "Dogru Cevap", "Cevap"], [
      "dogrucevap",
      "cevap",
      "dogru",
      "correctanswer",
    ]),
    konu: pickExcelField(c, ["Konu", "Ders"], ["konu", "ders"]),
    kavram: pickExcelField(c, ["Kavram", "Alt Konu", "Müfredat Konusu"], [
      "kavram",
      "mufredat",
      "mufredatkonusu",
      "altkonu",
      "altkavram",
      "concept",
    ]),
    zorluk: pickExcelField(c, ["Zorluk"], ["zorluk", "difficulty"]),
  };
  return map[field];
}

function pickExcelField(
  bundle: ExcelRowBundle,
  exactKeys: string[],
  normKeys: string[]
): string {
  for (const k of exactKeys) {
    if (bundle.raw[k] != null) {
      const v = trimExcelCell(bundle.raw[k]);
      if (v) return v;
    }
  }
  for (const k of normKeys) {
    if (bundle.norm[k] != null) {
      const v = trimExcelCell(bundle.norm[k]);
      if (v) return v;
    }
  }
  for (const [label, val] of Object.entries(bundle.raw)) {
    const v = trimExcelCell(val);
    if (!v) continue;
    const slug = slugExcelHeader(label);
    for (const want of normKeys) {
      if (slug === want || slug.includes(want)) return v;
    }
  }
  return "";
}

function pickExcelDers(bundle: ExcelRowBundle): string {
  return pickCanonical(bundle, "konu");
}

function pickExcelKavram(bundle: ExcelRowBundle): string {
  return pickCanonical(bundle, "kavram");
}

function pickExcelCevap(bundle: ExcelRowBundle): string {
  return pickCanonical(bundle, "cevap");
}

function subjectShortLabel(subjectId: string): string {
  return getDersById(subjectId)?.dersAdi || "";
}

function slugTr(s: string): string {
  return normalizeTopicText(s).replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "");
}

function isExcelDersLabel(label: string, subjectId: string): boolean {
  const t = slugTr(label);
  if (!t) return false;
  const sub = slugTr(subjectShortLabel(subjectId));
  if (sub && t === sub) return true;
  if (sub && t.includes(sub) && t.length <= sub.length + 4) return true;
  return false;
}

function stripSubjectFromTopicLabel(topicName: string, subjectId: string): string {
  let t = String(topicName || "").trim();
  if (!t || !subjectId) return t;
  const subName = subjectShortLabel(subjectId);
  if (!subName) return t;
  const prefixes = [`${subName} — `, `${subName} - `, `${subName} | `, `${subName}: `];
  for (const prefix of prefixes) {
    if (t.startsWith(prefix)) return t.slice(prefix.length).trim();
  }
  const parts = t.split(/\s*(?:—|–|-|\||>)\s*/);
  if (parts.length >= 2 && slugTr(parts[0] || "") === slugTr(subName)) {
    return parts.slice(1).join(" ").trim();
  }
  return t;
}

/**
 * DerecePanel Excel şablonu (ESKİ Derecepanel21):
 *   Konu  → Ders adı (Türkçe, Matematik …) veya eski dosyada doğrudan konu metni
 *   Kavram → Müfredat konusu — matristeki «Konu» kutusuna yazılır
 */
function resolveExcelMatrixLabels(bundle: ExcelRowBundle, subjectId: string) {
  const excelDers = pickExcelDers(bundle);
  const excelKavram = pickExcelKavram(bundle);
  let matrixTopic = "";
  let matrixConcept = "";

  if (excelKavram) {
    matrixTopic = excelKavram;
  }

  if (excelDers && subjectId && !isExcelDersLabel(excelDers, subjectId)) {
    if (!matrixTopic) matrixTopic = stripSubjectFromTopicLabel(excelDers, subjectId);
    else if (!matrixConcept && slugTr(excelDers) !== slugTr(matrixTopic)) {
      matrixConcept = excelDers;
    }
  } else if (!matrixTopic && excelDers) {
    matrixTopic = stripSubjectFromTopicLabel(excelDers, subjectId);
  }

  return { topic: matrixTopic, concept: matrixConcept };
}

/** ESKİ kurum-deneme-takvimi.js — önce tam slug, sonra kısmi, en son fuzzy */
function findTopicIdByName(subjectId: string, topicName: string): string {
  if (!subjectId || !topicName) return "";
  const tn = slugTr(topicName);
  if (!tn) return "";
  const opts = getTopicOptions(subjectId);
  for (const o of opts) {
    if (slugTr(o.label) === tn) return o.id;
  }
  for (const o of opts) {
    const nm = slugTr(o.label);
    if (nm && (nm.includes(tn) || tn.includes(nm))) return o.id;
  }
  return matchTopicLabel(topicName, opts);
}

function findConceptIdByName(subjectId: string, topicId: string, conceptName: string): string {
  if (!subjectId || !topicId || !conceptName) return "";
  const cn = slugTr(conceptName);
  if (!cn) return "";
  const opts = getConcepts(subjectId, topicId).map((c) => ({
    id: c.id,
    label: c.name,
  }));
  for (const o of opts) {
    if (slugTr(o.label) === cn) return o.id;
  }
  for (const o of opts) {
    const nm = slugTr(o.label);
    if (nm && (nm.includes(cn) || cn.includes(nm))) return o.id;
  }
  return matchTopicLabel(conceptName, opts);
}

function findTopicAndConceptByLabel(subjectId: string, label: string) {
  const out = { topicId: "", conceptId: "" };
  if (!label || !subjectId) return out;
  out.topicId = findTopicIdByName(subjectId, label);
  if (out.topicId) return out;
  const topics = getTopicOptions(subjectId);
  for (const t of topics) {
    const cid = findConceptIdByName(subjectId, t.id, label);
    if (cid) return { topicId: t.id, conceptId: cid };
  }
  return out;
}

function parseAnswer(v: string): string {
  let s = String(v ?? "").trim();
  if (!s) return "";
  if (/^[1-5]$/.test(s)) {
    return "ABCDE"[parseInt(s, 10) - 1] || "";
  }
  s = s.toUpperCase();
  const strict = s.match(/^(?:[\s(]*)([A-E])(?:[\s).\]:,\-–]*|$)/);
  if (strict) return strict[1]!;
  const any = s.match(/[ABCDE]/);
  return any ? any[0] : "";
}

export function bundleToPreview(bundle: ExcelRowBundle, index: number): ExcelPreviewRow {
  const qNoRaw = pickExcelField(bundle, ["Soru No", "Soru"], [
    "soruno",
    "soru",
    "no",
    "sorunumarasi",
    "qno",
    "soru_no",
  ]);
  const qNo = parseInt(String(qNoRaw || "").trim(), 10);
  const soruNo = !Number.isNaN(qNo) && qNo > 0 ? qNo : index + 1;
  const cevap = parseAnswer(pickExcelCevap(bundle));
  const dersLabel = pickExcelDers(bundle);
  const kavramLabel = pickExcelKavram(bundle);
  const { topic: topicFromKonu } = resolveExcelMatrixLabels(bundle, "");

  return {
    soruNo,
    cevap,
    dersLabel,
    konuLabel: kavramLabel || topicFromKonu,
    kavramLabel,
    zorluk: parseZorluk(pickExcelField(bundle, ["Zorluk"], ["zorluk", "difficulty"]) || "2"),
  };
}

function findHeaderRowIndex(rows: unknown[][]): number {
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const row = rows[i] || [];
    const parts = row.map((c) => slugExcelHeader(String(c ?? "")));
    const joined = parts.join("|");
    if (
      joined.includes("soruno") ||
      joined.includes("sorunumarasi") ||
      (joined.includes("soru") && joined.includes("no"))
    ) {
      return i;
    }
    if (joined.includes("dogru") && joined.includes("cevap")) return i;
    if (joined.includes("cevap") && (joined.includes("konu") || joined.includes("kavram"))) {
      return i;
    }
  }
  return 0;
}

function mapColumnsFromHeaders(headerCells: string[]): ColumnMap {
  const map = { ...DEFAULT_COL_MAP };
  let matched = 0;

  headerCells.forEach((h, idx) => {
    const nk = slugExcelHeader(h);
    if (!nk) return;

    const kind = classifyHeaderSlug(nk);
    if (!kind) return;
    map[kind === "soruNo" ? "soru" : kind] = idx;
    matched++;
  });

  return matched >= 2 ? map : DEFAULT_COL_MAP;
}

function rowArrayToBundle(row: unknown[], colMap: ColumnMap): ExcelRowBundle {
  const cell = (i: number) => trimExcelCell(row[i]);
  return buildExcelRowBundle({
    "Soru No": cell(colMap.soru),
    "Doğru Cevap": cell(colMap.cevap),
    Konu: cell(colMap.konu),
    Kavram: cell(colMap.kavram),
    Zorluk: cell(colMap.zorluk),
  });
}

function isBundleRowEmpty(bundle: ExcelRowBundle): boolean {
  const soru = pickExcelField(bundle, ["Soru No", "Soru"], ["soruno", "soru", "no"]);
  const cevap = pickExcelCevap(bundle);
  const konu = pickExcelDers(bundle) || pickExcelKavram(bundle);
  return !soru && !cevap && !konu;
}

function preferNonEmpty(a: string, b: string): string {
  const va = trimExcelCell(a);
  const vb = trimExcelCell(b);
  return va || vb;
}

/** sheet_to_json (primary) + AOA — boş AOA hücreleri dolu JSON değerlerini ezmesin */
export function mergeExcelRowBundle(
  primary: ExcelRowBundle,
  secondary: ExcelRowBundle
): ExcelRowBundle {
  const ca = canonicalizeBundle(primary);
  const cb = canonicalizeBundle(secondary);
  return canonicalizeBundle(
    buildExcelRowBundle({
      "Soru No": preferNonEmpty(
        pickCanonical(ca, "soruNo"),
        pickCanonical(cb, "soruNo")
      ),
      "Doğru Cevap": preferNonEmpty(
        pickCanonical(ca, "cevap"),
        pickCanonical(cb, "cevap")
      ),
      Konu: preferNonEmpty(pickCanonical(ca, "konu"), pickCanonical(cb, "konu")),
      Kavram: preferNonEmpty(
        pickCanonical(ca, "kavram"),
        pickCanonical(cb, "kavram")
      ),
      Zorluk: preferNonEmpty(
        pickCanonical(ca, "zorluk"),
        pickCanonical(cb, "zorluk")
      ),
    })
  );
}

function mergeBundleLists(primary: ExcelRowBundle[], secondary: ExcelRowBundle[]): ExcelRowBundle[] {
  const len = Math.max(primary.length, secondary.length);
  const out: ExcelRowBundle[] = [];
  for (let i = 0; i < len; i++) {
    const a = primary[i];
    const b = secondary[i];
    if (a && b) out.push(mergeExcelRowBundle(a, b));
    else if (a) out.push(canonicalizeBundle(a));
    else if (b) out.push(canonicalizeBundle(b));
  }
  return out;
}

async function parseJsonSheetToBundlesAsync(
  ws: import("xlsx").WorkSheet
): Promise<ExcelRowBundle[]> {
  const XLSX = await loadXlsx();
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: "",
    raw: true,
  });
  return json
    .map((row) => canonicalizeBundle(buildExcelRowBundle(row)))
    .filter((b) => Object.keys(b.raw).length > 0 && !isBundleRowEmpty(b));
}

async function parseSheetToBundles(ws: import("xlsx").WorkSheet): Promise<ExcelRowBundle[]> {
  const XLSX = await loadXlsx();
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    defval: "",
    raw: false,
  });

  if (!aoa.length) return [];

  const headerIdx = findHeaderRowIndex(aoa);
  const headerRow = (aoa[headerIdx] || []).map((c) => cleanHeaderLabel(String(c ?? "")));
  const colMap = mapColumnsFromHeaders(headerRow);

  const bundles: ExcelRowBundle[] = [];
  for (let i = headerIdx + 1; i < aoa.length; i++) {
    const row = aoa[i];
    if (!row || !Array.isArray(row)) continue;
    const hasData = row.some((c) => trimExcelCell(c));
    if (!hasData) continue;

    const rowNum = i - headerIdx;
    const bundle = rowArrayToBundle(row, colMap);
    if (!pickExcelField(bundle, ["Soru No"], ["soruno", "soru", "no"])) {
      bundle.raw["Soru No"] = String(rowNum);
      bundle.norm.soruno = String(rowNum);
    }
    if (isBundleRowEmpty(bundle)) continue;

    bundles.push(canonicalizeBundle(bundle));
  }

  return bundles;
}

async function readWorkbook(file: ArrayBuffer | string, isCsv: boolean) {
  const XLSX = await loadXlsx();
  return isCsv
    ? XLSX.read(String(file || ""), { type: "string" })
    : XLSX.read(file, { type: "array" });
}

export async function parseExcelToBundles(
  file: ArrayBuffer | string,
  options?: { isCsv?: boolean }
): Promise<ExcelRowBundle[]> {
  const XLSX = await loadXlsx();
  const wb = await readWorkbook(file, !!options?.isCsv);
  const sheetName = wb.SheetNames?.[0];
  if (!sheetName) return [];
  const ws = wb.Sheets[sheetName];
  if (!ws) return [];

  const jsonBundles = await parseJsonSheetToBundlesAsync(ws);
  const aoaBundles = await parseSheetToBundles(ws);
  const merged = mergeBundleLists(jsonBundles, aoaBundles);
  if (merged.length) return merged;
  return jsonBundles.length ? jsonBundles : aoaBundles;
}

export async function parseExcelToPreview(
  file: ArrayBuffer | string,
  options?: { isCsv?: boolean }
): Promise<ExcelPreviewRow[]> {
  const bundles = await parseExcelToBundles(file, options);
  return bundles.map((b, i) => bundleToPreview(b, i));
}

export async function downloadExcelTemplate(sinav: SinavTipi, fileName?: string) {
  const XLSX = await loadXlsx();
  const layout = getExamLayout(sinav);
  const rows: string[][] = [["Soru No", "Doğru Cevap", "Konu", "Kavram", "Zorluk"]];
  for (let i = 1; i <= layout.n; i++) {
    const cell = layout.byIndex[i - 1];
    const ders = getDersById(cell?.subjectId || "");
    rows.push([String(i), "", ders?.dersAdi || cell?.sectionTitle || "", "", "2"]);
  }
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 10 }, { wch: 14 }, { wch: 28 }, { wch: 28 }, { wch: 10 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sablon");
  XLSX.writeFile(wb, fileName || `deneme_sablonu.xlsx`);
}

function applyExcelKonuKavramToRow(
  qi: number,
  bundle: ExcelRowBundle,
  subjectId: string,
  konu: string[],
  konuYazi: string[]
) {
  const labels = resolveExcelMatrixLabels(bundle, subjectId);
  const topicName = labels.topic;
  const conceptName = labels.concept;
  konuYazi[qi] = "";

  if (!topicName && !conceptName) return;

  const resolved = findTopicAndConceptByLabel(subjectId, topicName);
  let tid = resolved.topicId;
  let cid = resolved.conceptId;
  if (tid && conceptName && !cid) {
    cid = findConceptIdByName(subjectId, tid, conceptName);
  }

  if (tid) {
    const conceptId =
      cid || getConcepts(subjectId, tid).find((c) => c.id)?.id || tid;
    konu[qi] = encodeKonuCell({
      subjectId,
      topicId: tid,
      conceptId,
    });
    return;
  }

  konuYazi[qi] = conceptName ? `${topicName} — ${conceptName}` : topicName;
  konu[qi] = encodeKonuCell({ subjectId });
}

export function applyExcelBundlesToMatrix(
  bundles: ExcelRowBundle[],
  sinav: SinavTipi,
  current: {
    cevaplar: string[];
    zorluk: string[];
    konu: string[];
    konuYazi: string[];
  }
): typeof current {
  const layout = getExamLayout(sinav);
  const cevaplar = [...current.cevaplar];
  const zorluk = [...current.zorluk];
  const konu = [...current.konu];
  const konuYazi = [...current.konuYazi];

  bundles.forEach((bundle, i) => {
    const qNoRaw = pickExcelField(bundle, ["Soru No"], [
      "soruno",
      "soru",
      "no",
      "sorunumarasi",
      "qno",
    ]);
    let qNo = parseInt(String(qNoRaw || "").trim(), 10);
    if (Number.isNaN(qNo) || qNo <= 0) qNo = i + 1;
    const qi = qNo - 1;
    if (qi < 0 || qi >= layout.n) return;

    const cell = layout.byIndex[qi];
    const subjectId = cell?.subjectId || "";

    const ans = parseAnswer(pickExcelCevap(bundle));
    if (ans) cevaplar[qi] = ans;

    const zRaw = pickExcelField(bundle, ["Zorluk"], ["zorluk", "difficulty"]);
    if (zRaw) zorluk[qi] = parseZorluk(zRaw);

    applyExcelKonuKavramToRow(qi, bundle, subjectId, konu, konuYazi);
  });

  return { cevaplar, zorluk, konu, konuYazi };
}

export function applyExcelPreviewToMatrix(
  preview: ExcelPreviewRow[],
  sinav: SinavTipi,
  current: {
    cevaplar: string[];
    zorluk: string[];
    konu: string[];
    konuYazi: string[];
  }
): typeof current {
  const bundles: ExcelRowBundle[] = preview.map((p) => ({
    raw: {
      "Soru No": String(p.soruNo),
      "Doğru Cevap": p.cevap,
      Konu: p.dersLabel || p.konuLabel,
      Kavram: p.kavramLabel || p.konuLabel,
      Zorluk: p.zorluk,
    },
    norm: {
      soruno: String(p.soruNo),
      dogrucevap: p.cevap,
      konu: p.dersLabel || p.konuLabel,
      kavram: p.kavramLabel || p.konuLabel,
      zorluk: p.zorluk,
    },
  }));
  return applyExcelBundlesToMatrix(bundles, sinav, current);
}
