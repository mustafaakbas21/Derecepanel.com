"use client";

import { AlertTriangle, BookOpen, PlayCircle } from "lucide-react";

import type { YoutubeSkillData } from "@/lib/onyx/skill-types";
import { cn } from "@/lib/utils";

type Props = {
  data: YoutubeSkillData;
  className?: string;
};

export function YoutubeResponseCard({ data, className }: Props) {
  const ozetParagraphs = data.ozet
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div
      className={cn(
        "w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",
        className
      )}
      data-onyx-skill="youtube"
    >
      <div className="border-b border-red-100 bg-gradient-to-r from-red-50 to-white p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <PlayCircle className="h-6 w-6" aria-hidden />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-slate-900">YouTube Ders Föyü</h4>
            <p className="text-xs text-slate-500">Uzman içerik mimarı çıktısı</p>
            {data.videoBaslik ? (
              <p className="mt-1 text-sm text-slate-600">{data.videoBaslik}</p>
            ) : null}
            {data.videoUrl ? (
              <p className="mt-0.5 truncate text-xs text-slate-400">
                {data.videoUrl}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <section>
          <div className="mb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-slate-700" aria-hidden />
            <h5 className="text-sm font-bold text-slate-800">Ders özeti</h5>
          </div>
          <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            {ozetParagraphs.length > 0 ? (
              ozetParagraphs.map((para, i) => (
                <p
                  key={`ozet-${i}`}
                  className="text-sm leading-relaxed text-slate-700"
                >
                  {para}
                </p>
              ))
            ) : (
              <p className="text-sm leading-relaxed text-slate-700">{data.ozet}</p>
            )}
          </div>
        </section>

        {data.kritikKavramlar.length > 0 ? (
          <section>
            <p className="mb-3 text-sm font-bold text-slate-800">
              Kritik kavramlar ve ÖSYM tuzakları ({data.kritikKavramlar.length})
            </p>
            <ul className="space-y-3">
              {data.kritikKavramlar.map((kavram) => (
                <li
                  key={kavram.isim}
                  className="rounded-xl border border-amber-100 bg-amber-50/50 p-4"
                >
                  <h6 className="font-semibold text-amber-950">{kavram.isim}</h6>
                  <p className="mt-2 text-sm leading-relaxed text-amber-950/90">
                    {kavram.aciklama}
                  </p>
                  <div className="mt-3 flex gap-2 rounded-lg border border-amber-200/80 bg-white/80 p-3">
                    <AlertTriangle
                      className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"
                      aria-hidden
                    />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                        ÖSYM tuzağı
                      </p>
                      <p className="mt-0.5 text-sm text-amber-950">
                        {kavram.osymTuzagi}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {data.anlamaKontrolu.length > 0 ? (
          <section>
            <p className="mb-3 text-sm font-bold text-slate-800">
              Anlama kontrolü — yeni nesil ({data.anlamaKontrolu.length} soru)
            </p>
            <ol className="space-y-4">
              {data.anlamaKontrolu.map((q, i) => (
                <li
                  key={`${q.soru.slice(0, 40)}-${i}`}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <p className="font-semibold text-slate-800">
                    {i + 1}. {q.soru}
                  </p>
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
                      Çözüm ve mantık
                    </p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                      {q.cevap}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </div>
    </div>
  );
}
