"use client";

import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { StudentProfileDto } from "@/lib/appwrite/profile-types";
import { FIELD_LABELS } from "@/lib/students/constants";

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-slate-100 py-3 last:border-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="text-sm font-medium text-slate-900 sm:text-right">{value?.trim() || "—"}</dd>
    </div>
  );
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: StudentProfileDto | null;
  onRefresh?: () => void;
};

export function StudentProfileDetailDialog({ open, onOpenChange, profile, onRefresh }: Props) {
  const [data, setData] = useState<StudentProfileDto | null>(profile);

  useEffect(() => {
    if (!open) return;
    if (profile) {
      setData(profile);
      return;
    }
    void fetch("/api/profile", { cache: "no-store", credentials: "same-origin" })
      .then((r) => r.json())
      .then((json: { profile?: StudentProfileDto }) => {
        if (json.profile?.role === "student") setData(json.profile);
      })
      .finally(() => onRefresh?.());
  }, [open, profile, onRefresh]);

  const alanLabel =
    data?.alan && data.alan in FIELD_LABELS
      ? FIELD_LABELS[data.alan as keyof typeof FIELD_LABELS]
      : data?.alan;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Öğrenci profili</DialogTitle>
          <DialogDescription>Kayıt ve iletişim bilgileriniz</DialogDescription>
        </DialogHeader>
        {data ? (
          <dl className="mt-2">
            <Row label="Ad soyad" value={data.name} />
            <Row label="Kullanıcı adı" value={data.username} />
            <Row label="Giriş e-postası" value={data.loginEmail} />
            <Row label="Öğrenci kodu" value={data.studentCode} />
            <Row label="Sınıf / şube" value={data.sinifBranch} />
            <Row label="Alan" value={alanLabel} />
            <Row label="Hedef" value={data.goal} />
            <Row label="Üniversite" value={data.targetUniversity} />
            <Row label="Bölüm" value={data.targetDepartment} />
            <Row label="Durum" value={data.status} />
            <Row label="Kayıt tarihi" value={data.kayitDate} />
            <Row label="İletişim e-postası" value={data.email} />
            <Row label="Telefon" value={data.phone} />
            <Row label="Şehir" value={data.city} />
            <Row label="İlçe" value={data.ilce} />
            <Row label="Adres" value={data.address} />
            <Row label="Veli" value={data.parent} />
            <Row label="Veli telefonu" value={data.parentPhone} />
            <Row label="Veli e-postası" value={data.parentEmail} />
            <Row label="Acil notlar" value={data.emergencyNotes} />
          </dl>
        ) : (
          <p className="py-8 text-center text-sm text-slate-500">Profil yükleniyor…</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
