import "server-only";

import { Query } from "node-appwrite";

import {
  findCoachByIdOnPlatform,
  loadPlatformCoaches,
  resolveCoachUsername,
  updateCoachOnPlatform,
} from "@/lib/admin/coaches-server";
import {
  APPWRITE_COLLECTION_STUDENTS,
  APPWRITE_COLLECTION_USERS,
  APPWRITE_DATABASE_ID,
  normalizeLoginUsername,
  resolveCoachLoginEmail,
  resolveStudentLoginEmail,
} from "@/lib/appwrite/config";
import {
  findAppwriteUserIdByEmail,
  resolveAuthEmailFromUsername,
  syncAppwriteUserPassword,
  translateAppwriteUserError,
} from "@/lib/appwrite/auth-users-server";
import { getAdminDatabases, getAdminUsers, isAppwriteServerConfigured } from "@/lib/appwrite/server";
import type { ServerAuthSession } from "@/lib/auth/session-server";
import {
  findStudentForLogin,
  provisionStudentAuth,
  syncStudentsBatch,
} from "@/lib/appwrite/students-server";
import { getPlatformData, setPlatformData } from "@/lib/admin/platform-store-server";
import { STORAGE_KEY } from "@/lib/students/constants";
import type { StudentRecord } from "@/lib/students/types";

import type { CoachProfileDto, StudentProfileDto } from "@/lib/appwrite/profile-types";

export type { CoachProfileDto, StudentProfileDto };

