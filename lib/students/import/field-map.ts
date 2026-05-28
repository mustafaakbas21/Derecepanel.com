import { buildGoal, parseGoal } from "@/lib/students/constants";
import type { Gender, ParentRelation, StudyField } from "@/lib/students/types";

export function digitsOnlyTc(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 11);
}

export function mapGender(raw: string): Gender | "" {
  const s = raw.trim().toLocaleLowerCase("tr-TR");
  if (!s) return "";
  if (s.includes("kad") || s === "k" || s === "kadin") return "kadin";
  if (s.includes("erk") || s === "e" || s === "erkek") return "erkek";
  if (s.includes("belirt") || s.includes("istemiyor")) return "belirtmek_istemiyorum";
  return "";
}

export function mapParentRelation(raw: string): ParentRelation | undefined {
  const s = raw.trim().toLocaleLowerCase("tr-TR");
  if (!s) return undefined;
  if (s.includes("anne")) return "anne";
  if (s.includes("baba")) return "baba";
  if (s.includes("vasi")) return "vasi";
  return "diger";
}

export function mapAlan(raw: string): StudyField {
  const s = raw.trim().toLocaleLowerCase("tr-TR");
  if (s.includes("say")) return "sayisal";
  if (s.includes("eşit") || s.includes("esit") || s.includes("ea")) return "esit";
  if (s.includes("söz") || s.includes("sozel")) return "sozel";
  if (s.includes("dil")) return "dil";
  if (s.includes("tyt")) return "tyt";
  return "tyt";
}

export function parseSinif(classRoom: string, branch: string): string {
  const combined = `${classRoom} ${branch}`.trim();
  if (!combined) return "12";

  const lower = combined.toLocaleLowerCase("tr-TR");
  if (lower.includes("mezun")) return "Mezun";

  const gradeMatch = lower.match(/\b(9|10|11|12)\b/);
  if (gradeMatch) {
    const grade = gradeMatch[1];
    const branchPart = branch.trim() || classRoom.replace(/.*?\b(9|10|11|12)\b\.?\s*sınıf?/i, "").trim();
    if (branchPart && /^[A-Za-zÇĞİÖŞÜçğıöşü]$/.test(branchPart)) {
      return `${grade}-${branchPart.toUpperCase()}`;
    }
    if (/12-[A-F]/i.test(combined)) {
      const m = combined.match(/12\s*[-.]?\s*([A-F])/i);
      if (m) return `12-${m[1].toUpperCase()}`;
    }
    return grade;
  }

  if (/^12[-\s]?[A-F]$/i.test(combined.replace(/\s/g, ""))) {
    const letter = combined.replace(/[^A-Fa-f]/g, "").toUpperCase();
    return `12-${letter}`;
  }

  return combined || "12";
}

export function splitTargetGoal(target: string): {
  goal: string;
  targetUniversity: string;
  targetDepartment: string;
} {
  const t = target.trim();
  if (!t) return { goal: "", targetUniversity: "", targetDepartment: "" };
  if (t.includes("—") || t.includes(" - ")) {
    const goal = t.replace(/\s*-\s*/g, " — ");
    const { university, department } = parseGoal(goal);
    return { goal, targetUniversity: university, targetDepartment: department };
  }
  return { goal: t, targetUniversity: t, targetDepartment: "" };
}

export function goalFromTarget(target: string): string {
  const { goal } = splitTargetGoal(target);
  return goal || target.trim();
}

export function buildDisplayName(first: string, last: string, studentNo: string): string {
  const name = `${first} ${last}`.trim();
  return name || studentNo.trim();
}

export function createImpStudentCode(index: number): string {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `IMP-${index}-${rand}`;
}

export function resolveStudentCode(studentNo: string, index: number): string {
  const code = studentNo.trim();
  if (code) return code;
  return createImpStudentCode(index);
}
