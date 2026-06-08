import { loadCoaches } from "@/lib/admin/coach-storage";
import { loadStudentsFull } from "@/lib/students/storage";
import type { StudentRecord } from "@/lib/students/types";

export type MonthlyRegistration = {
  month: string;
  label: string;
  count: number;
};

export type StatusBreakdown = {
  aktif: number;
  donduruldu: number;
  mezun: number;
  other: number;
};

export type SegmentItem = {
  label: string;
  value: number;
  color: string;
};

export type AdminDashboardStats = {
  totalCoaches: number;
  activeCoaches: number;
  totalStudents: number;
  activeStudents: number;
  studentsWithPanel: number;
  recentStudents: number;
  studentTrendPercent: number;
  monthlyRegistrations: MonthlyRegistration[];
  statusBreakdown: StatusBreakdown;
  segmentProgress: SegmentItem[];
};

const MONTH_LABELS = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
];

export function buildMonthlyRegistrations(students: StudentRecord[]): MonthlyRegistration[] {
  const now = new Date();
  const buckets: MonthlyRegistration[] = [];

  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.push({
      month: key,
      label: MONTH_LABELS[d.getMonth()] ?? key,
      count: 0,
    });
  }

  for (const s of students) {
    if (!s.kayitDate) continue;
    const d = new Date(s.kayitDate);
    if (Number.isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const bucket = buckets.find((b) => b.month === key);
    if (bucket) bucket.count += 1;
  }

  return buckets;
}

export function buildStatusBreakdown(students: StudentRecord[]): StatusBreakdown {
  const breakdown: StatusBreakdown = {
    aktif: 0,
    donduruldu: 0,
    mezun: 0,
    other: 0,
  };
  for (const s of students) {
    if (s.status === "aktif") breakdown.aktif += 1;
    else if (s.status === "donduruldu") breakdown.donduruldu += 1;
    else if (s.status === "mezun") breakdown.mezun += 1;
    else breakdown.other += 1;
  }
  return breakdown;
}

export function computeAdminStats(): AdminDashboardStats {
  const coaches = loadCoaches();
  const students = loadStudentsFull({ seedIfEmpty: false });

  const activeCoaches = coaches.filter((c) => c.status !== "Pasif").length;
  const activeStudents = students.filter((s) => s.status === "aktif").length;
  const studentsWithPanel = students.filter(
    (s) => String(s.kullaniciAdi || "").trim() && String(s.panelSifre || "").trim()
  ).length;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const recentStudents = students.filter((s) => {
    const d = s.kayitDate ? new Date(s.kayitDate) : null;
    return d && !Number.isNaN(d.getTime()) && d >= thirtyDaysAgo;
  }).length;

  const previousWindow = students.filter((s) => {
    const d = s.kayitDate ? new Date(s.kayitDate) : null;
    return d && !Number.isNaN(d.getTime()) && d >= sixtyDaysAgo && d < thirtyDaysAgo;
  }).length;

  const studentTrendPercent =
    previousWindow > 0
      ? Math.round(((recentStudents - previousWindow) / previousWindow) * 1000) / 10
      : recentStudents > 0
        ? 100
        : 0;

  const total = Math.max(students.length, 1);
  const segmentProgress: SegmentItem[] = [
    { label: "Aktif koç", value: activeCoaches, color: "#0f172a" },
    { label: "Aktif öğrenci", value: activeStudents, color: "#334155" },
    { label: "Panel hesabı", value: studentsWithPanel, color: "#94a3b8" },
  ].map((item) => ({
    ...item,
    value: Math.round((item.value / total) * 100),
  }));

  return {
    totalCoaches: coaches.length,
    activeCoaches,
    totalStudents: students.length,
    activeStudents,
    studentsWithPanel,
    recentStudents,
    studentTrendPercent,
    monthlyRegistrations: buildMonthlyRegistrations(students),
    statusBreakdown: buildStatusBreakdown(students),
    segmentProgress,
  };
}
