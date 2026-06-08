import "server-only";

import type { AuthRole } from "@/lib/auth/local-auth";
import { getServerAuthSession } from "@/lib/auth/session-server";

export class StudentAuthError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "StudentAuthError";
  }
}

export type StudentSession = {
  studentId: string;
  role: AuthRole;
};

/** Sunucu — doğrulanmış öğrenci oturumu */
export async function getStudentSession(): Promise<StudentSession | null> {
  const session = await getServerAuthSession();
  if (!session || session.role !== "student") return null;
  return { studentId: session.userId, role: "student" };
}

export async function requireStudentSession(): Promise<StudentSession> {
  const session = await getStudentSession();
  if (!session) {
    throw new StudentAuthError("Öğrenci oturumu gerekli", 401);
  }
  return session;
}
