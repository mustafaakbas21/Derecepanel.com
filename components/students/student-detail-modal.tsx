"use client";

import { useEffect } from "react";
import { Copy, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  FIELD_LABELS,
  GENDER_LABELS,
  PARENT_RELATION_LABELS,
  STATUS_LABELS,
  STATUS_STYLES,
  getInitials,
} from "@/lib/students/constants";
import { formatKayitDate } from "@/lib/students/storage";
import type { StudentRecord } from "@/lib/students/types";
import { cn } from "@/lib/utils";

import { useToast } from "./use-toast";

type Props = {
  student: StudentRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (s: StudentRecord) => void;
};

function CopyBtn({ value, label }: { value: string; label: string }) {
  const { toast } = useToast();
  if (!value) return null;
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          toast(`${label} kopyalandı`);
        } catch {
          toast("Kopyalama başarısız", "error");
        }
      }}
      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"
    >
      <Copy className="h-3 w-3" />
      Kopyala
    </button>
  );
}

function DetailCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-2 border-b border-slate-50 py-2 last:border-0">
      <span className="text-[12px] text-slate-500">{label}</span>
      <span className="text-right text-[12px] font-semibold text-slate-800">{value}</span>
    </div>
  );
}

export function StudentDetailModal({ student, open, onOpenChange, onEdit }: Props) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!student || !open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-detail-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        aria-label="Kapat"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-gradient-to-b from-slate-50 to-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-5 top-5 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
        >
          <X className="h-5 w-5" />
        </button>

        <header className="mb-6 flex items-center gap-4 pr-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-lg font-bold text-white">
            {getInitials(student.name)}
          </div>
          <div>
            <h2 id="student-detail-title" className="text-xl font-bold text-slate-900">
              {student.name}
            </h2>
            <span
              className={cn(
                "mt-1 inline-flex rounded-lg border px-2.5 py-0.5 text-[11px] font-semibold",
                STATUS_STYLES[student.status]
              )}
            >
              {STATUS_LABELS[student.status]}
            </span>
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <DetailCard title="Kişisel">
            <Row label="TC" value={student.tcNo} />
            <Row label="Doğum" value={student.birthDate} />
            <Row label="Telefon" value={student.phone} />
            <Row label="E-posta" value={student.email} />
            <Row label="Cinsiyet" value={student.gender ? GENDER_LABELS[student.gender] : undefined} />
            <div className="mt-2 flex flex-wrap gap-2">
              <CopyBtn value={student.phone ?? ""} label="Telefon" />
            </div>
          </DetailCard>

          <DetailCard title="Akademik">
            <Row label="Sınıf" value={student.sinifBranch} />
            <Row label="Alan" value={FIELD_LABELS[student.alan]} />
            <Row label="Hedef Üniversite" value={student.targetUniversity} />
            <Row label="Hedef Bölüm" value={student.targetDepartment} />
            <Row label="Hedef" value={student.goal} />
          </DetailCard>

          <DetailCard title="Veli">
            <Row label="Ad" value={student.parent} />
            <Row label="Telefon" value={student.parentPhone} />
            <Row
              label="Yakınlık"
              value={
                student.parentRelation
                  ? PARENT_RELATION_LABELS[student.parentRelation]
                  : undefined
              }
            />
            <div className="mt-2">
              <CopyBtn value={student.parentPhone} label="Veli telefonu" />
            </div>
          </DetailCard>

          <DetailCard title="Sistem">
            <Row label="Öğrenci No" value={student.studentCode} />
            <Row label="Kayıt" value={formatKayitDate(student.kayitDate)} />
            <Row label="Kullanıcı adı" value={student.kullaniciAdi} />
            <Row label="Panel şifresi" value={student.panelSifre ? "••••••••" : undefined} />
            <div className="mt-2 flex flex-wrap gap-2">
              <CopyBtn value={student.studentCode} label="Öğrenci no" />
              {student.panelSifre && (
                <CopyBtn value={student.panelSifre} label="Şifre" />
              )}
            </div>
          </DetailCard>
        </div>

        <footer className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
            Kapat
          </Button>
          <Button
            className="rounded-xl bg-slate-900 text-white hover:bg-slate-800"
            onClick={() => {
              onOpenChange(false);
              onEdit(student);
            }}
          >
            Düzenle
          </Button>
        </footer>
      </div>
    </div>
  );
}
