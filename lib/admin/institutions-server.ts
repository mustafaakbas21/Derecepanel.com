import "server-only";

import {
  INSTITUTIONS_KEY,
  type Institution,
  type InstitutionDraft,
} from "@/lib/admin/institutions";
import { getPlatformData, setPlatformData } from "@/lib/admin/platform-store-server";

function parseInstitutions(raw: string | null): Institution[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return (parsed as Institution[]).filter((i) => i?.id && i?.name);
  } catch {
    return [];
  }
}

async function saveInstitutions(items: Institution[]): Promise<void> {
  await setPlatformData(INSTITUTIONS_KEY, JSON.stringify(items));
}

export async function listInstitutions(): Promise<Institution[]> {
  const raw = await getPlatformData(INSTITUTIONS_KEY);
  return parseInstitutions(raw).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function upsertInstitution(
  draft: InstitutionDraft,
  existingId?: string
): Promise<Institution> {
  const list = await listInstitutions();
  const name = draft.name.trim();
  if (!name) throw new Error("Kurum adı zorunlu.");

  if (existingId) {
    const idx = list.findIndex((i) => i.id === existingId);
    if (idx === -1) throw new Error("Kurum bulunamadı.");
    const prev = list[idx]!;
    const updated: Institution = {
      ...prev,
      name,
      contactName: draft.contactName?.trim() || undefined,
      phone: draft.phone?.trim() || undefined,
      email: draft.email?.trim() || undefined,
      status: draft.status ?? prev.status,
    };
    list[idx] = updated;
    await saveInstitutions(list);
    return updated;
  }

  const created: Institution = {
    id: `inst-${crypto.randomUUID()}`,
    name,
    contactName: draft.contactName?.trim() || undefined,
    phone: draft.phone?.trim() || undefined,
    email: draft.email?.trim() || undefined,
    status: draft.status ?? "Aktif",
    createdAt: new Date().toISOString(),
  };
  list.unshift(created);
  await saveInstitutions(list);
  return created;
}

export async function deleteInstitutionById(id: string): Promise<boolean> {
  const list = await listInstitutions();
  const next = list.filter((i) => i.id !== id);
  if (next.length === list.length) return false;
  await saveInstitutions(next);
  return true;
}
