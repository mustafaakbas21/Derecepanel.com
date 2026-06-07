"use client";

import Link from "next/link";
import { BookOpen, Stethoscope } from "lucide-react";

import { VisionSolvePreamble } from "@/components/onyx/responses/vision-solve-preamble";
import { VisionTeacherSolution } from "@/components/onyx/responses/vision-teacher-solution";
import { OnyxMathText } from "@/components/onyx/onyx-markdown-message";
import { Button } from "@/components/ui/button";
import type { VisionSkillData } from "@/lib/onyx/skill-types";
import { cn } from "@/lib/utils";

type Props = {
  data: VisionSkillData;
  className?: string;
};

function buildFallbackPreamble(data: VisionSkillData) {
  if (data.soruOnAnalizi) return data.soruOnAnalizi;
  if (!data.eksikKavram && !data.hata) return null;
  const sebepler = data.hata
    ? [data.hata, "Konu tekrarı veya işlem sırası karıştırılmış olabilir."]
    : [
        "Konu tekrarı veya kavram eşleştirmesi eksik olabilir.",
        "Soru kökündeki verilenler ile istenen karıştırılmış olabilir.",
      ];
  return {
    dersAdi: "İlgili ders",
    konuAdi: data.eksikKavram ?? "Konu",
    kavramAdi: data.eksikKavram ?? "Kavram",
    zorlukSeviyesi: 3,
    yapamamaSebepleri: sebepler,
    osymAnalizi: {
      durum: "kismen" as const,
      aciklama:
        "Bu kazanım YKS müfredatında yer alır; ÖSYM benzer mantıkla sorabilir.",
    },
  };
}

export function VisionResponseCard({ data, className }: Props) {
  const preamble = buildFallbackPreamble(data);

  return (
    <div
      className={cn(
        "w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",
        className
      )}
      data-onyx-skill="vision"
    >
      {preamble ? <VisionSolvePreamble analiz={preamble} /> : null}

      <div className="border-b border-slate-200 bg-white p-5">
        <VisionTeacherSolution adimlar={data.cozum} detay={data.cozumDetay} />
      </div>

      <div className="border-b border-slate-200 bg-slate-50/60 p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h4 className="flex items-center gap-2 font-bold text-slate-900">
            <Stethoscope className="h-4 w-4 text-orange-600" aria-hidden />
            Onyx teşhisi
          </h4>
          {data.hataTipi ? (
            <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-bold text-white">
              {data.hataTipi}
            </span>
          ) : null}
        </div>
        <p className="text-sm leading-relaxed text-slate-700">
          <OnyxMathText content={data.hata} />
        </p>
        {data.eksikKavram ? (
          <p className="mt-3 text-sm font-semibold text-slate-800">
            Tespit edilen eksik:{" "}
            <span className="font-bold text-slate-900">{data.eksikKavram}</span>
          </p>
        ) : null}
        {data.onyxMesaji ? (
          <blockquote className="mt-3 border-l-4 border-orange-400 bg-orange-50/60 py-2 pl-3 text-sm italic leading-relaxed text-slate-800">
            &ldquo;
            <OnyxMathText content={data.onyxMesaji} />
            &rdquo;
          </blockquote>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-sm text-slate-600">
          <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
          Bu konudaki eksiğini kapat
        </p>
        {data.link ? (
          <Button variant="primary" asChild className="shrink-0">
            <Link href={data.link}>Konu Takip Merkezi</Link>
          </Button>
        ) : (
          <Button variant="outline" disabled className="shrink-0">
            Konu eşleşmesi yok
          </Button>
        )}
      </div>
    </div>
  );
}
