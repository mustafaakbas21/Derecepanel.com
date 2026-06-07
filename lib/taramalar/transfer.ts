import { STORAGE_KEYS } from "@/lib/taramalar/constants";
import {
  isStorageQuotaError,
  writeTransferItem,
} from "@/lib/test-maker/transfer-storage";
import type { QuestionPoolItem } from "@/lib/test-maker/types";

export type TaramaTransferMeta = {
  dersId?: string;
  konuId?: string;
  dersText?: string;
  konuText?: string;
};

/** Görsel yok — havuzdan uuid ile hydrate edilir (localStorage kotası korunur). */
export type TaramaTransferPayloadV2 = {
  v: 2;
  items: { uuid: string; answer: string }[];
};

export class TaramaTransferSaveError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown
  ) {
    super(message);
    this.name = "TaramaTransferSaveError";
  }
}

export function saveTaramaToTestMaker(
  questions: QuestionPoolItem[],
  meta?: TaramaTransferMeta
): void {
  if (typeof window === "undefined") return;

  const items = questions
    .map((q) => ({
      uuid: String(q.uuid || "").trim(),
      answer: q.answer ?? "",
    }))
    .filter((x) => x.uuid);

  if (!items.length) {
    throw new TaramaTransferSaveError("Seçili sorularda havuz kimliği (uuid) yok.");
  }

  const payload: TaramaTransferPayloadV2 = { v: 2, items };

  try {
    writeTransferItem(STORAGE_KEYS.transferTarama, JSON.stringify(payload));
    if (meta?.dersId) writeTransferItem(STORAGE_KEYS.transferDers, meta.dersId);
    if (meta?.konuId) writeTransferItem(STORAGE_KEYS.transferKonu, meta.konuId);
    if (meta?.dersText) writeTransferItem(STORAGE_KEYS.transferDersText, meta.dersText);
    if (meta?.konuText) writeTransferItem(STORAGE_KEYS.transferKonuText, meta.konuText);
  } catch (e) {
    if (isStorageQuotaError(e)) {
      throw new TaramaTransferSaveError(
        "Tarayıcı depolama alanı dolu. Geliştirici araçlarından site verisini temizleyin veya daha az soru seçin.",
        e
      );
    }
    throw new TaramaTransferSaveError("Aktarım kaydedilemedi.", e);
  }
}

export function setTaramaEditId(id: string): void {
  if (typeof window === "undefined") return;
  writeTransferItem(STORAGE_KEYS.transferEdit, id);
}

export { isStorageQuotaError };
