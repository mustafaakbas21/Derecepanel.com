"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

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
import { Label } from "@/components/ui/label";
import type { CoachProfileDto } from "@/lib/appwrite/profile-types";
import { appToast } from "@/lib/notify";
import { cn } from "@/lib/utils";

const inputCls =
  "h-11 rounded-xl border-slate-200 bg-white text-[15px] shadow-sm focus-visible:ring-2 focus-visible:ring-slate-200/80";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: CoachProfileDto | null;
  onSaved?: () => void;
};

export function CoachProfileSettingsDialog({ open, onOpenChange, profile, onSaved }: Props) {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !profile) return;
    setDisplayName(profile.displayName);
    setUsername(profile.username);
    setPhone(profile.phone || "");
    setSpecialty(profile.specialty || "");
    setCurrentPassword("");
    setNewPassword("");
    setError("");
  }, [open, profile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          username,
          phone,
          specialty,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });
      const data = (await res.json()) as { error?: string; reloginSuggested?: boolean };
      if (!res.ok) throw new Error(data.error || "Kaydedilemedi.");

      appToast.success("Profil güncellendi.");
      onSaved?.();
      onOpenChange(false);

      if (data.reloginSuggested) {
        appToast.info("Kullanıcı adı veya şifre değişti — bir sonraki girişte yeni bilgileri kullanın.");
      }
    } catch (err) {
      setError(String((err as Error).message));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Profil ayarları</DialogTitle>
          <DialogDescription>
            Değişiklikler Appwrite hesabınıza kaydedilir.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="coach-display-name">Ad soyad</Label>
            <Input
              id="coach-display-name"
              className={inputCls}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="coach-username">Kullanıcı adı</Label>
            <Input
              id="coach-username"
              className={inputCls}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="coach-phone">Telefon</Label>
              <Input
                id="coach-phone"
                className={inputCls}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coach-specialty">Uzmanlık</Label>
              <Input
                id="coach-specialty"
                className={inputCls}
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Şifre değiştir
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="coach-current-pass">Mevcut şifre</Label>
              <div className="relative">
                <Input
                  id="coach-current-pass"
                  type={showCurrent ? "text" : "password"}
                  className={cn(inputCls, "pr-11")}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  onClick={() => setShowCurrent((v) => !v)}
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coach-new-pass">Yeni şifre</Label>
              <div className="relative">
                <Input
                  id="coach-new-pass"
                  type={showNew ? "text" : "password"}
                  className={cn(inputCls, "pr-11")}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  onClick={() => setShowNew((v) => !v)}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">En az 8 karakter</p>
            </div>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
