"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GENERIC_LOGIN_ERROR,
  loginAsAdmin,
  normalizeUsernameInput,
  resolvePostLoginPath,
} from "@/lib/auth/local-auth";
import { hydratePanelStore } from "@/lib/panel-store";
import { cn } from "@/lib/utils";

const inputCls =
  "h-12 rounded-xl border-slate-200 bg-white text-[15px] text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:border-slate-300 focus-visible:ring-2 focus-visible:ring-slate-200/80";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const user = normalizeUsernameInput(username);
    if (!user) {
      setError("Kullanıcı adınızı girin.");
      return;
    }
    if (!password.trim()) {
      setError("Şifrenizi girin.");
      return;
    }

    setSubmitting(true);
    try {
      const session = await loginAsAdmin(user, password);
      if (!session) {
        setError(GENERIC_LOGIN_ERROR);
        setSubmitting(false);
        return;
      }

      try {
        await hydratePanelStore();
      } catch {
        /* Kurucu oturumu: panel önbelleği boş kalabilir */
      }
      router.replace(resolvePostLoginPath("admin", searchParams.get("next")));
    } catch (err) {
      setError(String((err as Error)?.message || GENERIC_LOGIN_ERROR));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="mb-2 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
          <Shield className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Kurucu Girişi</h1>
          <p className="text-sm text-slate-500">Yönetici paneline erişim</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="admin-username">Kullanıcı adı</Label>
        <Input
          id="admin-username"
          className={inputCls}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="admin-password">Şifre</Label>
        <div className="relative">
          <Input
            id="admin-password"
            type={showPass ? "text" : "password"}
            className={cn(inputCls, "pr-12")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
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
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button variant="primary" type="submit" className="h-12 w-full rounded-xl" disabled={submitting}>
        {submitting ? "Giriş yapılıyor…" : "Giriş yap"}
      </Button>
    </form>
  );
}
