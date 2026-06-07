import Link from "next/link";
import {
  AlertTriangle,
  Camera,
  FilePlus2,
  Radar,
  TrendingDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { StudentExamSnapshot } from "@/lib/student/dashboard/types";
import { cn } from "@/lib/utils";

type Props = {
  exam: StudentExamSnapshot | null;
  className?: string;
};

export function StudentDashboardActions({ exam, className }: Props) {
  const weakTopic = exam?.weakTopic?.trim();
  const hasNets = exam?.tytNet != null || exam?.aytNet != null;

  return (
    <aside
      className={cn("space-y-4", className)}
      aria-label="Hızlı aksiyonlar ve radar"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <Button
          variant="primary"
          size="lg"
          className="h-auto min-h-[4.5rem] flex-col gap-1 rounded-2xl py-4 text-left sm:flex-row sm:items-center sm:justify-start sm:gap-3 sm:text-center lg:text-left"
          asChild
        >
          <Link href="/ogrenci/onyx">
            <Camera className="h-5 w-5 shrink-0" aria-hidden />
            <span>
              <span className="block text-sm font-semibold">
                Soru Fotoğrafı Yükle
              </span>
              <span className="block text-[11px] font-normal opacity-80">
                Onyx anında çözsün
              </span>
            </span>
          </Link>
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="h-auto min-h-[4.5rem] flex-col gap-1 rounded-2xl border-slate-300 py-4 text-left sm:flex-row sm:items-center sm:justify-start sm:gap-3 sm:text-center lg:text-left"
          asChild
        >
          <Link href="/ogrenci/deneme-sonuclari">
            <FilePlus2 className="h-5 w-5 shrink-0 text-slate-700" aria-hidden />
            <span>
              <span className="block text-sm font-semibold text-slate-900">
                Yeni Deneme Gir
              </span>
              <span className="block text-[11px] font-normal text-slate-500">
                Netlerini güncelle
              </span>
            </span>
          </Link>
        </Button>
      </div>

      <div className="rounded-2xl border border-rose-200/80 bg-gradient-to-br from-rose-50/80 to-orange-50/50 p-5 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-rose-700">
          <Radar className="h-3.5 w-3.5" aria-hidden />
          Onyx Radarı
        </h2>

        {weakTopic || hasNets ? (
          <div className="space-y-3">
            {hasNets ? (
              <div className="flex flex-wrap gap-2">
                {exam?.tytNet != null ? (
                  <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
                    TYT{" "}
                    <span className="tabular-nums text-slate-900">
                      {exam.tytNet.toFixed(1)}
                    </span>
                  </span>
                ) : null}
                {exam?.aytNet != null ? (
                  <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
                    AYT{" "}
                    <span className="tabular-nums text-slate-900">
                      {exam.aytNet.toFixed(1)}
                    </span>
                  </span>
                ) : null}
              </div>
            ) : null}

            {weakTopic ? (
              <div className="flex gap-2.5 rounded-xl border border-rose-200 bg-white/70 px-3 py-3">
                <AlertTriangle
                  className="mt-0.5 h-4 w-4 shrink-0 text-rose-600"
                  aria-hidden
                />
                <div>
                  <p className="text-xs font-semibold text-rose-900">
                    Zayıf konu alarmı
                  </p>
                  <p className="mt-0.5 text-sm text-slate-700">{weakTopic}</p>
                  {exam?.examName ? (
                    <p className="mt-1 text-[11px] text-slate-500">
                      Son deneme: {exam.examName}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-600">
                Net verilerin var; zayıf konu etiketi henüz eklenmemiş.
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-rose-200 bg-white/50 px-3 py-6 text-center">
            <TrendingDown
              className="mx-auto h-7 w-7 text-rose-300"
              aria-hidden
            />
            <p className="mt-2 text-sm font-medium text-slate-700">
              Henüz deneme verisi yok
            </p>
            <p className="mt-1 text-xs text-slate-500">
              İlk denemeni girince radarın zayıf konunu gösterecek.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
