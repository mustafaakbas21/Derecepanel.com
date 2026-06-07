"use client";

import Link from "next/link";
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Globe2,
  Hash,
  Sparkles,
} from "lucide-react";

import { DurumBadge, ExamTypeBadge } from "@/components/exams/exam-type-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { STUDENT_DENEME_ROUTES } from "@/lib/student/sidebar-nav-config";
import type { StudentExamView } from "@/lib/student/student-exams-scope";
import { cn } from "@/lib/utils";

type Props = {
  exam: StudentExamView;
  highlight?: boolean;
};

const SCOPE_STYLE = {
  kurumsal: "bg-slate-900 text-white",
  global: "bg-orange-500 text-white",
} as const;

function dateParts(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return { day: "—", month: "—" };
  const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  return { day: String(d.getDate()), month: months[d.getMonth()] ?? "—" };
}

export function StudentExamCard({ exam, highlight = false }: Props) {
  const parts = dateParts(exam.tarih);
  const scopeKey = exam.isGlobal ? "global" : "kurumsal";
  const urgent = exam.daysUntil >= 0 && exam.daysUntil <= 3;

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-white transition duration-150 hover:border-slate-300 hover:shadow-md",
        highlight ? "border-slate-900/20 ring-1 ring-slate-900/10" : "border-slate-200/80",
        urgent && !highlight && "border-orange-200/80"
      )}
      style={{ boxShadow: "var(--card-shadow-sm)" }}
    >
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5">
        <div
          className={cn(
            "flex w-full shrink-0 flex-row items-center gap-3 sm:w-[4.5rem] sm:flex-col sm:items-center sm:gap-1 sm:text-center",
            highlight && "sm:pt-1"
          )}
        >
          <div
            className={cn(
              "flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border",
              highlight
                ? "border-slate-900/10 bg-slate-900 text-white"
                : "border-slate-100 bg-slate-50 text-slate-900"
            )}
          >
            <span className="text-xl font-bold tabular-nums leading-none">{parts.day}</span>
            <span className={cn("text-[11px] font-semibold uppercase", highlight ? "text-slate-300" : "text-slate-500")}>
              {parts.month}
            </span>
          </div>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-bold",
              urgent ? "bg-orange-100 text-orange-800" : "bg-slate-100 text-slate-600"
            )}
          >
            {exam.countdownLabel}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", SCOPE_STYLE[scopeKey])}>
              {exam.isGlobal ? (
                <span className="inline-flex items-center gap-1">
                  <Globe2 className="h-3 w-3" />
                  Global
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  Kurumsal
                </span>
              )}
            </span>
            <ExamTypeBadge sinav={exam.sinav} />
            {!exam.isGlobal && exam.durum ? <DurumBadge durum={exam.durum} /> : null}
            {exam.hasResult ? (
              <Badge variant="teal" className="gap-1 font-normal">
                <CheckCircle2 className="h-3 w-3" />
                Sonuç: {exam.studentNet} net
              </Badge>
            ) : null}
          </div>

          <h3 className="mt-2 text-base font-bold leading-snug text-slate-900 sm:text-lg">
            {exam.name || exam.ad || "Deneme"}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="h-4 w-4 text-slate-400" />
              {exam.dateLabel} · {exam.timeLabel}
            </span>
            {exam.soruSayisi ? (
              <span className="inline-flex items-center gap-1.5">
                <Hash className="h-4 w-4 text-slate-400" />
                {exam.soruSayisi} soru
              </span>
            ) : null}
            {exam.publisher ? (
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-orange-400" />
                {exam.publisher}
              </span>
            ) : null}
          </div>

          {!exam.isGlobal && exam.ogrenciKapsam === "secili" ? (
            <p className="mt-2 text-xs text-slate-500">Seçili öğrenci grubuna yönelik kurum denemesi</p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">
          {exam.hasResult ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={STUDENT_DENEME_ROUTES.sonuclar}>Sonucu gör</Link>
            </Button>
          ) : exam.isGlobal ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={STUDENT_DENEME_ROUTES.global}>Global takvim</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function StudentExamHero({ exam }: { exam: StudentExamView }) {
  return (
    <section
      className="overflow-hidden rounded-2xl bg-slate-900 text-white"
      style={{ boxShadow: "var(--card-shadow)" }}
    >
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <CalendarClock className="h-4 w-4 text-orange-400" />
            Sıradaki deneme
          </p>
          <h2 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">
            {exam.name || exam.ad}
          </h2>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-300">
            <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-xs font-bold">
              {exam.sinav}
            </span>
            <span>{exam.isGlobal ? "Global deneme" : "Kurumsal deneme"}</span>
            <span>·</span>
            <span>
              {exam.dateLabel} · {exam.timeLabel}
            </span>
          </p>
          <p className="mt-3 text-sm text-slate-400">
            {exam.publisher ? `${exam.publisher} · ` : ""}
            {exam.soruSayisi ? `${exam.soruSayisi} soru` : "Planlanmış deneme"}
          </p>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Kalan</p>
            <p className="mt-1 text-3xl font-bold tabular-nums">
              {exam.daysUntil <= 0 ? "Bugün" : exam.daysUntil}
            </p>
            {exam.daysUntil > 0 ? (
              <p className="text-xs text-slate-400">gün</p>
            ) : (
              <p className="text-xs text-orange-300">Deneme günü</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
