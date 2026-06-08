import "server-only";

import { Query } from "node-appwrite";

import { getPlatformData } from "@/lib/admin/platform-store-server";
import {
  APPWRITE_COLLECTION_PANEL_DATA,
  APPWRITE_COLLECTION_STUDENTS,
  APPWRITE_COLLECTION_USERS,
  APPWRITE_DATABASE_ID,
  normalizeLoginUsername,
  resolveCoachLoginEmail,
  resolveStudentLoginEmail,
} from "@/lib/appwrite/config";
import {
  ensureAppwriteAuthUser,
  findAppwriteUserIdByEmail,
} from "@/lib/appwrite/auth-users-server";
import { getAdminDatabases, isAppwriteServerConfigured } from "@/lib/appwrite/server";
import {
  hashPanelPasswordForStorage,
  readPlainPanelPassword,
  verifyPanelPassword,
} from "@/lib/auth/password-hash";
import { STORAGE_KEY } from "@/lib/students/constants";
import type { StudentRecord } from "@/lib/students/types";

export type StudentSyncResult = {
  synced: number;
  provisioned: number;
  skipped: number;
  errors: string[];
};

function studentToDoc(student: StudentRecord) {
  const rawUsername = String(student.kullaniciAdi || "").trim();
  const kullaniciAdi = normalizeLoginUsername(rawUsername) || rawUsername;
  const email =
    String(student.email || "").trim() ||
    (kullaniciAdi ? resolveCoachLoginEmail(kullaniciAdi) : "");

  return {
    ogrenciId: student.ogrenciId,
    coachId: student.coachId,
    koc_id: student.coachId,
    name: student.name,
    fullName: student.name,
    studentCode: student.studentCode,
    kullaniciAdi,
    panelSifre: hashPanelPasswordForStorage(student.panelSifre),
    email,
    alan: student.alan,
    goal: student.goal,
    status: student.status,
    parent: student.parent,
    parentPhone: student.parentPhone,
    sinifBranch: student.sinifBranch,
    targetUniversity: student.targetUniversity ?? "",
    targetDepartment: student.targetDepartment ?? "",
    kayitDate: student.kayitDate,
  };
}

async function upsertStudentDocument(student: StudentRecord): Promise<void> {
  const db = getAdminDatabases();
  const docId = student.ogrenciId;
  const payload = studentToDoc(student);

  try {
    await db.getDocument(APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_STUDENTS, docId);
    await db.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_STUDENTS, docId, payload);
  } catch (err) {
    const msg = String((err as Error)?.message || "").toLowerCase();
    if (/not found|could not be found|404/.test(msg)) {
      await db.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_COLLECTION_STUDENTS,
        docId,
        payload
      );
      return;
    }
    throw err;
  }
}

async function upsertStudentUserDoc(params: {
  appwriteUserId: string;
  email: string;
  username: string;
  student: StudentRecord;
}): Promise<void> {
  const db = getAdminDatabases();
  const payload = {
    role: "student",
    username: params.username,
    coachId: params.student.coachId,
    email: params.email,
    fullName: params.student.name,
  };

  try {
    await db.getDocument(APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_USERS, params.appwriteUserId);
    await db.updateDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTION_USERS,
      params.appwriteUserId,
      payload
    );
  } catch (err) {
    const msg = String((err as Error)?.message || "").toLowerCase();
    if (/not found|could not be found|404/.test(msg)) {
      await db.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_COLLECTION_USERS,
        params.appwriteUserId,
        payload
      );
      return;
    }
    throw err;
  }
}

export async function provisionStudentAuth(
  student: StudentRecord,
  plainPassword?: string
): Promise<boolean> {
  const kullaniciAdi = String(student.kullaniciAdi || "").trim();
  const password = String(plainPassword || readPlainPanelPassword(student.panelSifre) || "").trim();
  if (!kullaniciAdi || !password) return false;

  const loginEmail = resolveStudentLoginEmail(kullaniciAdi);
  if (!loginEmail) return false;

  if (!isAppwriteServerConfigured()) return false;

  const { userId: appwriteUserId } = await ensureAppwriteAuthUser({
    usernameOrEmail: kullaniciAdi,
    password,
    displayName: student.name || kullaniciAdi,
    syncPassword: true,
  });

  try {
    await upsertStudentUserDoc({
      appwriteUserId,
      email: loginEmail,
      username: kullaniciAdi,
      student,
    });
  } catch (err) {
    const msg = String((err as Error)?.message || "").toLowerCase();
    if (!/collection.*not found|could not be found/i.test(msg)) {
      throw err;
    }
  }

  return true;
}

export async function syncStudentsBatch(
  students: StudentRecord[],
  options?: { provisionAuth?: boolean }
): Promise<StudentSyncResult> {
  const result: StudentSyncResult = { synced: 0, provisioned: 0, skipped: 0, errors: [] };
  if (!isAppwriteServerConfigured()) {
    result.errors.push("Appwrite yapılandırması eksik");
    return result;
  }

  for (const student of students) {
    if (!student.ogrenciId) {
      result.skipped += 1;
      continue;
    }

    try {
      if (options?.provisionAuth !== false) {
        const ok = await provisionStudentAuth(student);
        if (ok) result.provisioned += 1;
      }

      await upsertStudentDocument(student);
      result.synced += 1;
    } catch (err) {
      result.errors.push(`${student.ogrenciId}: ${String((err as Error)?.message || err)}`);
    }
  }

  return result;
}

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

