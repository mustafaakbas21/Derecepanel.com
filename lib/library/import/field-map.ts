import { BOOK_KIND_LABELS, STYLE_OPTIONS } from "@/lib/library/constants";
import type { BookKind } from "@/lib/library/types";
import { getSubjects, getTopics } from "@/lib/mufredat";
import { normKey } from "@/lib/students/import/normalize";

export function canonicalizeBookRow(raw: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [header, value] of Object.entries(raw)) {
    const key = normKey(header);
    let field =
      {
        kitapadi: "title",
        baslik: "title",
        ad: "title",
        yayinevi: "publisher",
        tur: "kind",
        kitapturu: "kind",
        tip: "kind",
        ders: "subject",
        konular: "topics",
        konu: "topics",
        yayinyili: "publishYear",
        baskiyili: "publishYear",
        tahminisoru: "estQuestions",
        tahminisorusayisi: "estQuestions",
        sorusayisi: "estQuestions",
        zorluk: "difficulty",
        zorlukduzeyi: "difficulty",
        videodesteği: "hasVideo",
        video: "hasVideo",
        stil: "style",
      }[key] ?? "";
    if (!field && key.startsWith("zorluk")) field = "difficulty";
    if (!field && key.startsWith("tahmini")) field = "estQuestions";
    if (field) out[field] = String(value ?? "").trim();
  }
  return out;
}

export function isExampleBookRow(title: string, publisher: string): boolean {
  const t = title.trim().toLocaleLowerCase("tr-TR");
  const p = publisher.trim().toLocaleLowerCase("tr-TR");
  return t === "örnek kitap" || (t.includes("örnek") && p.includes("örnek"));
}

export function mapBookKind(raw: string): BookKind | null {
  const k = normKey(raw);
  if (!k) return null;
  if (k.includes("soru") || k === "sorubankasi") return "soru-bankasi";
  if (k.includes("konu") || k === "konuanlatim") return "konu-anlatim";
  if (k.includes("deneme")) return "deneme";
  if (k.includes("fasikul") || k.includes("fasikül")) return "fasikul";
  const byId = (Object.keys(BOOK_KIND_LABELS) as BookKind[]).find((id) => normKey(id) === k);
  return byId ?? null;
}

export function resolveSubjectId(subjectName: string): { id: string; name: string } | null {
  const q = subjectName.trim();
  if (!q) return null;
  const lower = q.toLocaleLowerCase("tr-TR");
  const subjects = getSubjects("ALL");
  const exact = subjects.find((s) => s.name.toLocaleLowerCase("tr-TR") === lower);
  if (exact) return { id: exact.id, name: exact.name };
  const partial = subjects.find((s) => {
    const sn = s.name.toLocaleLowerCase("tr-TR");
    return sn.includes(lower) || lower.includes(sn);
  });
  if (partial) return { id: partial.id, name: partial.name };
  return null;
}

export function resolveTopicIds(subjectId: string, topicsRaw: string): string[] {
  const parts = topicsRaw
    .split(/[,;|]/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (!parts.length) return [];

  const topics = getTopics(subjectId);
  const ids: string[] = [];
  for (const part of parts) {
    const lower = part.toLocaleLowerCase("tr-TR");
    const hit =
      topics.find((t) => t.name.toLocaleLowerCase("tr-TR") === lower) ??
      topics.find((t) => {
        const tn = t.name.toLocaleLowerCase("tr-TR");
        return tn.includes(lower) || lower.includes(tn);
      });
    if (hit && !ids.includes(hit.id)) ids.push(hit.id);
  }
  return ids;
}

export function mapStyle(raw: string): string {
  const k = normKey(raw);
  if (!k) return "";
  const fromOpt = STYLE_OPTIONS.find(
    (o) => o.value && (normKey(o.label) === k || normKey(o.value) === k)
  );
  if (fromOpt) return fromOpt.value;
  if (k.includes("osym") || k.includes("ösym")) return "osym";
  if (k.includes("yeninesil")) return "yeni-nesil";
  if (k.includes("klasik")) return "klasik";
  if (k.includes("karma")) return "karma";
  return "";
}

export function mapHasVideo(raw: string): boolean {
  const k = normKey(raw);
  if (!k) return false;
  return ["evet", "var", "true", "1", "yes", "e"].includes(k);
}

export function parseDifficulty(raw: string): number {
  const n = parseInt(raw.replace(/[^\d]/g, ""), 10);
  if (!Number.isFinite(n)) return 3;
  return Math.max(1, Math.min(5, n));
}
