import "server-only";

import { ADMIN_PLATFORM_KEYS } from "@/lib/admin/platform-keys";
import {
  getPlatformData,
  PLATFORM_OWNER_ID,
  setPlatformData,
} from "@/lib/admin/platform-store-server";
import { syncStudentsBatch } from "@/lib/appwrite/students-server";
import { isAppwriteServerConfigured } from "@/lib/appwrite/server";
import { saveBridgedPanelKey } from "@/lib/appwrite/collection-bridge";
import { isGlobalExamPlatformKey } from "@/lib/admin/platform-keys";
import { STORAGE_KEY } from "@/lib/students/constants";
import type { StudentRecord } from "@/lib/students/types";

export { PLATFORM_OWNER_ID };

export async function loadAdminPlatformPanelItems(): Promise<Record<string, string>> {
  const items: Record<string, string> = {};

  await Promise.all(
    ADMIN_PLATFORM_KEYS.map(async (key) => {
      try {
        const value = await getPlatformData(key);
        if (value) items[key] = value;
      } catch {
        /* tek anahtar hatası tüm hydrate'ı düşürmez */
      }
    })
  );

  return items;
}

export async function saveAdminPlatformPanelKey(key: string, value: string): Promise<void> {
  await setPlatformData(key, value);

  if (isGlobalExamPlatformKey(key) && isAppwriteServerConfigured()) {
    await saveBridgedPanelKey(PLATFORM_OWNER_ID, key, value);
  }

  if (key === STORAGE_KEY && value) {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        await syncStudentsBatch(parsed as StudentRecord[], { provisionAuth: true });
      }
    } catch {
      /* JSON hatası — panel verisi yine kaydedildi */
    }
  }
}
