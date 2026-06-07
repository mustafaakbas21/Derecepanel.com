"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/lib/notify";

const DEMO_BULLETS = [
  "Otonom matris okuyucuyu canlı test edin.",
  "Öğrenci sayınıza özel fiyatlandırma alın.",
  "Kurumunuza özel (White-Label) çözümleri keşfedin.",
] as const;

const STUDENT_COUNT_OPTIONS = [
  { value: "1-10", label: "1-10 Öğrenci" },
  { value: "10-50", label: "10-50 Öğrenci" },
  { value: "50-200", label: "50-200 Öğrenci" },
  { value: "200+", label: "200+ Öğrenci" },
] as const;

const fieldClassName =
  "h-11 rounded-xl border-slate-200 bg-white text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:border-slate-300 focus-visible:ring-2 focus-visible:ring-slate-200/80 focus-visible:shadow-sm";

export function LandingDemoContact() {
  const [studentCount, setStudentCount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [highlightForm, setHighlightForm] = useState(false);

  useEffect(() => {
    function pulseIfDemoHash() {
      const hash = window.location.hash;
      if (hash !== "#demo" && hash !== "#iletisim") return;
      window.setTimeout(() => {
        setHighlightForm(true);
        window.setTimeout(() => setHighlightForm(false), 1800);
      }, 120);
    }

    pulseIfDemoHash();
    window.addEventListener("hashchange", pulseIfDemoHash);
    return () => window.removeEventListener("hashchange", pulseIfDemoHash);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!studentCount) {
      toast.error("Lütfen aktif öğrenci sayınızı seçin.");
      return;
    }

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));

    toast.success("Talebiniz alındı. En kısa sürede sizinle iletişime geçeceğiz.");
    e.currentTarget.reset();
    setStudentCount("");
    setSubmitting(false);
  }

  return (
    <section
      id="demo"
      className="relative z-10 scroll-mt-24 border-t border-slate-200/70 bg-[#F4F7F6] py-24 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-lg"
          >
            <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-orange-600">
              Demo & İletişim
            </p>
            <h2
              className="mb-4 font-extrabold tracking-tight text-slate-900"
              style={{ fontSize: "clamp(26px, 3.5vw, 38px)", lineHeight: 1.15 }}
            >
              Sistemi Canlı Görmek İster misiniz?
            </h2>
            <p className="mb-8 text-base leading-relaxed text-slate-500 sm:text-[17px]">
              Kurumunuzun veya koçluk işinizin operasyonel yükünü nasıl sıfırlayacağınızı birlikte
              planlayalım. Formu doldurun, size ulaşıp 15 dakikalık kısa bir sistem turu planlayalım.
            </p>
            <ul className="space-y-4">
              {DEMO_BULLETS.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
                  <span className="text-[15px] leading-relaxed text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.08 }}
          >
            <div
              id="iletisim"
              className={`scroll-mt-24 rounded-3xl border border-slate-200/90 bg-white p-8 shadow-sm transition-[box-shadow,ring-color] duration-500 sm:p-9 ${
                highlightForm
                  ? "ring-2 ring-orange-500/35 shadow-lg shadow-orange-500/10"
                  : "ring-0 ring-transparent"
              }`}
            >
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="demo-name">Ad Soyad</Label>
                  <Input
                    id="demo-name"
                    name="name"
                    required
                    autoComplete="name"
                    placeholder="Adınız Soyadınız"
                    className={fieldClassName}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="demo-org">Kurum Adı veya Koçluk Unvanınız</Label>
                  <Input
                    id="demo-org"
                    name="organization"
                    required
                    placeholder="Örn. Net Artı Koçluk / ABC Dershanesi"
                    className={fieldClassName}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="demo-email">E-posta Adresi</Label>
                  <Input
                    id="demo-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="ornek@kurum.com"
                    className={fieldClassName}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="demo-phone">Telefon Numarası</Label>
                  <Input
                    id="demo-phone"
                    name="phone"
                    type="tel"
                    required
                    autoComplete="tel"
                    placeholder="05XX XXX XX XX"
                    className={fieldClassName}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="demo-students">Aktif Öğrenci Sayınız</Label>
                  <Select value={studentCount} onValueChange={setStudentCount} required>
                    <SelectTrigger id="demo-students" className={fieldClassName}>
                      <SelectValue placeholder="Öğrenci hacminizi seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {STUDENT_COUNT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <input type="hidden" name="studentCount" value={studentCount} />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting}
                  className="mt-2 h-12 w-full rounded-full text-[15px] font-bold"
                >
                  {submitting ? "Gönderiliyor…" : "Ücretsiz Demo Planla"}
                </Button>

                <p className="text-center text-[12px] leading-relaxed text-slate-400">
                  Bilgileriniz yalnızca demo planlaması için kullanılır.{" "}
                  <a href="/gizlilik" className="text-slate-500 underline-offset-2 hover:underline">
                    Gizlilik Politikası
                  </a>
                </p>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
