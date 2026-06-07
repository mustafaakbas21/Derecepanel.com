import "server-only";

import { ID, Query } from "node-appwrite";

import {
  APPWRITE_COLLECTION_DAILY_TASKS,
  APPWRITE_DATABASE_ID,
} from "@/lib/appwrite/config";
import { getAdminDatabases, isAppwriteServerConfigured } from "@/lib/appwrite/server";
import type { StudentDailyTask } from "@/lib/student/dashboard/types";

export function todayIsoLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function rowStr(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const v = row[key];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return "";
}

function rowBool(row: Record<string, unknown>, ...keys: string[]): boolean {
  for (const key of keys) {
    const v = row[key];
    if (v === true || v === 1) return true;
    if (v === false || v === 0) return false;
    if (typeof v === "string") {
      const s = v.toLowerCase();
      if (s === "true" || s === "tamamlandi" || s === "done" || s === "1") return true;
      if (s === "false" || s === "bekliyor" || s === "0") return false;
    }
  }
  return false;
}

export async function fetchTodayTasksFromAppwrite(
  studentId: string
): Promise<StudentDailyTask[]> {
  if (!isAppwriteServerConfigured()) return [];

  const db = getAdminDatabases();
  const today = todayIsoLocal();

  const result = await db.listDocuments(APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_DAILY_TASKS, [
    Query.equal("ogrenciId", studentId),
    Query.equal("tarih", today),
    Query.limit(100),
  ]);

  const tasks = result.documents.map((raw) => {
    const row = raw as Record<string, unknown>;
    return {
      id: String(row.$id || rowStr(row, "id")),
      title: rowStr(row, "baslik", "title", "gorev") || "Görev",
      completed: rowBool(row, "tamamlandi", "durum", "status", "completed"),
      sira: Number(row.sira ?? 0),
    };
  });

  tasks.sort((a, b) => (a.sira ?? 0) - (b.sira ?? 0));
  return tasks.map(({ id, title, completed }) => ({ id, title, completed }));
}

export async function updateTaskStatusInAppwrite(
  studentId: string,
  taskId: string,
  completed: boolean
): Promise<boolean> {
  if (!isAppwriteServerConfigured()) return false;

  const db = getAdminDatabases();
  try {
    await db.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_DAILY_TASKS, taskId, {
      tamamlandi: completed,
      durum: completed ? "tamamlandi" : "bekliyor",
      status: completed,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    const msg = String((err as Error)?.message || "").toLowerCase();
    if (!/not found|could not be found|404/.test(msg)) {
      console.error("[daily-tasks] güncelleme:", err);
    }
    return false;
  }
}

export async function seedDailyTask(input: {
  ogrenciId: string;
  coachId?: string;
  baslik: string;
  tarih?: string;
  sira?: number;
}): Promise<string | null> {
  if (!isAppwriteServerConfigured()) return null;

  const db = getAdminDatabases();
  const docId = ID.unique();
  await db.createDocument(APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_DAILY_TASKS, docId, {
    ogrenciId: input.ogrenciId,
    coachId: input.coachId || "",
    baslik: input.baslik,
    tarih: input.tarih || todayIsoLocal(),
    tamamlandi: false,
    durum: "bekliyor",
    status: false,
    sira: input.sira ?? 0,
    updatedAt: new Date().toISOString(),
  });
  return docId;
}
