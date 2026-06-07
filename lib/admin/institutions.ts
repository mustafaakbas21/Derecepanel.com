import { panelGetItem, panelSetItem } from "@/lib/panel-store";

export const INSTITUTIONS_KEY = "institutions_v1";

export type InstitutionStatus = "Aktif" | "Pasif";

export type Institution = {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  status: InstitutionStatus;
  createdAt: string;
};

function readList(): Institution[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = panelGetItem(INSTITUTIONS_KEY);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? (parsed as Institution[]) : [];
  } catch {
    return [];
  }
}

function writeList(list: Institution[]) {
  if (typeof window === "undefined") return;
  panelSetItem(INSTITUTIONS_KEY, JSON.stringify(list));
}

export function loadInstitutions(): Institution[] {
  return readList().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export type InstitutionDraft = {
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  status?: InstitutionStatus;
};

export function persistInstitution(
  draft: InstitutionDraft,
  existingId?: string
): Institution {
  const list = readList();
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
    writeList(list);
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
  list.push(created);
  writeList(list);
  return created;
}

export function deleteInstitution(id: string): void {
  writeList(readList().filter((i) => i.id !== id));
}
