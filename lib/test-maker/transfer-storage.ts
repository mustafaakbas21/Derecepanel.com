import { clearHandoff, peekHandoff, setHandoff, takeHandoff } from "@/lib/panel-store/handoff";

export function isStorageQuotaError(e: unknown): boolean {
  return (
    (e instanceof DOMException &&
      (e.name === "QuotaExceededError" || e.code === 22)) ||
    (e instanceof Error && /quota/i.test(e.message))
  );
}

export function readTransferItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  return peekHandoff(key);
}

export function writeTransferItem(key: string, value: string): void {
  if (typeof window === "undefined") return;
  setHandoff(key, value);
}

export function removeTransferItem(key: string): void {
  if (typeof window === "undefined") return;
  clearHandoff(key);
}

export function consumeTransferItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  return takeHandoff(key);
}
