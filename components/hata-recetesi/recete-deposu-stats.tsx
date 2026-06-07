"use client";

import { Archive, BookOpen, Calendar, TrendingUp } from "lucide-react";

import { HrMetrics } from "@/components/hata-recetesi/hr-ui";
import type { ReceteDeposuStats } from "@/lib/hata-recetesi/stats";

type Props = { stats: ReceteDeposuStats };

export function ReceteDeposuStats({ stats }: Props) {
  return (
    <HrMetrics
      metrics={[
        {
          label: "Toplam reçete",
          value: stats.totalRecipes,
          icon: Archive,
        },
        {
          label: "Hata sorusu",
          value: stats.totalQuestions,
          icon: BookOpen,
        },
        {
          label: "Sık eksik ders",
          value: stats.topDers,
          sub: "Arşivde en çok",
          icon: TrendingUp,
        },
        {
          label: "Bu ay",
          value: stats.thisMonth,
          sub: "yeni reçete",
          icon: Calendar,
        },
      ]}
    />
  );
}
