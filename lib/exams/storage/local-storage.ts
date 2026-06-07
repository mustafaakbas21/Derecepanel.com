import { panelGetItem, panelSetItem } from "@/lib/panel-store";

export function readJsonArray<T>(key: string, altKey?: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    let raw = panelGetItem(key);
    if (!raw && altKey) raw = panelGetItem(altKey);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) ? (arr as T[]) : [];
  } catch {
    return [];
  }
}

export function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  panelSetItem(key, JSON.stringify(value));
}
