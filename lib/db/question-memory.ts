import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { getPrisma } from "@/lib/db/prisma";

const FALLBACK_FILE = path.join(process.cwd(), "data", "question-memory.json");

export type QuestionMemoryRecord = {
  id: string;
  studentId: string;
  topic: string;
  questionImage: string | null;
  solutionText: string;
  difficultyScore: number;
  timestamp: string;
};

type MemoryStore = { version: 1; records: QuestionMemoryRecord[] };

async function readFallbackStore(): Promise<MemoryStore> {
  try {
    const raw = await readFile(FALLBACK_FILE, "utf8");
    const parsed = JSON.parse(raw) as MemoryStore;
    if (parsed?.version === 1 && Array.isArray(parsed.records)) return parsed;
  } catch {
    /* oluşturulacak */
  }
  return { version: 1, records: [] };
}

async function writeFallbackStore(store: MemoryStore): Promise<void> {
  await mkdir(path.dirname(FALLBACK_FILE), { recursive: true });
  await writeFile(FALLBACK_FILE, JSON.stringify(store, null, 2), "utf8");
}

export type CreateQuestionMemoryInput = {
  studentId: string;
  topic: string;
  questionImage?: string | null;
  solutionText: string;
  difficultyScore: number;
};

/** Vektörel hafıza — Prisma veya JSON fallback */
export async function createQuestionMemory(
  input: CreateQuestionMemoryInput
): Promise<QuestionMemoryRecord> {
  const prisma = getPrisma();

  if (prisma) {
    const row = await prisma.questionMemory.create({
      data: {
        studentId: input.studentId,
        topic: input.topic,
        questionImage: input.questionImage ?? null,
        solutionText: input.solutionText,
        difficultyScore: input.difficultyScore,
      },
    });
    return {
      id: row.id,
      studentId: row.studentId,
      topic: row.topic,
      questionImage: row.questionImage,
      solutionText: row.solutionText,
      difficultyScore: row.difficultyScore,
      timestamp: row.timestamp.toISOString(),
    };
  }

  const record: QuestionMemoryRecord = {
    id: randomUUID(),
    studentId: input.studentId,
    topic: input.topic,
    questionImage: input.questionImage ?? null,
    solutionText: input.solutionText,
    difficultyScore: input.difficultyScore,
    timestamp: new Date().toISOString(),
  };
  const store = await readFallbackStore();
  store.records.unshift(record);
  if (store.records.length > 5000) store.records = store.records.slice(0, 5000);
  await writeFallbackStore(store);
  return record;
}

export async function listQuestionMemoryByStudent(
  studentId: string,
  opts?: { since?: Date; limit?: number }
): Promise<QuestionMemoryRecord[]> {
  const limit = opts?.limit ?? 50;
  const since = opts?.since;
  const prisma = getPrisma();

  if (prisma) {
    const rows = await prisma.questionMemory.findMany({
      where: {
        studentId,
        ...(since ? { timestamp: { gte: since } } : {}),
      },
      orderBy: { timestamp: "desc" },
      take: limit,
    });
    return rows.map((row) => ({
      id: row.id,
      studentId: row.studentId,
      topic: row.topic,
      questionImage: row.questionImage,
      solutionText: row.solutionText,
      difficultyScore: row.difficultyScore,
      timestamp: row.timestamp.toISOString(),
    }));
  }

  const store = await readFallbackStore();
  return store.records
    .filter((r) => {
      if (r.studentId !== studentId) return false;
      if (since && new Date(r.timestamp) < since) return false;
      return true;
    })
    .slice(0, limit);
}
