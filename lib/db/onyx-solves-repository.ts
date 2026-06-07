import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { OnyxQuestionSolveRecord } from "@/lib/db/types";

const DATA_DIR = path.join(process.cwd(), "data");
const SOLVES_FILE = path.join(DATA_DIR, "onyx-question-solves.json");

type SolvesFile = {
  version: 1;
  records: OnyxQuestionSolveRecord[];
};

async function ensureStore(): Promise<SolvesFile> {
  try {
    const raw = await readFile(SOLVES_FILE, "utf8");
    const parsed = JSON.parse(raw) as SolvesFile;
    if (parsed?.version === 1 && Array.isArray(parsed.records)) {
      return parsed;
    }
  } catch {
    /* yoksa oluştur */
  }
  return { version: 1, records: [] };
}

async function persist(store: SolvesFile): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(SOLVES_FILE, JSON.stringify(store, null, 2), "utf8");
}

export async function appendOnyxSolve(
  record: OnyxQuestionSolveRecord
): Promise<OnyxQuestionSolveRecord> {
  const store = await ensureStore();
  store.records.unshift(record);
  if (store.records.length > 5000) {
    store.records = store.records.slice(0, 5000);
  }
  await persist(store);
  return record;
}

export async function listOnyxSolvesByStudent(
  studentId: string,
  limit = 50
): Promise<OnyxQuestionSolveRecord[]> {
  const store = await ensureStore();
  return store.records
    .filter((r) => r.studentId === studentId)
    .slice(0, limit);
}

export async function listAllOnyxSolves(
  limit = 200
): Promise<OnyxQuestionSolveRecord[]> {
  const store = await ensureStore();
  return store.records.slice(0, limit);
}
