"use client";

import { memo } from "react";
import Link from "next/link";
import { BookOpen, Stethoscope } from "lucide-react";

import type { OnyxDeepErrorDiagnosis } from "@/lib/onyx/deep-error-diagnosis";
import { buildOnyxKonuTakipHref } from "@/lib/onyx/konu-takip-link";
import type { OnyxRole } from "@/lib/onyx/role-quick-prompts";
import { VisionSolvePreamble } from "@/components/onyx/responses/vision-solve-preamble";
import { VisionTeacherSolution } from "@/components/onyx/responses/vision-teacher-solution";
import { OnyxMathText } from "@/components/onyx/onyx-markdown-message";
import { cn } from "@/lib/utils";

type Props = {
  diagnosis: OnyxDeepErrorDiagnosis;
  role?: OnyxRole;
  className?: string;
};

export const OnyxDeepErrorReport = memo(function OnyxDeepErrorReport({
  diagnosis,
  role = "student",
  className,
}: Props) {
  const { cozumAdimlari, hataAnalizi, aksiyonPlani, soruOnAnalizi, cozumDetay } =
    diagnosis;
  const konuTakipHref = buildOnyxKonuTakipHref(diagnosis, role);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",
        className
      )}
      data-onyx-report="deep-error"
    >
      <VisionSolvePreamble analiz={soruOnAnalizi} />

      <div className="border-b border-slate-200 p-4">
        <VisionTeacherSolution adimlar={cozumAdimlari} detay={cozumDetay} />
      </div>

      <div className="border-b border-slate-200 bg-slate-50/60 p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h4 className="flex items-center gap-2 font-bold text-slate-900">
            <Stethoscope size={18} aria-hidden />
            Onyx teşhisi
          </h4>
          <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-bold text-white">
            {hataAnalizi.hataTipi}
          </span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-slate-700">
          <OnyxMathText content={hataAnalizi.kökNeden} />
        </p>
        <p className="mt-4 text-sm font-semibold text-slate-800">
          Tespit edilen eksik:{" "}
          {konuTakipHref ? (
            <Link
              href={konuTakipHref}
              className="ml-1 inline-block rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50"
            >
              {hataAnalizi.eksikKavram} → Konuya çalış
            </Link>
          ) : (
            <span className="ml-1 font-bold">{hataAnalizi.eksikKavram}</span>
          )}
        </p>
      </div>

      <div className="flex flex-col gap-2 border-l-4 border-orange-400 bg-orange-50/50 p-4">
        <h4 className="flex items-center gap-2 font-bold text-slate-900">
          <BookOpen size={18} aria-hidden />
          Koçluk reçetesi ({aksiyonPlani.tavsiyeEdilenAksiyon})
        </h4>
        <p className="text-sm italic leading-relaxed text-slate-800">
          &ldquo;
          <OnyxMathText content={aksiyonPlani.OnyxMesaji} />
          &rdquo;
        </p>
      </div>
    </div>
  );
});
