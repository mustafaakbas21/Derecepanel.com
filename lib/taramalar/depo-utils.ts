import type { TaramaRecord } from "@/lib/taramalar/types";

export type DepoFilters = {
  q: string;
  ders: string;
  konu: string;
  days: string;
};

export function filterTaramaRecords(all: TaramaRecord[], filters: DepoFilters): TaramaRecord[] {
  const q = filters.q.trim().toLowerCase();
  const days = filters.days ? Number(filters.days) : 0;
  const cutoff = days > 0 ? Date.now() - days * 86400000 : 0;

  return all.filter((r) => {
    if (filters.ders && r.ders !== filters.ders) return false;
    if (filters.konu && r.konu !== filters.konu) return false;
    if (cutoff && (r.createdAt ?? 0) < cutoff) return false;
    if (!q) return true;
    const hay = [r.name, r.ders, r.konu, r.kurum, r.coverTitle]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function computeDepoStats(all: TaramaRecord[]) {
  const total = all.length;
  const totalQuestions = all.reduce((s, r) => s + (r.questions?.length ?? 0), 0);
  const dersCount: Record<string, number> = {};
  all.forEach((r) => {
    if (r.ders) dersCount[r.ders] = (dersCount[r.ders] ?? 0) + 1;
  });
  const topDers =
    Object.entries(dersCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const thisMonth = all.filter((r) => (r.createdAt ?? 0) >= monthStart.getTime()).length;
  return { total, totalQuestions, topDers, thisMonth };
}

export function fmtTaramaDate(ts?: number) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
