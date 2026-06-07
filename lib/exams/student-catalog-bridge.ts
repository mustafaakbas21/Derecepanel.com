import { LEGACY_STUDENT_CATALOG_KEY } from "@/lib/exams/constants";
import { readJsonArray } from "@/lib/exams/local-storage";
import type { CatalogStudent, ParseRow } from "@/lib/exams/types";
import { coachScopedStudentIdSet, shouldFilterByCoach } from "@/lib/exams/coach-scope";
import { DEFAULT_COACH_ID, createOgrenciId, createStudentCodeFromNo } from "@/lib/students/constants";
import { loadStudentsFull, persistStudentsFull } from "@/lib/students/storage";
import type { StudentRecord } from "@/lib/students/types";
import { getActiveCoachId } from "@/lib/exams/coach-scope";

type LegacyCatalogRow = {
  id?: string;
  ogrenciId?: string;
  code?: string;
  studentCode?: string;
  no?: string;
  name?: string;
  coachId?: string;
  sube?: string;
  alan?: string;
  sinifBranch?: string;
};

function mapLegacyRow(r: LegacyCatalogRow): CatalogStudent | null {
  const id = String(r.id || r.ogrenciId || "").trim();
  const code = String(r.code || r.studentCode || r.no || "").trim();
  const name = String(r.name || "").trim();
  if (!id && !code) return null;
  return {
    id: id || code,
    code: code || id,
    name,
    coachId: r.coachId,
    sube: r.sube || r.sinifBranch,
    alan: r.alan,
  };
}

/** Yükleme ekranı — derecepanel_student_catalog_v1 + students_full_v1 birleşimi */
export function loadCatalogStudents(): CatalogStudent[] {
  if (typeof window === "undefined") return [];

  const seen = new Map<string, CatalogStudent>();

  const legacy = readJsonArray<LegacyCatalogRow>(LEGACY_STUDENT_CATALOG_KEY);
  legacy.forEach((r) => {
    const m = mapLegacyRow(r);
    if (m) seen.set(m.id, m);
  });

  loadStudentsFull({ seedIfEmpty: false }).forEach((s) => {
    const m: CatalogStudent = {
      id: s.ogrenciId,
      code: s.studentCode,
      name: s.name,
      coachId: s.coachId,
      sube: s.sinifBranch,
      alan: s.alan,
    };
    seen.set(m.id, m);
  });

  let list = Array.from(seen.values());

  if (shouldFilterByCoach()) {
    const allow = coachScopedStudentIdSet(list);
    if (allow) list = list.filter((s) => allow.has(s.id));
  }

  return list;
}

export function findStudentByCode(
  students: CatalogStudent[],
  code: string
): CatalogStudent | null {
  const needle = String(code || "").trim();
  if (!needle) return null;
  return students.find((s) => s.code.trim() === needle) ?? null;
}

export function normalizeName(s: string): string {
  return String(s || "")
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ğ/g, "g")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const m = a.length;
  const n = b.length;
  const prev = new Array<number>(n + 1);
  const curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let jj = 1; jj <= n; jj++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(jj - 1) ? 0 : 1;
      curr[jj] = Math.min(curr[jj - 1] + 1, prev[jj] + 1, prev[jj - 1] + cost);
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}

export function nameSimilarity(a: string, b: string): number {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return 0;
  const maxLen = Math.max(na.length, nb.length);
  if (!maxLen) return 0;
  return Math.max(0, 1 - levenshtein(na, nb) / maxLen);
}

/** Eşleşmeyen satır için katalog + students_full kaydı */
export function createStudentFromOpticalRow(no: string, name: string): CatalogStudent {
  const coachId = getActiveCoachId() || DEFAULT_COACH_ID;
  const code = createStudentCodeFromNo(no);
  const list = loadStudentsFull({ seedIfEmpty: false });
  const existing = list.find((s) => s.studentCode.trim() === code);
  if (existing) {
    return {
      id: existing.ogrenciId,
      code: existing.studentCode,
      name: existing.name,
      coachId: existing.coachId,
      sube: existing.sinifBranch,
      alan: existing.alan,
    };
  }
  const record: StudentRecord = {
    ogrenciId: createOgrenciId(),
    coachId,
    name: name.trim() || `Öğrenci ${code}`,
    studentCode: code,
    sinifBranch: "12",
    alan: "sayisal",
    goal: "",
    targetUniversity: "",
    targetDepartment: "",
    kayitDate: new Date().toISOString().slice(0, 10),
    status: "aktif",
    parent: "",
    parentPhone: "",
  };
  persistStudentsFull([...list, record]);
  return {
    id: record.ogrenciId,
    code: record.studentCode,
    name: record.name,
    coachId: record.coachId,
    sube: record.sinifBranch,
    alan: record.alan,
  };
}

export function applyCreateMissingStudents(
  rows: ParseRow[],
  students: CatalogStudent[],
  enabled: boolean
): { rows: ParseRow[]; students: CatalogStudent[]; created: number } {
  if (!enabled) return { rows, students, created: 0 };
  let created = 0;
  const studentList = [...students];
  const nextRows = rows.map((row) => {
    if (row.matched || !row.no?.trim()) return row;
    const stu = createStudentFromOpticalRow(row.no, row.name);
    if (!studentList.some((s) => s.id === stu.id)) {
      studentList.push(stu);
      created++;
    }
    const next = { ...row };
    next.matched = true;
    next.status = "matched";
    next.matchedId = stu.id;
    next.studentId = stu.id;
    next.name = stu.name;
    next.sube = stu.sube || stu.alan || "";
    next.issues = next.issues.filter((x) => x !== "unmatched" && x !== "no-code");
    return next;
  });
  return { rows: nextRows, students: studentList, created };
}

export function bestFuzzyMatches(
  students: CatalogStudent[],
  query: string,
  limit = 3
): { student: CatalogStudent; score: number }[] {
  const scored: { student: CatalogStudent; score: number }[] = [];
  for (const s of students) {
    const score = nameSimilarity(query, s.name);
    if (score >= 0.55) scored.push({ student: s, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}
