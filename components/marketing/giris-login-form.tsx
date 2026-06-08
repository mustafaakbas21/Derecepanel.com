"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Eye, EyeOff, GraduationCap, LayoutDashboard, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GENERIC_LOGIN_ERROR,
  loginAsCoach,
  loginAsStudent,
  normalizeUsernameInput,
  resolvePanelLoginRedirect,
} from "@/lib/auth/local-auth";
import { MAINTENANCE_BLOCK_MESSAGE } from "@/lib/admin/maintenance";
import { hydratePanelStore } from "@/lib/panel-store";
import { cn } from "@/lib/utils";

type LoginRole = "coach" | "student";

const ROLES = [
  { id: "coach" as const, label: "Koç", icon: LayoutDashboard, hint: "Operasyon ve öğrenci yönetimi" },
  { id: "student" as const, label: "Öğrenci", icon: GraduationCap, hint: "Program, deneme ve gelişim" },
] as const;

const inputCls =
  "h-12 rounded-xl border-slate-200 bg-white text-[15px] text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:border-slate-300 focus-visible:ring-2 focus-visible:ring-slate-200/80";

export function GirisLoginForm() {
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const [role, setRole] = useState<LoginRole>("coach");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<"username" | "password" | null>(null);

  const [maintenanceBlocked, setMaintenanceBlocked] = useState(
    () => searchParams.get("bakim") === "1"
  );

  useEffect(() => {
    if (searchParams.get("bakim") === "1") {
      setMaintenanceBlocked(true);
      return;
    }
    void fetch("/api/admin/maintenance")
      .then((r) => r.json())
      .then((data: { enabled?: boolean }) => {
        if (data.enabled) setMaintenanceBlocked(true);
      })
      .catch(() => undefined);
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (maintenanceBlocked) {
      setError(MAINTENANCE_BLOCK_MESSAGE);
      return;
    }

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
      const session =
        role === "coach"
          ? await loginAsCoach(user, password)
          : await loginAsStudent(user, password);

      if (!session) {
        setError(GENERIC_LOGIN_ERROR);
        setSubmitting(false);
        return;
      }

      try {
        await hydratePanelStore();
      } catch {
        /* oturum açıldı; panel verisi sonra yüklenecek */
      }

      const dest = resolvePanelLoginRedirect(role, searchParams.get("next"));
      window.location.replace(dest);
    } catch (err) {
      setError(String((err as Error)?.message || GENERIC_LOGIN_ERROR));
      setSubmitting(false);
    }
  }

  const activeRoleHint = ROLES.find((r) => r.id === role)?.hint ?? "";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-xl shadow-slate-200/40 ring-1 ring-slate-200/80 backdrop-blur-md sm:p-8"
    >
      <div className="mb-6 hidden lg:block">
        <h2 className="text-lg font-bold text-slate-900">Oturum aç</h2>
        <p className="mt-1 text-sm text-slate-500">{activeRoleHint}</p>
      </div>

      {maintenanceBlocked ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Platform şu an bakım modunda. Koç ve öğrenci girişi geçici olarak kapalıdır.
        </div>
      ) : null}

      <div className="relative mb-6 grid grid-cols-2 gap-1 rounded-xl bg-slate-100/80 p-1">
        {ROLES.map(({ id, label, icon: Icon, hint }) => (
          <button
            key={id}
            type="button"
            onClick={() => setRole(id)}
            className={cn(
              "relative z-10 rounded-lg px-3 py-3 text-left transition-colors",
              role === id ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
            )}
            aria-pressed={role === id}
          >
            {role === id && !reduceMotion ? (
              <motion.div
                layoutId="login-role-pill"
                className="absolute inset-0 rounded-lg bg-white shadow-sm ring-1 ring-orange-200/60"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            ) : role === id ? (
              <div className="absolute inset-0 rounded-lg bg-white shadow-sm ring-1 ring-orange-200/60" />
            ) : null}
            <span className="relative flex items-center gap-2 text-sm font-semibold">
              <Icon className={cn("h-4 w-4", role === id ? "text-orange-600" : "text-slate-400")} />
              {label}
            </span>
            <span className="relative mt-1 block text-[11px] leading-snug text-slate-500">{hint}</span>
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor="login-username"
          className={cn(
            "transition-colors",
            focusedField === "username" ? "text-slate-900" : "text-slate-600"
          )}
        >
          Kullanıcı adı
        </Label>
        <Input
          id="login-username"
          className={inputCls}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onFocus={() => setFocusedField("username")}
          onBlur={() => setFocusedField(null)}
          autoComplete="username"
        />
      </div>

      <div className="mt-4 space-y-1.5">
        <Label
          htmlFor="login-password"
          className={cn(
            "transition-colors",
            focusedField === "password" ? "text-slate-900" : "text-slate-600"
          )}
        >
          Şifre
        </Label>
        <div className="relative">
          <Input
            id="login-password"
            type={showPass ? "text" : "password"}
            className={cn(inputCls, "pr-12")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setFocusedField("password")}
            onBlur={() => setFocusedField(null)}
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

      <AnimatePresence>
        {error ? (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            className="mt-4 rounded-lg border border-red-100 bg-red-50/50 px-3 py-2 text-sm text-red-600"
          >
            {error}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Button
        variant="primary"
        type="submit"
        className="mt-6 h-12 w-full rounded-xl"
        disabled={submitting || maintenanceBlocked}
      >
        {submitting ? "Giriş yapılıyor…" : "Giriş yap"}
      </Button>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-[12px] text-slate-400">
        <ShieldCheck className="h-3.5 w-3.5" />
        Appwrite Cloud ile güvenli oturum
      </p>
    </form>
  );
}

export const LOGIN_SIDE_DETAILS = [
  {
    title: "Koç paneli",
    description: "Öğrenci takibi, haftalık program, deneme analizi ve Onyx AI asistanı tek yerde.",
  },
  {
    title: "Öğrenci paneli",
    description: "Günlük görevler, deneme sonuçları ve hedef üniversite yolculuğunuz.",
  },
  {
    title: "Bulut senkron",
    description: "Verileriniz Appwrite üzerinde güvenle saklanır; cihazlar arası senkron çalışır.",
  },
] as const;
