import { describe, expect, it } from "vitest";

import {
  reconcileClassesAndStudents,
  studentBelongsToClass,
} from "@/lib/classes/reconcile";
import type { InstitutionClass } from "@/lib/classes/types";
import type { StudentRecord } from "@/lib/students/types";

const cls12a: InstitutionClass = {
  id: "c1",
  name: "12-A",
  field: "sayisal",
  studentIds: [],
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
};

const student: StudentRecord = {
  ogrenciId: "s1",
  coachId: "coach",
  name: "Test",
  studentCode: "X",
  sinifBranch: "12-A",
  alan: "sayisal",
  goal: "",
  kayitDate: "2025-09-01",
  status: "aktif",
  parent: "Veli",
  parentPhone: "555",
};

describe("reconcileClassesAndStudents", () => {
  it("links students by sinifBranch to class roster", () => {
    expect(studentBelongsToClass(student, cls12a)).toBe(true);
    const { classes, students } = reconcileClassesAndStudents([cls12a], [student]);
    expect(classes[0]!.studentIds).toContain("s1");
    expect(students[0]!.institutionClassId).toBe("c1");
    expect(students[0]!.sinifBranch).toBe("12-A");
  });
});
