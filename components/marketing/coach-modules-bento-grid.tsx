"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

import {
  COACH_PANEL_FEATURES,
} from "@/lib/marketing/coach-panel-features";
import {
  BENTO_CARD_RADIUS,
  bentoCardBorder,
  bentoCardShadow,
  ModuleVisual,
} from "@/components/marketing/module-visual";

function CoachModuleCard({
  feature,
  index,
}: {
  feature: (typeof COACH_PANEL_FEATURES)[number];
  index: number;
}) {
  const Icon = feature.icon;

  return (
    <motion.article
      className="flex flex-col overflow-hidden"
      style={{
        borderRadius: BENTO_CARD_RADIUS,
        border: bentoCardBorder,
        boxShadow: bentoCardShadow,
        background: "linear-gradient(170deg, #ffffff 0%, #fafbfc 100%)",
      }}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex-1 p-6 pb-4">
        <div className="mb-4 flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={{ background: `${feature.accent}12` }}
          >
            <Icon className="h-4 w-4" style={{ color: feature.accent }} />
          </div>
          <span
            className="text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ color: feature.accent }}
          >
            {feature.tag}
          </span>
        </div>

        <div
          className="mb-5 rounded-2xl p-3"
          style={{ background: "rgba(248,250,252,0.9)", border: "1px solid rgba(226,232,240,0.7)" }}
        >
          <ModuleVisual type={feature.visual} accent={feature.accent} />
        </div>
      </div>

      <div className="px-6 py-5" style={{ borderTop: "1px solid rgba(226,232,240,0.5)" }}>
        <h3 className="mb-1.5 text-[16px] font-extrabold tracking-tight text-slate-800">
          {feature.title}
        </h3>
        <p className="mb-3 text-[13px] leading-relaxed text-slate-400">{feature.description}</p>
        <ul className="space-y-1.5">
          {feature.bullets.map((item) => (
            <li key={item} className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: feature.accent }} />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </motion.article>
  );
}

export function CoachModulesBentoGrid() {
  return (
    <div className="mt-14">
      <div className="mb-10 px-4 text-center">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-orange-500">
          Koç Paneli Modülleri
        </p>
        <h3
          className="font-extrabold tracking-tight text-slate-800"
          style={{ fontSize: "clamp(22px, 3vw, 32px)", lineHeight: 1.15 }}
        >
          Her süreç için ayrı, güçlü bir modül
        </h3>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {COACH_PANEL_FEATURES.map((feature, index) => (
          <CoachModuleCard key={feature.tag} feature={feature} index={index} />
        ))}
      </div>
    </div>
  );
}
