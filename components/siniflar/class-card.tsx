"use client";

import { CLASS_FIELD_LABEL } from "@/lib/classes/constants";
import type { InstitutionClass } from "@/lib/classes/types";

type Props = {
  institutionClass: InstitutionClass;
  onClick: () => void;
};

export function ClassCard({ institutionClass, onClick }: Props) {
  const count = institutionClass.studentIds.length;
  const fieldLabel = CLASS_FIELD_LABEL[institutionClass.field];

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full flex-col rounded-3xl border p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-2xl font-bold tracking-tight">
          {institutionClass.name}
        </h3>
        <span className="shrink-0 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide">
          {fieldLabel}
        </span>
      </div>
      <p className="mt-2 text-sm opacity-60">{fieldLabel} grubu</p>
      <div className="mt-6 flex items-baseline gap-2">
        <span className="text-3xl font-bold tabular-nums transition-all group-hover:scale-105">
          {count}
        </span>
        <span className="text-sm font-medium opacity-70">Öğrenci</span>
      </div>
    </button>
  );
}
