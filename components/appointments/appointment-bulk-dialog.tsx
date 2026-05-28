"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { Appointment, StudentRosterEntry } from "@/lib/appointments/types";
import { findRosterStudent } from "@/lib/appointments/students";
import { buildWhatsAppUrl, pickStudentPhone } from "@/lib/appointments/utils";

export function AppointmentBulkDialog({
  open,
  onOpenChange,
  appointments,
  roster,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointments: Appointment[];
  roster: StudentRosterEntry[];
}) {
  const [message, setMessage] = useState("");
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      setMessage("");
      setSentIds(new Set());
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Toplu WhatsApp</DialogTitle>
          <DialogDescription>
            Ortak mesajı yazın; her öğrenci için ayrı gönderim linki açılır.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="bulk-msg">Mesaj</Label>
          <textarea
            id="bulk-msg"
            rows={4}
            className="flex w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Merhaba, bu haftaki görüşme planı hakkında..."
          />
        </div>

        <ul className="max-h-[280px] space-y-2 overflow-y-auto">
          {appointments.map((r) => {
            const stu = findRosterStudent(roster, r.studentId);
            const tel = pickStudentPhone(stu ?? {}) || "905000000000";
            const sent = sentIds.has(r.id);
            return (
              <li
                key={r.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2"
              >
                <span className="text-sm font-medium text-slate-800">
                  {r.ogrenci}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={sent || !message.trim()}
                  className="border-emerald-200 text-emerald-800"
                  onClick={() => {
                    const url = buildWhatsAppUrl(tel, message);
                    window.open(url, "_blank");
                    setSentIds((prev) => new Set(prev).add(r.id));
                  }}
                >
                  {sent ? "Gönderildi" : "Gönder"}
                </Button>
              </li>
            );
          })}
        </ul>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Kapat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
