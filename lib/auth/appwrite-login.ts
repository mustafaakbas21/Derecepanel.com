import "server-only";

import { Query } from "node-appwrite";

import {
  APPWRITE_COLLECTION_STUDENTS,
  APPWRITE_COLLECTION_USERS,
  APPWRITE_DATABASE_ID,
  normalizeLoginUsername,
  resolveCoachLoginEmail,
  resolveStudentLoginEmail,
} from "@/lib/appwrite/config";
import {
  createAppwriteAuthUser,
  findAppwriteUserIdByEmail,
} from "@/lib/appwrite/auth-users-server";
import {
  completeStudentLogin,
  findStudentForLogin,
} from "@/lib/appwrite/students-server";
import {
  getAdminDatabases,
  getAdminUsers,
  getSessionAccount,
  isAppwriteServerConfigured,
} from "@/lib/appwrite/server";
import { BUILTIN_COACH } from "@/lib/auth/local-auth";
import type { StudentRecord } from "@/lib/students/types";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID } from "@/lib/appwrite/config";

function isBuiltinCoachCredentials(username: string, password: string): boolean {
  return username.trim() === BUILTIN_COACH.username && password === BUILTIN_COACH.password;
}

export type AppwriteLoginResult = {
  sessionSecret: string;
  userId: string;
  email: string;
  role: "coach" | "student" | "admin";
  username?: string;
  student?: StudentRecord;
};

type UserDoc = {
  $id: string;
  role?: string;
  username?: string;
  coachId?: string;
  fullName?: string;
};

type StudentDoc = {
  $id: string;
  ogrenciId?: string;
  coachId?: string;
  koc_id?: string;
  name?: string;
  fullName?: string;
  studentCode?: string;
  kullaniciAdi?: string;
  panelSifre?: string;
  email?: string;
  alan?: string;
  goal?: string;
  status?: string;
  parent?: string;
  parentPhone?: string;
  sinifBranch?: string;
  targetUniversity?: string;
  targetDepartment?: string;
  kayitDate?: string;
};

function mapStudentDoc(doc: StudentDoc): StudentRecord {
  const ogrenciId = String(doc.ogrenciId || doc.$id).trim();
  return {
    ogrenciId,
    coachId: String(doc.coachId || doc.koc_id || "").trim() || "coach-default",
    name: String(doc.name || doc.fullName || "").trim() || ogrenciId,
    studentCode: String(doc.studentCode || "").trim() || ogrenciId,
    sinifBranch: doc.sinifBranch ?? "",
    alan: (doc.alan as StudentRecord["alan"]) || "Sayısal",
    goal: doc.goal ?? "",
    targetUniversity: doc.targetUniversity ?? "",
    targetDepartment: doc.targetDepartment ?? "",
    kayitDate: doc.kayitDate ?? new Date().toISOString().slice(0, 10),
    status: (doc.status as StudentRecord["status"]) || "Aktif",
    parent: doc.parent ?? "",
    parentPhone: doc.parentPhone ?? "",
    kullaniciAdi: doc.kullaniciAdi ?? "",
    panelSifre: doc.panelSifre ?? "",
    email: doc.email ?? "",
  };
}

async function resolveRoleFromUsers(
  appwriteUserId: string,
  email: string
): Promise<{ role: AppwriteLoginResult["role"]; username?: string; coachId?: string }> {
  const db = getAdminDatabases();
  const byId = await db.listDocuments(APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_USERS, [
    Query.equal("$id", appwriteUserId),
    Query.limit(1),
  ]);
  let doc = byId.documents[0] as UserDoc | undefined;
  if (!doc && email) {
    const byEmail = await db.listDocuments(APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_USERS, [
      Query.equal("email", email),
      Query.limit(1),
    ]);
    doc = byEmail.documents[0] as UserDoc | undefined;
  }

  if (!doc) {
    throw new Error("Geçersiz kullanıcı adı veya şifre");
  }

  const roleRaw = String(doc.role || "").toLowerCase();
  if (roleRaw === "admin" || roleRaw === "admin_roster") {
    return { role: "admin", username: doc.username };
  }
  if (roleRaw === "student" || roleRaw === "ogrenci") {
    return { role: "student", username: doc.username };
  }
  return {
    role: "coach",
    username: doc.username,
    coachId: String(doc.coachId || appwriteUserId).trim() || appwriteUserId,
  };
}

