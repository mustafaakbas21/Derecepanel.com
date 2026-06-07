import "server-only";

import { ID, Query } from "node-appwrite";

import {
  APPWRITE_COLLECTION_STUDENTS,
  APPWRITE_COLLECTION_USERS,
  APPWRITE_DATABASE_ID,
  resolveCoachLoginEmail,
} from "@/lib/appwrite/config";
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
  const fallback = {
    role: "coach" as const,
    coachId: appwriteUserId,
  };

  try {
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
    const roleRaw = String(doc?.role || "").toLowerCase();
    if (roleRaw === "admin" || roleRaw === "admin_roster") {
      return { role: "admin", username: doc?.username };
    }
    if (roleRaw === "student" || roleRaw === "ogrenci") {
      return { role: "student", username: doc?.username };
    }
    return {
      role: "coach",
      username: doc?.username,
      coachId: String(doc?.coachId || appwriteUserId).trim() || appwriteUserId,
    };
  } catch (err) {
    const msg = String((err as Error)?.message || "").toLowerCase();
    if (/collection.*not found|could not be found/i.test(msg)) {
      return fallback;
    }
    throw err;
  }
}

async function findStudentByCredentials(
  usernameOrEmail: string,
  password: string
): Promise<StudentRecord | null> {
  const clue = usernameOrEmail.trim();
  const pw = password.trim();
  if (!clue || !pw) return null;

  try {
    const db = getAdminDatabases();
    const queries = clue.includes("@")
      ? [Query.equal("email", clue), Query.limit(5)]
      : [Query.equal("kullaniciAdi", clue), Query.limit(5)];

    const result = await db.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTION_STUDENTS,
      queries
    );

    for (const raw of result.documents) {
      const doc = raw as StudentDoc;
      if (String(doc.panelSifre || "") !== pw) continue;
      return mapStudentDoc(doc);
    }
    return null;
  } catch (err) {
    const msg = String((err as Error)?.message || "").toLowerCase();
    if (/collection.*not found|could not be found/i.test(msg)) {
      return null;
    }
    throw err;
  }
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
    const student = await findStudentByCredentials(username, password);
    const email = student?.email || resolveCoachLoginEmail(username);
    const sessionSecret = await createEmailSessionWithOptionalProvision(
      email,
      password,
      false
    );
    const account = getSessionAccount(sessionSecret);
    const user = await account.get();
    return {
      sessionSecret,
      userId: student?.ogrenciId || user.$id,
      email: String(user.email || email),
      role: "student",
      username: student?.kullaniciAdi || username,
      student: student ?? undefined,
    };
  }

  const email = resolveCoachLoginEmail(username);
  const sessionSecret = await createEmailSessionWithOptionalProvision(
    email,
    password,
    input.role === "coach" && isBuiltinCoachCredentials(username, password)
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
  const name = email.split("@")[0] || email;
  try {
    await getAdminUsers().create(ID.unique(), email, undefined, password, name);
  } catch (err) {
    const msg = String((err as Error)?.message || "").toLowerCase();
    if (!/already exists|409|duplicate|user_already/i.test(msg)) throw err;
  }
}
