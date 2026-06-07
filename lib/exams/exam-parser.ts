import { PARSE_CHUNK_SIZE } from "@/lib/exams/constants";
import { evaluateRow, normalizeKeyString } from "@/lib/exams/exam-evaluate";
import type { CatalogStudent, FmtFieldDef, ParseRow, ParserTemplate } from "@/lib/exams/types";
import {
  findStudentByCode,
  normalizeName,
} from "@/lib/exams/student-catalog-bridge";

const FMT_KIND_ALIASES: Record<string, FmtFieldDef["kind"]> = {
  no: "no",
  number: "no",
  ogrenci: "no",
  student: "no",
  name: "name",
  ad: "name",
  book: "book",
  kitapcik: "book",
  answers: "answers",
  cevap: "answers",
  cevaplar: "answers",
};

function resolveFmtKind(raw: string): FmtFieldDef["kind"] | string {
  const k = String(raw || "")
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  return FMT_KIND_ALIASES[k] || k;
}

type FmtFieldSource = Record<string, unknown> | unknown[];

export function normalizeFmtFieldDef(field: unknown): FmtFieldDef | null {
  if (!field || typeof field !== "object") return null;
  const f = field as FmtFieldSource;
  const rec = Array.isArray(f) ? {} : (f as Record<string, unknown>);
  const kind = resolveFmtKind(
    String(
      rec.kind || rec.key || rec.name || rec.label || rec.type || rec.id || ""
    )
  ) as FmtFieldDef["kind"];
  if (!["no", "name", "book", "answers"].includes(kind)) return null;

  let start: number | null = null;
  let length: number | null = null;

  if (Array.isArray(f)) {
    start = +String(f[0]);
    if (f.length > 2 && f[2] === "len") {
      length = f[1] == null ? null : Math.max(0, +String(f[1]));
    } else if (f[1] != null) {
      const end = +String(f[1]);
      length = end > start! ? end - start! : Math.max(0, end);
    }
  } else {
    const rec = f as Record<string, unknown>;
    if (rec.start != null || rec.offset != null) {
      start = Number(rec.start != null ? rec.start : rec.offset);
      if (rec.length != null) length = Math.max(0, +String(rec.length));
      else if (rec.len != null) length = Math.max(0, +String(rec.len));
      else if (rec.end != null) length = Math.max(0, +String(rec.end) - start);
    } else if (rec.from != null) {
      start = Number(rec.from);
      if (rec.length != null) length = Math.max(0, +String(rec.length));
      else if (rec.to != null) length = Math.max(0, +String(rec.to) - start);
    }
  }

  if (start == null || Number.isNaN(start)) return null;
  return {
    kind,
    start: Math.max(0, start),
    length: length == null || Number.isNaN(length) ? null : length,
  };
}

function legacyRangeToField(kind: FmtFieldDef["kind"], range: number[]): FmtFieldDef | null {
  if (!range?.length || range[0] == null || Number.isNaN(+range[0])) return null;
  const start = +range[0];
  const end = range[1];
  const length = end == null ? null : Math.max(0, end - start);
  return { kind, start, length };
}

export function buildParserTemplate(source: Record<string, unknown> | null): ParserTemplate | null {
  if (!source) return null;
  const fields: FmtFieldDef[] = [];
  if (Array.isArray(source.fields)) {
    source.fields.forEach((f) => {
      const n = normalizeFmtFieldDef(f);
      if (n) fields.push(n);
    });
  }
  if (!fields.length) {
    (["no", "name", "book", "answers"] as const).forEach((kind) => {
      const key = kind === "name" ? (source.nameRange ? "nameRange" : "name") : kind;
      const range = (source[key] as number[]) || (kind === "name" ? (source.name as number[]) : null);
      const f = legacyRangeToField(kind, range);
      if (f) fields.push(f);
    });
  }
  if (!fields.length) {
    if (source.tabbed) {
      return {
        label: String(source.label || source.name || "TSV"),
        fields: [],
        tabbed: true,
        minLine: Number(source.minLine) || 10,
        expectedAnswers: source.expectedAnswers as number | undefined,
        __fmtId: source.id as string | undefined,
      };
    }
    return null;
  }
  let maxEnd = 0;
  fields.forEach((f) => {
    const end = f.length == null ? Number(source.minLine) || 0 : f.start + f.length;
    if (end > maxEnd) maxEnd = end;
  });
  return {
    label: String(source.label || source.name || "FMT"),
    fields,
    tabbed: !!source.tabbed,
    minLine: Number(source.minLine) || maxEnd || 10,
    expectedAnswers: source.expectedAnswers as number | undefined,
    __fmtId: source.id as string | undefined,
  };
}

function sliceByFmtField(line: string, field: FmtFieldDef): string {
  const s = field.start;
  if (field.length == null) return line.slice(s).trim();
  return line.slice(s, s + field.length).trim();
}

export function isRowDirty(r: ParseRow): boolean {
  const iss = r.issues || [];
  return (
    !r.matched ||
    iss.includes("no-book") ||
    iss.includes("duplicate") ||
    iss.includes("no-code")
  );
}

function applyMatch(row: ParseRow, stu: CatalogStudent) {
  row.matched = true;
  row.status = "matched";
  row.matchedId = stu.id;
  row.studentId = stu.id;
  row.no = stu.code || row.no;
  row.name = stu.name || row.name;
  row.sube = stu.sube || stu.alan || "";
  row.issues = row.issues.filter((x) => x !== "unmatched" && x !== "no-code");
}

