"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { DereceLogo } from "@/components/coach/derece-logo";
import {
  LANDING_LOGIN_BUTTON_CLASS,
  LANDING_LOGIN_HREF,
} from "@/components/marketing/landing/landing-buttons";
import { LANDING_NAV_LINKS } from "@/lib/marketing/landing-page-data";
import { handleSectionClick } from "@/lib/marketing/smooth-scroll";
import { cn } from "@/lib/utils";

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={cn(
          "transition-all duration-300",
          scrolled
            ? "border-b border-slate-200/70 bg-white/95 backdrop-blur-md shadow-sm shadow-slate-900/[0.03]"
            : "border-b border-transparent bg-white/50 backdrop-blur-md"
        )}
      >
        <div className="relative mx-auto flex h-16 max-w-6xl items-center px-5 sm:h-[68px] lg:px-8">
          <Link
            href="/"
            className="relative z-20 flex shrink-0 items-center"
            aria-label="DerecePanel ana sayfa"
          >
            <DereceLogo height={36} priority />
          </Link>

          <nav className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-0.5 md:flex">
            {LANDING_NAV_LINKS.map(({ label, href }) => (
              <a
                key={href}
                href={href}
                onClick={(e) => handleSectionClick(e, href)}
                className="pointer-events-auto rounded-lg px-3.5 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:text-slate-900"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-center">
            <Link
              href={LANDING_LOGIN_HREF}
              className={cn(LANDING_LOGIN_BUTTON_CLASS, "hidden px-4 py-2 text-[13px] sm:inline-flex")}
            >
              Giriş Yap
            </Link>
            <button
              type="button"
              aria-label={mobileOpen ? "Menüyü kapat" : "Menüyü aç"}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-700 md:hidden"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-b border-slate-200 bg-white md:hidden"
          >
            <nav className="space-y-0.5 px-5 py-4">
              {LANDING_NAV_LINKS.map(({ label, href }) => (
                <a
                  key={href}
                  href={href}
                  onClick={(e) => {
                    handleSectionClick(e, href);
                    setMobileOpen(false);
                  }}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700"
                >
                  {label}
                </a>
              ))}
              <Link
                href={LANDING_LOGIN_HREF}
                className={cn(LANDING_LOGIN_BUTTON_CLASS, "mt-3 w-full py-2.5 text-center")}
                onClick={() => setMobileOpen(false)}
              >
                Giriş Yap
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
