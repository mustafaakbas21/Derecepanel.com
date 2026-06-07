"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CheckCircle2, ChevronRight } from "lucide-react";

import {
  BENTO_CARD_RADIUS,
  bentoCardBorder,
  bentoCardShadow,
  ModuleVisual,
} from "@/components/marketing/module-visual";
import {
  LANDING_ECOSYSTEM_HEADING,
  LANDING_FEATURE_GROUPS,
  type LandingFeatureGroup,
  type LandingFeatureItem,
} from "@/lib/marketing/landing-feature-groups";

const SECTION_BG = "bg-[#F4F7F6]";

function GroupTab({
  group,
  active,
  onClick,
}: {
  group: LandingFeatureGroup;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[13px] font-medium transition-colors whitespace-nowrap ${
        active
          ? "bg-orange-50 text-orange-950 ring-1 ring-orange-200/80 shadow-sm"
          : "text-slate-600 hover:bg-white/80 hover:text-slate-900"
      }`}
    >
      {group.menuLabel}
    </button>
  );
}

function FeatureMenuItem({
  feature,
  index,
  active,
  onClick,
}: {
  feature: LandingFeatureItem;
  index: number;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = feature.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex w-full items-start gap-3 rounded-2xl px-4 py-3.5 text-left transition-all ${
        active
          ? "bg-white shadow-md ring-1 ring-slate-200/80"
          : "hover:bg-white/70"
      }`}
    >
      {/* Akış çizgisi — menü öğeleri arası */}
      {index > 0 && (
        <span
          className="pointer-events-none absolute -top-3 left-[27px] h-3 w-px"
          style={{
            background: active ? `${feature.accent}55` : "#fed7aa",
          }}
        />
      )}

      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 transition-colors"
        style={{
          borderColor: active ? feature.accent : "#e2e8f0",
          background: active ? `${feature.accent}12` : "#f8fafc",
        }}
      >
        <span
          className="text-[11px] font-extrabold tabular-nums"
          style={{ color: active ? feature.accent : "#94a3b8" }}
        >
          {index + 1}
        </span>
      </div>

      <div className="min-w-0 flex-1 pt-0.5">
        <div className="mb-0.5 flex items-center gap-2">
          <Icon
            className="h-3.5 w-3.5 shrink-0"
            style={{ color: active ? feature.accent : "#94a3b8" }}
          />
          <span
            className="text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ color: active ? feature.accent : "#94a3b8" }}
          >
            {feature.tag}
          </span>
        </div>
        <p
          className={`text-[14px] font-bold leading-snug tracking-tight ${
            active ? "text-slate-900" : "text-slate-600"
          }`}
        >
          {feature.title}
        </p>
        <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-slate-400">
          {feature.description}
        </p>
      </div>

      <ChevronRight
        className={`mt-2 h-4 w-4 shrink-0 transition-transform ${
          active ? "translate-x-0.5 opacity-100" : "opacity-0 group-hover:opacity-40"
        }`}
        style={{ color: active ? feature.accent : undefined }}
      />
    </button>
  );
}

