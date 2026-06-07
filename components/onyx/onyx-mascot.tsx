"use client";

import { Sparkles } from "lucide-react";

export function OnyxMascot() {
  return (
    <div className="onyx-mascot relative mx-auto mt-8 h-36 w-36 sm:h-44 sm:w-44" aria-hidden>
      <div className="onyx-mascot__glow absolute inset-4 rounded-full bg-gradient-to-br from-amber-200/50 via-sky-200/40 to-slate-200/30 blur-2xl" />
      <div className="onyx-mascot__body relative flex h-full w-full items-center justify-center rounded-[2rem] border border-white/60 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 shadow-2xl shadow-slate-900/25">
        <div className="absolute -top-3 left-1/2 h-5 w-16 -translate-x-1/2 rounded-full bg-slate-600/90" />
        <div className="flex gap-3 pt-2">
          <span className="h-3 w-3 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
          <span className="h-3 w-3 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
        </div>
        <Sparkles className="absolute bottom-6 h-10 w-10 text-amber-300/90" />
      </div>
      <p className="onyx-bubble-hint onyx-bubble-hint--left absolute -left-2 top-6 max-w-[9rem] rounded-2xl rounded-br-sm border border-white/70 bg-white/90 px-3 py-2 text-[11px] font-medium text-slate-600 shadow-lg backdrop-blur-md sm:-left-16">
        Deneme verisine göre analiz!
      </p>
      <p className="onyx-bubble-hint onyx-bubble-hint--right absolute -right-2 top-20 max-w-[9rem] rounded-2xl rounded-bl-sm border border-white/70 bg-white/90 px-3 py-2 text-[11px] font-medium text-slate-600 shadow-lg backdrop-blur-md sm:-right-14">
        Hızlı aksiyon seçebilirsin.
      </p>
    </div>
  );
}
