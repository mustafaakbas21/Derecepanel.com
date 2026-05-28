import { normKey } from "@/lib/students/import/normalize";

export function looksLikeDetailedTemplate(headerKeys: string[]): boolean {
  const keys = new Set(headerKeys.map(normKey));

  const has = (k: string) => keys.has(k);

  if (has("tckimlik") && has("ad") && has("soyad")) return true;
  if (has("ogrencino")) return true;
  if (has("veliadsoyad") || has("veliyakinlik")) return true;
  if (has("hedefuniversitebolum")) return true;
  if (has("kayitpaketi") && has("ad")) return true;

  return false;
}

export function looksLikeSimpleTemplate(headerKeys: string[]): boolean {
  const keys = new Set(headerKeys.map(normKey));
  return keys.has("ad") && keys.has("soyad") && !looksLikeDetailedTemplate(headerKeys);
}
