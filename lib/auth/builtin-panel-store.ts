import "server-only";

/** Geliştirme kurucu oturumu — Appwrite olmadan panel_data */
const byOwner = new Map<string, Map<string, string>>();

function ownerMap(ownerId: string): Map<string, string> {
  let map = byOwner.get(ownerId);
  if (!map) {
    map = new Map();
    byOwner.set(ownerId, map);
  }
  return map;
}

export function listBuiltinPanelData(ownerId: string): Record<string, string> {
  const map = byOwner.get(ownerId);
  if (!map) return {};
  return Object.fromEntries(map.entries());
}

export function setBuiltinPanelData(
  ownerId: string,
  dataKey: string,
  payload: string
): void {
  ownerMap(ownerId).set(dataKey, payload);
}

export function deleteBuiltinPanelData(ownerId: string, dataKey: string): void {
  byOwner.get(ownerId)?.delete(dataKey);
}
