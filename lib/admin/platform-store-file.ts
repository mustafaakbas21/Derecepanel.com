import "server-only";

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const PLATFORM_FILE = path.join(process.cwd(), "data", "platform-store.json");

async function readAll(): Promise<Record<string, string>> {
  try {
    const raw = await readFile(PLATFORM_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).map(([key, value]) => [key, String(value)])
    );
  } catch {
    return {};
  }
}

async function writeAll(data: Record<string, string>): Promise<void> {
  await mkdir(path.dirname(PLATFORM_FILE), { recursive: true });
  await writeFile(PLATFORM_FILE, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export async function getPlatformFileData(key: string): Promise<string | null> {
  const data = await readAll();
  return key in data ? data[key] : null;
}

export async function setPlatformFileData(key: string, payload: string): Promise<void> {
  const data = await readAll();
  data[key] = payload;
  await writeAll(data);
}

export async function deletePlatformFileData(key: string): Promise<void> {
  const data = await readAll();
  delete data[key];
  await writeAll(data);
}
