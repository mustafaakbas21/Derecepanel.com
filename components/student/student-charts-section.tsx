"use client";

import { StudentDashboardWeeklyProgram } from "@/components/student/student-dashboard-weekly-program";
import { StudentNetTrendChart } from "@/components/student/student-net-trend-chart";
import { StudentUpcomingAppointments } from "@/components/student/student-upcoming-appointments";
import { StudentUpcomingExamsCompact } from "@/components/student/student-upcoming-exams-compact";

export function StudentChartsSection() {
  return (
    <div className="grid gap-5 lg:grid-cols-3 lg:items-start">
      <div className="flex min-w-0 flex-col gap-5 lg:col-span-2">
        <StudentNetTrendChart />
        <StudentDashboardWeeklyProgram />
      </div>
      <div className="flex flex-col gap-5">
        <StudentUpcomingAppointments />
        <StudentUpcomingExamsCompact />
      </div>
    </div>
  );
}
