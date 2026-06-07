"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Play,
  LayoutDashboard,
  Users,
  BarChart3,
  TrendingUp,
  Search,
  Bot,
  Video,
  Layers,
} from "lucide-react";

import {
  LANDING_LOGIN_BUTTON_CLASS,
  LANDING_LOGIN_HREF,
  LANDING_SECONDARY_BUTTON_CLASS,
} from "@/components/marketing/landing/landing-buttons";
import { LandingHeroIllustration } from "@/components/marketing/landing/landing-hero-illustration";
import { fadeUp, scaleIn } from "@/components/marketing/landing/landing-motion";
import { handleSectionClick } from "@/lib/marketing/smooth-scroll";

const HERO_STATS = [
  { value: "14", label: "entegre modül" },
  { value: "Onyx", label: "yapay zeka asistanı" },
  { value: "7/24", label: "veri senkronu" },
];

const HERO_PILLS = [
  { icon: Bot, label: "Onyx AI analiz" },
  { icon: Video, label: "Canlı görüşme odası" },
  { icon: Layers, label: "Deneme → program hattı" },
];

function DashboardMockup() {
  const sidebarItems = [
    { icon: LayoutDashboard, label: "Panel", active: true },
    { icon: Users, label: "Öğrenciler" },
    { icon: BarChart3, label: "Analiz" },
    { icon: TrendingUp, label: "Denemeler" },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/80 shadow-[0_32px_100px_-24px_rgba(15,23,42,0.18)] ring-1 ring-slate-200/80 backdrop-blur-xl">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-300/60 to-transparent" />
      <div className="flex min-h-[260px] sm:min-h-[320px]">
        <aside className="hidden w-36 shrink-0 border-r border-slate-100/80 bg-slate-50/50 p-3 sm:block">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-orange-500 to-orange-600" />
            <div className="h-2.5 w-14 rounded bg-slate-200/80" />
          </div>
          <nav className="space-y-0.5">
            {sidebarItems.map(({ icon: Icon, label, active }) => (
              <div
                key={label}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium ${
                  active
                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-100"
                    : "text-slate-400"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </div>
            ))}
          </nav>
        </aside>

        <div className="flex flex-1 flex-col">
          <div className="flex items-center gap-3 border-b border-slate-100/80 px-4 py-3">
            <div className="flex flex-1 items-center gap-2 rounded-lg bg-slate-50/80 px-3 py-1.5 ring-1 ring-slate-100">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs text-slate-400">Öğrenci veya deneme ara…</span>
            </div>
          </div>

          <div className="grid flex-1 grid-cols-3 gap-3 p-4">
            {[
              { label: "Öğrenci", val: "48", sub: "+3 bu ay", color: "text-emerald-600" },
              { label: "TYT Net", val: "74.2", sub: "Sınıf ort.", color: "text-slate-900" },
              { label: "Deneme", val: "12", sub: "Bu dönem", color: "text-orange-600" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-slate-100/80 bg-white/90 p-3">
                <p className="text-[10px] font-medium text-slate-400">{s.label}</p>
                <p className={`text-lg font-bold tabular-nums ${s.color}`}>{s.val}</p>
                <p className="text-[9px] text-slate-400">{s.sub}</p>
              </div>
            ))}
          </div>

          <div className="mx-4 mb-4 flex h-24 items-end gap-1 rounded-xl bg-gradient-to-t from-slate-50 to-white p-3 ring-1 ring-slate-100/80">
            {[40, 52, 48, 58, 55, 65, 62, 72, 68, 78, 75, 86].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t"
                style={{
                  height: `${h}%`,
                  background:
                    i >= 9
                      ? "linear-gradient(to top, #f97316, #fdba74)"
                      : "linear-gradient(to top, #0f172a99, #0f172a44)",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <Link
        href={LANDING_LOGIN_HREF}
        className="absolute inset-0 flex items-center justify-center bg-slate-900/0 transition-colors hover:bg-slate-900/[0.03]"
        aria-label="Panele giriş yap"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 shadow-2xl shadow-slate-900/30 transition-transform hover:scale-105 sm:h-16 sm:w-16">
          <Play className="ml-0.5 h-5 w-5 fill-white text-white sm:h-6 sm:w-6" />
        </span>
      </Link>
    </div>
  );
}

function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* Base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(165deg, #f8fafc 0%, #ffffff 35%, #fff7ed 70%, #f1f5f9 100%)",
        }}
      />

      {/* Dot grid */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.45]" aria-hidden>
        <defs>
          <pattern id="hero-dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1" fill="#cbd5e1" opacity="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-dots)" />
      </svg>

      {/* Mesh orbs */}
      <div
        className="absolute -left-32 top-0 h-[520px] w-[520px] rounded-full opacity-60 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(251,146,60,0.22) 0%, transparent 65%)" }}
      />
      <div
        className="absolute -right-24 top-20 h-[480px] w-[480px] rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(15,23,42,0.08) 0%, transparent 60%)" }}
      />
      <div
        className="absolute bottom-0 left-1/3 h-[360px] w-[600px] -translate-x-1/2 opacity-40 blur-3xl"
        style={{ background: "radial-gradient(ellipse, rgba(59,130,246,0.12) 0%, transparent 70%)" }}
      />

      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-300/50 to-transparent" />

      {/* Corner frame accents */}
      <div className="absolute left-8 top-32 hidden h-24 w-24 border-l border-t border-slate-200/60 lg:block" />
      <div className="absolute bottom-24 right-8 hidden h-24 w-24 border-b border-r border-orange-200/50 lg:block" />
    </div>
  );
}

