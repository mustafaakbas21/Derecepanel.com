"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

import { DereceLogo } from "@/components/coach/derece-logo";
import { LegalDocumentModal } from "@/components/marketing/legal-document-modal";
import {
  LANDING_LOGIN_HREF,
  LANDING_REGISTER_BUTTON_CLASS,
  LANDING_SECONDARY_BUTTON_CLASS,
} from "@/components/marketing/landing/landing-buttons";
import { LandingRegisterModal } from "@/components/marketing/landing/landing-register-modal";
import { TekmerPartnerLogo } from "@/components/marketing/tekmer-partner-logo";
import { fadeUp } from "@/components/marketing/landing/landing-motion";
import {
  LANDING_FOOTER_LINKS,
  LANDING_FOOTER_TAGLINE,
  TEKMER_PARTNER,
} from "@/lib/marketing/landing-page-data";
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from "@/lib/marketing/legal-content";
import { handleSectionClick } from "@/lib/marketing/smooth-scroll";
import { cn } from "@/lib/utils";

const FOOTER_LINK_CLASS =
  "inline-block text-sm text-slate-400 transition-colors hover:text-white";

function FooterNavLink({ href, label }: { href: string; label: string }) {
  if (href.startsWith("#")) {
    return (
      <a
        href={href}
        onClick={(e) => handleSectionClick(e, href)}
        className={FOOTER_LINK_CLASS}
      >
        {label}
      </a>
    );
  }

  if (href.startsWith("mailto:") || href.startsWith("http")) {
    return (
      <a
        href={href}
        className={FOOTER_LINK_CLASS}
        {...(href.startsWith("http")
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={FOOTER_LINK_CLASS}>
      {label}
    </Link>
  );
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-[12px] font-semibold tracking-wide text-white">{title}</p>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}

export function LandingCta() {
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  return (
    <>
      <section id="cta" className="relative scroll-mt-20 overflow-hidden bg-white py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute left-[10%] top-1/2 h-64 w-64 -translate-y-1/2 rounded-full opacity-40 blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(251,207,232,0.6) 0%, transparent 70%)" }}
          />
          <div
            className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-35 blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(167,243,208,0.5) 0%, transparent 70%)" }}
          />
          <div
            className="absolute right-[10%] top-1/2 h-64 w-64 -translate-y-1/2 rounded-full opacity-40 blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(191,219,254,0.6) 0%, transparent 70%)" }}
          />
        </div>

        <div className="relative mx-auto max-w-2xl px-5 text-center lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
              Hazırsanız panel açık — sizi bekliyor
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-slate-500">
              Yeni misiniz? Birkaç dakikada kayıt olun; Onyx AI, deneme analizi ve program
              modülleri sizi karşılasın. Zaten hesabınız varsa giriş yapmanız yeterli.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(true)}
                className={LANDING_REGISTER_BUTTON_CLASS}
              >
                Ücretsiz Kayıt Ol
              </button>
              <Link href={LANDING_LOGIN_HREF} className={LANDING_SECONDARY_BUTTON_CLASS}>
                Giriş Yap
              </Link>
            </div>
            <p className="mt-4 text-xs text-slate-400">
              Sorularınız için{" "}
              <a
                href="mailto:info@derecepanel.com"
                className="font-medium text-slate-500 underline-offset-2 hover:text-orange-600 hover:underline"
              >
                info@derecepanel.com
              </a>
            </p>
          </motion.div>
        </div>
      </section>

      <LandingRegisterModal
        open={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
      />
    </>
  );
}

export function LandingFooter() {
  const legalTriggerClass = cn(FOOTER_LINK_CLASS, "text-left");

  return (
    <footer className="border-t border-orange-500/40 bg-[#0B1120] text-slate-400">
      <div className="mx-auto max-w-6xl px-5 py-10 lg:px-8 lg:py-12">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-[minmax(0,1.35fr)_1fr_1fr_1fr] lg:gap-x-10">
          {/* Marka + partner — tek satır, yan yana */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <div className="-ml-0.5 flex items-center gap-2.5 sm:gap-3.5">
              <Link href="/" className="inline-flex shrink-0 items-center">
                <DereceLogo height={28} className="rounded-sm bg-white px-1.5 py-0.5" />
              </Link>

              <span className="h-5 w-px shrink-0 bg-slate-700" aria-hidden />

              <a
                href={TEKMER_PARTNER.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex shrink-0 items-center gap-2 rounded-md border border-slate-800/80 bg-slate-900/30 px-2.5 py-1.5 transition-colors hover:border-slate-700 hover:bg-slate-900/60"
              >
                <TekmerPartnerLogo height={22} />
                <ArrowUpRight
                  className="h-3.5 w-3.5 shrink-0 text-slate-600 transition-colors group-hover:text-orange-400"
                  strokeWidth={2}
                />
              </a>
            </div>

            <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-slate-500">
              {LANDING_FOOTER_TAGLINE}
            </p>

            <p className="mt-2 text-[11px] text-slate-600">{TEKMER_PARTNER.label}</p>
          </div>

          <FooterColumn title="Ürün">
            {LANDING_FOOTER_LINKS.product.map(({ label, href }) => (
              <li key={`${label}-${href}`}>
                <FooterNavLink href={href} label={label} />
              </li>
            ))}
          </FooterColumn>

          <FooterColumn title="Kurumsal">
            {LANDING_FOOTER_LINKS.corporate.map(({ label, href }) => (
              <li key={`${label}-${href}`}>
                <FooterNavLink href={href} label={label} />
              </li>
            ))}
          </FooterColumn>

          <FooterColumn title="Yasal">
            <li>
              <LegalDocumentModal
                doc={TERMS_OF_SERVICE}
                triggerLabel="Kullanım Şartları"
                triggerClassName={legalTriggerClass}
              />
            </li>
            <li>
              <LegalDocumentModal
                doc={PRIVACY_POLICY}
                triggerLabel="Gizlilik Politikası"
                triggerClassName={legalTriggerClass}
              />
            </li>
            <li>
              <a href="mailto:info@derecepanel.com" className={FOOTER_LINK_CLASS}>
                Destek
              </a>
            </li>
          </FooterColumn>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-slate-800/80 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-slate-600">© 2026 DerecePanel. Tüm hakları saklıdır.</p>
          <a
            href="mailto:info@derecepanel.com"
            className="text-[11px] text-slate-600 transition-colors hover:text-slate-400"
          >
            info@derecepanel.com
          </a>
        </div>
      </div>
    </footer>
  );
}
