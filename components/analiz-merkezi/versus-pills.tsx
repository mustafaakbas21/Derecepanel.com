"use client";

import { cn } from "@/lib/utils";
import type { VersusState } from "@/components/analiz-merkezi/charts/competency-radar-chart";

const PILLS: { key: keyof VersusState; label: string }[] = [
  { key: "student", label: "Öğrenciyi Göster" },
  { key: "class", label: "Sınıf Ortalaması" },
  { key: "top", label: "Kurum Birincisi" },
];

export function VersusPills({
  value,
  onChange,
}: {
  value: VersusState;
  onChange: (next: VersusState) => void;
}) {
  return (
    <div className="am-versus-wrap mt-3" id="am-versus">
      {PILLS.map(({ key, label }) => {
        const on = value[key];
        return (
          <button
            key={key}
            type="button"
            data-v={key}
            className={cn("am-versus", on && "is-on")}
            onClick={() => onChange({ ...value, [key]: !on })}
          >
            <span className="dot" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
