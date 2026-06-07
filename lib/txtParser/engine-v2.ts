import type {
  ColumnHypothesis,
  ColumnRole,
  ConfidenceLevel,
  ParseEngineReport,
  ParsedTxtFile,
  TxtDelimiter,
} from "@/lib/txtParser/types";

const TC_RE = /^\d{11}$/;
const STUDENT_NO_RE = /^\d{3,12}$/;
const BOOKLET_RE = /^[A-Da-d]$/;
const CLASS_BRANCH_RE = /^\d{1,2}\s*[-/]\s*[A-Z0-9ğüşıöçĞÜŞİÖÇ]+$/i;
const GLUED_ID_NAME_RE = /^(\d{3,11})([A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜa-zçğıöşü\s.'-]+)$/;
const NAME_LIKE_RE = /^[A-ZÇĞİÖŞÜa-zçğıöşü][A-ZÇĞİÖŞÜa-zçğıöşü\s.'-]{2,}$/;

const MIN_TEST_BLOCK_LEN = 15;
const MIN_ANSWER_FRAGMENT = 8;

function normalizeCell(v: string): string {
  return String(v ?? "").trim();
}

function normalizeTestBlock(raw: string): string {
  return String(raw ?? "")
    .toUpperCase()
    .replace(/[^A-E\s]/g, "")
    .replace(/\s+/g, "");
}

function answerCore(v: string): string {
  return v.replace(/\s/g, "").toUpperCase();
}

function isPureTestBlock(v: string): boolean {
  const core = answerCore(v);
  return core.length >= MIN_TEST_BLOCK_LEN && /^[A-E]+$/.test(core);
}

function isAnswerKeyLike(v: string): boolean {
  const core = answerCore(v);
  return core.length >= MIN_ANSWER_FRAGMENT && /^[A-E]+$/.test(core);
}

function isAnswerFragment(v: string): boolean {
  const core = answerCore(v);
  return core.length >= 4 && core.length < MIN_TEST_BLOCK_LEN && /^[A-E]+$/.test(core);
}

function isBookletValue(v: string): boolean {
  const t = v.trim();
  if (BOOKLET_RE.test(t)) return true;
  const core = t.replace(/\s/g, "");
  return /^[A-Da-d][A-E]{14,}$/i.test(core);
}

function isNameLike(v: string): boolean {
  const t = normalizeCell(v);
  if (!NAME_LIKE_RE.test(t)) return false;
  if (isAnswerKeyLike(t)) return false;
  if (/^[A-E]+$/i.test(t.replace(/\s/g, ""))) return false;
  return true;
}

function isClassBranch(v: string): boolean {
  return CLASS_BRANCH_RE.test(v.replace(/\s+/g, ""));
}

function testBlockLabel(len: number): string {
  if (len >= 38 && len <= 42) return "Türkçe (40)";
  if (len >= 18 && len <= 22) return "Test bloğu (20)";
  if (len >= 11 && len <= 14) return "Fen Bilimleri (13)";
  if (len >= 5 && len <= 8) return "Kısa blok";
  return `Test bloğu (${len})`;
}

function delimiterLabel(d: TxtDelimiter): string {
  const map: Record<TxtDelimiter, string> = {
    tab: "Sekme (TAB)",
    semicolon: "Noktalı virgül",
    comma: "Virgül",
    space: "Çoklu boşluk",
    smart: "Akıllı ayrıştırma",
  };
  return map[d];
}

function detectDelimiter(lines: string[]): TxtDelimiter {
  const sample = lines.slice(0, Math.min(40, lines.length));
  if (!sample.length) return "smart";

  let tab = 0;
  let semi = 0;
  let comma = 0;
  let multiSpace = 0;

  for (const line of sample) {
    if (line.includes("\t")) tab++;
    if (line.includes(";")) semi++;
    if (/,/.test(line) && !line.includes("\t")) comma++;
    if (/\s{2,}/.test(line)) multiSpace++;
  }

  const n = sample.length;
  if (tab >= n * 0.35) return "tab";
  if (semi >= n * 0.35) return "semicolon";
  if (comma >= n * 0.35) return "comma";
  if (multiSpace >= n * 0.35) return "space";
  return "smart";
}

/** Sınıf sonrası: kitapçık + cevap blokları */
function splitClassTail(rest: string): string[] {
  const trimmed = normalizeCell(rest);
  if (!trimmed) return [];

  const spacedBook = trimmed.match(/^([A-Da-d])\s+(.+)$/i);
  if (spacedBook) {
    const out = [spacedBook[1].toUpperCase()];
    const tail = spacedBook[2];
    const chunks = tail.split(/\s+/).filter(Boolean);
    if (chunks.length === 1 && isPureTestBlock(chunks[0])) {
      out.push(normalizeTestBlock(chunks[0]));
      return out;
    }
    for (const c of chunks) {
      if (BOOKLET_RE.test(c) && out.length === 1) out.push(c.toUpperCase());
      else if (isPureTestBlock(c)) out.push(normalizeTestBlock(c));
      else if (isAnswerKeyLike(c)) out.push(normalizeTestBlock(c));
    }
    if (out.length > 1) return out;
  }

  const gluedBook = trimmed.match(/^([A-Da-d])([A-E]{15,})$/i);
  if (gluedBook) {
    return [gluedBook[1].toUpperCase(), normalizeTestBlock(gluedBook[2])];
  }

  if (isPureTestBlock(trimmed)) return [normalizeTestBlock(trimmed)];
  if (isAnswerKeyLike(trimmed)) return [normalizeTestBlock(trimmed)];

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length > 1) {
    const out: string[] = [];
    for (const p of parts) {
      if (BOOKLET_RE.test(p) && !out.some((x) => BOOKLET_RE.test(x))) {
        out.push(p.toUpperCase());
      } else if (isPureTestBlock(p) || isAnswerKeyLike(p)) {
        out.push(normalizeTestBlock(p));
      }
    }
    if (out.length) return out;
  }

  return [trimmed];
}

/** Birleşik hücreyi gerçek sütunlara ayırır */
function expandCompositeCell(cell: string): string[] {
  const trimmed = normalizeCell(cell);
  if (!trimmed) return [];

  const glued = trimmed.match(GLUED_ID_NAME_RE);
  if (glued) return [glued[1], glued[2].trim()];

  if (TC_RE.test(trimmed)) return [trimmed];

  if (isClassBranch(trimmed) && !trimmed.includes(" ")) {
    return [trimmed.replace(/\s+/g, "")];
  }

  const cls = trimmed.match(/^(\d{1,2}\s*[-/]\s*[A-Z0-9ğüşıöçĞÜŞİÖÇ]+)(?:\s+(.+))?$/i);
  if (cls) {
    const parts: string[] = [cls[1].replace(/\s+/g, "")];
    if (cls[2]) parts.push(...splitClassTail(cls[2]));
    return parts.filter(Boolean);
  }

  if (BOOKLET_RE.test(trimmed)) return [trimmed.toUpperCase()];

  if (isPureTestBlock(trimmed) || isAnswerKeyLike(trimmed)) {
    return [normalizeTestBlock(trimmed)];
  }

  if (isNameLike(trimmed)) return [trimmed];

  if (STUDENT_NO_RE.test(trimmed) && !TC_RE.test(trimmed)) {
    return [trimmed];
  }

  return [trimmed];
}

function tokenizeLine(line: string, delimiter: TxtDelimiter): string[] {
  const trimmed = line.replace(/\uFFFD/g, "").replace(/\s+$/g, "").trim();
  if (!trimmed) return [];

  let cells: string[] = [];

  switch (delimiter) {
    case "tab":
      cells = trimmed.split("\t").map(normalizeCell);
      break;
    case "semicolon":
      cells = trimmed.split(";").map(normalizeCell);
      break;
    case "comma":
      cells = trimmed.split(/,(?=\S)/).map(normalizeCell);
      break;
    case "space":
      cells = trimmed.split(/\s{2,}/).map(normalizeCell).filter(Boolean);
      break;
    default:
      if (trimmed.includes("\t")) cells = trimmed.split("\t").map(normalizeCell);
      else if (trimmed.includes(";")) cells = trimmed.split(";").map(normalizeCell);
      else if (/\s{2,}/.test(trimmed))
        cells = trimmed.split(/\s{2,}/).map(normalizeCell).filter(Boolean);
      else cells = [trimmed];
  }

  const expanded: string[] = [];
  for (const c of cells) {
    if (!c) continue;
    expanded.push(...expandCompositeCell(c));
  }

  return expanded;
}

function padRows(rows: string[][]): string[][] {
  const maxCols = rows.reduce((m, r) => Math.max(m, r.length), 0);
  if (maxCols <= 0) return rows;
  return rows.map((r) => {
    const next = [...r];
    while (next.length < maxCols) next.push("");
    return next;
  });
}

/** Sağdan tamamen boş sütunları kırp */
function trimTrailingEmptyColumns(rows: string[][]): string[][] {
  if (!rows.length) return rows;
  let colCount = rows.reduce((m, r) => Math.max(m, r.length), 0);
  while (colCount > 0) {
    const idx = colCount - 1;
    const hasData = rows.some((r) => normalizeCell(r[idx] ?? "").length > 0);
    if (hasData) break;
    colCount--;
  }
  if (colCount <= 0) return rows;
  return rows.map((r) => r.slice(0, colCount));
}

function columnValues(rows: string[][], index: number): string[] {
  return rows.map((r) => normalizeCell(r[index] ?? "")).filter((v) => v.length > 0);
}

function columnFillRate(rows: string[][], index: number): number {
  if (!rows.length) return 0;
  const filled = rows.filter((r) => normalizeCell(r[index] ?? "").length > 0).length;
  return filled / rows.length;
}

function matchRatio(values: string[], pred: (v: string) => boolean): number {
  if (!values.length) return 0;
  return values.filter(pred).length / values.length;
}

function scoreColumn(
  values: string[],
  totalRows: number
): {
  role: ColumnRole;
  label: string;
  confidence: ConfidenceLevel;
  testBlockLength?: number;
  score: number;
} {
  const fillRate = totalRows > 0 ? values.length / totalRows : 0;

  if (!values.length || fillRate < 0.12) {
    return { role: "ignore", label: "Yoksay (boş)", confidence: "high", score: 1 };
  }

  const avgLen = values.reduce((s, v) => s + v.length, 0) / values.length;
  const sparse = fillRate < 0.45;

  const bookletMixR = matchRatio(values, (v) => isBookletValue(v));
  if (bookletMixR >= 0.45 && avgLen <= 14 && fillRate >= 0.35) {
    return {
      role: "booklet",
      label: "Kitapçık (A–D)",
      confidence:
        bookletMixR >= 0.85 && fillRate >= 0.6
          ? "high"
          : bookletMixR >= 0.6
            ? "medium"
            : "low",
      score: bookletMixR,
    };
  }

  const fragmentR = matchRatio(values, (v) => isAnswerFragment(v) || isAnswerKeyLike(v));
  if (fragmentR >= 0.5 && avgLen >= 4 && avgLen <= 20) {
    const lens = values
      .filter((v) => isAnswerFragment(v) || isAnswerKeyLike(v))
      .map((v) => answerCore(v).length);
    const avgTestLen =
      lens.length > 0 ? Math.round(lens.reduce((a, b) => a + b, 0) / lens.length) : 10;
    return {
      role: "test_block",
      label: testBlockLabel(avgTestLen),
      confidence: fragmentR >= 0.8 ? "medium" : "low",
      testBlockLength: avgTestLen,
      score: fragmentR,
    };
  }

  const answerR = matchRatio(values, (v) => isAnswerKeyLike(v));
  if (answerR >= 0.55) {
    const lens = values.filter(isAnswerKeyLike).map((v) => answerCore(v).length);
    const avgTestLen =
      lens.length > 0 ? Math.round(lens.reduce((a, b) => a + b, 0) / lens.length) : 40;
    const conf: ConfidenceLevel =
      answerR >= 0.9 && fillRate >= 0.7 ? "high" : answerR >= 0.75 ? "medium" : "low";
    return {
      role: "test_block",
      label: testBlockLabel(avgTestLen),
      confidence: sparse && conf === "high" ? "medium" : conf,
      testBlockLength: avgTestLen,
      score: answerR,
    };
  }

  const tcR = matchRatio(values, (v) => TC_RE.test(v));
  if (tcR >= 0.85) {
    return {
      role: "tc",
      label: "TC Kimlik",
      confidence: tcR >= 0.95 && fillRate >= 0.7 ? "high" : "medium",
      score: tcR,
    };
  }

  const bookletR = matchRatio(values, (v) => BOOKLET_RE.test(v.trim()));
  if (bookletR >= 0.85 && avgLen <= 2.5 && fillRate >= 0.5) {
    return {
      role: "booklet",
      label: "Kitapçık (A–D)",
      confidence: bookletR >= 0.95 ? "high" : "medium",
      score: bookletR,
    };
  }

  const classR = matchRatio(values, (v) => isClassBranch(v));
  if (classR >= 0.75 && avgLen <= 8) {
    return {
      role: "class_branch",
      label: "Sınıf / Şube",
      confidence: classR >= 0.9 && fillRate >= 0.6 ? "high" : "medium",
      score: classR,
    };
  }

  const gluedR = matchRatio(values, (v) => GLUED_ID_NAME_RE.test(v));
  if (gluedR >= 0.75) {
    return {
      role: "student_id_name",
      label: "No + Ad (bitişik)",
      confidence: gluedR >= 0.9 ? "high" : "medium",
      score: gluedR,
    };
  }

  const noR = matchRatio(
    values,
    (v) => STUDENT_NO_RE.test(v) && !TC_RE.test(v) && !GLUED_ID_NAME_RE.test(v)
  );
  if (noR >= 0.75 && avgLen <= 12) {
    return {
      role: "student_no",
      label: "Öğrenci No",
      confidence: noR >= 0.9 && fillRate >= 0.7 ? "high" : "medium",
      score: noR,
    };
  }

  const nameR = matchRatio(values, (v) => isNameLike(v));
  if (nameR >= 0.7 && avgLen >= 4 && fillRate >= 0.5) {
    return {
      role: "name",
      label: "Ad Soyad",
      confidence: nameR >= 0.9 && fillRate >= 0.8 ? "high" : "medium",
      score: nameR,
    };
  }

  const testR = matchRatio(values, (v) => isPureTestBlock(v));
  if (testR >= 0.5) {
    const lens = values.filter(isPureTestBlock).map((v) => answerCore(v).length);
    const avgTestLen =
      lens.length > 0 ? Math.round(lens.reduce((a, b) => a + b, 0) / lens.length) : 40;
    return {
      role: "test_block",
      label: testBlockLabel(avgTestLen),
      confidence: testR >= 0.9 && fillRate >= 0.7 ? "high" : testR >= 0.7 ? "medium" : "low",
      testBlockLength: avgTestLen,
      score: testR,
    };
  }

  if (sparse) {
    return { role: "ignore", label: "Yoksay (seyrek)", confidence: "medium", score: 0.5 };
  }

  return { role: "unknown", label: "Bilinmiyor", confidence: "low", score: 0.2 };
}

/** Sol→sağ tipik optik sırasına göre rol netleştirme */
function refineColumnsByLayout(
  columns: ColumnHypothesis[],
  rows: string[][]
): ColumnHypothesis[] {
  const next = columns.map((c) => ({ ...c }));
  const colCount = next.length;
  if (!colCount || !rows.length) return next;

  const totalRows = rows.length;
  let bookletAssigned = false;
  let nameAssigned = false;
  let identityAssigned = false;
  let answerZone = false;

  for (let i = 0; i < colCount; i++) {
    const values = columnValues(rows, i);
    const fillRate = columnFillRate(rows, i);
    if (!values.length) {
      next[i] = { ...next[i], role: "ignore", label: "Yoksay (boş)", confidence: "high" };
      continue;
    }

    const scored = scoreColumn(values, totalRows);
    next[i] = {
      ...next[i],
      role: scored.role,
      label: scored.label,
      confidence: scored.confidence,
      testBlockLength: scored.testBlockLength,
    };

    if (["tc", "student_no", "student_id_name"].includes(scored.role)) {
      if (identityAssigned && fillRate < 0.8) {
        next[i] = {
          ...next[i],
          role: isAnswerKeyLike(values[0] ?? "") ? "test_block" : "ignore",
          label: isAnswerKeyLike(values[0] ?? "") ? testBlockLabel(answerCore(values[0]).length) : "Yoksay",
          confidence: "medium",
        };
      } else {
        identityAssigned = true;
      }
    }

    if (scored.role === "name") {
      if (nameAssigned || answerZone) {
        next[i] = {
          ...next[i],
          role: values.every(isAnswerKeyLike) ? "test_block" : "ignore",
          label: values.every(isAnswerKeyLike)
            ? testBlockLabel(
                Math.round(
                  values.reduce((s, v) => s + answerCore(v).length, 0) / values.length
                )
              )
            : "Yoksay",
          confidence: "medium",
        };
      } else {
        nameAssigned = true;
      }
    }

    if (scored.role === "booklet") {
      if (bookletAssigned || answerZone) {
        next[i] = {
          ...next[i],
          role: values.every(isAnswerKeyLike) ? "test_block" : "ignore",
          label: "Yoksay",
          confidence: "medium",
        };
      } else {
        bookletAssigned = true;
      }
    }

    if (scored.role === "test_block") answerZone = true;

    if (answerZone && scored.role === "unknown") {
      const allFrag = values.every((v) => isAnswerFragment(v) || isAnswerKeyLike(v));
      if (allFrag) {
        const len = Math.round(
          values.reduce((s, v) => s + answerCore(v).length, 0) / values.length
        );
        next[i] = {
          ...next[i],
          role: "test_block",
          label: testBlockLabel(len),
          confidence: fillRate >= 0.5 ? "medium" : "low",
          testBlockLength: len,
        };
      } else if (values.every(isBookletValue)) {
        next[i] = {
          ...next[i],
          role: "booklet",
          label: "Kitapçık (A–D)",
          confidence: "medium",
        };
      }
    }
  }

  for (let i = 0; i < colCount; i++) {
    const values = columnValues(rows, i);
    if (!values.length) continue;

    const allBooklet = values.every((v) => isBookletValue(v));
    const allClass = values.every((v) => isClassBranch(v));
    const allAnswer = values.every((v) => isAnswerKeyLike(v));

    if (allBooklet && !bookletAssigned && columnFillRate(rows, i) >= 0.5) {
      next[i] = {
        ...next[i],
        role: "booklet",
        label: "Kitapçık (A–D)",
        confidence: "high",
      };
      bookletAssigned = true;
    } else if (allClass) {
      next[i] = {
        ...next[i],
        role: "class_branch",
        label: "Sınıf / Şube",
        confidence: "high",
      };
    } else if (allAnswer) {
      const len = Math.round(
        values.reduce((s, v) => s + answerCore(v).length, 0) / values.length
      );
      next[i] = {
        ...next[i],
        role: "test_block",
        label: testBlockLabel(len),
        confidence: next[i].confidence === "low" ? "medium" : next[i].confidence,
        testBlockLength: len,
      };
      answerZone = true;
    }
  }

  return next;
}

/** V2 — birleşik optik alanlarını ayırır, gerçekçi sütun tahmini */
export function parseTxtFileV2(text: string): ParsedTxtFile {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/\uFFFD/g, "").replace(/\s+$/g, ""))
    .filter((l) => l.trim().length > 0);

  const delimiter = detectDelimiter(lines);
  const warnings: string[] = [];
  let compositeCellsSplit = 0;

  const rawRows = lines.map((line) => {
    const rawParts = line.split(/\t|;/).filter((p) => p.trim().length > 0);
    const cells = tokenizeLine(line, delimiter);
    if (cells.length > rawParts.length) {
      compositeCellsSplit += cells.length - rawParts.length;
    }
    return cells;
  });

  let rows = padRows(rawRows.filter((r) => r.length > 0));
  rows = trimTrailingEmptyColumns(rows);

  if (!rows.length) {
    return {
      delimiter,
      rawLineCount: 0,
      rows: [],
      columns: [],
      report: {
        version: 2,
        delimiter,
        delimiterLabel: delimiterLabel(delimiter),
        rawLineCount: 0,
        columnCount: 0,
        compositeCellsSplit: 0,
        warnings: ["Dosyada okunabilir satır yok."],
        columnScores: [],
      },
    };
  }

  const colCount = rows[0]?.length ?? 0;
  let columns: ColumnHypothesis[] = [];
  const columnScores: ParseEngineReport["columnScores"] = [];
  const totalRows = rows.length;

  for (let i = 0; i < colCount; i++) {
    const values = columnValues(rows, i);
    const inferred = scoreColumn(values, totalRows);
    const sample = values[0]?.slice(0, 48) ?? "";
    columns.push({
      index: i,
      role: inferred.role,
      label: inferred.label,
      confidence: inferred.confidence,
      testBlockLength: inferred.testBlockLength,
      sample,
    });
    columnScores.push({ index: i, role: inferred.role, score: Math.round(inferred.score * 100) });
  }

  columns = refineColumnsByLayout(columns, rows);

  columns.forEach((col, i) => {
    const values = columnValues(rows, i);
    const rescored = scoreColumn(values, totalRows);
    columnScores[i] = {
      index: i,
      role: col.role,
      score:
        col.role === "ignore"
          ? 100
          : col.role !== rescored.role
            ? Math.round(rescored.score * 100)
            : Math.round(rescored.score * 100),
    };
  });

  const hasIdentity = columns.some((c) =>
    ["tc", "student_no", "student_id_name"].includes(c.role)
  );
  const hasName = columns.some((c) => ["name", "student_id_name"].includes(c.role));
  const hasTest = columns.some((c) => c.role === "test_block");
  const hasBooklet = columns.some((c) => c.role === "booklet");
  const ignoredCols = columns.filter((c) => c.role === "ignore").length;

  if (!hasIdentity) {
    warnings.push("Öğrenci no / TC sütunu bulunamadı — sol sütunları kontrol edin.");
  }
  if (!hasName) {
    warnings.push("Ad soyad sütunu net değil — no+ad bitişik alanı ayrılmış olabilir.");
  }
  if (!hasTest) {
    warnings.push("Cevap bloğu tespit edilemedi — uzun A–E sütunlarını işaretleyin.");
  }
  if (!hasBooklet) {
    warnings.push("Kitapçık (A–D) ayrı sütun bulunamadı — gerekirse elle seçin.");
  }
  if (compositeCellsSplit > 0) {
    warnings.push(
      `${compositeCellsSplit} birleşik alan ayrıldı: öğrenci no+ad, sınıf+kitapçık+cevap.`
    );
  }
  if (ignoredCols > 0) {
    warnings.push(`${ignoredCols} boş/seyrek sütun otomatik yoksayıldı.`);
  }

  return {
    delimiter,
    rawLineCount: lines.length,
    rows,
    columns,
    report: {
      version: 2,
      delimiter,
      delimiterLabel: delimiterLabel(delimiter),
      rawLineCount: lines.length,
      columnCount: colCount,
      compositeCellsSplit,
      warnings,
      columnScores,
    },
  };
}
