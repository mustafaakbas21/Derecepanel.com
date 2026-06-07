import { consumeReceteForTestMaker } from "@/lib/hata-recetesi/transfer";
import { STORAGE_KEYS } from "@/lib/test-maker/constants";
import { ensureQuestionPoolInit } from "@/lib/test-maker/question-pool";
import {
  readTransferItem,
  removeTransferItem,
} from "@/lib/test-maker/transfer-storage";
import type { TaramaTransferPayloadV2 } from "@/lib/taramalar/transfer";
import type { AnswerLetter, QuestionPoolItem, TMQuestion } from "@/lib/test-maker/types";

export type TransferDersKonu = {
  dersId?: string;
  konuId?: string;
  dersText?: string;
  konuText?: string;
};

export type StudioEntry =
  | { type: "fresh" }
  | { type: "edit-tarama"; id: string }
  | { type: "edit-recete"; id: string }
  | {
      type: "import";
      questions: TMQuestion[];
      dersKonu: TransferDersKonu | null;
      ogrenciId?: string;
      autoprint: boolean;
    };

export function consumeTransferDersKonu(): TransferDersKonu | null {
  if (typeof window === "undefined") return null;
  try {
    const dersId = readTransferItem(STORAGE_KEYS.transferDers) || "";
    const konuId = readTransferItem(STORAGE_KEYS.transferKonu) || "";
    const dersText = readTransferItem(STORAGE_KEYS.transferDersText) || "";
    const konuText = readTransferItem(STORAGE_KEYS.transferKonuText) || "";
    if (!dersId && !konuId && !dersText && !konuText) return null;
    removeTransferItem(STORAGE_KEYS.transferDers);
    removeTransferItem(STORAGE_KEYS.transferKonu);
    removeTransferItem(STORAGE_KEYS.transferDersText);
    removeTransferItem(STORAGE_KEYS.transferKonuText);
    return { dersId: dersId || undefined, konuId: konuId || undefined, dersText, konuText };
  } catch {
    return null;
  }
}

function normalizeAnswerLetter(raw: string | undefined): AnswerLetter | null {
  const u = String(raw ?? "")
    .toUpperCase()
    .replace(/[^A-E]/g, "")
    .charAt(0);
  return (u as AnswerLetter) || null;
}

/** v2 — havuzdan görselleri çöz */
export function hydrateTaramaTransferFromPool(
  payload: TaramaTransferPayloadV2,
  pool: QuestionPoolItem[]
): TMQuestion[] {
  const byUuid = new Map(pool.map((q) => [q.uuid, q]));
  const out: TMQuestion[] = [];
  for (const item of payload.items) {
    const q = byUuid.get(item.uuid);
    const url = q?.dataUrl;
    if (!url) continue;
    out.push({
      id: `q-tr-${item.uuid}`,
      imageDataUrl: url,
      answer: normalizeAnswerLetter(item.answer || q.answer || undefined),
    });
  }
  return out;
}

function parseLegacyQuestionTransfer(raw: string): TMQuestion[] | null {
  const parsed = JSON.parse(raw) as
    | {
        imageDataUrl?: string;
        dataUrl?: string;
        answer?: string;
      }[]
    | TaramaTransferPayloadV2;

  if (
    parsed &&
    typeof parsed === "object" &&
    !Array.isArray(parsed) &&
    parsed.v === 2 &&
    Array.isArray(parsed.items)
  ) {
    return null;
  }

  if (!Array.isArray(parsed)) return null;
  return parsed
    .filter((x) => x.imageDataUrl || x.dataUrl)
    .map((x, i) => ({
      id: `q-tr-${Date.now()}-${i}`,
      imageDataUrl: (x.imageDataUrl || x.dataUrl)!,
      answer: normalizeAnswerLetter(x.answer),
    }));
}

export async function consumeQuestionTransferAsync(
  key: typeof STORAGE_KEYS.transferTarama | typeof STORAGE_KEYS.transferRecipe,
  pool: QuestionPoolItem[]
): Promise<TMQuestion[] | null> {
  if (typeof window === "undefined") return null;
  const raw = readTransferItem(key);
  if (!raw) return null;
  removeTransferItem(key);

  try {
    const parsed = JSON.parse(raw) as
      | TaramaTransferPayloadV2
      | {
          imageDataUrl?: string;
          dataUrl?: string;
          answer?: string;
        }[];

    if (
      parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed) &&
      parsed.v === 2 &&
      Array.isArray(parsed.items)
    ) {
      const hydrated = hydrateTaramaTransferFromPool(parsed, pool);
      return hydrated.length ? hydrated : null;
    }

    const legacy = parseLegacyQuestionTransfer(raw);
    return legacy?.length ? legacy : null;
  } catch {
    return null;
  }
}

