"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Radar,
  RefreshCw,
  Sparkles,
  Video,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  coachBriefingGreeting,
  stripBriefingGreetingPrefix,
} from "@/lib/coach/briefing-types";
import { useCoachBriefing } from "@/lib/coach/use-coach-briefing";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

function SectionTitle({
  icon: Icon,
  title,
  tone = "slate",
}: {
  icon: typeof Clock;
  title: string;
  tone?: "slate" | "amber" | "rose";
}) {
  const toneClass =
    tone === "amber"
      ? "text-amber-700"
      : tone === "rose"
        ? "text-rose-700"
        : "text-slate-700";

  return (
    <h3
      className={cn(
        "mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide",
        toneClass
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {title}
    </h3>
  );
}

function BriefingSkeleton({ className }: { className?: string }) {
  return (
    <section
      className={cn("animate-pulse space-y-4", className)}
      aria-busy
      aria-label="Brifing yükleniyor"
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex gap-4">
          <div className="h-12 w-12 shrink-0 rounded-2xl bg-slate-200" />
          <div className="min-w-0 flex-1 space-y-3">
            <div className="h-3 w-48 rounded bg-slate-200" />
            <div className="h-4 w-full rounded bg-slate-100" />
            <div className="h-4 w-5/6 rounded bg-slate-100" />
            <div className="h-4 w-2/3 rounded bg-slate-100" />
          </div>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="h-3 w-36 rounded bg-slate-200" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-xl bg-slate-100" />
            ))}
          </div>
        </div>
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="h-3 w-40 rounded bg-slate-200" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-slate-100" />
          ))}
        </div>
      </div>
    </section>
  );
}

function EmptyList({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-3 py-4 text-center text-sm text-slate-500">
      {children}
    </p>
  );
}

export function OnyxCoachBriefing({ className }: Props) {
  const router = useRouter();
  const { data, loading, error, refresh } = useCoachBriefing();
  const [refreshing, setRefreshing] = useState(false);
  const greeting = coachBriefingGreeting();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
      router.refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh, router]);

  const isBusy = loading || refreshing;

  if (loading && !data) {
    return <BriefingSkeleton className={className} />;
  }

  if (error && !data) {
    return (
      <section
        className={cn(
          "rounded-2xl border border-rose-200 bg-rose-50/40 p-5 text-center",
          className
        )}
      >
        <p className="text-sm text-rose-800">{error}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => void handleRefresh()}
          disabled={isBusy}
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isBusy && "animate-spin")} aria-hidden />
          Yeniden dene
        </Button>
      </section>
    );
  }

  if (!data) return null;

  const briefingBody = stripBriefingGreetingPrefix(data.briefingText);

  return (
    <section
      className={cn("space-y-4", className)}
      aria-label="Proaktif Onyx Asistanı"
    >
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div
          className="pointer-events-none absolute -left-8 -top-8 h-32 w-32 rounded-full bg-amber-200/30 blur-3xl"
          aria-hidden
        />
        <div className="relative flex gap-4 sm:gap-5">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-amber-300 shadow-lg shadow-slate-900/20 ring-2 ring-amber-200/40"
            aria-hidden
          >
            <Sparkles className="h-5 w-5 drop-shadow-[0_0_8px_rgba(251,191,36,0.55)]" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Proaktif Onyx Asistanı · Günlük brifing
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-slate-500"
                onClick={() => void handleRefresh()}
                disabled={isBusy}
              >
                <RefreshCw
                  className={cn("h-3.5 w-3.5", isBusy && "animate-spin")}
                  aria-hidden
                />
                Yenile
              </Button>
            </div>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-800 sm:text-base">
              <span className="font-semibold text-slate-900">{greeting}.</span>{" "}
              {briefingBody}
            </p>
            {data.source ? (
              <p className="mt-3 text-[11px] text-slate-400">
                {data.source === "appwrite"
                  ? "Canlı veri · Appwrite"
                  : "Canlı veri · panel senkronu"}
                {data.generatedAt
                  ? ` · ${new Date(data.generatedAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`
                  : null}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <SectionTitle icon={CalendarClock} title="Aksiyon bekleyenler" />

          <div className="mb-6">
            <SectionTitle icon={Clock} title="Bugünkü randevular" />
            {data.appointments.length === 0 ? (
              <EmptyList>Bugün için randevu yok.</EmptyList>
            ) : (
              <ul className="space-y-2">
                {data.appointments.map((apt) => (
                  <li
                    key={apt.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        <span className="tabular-nums text-slate-600">
                          {apt.time}
                        </span>
                        <span className="mx-2 text-slate-300">·</span>
                        {apt.studentName}
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      className="h-8 shrink-0 rounded-lg px-3 text-xs"
                      asChild
                    >
                      <Link href={apt.href}>
                        <Video className="h-3.5 w-3.5" aria-hidden />
                        Görüşmeye başla
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mb-6">
            <SectionTitle
              icon={AlertTriangle}
              title="Analiz bekleyenler"
              tone="amber"
            />
            {data.pending.length === 0 ? (
              <EmptyList>Bekleyen analiz veya hatırlatma yok.</EmptyList>
            ) : (
              <ul className="space-y-2">
                {data.pending.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-amber-100 bg-amber-50/50 px-3 py-2.5"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-semibold text-amber-900">
                        {item.label}
                      </p>
                      <p className="mt-0.5 text-sm text-amber-950/80">
                        {item.detail}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 shrink-0 rounded-lg border-amber-200 bg-white px-3 text-xs text-amber-900 hover:bg-amber-50"
                      asChild
                    >
                      <Link href={item.href}>{item.actionLabel}</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <SectionTitle icon={CheckCircle2} title="Tamamlananlar" />
            {data.completed.length === 0 ? (
              <EmptyList>Son 48 saatte tamamlanan kayıt yok.</EmptyList>
            ) : (
              <ul className="space-y-2">
                {data.completed.map((item) => (
                  <li
                    key={item.id}
                    className="flex gap-2 rounded-xl border border-emerald-100 bg-emerald-50/40 px-3 py-2.5 text-sm text-slate-700"
                  >
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                      aria-hidden
                    />
                    {item.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <SectionTitle icon={Radar} title="Onyx öğrenci radarı" tone="rose" />
          <p className="mb-4 text-sm text-slate-600">
            Acil müdahale veya yakın takip gerektiren öğrenciler.
          </p>
          {data.radar.length === 0 ? (
            <EmptyList>Radarda riskli öğrenci yok.</EmptyList>
          ) : (
            <ul className="space-y-2">
              {data.radar.map((student) => {
                const isCritical = student.severity === "critical";
                return (
                  <li
                    key={student.id}
                    className={cn(
                      "flex flex-wrap items-start justify-between gap-2 rounded-xl border px-3 py-3",
                      isCritical
                        ? "border-rose-200 bg-rose-50/60"
                        : "border-orange-200 bg-orange-50/50"
                    )}
                  >
                    <div className="flex min-w-0 gap-2.5">
                      <AlertTriangle
                        className={cn(
                          "mt-0.5 h-4 w-4 shrink-0",
                          isCritical ? "text-rose-600" : "text-orange-600"
                        )}
                        aria-hidden
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {student.name}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                          {student.alert}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-8 shrink-0 rounded-lg px-3 text-xs",
                        isCritical
                          ? "border-rose-200 text-rose-800 hover:bg-rose-50"
                          : "border-orange-200 text-orange-900 hover:bg-orange-50"
                      )}
                      asChild
                    >
                      <Link href={student.href}>İncele</Link>
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
