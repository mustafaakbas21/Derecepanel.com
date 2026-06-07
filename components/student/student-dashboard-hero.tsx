import { Sparkles } from "lucide-react";

import {
  studentDashboardGreeting,
  type StudentDashboardData,
} from "@/lib/student/dashboard/types";
import { cn } from "@/lib/utils";

type Props = {
  data: Pick<StudentDashboardData, "briefingText" | "source" | "generatedAt">;
  className?: string;
};

export function StudentDashboardHero({ data, className }: Props) {
  const greeting = studentDashboardGreeting();
  const body = data.briefingText
    .replace(/^(Günaydın|İyi günler|İyi akşamlar)[.!]?\s*/i, "")
    .trim();

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-violet-200/80 bg-gradient-to-br from-white via-violet-50/40 to-amber-50/30 p-5 shadow-sm sm:p-6",
        className
      )}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-36 w-36 rounded-full bg-violet-300/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-8 left-1/3 h-28 w-28 rounded-full bg-amber-200/30 blur-3xl"
        aria-hidden
      />
      <div className="relative flex gap-4 sm:gap-5">
        <span
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-amber-300 shadow-lg shadow-violet-900/20 ring-2 ring-amber-200/50"
          aria-hidden
        >
          <Sparkles className="h-6 w-6 drop-shadow-[0_0_10px_rgba(251,191,36,0.65)]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-700/80">
            Onyx · Günlük brifing
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-slate-800 sm:text-base">
            <span className="font-semibold text-slate-900">{greeting}!</span>{" "}
            {body}
          </p>
          {data.generatedAt ? (
            <p className="mt-3 text-[11px] text-slate-400">
              {data.source === "appwrite"
                ? "Canlı veri · Appwrite"
                : "Veri bekleniyor · Appwrite yapılandırın"}
              {" · "}
              {new Date(data.generatedAt).toLocaleTimeString("tr-TR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
