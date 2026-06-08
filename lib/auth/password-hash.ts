import "server-only";

import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;
const BCRYPT_PREFIX = /^\$2[aby]\$/;

export function isBcryptHash(value: string | null | undefined): boolean {
  return BCRYPT_PREFIX.test(String(value || "").trim());
}

/** Appwrite'a yazılacak panelSifre — düz metin ise hash'ler */
export function hashPanelPasswordForStorage(
  plainOrHash: string | null | undefined
): string {
  const value = String(plainOrHash || "").trim();
  if (!value) return "";
  if (isBcryptHash(value)) return value;
  return bcrypt.hashSync(value, BCRYPT_ROUNDS);
}

/** Giriş doğrulama — bcrypt veya geçiş dönemi düz metin */
export function verifyPanelPassword(
  plain: string,
  stored: string | null | undefined
): boolean {
  const password = plain.trim();
  const saved = String(stored || "").trim();
  if (!password || !saved) return false;
  if (isBcryptHash(saved)) {
    return bcrypt.compareSync(password, saved);
  }
  return password === saved;
}

/** provision / Appwrite Account için düz metin şifre */
export function readPlainPanelPassword(
  plainOrHash: string | null | undefined
): string | null {
  const value = String(plainOrHash || "").trim();
  if (!value || isBcryptHash(value)) return null;
  return value;
}
