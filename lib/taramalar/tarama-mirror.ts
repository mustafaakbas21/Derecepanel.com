import { STORAGE_KEYS } from "@/lib/taramalar/constants";
import { dispatchTaramaAnalizChange, dispatchTaramaDepoChange } from "@/lib/taramalar/events";
import type { TaramaDataMirror, TaramaRecord } from "@/lib/taramalar/types";

import { panelGetItem, panelRemoveItem, panelSetItem } from "@/lib/panel-store";
function answerKeyFromQuestions(rec: TaramaRecord): string {
  return (rec.questions ?? [])
    .map((q) => {
      const a = String(q.answer ?? "")
        .trim()
        .toUpperCase();
      const m = a.match(/[A-E]/);
      return m ? m[0] : "";
    })
    .join("");
}

function mirrorPayload(rec: TaramaRecord): TaramaDataMirror {
  const questions = rec.questions ?? [];
  const savedIso = rec.updatedAt || rec.createdAt
    ? new Date(rec.updatedAt || rec.createdAt).toISOString()
    : new Date().toISOString();
  return {
    id: rec.id,
    depoId: rec.id,
    name: rec.name || "Tarama",
    soruSayisi: questions.length,
    cevapAnahtari: answerKeyFromQuestions(rec),
    savedAt: savedIso,
    matrixSnapshot: rec.matrixSnapshot ?? null,
  };
}

export function syncTaramaDataMirror(rec: TaramaRecord): void {
  if (typeof window === "undefined" || !rec?.id) return;
  const payload = mirrorPayload(rec);
  try {
    panelSetItem(`tarama_data_${rec.id}`, JSON.stringify(payload));
  } catch {
    /* quota */
  }
  const list = loadExportMetaSafe().filter((x) => x?.id !== rec.id);
  list.unshift({
    id: rec.id,
    name: payload.name,
    soruSayisi: payload.soruSayisi,
    savedAt: payload.savedAt,
  });
  try {
    panelSetItem(STORAGE_KEYS.exports, JSON.stringify(list.slice(0, 500)));
  } catch {
    /* quota */
  }
  dispatchTaramaAnalizChange();
}

export function purgeTaramaLsMirror(id: string): void {
  if (typeof window === "undefined" || !id) return;
  try {
    panelRemoveItem(`tarama_data_${id}`);
  } catch {
    /* ignore */
  }
  const list = loadExportMetaSafe().filter((x) => x?.id !== id);
  try {
    panelSetItem(STORAGE_KEYS.exports, JSON.stringify(list));
  } catch {
    /* ignore */
  }
  dispatchTaramaAnalizChange();
  dispatchTaramaDepoChange();
}

function loadExportMetaSafe() {
  try {
    const raw = panelGetItem(STORAGE_KEYS.exports);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function mirrorMissingToLs(items: TaramaRecord[]): void {
  if (typeof window === "undefined" || !items.length) return;
  const list = loadExportMetaSafe();
  const seen = new Set(list.map((x) => String(x?.id)));
  let exportsChanged = false;

  for (const rec of items) {
    if (!rec?.id) continue;
    try {
      if (panelGetItem(`tarama_data_${rec.id}`)) continue;
    } catch {
      continue;
    }
    const payload = mirrorPayload(rec);
    try {
      panelSetItem(`tarama_data_${rec.id}`, JSON.stringify(payload));
    } catch {
      /* quota */
    }
    if (!seen.has(String(rec.id))) {
      list.unshift({
        id: rec.id,
        name: payload.name,
        soruSayisi: payload.soruSayisi,
        savedAt: payload.savedAt,
      });
      seen.add(String(rec.id));
      exportsChanged = true;
    }
  }

  if (exportsChanged) {
    try {
      panelSetItem(STORAGE_KEYS.exports, JSON.stringify(list.slice(0, 500)));
    } catch {
      /* quota */
    }
    dispatchTaramaAnalizChange();
  }
}
