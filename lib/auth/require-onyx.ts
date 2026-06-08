import "server-only";

import { AuthError } from "@/lib/auth/require-coach";
import { getStudentCoachId } from "@/lib/auth/student-ownership";
import { getServerAuthSession } from "@/lib/auth/session-server";
import type { OnyxRole } from "@/lib/onyx/role-quick-prompts";

export type OnyxAuthContext = {
  userId: string;
  role: "coach" | "student" | "admin";
  onyxRole: OnyxRole;
};

export async function requireOnyxAuth(): Promise<OnyxAuthContext> {
  const session = await getServerAuthSession();
  if (!session) {
    throw new AuthError("Oturum gerekli", 401);
  }

  return {
    userId: session.userId,
    role: session.role,
    onyxRole: session.role === "student" ? "student" : "coach",
  };
}

/** Koç yalnızca kendi öğrencisine; öğrenci yalnızca kendine erişebilir */
export async function assertOnyxStudentAccess(
  ctx: OnyxAuthContext,
  studentId: string
): Promise<void> {
  const sid = studentId.trim();
  if (!sid) {
    throw new AuthError("studentId gerekli", 400);
  }

  if (ctx.role === "admin") return;

  if (ctx.role === "student") {
    if (ctx.userId !== sid) {
      throw new AuthError("Yetkisiz", 403);
    }
    return;
  }

  const coachId = await getStudentCoachId(sid);
  if (!coachId || coachId !== ctx.userId) {
    throw new AuthError("Yetkisiz öğrenci erişimi", 403);
  }
}