function studentMatchesClue(student: StudentRecord, clue: string): boolean {
  const trimmed = clue.trim();
  if (!trimmed) return false;
  const normalized = normalizeLoginUsername(trimmed) || trimmed;
  const user = String(student.kullaniciAdi || "").trim();
  const userNorm = normalizeLoginUsername(user) || user;
  const email = String(student.email || "").trim().toLowerCase();
  if (trimmed.includes("@")) {
    return email === trimmed.toLowerCase();
  }
  return userNorm === normalized || user.toLowerCase() === trimmed.toLowerCase();
}

function findInStudentList(
  list: StudentRecord[],
  clue: string,
  password: string
): StudentRecord | null {
  for (const student of list) {
    if (!studentMatchesClue(student, clue)) continue;
    if (verifyPanelPassword(password, student.panelSifre)) return student;
  }
  return null;
}

async function findStudentDocInCollection(clue: string): Promise<StudentDoc | null> {
  const trimmed = clue.trim();
  if (!trimmed || !isAppwriteServerConfigured()) return null;

  const db = getAdminDatabases();
  if (trimmed.includes("@")) {
    const result = await db.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTION_STUDENTS,
      [Query.equal("email", trimmed.toLowerCase()), Query.limit(5)]
    );
    return (result.documents[0] as StudentDoc | undefined) ?? null;
  }

  const normalized = normalizeLoginUsername(trimmed) || trimmed;
  const candidates = new Set([normalized, trimmed.toLowerCase(), trimmed]);
  for (const username of candidates) {
    const result = await db.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTION_STUDENTS,
      [Query.equal("kullaniciAdi", username), Query.limit(5)]
    );
    const doc = result.documents[0] as StudentDoc | undefined;
    if (doc) return doc;
  }

  const email = resolveCoachLoginEmail(normalized);
  if (email) {
    const result = await db.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTION_STUDENTS,
      [Query.equal("email", email), Query.limit(5)]
    );
    return (result.documents[0] as StudentDoc | undefined) ?? null;
  }

  return null;
}

async function findStudentInStoredJson(
  clue: string,
  password: string
): Promise<StudentRecord | null> {
  const platformRaw = await getPlatformData(STORAGE_KEY);
  if (platformRaw) {
    try {
      const list = JSON.parse(platformRaw) as StudentRecord[];
      if (Array.isArray(list)) {
        const found = findInStudentList(list, clue, password);
        if (found) return found;
      }
    } catch {
      /* ignore */
    }
  }

  if (!isAppwriteServerConfigured()) return null;

  const db = getAdminDatabases();
  let cursor: string | undefined;

  do {
    const queries = [Query.equal("dataKey", STORAGE_KEY), Query.limit(50)];
    if (cursor) queries.push(Query.cursorAfter(cursor));

    const page = await db.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTION_PANEL_DATA,
      queries
    );

    for (const doc of page.documents) {
      try {
        const list = JSON.parse(String(doc.payload ?? "")) as StudentRecord[];
        if (!Array.isArray(list)) continue;
        const found = findInStudentList(list, clue, password);
        if (found) return found;
      } catch {
        continue;
      }
    }

    if (page.documents.length < 50) break;
    cursor = page.documents[page.documents.length - 1]?.$id;
  } while (cursor);

  return null;
}

/** Öğrenci girişi — students koleksiyonu + panel verisi yedek araması */
export async function findStudentForLogin(
  usernameOrEmail: string,
  password: string
): Promise<StudentRecord | null> {
  const clue = usernameOrEmail.trim();
  const pw = password.trim();
  if (!clue || !pw) return null;

  try {
    const doc = await findStudentDocInCollection(clue);
    if (doc && verifyPanelPassword(pw, doc.panelSifre)) {
      return mapStudentDoc(doc);
    }
  } catch (err) {
    const msg = String((err as Error)?.message || "").toLowerCase();
    if (!/collection.*not found|could not be found/i.test(msg)) {
      throw err;
    }
  }

  return findStudentInStoredJson(clue, pw);
}

/** Panel şifresi doğrulandıktan sonra Appwrite hesabı + students kaydını tamamlar */
export async function completeStudentLogin(
  student: StudentRecord,
  plainPassword: string
): Promise<{ appwriteUserId: string; email: string }> {
  const password = plainPassword.trim();
  if (password.length < 8) {
    throw new Error("Şifre en az 8 karakter olmalı.");
  }

  const recordForSync: StudentRecord = { ...student, panelSifre: password };
  await provisionStudentAuth(recordForSync, password);
  await upsertStudentDocument(recordForSync);

  const kullaniciAdi = String(student.kullaniciAdi || "").trim();
  const normalized = normalizeLoginUsername(kullaniciAdi) || kullaniciAdi;
  const loginEmail = resolveStudentLoginEmail(kullaniciAdi);

  const appwriteUserId = await findAppwriteUserIdByEmail(loginEmail);
  if (!appwriteUserId) {
    throw new Error("Geçersiz kullanıcı adı veya şifre");
  }

  return { appwriteUserId, email: loginEmail };
}