/** @deprecated — v2 aktarım için `consumeStudioEntryAsync` kullanın */
export function consumeQuestionTransfer(
  key: typeof STORAGE_KEYS.transferTarama | typeof STORAGE_KEYS.transferRecipe
): TMQuestion[] | null {
  if (typeof window === "undefined") return null;
  const raw = readTransferItem(key);
  if (!raw) return null;
  removeTransferItem(key);
  try {
    return parseLegacyQuestionTransfer(raw);
  } catch {
    return null;
  }
}

export function consumeTaramaEditId(): string | null {
  if (typeof window === "undefined") return null;
  const id = readTransferItem(STORAGE_KEYS.transferEdit);
  if (!id) return null;
  removeTransferItem(STORAGE_KEYS.transferEdit);
  return id;
}

export function consumeReceteEditId(): string | null {
  if (typeof window === "undefined") return null;
  const id = readTransferItem(STORAGE_KEYS.transferReceteEdit);
  if (!id) return null;
  removeTransferItem(STORAGE_KEYS.transferReceteEdit);
  return id;
}

export function consumeReceteStudentLabel(): string | null {
  if (typeof window === "undefined") return null;
  const v = readTransferItem(STORAGE_KEYS.transferReceteStudent);
  if (!v) return null;
  removeTransferItem(STORAGE_KEYS.transferReceteStudent);
  return v;
}

/** ESKİ transfer_tarama_autoprint — tek kullanımlık */
export function consumeAutoprintFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const v = readTransferItem(STORAGE_KEYS.transferAutoprint);
    if (!v) return false;
    removeTransferItem(STORAGE_KEYS.transferAutoprint);
    return v === "1" || v === "true";
  } catch {
    return false;
  }
}

/** Test Oluşturucu girişi — tek seferlik aktarım veya sıfır oturum */
export async function consumeStudioEntryAsync(): Promise<StudioEntry> {
  const taramaEditId = consumeTaramaEditId();
  if (taramaEditId) return { type: "edit-tarama", id: taramaEditId };

  const receteEditId = consumeReceteEditId();
  if (receteEditId) return { type: "edit-recete", id: receteEditId };

  const dersKonu = consumeTransferDersKonu();
  const questions: TMQuestion[] = [];
  const pool = await ensureQuestionPoolInit();

  const fromTarama = await consumeQuestionTransferAsync(STORAGE_KEYS.transferTarama, pool);
  if (fromTarama?.length) questions.push(...fromTarama);

  let ogrenciId: string | undefined;

  const receteHandoff = consumeReceteForTestMaker();

  if (receteHandoff?.questions.length) {
    questions.push(
      ...receteHandoff.questions
        .filter((x) => x.dataUrl)
        .map((x, i) => ({
          id: x.id || `q-rc-${Date.now()}-${i}`,
          imageDataUrl: x.dataUrl,
          answer: normalizeAnswerLetter(x.answer),
        }))
    );
    const label = receteHandoff.student || consumeReceteStudentLabel() || "";
    if (label) ogrenciId = label;
  } else {
    const legacyRecipe = await consumeQuestionTransferAsync(
      STORAGE_KEYS.transferRecipe,
      pool
    );
    if (legacyRecipe?.length) questions.push(...legacyRecipe);
    consumeReceteStudentLabel();
  }

  const autoprint = consumeAutoprintFlag();

  if (questions.length || dersKonu || autoprint || ogrenciId) {
    return {
      type: "import",
      questions,
      dersKonu,
      ogrenciId,
      autoprint,
    };
  }

  return { type: "fresh" };
}

/** @deprecated */
export function consumeStudioEntry(): StudioEntry {
  const taramaEditId = consumeTaramaEditId();
  if (taramaEditId) return { type: "edit-tarama", id: taramaEditId };

  const receteEditId = consumeReceteEditId();
  if (receteEditId) return { type: "edit-recete", id: receteEditId };

  const dersKonu = consumeTransferDersKonu();
  const questions: TMQuestion[] = [];

  const fromTarama = consumeQuestionTransfer(STORAGE_KEYS.transferTarama);
  if (fromTarama?.length) questions.push(...fromTarama);

  let ogrenciId: string | undefined;
  const receteHandoff = consumeReceteForTestMaker();

  if (receteHandoff?.questions.length) {
    questions.push(
      ...receteHandoff.questions
        .filter((x) => x.dataUrl)
        .map((x, i) => ({
          id: x.id || `q-rc-${Date.now()}-${i}`,
          imageDataUrl: x.dataUrl,
          answer: normalizeAnswerLetter(x.answer),
        }))
    );
    const label = receteHandoff.student || consumeReceteStudentLabel() || "";
    if (label) ogrenciId = label;
  } else {
    const legacyRecipe = consumeQuestionTransfer(STORAGE_KEYS.transferRecipe);
    if (legacyRecipe?.length) questions.push(...legacyRecipe);
    consumeReceteStudentLabel();
  }

  const autoprint = consumeAutoprintFlag();

  if (questions.length || dersKonu || autoprint || ogrenciId) {
    return { type: "import", questions, dersKonu, ogrenciId, autoprint };
  }

  return { type: "fresh" };
}
