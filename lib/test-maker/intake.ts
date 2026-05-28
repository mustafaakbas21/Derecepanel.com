import { STORAGE_KEYS } from "@/lib/test-maker/constants";
import type { AnswerLetter, TMQuestion } from "@/lib/test-maker/types";

export function consumeTransferDersKonu(): {
  dersId?: string;
  konuId?: string;
  dersText?: string;
  konuText?: string;
} | null {
  if (typeof window === "undefined") return null;
  try {
    const dersId = localStorage.getItem(STORAGE_KEYS.transferDers) || "";
    const konuId = localStorage.getItem(STORAGE_KEYS.transferKonu) || "";
    const dersText = localStorage.getItem(STORAGE_KEYS.transferDersText) || "";
    const konuText = localStorage.getItem(STORAGE_KEYS.transferKonuText) || "";
    if (!dersId && !konuId && !dersText && !konuText) return null;
    localStorage.removeItem(STORAGE_KEYS.transferDers);
    localStorage.removeItem(STORAGE_KEYS.transferKonu);
    localStorage.removeItem(STORAGE_KEYS.transferDersText);
    localStorage.removeItem(STORAGE_KEYS.transferKonuText);
    return { dersId: dersId || undefined, konuId: konuId || undefined, dersText, konuText };
  } catch {
    return null;
  }
}

export function consumeQuestionTransfer(
  key: typeof STORAGE_KEYS.transferTarama | typeof STORAGE_KEYS.transferRecipe
): TMQuestion[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    localStorage.removeItem(key);
    const parsed = JSON.parse(raw) as {
      imageDataUrl?: string;
      dataUrl?: string;
      answer?: string;
    }[];
    if (!Array.isArray(parsed)) return null;
    return parsed
      .filter((x) => x.imageDataUrl || x.dataUrl)
      .map((x, i) => ({
        id: `q-tr-${Date.now()}-${i}`,
        imageDataUrl: (x.imageDataUrl || x.dataUrl)!,
        answer: (x.answer?.toUpperCase() as AnswerLetter) || null,
      }));
  } catch {
    return null;
  }
}

export function consumeTaramaEditId(): string | null {
  if (typeof window === "undefined") return null;
  const id = localStorage.getItem(STORAGE_KEYS.transferEdit);
  if (!id) return null;
  localStorage.removeItem(STORAGE_KEYS.transferEdit);
  return id;
}

/** ESKİ transfer_tarama_autoprint — tek kullanımlık */
export function consumeAutoprintFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const v = localStorage.getItem(STORAGE_KEYS.transferAutoprint);
    if (!v) return false;
    localStorage.removeItem(STORAGE_KEYS.transferAutoprint);
    return v === "1" || v === "true";
  } catch {
    return false;
  }
}
