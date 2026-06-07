import "server-only";

import {
  deleteBuiltinPanelData,
  listBuiltinPanelData,
  setBuiltinPanelData,
} from "@/lib/auth/builtin-panel-store";
import {
  deletePlatformFileData,
  getPlatformFileData,
  setPlatformFileData,
} from "@/lib/admin/platform-store-file";
import { isAppwriteServerConfigured } from "@/lib/appwrite/server";
import {
  getPanelDataEntry,
  setPanelDataEntry,
} from "@/lib/appwrite/panel-data-server";

/** Platform geneli panel-store anahtarları (bakım, teklif talepleri, kurumlar). */
export const PLATFORM_OWNER_ID = "__platform__";

export async function getPlatformData(key: string): Promise<string | null> {
  if (!isAppwriteServerConfigured()) {
    const fromFile = await getPlatformFileData(key);
    if (fromFile !== null) {
      setBuiltinPanelData(PLATFORM_OWNER_ID, key, fromFile);
      return fromFile;
    }
    const items = listBuiltinPanelData(PLATFORM_OWNER_ID);
    return items[key] ?? null;
  }
  try {
    return await getPanelDataEntry(PLATFORM_OWNER_ID, key);
  } catch {
    const fromFile = await getPlatformFileData(key);
    if (fromFile !== null) return fromFile;
    const items = listBuiltinPanelData(PLATFORM_OWNER_ID);
    return items[key] ?? null;
  }
}

export async function setPlatformData(key: string, payload: string): Promise<void> {
  if (!isAppwriteServerConfigured()) {
    await setPlatformFileData(key, payload);
    setBuiltinPanelData(PLATFORM_OWNER_ID, key, payload);
    return;
  }
  try {
    await setPanelDataEntry(PLATFORM_OWNER_ID, key, payload);
  } catch {
    await setPlatformFileData(key, payload);
    setBuiltinPanelData(PLATFORM_OWNER_ID, key, payload);
  }
}

export async function deletePlatformData(key: string): Promise<void> {
  if (!isAppwriteServerConfigured()) {
    await deletePlatformFileData(key);
    deleteBuiltinPanelData(PLATFORM_OWNER_ID, key);
    return;
  }
  try {
    await setPanelDataEntry(PLATFORM_OWNER_ID, key, "");
  } catch {
    await deletePlatformFileData(key);
    deleteBuiltinPanelData(PLATFORM_OWNER_ID, key);
  }
}
