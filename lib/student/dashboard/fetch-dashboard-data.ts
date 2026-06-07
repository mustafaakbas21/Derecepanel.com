import "server-only";

import type { StudentDailyTask, StudentExamSnapshot } from "@/lib/student/dashboard/types";
import {
  getSupabaseAdmin,
  isSupabaseConfigured,
  todayIsoLocal,
} from "@/lib/supabase/server";

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
      if (s === "true" || s === "tamamlandi" || s === "done" || s === "1") {
        return true;
      }
      if (s === "false" || s === "bekliyor" || s === "0") return false;
    }
  }
  return false;
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

export async function fetchTodayTasksFromSupabase(
  studentId: string
): Promise<StudentDailyTask[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const today = todayIsoLocal();
  const { data, error } = await supabase
    .from("ogrenci_gorevleri")
    .select("id, baslik, title, gorev, tarih, tamamlandi, durum, status, sira")
    .eq("ogrenci_id", studentId)
    .eq("tarih", today)
    .order("sira", { ascending: true });

  if (error) {
    console.warn("[StudentDashboard] ogrenci_gorevleri:", error.message);
    return [];
  }

  return (data ?? []).map((raw) => {
    const row = raw as Record<string, unknown>;
    return {
      id: rowStr(row, "id"),
      title:
        rowStr(row, "baslik", "title", "gorev", "gorev_adi") || "Görev",
      completed: rowBool(row, "tamamlandi", "durum", "status", "completed"),
    };
  });
}

export async function fetchLatestExamFromSupabase(
  studentId: string
): Promise<StudentExamSnapshot | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("denemeler")
    .select(
      "exam_id, exam_name, sinav, net, net_tyt, net_ayt, zayif_konu, weakest_topic, saved_at, ogrenci_id, student_id"
    )
    .or(`ogrenci_id.eq.${studentId},student_id.eq.${studentId}`)
    .order("saved_at", { ascending: false })
    .limit(12);

  if (error) {
    console.warn("[StudentDashboard] denemeler:", error.message);
    return null;
  }

  const rows = (data ?? []) as Record<string, unknown>[];
  if (rows.length === 0) return null;

  let tytNet: number | null = null;
  let aytNet: number | null = null;
  let weakTopic: string | null = null;
  let examName: string | undefined;
  let savedAt: string | undefined;

  for (const row of rows) {
    const sinav = rowStr(row, "sinav", "exam_type").toUpperCase();
    const net = rowNum(row, "net");
    const netTyt = rowNum(row, "net_tyt");
    const netAyt = rowNum(row, "net_ayt");

    if (!examName) {
      examName = rowStr(row, "exam_name", "exam_id") || undefined;
      savedAt = rowStr(row, "saved_at") || undefined;
    }

    if (!weakTopic) {
      weakTopic =
        rowStr(row, "zayif_konu", "weakest_topic", "zayif_konu_adi") || null;
    }

    if (tytNet == null) {
      if (sinav.includes("TYT") && net != null) tytNet = net;
      else if (netTyt != null) tytNet = netTyt;
    }
    if (aytNet == null) {
      if (sinav.includes("AYT") && net != null) aytNet = net;
      else if (netAyt != null) aytNet = netAyt;
    }

    if (tytNet != null && aytNet != null && weakTopic) break;
  }

  const first = rows[0]!;
  if (tytNet == null) tytNet = rowNum(first, "net_tyt", "net");
  if (aytNet == null) aytNet = rowNum(first, "net_ayt");
  if (!weakTopic) {
    weakTopic =
      rowStr(first, "zayif_konu", "weakest_topic", "zayif_konu_adi") || null;
  }

  return {
    tytNet,
    aytNet,
    weakTopic,
    examName,
    savedAt,
  };
}

export async function updateTaskStatusInSupabase(
  studentId: string,
  taskId: string,
  completed: boolean
): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase || !isSupabaseConfigured()) return false;

  const payload: Record<string, unknown> = {
    tamamlandi: completed,
    durum: completed,
    status: completed,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("ogrenci_gorevleri")
    .update(payload)
    .eq("id", taskId)
    .eq("ogrenci_id", studentId);

  if (error) {
    console.error("[StudentDashboard] görev güncelleme:", error.message);
    return false;
  }
  return true;
}
