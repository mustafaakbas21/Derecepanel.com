import { HATA_RECETE_LS } from "@/lib/hata-recetesi/constants";
import { panelGetItem, panelRemoveItem, panelSetItem } from "@/lib/panel-store";
import {
  normHataKaynagi,
  normHataTipi,
  normOgrenci,
  questionImageUrl,
} from "@/lib/hata-recetesi/filters";
import type { WrongQuestionRecord } from "@/lib/hata-recetesi/types";

export class WrongPoolQuotaError extends Error {
  constructor() {
    super("Depolama dolu — bazı görseller çok büyük olabilir");
    this.name = "WrongPoolQuotaError";
  }
}

export function createWrongQuestionId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizeWrongQuestion(q: unknown): WrongQuestionRecord | null {
  if (!q || typeof q !== "object") return null;
  const raw = q as Record<string, unknown>;
  const dataUrl = questionImageUrl(raw as unknown as WrongQuestionRecord);
  const id = String(raw.id || raw.uuid || createWrongQuestionId());
  const uuid = String(raw.uuid || id);
  const ogrenciAdi = String(raw.ogrenciAdi || raw.ogrenci || "").trim();
  return {
    id,
    uuid,
    dataUrl,
    ders: String(raw.ders || "").trim(),
    konu: String(raw.konu || "").trim(),
    kavram: String(raw.kavram || "").trim() || undefined,
    answer: (raw.answer as WrongQuestionRecord["answer"]) ?? null,
    ogrenciAdi,
    ogrenci: ogrenciAdi,
    hataKaynagi: normHataKaynagi(raw as unknown as WrongQuestionRecord) || undefined,
    hataTipi: normHataTipi(raw as unknown as WrongQuestionRecord),
    page: raw.page != null ? Number(raw.page) : null,
    qNumber: String(raw.qNumber || raw.soruNo || "").trim() || undefined,
    soruNo: String(raw.soruNo || raw.qNumber || "").trim() || undefined,
    auto: Boolean(raw.auto),
    savedAt: String(raw.savedAt || new Date().toISOString()),
    examId: raw.examId ? String(raw.examId) : undefined,
    examName: raw.examName ? String(raw.examName) : undefined,
  };
}

export function ensureIds(pool: WrongQuestionRecord[]): WrongQuestionRecord[] {
  let changed = false;
  const next = pool.map((q) => {
    if (!q.id && !q.uuid) {
      const nid = createWrongQuestionId();
      changed = true;
      return { ...q, id: nid, uuid: nid };
    }
    if (!q.id && q.uuid) {
      changed = true;
      return { ...q, id: q.uuid };
    }
    if (q.id && !q.uuid) {
      changed = true;
      return { ...q, uuid: q.id };
    }
    const canon = normOgrenci(q);
    if (canon && q.ogrenciAdi !== canon) {
      changed = true;
      return { ...q, ogrenciAdi: canon, ogrenci: canon };
    }
    return q;
  });
  if (changed) saveWrongPool(next);
  return next;
}

export function loadWrongPool(): WrongQuestionRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(panelGetItem(HATA_RECETE_LS.wrongPool) || "[]");
    if (!Array.isArray(raw)) return [];
    return ensureIds(
      raw.map(normalizeWrongQuestion).filter((x): x is WrongQuestionRecord => !!x && !!x.id)
    );
  } catch {
    return [];
  }
}

export function saveWrongPool(list: WrongQuestionRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    panelSetItem(HATA_RECETE_LS.wrongPool, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("hata-recetesi:wrong-pool-change"));
  } catch (e) {
    if (e instanceof DOMException && (e.name === "QuotaExceededError" || e.code === 22)) {
      throw new WrongPoolQuotaError();
    }
    throw e;
  }
}

export function appendWrongPool(items: WrongQuestionRecord[]): void {
  const pool = loadWrongPool();
  const normalized = items
    .map((q) => normalizeWrongQuestion(q))
    .filter((x): x is WrongQuestionRecord => !!x);
  saveWrongPool([...pool, ...normalized]);
}

export function removeWrongById(id: string): void {
  saveWrongPool(loadWrongPool().filter((q) => q.id !== id && q.uuid !== id));
}

export function updateWrongAnswer(id: string, answer: WrongQuestionRecord["answer"]): void {
  saveWrongPool(
    loadWrongPool().map((q) => (q.id === id || q.uuid === id ? { ...q, answer } : q))
  );
}

export function clearWrongPool(): void {
  saveWrongPool([]);
}

export function buildWrongQuestionFromCrop(input: {
  dataUrl: string;
  ders?: string;
  konu?: string;
  kavram?: string;
  answer?: WrongQuestionRecord["answer"];
  ogrenciCanonical?: string;
  hataKaynagi: "deneme" | "soru_bankasi";
  hataTipi?: "yanlis" | "bos";
  page?: number | null;
  qNumber?: string;
}): WrongQuestionRecord {
  const id = createWrongQuestionId();
  const ogrenciAdi = input.ogrenciCanonical?.trim() || "";
  return {
    id,
    uuid: id,
    dataUrl: input.dataUrl,
    ders: input.ders || "",
    konu: input.konu || "",
    kavram: input.kavram || undefined,
    answer: input.answer ?? null,
    ogrenciAdi,
    ogrenci: ogrenciAdi,
    hataKaynagi: input.hataKaynagi,
    hataTipi: input.hataTipi ?? "yanlis",
    page: input.page ?? null,
    qNumber: input.qNumber,
    savedAt: new Date().toISOString(),
  };
}