async function findStudentDocByClue(clue: string): Promise<StudentDoc | null> {
  const trimmed = clue.trim();
  if (!trimmed) return null;

  const db = getAdminDatabases();
  if (trimmed.includes("@")) {
    const result = await db.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTION_STUDENTS,
      [Query.equal("email", trimmed), Query.limit(5)]
    );
    return (result.documents[0] as StudentDoc | undefined) ?? null;
  }

  const normalized = normalizeLoginUsername(trimmed) || trimmed;
  for (const username of [normalized, trimmed]) {
    const result = await db.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTION_STUDENTS,
      [Query.equal("kullaniciAdi", username), Query.limit(5)]
    );
    const doc = result.documents[0] as StudentDoc | undefined;
    if (doc) return doc;
  }
  return null;
}

async function findUserDocByUsername(normalized: string): Promise<UserDoc | null> {
  const db = getAdminDatabases();
  const byUsername = await db.listDocuments(APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_USERS, [
    Query.equal("username", normalized),
    Query.limit(1),
  ]);
  return (byUsername.documents[0] as UserDoc | undefined) ?? null;
}

function isAdminUserDoc(doc: UserDoc | null | undefined): boolean {
  const roleRaw = String(doc?.role || "").toLowerCase();
  return roleRaw === "admin" || roleRaw === "admin_roster";
}

/** Kurucu şifresiz giriş — users koleksiyonundaki role göre doğrular */
export async function isAdminPanelUsername(username: string): Promise<boolean> {
  const normalized = normalizeLoginUsername(username) || username.trim();
  if (!normalized) return false;
  const doc = await findUserDocByUsername(normalized);
  return isAdminUserDoc(doc);
}

