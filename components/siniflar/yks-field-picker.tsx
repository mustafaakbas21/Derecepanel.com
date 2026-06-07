"use client";

import { Check } from "lucide-react";

import {
  CLASS_FIELD_BADGE,
  CLASS_FIELD_LABEL,
  YKS_CLASS_FIELD_OPTIONS,
} from "@/lib/classes/constants";
import type { ClassField } from "@/lib/classes/types";
import { cn } from "@/lib/utils";

type Props = {
  value: ClassField;
  onChange: (field: ClassField) => void;
};

export function YksFieldPicker({ value, onChange }: Props) {
  return (
    <div className="sinif-yks-fields" role="radiogroup" aria-label="YKS alan seçimi">
      {YKS_CLASS_FIELD_OPTIONS.map((opt) => {
        const selected = value === opt.value;
        const badge = CLASS_FIELD_BADGE[opt.value];
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            className={cn("sinif-yks-field", selected && "sinif-yks-field--selected")}
            onClick={() => onChange(opt.value)}
          >
            <span className="sinif-yks-field__top">
              <span
                className={cn(
                  "sinif-yks-field__code",
                  selected && "sinif-yks-field__code--selected"
                )}
              >
                {opt.code}
              </span>
              {selected ? (
                <span className="sinif-yks-field__check" aria-hidden>
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
              ) : null}
            </span>
            <span className="sinif-yks-field__label">{opt.label}</span>
            <span className="sinif-yks-field__track">{opt.examTrack}</span>
            <span className="sinif-yks-field__desc">{opt.description}</span>
            {selected ? (
              <span
                className={cn(
                  "sinif-yks-field__badge mt-2 inline-flex rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                  badge
                )}
              >
                {CLASS_FIELD_LABEL[opt.value]}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
