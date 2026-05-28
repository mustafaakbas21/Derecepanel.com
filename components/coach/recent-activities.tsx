import { Atom, BookOpen, Calculator, Dna } from "lucide-react";

import { recentActivities } from "@/lib/coach/dummy-data";

const activityIcons = {
  math: Calculator,
  turkish: BookOpen,
  physics: Atom,
  bio: Dna,
};

export function RecentActivities() {
  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-[1.35rem] bg-white p-6"
      style={{ boxShadow: "var(--card-shadow)" }}
    >
      <div className="mb-5">
        <h3 className="text-xl font-bold text-slate-900">Son Aktiviteler</h3>
        <p className="mt-0.5 text-[14px] text-slate-400">Öğrenci işlemleri</p>
      </div>

      <ul className="flex flex-1 flex-col gap-1">
        {recentActivities.map((item) => {
          const Icon = activityIcons[item.icon];
          return (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-2xl px-2 py-3 transition-colors hover:bg-slate-50"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                style={{ background: item.iconBg }}
              >
                <Icon className="h-4 w-4" style={{ color: item.iconColor }} strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold text-slate-800">{item.title}</p>
                <p className="truncate text-[13px] text-slate-400">
                  {item.subtitle} · {item.time}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[14px] font-bold text-slate-800">{item.amount}</p>
                <p className="text-[12px] text-slate-400">{item.secondary}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
