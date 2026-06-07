import "server-only";

import { getServerAuthSession } from "@/lib/auth/session-server";
import {
  AuthError,
  type CoachRole,
  type CoachSession,
} from "@/lib/auth/require-coach";
import { DEFAULT_COACH_ID } from "@/lib/students/constants";

export { AuthError };

function readHeader(request: Request, name: string): string {
  return String(request.headers.get(name) || "").trim();
}

/**
 * Koç paneli API — Appwrite oturum çerezi veya `x-dp-auth-*` header'ları.
 */
export async function requireCoachAuth(request?: Request): Promise<CoachSession> {
  const session = await getServerAuthSession();
  if (session) {
    if (session.role === "student") {
      throw new AuthError("Öğrenci erişemez", 403);
    }
    return {
      coachId: session.userId || DEFAULT_COACH_ID,
      role: session.role === "admin" ? "admin" : "coach",
    };
  }

  if (!request) {
    return { coachId: DEFAULT_COACH_ID, role: "coach" };
  }

  const role = readHeader(request, "x-dp-auth-role") as CoachRole;
  const userId =
    readHeader(request, "x-dp-auth-user-id") ||
    readHeader(request, "x-dp-appwrite-user-id") ||
    DEFAULT_COACH_ID;

  if (role === "student") {
    throw new AuthError("Öğrenci erişemez", 403);
  }

  if (role === "admin" || role === "institution") {
    return { coachId: userId || DEFAULT_COACH_ID, role };
  }

  if (role === "coach") {
    return { coachId: userId, role: "coach" };
  }

  return { coachId: DEFAULT_COACH_ID, role: "coach" };
}
