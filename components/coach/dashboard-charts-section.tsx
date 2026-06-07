"use client";

import dynamic from "next/dynamic";

import { UpcomingAppointments } from "@/components/coach/upcoming-appointments";

const StudentDistributionChart = dynamic(
  () =>
    import("@/components/coach/student-distribution-chart").then(
      (m) => m.StudentDistributionChart
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-full min-h-[320px] rounded-[1.35rem] bg-white"
        style={{ boxShadow: "var(--card-shadow)" }}
      />
    ),
  }
);

export function DashboardChartsSection() {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <StudentDistributionChart />
      </div>
      <div className="lg:col-span-1">
        <UpcomingAppointments />
      </div>
    </div>
  );
}
