"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  LIBRARY_PAGE_CLASS,
  LIBRARY_PANEL_CLASS,
  LIBRARY_PANEL_INNER,
  LibraryPageHeader,
} from "@/components/library/library-shell";
import { ADMIN_ROUTES } from "@/lib/admin/admin-nav-config";
import type { CoachDraft } from "@/lib/admin/coach-storage";
import type { LocalCoachAccount } from "@/lib/auth/local-auth";
import { isValidPanelUsername, normalizeUsernameInput } from "@/lib/auth/local-auth";
import { appToast } from "@/lib/notify";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const inputCls =
  "h-12 rounded-xl border-slate-200 bg-white px-3.5 text-[15px] text-slate-900 shadow-sm";

type Props = {
  mode: "create" | "edit";
  initial?: LocalCoachAccount | null;
};

export function CoachForm({ mode, initial }: Props) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initial?.displayName ?? "");
  const [username, setUsername] = useState(initial?.username ?? "");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [specialty, setSpecialty] = useState(initial?.specialty ?? "");
  const [status, setStatus] = useState<"Aktif" | "Pasif">(
    initial?.status === "Pasif" ? "Pasif" : "Aktif"
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!displayName.trim()) e.displayName = "Ad soyad zorunlu";
    if (!username.trim()) e.username = "Kullanıcı adı zorunlu";
    else if (!isValidPanelUsername(username)) {
      e.username = "Sadece harf, rakam, nokta, tire ve alt çizgi kullanın";
    }
    if (mode === "create" && password.trim().length < 8) {
      e.password = "Şifre en az 8 karakter olmalı";
    }
    if (mode === "edit" && password.trim() && password.trim().length < 8) {
      e.password = "Şifre en az 8 karakter olmalı";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const draft: CoachDraft = {
      displayName: displayName.trim(),
      username: normalizeUsernameInput(username),
      password: mode === "create" ? password : password.trim() || initial?.password || "",
      phone: phone.trim() || undefined,
      specialty: specialty.trim() || undefined,
      status,
    };

    setSaving(true);
    try {
      if (mode === "create") {
        const res = await fetch("/api/admin/coaches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            displayName: draft.displayName,
            username: draft.username,
            password: draft.password,
            phone: draft.phone,
            specialty: draft.specialty,
            status: draft.status,
          }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          appwriteProvisioned?: boolean;
          repaired?: boolean;
        };
        if (!res.ok) {
          throw new Error(data.error || "Koç hesabı oluşturulamadı");
        }
        if (data.repaired) {
          appToast.success("Koç hesabı güncellendi ve giriş bilgileri eşitlendi");
        } else if (data.appwriteProvisioned === false) {
          appToast.success("Koç kaydedildi (demo mod — Appwrite girişi yapılandırılmadı)");
        } else {
          appToast.success("Koç hesabı oluşturuldu");
        }
      } else {
        const res = await fetch("/api/admin/coaches", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            coachId: initial?.coachId,
            displayName: draft.displayName,
            username: draft.username,
            password: draft.password || undefined,
            phone: draft.phone,
            specialty: draft.specialty,
            status: draft.status,
          }),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          throw new Error(data.error || "Koç güncellenemedi");
        }
        appToast.success("Koç güncellendi");
      }
      router.push(ADMIN_ROUTES.coaches);
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Kayıt başarısız");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={LIBRARY_PAGE_CLASS}>
      <LibraryPageHeader
        title={mode === "create" ? "Yeni Koç" : "Koçu Düzenle"}
        description="Panel giriş bilgileri ve koç profil bilgilerini girin."
        action={
          <Button variant="outline" type="button" onClick={() => router.push(ADMIN_ROUTES.coaches)}>
            İptal
          </Button>
        }
      />

      <section className={LIBRARY_PANEL_CLASS}>
        <form onSubmit={handleSubmit} className={LIBRARY_PANEL_INNER}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="displayName">Ad Soyad *</Label>
              <Input
                id="displayName"
                className={inputCls}
                value={displayName}
                onChange={(ev) => setDisplayName(ev.target.value)}
              />
              {errors.displayName ? (
                <p className="text-[11px] text-red-600">{errors.displayName}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="username">Panel kullanıcı adı *</Label>
              <Input
                id="username"
                className={inputCls}
                value={username}
                onChange={(ev) => setUsername(ev.target.value)}
                autoComplete="username"
              />
              {errors.username ? (
                <p className="text-[11px] text-red-600">{errors.username}</p>
              ) : (
                <p className="text-[11px] text-slate-400">
                  Türkçe karakterler otomatik dönüştürülür (örn. fatoştokar → fatostokar).
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">
                Panel şifresi {mode === "create" ? "*" : "(boş bırakılırsa değişmez)"}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  className={cn(inputCls, "pr-12")}
                  value={password}
                  onChange={(ev) => setPassword(ev.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? "Şifreyi gizle" : "Şifreyi göster"}
                >
                  {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password ? (
                <p className="text-[11px] text-red-600">{errors.password}</p>
              ) : mode === "create" ? (
                <p className="text-[11px] text-slate-400">
                  Panel girişi için en az 8 karakter (Appwrite ile aynı şifre).
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                className={inputCls}
                value={phone}
                onChange={(ev) => setPhone(ev.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="specialty">Uzmanlık</Label>
              <Input
                id="specialty"
                className={inputCls}
                value={specialty}
                onChange={(ev) => setSpecialty(ev.target.value)}
                placeholder="Örn. Matematik, Rehberlik"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Durum</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as "Aktif" | "Pasif")}>
                <SelectTrigger className={inputCls}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aktif">Aktif</SelectItem>
                  <SelectItem value="Pasif">Pasif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => router.push(ADMIN_ROUTES.coaches)}>
              İptal
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? "Kaydediliyor…" : mode === "create" ? "Koç oluştur" : "Kaydet"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
