import "server-only";

import { ID, Query } from "node-appwrite";

import {
  isAppwriteAuthEmail,
  normalizeLoginUsername,
  resolveCoachLoginEmail,
} from "@/lib/appwrite/config";
import { getAdminUsers } from "@/lib/appwrite/server";

export function resolveAuthEmailFromUsername(usernameOrEmail: string): string {
  const normalizedUsername = normalizeLoginUsername(usernameOrEmail);
  const source = normalizedUsername || usernameOrEmail.trim();
  const email = resolveCoachLoginEmail(source);
  if (!email || !isAppwriteAuthEmail(email)) {
    throw new Error(
      "Geçersiz kullanıcı adı. Sadece harf, rakam, nokta, tire ve alt çizgi kullanın."
    );
  }
  return email;
}

export async function syncAppwriteUserPassword(userId: string, password: string): Promise<void> {
  const pw = password.trim();
  if (pw.length < 8) {
    throw new Error("Şifre en az 8 karakter olmalı.");
  }
  try {
    await getAdminUsers().updatePassword({ userId, password: pw });
  } catch (err) {
    throw translateAppwriteUserError(err);
  }
}

export function translateAppwriteUserError(err: unknown): Error {
  const msg = String((err as Error)?.message || err || "");
  if (/invalid.*email/i.test(msg)) {
    return new Error(
      "Geçersiz giriş e-postası. Kullanıcı adında Türkçe karakter varsa otomatik dönüştürülür; yalnızca harf, rakam, nokta, tire kullanın."
    );
  }
  if (/password.*short|password.*least|password.*invalid/i.test(msg)) {
    return new Error("Şifre en az 8 karakter olmalı.");
  }
  if (/already exists|409|duplicate/i.test(msg)) {
    return new Error(
      "Bu kullanıcı adı veya e-posta zaten kayıtlı. Mevcut hesabı güncellemeyi deneyin."
    );
  }
  return err instanceof Error ? err : new Error(msg || "Appwrite kullanıcısı oluşturulamadı.");
}

export async function findAppwriteUserIdByEmail(email: string): Promise<string | null> {
  try {
    const page = await getAdminUsers().list([Query.equal("email", email), Query.limit(1)]);
    return page.users[0]?.$id ?? null;
  } catch {
    return null;
  }
}

export async function createAppwriteAuthUser(params: {
  email: string;
  password: string;
  name: string;
}): Promise<string> {
  const raw = params.email.trim();
  const email = resolveCoachLoginEmail(raw) || resolveAuthEmailFromUsername(raw);
  if (!isAppwriteAuthEmail(email)) {
    throw new Error(
      "Geçersiz giriş e-postası. Kullanıcı adında Türkçe karakter varsa otomatik dönüştürülür."
    );
  }

  const name = params.name.trim() || email.split("@")[0] || "Kullanici";

  try {
    const created = await getAdminUsers().create({
      userId: ID.unique(),
      email,
      password: params.password,
      name,
    });
    const userId = String(created.$id || "").trim();
    if (!userId) throw new Error("Appwrite kullanıcı kimliği dönmedi.");
    return userId;
  } catch (err) {
    const msg = String((err as Error)?.message || "").toLowerCase();
    if (/already exists|409|duplicate|user_already/i.test(msg)) {
      const existing = await findAppwriteUserIdByEmail(email);
      if (existing) return existing;
    }
    throw translateAppwriteUserError(err);
  }
}

export async function ensureAppwriteAuthUser(params: {
  usernameOrEmail: string;
  password: string;
  displayName?: string;
  /** Mevcut Appwrite hesabının şifresini panel şifresiyle eşitle */
  syncPassword?: boolean;
}): Promise<{ userId: string; email: string }> {
  const email = resolveAuthEmailFromUsername(params.usernameOrEmail);
  let userId = await findAppwriteUserIdByEmail(email);
  if (!userId) {
    userId = await createAppwriteAuthUser({
      email,
      password: params.password,
      name: params.displayName?.trim() || params.usernameOrEmail.trim() || email.split("@")[0]!,
    });
  } else if (params.syncPassword) {
    await syncAppwriteUserPassword(userId, params.password);
  }
  return { userId, email };
}
