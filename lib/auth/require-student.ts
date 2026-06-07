import "server-only";

import { cookies } from "next/headers";

import type { AuthRole } from "@/lib/auth/local-auth";
import {
  APPWRITE_USER_ID_COOKIE,
  AUTH_ROLE_COOKIE,
  AUTH_USER_ID_COOKIE,
} from "@/lib/auth/session-server";

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

function readHeader(request: Request, name: string): string {
  return String(request.headers.get(name) || "").trim();
}

/** Sunucu — öğrenci oturumu (cookie veya istek header) */
export async function getStudentSession(
  request?: Request
): Promise<StudentSession | null> {
  if (request) {
    const role = readHeader(request, "x-dp-auth-role");
    const userId =
      readHeader(request, "x-dp-auth-user-id") ||
      readHeader(request, "x-dp-appwrite-user-id");
    if (role === "student" && userId) {
      return { studentId: userId, role: "student" };
    }
  }

  const jar = await cookies();
  const role = jar.get(AUTH_ROLE_COOKIE)?.value;
  const userId =
    jar.get(AUTH_USER_ID_COOKIE)?.value || jar.get(APPWRITE_USER_ID_COOKIE)?.value;

  if (role === "student" && userId) {
    return { studentId: userId, role: "student" };
  }

  return null;
}

export async function requireStudentSession(
  request?: Request
): Promise<StudentSession> {
  const session = await getStudentSession(request);
  if (!session) {
    throw new StudentAuthError("Öğrenci oturumu gerekli", 401);
  }
  return session;
}
