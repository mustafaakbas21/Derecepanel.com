import { normalizeLoginUsername } from "@/lib/appwrite/config";
import { DEFAULT_COACH_ID } from "@/lib/students/constants";
import { panelRemoveItem, panelSetItem } from "@/lib/panel-store";
import type { StudentRecord } from "@/lib/students/types";

export const BUILTIN_COACH = {
  username: "admin1",
  password: "admin123",
  coachId: DEFAULT_COACH_ID,
  displayName: "admin1",
} as const;

export { BUILTIN_ADMIN } from "@/lib/auth/builtin-admin-constants";

export const ADMINS_STORAGE_KEY = "admins_v1";
export const COACHES_STORAGE_KEY = "coaches";
export const AUTH_ROLE_KEY = "dp_auth_role";
export const AUTH_USER_KEY = "dp_auth_user";
export const AUTH_USER_ID_KEY = "dp_auth_user_id";
export const AUTH_USERNAME_KEY = "dp_auth_username";
export const CURRENT_USER_KEY = "currentUser";

export const GENERIC_LOGIN_ERROR = "Geçersiz kullanıcı adı veya şifre";

export type CoachStatus = "Aktif" | "Pasif";

export type LocalCoachAccount = {
  id: string;
  username: string;
  password: string;
  coachId: string;
  displayName?: string;
  phone?: string;
  specialty?: string;
  status?: CoachStatus;
  createdAt?: string;
};

export type LocalAdminAccount = {
  id: string;
  username: string;
  password: string;
  displayName: string;
  status: CoachStatus;
};

export type AuthRole = "coach" | "student" | "admin";

export function isAdminPortalClient(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname.toLowerCase();
  return host === "admin.localhost" || host.startsWith("admin.");
}

export function homePathForRole(role: AuthRole): string {
  if (role === "student") return "/ogrenci";
  if (role === "admin") return isAdminPortalClient() ? "/" : "/admin";
  return "/dashboard";
}

/** Kurucu paneli: admin.* host'ta /giris → /admin/giris rewrite */
export function loginPathForRole(role: AuthRole): string {
  if (role === "admin") {
    return isAdminPortalClient() ? "/giris" : "/admin/giris";
  }
  return "/giris";
}

/** Admin giriş rotası — subdomain'de tarayıcı yolu /giris olabilir */
export function isAdminLoginPath(pathname: string): boolean {
  if (pathname === "/admin/giris") return true;
  if (isAdminPortalClient() && pathname === "/giris") return true;
  return false;
}

/** `next` yalnızca oturum rolüyle uyumlu rotalara izin verilir (redirect döngüsünü önler). */
export function isSafeNextForRole(next: string | null | undefined, role: AuthRole): boolean {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return false;
  if (next.startsWith("/giris") || next.startsWith("/admin/giris")) return false;
  if (role === "student") return next.startsWith("/ogrenci");
  if (role === "admin") {
    return next.startsWith("/admin") || (isAdminPortalClient() && next === "/");
  }
  return !next.startsWith("/ogrenci") && !next.startsWith("/admin");
}

export function resolvePostLoginPath(
  role: AuthRole,
  next: string | null | undefined
): string {
  if (isSafeNextForRole(next, role)) return next!;
  return homePathForRole(role);
}

/** Koç/öğrenci giriş formu — asla /admin'e yönlendirmez */
export function resolvePanelLoginRedirect(
  role: "coach" | "student",
  next: string | null | undefined
): string {
  if (isSafeNextForRole(next, role)) return next!;
  return role === "student" ? "/ogrenci" : "/dashboard";
}

export type ClientAuthSession = {
  role: AuthRole;
  userId: string;
  email: string;
  username?: string | null;
};

let cachedSession: ClientAuthSession | null | undefined;
let sessionFetchPromise: Promise<ClientAuthSession | null> | null = null;

export function isValidPanelUsername(value: string): boolean {
  return normalizeUsernameInput(value).length > 0;
}

export function normalizeUsernameInput(value: string): string {
  return normalizeLoginUsername(value);
}

/** Appwrite oturumu — yerel roster seed artık kullanılmaz */
export function ensureBuiltinCoachRoster() {
  /* Appwrite Cloud */
}

export function ensureBuiltinAdminRoster() {
  /* Appwrite Cloud */
}

export function resetClientAuthSessionCache(): void {
  cachedSession = undefined;
  sessionFetchPromise = null;
}

