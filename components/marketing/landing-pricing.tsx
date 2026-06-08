"use client";

import { useState } from "react";
import { motion } from "framer-motion";

import { fadeUp } from "@/components/marketing/landing/landing-motion";
import {
  PricingQuoteModal,
  type PricingQuoteContext,
} from "@/components/marketing/landing/pricing-quote-modal";
import {
  AudienceTabs,
  PricingPlansGrid,
  PricingToggle,
} from "@/components/marketing/pricing/pricing-plan-cards";
import {
  PRICING_PLANS,
  type PricingAudience,
  type PricingPlan,
} from "@/lib/marketing/pricing-plans";

export function LandingPricing() {
  const [activeTab, setActiveTab] = useState<PricingAudience>("koc");
  const [isYearly, setIsYearly] = useState(false);
  const [quoteContext, setQuoteContext] = useState<PricingQuoteContext | null>(null);
  const [quoteOpen, setQuoteOpen] = useState(false);

  const plans = PRICING_PLANS[activeTab];

  const openQuote = (plan: PricingPlan) => {
    setQuoteContext({ plan, audience: activeTab, isYearly });
    setQuoteOpen(true);
  };

  return (
    <>
      <section id="fiyatlandirma" className="scroll-mt-20 border-t border-slate-100 bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mx-auto mb-10 max-w-2xl text-center"
          >
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Size uygun paketi birlikte bulalım
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-500">
              Öğrenci misiniz, bireysel koç mu yoksa kurum mu — sekmeyi değiştirin, fiyatları
              anında görün. Yıllık ödemede %20 indirim otomatik uygulanır.
            </p>
          </motion.div>

          <div className="mb-8 flex flex-col items-center gap-5">
            <AudienceTabs activeTab={activeTab} onChange={setActiveTab} />
            <PricingToggle isYearly={isYearly} onChange={setIsYearly} />
          </div>

          <PricingPlansGrid
            activeTab={activeTab}
            isYearly={isYearly}
            plans={plans}
            onQuote={openQuote}
          />

          <p className="mt-8 text-center text-xs text-slate-400">
            Tüm fiyatlar KDV hariçtir. Yıllık planda aylık eşdeğer fiyat %20 indirimli gösterilir.
          </p>
        </div>
      </section>

      <PricingQuoteModal
        open={quoteOpen}
        context={quoteContext}
        onClose={() => {
          setQuoteOpen(false);
          setQuoteContext(null);
        }}
      />
    </>
  );
}
