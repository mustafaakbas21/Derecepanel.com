"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";

import {
  getPlanPriceDisplay,
  PRICING_AUDIENCE_TABS,
  type PricingAudience,
  type PricingPlan,
} from "@/lib/marketing/pricing-plans";
import { cn } from "@/lib/utils";

export function PricingToggle({
  isYearly,
  onChange,
}: {
  isYearly: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 p-1">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
          !isYearly ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
        )}
      >
        Aylık
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
          isYearly ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
        )}
      >
        Yıllık
        <span className="ml-1.5 text-orange-500">(%20 İndirim)</span>
      </button>
    </div>
  );
}

export function AudienceTabs({
  activeTab,
  onChange,
}: {
  activeTab: PricingAudience;
  onChange: (tab: PricingAudience) => void;
}) {
  return (
    <div className="relative inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
      {PRICING_AUDIENCE_TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative z-10 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors sm:px-5",
              isActive ? "text-white" : "text-slate-600 hover:text-slate-900"
            )}
          >
            {isActive && (
              <motion.span
                layoutId="pricing-tab-indicator"
                className="absolute inset-0 rounded-full bg-slate-900 shadow-sm"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 whitespace-nowrap">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function PricingCard({
  plan,
  isYearly,
  index,
  onQuote,
}: {
  plan: PricingPlan;
  isYearly: boolean;
  index: number;
  onQuote: () => void;
}) {
  const { price, note } = getPlanPriceDisplay(plan, isYearly);
  const highlighted = plan.highlighted;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative flex flex-col rounded-2xl border p-7",
        highlighted
          ? "border-slate-900 bg-slate-900 text-white shadow-lg"
          : "border-slate-200/80 bg-white shadow-sm"
      )}
    >
      {plan.badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-orange-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
          {plan.badge}
        </span>
      )}

      <div className="mb-5">
        <h3 className={cn("text-lg font-bold", highlighted ? "text-white" : "text-slate-900")}>
          {plan.name}
        </h3>
        <p className={cn("mt-1.5 text-sm", highlighted ? "text-slate-400" : "text-slate-500")}>
          {plan.description}
        </p>
      </div>

      <div className="mb-5">
        <p
          className={cn(
            "text-3xl font-extrabold tracking-tight",
            highlighted ? "text-white" : "text-slate-900"
          )}
        >
          {price}
        </p>
        {note ? (
          <p className={cn("mt-0.5 text-xs", highlighted ? "text-slate-400" : "text-slate-400")}>
            {note}
          </p>
        ) : null}
      </div>

      {plan.limits.length > 0 && (
        <ul className="mb-4 space-y-1.5">
          {plan.limits.map((item) => (
            <li
              key={item}
              className={cn("text-xs font-semibold", highlighted ? "text-slate-300" : "text-slate-600")}
            >
              {item}
            </li>
          ))}
        </ul>
      )}

      <ul className="mb-6 flex-1 space-y-2.5">
        {plan.features.map((item) => (
          <li
            key={item}
            className={cn(
              "flex items-start gap-2 text-[13px] leading-snug",
              highlighted ? "text-slate-300" : "text-slate-600"
            )}
          >
            <Check
              className={cn(
                "mt-0.5 h-3.5 w-3.5 shrink-0",
                highlighted ? "text-emerald-400" : "text-emerald-600"
              )}
            />
            {item}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onQuote}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-orange-500 text-[14px] font-bold text-white transition-colors hover:bg-orange-600"
      >
        {plan.cta}
        <ArrowRight className="h-4 w-4 opacity-80" />
      </button>
    </motion.article>
  );
}

export function PricingPlansGrid({
  activeTab,
  isYearly,
  plans,
  onQuote,
}: {
  activeTab: PricingAudience;
  isYearly: boolean;
  plans: PricingPlan[];
  onQuote: (plan: PricingPlan) => void;
}) {
  const isKurum = activeTab === "kurum";

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "grid grid-cols-1 gap-5 lg:gap-6",
          isKurum ? "mx-auto max-w-3xl md:grid-cols-2" : "lg:grid-cols-3"
        )}
      >
        {plans.map((plan, i) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            isYearly={isYearly}
            index={i}
            onQuote={() => onQuote(plan)}
          />
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
