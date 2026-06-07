"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import { formatTry, type MonthlyFinance } from "@/lib/admin/accounting";
import type { MonthlyRegistration, StatusBreakdown } from "@/lib/admin/admin-stats";

type ScatterPoint = MonthlyRegistration & { size: number; x: number; y: number };

function ScatterTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: ScatterPoint }[];
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg">
      <p className="font-semibold text-slate-900">{row.label}</p>
      <p className="text-slate-500">{row.count} kayıt</p>
    </div>
  );
}

export function AdminRegistrationScatter({ data }: { data: MonthlyRegistration[] }) {
  const points: ScatterPoint[] = data.map((d, i) => ({
    ...d,
    size: Math.max(d.count * 8, 40),
    x: i + 1,
    y: d.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ScatterChart margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
        <XAxis
          type="number"
          dataKey="x"
          tickFormatter={(v) => data[Number(v) - 1]?.label ?? ""}
          domain={[0.5, 12.5]}
          ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]}
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#94a3b8", fontSize: 12 }}
        />
        <YAxis
          type="number"
          dataKey="y"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#94a3b8", fontSize: 12 }}
          width={32}
        />
        <ZAxis type="number" dataKey="size" range={[60, 400]} />
        <Tooltip content={<ScatterTooltip />} />
        <Scatter data={points} fill="#0f172a" fillOpacity={0.85} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

const STATUS_COLORS = {
  aktif: "#0f172a",
  donduruldu: "#f59e0b",
  mezun: "#64748b",
  other: "#cbd5e1",
};

const STATUS_LABELS = {
  aktif: "Aktif",
  donduruldu: "Donduruldu",
  mezun: "Mezun",
  other: "Diğer",
};

export function AdminStatusRadial({ breakdown }: { breakdown: StatusBreakdown }) {
  const total =
    breakdown.aktif + breakdown.donduruldu + breakdown.mezun + breakdown.other;
  const rows = (["aktif", "donduruldu", "mezun", "other"] as const)
    .map((key) => ({
      name: STATUS_LABELS[key],
      key,
      value: breakdown[key],
      fill: STATUS_COLORS[key],
    }))
    .filter((r) => r.value > 0);

  return (
    <div className="space-y-4">
      <div className="relative mx-auto h-[200px] w-full max-w-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="30%"
            outerRadius="100%"
            data={rows}
            startAngle={180}
            endAngle={0}
            cx="50%"
            cy="85%"
          >
            <RadialBar dataKey="value" cornerRadius={4} background={{ fill: "#f1f5f9" }} />
            {rows.map((row) => (
              <Cell key={row.key} fill={row.fill} />
            ))}
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-x-0 bottom-6 text-center">
          <p className="text-2xl font-bold tabular-nums text-slate-900">{total}</p>
          <p className="text-xs text-slate-500">Toplam öğrenci</p>
        </div>
      </div>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: row.fill }} />
              {row.name}
            </div>
            <span className="font-semibold text-slate-900">{row.value}</span>
          </div>
        ))}
      </div>
      {total > 0 && breakdown.aktif > 0 ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
          %{Math.round((breakdown.aktif / total) * 100)} aktif öğrenci oranı
        </p>
      ) : null}
    </div>
  );
}

function FinanceTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg">
      <p className="mb-1 font-semibold text-slate-900">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-slate-600">
          {p.name}: {formatTry(p.value)}
        </p>
      ))}
    </div>
  );
}

export function AdminFinanceBarChart({ data }: { data: MonthlyFinance[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#94a3b8", fontSize: 12 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#94a3b8", fontSize: 12 }}
          tickFormatter={(v) => `${Math.round(Number(v) / 1000)}K`}
          width={40}
        />
        <Tooltip content={<FinanceTooltip />} />
        <Legend />
        <Bar dataKey="income" name="Gelir" fill="#0f172a" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" name="Gider" fill="#94a3b8" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AdminFinanceNetChart({ data }: { data: MonthlyFinance[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#94a3b8", fontSize: 11 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#94a3b8", fontSize: 11 }}
          tickFormatter={(v) => `${Math.round(Number(v) / 1000)}K`}
          width={36}
        />
        <Tooltip
          formatter={(value) => formatTry(Number(value ?? 0))}
          labelFormatter={(label) => String(label)}
        />
        <Bar
          dataKey="net"
          name="Net"
          fill="#334155"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
