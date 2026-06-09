import "server-only";

import { ID, Query } from "node-appwrite";

import {
  getPlatformData,
  setPlatformData,
} from "@/lib/admin/platform-store-server";
import {
  APPWRITE_COLLECTION_COACHES,
  APPWRITE_DATABASE_ID,
  normalizeLoginUsername,
  resolveCoachLoginEmail,
} from "@/lib/appwrite/config";
import { getAdminDatabases, isAppwriteServerConfigured } from "@/lib/appwrite/server";
import {
  BUILTIN_COACH,
  COACHES_STORAGE_KEY,
  type LocalCoachAccount,
} from "@/lib/auth/local-auth";

export type CoachSaveInput = {
  coachId: string;
  username: string;
  password: string;
  displayName: string;
  email: string;
  phone?: string;
  specialty?: string;
  status?: "Aktif" | "Pasif";
};

function normalizeCoach(raw: Record<string, unknown>): LocalCoachAccount | null {
  const username = String(raw.username || "").trim();
  const password = String(raw.password || "");
  if (!username || !password) return null;

  const coachId =
    String(raw.coachId || raw.id || "").trim() || crypto.randomUUID();

  return {
    id: String(raw.id || coachId).trim() || coachId,
    username,
    password,
    coachId,
    displayName: String(raw.displayName || raw.username || "").trim() || username,
    phone: String(raw.phone || "").trim() || undefined,
    specialty: String(raw.specialty || "").trim() || undefined,
    status: raw.status === "Pasif" ? "Pasif" : "Aktif",
    createdAt: String(raw.createdAt || "").trim() || undefined,
  };
}

function seedBuiltinCoachIfMissing(coaches: LocalCoachAccount[]): LocalCoachAccount[] {
  const hasBuiltin = coaches.some((c) => c.username === BUILTIN_COACH.username);
  if (hasBuiltin) return coaches;
  return [
    ...coaches,
    {
      id: BUILTIN_COACH.coachId,
      username: BUILTIN_COACH.username,
      password: BUILTIN_COACH.password,
      coachId: BUILTIN_COACH.coachId,
      displayName: BUILTIN_COACH.displayName,
      status: "Aktif",
    },
  ];
}

export async function loadPlatformCoaches(): Promise<LocalCoachAccount[]> {
  const raw = await getPlatformData(COACHES_STORAGE_KEY);
  if (!raw) return seedBuiltinCoachIfMissing([]);

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return seedBuiltinCoachIfMissing([]);
    const coaches = parsed
      .map((item) => normalizeCoach(item as Record<string, unknown>))
      .filter((c): c is LocalCoachAccount => c !== null);
    return seedBuiltinCoachIfMissing(coaches);
  } catch {
    return seedBuiltinCoachIfMissing([]);
  }
}

async function upsertCoachDocument(input: CoachSaveInput): Promise<void> {
  if (!isAppwriteServerConfigured()) return;

  const db = getAdminDatabases();
  const payload = {
    coachId: input.coachId,
    username: input.username,
    displayName: input.displayName,
    email: input.email,
    status: input.status ?? "Aktif",
    phone: input.phone ?? "",
    specialty: input.specialty ?? "",
  };

  try {
    const existing = await db.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTION_COACHES,
      [Query.equal("coachId", input.coachId), Query.limit(1)]
    );
    const doc = existing.documents[0];
    if (doc) {
      await db.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_COLLECTION_COACHES,
        doc.$id,
        payload
      );
      return;
    }

    await db.createDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTION_COACHES,
      ID.unique(),
      payload
    );
  } catch (err) {
    const msg = String((err as Error)?.message || "").toLowerCase();
    if (/collection.*not found|could not be found/i.test(msg)) return;
    if (/already exists|409|duplicate/i.test(msg)) {
      try {
        const doc = await db.getDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_COLLECTION_COACHES,
          input.coachId
        );
        await db.updateDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_COLLECTION_COACHES,
          doc.$id,
          payload
        );
        return;
      } catch {
        /* fall through */
      }
    }
    throw err;
  }
}

