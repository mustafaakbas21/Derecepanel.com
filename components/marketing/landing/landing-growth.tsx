"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  GitBranch,
  MessageSquare,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import { fadeUp } from "@/components/marketing/landing/landing-motion";
import {
  LANDING_GROWTH_HEADING,
  LANDING_GROWTH_ITEMS,
  LANDING_GROWTH_PRINCIPLES,
  type LandingGrowthItem,
} from "@/lib/marketing/landing-page-data";
import { handleSectionClick } from "@/lib/marketing/smooth-scroll";

const GROWTH_ICONS: Record<LandingGrowthItem["icon"], LucideIcon> = {
  scale: TrendingUp,
  feedback: MessageSquare,
  pipeline: GitBranch,
  roles: Building2,
};

function GrowthCard({ item, index }: { item: LandingGrowthItem; index: number }) {
  const Icon = GROWTH_ICONS[item.icon];

  return (
    <motion.article
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={fadeUp}
      custom={index * 0.15}
      className="flex h-full flex-col rounded-2xl border border-slate-200/60 bg-white p-6 sm:p-7"
    >
      <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950">
        <Icon className="h-[18px] w-[18px] text-orange-400" strokeWidth={2} />
      </div>

      <h3 className="text-[17px] font-semibold leading-snug tracking-tight text-slate-950">
        {item.title}
      </h3>

      <p className="mt-2.5 flex-1 text-[14px] leading-relaxed text-slate-500">{item.description}</p>

      <ul className="mt-5 space-y-2 border-t border-slate-100 pt-5">
        {item.highlights.map((point) => (
          <li key={point} className="flex items-start gap-2.5 text-[13px] text-slate-600">
            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-orange-500" />
            {point}
          </li>
        ))}
      </ul>
    </motion.article>
  );
}

export function LandingGrowth() {
  return (
    <section className="border-t border-slate-100 bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mb-12 max-w-2xl sm:mb-14"
        >
          <p className="text-[13px] font-medium text-slate-500">{LANDING_GROWTH_HEADING.eyebrow}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            {LANDING_GROWTH_HEADING.title}{" "}
            <span className="text-orange-600">{LANDING_GROWTH_HEADING.titleAccent}</span>
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-500">
            {LANDING_GROWTH_HEADING.subtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
          {LANDING_GROWTH_ITEMS.map((item, i) => (
            <GrowthCard key={item.id} item={item} index={i} />
          ))}
        </div>

        {/* İlkeler şeridi */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0.6}
          className="mt-10 grid grid-cols-3 gap-4 rounded-2xl border border-slate-200/60 bg-[#fafafa] px-5 py-6 sm:mt-12 sm:px-8"
        >
          {LANDING_GROWTH_PRINCIPLES.map(({ value, label }) => (
            <div key={label} className="text-center sm:text-left">
              <p className="text-2xl font-semibold tabular-nums tracking-tight text-slate-950 sm:text-3xl">
                {value}
              </p>
              <p className="mt-1 text-[12px] leading-snug text-slate-500 sm:text-[13px]">{label}</p>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0.8}
          className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3"
        >
          <a
            href="#cozumler"
            onClick={(e) => handleSectionClick(e, "#cozumler")}
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            Kimler için uygun?
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
          </a>
          <a
            href="#fiyatlandirma"
            onClick={(e) => handleSectionClick(e, "#fiyatlandirma")}
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            Fiyatlandırmayı incele
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
          </a>
          <Link
            href="/giris"
            className="text-sm font-medium text-orange-600 transition-colors hover:text-orange-700"
          >
            Panele giriş yap →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
