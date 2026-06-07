"use client";

import {
  AlertTriangle,
  BookMarked,
  Gauge,
  GraduationCap,
  Lightbulb,
  Target,
} from "lucide-react";

import { OnyxMathText } from "@/components/onyx/onyx-markdown-message";
import type { VisionOsymAnalizi, VisionSoruOnAnalizi } from "@/lib/onyx/skill-types";
import {
  clampOnyxZorluk,
  onyxZorlukLabel,
  onyxZorlukStars,
} from "@/lib/onyx/zorluk-display";
import { cn } from "@/lib/utils";

const OSYM_LABELS: Record<
  VisionOsymAnalizi["durum"],
  { label: string; className: string }
> = {
  evet: {
    label: "ÖSYM'de çıkar",
    className: "bg-orange-500 text-white shadow-sm shadow-orange-500/25",
  },
  kismen: {
    label: "Ara sıra / benzer mantık",
    className: "bg-orange-100 text-orange-900 ring-1 ring-orange-200",
  },
  nadir: {
    label: "Nadiren",
    className: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  },
  hayir: {
    label: "Doğrudan değil",
    className: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  },
};

type Props = {
  analiz: VisionSoruOnAnalizi;
  className?: string;
};

export function VisionSolvePreamble({ analiz, className }: Props) {
  const osym = OSYM_LABELS[analiz.osymAnalizi.durum];
  const zorluk = clampOnyxZorluk(analiz.zorlukSeviyesi);
  const zorlukLabel = onyxZorlukLabel(zorluk);

  return (
    <section
      className={cn("overflow-hidden rounded-t-2xl", className)}
      data-onyx-block="vision-preamble"
    >
      <div className="bg-slate-900 px-5 py-4 text-white">
        <div className="mb-3 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <Target className="h-5 w-5 text-amber-300" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Soru haritası
            </p>
            <h4 className="mt-0.5 text-base font-bold leading-snug">
              Çözüme geçmeden önce
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Ders, konu, kavram, zorluk ve ÖSYM profili
            </p>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5 ring-1 ring-white/10">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-orange-300" aria-hidden />
            <span className="text-xs font-semibold text-slate-300">Zorluk</span>
          </div>
          <span
            className="text-sm font-bold tracking-wide text-amber-300"
            aria-label={`Zorluk ${zorluk} üzerinden 5`}
          >
            {onyxZorlukStars(zorluk)}
          </span>
          <span className="rounded-full bg-orange-500/25 px-2.5 py-0.5 text-xs font-bold text-orange-100">
            {zorlukLabel} · {zorluk}/5
          </span>
        </div>
        {analiz.zorlukNotu ? (
          <p className="mb-3 text-xs leading-relaxed text-slate-300">
            <OnyxMathText content={analiz.zorlukNotu} />
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {analiz.sinavBolumu ? (
            <span className="inline-flex items-center rounded-full bg-orange-500/25 px-3 py-1 text-xs font-bold text-orange-100 ring-1 ring-orange-400/30">
              {analiz.sinavBolumu}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ring-1 ring-white/10">
            <GraduationCap className="h-3.5 w-3.5 text-orange-300" aria-hidden />
            {analiz.dersAdi}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ring-1 ring-white/10">
            <BookMarked className="h-3.5 w-3.5 text-orange-300" aria-hidden />
            {analiz.konuAdi}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/20 px-3 py-1 text-xs font-semibold text-orange-100 ring-1 ring-orange-400/30">
            <Lightbulb className="h-3.5 w-3.5" aria-hidden />
            {analiz.kavramAdi}
          </span>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-slate-50/90 px-5 py-4">
        <h5 className="mb-2.5 flex items-center gap-2 text-sm font-bold text-slate-900">
          <AlertTriangle className="h-4 w-4 text-orange-500" aria-hidden />
          Bu soruyu yapamama sebepleri
        </h5>
        <ul className="space-y-2">
          {analiz.yapamamaSebepleri.map((sebep, i) => (
            <li
              key={`sebep-${i}`}
              className="flex gap-2.5 text-sm leading-relaxed text-slate-700"
            >
              <span
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white"
                aria-hidden
              >
                {i + 1}
              </span>
              <OnyxMathText content={sebep} />
            </li>
          ))}
        </ul>
      </div>

      <div className="border-b border-orange-100 bg-gradient-to-r from-orange-50/80 to-white px-5 py-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h5 className="text-sm font-bold text-slate-900">
            ÖSYM bu soruları soruyor mu?
          </h5>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
              osym.className
            )}
          >
            {osym.label}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-slate-700">
          <OnyxMathText content={analiz.osymAnalizi.aciklama} />
        </p>
        {analiz.osymAnalizi.siklikNotu ? (
          <p className="mt-2 text-xs font-medium text-orange-800/90">
            Sıklık: {analiz.osymAnalizi.siklikNotu}
          </p>
        ) : null}
      </div>
    </section>
  );
}
