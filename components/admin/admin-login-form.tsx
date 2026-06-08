"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  clearAuthSession,
  fetchClientAuthSession,
  GENERIC_LOGIN_ERROR,
  normalizeUsernameInput,
  resetClientAuthSessionCache,
  resolvePostLoginPath,
  type ClientAuthSession,
} from "@/lib/auth/local-auth";
import { hydratePanelStore } from "@/lib/panel-store";
import { cn } from "@/lib/utils";

const inputCls =
  "h-12 rounded-xl border-slate-200 bg-white text-[15px] text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:border-slate-300 focus-visible:ring-2 focus-visible:ring-slate-200/80";

export function AdminLoginForm() {
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [existingSession, setExistingSession] = useState<ClientAuthSession | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchClientAuthSession().then((session) => {
      if (!cancelled) setExistingSession(session);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ role: "admin", username: user, password }),
      });

      const raw = await res.text();
      let data: { error?: string; role?: string; userId?: string } = {};
      if (raw.trim()) {
        try {
          data = JSON.parse(raw) as typeof data;
        } catch {
          throw new Error("Sunucu yanıtı işlenemedi. Deploy güncel mi kontrol edin.");
        }
      }

      if (!res.ok) {
        throw new Error(data.error || GENERIC_LOGIN_ERROR);
      }
      if (!data.role || !data.userId) {
        setError(GENERIC_LOGIN_ERROR);
        return;
      }

      resetClientAuthSessionCache();
      try {
        await hydratePanelStore();
      } catch {
        /* Kurucu oturumu: panel önbelleği boş kalabilir */
      }
      window.location.replace(resolvePostLoginPath("admin", searchParams.get("next")));
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

      {existingSession?.role === "admin" ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <p>Kurucu oturumunuz açık.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="rounded-lg"
              onClick={() =>
                window.location.replace(resolvePostLoginPath("admin", searchParams.get("next")))
              }
            >
              Panele devam et
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg"
              disabled={loggingOut}
              onClick={() => {
                setLoggingOut(true);
                void clearAuthSession()
                  .then(() => setExistingSession(null))
                  .finally(() => setLoggingOut(false));
              }}
            >
              {loggingOut ? "Çıkış yapılıyor…" : "Oturumu kapat"}
            </Button>
          </div>
        </div>
      ) : null}

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
