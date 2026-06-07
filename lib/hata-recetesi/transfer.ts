import { HATA_RECETE_LS } from "@/lib/hata-recetesi/constants";
import type { ReceteTransferPayload, WrongQuestionRecord } from "@/lib/hata-recetesi/types";

import { panelGetItem, panelRemoveItem, panelSetItem } from "@/lib/panel-store";
export { HATA_RECETE_LS };

export function saveReceteToTestMaker(payload: Omit<ReceteTransferPayload, "v" | "ts">): void {
  if (typeof window === "undefined") return;
  const full: ReceteTransferPayload = { v: 1, ts: Date.now(), ...payload };
  panelSetItem(HATA_RECETE_LS.transferQuestions, JSON.stringify(full.questions));
  panelSetItem(HATA_RECETE_LS.transferStudent, payload.studentCanonical);
}

export function consumeReceteForTestMaker(): {
  student: string;
  questions: WrongQuestionRecord[];
} | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = panelGetItem(HATA_RECETE_LS.transferQuestions);
    if (!raw) return null;
    panelRemoveItem(HATA_RECETE_LS.transferQuestions);
    const student = panelGetItem(HATA_RECETE_LS.transferStudent) || "";
    panelRemoveItem(HATA_RECETE_LS.transferStudent);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return { student, questions: parsed as WrongQuestionRecord[] };
  } catch {
    panelRemoveItem(HATA_RECETE_LS.transferQuestions);
    return null;
  }
}

export function peekReceteTransferStudent(): string | null {
  if (typeof window === "undefined") return null;
  return panelGetItem(HATA_RECETE_LS.transferStudent);
}