async function verifyCurrentPassword(loginEmail: string, password: string): Promise<boolean> {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT?.trim().replace(/\/+$/, "");
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID?.trim();
  if (!endpoint || !projectId) return false;
  const res = await fetch(`${endpoint}/account/sessions/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Appwrite-Project": projectId,
    },
    body: JSON.stringify({ email: loginEmail, password }),
  });
  return res.ok;
}

async function upsertUserDoc(params: {
  appwriteUserId: string;
  role: "coach" | "student";
  username: string;
  coachId: string;
  email: string;
  fullName: string;
}): Promise<void> {
  if (!isAppwriteServerConfigured()) return;
  const db = getAdminDatabases();
  const payload = {
    role: params.role,
    username: params.username,
    coachId: params.coachId,
    email: params.email,
    fullName: params.fullName,
  };
  try {
    await db.getDocument(APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_USERS, params.appwriteUserId);
    await db.updateDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTION_USERS,
      params.appwriteUserId,
      payload
    );
  } catch {
    try {
      await db.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_COLLECTION_USERS,
        params.appwriteUserId,
        payload
      );
    } catch {
      /* users koleksiyonu yoksa atla */
    }
  }
}

async function findStudentRecord(studentId: string): Promise<StudentRecord | null> {
  if (!isAppwriteServerConfigured()) return null;
  const db = getAdminDatabases();
  try {
    const doc = await db.getDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTION_STUDENTS,
      studentId
    );
    return mapStudentDoc(doc as Record<string, unknown>);
  } catch {
    try {
      const result = await db.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_COLLECTION_STUDENTS,
        [Query.equal("ogrenciId", studentId), Query.limit(1)]
      );
      const doc = result.documents[0];
      return doc ? mapStudentDoc(doc as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
}

function mapStudentDoc(doc: Record<string, unknown>): StudentRecord {
  const ogrenciId = String(doc.ogrenciId || doc.$id || "").trim();
  return {
    ogrenciId,
    coachId: String(doc.coachId || doc.koc_id || "").trim() || "coach-default",
    name: String(doc.name || doc.fullName || "").trim() || ogrenciId,
    studentCode: String(doc.studentCode || "").trim() || ogrenciId,
    sinifBranch: String(doc.sinifBranch || ""),
    alan: (doc.alan as StudentRecord["alan"]) || "sayisal",
    goal: String(doc.goal || ""),
    targetUniversity: String(doc.targetUniversity || ""),
    targetDepartment: String(doc.targetDepartment || ""),
    kayitDate: String(doc.kayitDate || ""),
    status: (doc.status as StudentRecord["status"]) || "aktif",
    parent: String(doc.parent || ""),
    parentPhone: String(doc.parentPhone || ""),
    kullaniciAdi: String(doc.kullaniciAdi || ""),
    panelSifre: String(doc.panelSifre || ""),
    email: String(doc.email || "") || undefined,
    phone: String(doc.phone || "") || undefined,
    gender: doc.gender as StudentRecord["gender"],
    birthDate: String(doc.birthDate || "") || undefined,
    city: String(doc.city || "") || undefined,
    ilce: String(doc.ilce || "") || undefined,
    address: String(doc.address || "") || undefined,
    parentEmail: String(doc.parentEmail || "") || undefined,
    parentRelation: doc.parentRelation as StudentRecord["parentRelation"],
    emergencyNotes: String(doc.emergencyNotes || "") || undefined,
    counselorNote: String(doc.counselorNote || "") || undefined,
    notes: String(doc.notes || "") || undefined,
  };
}

function studentToDto(student: StudentRecord): StudentProfileDto {
  const username = String(student.kullaniciAdi || "").trim();
  return {
    role: "student",
    ogrenciId: student.ogrenciId,
    coachId: student.coachId,
    username,
    loginEmail: resolveStudentLoginEmail(username),
    name: student.name,
    studentCode: student.studentCode,
    sinifBranch: student.sinifBranch,
    alan: student.alan,
    goal: student.goal,
    targetUniversity: student.targetUniversity,
    targetDepartment: student.targetDepartment,
    status: student.status,
    kayitDate: student.kayitDate,
    email: student.email,
    phone: student.phone,
    gender: student.gender,
    birthDate: student.birthDate,
    city: student.city,
    ilce: student.ilce,
    address: student.address,
    parent: student.parent,
    parentPhone: student.parentPhone,
    parentEmail: student.parentEmail,
    parentRelation: student.parentRelation,
    emergencyNotes: student.emergencyNotes,
    counselorNote: student.counselorNote,
    notes: student.notes,
  };
}

export async function getProfileForSession(
  session: ServerAuthSession
): Promise<CoachProfileDto | StudentProfileDto> {
  if (session.role === "student") {
    let student = await findStudentRecord(session.userId);
    if (!student) {
      const raw = await getPlatformData(STORAGE_KEY);
      if (raw) {
        try {
          const list = JSON.parse(raw) as StudentRecord[];
          student = list.find((s) => s.ogrenciId === session.userId) ?? null;
        } catch {
          student = null;
        }
      }
    }
    if (!student) throw new Error("Öğrenci profili bulunamadı.");
    return studentToDto(student);
  }

  let coach = await findCoachByIdOnPlatform(session.userId);
  if (!coach && session.username) {
    coach = await findCoachByUsername(session.username);
  }

  const username = coach?.username || session.username || "";
  const displayName = coach?.displayName || username || "Koç";

  return {
    role: "coach",
    coachId: coach?.coachId || session.userId,
    username,
    displayName,
    loginEmail: username ? resolveCoachLoginEmail(username) : session.email,
    phone: coach?.phone,
    specialty: coach?.specialty,
    status: coach?.status || "Aktif",
  };
}

async function findCoachByUsername(username: string) {
  const coaches = await loadPlatformCoaches();
  return coaches.find((c) => c.username === username) ?? null;
}

export async function updateCoachProfile(
  session: ServerAuthSession,
  body: {
    displayName?: string;
    username?: string;
    phone?: string;
    specialty?: string;
    currentPassword?: string;
    newPassword?: string;
  }
): Promise<CoachProfileDto> {
  if (session.role !== "coach" && session.role !== "admin") {
    throw new Error("Yetkisiz işlem.");
  }

  const coach = await findCoachByIdOnPlatform(session.userId);
  if (!coach) throw new Error("Koç profili bulunamadı.");

  const oldUsername = coach.username;
  const oldLoginEmail = resolveAuthEmailFromUsername(oldUsername);
  const newUsername = body.username ? resolveCoachUsername(body.username) : oldUsername;
  const newLoginEmail = resolveAuthEmailFromUsername(newUsername);
  const displayName = (body.displayName?.trim() || coach.displayName || coach.username).trim();

  if (body.newPassword) {
    if (!body.currentPassword) throw new Error("Mevcut şifrenizi girin.");
    const ok = await verifyCurrentPassword(oldLoginEmail, body.currentPassword);
    if (!ok) throw new Error("Mevcut şifre hatalı.");
    if (body.newPassword.trim().length < 8) {
      throw new Error("Yeni şifre en az 8 karakter olmalı.");
    }
  }

  const appwriteUserId = await findAppwriteUserIdByEmail(oldLoginEmail);
  if (!appwriteUserId) throw new Error("Appwrite hesabı bulunamadı.");

  const users = getAdminUsers();
  try {
    await users.updateName({ userId: appwriteUserId, name: displayName });
    if (newLoginEmail !== oldLoginEmail) {
      await users.updateEmail({ userId: appwriteUserId, email: newLoginEmail });
    }
    if (body.newPassword) {
      await syncAppwriteUserPassword(appwriteUserId, body.newPassword);
    }
  } catch (err) {
    throw translateAppwriteUserError(err);
  }

  await updateCoachOnPlatform({
    coachId: coach.coachId,
    username: newUsername,
    displayName,
    password: body.newPassword?.trim() || coach.password,
    phone: body.phone ?? coach.phone,
    specialty: body.specialty ?? coach.specialty,
    status: coach.status,
  });

  await upsertUserDoc({
    appwriteUserId,
    role: "coach",
    username: newUsername,
    coachId: coach.coachId,
    email: newLoginEmail,
    fullName: displayName,
  });

  return getProfileForSession({
    ...session,
    username: newUsername,
    email: newLoginEmail,
  }) as Promise<CoachProfileDto>;
}

async function syncStudentInPlatformStore(student: StudentRecord): Promise<void> {
  const raw = await getPlatformData(STORAGE_KEY);
  let list: StudentRecord[] = [];
  if (raw) {
    try {
      list = JSON.parse(raw) as StudentRecord[];
      if (!Array.isArray(list)) list = [];
    } catch {
      list = [];
    }
  }
  const idx = list.findIndex((s) => s.ogrenciId === student.ogrenciId);
  const next =
    idx >= 0
      ? list.map((s, i) => (i === idx ? student : s))
      : [...list, student];
  await setPlatformData(STORAGE_KEY, JSON.stringify(next));
  await syncStudentsBatch([student], { provisionAuth: true });
}

export async function updateStudentProfile(
  session: ServerAuthSession,
  body: Record<string, unknown>
): Promise<StudentProfileDto> {
  if (session.role !== "student") throw new Error("Yetkisiz işlem.");

  let student = await findStudentRecord(session.userId);
  if (!student) throw new Error("Öğrenci profili bulunamadı.");

  const oldUsername = String(student.kullaniciAdi || "").trim();
  const oldLoginEmail = resolveStudentLoginEmail(oldUsername);

  const newUsernameRaw = body.username !== undefined ? String(body.username) : oldUsername;
  const newUsername = normalizeLoginUsername(newUsernameRaw) || newUsernameRaw.trim();
  if (!newUsername) throw new Error("Geçerli bir kullanıcı adı girin.");

  const currentPassword = String(body.currentPassword || "");
  const newPassword = String(body.newPassword || "");

  if (newPassword) {
    if (!currentPassword) throw new Error("Mevcut şifrenizi girin.");
    const match = await findStudentForLogin(oldUsername, currentPassword);
    if (!match || match.ogrenciId !== student.ogrenciId) {
      throw new Error("Mevcut şifre hatalı.");
    }
    if (newPassword.length < 8) throw new Error("Yeni şifre en az 8 karakter olmalı.");
  }

  if (newUsername !== oldUsername && !currentPassword && !newPassword) {
    throw new Error("Kullanıcı adı değiştirmek için mevcut şifrenizi girin.");
  }

  const updated: StudentRecord = {
    ...student,
    name: body.displayName !== undefined ? String(body.displayName).trim() : student.name,
    kullaniciAdi: newUsername,
    email: body.contactEmail !== undefined ? String(body.contactEmail).trim() : student.email,
    phone: body.phone !== undefined ? String(body.phone).trim() : student.phone,
    gender: body.gender !== undefined ? (body.gender as StudentRecord["gender"]) : student.gender,
    birthDate: body.birthDate !== undefined ? String(body.birthDate).trim() : student.birthDate,
    city: body.city !== undefined ? String(body.city).trim() : student.city,
    ilce: body.ilce !== undefined ? String(body.ilce).trim() : student.ilce,
    address: body.address !== undefined ? String(body.address).trim() : student.address,
    parent: body.parent !== undefined ? String(body.parent).trim() : student.parent,
    parentPhone:
      body.parentPhone !== undefined ? String(body.parentPhone).trim() : student.parentPhone,
    parentEmail:
      body.parentEmail !== undefined ? String(body.parentEmail).trim() : student.parentEmail,
    parentRelation:
      body.parentRelation !== undefined
        ? (body.parentRelation as StudentRecord["parentRelation"])
        : student.parentRelation,
    emergencyNotes:
      body.emergencyNotes !== undefined
        ? String(body.emergencyNotes).trim()
        : student.emergencyNotes,
    notes: body.notes !== undefined ? String(body.notes).trim() : student.notes,
  };

  const passwordForProvision = newPassword || (newUsername !== oldUsername ? currentPassword : "");

  if (passwordForProvision) {
    await provisionStudentAuth(updated, passwordForProvision);
  }

  const newLoginEmail = resolveStudentLoginEmail(newUsername);
  const appwriteUserId = await findAppwriteUserIdByEmail(oldLoginEmail);
  if (appwriteUserId) {
    const users = getAdminUsers();
    try {
      await users.updateName({ userId: appwriteUserId, name: updated.name });
      if (newLoginEmail !== oldLoginEmail) {
        await users.updateEmail({ userId: appwriteUserId, email: newLoginEmail });
      }
      if (newPassword) {
        await syncAppwriteUserPassword(appwriteUserId, newPassword);
      }
      await upsertUserDoc({
        appwriteUserId,
        role: "student",
        username: newUsername,
        coachId: updated.coachId,
        email: newLoginEmail,
        fullName: updated.name,
      });
    } catch (err) {
      throw translateAppwriteUserError(err);
    }
  }

  if (newPassword) {
    updated.panelSifre = newPassword;
  }

  await syncStudentInPlatformStore(updated);
  return studentToDto(updated);
}
