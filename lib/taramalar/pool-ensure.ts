import {
  createPoolUuid,
  ensureQuestionPoolInit,
  persistQuestionPool,
} from "@/lib/test-maker/question-pool";
import type { QuestionPoolItem } from "@/lib/test-maker/types";

/** ESKİ tarama-olusturucu loadAndEnsureIds */
export async function loadAndEnsurePoolIds(): Promise<QuestionPoolItem[]> {
  const pool = await ensureQuestionPoolInit();
  let mutated = false;
  const next = pool.map((q) => {
    if (!q.uuid && !(q as QuestionPoolItem & { id?: string }).id) {
      const nid = createPoolUuid();
      mutated = true;
      return { ...q, uuid: nid };
    }
    if (!q.uuid) {
      mutated = true;
      return { ...q, uuid: (q as QuestionPoolItem & { id?: string }).id! };
    }
    return q;
  });
  if (mutated) await persistQuestionPool(next);
  return next;
}

/** @deprecated sync — ensureQuestionPoolInit kullanın */
export function loadAndEnsurePoolIdsSync(): QuestionPoolItem[] {
  return [];
}

export function poolItemId(q: QuestionPoolItem): string {
  return q.uuid || (q as QuestionPoolItem & { id?: string }).id || "";
}

export function poolItemImage(q: QuestionPoolItem): string {
  return q.dataUrl || "";
}
