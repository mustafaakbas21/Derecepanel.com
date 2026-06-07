"use client";

import { Check } from "lucide-react";

import { TOPIC_STATUS_LABELS } from "@/lib/konu-takip/constants";
import type { TopicStatus } from "@/lib/konu-takip/types";
import { cn } from "@/lib/utils";

const ORDER: TopicStatus[] = ["baslanmadi", "calisiliyor", "bitti"];

const ACTIVE_STYLES: Record<TopicStatus, string> = {
  baslanmadi: "bg-white text-slate-800 shadow-sm",
  calisiliyor: "bg-amber-500 text-white shadow-sm",
  bitti: "bg-emerald-600 text-white shadow-sm",
};

export function StatusSegment({
  value,
  onChange,
}: {
  value: TopicStatus;
  onChange: (status: TopicStatus) => void;
}) {
  return (
    <div
      className="inline-flex shrink-0 rounded-xl bg-slate-100 p-1"
      role="group"
      aria-label="Konu durumu"
    >
      {ORDER.map((status) => {
        const active = value === status;
        return (
          <button
            key={status}
            type="button"
            onClick={() => onChange(status)}
            aria-pressed={active}
            className={cn(
              "inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
              active ? ACTIVE_STYLES[status] : "text-slate-500 hover:text-slate-800"
            )}
          >
            {status === "bitti" && active && <Check className="h-3.5 w-3.5" />}
            {TOPIC_STATUS_LABELS[status]}
          </button>
        );
      })}
    </div>
  );
}
