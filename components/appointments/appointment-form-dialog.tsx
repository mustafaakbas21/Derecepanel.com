"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";

import { toast } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DURATION_OPTIONS,
  STATUS_OPTIONS,
  TIP_OPTIONS,
} from "@/lib/appointments/constants";
import { formPreviewWhatsAppUrl } from "@/lib/appointments/messages";
import type { Appointment, AppointmentFormValues, StudentRosterEntry } from "@/lib/appointments/types";
import { defaultFormValues } from "@/lib/appointments/utils";

function appointmentToForm(r: Appointment): AppointmentFormValues {
  return {
    studentId: r.studentId,
    tarih: r.tarih,
    saat: r.saat,
    sure: r.sure || 45,
    tip: r.tip,
    status: r.status,
    konu: r.konu || "",
    notlar: r.notlar || "",
    yer: r.yer || "",
    notifyStudent: false,
  };
}

export function AppointmentFormDialog({
  open,
  onOpenChange,
  editing,
  roster,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Appointment | null;
  roster: StudentRosterEntry[];
  onSave: (values: AppointmentFormValues, editingId: string | null) => boolean;
}) {
  const [form, setForm] = useState<AppointmentFormValues>(defaultFormValues());

  useEffect(() => {
    if (!open) return;
    setForm(editing ? appointmentToForm(editing) : defaultFormValues());
  }, [open, editing]);

  const studentName = useMemo(() => {
    const s = roster.find((x) => x.id === form.studentId);
    return s?.name ?? "";
  }, [form.studentId, roster]);

  const patch = <K extends keyof AppointmentFormValues>(
    key: K,
    value: AppointmentFormValues[K]
  ) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentId) {
      toast.error("Lütfen öğrenci seçin");
      return;
    }
    if (!form.tarih || !form.saat) {
      toast.error("Tarih ve saat gerekli");
      return;
    }
    const ok = onSave(form, editing?.id ?? null);
    if (ok) onOpenChange(false);
  };

  const previewWa = () => {
    if (!studentName || !form.tarih || !form.saat) {
      toast.error("Lütfen öğrenci, tarih ve saat seçin");
      return;
    }
    window.open(formPreviewWhatsAppUrl(studentName, form.tarih, form.saat), "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>{editing ? "Randevuyu düzenle" : "Yeni randevu"}</DialogTitle>
          <DialogDescription>
            Öğrenci, tarih ve görüşme tipini planlayın. Notlar yalnızca koç panelinde görünür.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Lojistik
            </p>
            <div className="space-y-2">
              <Label htmlFor="rnd-student">Öğrenci *</Label>
              <Select
                value={form.studentId || undefined}
                onValueChange={(v) => patch("studentId", v)}
              >
                <SelectTrigger id="rnd-student">
                  <SelectValue placeholder="Öğrenci seçin" />
                </SelectTrigger>
                <SelectContent>
                  {roster.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                      {s.sinifBranch ? ` · ${s.sinifBranch}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="rnd-date">Tarih *</Label>
                <Input
                  id="rnd-date"
                  type="date"
                  value={form.tarih}
                  onChange={(e) => patch("tarih", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rnd-time">Saat *</Label>
                <Input
                  id="rnd-time"
                  type="time"
                  value={form.saat}
                  onChange={(e) => patch("saat", e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Süre</Label>
                <Select
                  value={String(form.sure)}
                  onValueChange={(v) => patch("sure", Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((d) => (
                      <SelectItem key={d} value={String(d)}>
                        {d} dk
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tip</Label>
                <Select
                  value={form.tip}
                  onValueChange={(v) =>
                    patch("tip", v as AppointmentFormValues["tip"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIP_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Durum</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  patch("status", v as AppointmentFormValues["status"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rnd-yer">Yer / Online link</Label>
              <Input
                id="rnd-yer"
                value={form.yer}
                onChange={(e) => patch("yer", e.target.value)}
                placeholder="Adres veya https://meet.google.com/..."
              />
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              İçerik
            </p>
            <div className="space-y-2">
              <Label htmlFor="rnd-konu">Konu</Label>
              <Input
                id="rnd-konu"
                value={form.konu}
                onChange={(e) => patch("konu", e.target.value)}
                placeholder="Görüşme konusu"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rnd-notlar">Notlar (yalnızca koç)</Label>
              <textarea
                id="rnd-notlar"
                rows={4}
                className="flex w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                value={form.notlar}
                onChange={(e) => patch("notlar", e.target.value)}
              />
            </div>
            {!editing ? (
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                <Checkbox
                  checked={form.notifyStudent}
                  onCheckedChange={(v) => patch("notifyStudent", v === true)}
                />
                Öğrenci paneline bildirim gönder
              </label>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="w-full border-emerald-200 text-emerald-800 hover:bg-emerald-50"
              onClick={previewWa}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              WhatsApp önizleme (test no)
            </Button>
          </div>

          <DialogFooter className="md:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" variant="primary">
              Kaydet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