export function LandingHero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-16 sm:pt-28 sm:pb-24 lg:pt-32 lg:pb-28">
      <HeroBackground />

      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-10 xl:gap-14">
          {/* Sol — metin */}
          <div className="mx-auto max-w-xl text-center lg:mx-0 lg:max-w-none lg:text-left">
            <motion.h1
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={0}
              className="text-[2rem] font-extrabold leading-[1.12] tracking-tight sm:text-[2.65rem] lg:text-[3rem] xl:text-[3.35rem]"
            >
              <span className="text-slate-950">Koçluk operasyonunuz</span>
              <span className="mt-1 block">
                <span className="text-slate-400">artık </span>
                <span
                  className="bg-gradient-to-r from-slate-800 via-amber-700 to-orange-500 bg-clip-text text-transparent"
                  style={{ WebkitBackgroundClip: "text" }}
                >
                  elit bir deneyim
                </span>
              </span>
            </motion.h1>

            <motion.p
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={1}
              className="mt-5 text-base leading-[1.75] text-slate-600 sm:text-[17px]"
            >
              Deneme sonuçlarını Excel&apos;de kaybetmeyin, haftalık programı tek tek yazmayın.
              Derecepanel ile netleri analiz edin, zayıf konulara göre plan üretin ve
              öğrencilerinizle aynı ekrandan konuşun.
            </motion.p>

            <motion.p
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={1.2}
              className="mt-3 text-sm leading-relaxed text-slate-500"
            >
              Koç paneli, öğrenci paneli ve kurum yönetimi tek veri hattında birleşir —
              giriş yaptığınız anda profesyonel bir çalışma ortamı sizi karşılar.
            </motion.p>

            {/* Özellik pill'leri */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={1.4}
              className="mt-6 flex flex-wrap items-center justify-center gap-2 lg:justify-start"
            >
              {HERO_PILLS.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200/80 backdrop-blur-sm"
                >
                  <Icon className="h-3.5 w-3.5 text-orange-500" strokeWidth={2} />
                  {label}
                </span>
              ))}
            </motion.div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={2}
              className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start"
            >
              <Link href={LANDING_LOGIN_HREF} className={LANDING_LOGIN_BUTTON_CLASS}>
                Giriş Yap
              </Link>
              <a
                href="#ozellikler"
                onClick={(e) => handleSectionClick(e, "#ozellikler")}
                className={LANDING_SECONDARY_BUTTON_CLASS}
              >
                Özellikleri incele
              </a>
            </motion.div>

            {/* İstatistik şeridi */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={2.5}
              className="mt-10 grid grid-cols-3 gap-4 border-t border-slate-200/70 pt-8"
            >
              {HERO_STATS.map(({ value, label }) => (
                <div key={label} className="text-center lg:text-left">
                  <p className="text-xl font-extrabold tabular-nums tracking-tight text-slate-900 sm:text-2xl">
                    {value}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium leading-snug text-slate-500">{label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Sağ — illüstrasyon + mockup */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={scaleIn}
            className="relative mx-auto w-full max-w-xl lg:max-w-none"
          >
            <div className="relative">
              <LandingHeroIllustration />

              {/* Dashboard mockup — illüstrasyonun altına bindirilmiş */}
              <div className="relative -mt-8 mx-2 sm:-mt-12 sm:mx-4 lg:-mt-16 lg:mx-0">
                <DashboardMockup />
              </div>
            </div>

            <p className="mt-4 text-center text-xs text-slate-400 lg:text-right">
              Canlı panel önizlemesine tıklayarak giriş ekranına geçebilirsiniz.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
