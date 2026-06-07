import "server-only";

import { MAINTENANCE_KEY } from "@/lib/admin/maintenance";
import { getPlatformData } from "@/lib/admin/platform-store-server";

export async function isMaintenanceModeServer(): Promise<boolean> {
  const raw = await getPlatformData(MAINTENANCE_KEY);
  return raw === "true";
}
