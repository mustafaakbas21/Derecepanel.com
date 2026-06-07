"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

export function OnyxCurriculumBadge({
  topicLabel,
  className,
  href = "/ogrenci/konu-takip",
}: {
  topicLabel?: string;
  className?: string;
  href?: string;
}) {
  return (
    <div
      className={cn(
        "mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50 to-teal-50/80 px-4 py-3 text-sm shadow-sm",
        className
      )}
    >
      <CheckCircle2
        className="h-5 w-5 shrink-0 text-emerald-600"
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-emerald-900">
          Konu Takip Merkezine Eklendi ✅
        </p>
        {topicLabel ? (
          <p className="mt-0.5 truncate text-xs text-emerald-800/90">
            {topicLabel}
          </p>
        ) : null}
      </div>
      <Link
        href={href}
        className="shrink-0 text-xs font-medium text-emerald-800 underline-offset-2 hover:underline"
      >
        Görüntüle →
      </Link>
    </div>
  );
}
