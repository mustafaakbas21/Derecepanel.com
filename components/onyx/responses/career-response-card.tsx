"use client";

import { OnyxCareerReport } from "@/components/onyx/onyx-career-report";
import { skillDataToCareerCounseling } from "@/lib/onyx/skill-adapters";
import type { CareerSkillData } from "@/lib/onyx/skill-types";
import { cn } from "@/lib/utils";

type Props = {
  data: CareerSkillData;
  className?: string;
};

export function CareerResponseCard({ data, className }: Props) {
  const counseling = skillDataToCareerCounseling(data);
  return (
    <OnyxCareerReport counseling={counseling} className={cn(className)} />
  );
}
