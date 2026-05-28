import { looksLikeDetailedTemplate, looksLikeSimpleTemplate } from "@/lib/students/import/detect";
import {
  buildDisplayName,
  createImpStudentCode,
  digitsOnlyTc,
  goalFromTarget,
  mapAlan,
  mapGender,
  mapParentRelation,
  parseSinif,
  resolveStudentCode,
  splitTargetGoal,
} from "@/lib/students/import/field-map";
import { canonicalizeRow, getHeaderKeysFromRows, type RawSheetRow } from "@/lib/students/import/parse-file";
import type { ParseImportResult, StudentCreateInput, StudentImportRow } from "@/lib/students/import/types";

function isExampleRow(firstName: string, lastName: string): boolean {
  return (
    firstName.trim().toLocaleLowerCase("tr-TR") === "örnek" &&
    lastName.trim().toLocaleLowerCase("tr-TR") === "öğrenci"
  );
}

function isEmptyDetailed(row: Record<string, string>): boolean {
  return !row.studentNo?.trim() && !row.firstName?.trim() && !row.lastName?.trim();
}

function isEmptySimple(row: Record<string, string>): boolean {
  return !row.name?.trim() && !row.firstName?.trim() && !row.lastName?.trim();
}

function rowToImportDetailed(
  canon: Record<string, string>,
  rowIndex: number
): StudentImportRow | null {
  const firstName = canon.firstName ?? "";
  const lastName = canon.lastName ?? "";
  const studentNo = canon.studentNo ?? "";

  if (isExampleRow(firstName, lastName)) return null;
  if (isEmptyDetailed(canon)) return null;

  const classRoom = canon.classRoom ?? "";
  const branch = canon.branch ?? "";

  return {
    rowIndex,
    studentNo,
    firstName,
    lastName,
    tc: digitsOnlyTc(canon.tc ?? ""),
    gender: mapGender(canon.gender ?? ""),
    birthDate: canon.birthDate ?? "",
    classRoom,
    branch,
    phone: canon.phone ?? "",
    parentName: canon.parentName ?? "",
    parentPhone: canon.parentPhone ?? "",
    parentRelation: canon.parentRelation ?? "",
    package: canon.package ?? "",
    target: canon.target ?? "",
    alan: canon.alan ?? "",
    displayName: buildDisplayName(firstName, lastName, studentNo),
  };
}

function rowToImportSimple(
  canon: Record<string, string>,
  rowIndex: number
): StudentImportRow | null {
  const firstName = canon.firstName ?? canon.name?.split(/\s+/)[0] ?? "";
  const lastName =
    canon.lastName ??
    canon.name?.split(/\s+/).slice(1).join(" ") ??
    "";
  const name = canon.name?.trim() || buildDisplayName(firstName, lastName, "");

  if (isExampleRow(firstName, lastName)) return null;
  if (!name && isEmptySimple(canon)) return null;

  return {
    rowIndex,
    studentNo: "",
    firstName,
    lastName,
    tc: digitsOnlyTc(canon.tc ?? ""),
    gender: "",
    birthDate: "",
    classRoom: canon.sinif ?? "",
    branch: "",
    phone: canon.phone ?? canon.telefon ?? "",
    parentName: "",
    parentPhone: canon.parentPhone ?? "",
    parentRelation: "",
    package: "",
    target: canon.hedef ?? canon.target ?? "",
    displayName: name,
    name,
    sinif: canon.sinif ?? "",
    alan: canon.alan ?? "",
    hedef: canon.hedef ?? canon.target ?? "",
  };
}

export function importRowToCreateInput(
  row: StudentImportRow,
  index: number
): StudentCreateInput | null {
  const name = row.displayName.trim();
  if (!name) return null;

  const studentCode = resolveStudentCode(row.studentNo, index);
  const sinifBranch = parseSinif(
    row.classRoom || row.sinif || "",
    row.branch || ""
  );
  const alan = mapAlan(row.alan || "");
  const { goal, targetUniversity, targetDepartment } = splitTargetGoal(
    row.target || row.hedef || ""
  );

  const today = new Date().toISOString().slice(0, 10);

  return {
    studentCode,
    tcNo: row.tc || undefined,
    name,
    gender: row.gender || undefined,
    birthDate: row.birthDate || undefined,
    phone: row.phone || undefined,
    sinifBranch,
    alan,
    parent: row.parentName.trim() || "—",
    parentPhone: row.parentPhone.trim() || "—",
    parentRelation: mapParentRelation(row.parentRelation),
    kayitPaketi: row.package || undefined,
    goal: goal || goalFromTarget(row.target),
    targetUniversity,
    targetDepartment,
    status: "aktif",
    kayitDate: today,
  };
}

export function parseImportRows(rawRows: RawSheetRow[]): ParseImportResult {
  const errors: { row: number; reason: string }[] = [];
  let skipped = 0;
  const students: StudentCreateInput[] = [];

  if (rawRows.length === 0) {
    return {
      students,
      errors: [{ row: 0, reason: "Dosyada satır bulunamadı." }],
      skipped: 0,
    };
  }

  const headerKeys = getHeaderKeysFromRows(rawRows);
  const detailed = looksLikeDetailedTemplate(headerKeys);
  const simple = !detailed && looksLikeSimpleTemplate(headerKeys);

  if (!detailed && !simple) {
    const first = canonicalizeRow(rawRows[0]);
    if (!first.firstName && !first.name) {
      return {
        students: [],
        errors: [{ row: 1, reason: "Tanınmayan şablon. Örnek Excel şablonunu kullanın." }],
        skipped: 0,
      };
    }
  }

  rawRows.forEach((raw, i) => {
    const rowIndex = i + 2;
    const firstCell = Object.values(raw)[0] ?? "";
    if (firstCell.toUpperCase().startsWith("NOT")) {
      skipped++;
      return;
    }
    const canon = canonicalizeRow(raw);
    if (canon.studentNo?.toUpperCase().startsWith("NOT")) {
      skipped++;
      return;
    }

    if (simple && !canon.firstName && canon.name) {
      const parts = canon.name.split(/\s+/);
      canon.firstName = parts[0] ?? "";
      canon.lastName = parts.slice(1).join(" ");
    }

    const importRow = detailed
      ? rowToImportDetailed(canon, rowIndex)
      : rowToImportSimple(canon, rowIndex);

    if (!importRow) {
      skipped++;
      return;
    }

    const input = importRowToCreateInput(importRow, students.length + 1);
    if (!input) {
      skipped++;
      errors.push({ row: rowIndex, reason: "Geçerli öğrenci adı yok" });
      return;
    }

    if (!input.name) {
      skipped++;
      errors.push({ row: rowIndex, reason: "Ad zorunlu" });
      return;
    }

    students.push(input);
  });

  return { students, errors, skipped };
}
