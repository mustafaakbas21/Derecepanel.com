"use client";

import { useEffect } from "react";

import { LandingNavbar } from "@/components/marketing/landing/landing-navbar";
import { LandingHero } from "@/components/marketing/landing/landing-hero";
import { LandingBentoGrid } from "@/components/marketing/landing/landing-bento-grid";
import { LandingGrowth } from "@/components/marketing/landing/landing-growth";
import { LandingUseCases } from "@/components/marketing/landing/landing-use-cases";
import { LandingCta, LandingFooter } from "@/components/marketing/landing/landing-cta-footer";
import { LandingPricing } from "@/components/marketing/landing-pricing";
import { navigateToSection } from "@/lib/marketing/smooth-scroll";

export default function LandingPage() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const timer = window.setTimeout(() => {
      navigateToSection(hash);
    }, 50);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-white font-sans text-slate-900">
      <LandingNavbar />
      <main>
        <LandingHero />
        <LandingBentoGrid />
        <LandingGrowth />
        <LandingUseCases />
        <LandingPricing />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