function markUnmatched(row: ParseRow) {
  row.matched = false;
  row.status = "unmatched";
  row.matchedId = null;
  row.studentId = null;
  if (!row.issues.includes("unmatched")) row.issues.push("unmatched");
}

export function parseLineWithTemplate(
  line: string,
  idx: number,
  tpl: ParserTemplate,
  students: CatalogStudent[],
  seenCodes: Record<string, boolean>,
  answerKey: string | null
): ParseRow | null {
  let no = "";
  let name = "";
  let book = "";
  let answers = "";

  if (tpl.tabbed) {
    const parts = line.split(/\t|;|,(?=\S)/);
    no = (parts[0] || "").trim();
    name = (parts[1] || "").trim();
    book = ((parts[2] || "").trim().charAt(0) || "").toUpperCase();
    answers = (parts.slice(3).join("") || "").trim();
  } else if (tpl.fields?.length) {
    tpl.fields.forEach((f) => {
      const val = sliceByFmtField(line, f);
      if (f.kind === "no") no = val;
      else if (f.kind === "name") name = val;
      else if (f.kind === "book") book = (val.charAt(0) || "").toUpperCase();
      else if (f.kind === "answers") answers += val;
    });
  } else {
    return null;
  }

  const issues: ParseRow["issues"] = [];
  const cleanName = String(name || "")
    .trim()
    .replace(/\s{2,}/g, " ");
  const cleanAnswers = normalizeKeyString(answers);
  const ev = evaluateRow(cleanAnswers, answerKey);

  const row: ParseRow = {
    id: `row-${idx}-${Math.random().toString(36).slice(2, 7)}`,
    no: String(no || "").trim(),
    name: cleanName,
    book: book || "",
    answers: cleanAnswers,
    correct: ev.correct,
    wrong: ev.wrong,
    blank: ev.blank,
    net: ev.net,
    sube: "",
    matched: false,
    matchedId: null,
    studentId: null,
    status: "unmatched",
    selected: true,
    issues,
  };

  if (!row.book) issues.push("no-book");
  if (row.no) {
    if (seenCodes[row.no]) issues.push("duplicate");
    else seenCodes[row.no] = true;
  } else {
    issues.push("no-code");
  }

  const byCode = findStudentByCode(students, row.no);
  if (byCode) {
    applyMatch(row, byCode);
    if (!row.name) row.name = byCode.name;
  } else if (row.name) {
    const nameKey = normalizeName(row.name);
    const byName = students.find((s) => normalizeName(s.name) === nameKey);
    if (byName) applyMatch(row, byName);
  }

  if (!row.matched) markUnmatched(row);
  else row.status = "matched";
  return row;
}

export interface ParseProgress {
  pct: number;
  processed: number;
  total: number;
}

export type ParseTextOptions = {
  onProgress?: (p: ParseProgress) => void;
  shouldCancel?: () => boolean;
  onTemplateMismatch?: (avgLen: number, expected: number) => void;
};

export function parseTextAsync(
  text: string,
  tpl: ParserTemplate,
  students: CatalogStudent[],
  answerKey: string | null,
  options?: ParseTextOptions
): Promise<ParseRow[]> {
  const onProgress = options?.onProgress;
  const shouldCancel = options?.shouldCancel;
  const onTemplateMismatch = options?.onTemplateMismatch;
  return new Promise((resolve) => {
    const seenCodes: Record<string, boolean> = {};
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.replace(/\uFFFD/g, "").replace(/\s+$/g, ""))
      .filter((l) => l.trim().length > 0);

    if (lines.length && !tpl.tabbed) {
      const ansField = tpl.fields.find((f) => f.kind === "answers");
      const expected = Math.max(tpl.minLine || 0, ansField?.start ?? 0);
      let avgLen = 0;
      for (let k = 0; k < Math.min(lines.length, 10); k++) avgLen += lines[k].length;
      avgLen = Math.round(avgLen / Math.min(lines.length, 10));
      if (expected && avgLen && Math.abs(avgLen - expected) > Math.max(20, expected * 0.5)) {
        onTemplateMismatch?.(avgLen, expected);
      }
    }

    const rows: ParseRow[] = [];
    const total = lines.length;
    let i = 0;

    const nextChunk = () => {
      if (shouldCancel?.()) {
        resolve(rows);
        return;
      }
      const end = Math.min(i + PARSE_CHUNK_SIZE, total);
      for (; i < end; i++) {
        const r = parseLineWithTemplate(lines[i], i, tpl, students, seenCodes, answerKey);
        if (r) rows.push(r);
      }
      const pct = total ? Math.round((i / total) * 100) : 100;
      onProgress?.({ pct, processed: i, total });
      if (i < total) {
        requestAnimationFrame(nextChunk);
      } else {
        resolve(rows);
      }
    };
    nextChunk();
  });
}

/** Toplu cevap anahtarı yapıştır — A-E harflerini matrise dağıt */
export function applyBulkAnswerKey(paste: string, n: number): string[] {
  const letters = normalizeKeyString(paste).split("");
  const out = Array(n).fill("");
  for (let i = 0; i < n && i < letters.length; i++) {
    out[i] = letters[i];
  }
  return out;
}
