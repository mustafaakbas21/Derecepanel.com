"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

import {
  LANDING_LOGIN_BUTTON_CLASS,
  LANDING_LOGIN_HREF,
} from "@/components/marketing/landing/landing-buttons";
import { UseCaseIllustration } from "@/components/marketing/landing/landing-use-case-illustrations";
import { fadeUp } from "@/components/marketing/landing/landing-motion";
import { LANDING_USE_CASES } from "@/lib/marketing/landing-page-data";
import { handleSectionClick } from "@/lib/marketing/smooth-scroll";

export function LandingUseCases() {
  return (
    <section id="cozumler" className="scroll-mt-20 bg-slate-50 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mb-12 max-w-xl"
        >
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Kim kullanıyor?
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-500">
            Bireysel koç, dershane yöneticisi veya YKS öğrencisi olun — aynı veri setine
            bakarak konuşmanız yeterli. Her profil için panel farklı açılır ama altyapı
            ortaktır.
          </p>
        </motion.div>

        <div className="space-y-4 sm:space-y-5">
          {LANDING_USE_CASES.map((uc, i) => (
            <motion.article
              key={uc.id}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-30px" }}
              variants={fadeUp}
              custom={i * 0.3}
              className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm"
            >
              <div className="grid grid-cols-1 items-center gap-6 p-6 sm:grid-cols-2 sm:gap-8 sm:p-8 lg:p-10">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">{uc.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-500 sm:text-base">
                    {uc.description}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {uc.highlights.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.5} />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link href={LANDING_LOGIN_HREF} className={LANDING_LOGIN_BUTTON_CLASS}>
                      Giriş Yap
                    </Link>
                    <a
                      href="#fiyatlandirma"
                      onClick={(e) => handleSectionClick(e, "#fiyatlandirma")}
                      className="inline-flex items-center text-sm font-semibold text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
                    >
                      Paketlere bak
                    </a>
                  </div>
                </div>
                <UseCaseIllustration type={uc.illustration} />
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
