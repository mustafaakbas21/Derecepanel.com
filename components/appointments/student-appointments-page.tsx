"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock } from "lucide-react";

import { FilterSegments } from "@/components/appointments/filter-segments";
import {
  StudentAppointmentCard,
  StudentAppointmentInsights,
  StudentNextAppointmentHero,
} from "@/components/appointments/student-appointment-card";
import {
  LIBRARY_PAGE_CLASS,
  LibraryPageHeader,
} from "@/components/library/library-shell";
import { TYPE_FILTER_OPTIONS } from "@/lib/appointments/constants";
import { nextUpcomingAppointment } from "@/lib/appointments/student-scope";
import type { StatusFilterKey } from "@/lib/appointments/types";
import { useStudentAppointments } from "@/lib/appointments/use-student-appointments";

const STATUS_OPTIONS: { value: StatusFilterKey; label: string }[] = [
  { value: "upcoming", label: "Yaklaşanlar" },
  { value: "done", label: "Tamamlananlar" },
  { value: "cancelled", label: "İptal" },
  { value: "all", label: "Tümü" },
];

export function StudentAppointmentsPage() {
  const router = useRouter();
  const {
    list,
    user,
    hydrated,
    coachName,
    filtered,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    counts,
  } = useStudentAppointments();

  useEffect(() => {
    if (hydrated && !user) router.replace("/");
  }, [hydrated, user, router]);

  const nextAppt = useMemo(() => nextUpcomingAppointment(list), [list]);

  const statusOptions = useMemo(
    () =>
      STATUS_OPTIONS.map((o) => ({
        ...o,
        label:
          o.value === "upcoming"
            ? `Yaklaşanlar (${counts.upcoming})`
            : o.value === "done"
              ? `Tamamlananlar (${counts.done})`
              : o.value === "cancelled"
                ? `İptal (${counts.cancelled})`
                : `Tümü (${counts.all})`,
      })),
    [counts]
  );

  if (!hydrated) {
    return <p className="text-sm text-slate-500">Yükleniyor…</p>;
  }

  if (!user) {
    return (
      <p className="text-sm text-slate-500">
        Oturum bulunamadı.{" "}
        <Link href="/" className="font-medium text-slate-900 underline">
          Giriş sayfasına dön
        </Link>
      </p>
    );
  }

  const showHero = statusFilter === "upcoming" && nextAppt != null;
  const listItems = showHero ? filtered.filter((r) => r.id !== nextAppt.id) : filtered;

  return (
    <div className={LIBRARY_PAGE_CLASS}>
      <LibraryPageHeader
        title="Randevularım"
        description={`${coachName} ile planlanan koçluk görüşmeleriniz. Koç panelinden eklenen randevular anında burada görünür.`}
        meta={
          counts.upcoming > 0
            ? `${counts.upcoming} yaklaşan görüşme`
            : "Yaklaşan randevu yok"
        }
      />

      <StudentAppointmentInsights list={list} />

      {showHero ? (
        <StudentNextAppointmentHero appointment={nextAppt} coachName={coachName} />
      ) : null}

      <section
        className="space-y-4 rounded-[1.35rem] border border-slate-200/80 bg-white p-4 sm:p-5"
        style={{ boxShadow: "var(--card-shadow)" }}
        aria-label="Filtreler ve liste"
      >
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <span className="shrink-0 text-[12px] font-semibold uppercase tracking-wide text-slate-400">
              Durum
            </span>
            <FilterSegments
              ariaLabel="Durum filtresi"
              options={statusOptions}
              value={statusFilter}
              onChange={setStatusFilter}
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <span className="shrink-0 text-[12px] font-semibold uppercase tracking-wide text-slate-400">
              Tip
            </span>
            <FilterSegments
              ariaLabel="Tip filtresi"
              options={TYPE_FILTER_OPTIONS}
              value={typeFilter}
              onChange={setTypeFilter}
            />
          </div>
        </div>

        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-16 text-center">
            <div
              className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: "#fff7ed" }}
            >
              <CalendarClock className="h-7 w-7 text-orange-500" strokeWidth={2} />
            </div>
            <p className="text-lg font-semibold text-slate-900">Henüz randevu yok</p>
            <p className="mt-2 max-w-md text-[15px] text-slate-500">
              Koçunuz koç panelinden size randevu oluşturduğunda burada listelenecek.
              Randevular otomatik senkronize olur.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 px-6 py-12 text-center">
            <p className="font-semibold text-slate-900">Bu filtrede randevu yok</p>
            <p className="mt-1 text-sm text-slate-500">Başka bir durum veya tip seçin.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
            {listItems.map((r) => (
              <StudentAppointmentCard
                key={r.id}
                appointment={r}
                coachName={coachName}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
