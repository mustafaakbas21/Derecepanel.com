"use client";

import { Suspense } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Cloud, GraduationCap, LayoutDashboard } from "lucide-react";

import { DereceLogo } from "@/components/coach/derece-logo";
import {
  GirisLoginForm,
  LOGIN_SIDE_DETAILS,
} from "@/components/marketing/giris-login-form";
import { GirisHeroIllustration } from "@/components/marketing/giris-hero-illustration";
import { GirisPageBackground } from "@/components/marketing/giris-page-background";
import { fadeUp, scaleIn } from "@/components/marketing/landing/landing-motion";
import { LoginExitOverlay } from "@/components/marketing/login-exit-overlay";

const SIDE_ICONS = [LayoutDashboard, GraduationCap, Cloud] as const;

function SideDetailsList({ className }: { className?: string }) {
  return (
    <ul className={className}>
      {LOGIN_SIDE_DETAILS.map(({ title, description }, i) => {
        const Icon = SIDE_ICONS[i] ?? LayoutDashboard;
        return (
          <li
            key={title}
            className="rounded-2xl border border-slate-200/70 bg-white/60 p-4 backdrop-blur-sm"
          >
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 ring-1 ring-orange-100">
                <Icon className="h-4 w-4" />
              </div>
              <div className="pt-0.5">
                <p className="text-[15px] font-bold text-slate-900">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default function GirisPage() {
  const reduceMotion = useReducedMotion();

  const motionProps = reduceMotion
    ? { initial: false as const, animate: "visible" as const }
    : { initial: "hidden" as const, animate: "visible" as const };

  return (
    <div className="relative flex min-h-screen flex-col font-sans">
      <GirisPageBackground />

      <header className="relative z-10 border-b border-slate-200/60 bg-white/50 backdrop-blur-md">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="inline-flex items-center transition-opacity hover:opacity-90">
            <DereceLogo height={36} priority />
          </Link>

          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4 text-slate-400 transition-transform group-hover:-translate-x-0.5 group-hover:text-slate-600" />
            Ana sayfaya dön
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[1fr_440px] lg:items-center lg:gap-20 xl:grid-cols-[1fr_460px]">
          <div className="hidden lg:block">
            <motion.span
              {...motionProps}
              variants={fadeUp}
              custom={0}
              className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-orange-200/80 bg-orange-50 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-orange-600 shadow-sm shadow-orange-100/50"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Güvenli giriş
            </motion.span>

            <motion.h1
              {...motionProps}
              variants={fadeUp}
              custom={1}
              className="mb-4 font-extrabold tracking-tight text-slate-900"
              style={{ fontSize: "clamp(34px, 4vw, 46px)", lineHeight: 1.1 }}
            >
              Hesabınıza
              <br />
              <span
                className="bg-gradient-to-r from-slate-800 via-amber-700 to-orange-500 bg-clip-text text-transparent"
                style={{ WebkitBackgroundClip: "text" }}
              >
                giriş yapın
              </span>
            </motion.h1>

            <motion.p
              {...motionProps}
              variants={fadeUp}
              custom={2}
              className="mb-8 max-w-md text-[17px] leading-relaxed text-slate-500"
            >
              Koç ve öğrenci hesapları ayrı oturumlarda çalışır. Giriş bilgilerinizi kurumunuzdan
              veya koçunuzdan alın.
            </motion.p>

            <motion.div {...motionProps} variants={scaleIn} className="relative mb-8 max-w-[300px]">
              <GirisHeroIllustration className="relative" />
            </motion.div>

            <motion.div {...motionProps} variants={fadeUp} custom={3}>
              <SideDetailsList className="space-y-3" />
            </motion.div>
          </div>

          <div className="w-full lg:max-w-none">
            <div className="mb-6 lg:hidden">
              <div className="mb-5 flex justify-center">
                <GirisHeroIllustration className="relative max-h-32 w-full max-w-[240px]" />
              </div>
              <span className="mx-auto mb-4 flex w-fit items-center gap-1.5 rounded-full border border-orange-200/80 bg-orange-50 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-orange-600 shadow-sm">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Güvenli giriş
              </span>
              <h1 className="text-center text-2xl font-extrabold tracking-tight text-slate-900">
                Hesabınıza{" "}
                <span
                  className="bg-gradient-to-r from-slate-800 via-amber-700 to-orange-500 bg-clip-text text-transparent"
                  style={{ WebkitBackgroundClip: "text" }}
                >
                  giriş yapın
                </span>
              </h1>
              <p className="mt-2 text-center text-sm text-slate-500">
                Koç veya öğrenci sekmesini seçin. Oturumunuz Appwrite ile güvenle korunur.
              </p>
            </div>

            <motion.div
              {...motionProps}
              variants={scaleIn}
              className="w-full"
            >
              <Suspense fallback={<div className="h-72 animate-pulse rounded-2xl bg-slate-100/80" />}>
                <GirisLoginForm />
              </Suspense>
            </motion.div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-slate-200/60 px-5 py-5 text-center sm:px-8">
        <p className="text-[12px] text-slate-400">
          © {new Date().getFullYear()} DerecePanel — YKS koçluk platformu
        </p>
      </footer>

      <LoginExitOverlay />
    </div>
  );
}
