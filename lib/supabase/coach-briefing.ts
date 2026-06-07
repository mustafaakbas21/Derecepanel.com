import "server-only";

import type { CoachBriefingSyncPayload } from "@/lib/coach/coach-briefing-sync";
import {
  assembleBriefingFromPayload,
  buildCoachBriefingFacts,
} from "@/lib/coach/coach-briefing-engine";
import { generateCoachBriefingText } from "@/lib/coach/coach-briefing-ai";
import type { OnyxCoachBriefingData } from "@/lib/coach/briefing-types";
import type { Appointment } from "@/lib/appointments/types";
import type { ExamResultRow, MergedExam } from "@/lib/exams/types";
import type { StudentRecord } from "@/lib/students/types";
import {
  getSupabaseAdmin,
  isSupabaseConfigured,
  todayIsoLocal,
} from "@/lib/supabase/server";

export { isSupabaseConfigured } from "@/lib/supabase/server";

/** Supabase şeması — tablo/kolon adları prod ile eşleştirilmeli */
export async function fetchCoachBriefingFromSupabase(
  coachId: string
): Promise<OnyxCoachBriefingData | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const today = todayIsoLocal();

  const [aptRes, studentsRes, resultsRes] = await Promise.all([
    supabase
      .from("randevular")
      .select("id, tarih, saat, ogrenci, ogrenci_adi, status, coach_id")
      .eq("coach_id", coachId)
      .eq("tarih", today)
      .neq("status", "iptal")
      .order("saat", { ascending: true }),
    supabase
      .from("ogrenciler")
      .select("*")
      .eq("coach_id", coachId)
      .eq("status", "aktif"),
    supabase
      .from("denemeler")
      .select(
        "exam_id, exam_name, student_id, student_code, net, saved_at, ogrenci_id"
      )
      .eq("coach_id", coachId)
      .order("saved_at", { ascending: false })
      .limit(500),
  ]);

  if (aptRes.error && studentsRes.error && resultsRes.error) {
    throw aptRes.error;
  }

  const appointments: Appointment[] = (aptRes.data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id),
      studentId: String(r.ogrenci_id ?? r.student_id ?? ""),
      ogrenci: String(r.ogrenci_adi ?? r.ogrenci ?? "Öğrenci"),
      tarih: String(r.tarih ?? today),
      saat: String(r.saat ?? "09:00"),
      sure: 45,
      tip: "online",
      status: (r.status as Appointment["status"]) || "bekliyor",
      konu: "",
      notlar: "",
      yer: "",
      ts: Date.now(),
    };
  });

  const students: StudentRecord[] = (studentsRes.data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      ogrenciId: String(r.ogrenci_id ?? r.id ?? ""),
      coachId: String(r.coach_id ?? coachId),
      name: String(r.name ?? r.ad ?? "Öğrenci"),
      studentCode: String(r.student_code ?? r.kod ?? ""),
      sinifBranch: String(r.sinif ?? ""),
      alan: "tyt",
      goal: String(r.goal ?? ""),
      kayitDate: String(r.kayit_date ?? ""),
      status: "aktif",
      parent: "",
      parentPhone: "",
    } as StudentRecord;
  });

  const examResults: ExamResultRow[] = (resultsRes.data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      examId: String(r.exam_id ?? ""),
      examName: String(r.exam_name ?? ""),
      studentId: String(r.student_id ?? r.ogrenci_id ?? ""),
      studentCode: String(r.student_code ?? ""),
      net: r.net != null ? Number(r.net) : null,
      answers: "",
      savedAt: String(r.saved_at ?? new Date().toISOString()),
    };
  });

  const payload: CoachBriefingSyncPayload = {
    appointments,
    students,
    examResults,
    examPackages: [],
    mergedExams: [] as MergedExam[],
  };

  const facts = buildCoachBriefingFacts(coachId, payload);
  const briefingText = await generateCoachBriefingText(facts);
  return assembleBriefingFromPayload(coachId, payload, briefingText, "supabase");
}
