import { buildDeepErrorDiagnosisSystemPrompt } from "@/lib/onyx/deep-error-diagnosis";
import type { OnyxRole } from "@/lib/onyx/role-quick-prompts";

/** Vision / metin soru çözümü — JSON sistem prompt (müfredat kısıtlı) */
export function buildOnyxSolveJsonSystemPrompt(
  role?: OnyxRole,
  officialCurriculumList?: string
): string {
  return buildDeepErrorDiagnosisSystemPrompt(role, officialCurriculumList);
}
