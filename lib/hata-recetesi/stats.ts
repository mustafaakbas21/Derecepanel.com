import type { RecipeArchiveRecord } from "@/lib/hata-recetesi/types";

export type ReceteDeposuStats = {
  totalRecipes: number;
  totalQuestions: number;
  topDers: string;
  thisMonth: number;
};

export function computeReceteDeposuStats(items: RecipeArchiveRecord[]): ReceteDeposuStats {
  let totalQuestions = 0;
  const byDers: Record<string, number> = {};
  let thisMonth = 0;
  const now = new Date();

  for (const r of items) {
    const qc = r.questions?.length ?? r.questionCount ?? 0;
    totalQuestions += qc;
    const d = (r.ders || "Genel").trim() || "Genel";
    byDers[d] = (byDers[d] || 0) + 1;
    if (r.createdAt) {
      const dt = new Date(r.createdAt);
      if (dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth()) {
        thisMonth++;
      }
    }
  }

  let topDers = "—";
  let topCount = 0;
  for (const [k, v] of Object.entries(byDers)) {
    if (v > topCount) {
      topCount = v;
      topDers = k;
    }
  }

  return {
    totalRecipes: items.length,
    totalQuestions,
    topDers: items.length ? topDers : "—",
    thisMonth,
  };
}

export function filterReceteArchive(
  items: RecipeArchiveRecord[],
  filters: { q?: string; ders?: string; konu?: string; days?: number }
): RecipeArchiveRecord[] {
  const needle = filters.q?.trim().toLowerCase() || "";
  const since = filters.days ? Date.now() - filters.days * 86400000 : 0;

  return items.filter((r) => {
    if (filters.ders && (r.ders || "") !== filters.ders) return false;
    if (filters.konu && (r.konu || "") !== filters.konu) return false;
    if (since && (r.createdAt || 0) < since) return false;
    if (needle) {
      const hay = [
        r.name,
        r.konu,
        r.kurum,
        r.ders,
        r.coverTitle,
        r.studentCanonical,
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });
}