export async function fetchClientAuthSession(): Promise<ClientAuthSession | null> {
  if (sessionFetchPromise) return sessionFetchPromise;

  sessionFetchPromise = (async () => {
    try {
      const res = await fetch("/api/auth/session", {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (!res.ok) {
        cachedSession = null;
        return null;
      }
      const data = (await res.json()) as {
        authenticated?: boolean;
        role?: AuthRole;
        userId?: string;
        email?: string;
        username?: string | null;
      };
      if (!data.authenticated || !data.role || !data.userId) {
        cachedSession = null;
        return null;
      }
      cachedSession = {
        role: data.role,
        userId: data.userId,
        email: String(data.email || ""),
        username: data.username ?? null,
      };
      return cachedSession;
    } catch {
      cachedSession = null;
      return null;
    } finally {
      sessionFetchPromise = null;
    }
  })();

  return sessionFetchPromise;
}

export function getCachedAuthSession(): ClientAuthSession | null {
  return cachedSession ?? null;
}

export async function hasActiveSession(role?: AuthRole): Promise<boolean> {
  const session = await fetchClientAuthSession();
  if (!session) return false;
  if (role) return session.role === role;
  return session.role === "coach" || session.role === "student" || session.role === "admin";
}

export function hasActiveSessionSync(role?: AuthRole): boolean {
  const session = cachedSession;
  if (!session) return false;
  if (role) return session.role === role;
  return session.role === "coach" || session.role === "student" || session.role === "admin";
}

export async function clearAuthSession(): Promise<void> {
  resetClientAuthSessionCache();
  cachedSession = null;
  panelRemoveItem(CURRENT_USER_KEY);
  await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
}

function writeCurrentUserSnapshot(student: StudentRecord) {
  panelSetItem(
    CURRENT_USER_KEY,
    JSON.stringify({
      id: student.ogrenciId,
      ogrenciId: student.ogrenciId,
      name: student.name,
      studentCode: student.studentCode,
      kullaniciAdi: student.kullaniciAdi,
      coachId: student.coachId,
    })
  );
}

async function loginViaApi(
  role: AuthRole,
  username: string,
  password: string
): Promise<ClientAuthSession | null> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ role, username, password }),
  });

  const raw = await res.text();
  let data: {
    error?: string;
    role?: AuthRole;
    userId?: string;
    email?: string;
    username?: string;
    student?: StudentRecord | null;
  } = {};
  if (raw.trim()) {
    try {
      data = JSON.parse(raw) as typeof data;
    } catch {
      throw new Error(
        res.ok ? GENERIC_LOGIN_ERROR : "Sunucu yanıtı işlenemedi. Lütfen tekrar deneyin."
      );
    }
  }

  if (!res.ok) {
    throw new Error(data.error || GENERIC_LOGIN_ERROR);
  }
  if (!data.role || !data.userId) return null;

  resetClientAuthSessionCache();
  cachedSession = {
    role: data.role,
    userId: data.userId,
    email: String(data.email || ""),
    username: data.username ?? null,
  };

  if (data.role === "student" && data.student) {
    writeCurrentUserSnapshot(data.student);
  } else {
    panelRemoveItem(CURRENT_USER_KEY);
  }

  return cachedSession;
}

export async function loginAsCoach(
  username: string,
  password = ""
): Promise<ClientAuthSession | null> {
  return loginViaApi("coach", username, password);
}

export async function loginAsStudent(
  username: string,
  password: string
): Promise<ClientAuthSession | null> {
  return loginViaApi("student", username, password);
}

export async function loginAsAdmin(
  username: string,
  password: string
): Promise<ClientAuthSession | null> {
  return loginViaApi("admin", username, password);
}

export function getAuthUsername(): string {
  return cachedSession?.username || cachedSession?.email || "";
}

/** @deprecated Appwrite login kullanın */
export function authenticateCoach(): null {
  return null;
}

/** @deprecated Appwrite login kullanın */
export function authenticateStudent(): null {
  return null;
}

/** @deprecated Appwrite login kullanın */
export function authenticateAdmin(): null {
  return null;
}

/** @deprecated Oturum API üzerinden kurulur */
export function establishCoachSession(): void {}

/** @deprecated Oturum API üzerinden kurulur */
export function establishAdminSession(): void {}

/** @deprecated Oturum API üzerinden kurulur */
export function establishStudentSession(): void {}
