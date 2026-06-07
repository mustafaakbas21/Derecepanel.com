"use client";

import { useMemo, useState } from "react";
import { CalendarPlus, MessageCircle, Search } from "lucide-react";

import { AppointmentBulkDialog } from "@/components/appointments/appointment-bulk-dialog";
import { AppointmentCard } from "@/components/appointments/appointment-card";
import { AppointmentFormDialog } from "@/components/appointments/appointment-form-dialog";
import { AppointmentInsights } from "@/components/appointments/appointment-insights";
import { FilterSegments } from "@/components/appointments/filter-segments";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  STATUS_FILTER_OPTIONS,
  TYPE_FILTER_OPTIONS,
} from "@/lib/appointments/constants";
import type { Appointment } from "@/lib/appointments/types";
import { useAppointments } from "@/lib/appointments/use-appointments";

export function CoachAppointmentsPage() {
  const {
    list,
    hydrated,
    roster,
    filtered,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    upsert,
    remove,
  } = useAppointments();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Appointment | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkSelected, setBulkSelected] = useState<Record<string, boolean>>({});

  const bulkList = useMemo(
    () => list.filter((r) => bulkSelected[r.id]),
    [list, bulkSelected]
  );

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (r: Appointment) => {
    setEditing(r);
    setFormOpen(true);
  };

  const emptyAll = hydrated && list.length === 0;
  const emptyFilter = hydrated && list.length > 0 && filtered.length === 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Randevular</h1>
          <p className="mt-1 max-w-xl text-[15px] text-slate-500">
            Öğrencilerinizle planladığınız görüşmeleri takip edin, hatırlatma gönderin ve haftalık
            yoğunluğu görün.
          </p>
        </div>
        <Button type="button" variant="primary" className="shrink-0" onClick={openCreate}>
          <CalendarPlus className="mr-2 h-4 w-4" />
          Yeni randevu
        </Button>
      </header>

      <AppointmentInsights list={list} />

      <section
        className="space-y-4 rounded-[1.25rem] border border-slate-200/80 bg-white p-4 sm:p-5"
        style={{ boxShadow: "var(--card-shadow)" }}
        aria-label="Filtreler ve liste"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0 flex-1 lg:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="h-11 border-slate-200 bg-slate-50/50 pl-9"
              placeholder="Öğrenci adına göre ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Öğrenci ara"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={bulkList.length === 0}
            className="h-11 shrink-0 border-emerald-200 text-emerald-800 hover:bg-emerald-50"
            onClick={() => setBulkOpen(true)}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Toplu mesaj ({bulkList.length})
          </Button>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <span className="shrink-0 text-[12px] font-semibold uppercase tracking-wide text-slate-400">
              Durum
            </span>
            <FilterSegments
              ariaLabel="Durum filtresi"
              options={STATUS_FILTER_OPTIONS}
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
      </section>

      {!hydrated ? (
        <p className="text-sm text-slate-500">Yükleniyor…</p>
      ) : emptyAll ? (
        <div
          className="flex flex-col items-center justify-center rounded-[1.35rem] border border-dashed border-slate-200 bg-white px-6 py-16 text-center"
          style={{ boxShadow: "var(--card-shadow)" }}
        >
          <p className="text-lg font-semibold text-slate-900">Henüz randevu yok</p>
          <p className="mt-2 max-w-sm text-sm text-slate-500">
            İlk görüşmenizi planlayarak haftalık takviminizi oluşturun.
          </p>
          <Button variant="primary" className="mt-6" onClick={openCreate}>
            Yeni randevu
          </Button>
        </div>
      ) : emptyFilter ? (
        <div className="rounded-[1.35rem] border border-slate-200 bg-white px-6 py-12 text-center">
          <p className="font-semibold text-slate-900">Sonuç bulunamadı</p>
          <p className="mt-1 text-sm text-slate-500">Filtreleri veya aramayı değiştirin.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => (
            <AppointmentCard
              key={r.id}
              appointment={r}
              roster={roster}
              selected={Boolean(bulkSelected[r.id])}
              onSelect={(on) =>
                setBulkSelected((prev) => {
                  const next = { ...prev };
                  if (on) next[r.id] = true;
                  else delete next[r.id];
                  return next;
                })
              }
              onEdit={() => openEdit(r)}
              onDelete={() => setDeleteTarget(r)}
            />
          ))}
        </div>
      )}

      <AppointmentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        roster={roster}
        onSave={upsert}
      />

      <AppointmentBulkDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        appointments={bulkList}
        roster={roster}
      />

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Randevuyu sil</DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? `${deleteTarget.ogrenci} · ${deleteTarget.tarih} ${deleteTarget.saat} kaydı kalıcı olarak silinecek.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Vazgeç
            </Button>
            <Button
              type="button"
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => {
                if (deleteTarget) remove(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
