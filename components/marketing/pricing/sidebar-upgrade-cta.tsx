"use client";

import { useState } from "react";

import { PricingPlansModal } from "@/components/marketing/pricing/pricing-plans-modal";
import type { PricingAudience } from "@/lib/marketing/pricing-plans";

type Props = {
  audience: PricingAudience;
  title: string;
  subtitle: string;
  buttonLabel?: string;
};

export function SidebarUpgradeCta({
  audience,
  title,
  subtitle,
  buttonLabel = "Paketleri Gör",
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className="overflow-hidden rounded-2xl bg-slate-900 p-4"
        style={{ boxShadow: "0 6px 24px rgba(15,23,42,0.18)" }}
      >
        <p className="text-sm font-bold leading-snug text-white">{title}</p>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{subtitle}</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 w-full rounded-xl py-2.5 text-xs font-bold text-slate-900 transition hover:brightness-105"
          style={{
            background: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
            boxShadow: "0 4px 12px rgba(249,115,22,0.3)",
          }}
        >
          {buttonLabel}
        </button>
      </div>

      <PricingPlansModal open={open} onOpenChange={setOpen} defaultAudience={audience} />
    </>
  );
}
