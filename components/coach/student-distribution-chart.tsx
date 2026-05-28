"use client";

import Link from "next/link";
import { useMemo } from "react";
import { MoreHorizontal } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import {
  computeStudentDistribution,
  studentsForDistribution,
  type DistributionSlice,
} from "@/lib/coach/student-distribution";
import { useStudentsFull } from "@/lib/students/use-students-full";
import { cn } from "@/lib/utils";

function studentCountLabel(n: number) {
  return n === 1 ? "1 öğrenci" : `${n} öğrenci`;
}

function DistributionTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: DistributionSlice }[];
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div
      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg"
      style={{ boxShadow: "0 8px 24px rgba(15,23,42,0.12)" }}
    >
      <p className="font-semibold text-slate-900">{row.label}</p>
      <p className="text-slate-500">
        {studentCountLabel(row.count)} · %{row.percent}
      </p>
    </div>
  );
}

function DistributionRow({ slice }: { slice: DistributionSlice }) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-100 py-3.5 last:border-0">
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: slice.color }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold text-slate-900">{slice.label}</p>
        <p className="text-[13px] text-slate-400">{studentCountLabel(slice.count)}</p>
      </div>
      <p className="shrink-0 text-lg font-bold tabular-nums text-slate-900">
        %{slice.percent}
      </p>
    </div>
  );
}

export function StudentDistributionChart() {
  const { students, hydrated } = useStudentsFull({ seedIfEmpty: true });

  const counted = useMemo(() => studentsForDistribution(students), [students]);
  const slices = useMemo(() => computeStudentDistribution(students), [students]);
  const total = counted.length;
  const chartData = slices.filter((s) => s.count > 0);

  const pieData: DistributionSlice[] =
    chartData.length > 0
      ? chartData
      : [
          {
            field: "sayisal",
            label: "",
            count: 1,
            percent: 0,
            color: "#e2e8f0",
          },
        ];

  return (
    <div
      className="h-full overflow-hidden rounded-[1.35rem] bg-white p-6"
      style={{ boxShadow: "var(--card-shadow)" }}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-xl font-bold text-slate-900">Öğrenci dağılımı</h3>
          <p className="mt-1 text-[14px] leading-snug text-slate-500">
            Öğrencilerim listesiyle aynı kayıtlar; alan sekmelerindeki sayılarla uyumludur.
          </p>
        </div>
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
          aria-label="Grafik seçenekleri"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {!hydrated ? (
        <div className="h-[260px] animate-pulse rounded-xl bg-slate-100" />
      ) : total === 0 ? (
        <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 text-center">
          <p className="font-semibold text-slate-900">Henüz öğrenci kaydı yok</p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Öğrenci ekledikçe veya içe aktardıkça alan dağılımı burada güncellenir.
          </p>
          <Link
            href="/dashboard/ogrencilerim"
            className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Öğrencilere git →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div
            className="relative mx-auto h-[220px] w-full max-w-[240px] shrink-0 lg:mx-0 lg:h-[260px] lg:max-w-[280px]"
            role="img"
            aria-label="Öğrenci alan dağılımı grafiği"
          >
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius="58%"
                  outerRadius="88%"
                  paddingAngle={chartData.length > 1 ? 2 : 0}
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.field}
                      fill={entry.color}
                      className={cn(chartData.length === 0 && "opacity-60")}
                    />
                  ))}
                </Pie>
                <Tooltip content={<DistributionTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-900">{total}</span>
              <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                öğrenci
              </span>
            </div>
          </div>

          <div className="min-w-0 flex-1 lg:pl-2">
            {slices.map((slice) => (
              <DistributionRow key={slice.field} slice={slice} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
