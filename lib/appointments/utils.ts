import { DAY_LONG, MONTH_SHORT_TR } from "@/lib/appointments/constants";
import type {
  Appointment,
  AppointmentStatus,
  AppointmentTip,
  CurrentUser,
  StatusFilterKey,
  TypeFilterKey,
} from "@/lib/appointments/types";
import type { StudentRecord } from "@/lib/students/types";

export function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

export function slugFromName(name: string) {
  const n = String(name || "")
    .trim()
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return n || "ogrenci";
}

export function normName(s: string) {
  return String(s || "")
    .trim()
    .toLocaleLowerCase("tr")
    .replace(/\s+/g, " ");
}

export function stableStudentIdFromRecord(p: {
  ogrenciId?: string;
  studentCode?: string;
  code?: string;
  name?: string;
}) {
  const oid = String(p.ogrenciId || "").trim();
  if (oid) return oid;
  const code = String(p.studentCode || p.code || "").trim();
  if (code) {
    return code
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9ğüşıöç\-_.]/gi, "");
  }
  return slugFromName(p.name || "");
}

export function stableStudentIdFromStudentRecord(s: StudentRecord) {
  return stableStudentIdFromRecord({
    ogrenciId: s.ogrenciId,
    studentCode: s.studentCode,
    name: s.name,
  });
}

export function normalizeAppointment(r: Appointment): Appointment {
  const st = String(r.status || "").trim() as AppointmentStatus;
  const status: AppointmentStatus =
    st === "tamamlandi" || st === "iptal" || st === "bekliyor" ? st : "bekliyor";
  return { ...r, status };
}

export function parseSaatParts(saat: string) {
  const tt = String(saat || "00:00").trim().split(":");
  return {
    h: parseInt(tt[0] ?? "0", 10) || 0,
    m: parseInt(tt[1] ?? "0", 10) || 0,
  };
}

export function computeTsFromDateTime(tarih: string, saat: string) {
  const p = String(tarih || "").split("-").map(Number);
  if (p.length < 3 || Number.isNaN(p[0]) || Number.isNaN(p[1]) || Number.isNaN(p[2])) {
    return Date.now();
  }
  const { h, m } = parseSaatParts(saat);
  return new Date(p[0]!, p[1]! - 1, p[2]!, h, m, 0, 0).getTime();
}

export function appointmentTs(r: Appointment) {
  if (typeof r.ts === "number" && !Number.isNaN(r.ts) && r.ts > 0) return r.ts;

  const tarih = String(r.tarih || "").trim();
  const { h, m } = parseSaatParts(r.saat);
  let y: number;
  let mo: number;
  let d: number;

  if (/^\d{4}-\d{2}-\d{2}$/.test(tarih)) {
    const p = tarih.split("-").map(Number);
    y = p[0]!;
    mo = p[1]!;
    d = p[2]!;
  } else if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(tarih)) {
    const p2 = tarih.split(".").map(Number);
    d = p2[0]!;
    mo = p2[1]!;
    y = p2[2]!;
  } else {
    return NaN;
  }

  if (Number.isNaN(y) || Number.isNaN(mo) || Number.isNaN(d)) return NaN;
  return new Date(y, mo - 1, d, h, m, 0, 0).getTime();
}

export function formatTrShortDate(iso: string) {
  const p = String(iso || "").split("-").map(Number);
  if (p.length < 3 || Number.isNaN(p[1])) return iso || "—";
  return `${p[2]} ${MONTH_SHORT_TR[(p[1] ?? 1) - 1]} ${p[0]}`;
}

export function formatDdMmFromIso(iso: string) {
  const p = String(iso || "").split("-").map(Number);
  if (p.length < 3 || Number.isNaN(p[2])) return "—";
  return `${pad2(p[2]!)}.${pad2(p[1]!)}`;
}

export function weekStartMonday(ref: Date) {
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function weekBounds(ref = new Date()) {
  const start = weekStartMonday(ref);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start: start.getTime(), end: end.getTime(), startDate: start };
}

export function mondayFirstIndex(d: Date) {
  const wd = d.getDay();
  return wd === 0 ? 6 : wd - 1;
}

export function computeWeekCounts(list: Appointment[], ref = new Date()) {
  const w = weekBounds(ref);
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const r of list) {
    if (r.status === "iptal") continue;
    const ts = appointmentTs(r);
    if (typeof ts !== "number" || ts < w.start || ts >= w.end) continue;
    const idx = mondayFirstIndex(new Date(ts));
    counts[idx]! += 1;
  }
  return { counts, bounds: w };
}

export function weekRangeLabel(bounds: ReturnType<typeof weekBounds>) {
  const a = new Date(bounds.start);
  const b = new Date(bounds.end - 86400000);
  return `${pad2(a.getDate())} ${MONTH_SHORT_TR[a.getMonth()]} – ${pad2(b.getDate())} ${MONTH_SHORT_TR[b.getMonth()]} ${b.getFullYear()}`;
}

export function weekMetrics(list: Appointment[], ref = new Date()) {
  const { counts, bounds } = computeWeekCounts(list, ref);
  const total = counts.reduce((a, b) => a + b, 0);
  let peakIdx = 0;
  let peakVal = -1;
  counts.forEach((c, i) => {
    if (c > peakVal) {
      peakVal = c;
      peakIdx = i;
    }
  });
  return {
    counts,
    bounds,
    total,
    peakDay: total === 0 || peakVal === 0 ? null : DAY_LONG[peakIdx] ?? null,
    peakCount: peakVal <= 0 ? 0 : peakVal,
    rangeLabel: weekRangeLabel(bounds),
  };
}

export function isPastTs(ts: number, now = new Date()) {
  return ts < now.getTime();
}

