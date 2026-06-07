"use client";

import {
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  FlaskConical,
  Lightbulb,
  ListOrdered,
  PenLine,
  Quote,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

import {
  OnyxMarkdownMessage,
  OnyxMathText,
} from "@/components/onyx/onyx-markdown-message";
import type { VisionCozumDetay } from "@/lib/onyx/skill-types";
import { cn } from "@/lib/utils";

const DERS_TIPI_LABEL: Record<VisionCozumDetay["dersTipi"], string> = {
  sayisal: "Sayısal ders",
  sozel: "Sözel ders",
  dil: "Dil testi",
};

const TEMEL_KURAL_LABEL: Record<VisionCozumDetay["dersTipi"], string> = {
  sayisal: "Temel kural / formül",
  sozel: "Kavram / kural (tahta notu)",
  dil: "Dilbilgisi kuralı",
};

const SEKIL_LABEL: Record<VisionCozumDetay["dersTipi"], string> = {
  sayisal: "Şekil / grafik / tablo analizi",
  sozel: "Metin / harita / kaynak analizi",
  dil: "Cümle / bağlam analizi",
};

type Props = {
  adimlar: string[];
  detay?: VisionCozumDetay;
  className?: string;
};

function stepsMarkdown(adimlar: string[]): string {
  return adimlar.map((adim, i) => `**${i + 1}. Adım** — ${adim}`).join("\n\n");
}

export function VisionTeacherSolution({ adimlar, detay, className }: Props) {
  const hasDetay = Boolean(detay?.nihaiCevap?.trim());
  const dersTipi = detay?.dersTipi ?? "sayisal";

  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-slate-200 bg-[#fafaf9] shadow-inner",
        className
      )}
      data-onyx-block="teacher-solution"
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-900 px-4 py-3 text-white">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
            <PenLine className="h-4 w-4 text-amber-300" aria-hidden />
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Tahta çözümü
            </p>
            <h4 className="text-sm font-bold">Hocanın adım adım anlatımı</h4>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {detay?.sinavBolumu ? (
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-200 ring-1 ring-white/15">
              {detay.sinavBolumu}
            </span>
          ) : null}
          {detay?.dersTipi ? (
            <span className="rounded-full bg-orange-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-orange-100 ring-1 ring-orange-400/30">
              {DERS_TIPI_LABEL[detay.dersTipi]}
            </span>
          ) : null}
        </div>
      </div>

      <div className="space-y-4 p-4">
        {detay?.hocaAcilis?.trim() ? (
          <div className="rounded-lg border border-amber-200/80 bg-amber-50/70 px-3.5 py-3">
            <p className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-900">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Hoca diyor ki…
            </p>
            <OnyxMarkdownMessage content={detay.hocaAcilis} variant="compact" />
          </div>
        ) : null}

        {detay?.verilenler && detay.verilenler.length > 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-3.5">
            <h5 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              <ListOrdered className="h-3.5 w-3.5" aria-hidden />
              Verilenler
            </h5>
            <ul className="space-y-1.5">
              {detay.verilenler.map((v, i) => (
                <li
                  key={`verilen-${i}`}
                  className="flex gap-2 text-sm leading-relaxed text-slate-800"
                >
                  <span className="font-bold text-slate-400">•</span>
                  <OnyxMathText content={v} />
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {detay?.kaynakAlintisi?.trim() ? (
          <div className="rounded-lg border-l-4 border-orange-400 bg-orange-50/50 p-3.5">
            <h5 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-orange-900">
              <Quote className="h-3.5 w-3.5" aria-hidden />
              Sorudan alıntı / kanıt
            </h5>
            <OnyxMarkdownMessage content={detay.kaynakAlintisi} variant="orange" />
          </div>
        ) : null}

        {detay?.temelKural?.trim() ? (
          <div className="rounded-lg border-l-4 border-slate-900 bg-white p-3.5 shadow-sm">
            <h5 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-600">
              <FlaskConical className="h-3.5 w-3.5" aria-hidden />
              {TEMEL_KURAL_LABEL[dersTipi]}
            </h5>
            <OnyxMarkdownMessage content={detay.temelKural} />
          </div>
        ) : null}

        {detay?.miniOrnek?.trim() ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/80 p-3.5">
            <h5 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-600">
              <BookOpen className="h-3.5 w-3.5" aria-hidden />
              Hocanın mini örneği
            </h5>
            <OnyxMarkdownMessage content={detay.miniOrnek} />
          </div>
        ) : null}

        {detay?.sekilAnalizi?.trim() ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white/80 p-3.5">
            <h5 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">
              {SEKIL_LABEL[dersTipi]}
            </h5>
            <OnyxMarkdownMessage content={detay.sekilAnalizi} />
          </div>
        ) : null}

        <div className="rounded-lg border border-slate-200 bg-white p-3.5">
          <h5 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-600">
            <PenLine className="h-3.5 w-3.5" aria-hidden />
            Çözüm adımları
          </h5>
          <OnyxMarkdownMessage content={stepsMarkdown(adimlar)} />
        </div>

        {detay?.dogrulama?.trim() ? (
          <div className="flex gap-2.5 rounded-lg border border-emerald-100 bg-emerald-50/60 px-3.5 py-3">
            <ClipboardCheck
              className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700"
              aria-hidden
            />
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">
                Doğrulama
              </p>
              <div className="mt-1 text-sm leading-relaxed">
                <OnyxMarkdownMessage
                  content={detay.dogrulama}
                  variant="emerald"
                />
              </div>
            </div>
          </div>
        ) : null}

        {hasDetay ? (
          <div className="rounded-xl bg-slate-900 px-4 py-4 text-white shadow-md">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Nihai cevap
            </p>
            <div className="mt-2 flex items-start gap-2.5">
              <CheckCircle2
                className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400"
                aria-hidden
              />
              <div className="min-w-0 flex-1 text-base font-bold leading-snug">
                <OnyxMarkdownMessage
                  content={detay!.nihaiCevap}
                  variant="dark"
                />
              </div>
            </div>
          </div>
        ) : null}

        {detay?.osymTuzagi?.trim() ? (
          <div className="flex gap-2.5 rounded-lg border border-orange-200 bg-orange-50 px-3.5 py-3">
            <ShieldAlert
              className="mt-0.5 h-4 w-4 shrink-0 text-orange-600"
              aria-hidden
            />
            <div>
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-orange-800">
                <Lightbulb className="h-3.5 w-3.5" aria-hidden />
                ÖSYM tuzağı
              </p>
              <div className="mt-1 text-sm leading-relaxed">
                <OnyxMarkdownMessage
                  content={detay.osymTuzagi}
                  variant="orange"
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
