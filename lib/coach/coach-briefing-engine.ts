import "server-only";

import type { Appointment } from "@/lib/appointments/types";
import type { CoachBriefingSyncPayload } from "@/lib/coach/coach-briefing-sync";
import type {
  BriefingAppointment,
  BriefingCompletedItem,
  BriefingPendingItem,
  BriefingRadarStudent,
  OnyxCoachBriefingData,
} from "@/lib/coach/briefing-types";
import type { ExamResultRow, MergedExam } from "@/lib/exams/types";
import type { StudentRecord } from "@/lib/students/types";

const MS_DAY = 24 * 60 * 60 * 1000;
const NET_DROP_THRESHOLD = 0.1;
const INACTIVE_DAYS = 7;
const RECENT_PACKAGE_DAYS = 7;

export type CoachBriefingFacts = {
  appointmentCount: number;
  radarCount: number;
  pendingAnalysisCount: number;
  upcomingExamName?: string;
  upcomingExamDays?: number;
  firstAppointment?: { time: string; studentName: string };
  radarHighlights: string[];
};

function todayIsoLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseTimeMinutes(saat: string): number {
  const [h, m] = String(saat || "0:0").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function coachStudents(
  coachId: string,
  students: StudentRecord[]
): StudentRecord[] {
  return students.filter(
    (s) =>
      s.status === "aktif" &&
      String(s.coachId || "").trim() === String(coachId).trim()
  );
}

function studentIdsForCoach(students: StudentRecord[]): Set<string> {
  const set = new Set<string>();
  for (const s of students) {
    if (s.ogrenciId) set.add(String(s.ogrenciId));
    if (s.studentCode) set.add(String(s.studentCode));
  }
  return set;
}

function rowBelongsToStudent(row: ExamResultRow, allow: Set<string>): boolean {
  const sid = String(row.studentId || "").trim();
  const code = String(row.studentCode || "").trim();
  return (
    (Boolean(sid) && allow.has(sid)) || (Boolean(code) && allow.has(code))
  );
}

export function buildTodayAppointments(
  appointments: Appointment[],
  coachStudentIds?: Set<string>
): BriefingAppointment[] {
  const today = todayIsoLocal();
  return appointments
    .filter((a) => {
      if (String(a.tarih || "").slice(0, 10) !== today) return false;
      if (a.status === "iptal") return false;
      if (!coachStudentIds || coachStudentIds.size === 0) return true;
      const sid = String(a.studentId || "").trim();
      const nameKey = String(a.ogrenci || "").trim();
      return (
        (Boolean(sid) && coachStudentIds.has(sid)) ||
        (Boolean(nameKey) && coachStudentIds.has(nameKey))
      );
    })
    .sort(
      (a, b) => parseTimeMinutes(a.saat) - parseTimeMinutes(b.saat)
    )
    .map((a) => ({
      id: a.id,
      time: a.saat || "—",
      studentName: a.ogrenci || "Öğrenci",
      href: "/dashboard/randevular",
    }));
}

function resultsForStudent(
  student: StudentRecord,
  results: ExamResultRow[]
): ExamResultRow[] {
  const sid = String(student.ogrenciId || "");
  const code = String(student.studentCode || "");
  return results
    .filter(
      (r) =>
        String(r.studentId || "") === sid ||
        String(r.studentCode || "") === code
    )
    .filter((r) => r.net != null && Number.isFinite(Number(r.net)))
    .sort(
      (a, b) =>
        Date.parse(b.savedAt || "") - Date.parse(a.savedAt || "")
    );
}

export function buildRadarStudents(
  coachId: string,
  students: StudentRecord[],
  results: ExamResultRow[]
): BriefingRadarStudent[] {
  const scoped = coachStudents(coachId, students);
  const allow = studentIdsForCoach(scoped);
  const scopedResults = results.filter((r) => rowBelongsToStudent(r, allow));
  const now = Date.now();
  const radar: BriefingRadarStudent[] = [];

  for (const student of scoped) {
    const name = student.name?.trim() || student.ogrenciId;
    const sid = student.ogrenciId;
    const rows = resultsForStudent(student, scopedResults);

    if (rows.length >= 2) {
      const latest = Number(rows[0]!.net);
      const previous = Number(rows[1]!.net);
      if (previous > 0) {
        const dropPct = ((previous - latest) / previous) * 100;
        if (dropPct >= NET_DROP_THRESHOLD * 100) {
          radar.push({
            id: `drop-${sid}`,
            name,
            alert: `Son 2 denemede net %${dropPct.toFixed(0)} düştü (${previous.toFixed(1)} → ${latest.toFixed(1)})`,
            severity: dropPct >= 20 ? "critical" : "warning",
            href: `/dashboard/onyx?student=${encodeURIComponent(sid)}`,
          });
          continue;
        }
      }
    }

    const lastSaved = rows[0]?.savedAt
      ? Date.parse(rows[0].savedAt)
      : NaN;
    const daysSince =
      Number.isFinite(lastSaved) && lastSaved > 0
        ? Math.floor((now - lastSaved) / MS_DAY)
        : null;

    if (daysSince == null || daysSince >= INACTIVE_DAYS) {
      radar.push({
        id: `inactive-${sid}`,
        name,
        alert:
          daysSince == null
            ? `${INACTIVE_DAYS} günden uzun süredir deneme sonucu yok`
            : `${daysSince} gündür yeni deneme sonucu girilmedi`,
        severity: daysSince != null && daysSince >= 14 ? "critical" : "warning",
        href: "/dashboard/ogrencilerim",
      });
    }
  }

  const severityOrder = { critical: 0, warning: 1 };
  return radar
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
    .slice(0, 8);
}

function countRecentResultStudents(
  packages: CoachBriefingSyncPayload["examPackages"],
  allow: Set<string>,
  withinDays: number
): number {
  const cutoff = Date.now() - withinDays * MS_DAY;
  const students = new Set<string>();
  for (const pkg of packages) {
    if (Date.parse(pkg.savedAt || "") < cutoff) continue;
    for (const item of pkg.items as Array<{ studentId?: string }>) {
      const sid = String(item?.studentId || "").trim();
      if (sid && allow.has(sid)) students.add(sid);
    }
  }
  return students.size;
}

function findUpcomingExam(
  mergedExams: MergedExam[]
): { name: string; daysUntil: number } | null {
  const now = Date.now();
  let best: { name: string; daysUntil: number; ts: number } | null = null;
  for (const e of mergedExams) {
    const ts = Date.parse(e.tarih || e.date || "");
    if (!Number.isFinite(ts) || ts < now) continue;
    const daysUntil = Math.ceil((ts - now) / MS_DAY);
    if (daysUntil > 14) continue;
    if (!best || ts < best.ts) {
      best = {
        name: e.ad || e.name || e.id,
        daysUntil,
        ts,
      };
    }
  }
  return best ? { name: best.name, daysUntil: best.daysUntil } : null;
}

export function buildPendingItems(
  coachId: string,
  students: StudentRecord[],
  packages: CoachBriefingSyncPayload["examPackages"],
  mergedExams: MergedExam[]
): BriefingPendingItem[] {
  const scoped = coachStudents(coachId, students);
  const allow = studentIdsForCoach(scoped);
  const pending: BriefingPendingItem[] = [];

  const recentCount = countRecentResultStudents(
    packages,
    allow,
    RECENT_PACKAGE_DAYS
  );
  if (recentCount > 0) {
    pending.push({
      id: "pending-analysis",
      label: "Analiz bekleyenler",
      detail: `${recentCount} öğrenci son ${RECENT_PACKAGE_DAYS} günde yeni deneme sonucu girdi; analiz onayınızı bekliyor olabilir.`,
      href: "/dashboard/denemeler/sonuc-merkezi",
      actionLabel: "İncele",
    });
  }

  const upcoming = findUpcomingExam(mergedExams);
  if (upcoming) {
    pending.push({
      id: "pending-exam",
      label: "Yaklaşan deneme",
      detail: `${upcoming.name} — ${upcoming.daysUntil} gün içinde. Öğrencilerinizi deneme takvimine göre yönlendirin.`,
      href: "/dashboard/denemeler",
      actionLabel: "İncele",
    });
  }

  return pending;
}

export function buildCompletedItems(
  packages: CoachBriefingSyncPayload["examPackages"]
): BriefingCompletedItem[] {
  const cutoff48h = Date.now() - 2 * MS_DAY;
  const recent = packages.filter(
    (p) => Date.parse(p.savedAt || "") >= cutoff48h
  );
  if (recent.length === 0) return [];

  const totalRows = recent.reduce((sum, p) => sum + (p.count || 0), 0);
  return [
    {
      id: "done-uploads",
      label: `Son 48 saatte ${recent.length} deneme sonucu paketi yüklendi (${totalRows} satır).`,
    },
  ];
}

export function buildCoachBriefingFacts(
  coachId: string,
  payload: CoachBriefingSyncPayload
): CoachBriefingFacts {
  const scoped = coachStudents(coachId, payload.students);
  const allow = studentIdsForCoach(scoped);
  const appointments = buildTodayAppointments(payload.appointments, allow);
  const radar = buildRadarStudents(
    coachId,
    payload.students,
    payload.examResults
  );
  const pendingCount = countRecentResultStudents(
    payload.examPackages,
    allow,
    RECENT_PACKAGE_DAYS
  );
  const upcoming = findUpcomingExam(payload.mergedExams);

  return {
    appointmentCount: appointments.length,
    radarCount: radar.length,
    pendingAnalysisCount: pendingCount,
    upcomingExamName: upcoming?.name,
    upcomingExamDays: upcoming?.daysUntil,
    firstAppointment: appointments[0]
      ? {
          time: appointments[0].time,
          studentName: appointments[0].studentName,
        }
      : undefined,
    radarHighlights: radar.slice(0, 3).map((r) => `${r.name}: ${r.alert}`),
  };
}

export function assembleBriefingFromPayload(
  coachId: string,
  payload: CoachBriefingSyncPayload,
  briefingText: string,
  source: string
): OnyxCoachBriefingData {
  const allow = studentIdsForCoach(coachStudents(coachId, payload.students));
  return {
    briefingText,
    appointments: buildTodayAppointments(payload.appointments, allow),
    pending: buildPendingItems(
      coachId,
      payload.students,
      payload.examPackages,
      payload.mergedExams
    ),
    completed: buildCompletedItems(payload.examPackages),
    radar: buildRadarStudents(coachId, payload.students, payload.examResults),
    source,
    generatedAt: new Date().toISOString(),
  };
}

export function fallbackBriefingText(facts: CoachBriefingFacts): string {
  const parts: string[] = [];
  if (facts.appointmentCount > 0) {
    const first = facts.firstAppointment;
    parts.push(
      first
        ? `Bugün ${facts.appointmentCount} randevun var; ilki saat ${first.time} — ${first.studentName}.`
        : `Bugün ${facts.appointmentCount} randevun var.`
    );
  } else {
    parts.push("Bugün takviminde randevu görünmüyor.");
  }

  if (facts.radarCount > 0) {
    parts.push(
      `Radarda ${facts.radarCount} öğrenci dikkat gerektiriyor; öncelikle net düşüşü veya uzun süredir sonuç girmeyenleri incele.`
    );
  } else {
    parts.push("Radarda acil müdahale gerektiren öğrenci tespit edilmedi.");
  }

  if (facts.pendingAnalysisCount > 0) {
    parts.push(
      `Son bir haftada ${facts.pendingAnalysisCount} öğrencinin yeni deneme sonucu var — Sonuç Merkezi'nden analiz akışını tamamla.`
    );
  }

  return parts.slice(0, 3).join(" ");
}
