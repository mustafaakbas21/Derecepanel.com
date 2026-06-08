import "server-only";

import {
  buildMonthlyRegistrations,
  buildStatusBreakdown,
  type AdminDashboardStats,
} from "@/lib/admin/admin-stats";
import { loadPlatformCoaches } from "@/lib/admin/coaches-server";
import { getPlatformData } from "@/lib/admin/platform-store-server";
import { STORAGE_KEY } from "@/lib/students/constants";
import type { StudentRecord } from "@/lib/students/types";
import {
  normalizeStudentStatus,
  normalizeStudyField,
} from "@/lib/students/normalize-field";

function parseStudents(raw: string | null): StudentRecord[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((row) => {
      const s = row as StudentRecord;
      return {
        ...s,
        alan: normalizeStudyField(s.alan),
        status: normalizeStudentStatus(s.status),
      };
    });
  } catch {
    return [];
  }
}

export async function computeAdminStatsFromPlatform(): Promise<AdminDashboardStats> {
  const [coaches, studentsRaw] = await Promise.all([
    loadPlatformCoaches(),
    getPlatformData(STORAGE_KEY),
  ]);
  const students = parseStudents(studentsRaw);

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
    segmentProgress: [
      { label: "Aktif koç", value: activeCoaches, color: "#0f172a" },
      { label: "Aktif öğrenci", value: activeStudents, color: "#334155" },
      { label: "Panel hesabı", value: studentsWithPanel, color: "#94a3b8" },
    ].map((item) => ({
      ...item,
      value: Math.round((item.value / total) * 100),
    })),
  };
}
