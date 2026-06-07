import type { StudentRosterEntry } from "@/lib/appointments/types";
import { stableStudentIdFromRecord } from "@/lib/appointments/utils";
import { CATALOG_KEY, STORAGE_KEY } from "@/lib/students/constants";
import type { StudentRecord } from "@/lib/students/types";

import { panelGetItem, panelRemoveItem, panelSetItem } from "@/lib/panel-store";
function toRoster(s: StudentRecord): StudentRosterEntry {
  return {
    id: stableStudentIdFromRecord({
      ogrenciId: s.ogrenciId,
      studentCode: s.studentCode,
      name: s.name,
    }),
    name: s.name,
    studentCode: s.studentCode,
    ogrenciId: s.ogrenciId,
    phone: s.phone,
    parentPhone: s.parentPhone,
    kullaniciAdi: s.kullaniciAdi,
    sinifBranch: s.sinifBranch,
  };
}

function parseArray(raw: string | null): unknown[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/** ESKİ: DereceStudentCatalog + students + derecepanel_students_full_v1 */
export function readStudentRoster(): StudentRosterEntry[] {
  if (typeof window === "undefined") return [];

  const out: StudentRosterEntry[] = [];
  const seen = new Set<string>();

  const pushUnique = (entry: StudentRosterEntry | null) => {
    if (!entry?.id || seen.has(entry.id)) return;
    seen.add(entry.id);
    out.push(entry);
  };

  const w = window as Window & { DereceStudentCatalog?: StudentRecord[] };
  try {
    (w.DereceStudentCatalog ?? []).forEach((p) => {
      if (p?.name) pushUnique(toRoster(p));
    });
  } catch {
    /* ignore */
  }

  const keys = ["students", STORAGE_KEY, "derecepanel_students_full_v1", CATALOG_KEY];
  for (const key of keys) {
    const arr = parseArray(panelGetItem(key));
    for (const item of arr) {
      const rec = item as StudentRecord;
      if (rec?.name) pushUnique(toRoster(rec));
    }
  }

  return out.sort((a, b) => a.name.localeCompare(b.name, "tr"));
}

export function findRosterStudent(
  roster: StudentRosterEntry[],
  studentId: string
): StudentRosterEntry | undefined {
  return roster.find((s) => s.id === studentId);
}