/** Appwrite Cloud: SDK guest scope hatası verir; REST ile şifre doğrulanır. */
async function verifyEmailPassword(email: string, password: string): Promise<string> {
  const res = await fetch(`${APPWRITE_ENDPOINT}/account/sessions/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Appwrite-Project": APPWRITE_PROJECT_ID,
    },
    body: JSON.stringify({ email, password }),
  });
  const data = (await res.json().catch(() => ({}))) as { userId?: string; message?: string };
  if (!res.ok) {
    throw new Error(String(data.message || "Geçersiz kullanıcı adı veya şifre"));
  }
  const userId = String(data.userId || "").trim();
  if (!userId) {
    throw new Error("Geçersiz kullanıcı adı veya şifre");
  }
  return userId;
}

/** Oturum gizlisi artık REST yanıtında dönmez; admin API ile sunucu oturumu oluşturulur. */
async function createServerSessionForUser(userId: string): Promise<string> {
  const session = await getAdminUsers().createSession(userId);
  const secret = String(session.secret || "").trim();
  if (!secret) {
    throw new Error("Oturum oluşturulamadı.");
  }
  return secret;
}

async function createEmailSession(email: string, password: string): Promise<string> {
  const userId = await verifyEmailPassword(email, password);
  return createServerSessionForUser(userId);
}

async function createEmailSessionWithOptionalProvision(
  email: string,
  password: string,
  provisionIfMissing: boolean
): Promise<string> {
  try {
    return await createEmailSession(email, password);
  } catch (err) {
    const msg = String((err as Error)?.message || "").toLowerCase();
    const missingUser =
      /invalid credentials|user not found|user with the same|not authorized/i.test(msg);
    if (!provisionIfMissing || !missingUser) {
      throw new Error("Geçersiz kullanıcı adı veya şifre");
    }
    await provisionCoachAccount(email, password);
    return createEmailSession(email, password);
  }
}

export function isAppwriteAuthReady(): boolean {
  return isAppwriteServerConfigured();
}

/** Koç girişi — yalnızca kullanıcı adı; Appwrite users + admin session */
export async function loginCoachWithUsernameOnly(
  username: string
): Promise<AppwriteLoginResult> {
  if (!isAppwriteServerConfigured()) {
    throw new Error("Appwrite sunucu yapılandırması eksik.");
  }

  const normalized = normalizeLoginUsername(username) || username.trim();
  if (!normalized) {
    throw new Error("Kullanıcı adınızı girin.");
  }

  const email = resolveCoachLoginEmail(normalized);

  let appwriteUserId: string | null = null;
  let profileUsername = normalized;

  const userDoc = await findUserDocByUsername(normalized);

  if (userDoc) {
    const roleRaw = String(userDoc.role || "").toLowerCase();
    if (roleRaw === "student" || roleRaw === "ogrenci") {
      throw new Error("Geçersiz kullanıcı adı");
    }
    appwriteUserId = userDoc.$id;
    profileUsername = String(userDoc.username || normalized).trim() || normalized;
  }

  if (!appwriteUserId) {
    appwriteUserId = await findAppwriteUserIdByEmail(email);
  }

  if (!appwriteUserId) {
    throw new Error("Geçersiz kullanıcı adı");
  }

  const profile = await resolveRoleFromUsers(appwriteUserId, email);
  if (profile.role === "student") {
    throw new Error("Geçersiz kullanıcı adı");
  }

  const sessionSecret = await createServerSessionForUser(appwriteUserId);

  return {
    sessionSecret,
    userId: profile.coachId || appwriteUserId,
    email,
    // Koç kapısından giriş — admin hesabı da koç oturumu açar (loginWithAppwrite ile aynı)
    role: "coach",
    username: profile.username || profileUsername,
  };
}

/** Öğrenci girişi — yalnızca kullanıcı adı; students + Appwrite admin session */
export async function loginStudentWithUsernameOnly(
  username: string
): Promise<AppwriteLoginResult> {
  if (!isAppwriteServerConfigured()) {
    throw new Error("Appwrite sunucu yapılandırması eksik.");
  }

  const normalized = normalizeLoginUsername(username) || username.trim();
  if (!normalized) {
    throw new Error("Kullanıcı adınızı girin.");
  }

  let studentDoc: StudentDoc | null = null;
  try {
    studentDoc = await findStudentDocByClue(normalized);
  } catch (err) {
    const msg = String((err as Error)?.message || "").toLowerCase();
    if (/collection.*not found|could not be found/i.test(msg)) {
      throw new Error("Geçersiz kullanıcı adı");
    }
    throw err;
  }

  if (!studentDoc) {
    throw new Error("Geçersiz kullanıcı adı");
  }

  const student = mapStudentDoc(studentDoc);
  const loginEmail = resolveStudentLoginEmail(student.kullaniciAdi || normalized);
  const appwriteUserId = await findAppwriteUserIdByEmail(loginEmail);
  if (!appwriteUserId) {
    throw new Error("Geçersiz kullanıcı adı");
  }

  const sessionSecret = await createServerSessionForUser(appwriteUserId);

  return {
    sessionSecret,
    userId: student.ogrenciId,
    email: loginEmail,
    role: "student",
    username: student.kullaniciAdi || normalized,
    student,
  };
}

export async function loginWithAppwrite(input: {
  role: "coach" | "student" | "admin";
  username: string;
  password: string;
}): Promise<AppwriteLoginResult> {
  if (!isAppwriteServerConfigured()) {
    throw new Error("Appwrite sunucu yapılandırması eksik.");
  }

  const password = input.password;
  const username = input.username.trim();
  if (!username || !password) {
    throw new Error("Geçersiz kullanıcı adı veya şifre");
  }

  if (input.role === "student") {
    const student = await findStudentForLogin(username, password);
    if (!student) {
      throw new Error("Geçersiz kullanıcı adı veya şifre");
    }

    const { appwriteUserId, email } = await completeStudentLogin(student, password);
    const sessionSecret = await createServerSessionForUser(appwriteUserId);

    return {
      sessionSecret,
      userId: student.ogrenciId,
      email,
      role: "student",
      username: student.kullaniciAdi || username,
      student,
    };
  }

  const normalized = normalizeLoginUsername(username) || username;
  const email = resolveCoachLoginEmail(normalized);
  const allowBuiltinProvision =
    process.env.NODE_ENV !== "production" &&
    input.role === "coach" &&
    isBuiltinCoachCredentials(username, password);
  const sessionSecret = await createEmailSessionWithOptionalProvision(
    email,
    password,
    allowBuiltinProvision
  );
  const account = getSessionAccount(sessionSecret);
  const user = await account.get();
  const profile = await resolveRoleFromUsers(user.$id, String(user.email || email));

  if (input.role === "admin" && profile.role !== "admin") {
    await account.deleteSession("current");
    throw new Error("Geçersiz kullanıcı adı veya şifre");
  }
  if (input.role === "coach" && profile.role === "admin") {
    // admin hesabı koç kapısından girebilir
  } else if (input.role === "coach" && profile.role === "student") {
    await account.deleteSession("current");
    throw new Error("Geçersiz kullanıcı adı veya şifre");
  }

  return {
    sessionSecret,
    userId: profile.coachId || user.$id,
    email: String(user.email || email),
    role: input.role === "admin" ? "admin" : input.role,
    username: profile.username || username,
  };
}

export async function logoutAppwriteSession(sessionSecret: string | null): Promise<void> {
  if (!sessionSecret || !isAppwriteServerConfigured()) return;
  try {
    const account = getSessionAccount(sessionSecret);
    await account.deleteSession("current");
  } catch {
    /* ignore */
  }
}

export async function provisionCoachAccount(email: string, password: string): Promise<void> {
  await createAppwriteAuthUser({
    email,
    password,
    name: email.split("@")[0] || email,
  });
}
