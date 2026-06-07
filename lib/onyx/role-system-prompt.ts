import {
  buildOnyxPersonaPrompt,
  type OnyxRolePayload,
  resolveOnyxRequestRole,
} from "@/lib/onyx/onyx-persona";
import type { OnyxRole } from "@/lib/onyx/role-quick-prompts";

export { resolveOnyxRequestRole, type OnyxRolePayload } from "@/lib/onyx/onyx-persona";

/** Engine — role bazlı Onyx persona bloğu */
export function buildOnyxRoleSystemPrompt(role: OnyxRole): string {
  return buildOnyxPersonaPrompt(role);
}

/** @deprecated resolveOnyxRequestRole kullanın */
export function resolveOnyxRoleFromBody(body: OnyxRolePayload): OnyxRole {
  return resolveOnyxRequestRole(body);
}
