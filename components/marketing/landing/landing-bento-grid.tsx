"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { ModuleVisual } from "@/components/marketing/module-visual";
import { fadeUp } from "@/components/marketing/landing/landing-motion";
import {
  LANDING_ECOSYSTEM_HEADING,
  LANDING_FEATURE_TABS,
  type LandingFeatureItem,
  type LandingFeatureTab,
} from "@/lib/marketing/landing-feature-groups";
import { cn } from "@/lib/utils";

function FeatureAppFrame({
  accent,
  children,
}: {
  accent: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[300px]">
      <div className="overflow-hidden rounded-[14px] border border-slate-200/70 bg-white shadow-[0_12px_40px_-12px_rgba(15,23,42,0.14)]">
        <div className="flex items-center gap-1 border-b border-slate-100 bg-slate-50/90 px-3 py-2">
          <span className="h-[7px] w-[7px] rounded-full bg-slate-200" />
          <span className="h-[7px] w-[7px] rounded-full bg-slate-200" />
          <span className="h-[7px] w-[7px] rounded-full bg-slate-200" />
        </div>
        <div
          className="flex min-h-[160px] items-center justify-center p-5 sm:min-h-[180px]"
          style={{ background: `linear-gradient(180deg, ${accent}07 0%, #ffffff 100%)` }}
        >
          <div className="w-full [font-size:112%]">{children}</div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ feature, index }: { feature: LandingFeatureItem; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white transition-shadow duration-300 hover:shadow-[0_20px_50px_-20px_rgba(15,23,42,0.15)]"
    >
      <div className="relative border-b border-slate-100 bg-[#f8fafc] px-6 py-8 sm:px-8 sm:py-10">
        <FeatureAppFrame accent={feature.accent}>
          <ModuleVisual type={feature.visual} accent={feature.accent} />
        </FeatureAppFrame>
      </div>

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: feature.accent }}
        >
          {feature.tag}
        </p>

        <h3 className="mt-2 text-[17px] font-semibold leading-snug tracking-tight text-slate-950 sm:text-lg">
          {feature.title}
        </h3>

        <p className="mt-2.5 flex-1 text-[14px] leading-relaxed text-slate-500">
          {feature.description}
        </p>

        <ul className="mt-5 space-y-2 border-t border-slate-100 pt-5">
          {feature.bullets.map((bullet) => (
            <li key={bullet} className="flex items-center gap-2.5 text-[13px] text-slate-600">
              <span
                className="h-1 w-1 shrink-0 rounded-full"
                style={{ background: feature.accent }}
              />
              {bullet}
            </li>
          ))}
        </ul>
      </div>
    </motion.article>
  );
}

function FeatureTabBar({
  activeId,
  onChange,
}: {
  activeId: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="border-b border-slate-200/80">
      <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] sm:justify-center sm:gap-0 [&::-webkit-scrollbar]:hidden">
        {LANDING_FEATURE_TABS.map((tab) => {
          const isActive = activeId === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                "relative shrink-0 px-4 py-3.5 text-[13px] font-medium transition-colors sm:px-6 sm:py-4 sm:text-sm",
                isActive ? "text-slate-950" : "text-slate-400 hover:text-slate-700"
              )}
            >
              {tab.label}
              {isActive && (
                <motion.span
                  layoutId="feature-tab-underline"
                  className="absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-orange-500 sm:inset-x-4"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FeatureTabPanel({ tab }: { tab: LandingFeatureTab }) {
  return (
    <motion.div
      key={tab.id}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mb-10 pt-8 sm:mb-12 sm:pt-10">
        <h3 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
          {tab.title}
        </h3>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-500">{tab.subtitle}</p>
      </div>

      <div
        className={cn(
          "grid gap-5 sm:gap-6",
          tab.features.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2"
        )}
      >
        {tab.features.map((feature, i) => (
          <FeatureCard key={feature.tag} feature={feature} index={i} />
        ))}
      </div>
    </motion.div>
  );
}

export function LandingBentoGrid() {
  const [activeTabId, setActiveTabId] = useState(LANDING_FEATURE_TABS[0].id);
  const activeTab = LANDING_FEATURE_TABS.find((t) => t.id === activeTabId) ?? LANDING_FEATURE_TABS[0];

  return (
    <section id="ozellikler" className="scroll-mt-20 border-t border-slate-100 bg-[#fafafa] py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mb-12 max-w-2xl sm:mb-14"
        >
          <p className="text-[13px] font-medium text-slate-500">{LANDING_ECOSYSTEM_HEADING.eyebrow}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl lg:text-[2.125rem]">
            {LANDING_ECOSYSTEM_HEADING.title}{" "}
            <span className="text-orange-600">{LANDING_ECOSYSTEM_HEADING.titleAccent}</span>
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-500">
            {LANDING_ECOSYSTEM_HEADING.subtitle}
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0.3}
          className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white px-4 shadow-sm sm:px-8"
        >
          <FeatureTabBar activeId={activeTabId} onChange={setActiveTabId} />

          <AnimatePresence mode="wait">
            <FeatureTabPanel key={activeTab.id} tab={activeTab} />
          </AnimatePresence>
        </motion.div>

        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mt-8 flex items-center gap-1.5 text-[13px] text-slate-400"
        >
          14 modül · Koç, öğrenci ve kurum panelleri
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
        </motion.p>
      </div>
    </section>
  );
}
