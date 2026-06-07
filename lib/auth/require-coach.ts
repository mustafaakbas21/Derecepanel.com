import { getCachedAuthSession } from "@/lib/auth/local-auth";
import { DEFAULT_COACH_ID } from "@/lib/students/constants";

export type CoachRole = "coach" | "admin" | "institution" | "student";

export type CoachSession = {
  coachId: string;
  role: CoachRole;
};

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/** İstemci fetch için auth header'ları */
export function clientAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const session = getCachedAuthSession();
  const role = session?.role || "coach";
  const userId = session?.userId || DEFAULT_COACH_ID;
  return {
    "x-dp-auth-role": role,
    "x-dp-auth-user-id": userId,
  };
}
