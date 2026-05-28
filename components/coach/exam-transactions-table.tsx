import { ArrowDownRight, ArrowUpRight, ChevronDown, Search } from "lucide-react";

import { examTransactions } from "@/lib/coach/dummy-data";
import { cn } from "@/lib/utils";

export function ExamTransactionsTable() {
  return (
    <div
      className="overflow-hidden rounded-[1.35rem] bg-white p-6"
      style={{ boxShadow: "var(--card-shadow)" }}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Deneme Geçmişi</h3>
          <p className="mt-0.5 text-[14px] text-slate-400">Tüm öğrenci deneme kayıtları</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Deneme numarası ara..."
              className="h-11 w-60 rounded-full border border-slate-100 bg-slate-50 pl-10 pr-4 text-[15px] text-slate-700 outline-none transition focus:border-orange-200 focus:bg-white focus:ring-2 focus:ring-orange-500/10"
            />
          </div>
          <button
            type="button"
            className="flex h-11 items-center gap-2 rounded-full border border-slate-100 bg-slate-50 px-4 text-[15px] font-semibold text-slate-600 transition hover:bg-white"
          >
            Tür Seç
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-left">
              <th className="pb-3 pr-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                İşlem
              </th>
              <th className="pb-3 pr-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Deneme No
              </th>
              <th className="pb-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Sonuç
              </th>
            </tr>
          </thead>
          <tbody>
            {examTransactions.map((row) => (
              <tr
                key={row.id}
                className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50/60"
              >
                <td className="py-4 pr-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                        row.direction === "up" ? "bg-green-50" : "bg-red-50"
                      )}
                    >
                      {row.direction === "up" ? (
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold text-slate-800">{row.type}</p>
                      <p className="text-[13px] text-slate-400">
                        {row.student} · {row.date}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-4 pr-4">
                  <span className="text-[15px] font-medium text-slate-500">{row.id}</span>
                </td>
                <td className="py-4 text-right">
                  <p className="text-[15px] font-bold text-slate-900">{row.amount}</p>
                  <p className="text-[13px] text-slate-400">{row.balance}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
