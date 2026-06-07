"use client";

import { Scissors } from "lucide-react";

import type { CoachModuleVisual } from "@/lib/marketing/coach-panel-features";

export function ModuleVisual({ type, accent }: { type: CoachModuleVisual; accent: string }) {
  switch (type) {
    case "students":
      return (
        <div className="space-y-2">
          {[
            { init: "AK", name: "Ahmet Kaya", sub: "Boğaziçi / BM", net: "87.5", label: "Yolunda", c: "#15803d", bg: "#f0fdf4" },
            { init: "MÖ", name: "Mert Öztürk", sub: "İTÜ / Mak.", net: "61.5", label: "Dikkat", c: "#b91c1c", bg: "#fef2f2" },
          ].map((s) => (
            <div
              key={s.name}
              className="flex items-center gap-2.5 rounded-xl px-2.5 py-2"
              style={{ background: "#fff", border: "1px solid rgba(226,232,240,0.8)" }}
            >
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${accent}, #fb923c)` }}
              >
                {s.init}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-semibold text-slate-800">{s.name}</p>
                <p className="truncate text-[9px] text-slate-400">{s.sub}</p>
              </div>
              <span className="text-[11px] font-bold text-slate-700">{s.net}</span>
              <span
                className="shrink-0 rounded-md px-1.5 py-0.5 text-[8px] font-semibold"
                style={{ background: s.bg, color: s.c }}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      );

    case "classes":
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }, (_, i) => (
              <div
                key={i}
                className="flex h-7 items-center justify-center rounded-md text-[8px] font-bold"
                style={{
                  background: i === 2 ? `${accent}18` : "#f8fafc",
                  color: i === 2 ? accent : "#94a3b8",
                }}
              >
                {i + 10}
              </div>
            ))}
          </div>
          {[
            { t: "14:00 · Veli görüşmesi", s: "AK" },
            { t: "16:30 · Grup TYT", s: "12 öğr." },
          ].map((row) => (
            <div
              key={row.t}
              className="flex items-center justify-between rounded-xl px-2.5 py-2"
              style={{ background: "#fff", border: "1px solid rgba(226,232,240,0.8)" }}
            >
              <span className="text-[10px] font-semibold text-slate-700">{row.t}</span>
              <span className="text-[9px] font-medium text-slate-400">{row.s}</span>
            </div>
          ))}
        </div>
      );

    case "exams":
      return (
        <div className="rounded-xl border border-slate-100 bg-white p-3">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-[9px] text-slate-400">TYT Matematik · Son Deneme</p>
              <p className="text-lg font-extrabold text-slate-900">
                26.5 <span className="ml-1 text-[11px] font-semibold text-orange-600">+3.2 ↑</span>
              </p>
            </div>
          </div>
          <div className="mb-2 flex h-14 items-end gap-1 rounded-lg border border-slate-100 bg-slate-50 p-2">
            {[14, 17, 19, 21, 20, 23, 27].map((h, i) => (
              <div key={i} className="flex flex-1 flex-col items-center">
                <div
                  className="w-full rounded-t"
                  style={{ height: `${(h / 30) * 100}%`, background: i === 6 ? accent : "#ffedd5" }}
                />
              </div>
            ))}
          </div>
        </div>
      );

    case "results":
      return (
        <div className="space-y-2">
          {[
            { n: "Kurumsal Deneme #14", d: "TYT", s: "Yüklendi" },
            { n: "Global · Mayıs", d: "Full", s: "Bekliyor" },
          ].map((row) => (
            <div
              key={row.n}
              className="flex items-center gap-2 rounded-xl px-2.5 py-2"
              style={{ background: "#fff", border: "1px solid rgba(226,232,240,0.8)" }}
            >
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: accent }} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[10px] font-semibold text-slate-800">{row.n}</p>
                <p className="text-[9px] text-slate-400">{row.d}</p>
              </div>
              <span className="text-[9px] font-bold" style={{ color: accent }}>
                {row.s}
              </span>
            </div>
          ))}
        </div>
      );

    case "analytics":
      return (
        <div className="space-y-1.5">
          {[
            { s: "Mat", v: [0.3, 0.5, 0.7, 0.85] },
            { s: "Fiz", v: [0.4, 0.45, 0.6, 0.72] },
            { s: "Kim", v: [0.7, 0.75, 0.8, 0.9] },
          ].map((row) => (
            <div key={row.s} className="flex items-center gap-1.5">
              <span className="w-6 text-[9px] font-bold text-slate-400">{row.s}</span>
              <div className="flex flex-1 gap-0.5">
                {row.v.map((val, i) => (
                  <div
                    key={i}
                    className="h-4 flex-1 rounded-[3px]"
                    style={{
                      background:
                        val > 0.8 ? accent : val > 0.55 ? "#fdba74" : "#ffedd5",
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      );

    case "topics":
      return (
        <div className="space-y-2">
          {[
            { d: "Mat", done: 72, color: accent },
            { d: "Fiz", done: 58, color: "#fb923c" },
            { d: "Kim", done: 91, color: "#16a34a" },
          ].map((row) => (
            <div key={row.d} className="flex items-center gap-2">
              <span className="w-7 text-right text-[10px] font-bold text-slate-400">{row.d}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full" style={{ width: `${row.done}%`, background: row.color }} />
              </div>
              <span className="w-8 text-[10px] font-bold text-slate-600">%{row.done}</span>
            </div>
          ))}
        </div>
      );

    case "weekly":
      return (
        <div>
          <div className="mb-2 grid grid-cols-7 gap-1">
            {["P", "S", "Ç", "P", "C", "C", "P"].map((d, i) => (
              <div
                key={`${d}-${i}`}
                className="flex h-7 items-center justify-center rounded-lg text-[8px] font-bold"
                style={{
                  background: i === 2 || i === 4 ? `${accent}18` : "#f8fafc",
                  color: i === 2 || i === 4 ? accent : "#94a3b8",
                }}
              >
                {d}
              </div>
            ))}
          </div>
          <div
            className="rounded-xl px-2.5 py-2"
            style={{ background: "#fff", border: "1px solid rgba(226,232,240,0.8)" }}
          >
            <span className="text-[10px] font-semibold text-slate-700">Mat · Türev — 45 dk</span>
          </div>
        </div>
      );

    case "library":
      return (
        <div className="flex items-end justify-center gap-2 py-1">
          {[
            { t: "345", c: accent },
            { t: "TYT", c: "#c2410c" },
          ].map((book, i) => (
            <div
              key={book.t}
              className="flex flex-col items-center justify-end rounded-md px-2 pb-2 pt-5 text-[8px] font-extrabold text-white"
              style={{
                width: 32,
                height: 64 + i * 6,
                background: `linear-gradient(180deg, ${book.c}, ${book.c}cc)`,
              }}
            >
              {book.t}
            </div>
          ))}
          <p className="ml-1 text-[10px] font-bold text-slate-700">%64 ilerleme</p>
        </div>
      );

    case "recipe":
      return (
        <div
          className="rounded-2xl p-3"
          style={{
            background: "linear-gradient(145deg, rgba(220,38,38,0.06), rgba(255,255,255,0.9))",
            border: "1px solid rgba(220,38,38,0.12)",
          }}
        >
          <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-red-600">Reçete #24</p>
          <p className="text-[12px] font-bold text-slate-800">Türev — 12 hatalı soru</p>
        </div>
      );

    case "scans":
      return (
        <div className="grid grid-cols-3 gap-1.5">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="flex aspect-square items-center justify-center rounded-xl text-[8px] font-bold text-slate-500"
              style={{
                background: i === 1 ? `${accent}12` : "#f8fafc",
                border: `1px solid ${i === 1 ? accent + "35" : "rgba(226,232,240,0.8)"}`,
              }}
            >
              T{i + 1}
            </div>
          ))}
        </div>
      );

    case "testmaker":
      return (
        <div className="flex items-center justify-center gap-2 py-2">
          {["TYT", "AYT"].map((label) => (
            <div
              key={label}
              className="rounded-lg px-2 py-3"
              style={{ background: "#fff", border: `1.5px solid ${accent}25` }}
            >
              <div className="space-y-1">
                {[80, 55].map((w, li) => (
                  <div key={li} className="h-[2px] rounded-full" style={{ width: 28 * (w / 100), background: accent + "30" }} />
                ))}
              </div>
              <span className="mt-1 block text-center text-[7px] font-extrabold uppercase" style={{ color: accent }}>
                {label}
              </span>
            </div>
          ))}
          <Scissors className="h-4 w-4" style={{ color: accent }} strokeWidth={2.5} />
        </div>
      );

    case "yks":
      return (
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { l: "TYT", v: "412", c: accent },
            { l: "AYT", v: "318", c: "#475569" },
            { l: "SAY", v: "487", c: "#0f766e" },
          ].map((s) => (
            <div
              key={s.l}
              className="rounded-xl p-2 text-center"
              style={{ background: "#fff", border: "1px solid rgba(226,232,240,0.8)" }}
            >
              <p className="text-[8px] font-bold text-slate-400">{s.l}</p>
              <p className="text-[13px] font-extrabold leading-none" style={{ color: s.c }}>
                {s.v}
              </p>
            </div>
          ))}
        </div>
      );

    case "onyx":
      return (
        <div className="space-y-2.5">
          <div className="rounded-xl bg-slate-900 px-3.5 py-3 shadow-sm">
            <p className="text-[9px] font-semibold tracking-wide text-orange-400">Onyx</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-300">
              Fizik neti −4 · Kuvvet konusuna 2 saat tekrar öneriyorum.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-slate-100 bg-white px-2.5 py-2">
              <p className="text-[8px] text-slate-400">TYT net</p>
              <p className="text-base font-semibold tabular-nums text-slate-900">74,2</p>
            </div>
            <div className="rounded-lg border border-orange-100 bg-orange-50/80 px-2.5 py-2">
              <p className="text-[8px] font-medium text-orange-600">Öneri</p>
              <p className="text-[11px] font-semibold text-orange-700">+2s Fizik</p>
            </div>
          </div>
        </div>
      );

    case "session":
      return (
        <div className="flex flex-col items-center gap-3 py-1">
          <div className="relative flex h-[72px] w-[72px] items-center justify-center">
            <svg viewBox="0 0 72 72" className="h-[72px] w-[72px] -rotate-90">
              <circle cx="36" cy="36" r="30" fill="none" stroke="#e2e8f0" strokeWidth="3" />
              <circle
                cx="36"
                cy="36"
                r="30"
                fill="none"
                stroke={accent}
                strokeWidth="3"
                strokeDasharray="140 188"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <p className="text-[13px] font-semibold tabular-nums text-slate-900">42:00</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <p className="text-[10px] font-medium text-slate-500">Veli görüşmesi · Kayıtlı</p>
          </div>
        </div>
      );

    default:
      return null;
  }
}

export const BENTO_CARD_RADIUS = "2rem";
export const bentoCardBorder = "1px solid rgba(215,220,224,0.55)";
export const bentoCardShadow = "0 2px 20px -4px rgba(15,23,42,0.05)";
