/** Sayfa geçişlerinde tek seferlik veri — localStorage/sessionStorage yerine bellek */

const handoff = new Map<string, string>();

export function setHandoff(key: string, value: string): void {
  handoff.set(key, value);
}

export function takeHandoff(key: string): string | null {
  const value = handoff.get(key) ?? null;
  handoff.delete(key);
  return value;
}

export function peekHandoff(key: string): string | null {
  return handoff.get(key) ?? null;
}

export function clearHandoff(key: string): void {
  handoff.delete(key);
}
