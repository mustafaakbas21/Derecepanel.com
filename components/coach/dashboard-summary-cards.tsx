"use client";

import { ArrowDownLeft, CreditCard, Wallet } from "lucide-react";

import { UpcomingAppointmentsCard } from "@/components/coach/upcoming-appointments-card";
import { summaryStats } from "@/lib/coach/dummy-data";

const icons = {
  wallet: Wallet,
  card: CreditCard,
  export: ArrowDownLeft,
};

export function DashboardSummaryCards() {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {summaryStats.map((stat) => {
        const Icon = icons[stat.icon];
        return (
          <div
            key={stat.label}
            className="relative overflow-hidden rounded-[1.35rem] bg-white p-6"
            style={{ boxShadow: "var(--card-shadow)" }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[15px] font-medium text-slate-500">{stat.label}</p>
                <p className="mt-2 text-[2.125rem] font-bold leading-none tracking-tight text-slate-900">
                  {stat.value}
                </p>
                <p className="mt-2 text-[13px] text-slate-400">{stat.sublabel}</p>
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
      <UpcomingAppointmentsCard />
    </div>
  );
}