function FeatureDetailPanel({
  feature,
  group,
}: {
  feature: LandingFeatureItem;
  group: LandingFeatureGroup;
}) {
  return (
    <motion.div
      key={feature.tag}
      initial={{ opacity: 0, x: 48 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col overflow-hidden self-start"
      style={{
        borderRadius: BENTO_CARD_RADIUS,
        border: bentoCardBorder,
        boxShadow: bentoCardShadow,
        background: "linear-gradient(170deg, #fff8f1 0%, #ffffff 45%, #ffffff 100%)",
      }}
    >
      {/* Görsel mockup — üstte, sağdan gelen bento */}
      <div className="relative px-6 pb-2 pt-7 sm:px-8 sm:pt-8">
        <div
          className="overflow-hidden rounded-[1.35rem] p-4 sm:p-5"
          style={{
            background: "rgba(248,250,252,0.95)",
            border: "1px solid rgba(226,232,240,0.7)",
            minHeight: 200,
          }}
        >
          <ModuleVisual type={feature.visual} accent={feature.accent} />
        </div>

        {/* Bağlantı çizgisi — menüden panele */}
        <div
          className="pointer-events-none absolute -left-6 top-1/2 hidden h-px w-6 xl:block"
          style={{
            background: `linear-gradient(90deg, transparent, ${feature.accent}66)`,
          }}
        />
      </div>

      {/* Detaylı metin */}
      <div
        className="px-6 py-6 sm:px-8 sm:py-7"
        style={{ borderTop: "1px solid rgba(226,232,240,0.5)" }}
      >
        <p
          className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em]"
          style={{ color: feature.accent }}
        >
          {group.eyebrow} · {feature.tag}
        </p>
        <h4
          className="mb-3 text-[22px] font-extrabold tracking-tight text-slate-900 sm:text-[26px]"
          style={{ lineHeight: 1.15 }}
        >
          {feature.title}
        </h4>
        <p className="mb-4 text-[15px] leading-relaxed text-slate-600">
          {feature.longDetail}
        </p>

        <div className="mb-5 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Temel özellikler
            </p>
            <ul className="space-y-2">
              {feature.bullets.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-[13px] font-medium text-slate-700"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: feature.accent }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Panel yetenekleri
            </p>
            <ul className="space-y-2">
              {feature.capabilities.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-[12px] leading-snug text-slate-500"
                >
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: feature.accent }}
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Link
          href="/giris"
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-slate-800"
        >
          Modülü dene
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </motion.div>
  );
}

function FeatureGroupPanel({ group }: { group: LandingFeatureGroup }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeFeature = group.features[activeIndex];

  return (
    <div className="mt-10">
      <div className="mb-8 max-w-2xl">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-orange-600">
          {group.eyebrow}
        </p>
        <h4
          className="mb-2 font-extrabold tracking-tight text-slate-900"
          style={{ fontSize: "clamp(20px, 2.5vw, 28px)", lineHeight: 1.2 }}
        >
          {group.title}
        </h4>
        <p className="text-[15px] leading-relaxed text-slate-500">{group.subtitle}</p>
      </div>

      <div className="relative mb-4 hidden lg:block">
        <div
          className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-[14px] h-[2px] rounded-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(234,88,12,0.35) 15%, rgba(234,88,12,0.35) 85%, transparent)",
          }}
        />
        <div className="grid grid-cols-4 gap-3">
          {group.features.map((feature, i) => (
            <div key={feature.tag} className="flex flex-col items-center">
              <div
                className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 bg-[#F4F7F6] text-[10px] font-extrabold tabular-nums"
                style={{
                  borderColor: activeIndex === i ? feature.accent : "#fed7aa",
                  color: activeIndex === i ? feature.accent : "#94a3b8",
                }}
              >
                {i + 1}
              </div>
              <div
                className="mt-2 h-5 w-px"
                style={{
                  background:
                    activeIndex === i
                      ? `linear-gradient(to bottom, ${feature.accent}, transparent)`
                      : "linear-gradient(to bottom, #fed7aa, transparent)",
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,340px)_1fr] lg:gap-10 xl:grid-cols-[minmax(0,380px)_1fr]">
        <nav
          className="flex flex-col gap-1 lg:sticky lg:top-28"
          aria-label={`${group.menuLabel} modülleri`}
        >
          {group.features.map((feature, i) => (
            <FeatureMenuItem
              key={feature.tag}
              feature={feature}
              index={i}
              active={activeIndex === i}
              onClick={() => setActiveIndex(i)}
            />
          ))}
        </nav>

        {/* Sağ — detay paneli (üstten hizalı, sağdan animasyon) */}
        <div className="relative min-h-[480px]">
          <AnimatePresence mode="wait">
            <FeatureDetailPanel
              key={`${group.id}-${activeFeature.tag}`}
              feature={activeFeature}
              group={group}
            />
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export function LandingFeatureBands() {
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const activeGroup = LANDING_FEATURE_GROUPS[activeGroupIndex];

  return (
    <section
      id="ozellikler"
      className={`relative z-10 scroll-mt-24 py-16 sm:py-24 ${SECTION_BG}`}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        {/* Vitrinden devam eden bağlantı çizgisi */}
        <div className="mb-10 flex flex-col items-center">
          <div
            className="w-px"
            style={{
              height: 40,
              background: "linear-gradient(to bottom, rgba(234,88,12,0.25), rgba(234,88,12,0.45))",
            }}
          />
          <div
            className="h-2.5 w-2.5 rounded-full border-2 bg-[#F4F7F6]"
            style={{ borderColor: "#ea580c", boxShadow: "0 0 0 4px rgba(234,88,12,0.1)" }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
          className="mx-auto mb-12 max-w-3xl text-center"
        >
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-orange-600">
            {LANDING_ECOSYSTEM_HEADING.eyebrow}
          </p>
          <h2
            className="mb-4 font-extrabold tracking-tight text-slate-800"
            style={{
              fontSize: "clamp(26px, 4vw, 48px)",
              letterSpacing: "-0.025em",
              lineHeight: 1.08,
            }}
          >
            {LANDING_ECOSYSTEM_HEADING.title}
            <br />
            <span className="text-orange-600">{LANDING_ECOSYSTEM_HEADING.titleAccent}</span>
          </h2>
          <p className="mx-auto max-w-xl text-[16px] leading-relaxed text-slate-400 sm:text-[17px]">
            {LANDING_ECOSYSTEM_HEADING.subtitle}
          </p>
        </motion.div>

        {/* Grup sekmeleri — navbar menüsü gibi */}
        <div className="mb-2 flex justify-center">
          <div
            className="inline-flex flex-wrap items-center justify-center gap-1 rounded-full px-2 py-2"
            style={{
              background: "rgba(255,255,255,0.95)",
              border: "1px solid rgba(226,232,240,0.9)",
              boxShadow: "0 2px 20px rgba(15,23,42,0.06)",
            }}
          >
            {LANDING_FEATURE_GROUPS.map((group, i) => (
              <GroupTab
                key={group.id}
                group={group}
                active={activeGroupIndex === i}
                onClick={() => setActiveGroupIndex(i)}
              />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeGroup.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            <FeatureGroupPanel group={activeGroup} />
          </motion.div>
        </AnimatePresence>

        <div className="mt-16 text-center">
          <Link
            href="/giris"
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-[14px] font-bold text-white transition-colors hover:bg-slate-800"
          >
            Paneli aç
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
