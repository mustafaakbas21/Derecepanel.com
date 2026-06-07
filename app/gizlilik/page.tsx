import type { Metadata } from "next";
import Link from "next/link";

import { DereceLogo } from "@/components/coach/derece-logo";
import { PRIVACY_POLICY } from "@/lib/marketing/legal-content";

export const metadata: Metadata = {
  title: "Gizlilik Politikası | DerecePanel",
  description: "DerecePanel gizlilik politikası ve veri işleme ilkeleri.",
};

export default function GizlilikPage() {
  return (
    <div className="min-h-screen bg-[#F4F7F6] font-sans">
      <header className="border-b border-slate-200/70 bg-white/80">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center">
            <DereceLogo height={28} />
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
          >
            Ana sayfa
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-14">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-orange-600">Yasal</p>
        <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-slate-900">
          {PRIVACY_POLICY.title}
        </h1>
        <p className="mb-10 text-slate-500 leading-relaxed">{PRIVACY_POLICY.intro}</p>

        <div className="space-y-8 text-sm leading-relaxed text-slate-600">
          {PRIVACY_POLICY.sections.map((section) => (
            <section key={section.title}>
              <h2 className="mb-2 text-base font-bold text-slate-900">{section.title}</h2>
              <div className="space-y-3">
                {section.paragraphs.map((p) => (
                  <p key={p.slice(0, 40)}>{p}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-8 text-sm text-slate-500">
          Hizmet koşulları için{" "}
          <Link href="/sartlar" className="font-medium text-orange-600 hover:text-orange-700">
            Kullanım Şartları
          </Link>
          sayfasına bakın.
        </p>
        <p className="mt-4 text-xs text-slate-400">Son güncelleme: {PRIVACY_POLICY.updated}</p>
      </main>
    </div>
  );
}
