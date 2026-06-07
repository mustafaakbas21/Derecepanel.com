import { poolItemId, poolItemImage } from "@/lib/taramalar/pool-ensure";
import type { QuestionPoolItem } from "@/lib/test-maker/types";

export type PoolFilterNames = {
  dersName?: string;
  konuName?: string;
  kavramName?: string;
};

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function filterPool(pool: QuestionPoolItem[], filters: PoolFilterNames): QuestionPoolItem[] {
  return pool.filter((q) => {
    if (filters.dersName && q.ders !== filters.dersName) return false;
    if (filters.konuName && q.konu !== filters.konuName) return false;
    if (filters.kavramName && q.kavram !== filters.kavramName) return false;
    if (!poolItemImage(q)) return false;
    return true;
  });
}

/** ESKİ autoSelectQuestions */
export function autoSelectQuestions(
  count: number,
  pool: QuestionPoolItem[],
  filters: PoolFilterNames
): QuestionPoolItem[] {
  const filtered = filterPool(pool, filters);
  if (!filtered.length) return [];
  const seen = new Set<string>();
  const picked: QuestionPoolItem[] = [];
  for (const q of shuffle(filtered)) {
    const id = poolItemId(q);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    picked.push(q);
    if (picked.length >= count) break;
  }
  return picked;
}
