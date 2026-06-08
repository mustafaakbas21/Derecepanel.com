import "server-only";

import { getServerAuthSession } from "@/lib/auth/session-server";
import { AuthError, type CoachRole } from "@/lib/auth/require-coach";

export type YksSimSession = {
  userId: string;
  role: CoachRole | "student";
};

/** Koç/admin/öğrenci — YKS sim okuma API */
export async function requireYksSimRead(): Promise<YksSimSession> {
  const session = await getServerAuthSession();
  if (!session) {
    throw new AuthError("Oturum gerekli", 401);
  }

  return {
    userId: session.userId,
    role: session.role,
  };
}

export async function requireYksSimWrite(): Promise<YksSimSession> {
  const session = await requireYksSimRead();
  if (session.role === "student") {
    throw new AuthError("Yazma yetkisi yok", 403);
  }
  return session;
}
