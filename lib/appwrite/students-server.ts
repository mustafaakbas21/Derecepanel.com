import "server-only";

import { ID, Query } from "node-appwrite";

import {
  APPWRITE_COLLECTION_STUDENTS,
  APPWRITE_COLLECTION_USERS,
  APPWRITE_DATABASE_ID,
  resolveCoachLoginEmail,
} from "@/lib/appwrite/config";
import { getAdminDatabases, getAdminUsers } from "@/lib/appwrite/server";
import { isAppwriteAuthReady, provisionCoachAccount } from "@/lib/auth/appwrite-login";
import type { StudentRecord } from "@/lib/students/types";

export type StudentSyncResult = {
  synced: number;
  provisioned: number;
  skipped: number;
  errors: string[];
};

function studentToDoc(student: StudentRecord) {
  const kullaniciAdi = String(student.kullaniciAdi || "").trim();
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
    panelSifre: String(student.panelSifre || "").trim(),
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

async function findAppwriteUserIdByEmail(email: string): Promise<string | null> {
  try {
    const page = await getAdminUsers().list([Query.equal("email", email), Query.limit(1)]);
    return page.users[0]?.$id ?? null;
  } catch {
    return null;
  }
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

export async function provisionStudentAuth(student: StudentRecord): Promise<boolean> {
  const kullaniciAdi = String(student.kullaniciAdi || "").trim();
  const password = String(student.panelSifre || "").trim();
  if (!kullaniciAdi || !password) return false;

  const email =
    String(student.email || "").trim() || resolveCoachLoginEmail(kullaniciAdi);
  if (!email) return false;

  if (!isAppwriteAuthReady()) return false;

  await provisionCoachAccount(email, password);

  let appwriteUserId = await findAppwriteUserIdByEmail(email);
  if (!appwriteUserId) {
    const created = await getAdminUsers().create(
      ID.unique(),
      email,
      undefined,
      password,
      student.name || kullaniciAdi
    );
    appwriteUserId = created.$id;
  }

  try {
    await upsertStudentUserDoc({
      appwriteUserId,
      email,
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
  if (!isAppwriteAuthReady()) {
    result.errors.push("Appwrite yapılandırması eksik");
    return result;
  }

  for (const student of students) {
    if (!student.ogrenciId) {
      result.skipped += 1;
      continue;
    }

    try {
      await upsertStudentDocument(student);
      result.synced += 1;

      if (options?.provisionAuth !== false) {
        const ok = await provisionStudentAuth(student);
        if (ok) result.provisioned += 1;
      }
    } catch (err) {
      result.errors.push(`${student.ogrenciId}: ${String((err as Error)?.message || err)}`);
    }
  }

  return result;
}
