import "server-only";

import { Query } from "node-appwrite";

import {
  APPWRITE_COLLECTION_APPOINTMENTS,
  APPWRITE_COLLECTION_STUDENTS,
  APPWRITE_DATABASE_ID,
} from "@/lib/appwrite/config";
import { parseExamResultsForCoach } from "@/lib/appwrite/collection-bridge";
import { todayIsoLocal } from "@/lib/appwrite/daily-tasks-server";
import { getAdminDatabases, isAppwriteServerConfigured } from "@/lib/appwrite/server";
import {
  assembleBriefingFromPayload,
  buildCoachBriefingFacts,
} from "@/lib/coach/coach-briefing-engine";
import { generateCoachBriefingText } from "@/lib/coach/coach-briefing-ai";
import type { OnyxCoachBriefingData } from "@/lib/coach/briefing-types";
import type { Appointment } from "@/lib/appointments/types";
import type { ExamResultRow } from "@/lib/exams/types";
import type { StudentRecord } from "@/lib/students/types";
import { getGenericDocPayload } from "@/lib/appwrite/generic-doc-server";

export { isAppwriteServerConfigured as isAppwriteBriefingReady } from "@/lib/appwrite/server";

function mapStudentDoc(doc: Record<string, unknown>): StudentRecord {
  const ogrenciId = String(doc.ogrenciId || doc.$id || "").trim();
  return {
    ogrenciId,
    coachId: String(doc.coachId || doc.koc_id || "").trim(),
    name: String(doc.name || doc.fullName || ogrenciId),
    studentCode: String(doc.studentCode || ogrenciId),
    sinifBranch: String(doc.sinifBranch || ""),
    alan: (doc.alan as StudentRecord["alan"]) || "tyt",
    goal: String(doc.goal || ""),
    kayitDate: String(doc.kayitDate || ""),
    status: (doc.status as StudentRecord["status"]) || "aktif",
    parent: String(doc.parent || ""),
    parentPhone: String(doc.parentPhone || ""),
  };
}

export async function fetchCoachBriefingFromAppwrite(
  coachId: string
): Promise<OnyxCoachBriefingData | null> {
  if (!isAppwriteServerConfigured()) return null;

  const db = getAdminDatabases();
  const today = todayIsoLocal();

  const [aptPayload, studentsRes, examRows] = await Promise.all([
    getGenericDocPayload(APPWRITE_COLLECTION_APPOINTMENTS, coachId, "appointments"),
    db.listDocuments(APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_STUDENTS, [
      Query.equal("coachId", coachId),
      Query.limit(500),
    ]),
    parseExamResultsForCoach(coachId),
  ]);

  let appointments: Appointment[] = [];
  if (aptPayload) {
    try {
      const parsed = JSON.parse(aptPayload) as Appointment[];
      if (Array.isArray(parsed)) {
        appointments = parsed.filter(
          (a) => a.tarih === today && a.status !== "iptal"
        );
      }
    } catch {
      /* ignore */
    }
  }

  const students = studentsRes.documents
    .map((d) => mapStudentDoc(d as Record<string, unknown>))
    .filter((s) => String(s.status || "").toLowerCase() === "aktif");

  const examResults: ExamResultRow[] = examRows.map((r) => ({
    examId: String(r.examId || ""),
    examName: String(r.examName || ""),
    studentId: String(r.studentId || ""),
    studentCode: String(r.studentCode || ""),
    net: r.net != null ? Number(r.net) : null,
    answers: "",
    savedAt: String(r.savedAt || ""),
  }));

  const sync = {
    appointments,
    students,
    examResults,
    examPackages: [],
    mergedExams: [],
  };
  const facts = buildCoachBriefingFacts(coachId, sync);
  const briefingText = await generateCoachBriefingText(facts);
  return assembleBriefingFromPayload(coachId, sync, briefingText, "appwrite");
}
