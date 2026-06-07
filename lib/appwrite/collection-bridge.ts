import "server-only";

import {
  APPWRITE_COLLECTION_APPOINTMENTS,
  APPWRITE_COLLECTION_EXAMS,
  APPWRITE_COLLECTION_EXAM_RESULTS,
  APPWRITE_COLLECTION_GLOBAL_DENEMELER,
} from "@/lib/appwrite/config";
import {
  getGenericDocPayload,
  listGenericDocPayloads,
  upsertGenericDoc,
} from "@/lib/appwrite/generic-doc-server";
import { isAppwriteServerConfigured } from "@/lib/appwrite/server";

/** panel-store anahtarı → Appwrite koleksiyonu (birincil okuma/yazma) */
export const PANEL_KEY_TO_COLLECTION: Record<string, string> = {
  kurum_denemeler_v1: APPWRITE_COLLECTION_EXAMS,
  kurumsalExams: APPWRITE_COLLECTION_EXAMS,
  global_exams_live: APPWRITE_COLLECTION_GLOBAL_DENEMELER,
  global_denemeler_v1: APPWRITE_COLLECTION_GLOBAL_DENEMELER,
  globalExams: APPWRITE_COLLECTION_GLOBAL_DENEMELER,
  examResults: APPWRITE_COLLECTION_EXAM_RESULTS,
  derece_exam_results_v1: APPWRITE_COLLECTION_EXAM_RESULTS,
  appointments: APPWRITE_COLLECTION_APPOINTMENTS,
};

export function isBridgedPanelKey(key: string): boolean {
  return key in PANEL_KEY_TO_COLLECTION;
}

export async function loadBridgedPanelKeys(
  ownerId: string
): Promise<Record<string, string>> {
  if (!isAppwriteServerConfigured()) return {};

  const out: Record<string, string> = {};

  for (const [key, collectionId] of Object.entries(PANEL_KEY_TO_COLLECTION)) {
    const payload = await getGenericDocPayload(collectionId, ownerId, key);
    if (payload) out[key] = payload;
  }

  return out;
}

export async function saveBridgedPanelKey(
  ownerId: string,
  key: string,
  value: string
): Promise<void> {
  const collectionId = PANEL_KEY_TO_COLLECTION[key];
  if (!collectionId || !isAppwriteServerConfigured()) return;

  await upsertGenericDoc(collectionId, {
    coachId: ownerId,
    ownerId,
    entityId: key,
    payload: value,
  });
}

export async function parseExamResultsForCoach(
  coachId: string
): Promise<Array<Record<string, unknown>>> {
  const payloads = await listGenericDocPayloads(
    APPWRITE_COLLECTION_EXAM_RESULTS,
    coachId,
    50
  );

  const rows: Array<Record<string, unknown>> = [];
  for (const item of payloads) {
    if (item.entityId === "examResults" || item.entityId === "derece_exam_results_v1") {
      try {
        const parsed = JSON.parse(item.payload) as unknown;
        if (Array.isArray(parsed)) {
          for (const row of parsed) {
            if (row && typeof row === "object") rows.push(row as Record<string, unknown>);
          }
        }
      } catch {
        /* ignore */
      }
    }
  }
  return rows;
}
