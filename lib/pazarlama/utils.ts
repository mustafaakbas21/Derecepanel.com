export function escapeHtml(s: unknown): string {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) n = min;
  return Math.max(min, Math.min(max, n));
}

export function clampInt(n: unknown, min: number, max: number, fallback: number): number {
  let v = parseInt(String(n ?? ""), 10);
  if (!Number.isFinite(v)) v = fallback;
  return Math.max(min, Math.min(max, v));
}

export function formatTrDate(d: unknown): string {
  if (!d || String(d).length < 10) return String(d || "—");
  const p = String(d).split("-");
  if (p.length < 3) return String(d);
  return `${p[2]}.${p[1]}.${p[0]}`;
}

export function initials(name: unknown): string {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "DP";
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0].slice(0, 2) || parts[0][0]).toUpperCase();
}

export function parseYmdLocal(ymd: unknown): Date | null {
  const s = String(ymd || "").trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (![y, mo, d].every(Number.isFinite)) return null;
  const dt = new Date(y, mo - 1, d, 0, 0, 0, 0);
  return Number.isFinite(dt.getTime()) ? dt : null;
}

export function hexToRgbTriplet(hex: string): string | null {
  let h = String(hex || "").trim().replace("#", "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  if (h.length !== 6) return null;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if (![r, g, b].every(Number.isFinite)) return null;
  return `${r} ${g} ${b}`;
}

export function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    const v = raw ? JSON.parse(raw) : fallback;
    return v == null ? fallback : (v as T);
  } catch {
    return fallback;
  }
}
