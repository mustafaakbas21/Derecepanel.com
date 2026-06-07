import "server-only";

import {
  careerCounselingToSkillResponse,
  deepDiagnosisToSkillResponse,
} from "@/lib/onyx/skill-adapters";
import type { OnyxCareerCounseling } from "@/lib/onyx/career-counseling";
import type { OnyxDeepErrorDiagnosis } from "@/lib/onyx/deep-error-diagnosis";
import type { OnyxSkillResponse } from "@/lib/onyx/skill-types";
import type { OnyxRole } from "@/lib/onyx/role-quick-prompts";

export function buildSkillResponseFromEngineResult(input: {
  careerCounseling?: OnyxCareerCounseling;
  deepErrorDiagnosis?: OnyxDeepErrorDiagnosis;
  skillResponse?: OnyxSkillResponse;
  role?: OnyxRole;
}): OnyxSkillResponse | undefined {
  if (input.skillResponse) return input.skillResponse;
  if (input.careerCounseling) {
    return careerCounselingToSkillResponse(input.careerCounseling);
  }
  if (input.deepErrorDiagnosis) {
    return deepDiagnosisToSkillResponse(
      input.deepErrorDiagnosis,
      input.role
    );
  }
  return undefined;
}
