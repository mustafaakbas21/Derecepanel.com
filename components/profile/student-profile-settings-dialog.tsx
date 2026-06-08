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
import type { StudentProfileDto } from "@/lib/appwrite/profile-types";
import { appToast } from "@/lib/notify";
import { cn } from "@/lib/utils";

const inputCls =
  "h-11 rounded-xl border-slate-200 bg-white text-[15px] shadow-sm focus-visible:ring-2 focus-visible:ring-slate-200/80";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      {children}
    </section>
  );
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: StudentProfileDto | null;
  onSaved?: () => void;
};

export function StudentProfileSettingsDialog({ open, onOpenChange, profile, onSaved }: Props) {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [city, setCity] = useState("");
  const [ilce, setIlce] = useState("");
  const [address, setAddress] = useState("");
  const [parent, setParent] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [emergencyNotes, setEmergencyNotes] = useState("");
  const [notes, setNotes] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !profile) return;
    setDisplayName(profile.name);
    setUsername(profile.username);
    setContactEmail(profile.email || "");
    setPhone(profile.phone || "");
    setBirthDate(profile.birthDate || "");
    setCity(profile.city || "");
    setIlce(profile.ilce || "");
    setAddress(profile.address || "");
    setParent(profile.parent);
    setParentPhone(profile.parentPhone);
    setParentEmail(profile.parentEmail || "");
    setEmergencyNotes(profile.emergencyNotes || "");
    setNotes(profile.notes || "");
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
          contactEmail,
          phone,
          birthDate,
          city,
          ilce,
          address,
          parent,
          parentPhone,
          parentEmail,
          emergencyNotes,
          notes,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });
      const data = (await res.json()) as { error?: string; reloginSuggested?: boolean };
      if (!res.ok) throw new Error(data.error || "Kaydedilemedi.");

      appToast.success("Profil güncellendi.");
      onSaved?.();
      onOpenChange(false);

      if (data.reloginSuggested || newPassword || username !== profile?.username) {
        appToast.info("Hesap bilgileri değişti — çıkış yapıp yeni bilgilerle giriş yapın.");
      }
    } catch (err) {
      setError(String((err as Error).message));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Profil ayarları</DialogTitle>
          <DialogDescription>
            Bilgileriniz Appwrite ve öğrenci kaydınıza kaydedilir.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4">
          <Section title="Hesap">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="student-display-name">Ad soyad</Label>
                <Input
                  id="student-display-name"
                  className={inputCls}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="student-username">Panel kullanıcı adı</Label>
                <Input
                  id="student-username"
                  className={inputCls}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="student-contact-email">İletişim e-postası</Label>
                <Input
                  id="student-contact-email"
                  type="email"
                  className={inputCls}
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>
            </div>
          </Section>

          <Section title="Kişisel bilgiler">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="student-phone">Telefon</Label>
                <Input
                  id="student-phone"
                  className={inputCls}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="student-birth">Doğum tarihi</Label>
                <Input
                  id="student-birth"
                  type="date"
                  className={inputCls}
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="student-city">Şehir</Label>
                <Input
                  id="student-city"
                  className={inputCls}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="student-ilce">İlçe</Label>
                <Input
                  id="student-ilce"
                  className={inputCls}
                  value={ilce}
                  onChange={(e) => setIlce(e.target.value)}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="student-address">Adres</Label>
                <Input
                  id="student-address"
                  className={inputCls}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>
          </Section>

          <Section title="Veli / acil iletişim">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="student-parent">Veli adı</Label>
                <Input
                  id="student-parent"
                  className={inputCls}
                  value={parent}
                  onChange={(e) => setParent(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="student-parent-phone">Veli telefonu</Label>
                <Input
                  id="student-parent-phone"
                  className={inputCls}
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="student-parent-email">Veli e-postası</Label>
                <Input
                  id="student-parent-email"
                  type="email"
                  className={inputCls}
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="student-emergency">Acil durum notu</Label>
                <Input
                  id="student-emergency"
                  className={inputCls}
                  value={emergencyNotes}
                  onChange={(e) => setEmergencyNotes(e.target.value)}
                />
              </div>
            </div>
          </Section>

          <Section title="Notlar">
            <div className="space-y-1.5">
              <Label htmlFor="student-notes">Kişisel not</Label>
              <Input
                id="student-notes"
                className={inputCls}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </Section>

          <Section title="Şifre">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="student-current-pass">Mevcut şifre</Label>
                <div className="relative">
                  <Input
                    id="student-current-pass"
                    type={showCurrent ? "text" : "password"}
                    className={cn(inputCls, "pr-11")}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
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
                <Label htmlFor="student-new-pass">Yeni şifre</Label>
                <div className="relative">
                  <Input
                    id="student-new-pass"
                    type={showNew ? "text" : "password"}
                    className={cn(inputCls, "pr-11")}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    onClick={() => setShowNew((v) => !v)}
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Kullanıcı adı veya şifre değiştirirken mevcut şifrenizi girin.
            </p>
          </Section>

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
