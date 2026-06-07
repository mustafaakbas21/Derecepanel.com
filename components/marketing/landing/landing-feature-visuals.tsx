/** Mini UI mockups for Edens-style bento feature cards */

import type { ReactNode } from "react";

function VisualShell({ children }: { children: ReactNode }) {
  return (
    <div className="mb-6 flex h-44 items-center justify-center overflow-hidden rounded-xl bg-slate-50/80 p-4 ring-1 ring-slate-100">
      {children}
    </div>
  );
}

export function FeatureVisual({ id }: { id: string }) {
  switch (id) {
    case "onyx-ai":
      return (
        <VisualShell>
          <div className="w-full max-w-[260px] space-y-2.5">
            <div className="flex gap-2">
              <div className="h-8 w-8 shrink-0 rounded-full bg-orange-100" />
              <div className="flex-1 rounded-2xl rounded-tl-sm bg-white px-3 py-2 shadow-sm ring-1 ring-slate-100">
                <div className="h-1.5 w-24 rounded bg-slate-200" />
                <div className="mt-1.5 h-1.5 w-32 rounded bg-slate-100" />
              </div>
            </div>
            <div className="ml-10 rounded-2xl rounded-tr-sm bg-slate-900 px-3 py-2.5 shadow-sm">
              <div className="h-1.5 w-28 rounded bg-slate-600" />
              <div className="mt-1.5 h-1.5 w-20 rounded bg-slate-700" />
              <div className="mt-2 flex gap-1">
                <span className="h-4 w-10 rounded bg-orange-500/80" />
                <span className="h-4 w-8 rounded bg-slate-700" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-8 shrink-0 rounded-full bg-orange-100" />
              <div className="flex-1 rounded-2xl rounded-tl-sm bg-white px-3 py-2 shadow-sm ring-1 ring-slate-100">
                <div className="h-1.5 w-20 rounded bg-slate-200" />
              </div>
            </div>
          </div>
        </VisualShell>
      );

    case "otonom-program":
      return (
        <VisualShell>
          <div className="grid w-full max-w-[260px] grid-cols-7 gap-1">
            {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((d) => (
              <div key={d} className="text-center text-[8px] font-semibold text-slate-400">
                {d}
              </div>
            ))}
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="flex min-h-[52px] flex-col gap-1 rounded-lg bg-white p-1.5 shadow-sm ring-1 ring-slate-100"
              >
                {[0.6, 0.4, 0.8][i % 3] && (
                  <>
                    <div
                      className="rounded bg-emerald-100"
                      style={{ height: `${[60, 40, 80][i % 3]}%`, minHeight: 8 }}
                    />
                    <div className="h-1 w-full rounded bg-slate-100" />
                  </>
                )}
              </div>
            ))}
          </div>
        </VisualShell>
      );

    case "deneme-analiz":
      return (
        <VisualShell>
          <div className="w-full max-w-[260px]">
            <div className="mb-2 flex items-end justify-between gap-1">
              {[35, 48, 42, 55, 50, 62, 58, 70, 65, 78, 72, 86].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-gradient-to-t from-blue-500 to-blue-300"
                  style={{ height: `${h * 0.55}px` }}
                />
              ))}
            </div>
            <div className="flex justify-between text-[8px] text-slate-400">
              <span>Oca</span>
              <span>Haz</span>
              <span>Ara</span>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-1">
              {["Mat", "Fiz", "Kim", "Bio"].map((s, i) => (
                <div key={s} className="rounded bg-white p-1.5 text-center shadow-sm ring-1 ring-slate-100">
                  <p className="text-[7px] font-bold text-slate-500">{s}</p>
                  <p className="text-[10px] font-bold text-slate-900">{[72, 58, 84, 76][i]}</p>
                </div>
              ))}
            </div>
          </div>
        </VisualShell>
      );

    case "session-room":
      return (
        <VisualShell>
          <div className="relative flex w-full max-w-[260px] items-center justify-center">
            <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="5" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#f97316"
                strokeWidth="5"
                strokeDasharray="200 264"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <p className="text-lg font-bold text-slate-900">42:00</p>
              <p className="text-[9px] font-semibold text-orange-500">CANLI</p>
            </div>
            <div className="absolute -bottom-1 flex gap-1">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-6 w-6 rounded-full bg-slate-200 ring-2 ring-white" />
              ))}
            </div>
          </div>
        </VisualShell>
      );

    case "hata-recetesi":
      return (
        <VisualShell>
          <div className="w-full max-w-[240px] space-y-2">
            {[
              { label: "Fizik — Kuvvet", pct: 85, color: "bg-red-400" },
              { label: "Mat — Türev", pct: 60, color: "bg-orange-400" },
              { label: "Kim — Asit-Baz", pct: 40, color: "bg-amber-300" },
            ].map((row) => (
              <div key={row.label} className="rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-slate-100">
                <div className="mb-1.5 flex justify-between text-[9px]">
                  <span className="font-semibold text-slate-600">{row.label}</span>
                  <span className="font-bold text-slate-900">{row.pct}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${row.color}`} style={{ width: `${row.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </VisualShell>
      );

    case "yks-sim":
      return (
        <VisualShell>
          <div className="w-full max-w-[260px] space-y-2">
            <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-slate-500">TYT Puan</span>
                <span className="text-sm font-extrabold text-slate-900">412,5</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-[72%] rounded-full bg-emerald-500" />
              </div>
            </div>
            <div className="flex gap-2">
              {["Boğaziçi", "ODTÜ", "İTÜ"].map((u) => (
                <div
                  key={u}
                  className="flex-1 rounded-lg bg-white px-2 py-2 text-center shadow-sm ring-1 ring-slate-100"
                >
                  <p className="text-[8px] font-bold text-slate-900">{u}</p>
                  <p className="mt-0.5 text-[7px] text-emerald-600">Uygun</p>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-1.5 pt-1">
              {["YÖK", "Atlas", "Net"].map((b) => (
                <span
                  key={b}
                  className="rounded-md bg-slate-100 px-2 py-0.5 text-[7px] font-bold text-slate-500"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
        </VisualShell>
      );

    default:
      return (
        <VisualShell>
          <div className="h-20 w-full rounded-lg bg-slate-100" />
        </VisualShell>
      );
  }
}