export async function saveCoachToPlatform(input: CoachSaveInput): Promise<LocalCoachAccount> {
  if (input.username === BUILTIN_COACH.username) {
    throw new Error("Bu kullanıcı adı sistem tarafından ayrılmış.");
  }

  const coaches = await loadPlatformCoaches();
  const duplicate = coaches.find(
    (c) => c.username === input.username && c.coachId !== input.coachId
  );
  if (duplicate) {
    throw new Error("Bu kullanıcı adı zaten kullanılıyor.");
  }

  const existing = coaches.find((c) => c.coachId === input.coachId);
  const record: LocalCoachAccount = {
    id: input.coachId,
    coachId: input.coachId,
    username: input.username,
    password: input.password,
    displayName: input.displayName,
    phone: input.phone,
    specialty: input.specialty,
    status: input.status ?? "Aktif",
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };

  const next = [...coaches.filter((c) => c.coachId !== input.coachId), record].sort((a, b) =>
    (a.displayName || a.username).localeCompare(b.displayName || b.username, "tr")
  );

  await setPlatformData(COACHES_STORAGE_KEY, JSON.stringify(next));

  try {
    await upsertCoachDocument(input);
  } catch (err) {
    console.error("[coaches] Appwrite coaches doc upsert failed:", err);
  }

  return record;
}

export async function findCoachByIdOnPlatform(coachId: string): Promise<LocalCoachAccount | null> {
  const coaches = await loadPlatformCoaches();
  return coaches.find((c) => c.coachId === coachId || c.id === coachId) ?? null;
}

export type CoachUpdateInput = {
  coachId: string;
  displayName: string;
  username: string;
  password?: string;
  phone?: string;
  specialty?: string;
  status?: "Aktif" | "Pasif";
};

export async function updateCoachOnPlatform(input: CoachUpdateInput): Promise<LocalCoachAccount> {
  const existing = await findCoachByIdOnPlatform(input.coachId);
  if (!existing) throw new Error("Koç bulunamadı.");

  const username = resolveCoachUsername(input.username);
  const email = resolveCoachLoginEmail(username);

  return saveCoachToPlatform({
    coachId: input.coachId,
    username,
    password: input.password?.trim() || existing.password,
    displayName: input.displayName.trim() || username,
    email,
    phone: input.phone,
    specialty: input.specialty,
    status: input.status,
  });
}

export async function deleteCoachFromPlatform(coachId: string): Promise<void> {
  if (coachId === BUILTIN_COACH.coachId) {
    throw new Error("Varsayılan koç hesabı silinemez.");
  }

  const coaches = await loadPlatformCoaches();
  const next = coaches.filter((c) => c.coachId !== coachId && c.id !== coachId);
  if (next.length === coaches.length) throw new Error("Koç bulunamadı.");

  await setPlatformData(COACHES_STORAGE_KEY, JSON.stringify(next));

  if (!isAppwriteServerConfigured()) return;

  try {
    const db = getAdminDatabases();
    const existing = await db.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTION_COACHES,
      [Query.equal("coachId", coachId), Query.limit(1)]
    );
    const doc = existing.documents[0];
    if (doc) {
      await db.deleteDocument(APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_COACHES, doc.$id);
    }
  } catch (err) {
    const msg = String((err as Error)?.message || "").toLowerCase();
    if (!/collection.*not found|could not be found/i.test(msg)) throw err;
  }
}

export function resolveCoachUsername(username: string): string {
  const normalized = normalizeLoginUsername(username);
  if (!normalized) {
    throw new Error("Geçerli bir kullanıcı adı girin (harf, rakam, nokta, tire).");
  }
  return normalized;
}

/** Koç panel girişi — roster şifresi ile eşleşen hesap */
export async function findCoachForLogin(
  username: string,
  password: string
): Promise<LocalCoachAccount | null> {
  const normalized = normalizeLoginUsername(username) || username.trim();
  const pw = password.trim();
  if (!normalized || !pw) return null;

  const coaches = await loadPlatformCoaches();
  return (
    coaches.find((coach) => {
      const coachUser = normalizeLoginUsername(coach.username) || coach.username.trim();
      return coachUser === normalized && coach.password === pw;
    }) ?? null
  );
}

/** Roster doğrulandıktan sonra Appwrite Auth + users kaydını tamamlar */
export async function completeCoachLogin(
  coach: LocalCoachAccount,
  plainPassword: string
): Promise<{ appwriteUserId: string; email: string; coachId: string }> {
  const password = plainPassword.trim();
  if (password.length < 8) {
    throw new Error("Şifre en az 8 karakter olmalı.");
  }

  const { provisionCoachWithAppwrite } = await import("@/lib/admin/provision-coach");
  const { findAppwriteUserIdByEmail } = await import("@/lib/appwrite/auth-users-server");

  const result = await provisionCoachWithAppwrite({
    username: coach.username,
    password,
    displayName: coach.displayName?.trim() || coach.username,
    coachId: coach.coachId,
  });

  const appwriteUserId =
    result.appwriteUserId ?? (await findAppwriteUserIdByEmail(result.email));
  if (!appwriteUserId) {
    throw new Error("Geçersiz kullanıcı adı veya şifre");
  }

  return { appwriteUserId, email: result.email, coachId: coach.coachId };
}
