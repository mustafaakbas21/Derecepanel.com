import type { ExamTur, GlobalExam } from "@/lib/exams/types";

export const MONTHS_TR = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
] as const;

export const DAYS_TR = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] as const;

export type TurFilter = "all" | ExamTur;

export type GlobalCalendarFilters = {
  tur: TurFilter;
  ay: string;
  search: string;
  yayinevi: string;
};

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function isoDate(y: number, m: number, d: number): string {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

export function todayIso(ref = new Date()): string {
  return isoDate(ref.getFullYear(), ref.getMonth() + 1, ref.getDate());
}

export function parseIsoDate(s: string): Date {
  const p = s.split("-");
  return new Date(parseInt(p[0]!, 10), parseInt(p[1]!, 10) - 1, parseInt(p[2]!, 10));
}

export function formatTrDate(s: string): string {
  const d = parseIsoDate(s);
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
}

export function daysFromToday(isoDateStr: string, ref = new Date()): number {
  const t0 = parseIsoDate(todayIso(ref));
  const t = parseIsoDate(isoDateStr);
  const d0 = Date.UTC(t0.getFullYear(), t0.getMonth(), t0.getDate());
  const d1 = Date.UTC(t.getFullYear(), t.getMonth(), t.getDate());
  return Math.round((d1 - d0) / 86400000);
}

export function relativeDayLabel(n: number): string {
  if (n < 0) return `${Math.abs(n)} gün önce`;
  if (n === 0) return "Bugün";
  if (n === 1) return "Yarın";
  return `${n} gün sonra`;
}

export function passesTur(r: GlobalExam, tur: TurFilter): boolean {
  if (tur === "all") return true;
  return r.tur === tur || r.sinav === tur;
}

export function passesAy(r: GlobalExam, ay: string): boolean {
  if (!ay) return true;
  const d = parseIsoDate(r.tarih);
  const key = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
  return key === ay;
}

export function passesSearch(r: GlobalExam, search: string): boolean {
  if (!search) return true;
  return r.ad.toLowerCase().includes(search.toLowerCase());
}

export function passesYayinevi(r: GlobalExam, yayinevi: string): boolean {
  if (!yayinevi) return true;
  return (r.yayinevi || "") === yayinevi;
}

export function sortExamsByDateTime(rows: GlobalExam[]): GlobalExam[] {
  return [...rows].sort((a, b) => {
    const d = a.tarih.localeCompare(b.tarih);
    if (d !== 0) return d;
    return (a.saat || "").localeCompare(b.saat || "");
  });
}

/** Tablo: yalnızca bugün ve sonrası + filtreler */
export function buildTableList(
  exams: GlobalExam[],
  filters: GlobalCalendarFilters,
  ref = new Date()
): GlobalExam[] {
  const t0 = todayIso(ref);
  const list = exams.filter(
    (r) =>
      r.tarih >= t0 &&
      passesTur(r, filters.tur) &&
      passesAy(r, filters.ay) &&
      passesSearch(r, filters.search) &&
      passesYayinevi(r, filters.yayinevi)
  );
  return sortExamsByDateTime(list);
}

export function buildNearestFive(
  exams: GlobalExam[],
  tur: TurFilter,
  ref = new Date()
): GlobalExam[] {
  const t0 = todayIso(ref);
  return sortExamsByDateTime(
    exams.filter((r) => passesTur(r, tur) && r.tarih >= t0)
  ).slice(0, 5);
}

export function buildMonthOptions(exams: GlobalExam[]): { value: string; label: string }[] {
  const seen: Record<string, boolean> = {};
  const opts: { value: string; label: string }[] = [{ value: "", label: "Tüm aylar" }];
  exams.forEach((r) => {
    const d = parseIsoDate(r.tarih);
    const key = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
    if (seen[key]) return;
    seen[key] = true;
    opts.push({ value: key, label: `${MONTHS_TR[d.getMonth()]} ${d.getFullYear()}` });
  });
  return opts.sort((a, b) => a.value.localeCompare(b.value));
}

export function uniqueYayinevi(exams: GlobalExam[]): string[] {
  const seen: Record<string, boolean> = {};
  const out: string[] = [];
  exams.forEach((r) => {
    const p = r.yayinevi || "";
    if (p && !seen[p]) {
      seen[p] = true;
      out.push(p);
    }
  });
  return out.sort();
}

export function typesOnDate(
  exams: GlobalExam[],
  y: number,
  m: number,
  d: number,
  tur: TurFilter
): ExamTur[] {
  const key = isoDate(y, m, d);
  const seen: Record<string, boolean> = {};
  const types: ExamTur[] = [];
  exams.forEach((r) => {
    if (r.tarih !== key || !passesTur(r, tur)) return;
    const t = r.tur || r.sinav;
    if (!seen[t]) {
      seen[t] = true;
      types.push(t);
    }
  });
  const order: Record<string, number> = { TYT: 0, AYT: 1, YKS: 2, YDT: 3 };
  types.sort((a, b) => (order[a] ?? 9) - (order[b] ?? 9));
  return types;
}

export function paginate<T>(
  list: T[],
  page: number,
  pageSize: number
): { slice: T[]; totalPages: number; from: number; to: number } {
  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
  const p = Math.min(Math.max(1, page), totalPages);
  const from = (p - 1) * pageSize;
  const to = Math.min(from + pageSize, list.length);
  return { slice: list.slice(from, to), totalPages, from, to };
}

export function pageMetaText(
  from: number,
  to: number,
  total: number,
  page: number,
  totalPages: number
): string {
  if (total === 0) return "0 kayıt";
  return `${from + 1}–${to} / ${total} kayıt · Sayfa ${page} / ${totalPages}`;
}

export function dotClass(tur: string): string {
  if (tur === "TYT") return "dgt-dot dgt-dot--tyt";
  if (tur === "AYT") return "dgt-dot dgt-dot--ayt";
  if (tur === "YDT") return "dgt-dot dgt-dot--ydt";
  return "dgt-dot dgt-dot--yks";
}

export function badgeClass(tur: string): string {
  if (tur === "TYT") return "dgt-badge dgt-badge--tyt";
  if (tur === "AYT") return "dgt-badge dgt-badge--ayt";
  if (tur === "YDT") return "dgt-badge dgt-badge--ydt";
  return "dgt-badge dgt-badge--yks";
}
