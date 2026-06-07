import "server-only";

import { Query } from "node-appwrite";

import { APPWRITE_COLLECTION_EXAM_RESULTS, APPWRITE_DATABASE_ID } from "@/lib/appwrite/config";
import {
  fetchTodayTasksFromAppwrite,
  todayIsoLocal,
} from "@/lib/appwrite/daily-tasks-server";
import { getAdminDatabases, isAppwriteServerConfigured } from "@/lib/appwrite/server";
import type { StudentExamSnapshot } from "@/lib/student/dashboard/types";

function rowStr(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const v = row[key];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return "";
}

function rowNum(row: Record<string, unknown>, ...keys: string[]): number | null {
  for (const key of keys) {
    const v = row[key];
    if (v == null || v === "") continue;
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export async function fetchLatestExamFromAppwrite(
  studentId: string
): Promise<StudentExamSnapshot | null> {
  if (!isAppwriteServerConfigured()) return null;

  const db = getAdminDatabases();
  const result = await db.listDocuments(APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_EXAM_RESULTS, [
    Query.limit(20),
  ]);

  const rows: Record<string, unknown>[] = [];
  for (const doc of result.documents) {
    const payload = String((doc as { payload?: string }).payload || "");
    if (!payload) continue;
    try {
      const parsed = JSON.parse(payload) as unknown;
      if (!Array.isArray(parsed)) continue;
      for (const row of parsed) {
        if (!row || typeof row !== "object") continue;
        const r = row as Record<string, unknown>;
        const sid = String(r.studentId || "");
        if (sid === studentId) rows.push(r);
      }
    } catch {
      /* ignore */
    }
  }

  if (!rows.length) return null;

  rows.sort((a, b) =>
    String(b.savedAt || "").localeCompare(String(a.savedAt || ""))
  );

  let tytNet: number | null = null;
  let aytNet: number | null = null;
  let weakTopic: string | null = null;
  let examName: string | undefined;
  let savedAt: string | undefined;

  for (const row of rows) {
    const sinav = rowStr(row, "sinav", "examType").toUpperCase();
    const net = rowNum(row, "net");

    if (!examName) {
      examName = rowStr(row, "examName", "examId") || undefined;
      savedAt = rowStr(row, "savedAt") || undefined;
    }

    if (!weakTopic) {
      weakTopic = rowStr(row, "weakTopic", "zayifKonu") || null;
    }

    if (tytNet == null && sinav.includes("TYT") && net != null) tytNet = net;
    if (aytNet == null && sinav.includes("AYT") && net != null) aytNet = net;

    if (tytNet != null && aytNet != null && weakTopic) break;
  }

  const first = rows[0]!;
  if (tytNet == null) tytNet = rowNum(first, "net");
  if (!weakTopic) weakTopic = rowStr(first, "weakTopic", "zayifKonu") || null;

  return { tytNet, aytNet, weakTopic, examName, savedAt };
}

export { fetchTodayTasksFromAppwrite, todayIsoLocal };
