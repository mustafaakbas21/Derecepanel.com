import { AuthError, type CoachRole } from "@/lib/auth/require-coach";
import { DEFAULT_COACH_ID } from "@/lib/students/constants";

export type YksSimSession = {
  userId: string;
  role: CoachRole | "student";
};

function readHeader(request: Request, name: string): string {
  return String(request.headers.get(name) || "").trim();
}

/** Koç/admin/öğrenci — YKS sim okuma API */
export async function requireYksSimRead(request?: Request): Promise<YksSimSession> {
  if (!request) {
    return { userId: DEFAULT_COACH_ID, role: "coach" };
  }

  const role = readHeader(request, "x-dp-auth-role") as CoachRole | "student";
  const userId =
    readHeader(request, "x-dp-auth-user-id") ||
    readHeader(request, "x-dp-appwrite-user-id") ||
    DEFAULT_COACH_ID;

  if (role === "student") {
    return { userId, role: "student" };
  }

  if (role === "admin" || role === "institution" || role === "coach") {
    return { userId: userId || DEFAULT_COACH_ID, role };
  }

  return { userId: DEFAULT_COACH_ID, role: "coach" };
}

export async function requireYksSimWrite(request?: Request): Promise<YksSimSession> {
  const session = await requireYksSimRead(request);
  if (session.role === "student") {
    throw new AuthError("Yazma yetkisi yok", 403);
  }
  return session;
}
