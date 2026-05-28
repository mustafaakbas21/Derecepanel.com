"use client";

import { useState } from "react";
import {
  Calendar,
  Clock,
  MessageCircle,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cardWhatsAppMessage } from "@/lib/appointments/messages";
import { findRosterStudent } from "@/lib/appointments/students";
import type { Appointment, StudentRosterEntry } from "@/lib/appointments/types";
import {
  avatarStyle,
  formatTrShortDate,
  getEffectiveStatus,
  getStatusBadgeText,
  initials,
  openWhatsApp,
  pickStudentPhone,
  tipLabel,
} from "@/lib/appointments/utils";
import { cn } from "@/lib/utils";

function statusBadgeVariant(r: Appointment): "high" | "low" | "blue" | "medium" {
  const eff = getEffectiveStatus(r);
  if (eff === "iptal") return "high";
  if (eff === "tamamlandi") return "low";
  return "blue";
}

function tipPillClass(tip: Appointment["tip"]) {
  if (tip === "online") return "bg-sky-50 text-sky-700 border-sky-200";
  if (tip === "telefon") return "bg-teal-50 text-teal-700 border-teal-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

export function AppointmentCard({
  appointment: r,
  roster,
  selected,
  onSelect,
  onEdit,
  onDelete,
}: {
  appointment: Appointment;
  roster: StudentRosterEntry[];
  selected: boolean;
  onSelect: (on: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const stu = findRosterStudent(roster, r.studentId);
  const konu = r.konu?.trim() || "Görüşme";
  const badgeText = getStatusBadgeText(r);

  const handleWa = () => {
    const gsm = pickStudentPhone(stu ?? {}) || "905000000000";
    const ogr = r.ogrenci || stu?.name || "Öğrenci";
    openWhatsApp(gsm, cardWhatsAppMessage(ogr, r.tarih, r.saat));
  };

  return (
    <article
      className="relative flex flex-col rounded-[1.25rem] border border-slate-200/80 bg-white p-4 transition hover:border-slate-300"
      style={{ boxShadow: "var(--card-shadow)" }}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={selected}
            onCheckedChange={(v) => onSelect(v === true)}
            aria-label="Toplu mesaj için seç"
          />
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
            style={avatarStyle(r.ogrenci)}
          >
            {initials(r.ogrenci)}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{r.ogrenci}</p>
            <p className="text-[13px] text-slate-500">
              {konu} · {r.sure} dk
            </p>
          </div>
        </div>
        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
          {menuOpen ? (
            <>
              <button
                type="button"
                className="fixed inset-0 z-10"
                aria-label="Menüyü kapat"
                onClick={() => setMenuOpen(false)}
              />
              <div
                role="menu"
                className="absolute right-0 z-20 mt-1 min-w-[140px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
              >
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit();
                  }}
                >
                  <Pencil className="h-4 w-4" /> Düzenle
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete();
                  }}
                >
                  <Trash2 className="h-4 w-4" /> Sil
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
            tipPillClass(r.tip)
          )}
        >
          {tipLabel(r.tip)}
        </span>
        <Badge variant={statusBadgeVariant(r)}>{badgeText}</Badge>
      </div>

      <div className="flex flex-wrap gap-4 text-[13px] text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-slate-400" />
          {formatTrShortDate(r.tarih)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-slate-400" />
          {r.saat}
        </span>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full border-emerald-200 bg-emerald-50/50 text-emerald-800 hover:bg-emerald-50"
          onClick={handleWa}
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          WhatsApp
        </Button>
      </div>
    </article>
  );
}
