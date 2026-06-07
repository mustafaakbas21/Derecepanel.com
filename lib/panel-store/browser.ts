/**
 * Tarayıcı bellek önbelleği — localStorage yerine Appwrite panel_data ile senkron.
 * hydratePanelStore() çağrılmadan yazılan veriler kuyruğa alınır.
 */

const cache = new Map<string, string>();
let hydrated = false;
const pendingWrites = new Map<string, string>();

export function isPanelStoreHydrated(): boolean {
  return hydrated;
}

export function panelKeys(): string[] {
  return [...cache.keys()];
}

export function panelGetItem(key: string): string | null {
  if (!cache.has(key)) return null;
  return cache.get(key) ?? null;
}

export function panelSetItem(key: string, value: string): void {
  cache.set(key, value);
  if (!hydrated) {
    pendingWrites.set(key, value);
    return;
  }
  void persistKey(key, value);
}

export function panelRemoveItem(key: string): void {
  cache.delete(key);
  pendingWrites.delete(key);
  if (!hydrated) return;
  void fetch("/api/panel-store", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ key }),
  }).catch(() => {});
}

async function persistKey(key: string, value: string): Promise<void> {
  await fetch("/api/panel-store", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ key, value }),
  });
}

async function flushPendingWrites(): Promise<void> {
  const entries = [...pendingWrites.entries()];
  pendingWrites.clear();
  await Promise.all(entries.map(([key, value]) => persistKey(key, value)));
}

export async function hydratePanelStore(): Promise<void> {
  const res = await fetch("/api/panel-store", {
    cache: "no-store",
    credentials: "same-origin",
  });
  if (!res.ok) {
    throw new Error("Panel verisi yüklenemedi.");
  }
  const data = (await res.json()) as { items?: Record<string, string> };
  cache.clear();
  for (const [key, value] of Object.entries(data.items ?? {})) {
    cache.set(key, value);
  }
  hydrated = true;
  await flushPendingWrites();
}

export function clearPanelStoreCache(): void {
  cache.clear();
  pendingWrites.clear();
  hydrated = false;
}
