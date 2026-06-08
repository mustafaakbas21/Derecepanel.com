"use client";

import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CoachProfileDto } from "@/lib/appwrite/profile-types";

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-slate-100 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="text-sm font-medium text-slate-900">{value?.trim() || "—"}</dd>
    </div>
  );
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: CoachProfileDto | null;
  onRefresh?: () => void;
};

export function CoachProfileDetailDialog({ open, onOpenChange, profile, onRefresh }: Props) {
  const [data, setData] = useState<CoachProfileDto | null>(profile);

  useEffect(() => {
    if (!open) return;
    if (profile) {
      setData(profile);
      return;
    }
    void fetch("/api/profile", { cache: "no-store", credentials: "same-origin" })
      .then((r) => r.json())
      .then((json: { profile?: CoachProfileDto }) => {
        if (json.profile?.role === "coach") setData(json.profile);
      })
      .finally(() => onRefresh?.());
  }, [open, profile, onRefresh]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Koç profili</DialogTitle>
          <DialogDescription>Hesap ve iletişim bilgileriniz</DialogDescription>
        </DialogHeader>
        {data ? (
          <dl className="mt-2">
            <Row label="Ad soyad" value={data.displayName} />
            <Row label="Kullanıcı adı" value={data.username} />
            <Row label="Giriş e-postası" value={data.loginEmail} />
            <Row label="Telefon" value={data.phone} />
            <Row label="Uzmanlık" value={data.specialty} />
            <Row label="Durum" value={data.status} />
            <Row label="Koç ID" value={data.coachId} />
          </dl>
        ) : (
          <p className="py-8 text-center text-sm text-slate-500">Profil yükleniyor…</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
