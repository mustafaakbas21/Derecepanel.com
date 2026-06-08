import { INSTITUTIONS_KEY } from "@/lib/admin/institutions";
import { ACCOUNTING_KEY } from "@/lib/admin/accounting";
import { MAINTENANCE_KEY } from "@/lib/admin/maintenance";
import { REGISTRATION_REQUESTS_KEY } from "@/lib/admin/registration-requests";
import { COACHES_STORAGE_KEY } from "@/lib/auth/local-auth";
import {
  GLOBAL_ALIAS_KEY,
  GLOBAL_DENEMELER_KEY,
  GLOBAL_EXAMS_LIVE_KEY,
} from "@/lib/exams/constants";
import { CATALOG_KEY, STORAGE_KEY } from "@/lib/students/constants";

/** Kurucu paneli — Appwrite `panel_data` ownerId=`__platform__` anahtarları */
export const ADMIN_PLATFORM_KEYS = [
  COACHES_STORAGE_KEY,
  STORAGE_KEY,
  CATALOG_KEY,
  INSTITUTIONS_KEY,
  ACCOUNTING_KEY,
  REGISTRATION_REQUESTS_KEY,
  MAINTENANCE_KEY,
  GLOBAL_EXAMS_LIVE_KEY,
  GLOBAL_DENEMELER_KEY,
  GLOBAL_ALIAS_KEY,
] as const;

export type AdminPlatformKey = (typeof ADMIN_PLATFORM_KEYS)[number];

const PLATFORM_KEY_SET = new Set<string>(ADMIN_PLATFORM_KEYS);

export function isAdminPlatformKey(key: string): key is AdminPlatformKey {
  return PLATFORM_KEY_SET.has(key);
}

/** Global deneme anahtarları platform sahibiyle senkronlanır */
export function isGlobalExamPlatformKey(key: string): boolean {
  return (
    key === GLOBAL_EXAMS_LIVE_KEY ||
    key === GLOBAL_DENEMELER_KEY ||
    key === GLOBAL_ALIAS_KEY
  );
}