export function getEffectiveStatus(r: Appointment, now = new Date()): AppointmentStatus {
  let raw = r.status;
  if (raw !== "bekliyor" && raw !== "tamamlandi" && raw !== "iptal") raw = "bekliyor";
  if (raw === "bekliyor" && isPastTs(appointmentTs(r), now)) return "tamamlandi";
  return raw;
}

export function getStatusBadgeText(r: Appointment, now = new Date()) {
  const raw = r.status;
  const eff = getEffectiveStatus(r, now);
  if (eff === "tamamlandi" && raw === "bekliyor" && isPastTs(appointmentTs(r), now)) {
    return "Geçmiş";
  }
  if (eff === "tamamlandi") return "Tamamlandı";
  if (eff === "iptal") return "İptal";
  return "Bekliyor";
}

export function tipLabel(tip: AppointmentTip) {
  if (tip === "online") return "Online";
  if (tip === "telefon") return "Telefon";
  return "Yüz yüze";
}

export function initials(name: string) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function hueFromName(name: string) {
  let h = 0;
  const s = String(name || "");
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

export function avatarStyle(name: string) {
  const hue = hueFromName(name);
  return {
    background: `hsl(${hue} 42% 92%)`,
    color: `hsl(${hue} 48% 32%)`,
  };
}

export function normalizeTrGsmForWa(raw: string) {
  let d = String(raw || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("0")) d = "90" + d.slice(1);
  if (d.length === 10 && d.startsWith("5")) d = "90" + d;
  return d;
}

export function pickStudentPhone(p: {
  phone?: string;
  telefon?: string;
  gsm?: string;
  parentPhone?: string;
}) {
  const candidates = [p.phone, p.telefon, p.gsm, p.parentPhone];
  for (const c of candidates) {
    const n = normalizeTrGsmForWa(c || "");
    if (n) return n;
  }
  return "";
}

export function buildWhatsAppUrl(phoneDigits: string, message?: string) {
  let tel = String(phoneDigits || "").replace(/\D/g, "");
  if (!tel) tel = "905000000000";
  let url = `https://wa.me/${tel}`;
  if (message?.trim()) url += `?text=${encodeURIComponent(message)}`;
  return url;
}

export function openWhatsApp(phoneDigits: string, message?: string) {
  const url = buildWhatsAppUrl(phoneDigits, message);
  const w = window.open(url, "_blank", "noopener,noreferrer");
  return Boolean(w);
}

export function applyStatusFilter(list: Appointment[], key: StatusFilterKey, now = new Date()) {
  if (key === "all") return [...list];
  if (key === "upcoming") {
    return list.filter(
      (r) =>
        getEffectiveStatus(r, now) === "bekliyor" &&
        typeof appointmentTs(r) === "number" &&
        appointmentTs(r) >= now.getTime()
    );
  }
  if (key === "done") {
    return list.filter((r) => getEffectiveStatus(r, now) === "tamamlandi");
  }
  if (key === "cancelled") {
    return list.filter((r) => getEffectiveStatus(r, now) === "iptal");
  }
  return [...list];
}

export function applyTypeFilter(list: Appointment[], key: TypeFilterKey) {
  if (!key || key === "all") return [...list];
  if (key === "yuz_yuze") return list.filter((r) => r.tip === "yuz_yuze");
  if (key === "online") {
    return list.filter((r) => r.tip === "online" || r.tip === "telefon");
  }
  return [...list];
}

export function applySearchFilter(list: Appointment[], q: string) {
  const t = String(q || "")
    .trim()
    .toLocaleLowerCase("tr-TR");
  if (!t) return [...list];
  return list.filter((r) =>
    String(r.ogrenci || "")
      .toLocaleLowerCase("tr-TR")
      .includes(t)
  );
}

export function sortByTsAsc(list: Appointment[]) {
  return [...list].sort((a, b) => appointmentTs(a) - appointmentTs(b));
}

export function isZoomableUrl(yer: string) {
  const u = String(yer || "").trim();
  return /^https?:\/\//i.test(u);
}

export function studentMatchIds(u: CurrentUser, catalogId = "") {
  const out: string[] = [];
  const seen = new Set<string>();
  const add = (x: string) => {
    const v = String(x || "").trim();
    if (!v || seen.has(v)) return;
    seen.add(v);
    out.push(v);
  };
  if (!u) return out;
  add(u.id ?? "");
  add(u.ogrenciId ?? "");
  add(u.studentCode ?? "");
  add(u.code ?? "");
  add(u.kullaniciAdi ?? "");
  add(catalogId);
  const code = String(u.studentCode || u.code || "").trim();
  if (code) {
    add(
      code
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9ğüşıöç\-_.]/gi, "")
    );
  }
  add(slugFromName(u.name ?? ""));
  return out;
}

export function belongsToStudent(
  r: Appointment,
  matchIds: string[],
  myNameNorm: string
) {
  const sid = String(r.studentId || "").trim();
  if (sid && matchIds.includes(sid)) return true;
  return normName(r.ogrenci) === myNameNorm && Boolean(myNameNorm);
}

export function countUpcoming(list: Appointment[], now = new Date()) {
  return applyStatusFilter(list, "upcoming", now).length;
}

export function defaultFormValues(): import("@/lib/appointments/types").AppointmentFormValues {
  const d = new Date();
  d.setMinutes(0);
  d.setSeconds(0);
  d.setMilliseconds(0);
  d.setHours(d.getHours() + 1);
  return {
    studentId: "",
    tarih: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`,
    saat: `${pad2(d.getHours())}:${pad2(d.getMinutes())}`,
    sure: 45,
    tip: "online",
    status: "bekliyor",
    konu: "",
    notlar: "",
    yer: "",
    notifyStudent: true,
  };
}
