"use client";

import { CalendarRange, FileText, ListChecks, TrendingUp } from "lucide-react";

import { useStudentDashboardStats } from "@/lib/student/use-student-dashboard-stats";

export function StudentSummaryCards() {
  const {
    examHydrated,
    homeworkHydrated,
    konuHydrated,
    lastExam,
    homework,
    upcomingExamCount,
    topicSummary,
    topicPercent,
  } = useStudentDashboardStats();

  const cards = [
    {
      key: "net",
      label: "Son Deneme Net Ort.",
      value: examHydrated && lastExam ? lastExam.net.toFixed(1) : "—",
      sublabel:
        examHydrated && lastExam
          ? `Son ${lastExam.sinav} denemesi`
          : "Sonuç bekleniyor",
      icon: TrendingUp,
    },
    {
      key: "program",
      label: "Bu Hafta Program",
      value: homeworkHydrated
        ? homework.total > 0
          ? `${homework.done}/${homework.total}`
          : "0/0"
        : "—",
      sublabel: !homeworkHydrated
        ? "Yükleniyor…"
        : homework.total > 0
          ? homework.source === "coach"
            ? "Koç programı görevleri"
            : "Bireysel program görevleri"
          : "Bu hafta program yok",
      icon: CalendarRange,
    },
    {
      key: "exams",
      label: "Yaklaşan Deneme",
      value: examHydrated ? String(upcomingExamCount) : "—",
      sublabel: examHydrated
        ? upcomingExamCount > 0
          ? "Planlanmış sınav"
          : "Planlanmış deneme yok"
        : "Yükleniyor…",
      icon: FileText,
    },
    {
      key: "topics",
      label: "Konu Tamamlama",
      value: konuHydrated
        ? topicSummary.totalTopics > 0
          ? `%${topicPercent}`
          : "—"
        : "—",
      sublabel: konuHydrated
        ? topicSummary.totalTopics > 0
          ? `${topicSummary.doneTopics}/${topicSummary.totalTopics} konu bitti`
          : "Müfredat verisi yok"
        : "Yükleniyor…",
      icon: ListChecks,
    },
  ];

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.key}
            className="relative overflow-hidden rounded-[1.35rem] bg-white p-6"
            style={{ boxShadow: "var(--card-shadow)" }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[15px] font-medium text-slate-500">{c.label}</p>
                <p className="mt-2 text-[2.125rem] font-bold leading-none tracking-tight text-slate-900">
                  {c.value}
                </p>
                <p className="mt-2 text-[13px] text-slate-400">{c.sublabel}</p>
              </div>
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl"
                style={{ background: "#fff7ed" }}
              >
                <Icon className="h-5 w-5 text-orange-500" strokeWidth={2} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
