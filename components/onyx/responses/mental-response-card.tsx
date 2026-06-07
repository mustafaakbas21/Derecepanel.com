"use client";

import {
  Brain,
  ClipboardList,
  Heart,
  Sparkles,
  Wind,
} from "lucide-react";

import type { MentalSkillData } from "@/lib/onyx/skill-types";
import { cn } from "@/lib/utils";

type Props = {
  data: MentalSkillData;
  className?: string;
};

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function MentalResponseCard({ data, className }: Props) {
  const telkinParagraphs = splitParagraphs(data.terapotikTelkin);

  return (
    <div
      className={cn(
        "w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",
        className
      )}
      data-onyx-skill="mental"
    >
      <div className="border-b border-slate-100 bg-gradient-to-r from-violet-50 via-white to-amber-50 px-6 py-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
            <Heart className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-semibold text-slate-900">Onyx — yanındayım</h4>
              <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-800">
                {data.tespitEdilenDuygu}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-700">
              {data.dostAcilisi}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-6">
        <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Duygu haritası
          </p>
          <p className="text-sm leading-relaxed text-slate-700">
            {data.duyguHaritasi}
          </p>
        </section>

        <section className="rounded-xl border border-violet-200 bg-violet-50/50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Brain className="h-4 w-4 text-violet-600" aria-hidden />
            <h5 className="text-sm font-semibold text-violet-900">
              BDT düşünce kaydı
            </h5>
          </div>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="font-medium text-violet-800">Çarpıtma</dt>
              <dd className="mt-0.5 text-slate-700">{data.bdtCalismasi.carpitma}</dd>
            </div>
            <div className="rounded-lg border border-violet-100 bg-white/80 px-3 py-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Otomatik düşünce
              </dt>
              <dd className="mt-1 italic text-slate-800">
                &ldquo;{data.bdtCalismasi.dusunceKaydi}&rdquo;
              </dd>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                Dengeli alternatif
              </dt>
              <dd className="mt-1 text-slate-800">
                {data.bdtCalismasi.alternatifDusunce}
              </dd>
            </div>
          </dl>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-slate-600" aria-hidden />
            <h5 className="text-sm font-semibold text-slate-900">
              Terapötik telkin
            </h5>
          </div>
          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
            {telkinParagraphs.length > 0 ? (
              telkinParagraphs.map((para, i) => (
                <p
                  key={`telkin-${i}`}
                  className="text-sm leading-relaxed text-slate-700"
                >
                  {para}
                </p>
              ))
            ) : (
              <p className="text-sm leading-relaxed text-slate-700">
                {data.terapotikTelkin}
              </p>
            )}
          </div>
        </section>

        {data.kanitlar.length > 0 ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Geçmişinden hatırlatmalar
            </p>
            <ul className="space-y-1.5 text-sm text-emerald-900">
              {data.kanitlar.map((k) => (
                <li key={k} className="flex gap-2">
                  <span className="text-emerald-600" aria-hidden>
                    •
                  </span>
                  <span>{k}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <section className="rounded-xl border border-sky-200 bg-sky-50/50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Wind className="h-4 w-4 text-sky-600" aria-hidden />
            <h5 className="text-sm font-semibold text-sky-900">
              {data.nefesProtokolu.baslik}
            </h5>
          </div>
          <ol className="space-y-2">
            {data.nefesProtokolu.adimlar.map((adim, i) => (
              <li
                key={`nefes-${i}`}
                className="flex gap-3 text-sm leading-relaxed text-slate-700"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-800">
                  {i + 1}
                </span>
                <span>{adim}</span>
              </li>
            ))}
          </ol>
        </section>

        {data.acilAksiyonRecetesi.length > 0 ? (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-slate-600" aria-hidden />
              <h5 className="text-sm font-semibold text-slate-900">
                Şimdi ve bugün için
              </h5>
            </div>
            <ol className="space-y-2">
              {data.acilAksiyonRecetesi.map((adim, i) => (
                <li
                  key={`aksiyon-${i}`}
                  className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-sm leading-relaxed text-slate-700"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <span>{adim}</span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </div>

      <div className="border-t border-slate-100 bg-gradient-to-r from-amber-50/80 to-violet-50/80 px-6 py-4">
        <p className="text-sm leading-relaxed text-slate-700">
          {data.dostKapanisi}
        </p>
      </div>
    </div>
  );
}
