"use client";

import { memo, type ReactNode } from "react";
import { Compass, Sparkles, Target, TrendingUp } from "lucide-react";

import type {
  CareerAlternative,
  OnyxCareerCounseling,
} from "@/lib/onyx/career-counseling";
import {
  isBulmaLabel,
  sektorTrendiLabel,
} from "@/lib/onyx/career-sector-insights";
import { cn } from "@/lib/utils";

type Props = {
  counseling: OnyxCareerCounseling;
  className?: string;
};

function SectionHeading({
  icon,
  title,
  iconClassName,
}: {
  icon: ReactNode;
  title: string;
  iconClassName?: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className={cn("flex shrink-0", iconClassName)}>{icon}</span>
      <h4 className="font-bold text-slate-800">{title}</h4>
    </div>
  );
}

function InsightBadge({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "emerald" | "amber" | "slate" | "sky";
}) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-100",
    amber: "bg-amber-50 text-amber-800 border-amber-100",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    sky: "bg-sky-50 text-sky-800 border-sky-100",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

function badgeToneForIsBulma(
  v?: CareerAlternative["isBulma"]
): "emerald" | "amber" | "slate" {
  if (v === "yüksek") return "emerald";
  if (v === "değişken") return "amber";
  return "slate";
}

function badgeToneForTrend(
  v?: CareerAlternative["sektorTrendi"]
): "emerald" | "sky" | "slate" {
  if (v === "yükselen") return "emerald";
  if (v === "dönüşümde") return "sky";
  return "slate";
}

function AlternativeCards({
  items,
  emptyLabel,
  variant = "default",
}: {
  items: CareerAlternative[];
  emptyLabel: string;
  variant?: "default" | "parlak";
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-500">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {items.map((alt, idx) => (
        <div
          key={`${alt.bolum}-${idx}`}
          className={cn(
            "flex flex-col gap-3 rounded-xl border p-4 transition-all hover:shadow-sm",
            variant === "parlak"
              ? "border-violet-100 bg-gradient-to-br from-violet-50/40 to-white hover:border-violet-200"
              : "border-slate-200 bg-white hover:border-slate-300 md:flex-row md:items-center md:justify-between md:gap-2"
          )}
        >
          <div className="min-w-0 flex-1">
            <span className="block font-bold text-slate-800">{alt.bolum}</span>
            {variant === "parlak" &&
            (alt.isBulma || alt.sektorTrendi) ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {alt.isBulma ? (
                  <InsightBadge tone={badgeToneForIsBulma(alt.isBulma)}>
                    {isBulmaLabel(alt.isBulma)}
                  </InsightBadge>
                ) : null}
                {alt.sektorTrendi ? (
                  <InsightBadge tone={badgeToneForTrend(alt.sektorTrendi)}>
                    {sektorTrendiLabel(alt.sektorTrendi)}
                  </InsightBadge>
                ) : null}
              </div>
            ) : null}
            <span
              className={cn(
                "block text-xs leading-relaxed text-slate-600",
                variant === "parlak" ? "mt-2" : "mt-1"
              )}
            >
              {alt.nedenUygun}
            </span>
          </div>
          {alt.tabanPuani ? (
            <div className="shrink-0 self-start rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold whitespace-nowrap text-slate-600 md:self-center">
              Taban: {alt.tabanPuani}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export const OnyxCareerReport = memo(function OnyxCareerReport({
  counseling,
  className,
}: Props) {
  const { meslekAnalizi, netAnaliziVeAlternatifler, onyxTavsiyesi } = counseling;

  return (
    <div
      className={cn(
        "w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white font-sans shadow-sm",
        className
      )}
      data-onyx-report="career"
    >
      <div className="flex items-start gap-4 bg-slate-900 p-6">
        <div className="rounded-xl bg-white/10 p-3">
          <Compass className="h-6 w-6 text-white" aria-hidden />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">
            Onyx Kariyer ve Tercih Analizi
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Sistemdeki güncel YÖK verileri ile hedefinize giden yol haritası.
          </p>
        </div>
      </div>

      <div className="space-y-8 p-6">
        <section>
          <SectionHeading
            icon={<Sparkles className="h-4 w-4 text-slate-600" aria-hidden />}
            title="Gelecek Vizyonu"
            iconClassName="text-slate-600"
          />
          <p className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
            {meslekAnalizi.gelecekVizyonu}
          </p>
          {meslekAnalizi.avantajVeDezavantajlar.filter(
            (item) => item && item !== "[object Object]"
          ).length > 0 ? (
            <ul className="mt-3 space-y-1.5 rounded-xl border border-slate-100 bg-white p-3 text-sm text-slate-600">
              {meslekAnalizi.avantajVeDezavantajlar
                .filter((item) => item && item !== "[object Object]")
                .map((item) => (
                <li key={item} className="flex gap-2 leading-relaxed">
                  <span className="text-slate-400" aria-hidden>
                    •
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section>
          <SectionHeading
            icon={<TrendingUp className="h-4 w-4 text-emerald-600" aria-hidden />}
            title="Mevcut Net & Tercih Durumu"
            iconClassName="text-emerald-600"
          />
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-sm leading-relaxed text-slate-700">
            {netAnaliziVeAlternatifler.mevcutDurum}
          </div>
        </section>

        <section>
          <SectionHeading
            icon={<Target className="h-4 w-4 text-slate-700" aria-hidden />}
            title="Hedefe Yakın Alternatifler"
            iconClassName="text-slate-700"
          />
          <AlternativeCards
            items={netAnaliziVeAlternatifler.hedefeYakinAlternatifler}
            emptyLabel="Atlas verisinde eşleşen alternatif listelenemedi."
          />
        </section>

        {netAnaliziVeAlternatifler.farkliAmaGelecegiParlakBölümler.length >
        0 ? (
          <section>
            <SectionHeading
              icon={<Sparkles className="h-4 w-4 text-violet-600" aria-hidden />}
              title="Farklı Ama Geleceği Parlak Bölümler"
              iconClassName="text-violet-600"
            />
            <p className="mb-3 text-xs leading-relaxed text-slate-500">
              Hedefinizden farklı ama iş piyasasında talep gören alanlar — her
              kart farklı bir bölüm ve sektör profili gösterir.
            </p>
            <AlternativeCards
              items={netAnaliziVeAlternatifler.farkliAmaGelecegiParlakBölümler}
              emptyLabel=""
              variant="parlak"
            />
          </section>
        ) : null}

        <section className="border-t border-slate-100 pt-6">
          <SectionHeading
            icon={<Compass className="h-4 w-4 text-slate-800" aria-hidden />}
            title="Onyx Tavsiyesi"
            iconClassName="text-slate-800"
          />
          <blockquote className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm leading-relaxed text-slate-700 italic">
            &ldquo;{onyxTavsiyesi}&rdquo;
          </blockquote>
        </section>
      </div>
    </div>
  );
});
