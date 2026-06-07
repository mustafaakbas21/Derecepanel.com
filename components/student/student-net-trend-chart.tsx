"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useStudentExamResults } from "@/lib/student/use-student-exam-results";
import Link from "next/link";
import { STUDENT_DENEME_ROUTES } from "@/lib/student/sidebar-nav-config";

function NetTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; payload?: { examName?: string } }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const examName = payload[0]?.payload?.examName;
  return (
    <div
      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg"
      style={{ boxShadow: "0 8px 24px rgba(15,23,42,0.12)" }}
    >
      <p className="font-semibold text-slate-900">{label}</p>
      {examName ? <p className="text-xs text-slate-500">{examName}</p> : null}
      <p className="text-slate-600">{payload[0]?.value} net</p>
    </div>
  );
}

export function StudentNetTrendChart() {
  const { netTrend, hydrated } = useStudentExamResults();
  const hasData = netTrend.length > 0;

  return (
    <div
      className="flex min-h-[320px] flex-col rounded-[1.35rem] bg-white p-6"
      style={{ boxShadow: "var(--card-shadow)" }}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Net Gelişimim</h3>
          <p className="mt-0.5 text-[14px] text-slate-400" suppressHydrationWarning>
            {hydrated
              ? hasData
                ? `Son ${netTrend.length} deneme sonucu`
                : "Henüz deneme sonucu yok"
              : "Yükleniyor…"}
          </p>
        </div>
        {hasData ? (
          <p className="text-2xl font-bold tabular-nums text-slate-900">
            {netTrend[netTrend.length - 1]!.net}
            <span className="ml-1 text-sm font-medium text-slate-400">son net</span>
          </p>
        ) : null}
      </div>

      {!hydrated ? (
        <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
          Yükleniyor…
        </div>
      ) : !hasData ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-12 text-center">
          <p className="text-[15px] font-semibold text-slate-700">Deneme sonucu bulunamadı</p>
          <p className="mt-1 text-[13px] text-slate-400">
            Sonuç Merkezi&apos;ne yüklenen denemeleriniz burada grafik olarak görünür.
          </p>
          <Link
            href={STUDENT_DENEME_ROUTES.sonuclar}
            className="mt-4 text-[13px] font-semibold text-slate-700 hover:text-slate-900"
          >
            Sonuçlarım →
          </Link>
        </div>
      ) : (
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={netTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={0}
              />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                domain={["dataMin - 5", "dataMax + 5"]}
              />
              <Tooltip content={<NetTooltip />} />
              <Line
                type="monotone"
                dataKey="net"
                stroke="#0f172a"
                strokeWidth={2.5}
                dot={{ fill: "#f97316", stroke: "#fff", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: "#f97316" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
