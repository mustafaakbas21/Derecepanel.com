import { DEFAULT_COACH_ID, createOgrenciId } from "@/lib/students/constants";
import type { ImportApiResponse, StudentCreateInput } from "@/lib/students/import/types";
import type { StudentRecord } from "@/lib/students/types";

export function applyStudentImport(
  inputs: StudentCreateInput[],
  existingStudentCodes: string[],
  coachId: string = DEFAULT_COACH_ID
): ImportApiResponse {
  const existing = new Set(
    existingStudentCodes.map((c) => c.trim().toLocaleLowerCase("tr-TR"))
  );
  const errors: { row: number; reason: string }[] = [];
  const records: StudentRecord[] = [];
  let skipped = 0;

  inputs.forEach((input, index) => {
    const row = index + 2;
    const codeKey = input.studentCode.trim().toLocaleLowerCase("tr-TR");

    if (codeKey && existing.has(codeKey)) {
      skipped++;
      errors.push({
        row,
        reason: `Öğrenci No zaten kayıtlı: ${input.studentCode}`,
      });
      return;
    }

    const record: StudentRecord = {
      ogrenciId: createOgrenciId(),
      coachId,
      name: input.name,
      studentCode: input.studentCode,
      tcNo: input.tcNo,
      gender: input.gender,
      birthDate: input.birthDate,
      phone: input.phone,
      sinifBranch: input.sinifBranch,
      alan: input.alan,
      goal: input.goal,
      targetUniversity: input.targetUniversity ?? "",
      targetDepartment: input.targetDepartment ?? "",
      kayitPaketi: input.kayitPaketi,
      kayitDate: input.kayitDate,
      status: input.status,
      parent: input.parent,
      parentPhone: input.parentPhone,
      parentRelation: input.parentRelation,
    };

    records.push(record);
    if (codeKey) existing.add(codeKey);
  });

  return {
    success: records.length > 0 || skipped > 0,
    imported: records.length,
    skipped,
    errors,
    records,
  };
}
