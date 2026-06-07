const MONTHS_SHORT = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
] as const;

export const WEEK_DAY_LABELS = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
] as const;

export const WEEK_DAY_SHORT = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] as const;

export function mondayOf(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

export function addDays(base: Date, n: number): Date {
  const x = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 12, 0, 0, 0);
  x.setDate(x.getDate() + n);
  return x;
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatWeekRangeTurkish(weekMonday: Date): string {
  const sun = addDays(weekMonday, 6);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const start = weekMonday.toLocaleDateString("tr-TR", opts);
  const end = sun.toLocaleDateString("tr-TR", { ...opts, year: "numeric" });
  return `${start} – ${end}`;
}

export function dayDateForIndex(weekMonday: Date, index: number): Date {
  return addDays(weekMonday, index);
}

export function formatDayHead(weekMonday: Date, index: number): string {
  const d = dayDateForIndex(weekMonday, index);
  return `${WEEK_DAY_SHORT[index]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

export function todayDayIndex(): number {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

export function parseISODate(iso: string): Date | null {
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function weekEndISO(weekMondayISO: string): string {
  const mon = parseISODate(weekMondayISO);
  if (!mon) return weekMondayISO;
  return toISODate(addDays(mon, 6));
}

/** Hafta aralığı [fromISO, toISO] ile kesişiyor mu */
export function weekOverlapsDateRange(
  weekMondayISO: string,
  fromISO: string,
  toISO: string
): boolean {
  if (!fromISO && !toISO) return true;
  const weekStart = parseISODate(weekMondayISO);
  if (!weekStart) return true;
  const weekEnd = addDays(weekStart, 6);

  const from = fromISO ? parseISODate(fromISO) : null;
  const to = toISO ? parseISODate(toISO) : null;

  const rangeStart = from ?? new Date(-8640000000000000);
  const rangeEnd = to ?? new Date(8640000000000000);

  return weekStart.getTime() <= rangeEnd.getTime() && weekEnd.getTime() >= rangeStart.getTime();
}

export function monthGroupKey(weekMondayISO: string): string {
  const d = parseISODate(weekMondayISO);
  if (!d) return weekMondayISO.slice(0, 7);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthGroupLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  if (!y || !m) return key;
  const d = new Date(y, m - 1, 1, 12, 0, 0, 0);
  return d.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
}
