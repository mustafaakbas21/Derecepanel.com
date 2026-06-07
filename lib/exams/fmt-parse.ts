import type { FmtRecord } from "@/lib/exams/fmt-store";

function parseRange(v: string): [number, number | null] | null {
  const m = String(v || "")
    .replace(/\s+/g, "")
    .match(/^(\d+)(?:[-,](\d+)?)?$/);
  if (!m) return null;
  const s = parseInt(m[1], 10);
  const e = m[2] != null && m[2] !== "" ? parseInt(m[2], 10) : null;
  return [s, e];
}

/** Basit .fmt parser — KEY=VALUE satırları */
export function parseFmtText(text: string, fallbackName?: string): FmtRecord {
  const out: FmtRecord = {
    id: `fmt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    label: fallbackName || "Yüklenen FMT",
    vendor: "Özel",
    builtin: false,
    minLine: 30,
    no: [0, 11],
    nameRange: [11, 31],
    book: [31, 32],
    answers: [32, null],
  };

  String(text || "")
    .split(/\r?\n/)
    .forEach((ln) => {
      const m = ln.match(/^\s*([A-Z_]+)\s*[:=]\s*(.+?)\s*$/);
      if (!m) return;
      const k = m[1].toUpperCase();
      const v = m[2];
      if (k === "TITLE" || k === "BASLIK" || k === "SABLON" || k === "TEMPLATE_NAME" || k === "AD")
        out.label = v;
      else if (k === "VENDOR" || k === "YAYIN") out.vendor = v;
      else if (k === "MIN_LINE") out.minLine = parseInt(v, 10) || out.minLine;
      else if (k === "NO" || k === "OGRENCI_NO" || k === "TC") {
        const r = parseRange(v);
        if (r) out.no = r;
      }       else if (k === "NAME" || k === "NAME_RANGE" || k === "AD_SOYAD") {
        const r = parseRange(v);
        if (r) out.nameRange = r;
      } else if (k === "TABBED" || k === "TSV") {
        out.tabbed = /^(1|true|evet|yes)$/i.test(v.trim());
      } else if (k === "BOOK" || k === "KITAPCIK") {
        const r = parseRange(v);
        if (r) out.book = r;
      } else if (k === "ANSWERS" || k === "CEVAPLAR") {
        const r = parseRange(v);
        if (r) out.answers = r;
      }
    });

  return out;
}
