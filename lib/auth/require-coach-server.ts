import "server-only";

import { getServerAuthSession } from "@/lib/auth/session-server";
import {
  AuthError,
  type CoachSession,
} from "@/lib/auth/require-coach";
import { DEFAULT_COACH_ID } from "@/lib/students/constants";

export { AuthError };

/**
 * Koç paneli API — yalnızca doğrulanmış sunucu oturumu (çerez + imzalı dp_session).
 */
export async function requireCoachAuth(): Promise<CoachSession> {
  const session = await getServerAuthSession();
  if (!session) {
    throw new AuthError("Oturum gerekli", 401);
  }

  if (session.role === "student") {
    throw new AuthError("Öğrenci erişemez", 403);
  }

  return {
    coachId: session.userId || DEFAULT_COACH_ID,
    role: session.role === "admin" ? "admin" : "coach",
  };
}
