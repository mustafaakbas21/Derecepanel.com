"use client";

import { hrInputClass } from "@/components/hata-recetesi/hr-ui";
import type { HataTipi } from "@/lib/hata-recetesi/types";
import { cn } from "@/lib/utils";

type Props = {
  value: HataTipi | "";
  onChange: (v: HataTipi | "") => void;
  id?: string;
  className?: string;
};

export function HataTipSelect({ value, onChange, id = "hr-hata-tip", className }: Props) {
  return (
    <select
      id={id}
      className={cn(hrInputClass, className)}
      value={value}
      onChange={(e) => onChange((e.target.value || "") as HataTipi | "")}
    >
      <option value="">Tümü</option>
      <option value="yanlis">Yanlış</option>
      <option value="bos">Boş</option>
    </select>
  );
}
