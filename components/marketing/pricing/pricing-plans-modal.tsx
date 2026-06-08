"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import {
  AudienceTabs,
  PricingPlansGrid,
  PricingToggle,
} from "@/components/marketing/pricing/pricing-plan-cards";
import {
  PricingQuoteModal,
  type PricingQuoteContext,
} from "@/components/marketing/landing/pricing-quote-modal";
import {
  PRICING_PLANS,
  type PricingAudience,
  type PricingPlan,
} from "@/lib/marketing/pricing-plans";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultAudience?: PricingAudience;
};

export function PricingPlansModal({ open, onOpenChange, defaultAudience = "koc" }: Props) {
  const [activeTab, setActiveTab] = useState<PricingAudience>(defaultAudience);
  const [isYearly, setIsYearly] = useState(false);
  const [quoteContext, setQuoteContext] = useState<PricingQuoteContext | null>(null);
  const [quoteOpen, setQuoteOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setActiveTab(defaultAudience);
    }
  }, [open, defaultAudience]);

  const handleClose = useCallback(() => {
    if (quoteOpen) return;
    onOpenChange(false);
  }, [onOpenChange, quoteOpen]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !quoteOpen) handleClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, quoteOpen, handleClose]);

  const openQuote = (plan: PricingPlan) => {
    setQuoteContext({ plan, audience: activeTab, isYearly });
    setQuoteOpen(true);
  };

  const plans = PRICING_PLANS[activeTab];

  return (
    <>
      <AnimatePresence>
        {open ? (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6">
            <motion.button
              type="button"
              aria-label="Modalı kapat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={handleClose}
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="pricing-plans-modal-title"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 flex max-h-[min(92vh,920px)] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-900/20"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={handleClose}
                className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Kapat"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="overflow-y-auto px-6 pb-8 pt-10 sm:px-10 sm:pb-10">
                <div className="mx-auto mb-8 max-w-2xl text-center">
                  <h2
                    id="pricing-plans-modal-title"
                    className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl"
                  >
                    Size uygun paketi birlikte bulalım
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-500 sm:text-base">
                    Öğrenci misiniz, bireysel koç mu yoksa kurum mu — sekmeyi değiştirin, fiyatları
                    anında görün. Yıllık ödemede %20 indirim otomatik uygulanır.
                  </p>
                </div>

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
                  Tüm fiyatlar KDV hariçtir. Yıllık planda aylık eşdeğer fiyat %20 indirimli
                  gösterilir.
                </p>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

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
