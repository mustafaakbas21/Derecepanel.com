"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  CheckCircle2,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  ShieldCheck,
  User,
  Users,
  X,
} from "lucide-react";

import { LegalDocumentModal } from "@/components/marketing/legal-document-modal";
import { Checkbox } from "@/components/ui/checkbox";
import {
  getPlanPriceDisplay,
  type PricingAudience,
  type PricingPlan,
} from "@/lib/marketing/pricing-plans";
import {
  KVKK_AYDINLATMA,
  PRIVACY_POLICY,
  TERMS_OF_SERVICE,
} from "@/lib/marketing/legal-content";
import { REGISTER_ROLE_LABELS } from "@/lib/marketing/registration-request";
import { toast } from "@/lib/notify";
import { cn } from "@/lib/utils";

const LEGAL_LINK_CLASS =
  "inline font-semibold text-slate-900 underline underline-offset-2 transition-colors hover:text-orange-600";

export type PricingQuoteContext = {
  plan: PricingPlan;
  audience: PricingAudience;
  isYearly: boolean;
};

type Props = {
  open: boolean;
  context: PricingQuoteContext | null;
  onClose: () => void;
};

function FormInput({
  id,
  label,
  type = "text",
  icon: Icon,
  value,
  onChange,
  placeholder,
  autoComplete,
  required = true,
}: {
  id: string;
  label: string;
  type?: string;
  icon: typeof User;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
        {!required && <span className="font-normal text-slate-400"> (isteğe bağlı)</span>}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className="w-full rounded-xl border border-transparent bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/25"
        />
      </div>
    </div>
  );
}

export function PricingQuoteModal({ open, context, onClose }: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [organization, setOrganization] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [message, setMessage] = useState("");
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const resetForm = useCallback(() => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setOrganization("");
    setTeamSize("");
    setMessage("");
    setKvkkAccepted(false);
    setLoading(false);
    setSubmitted(false);
  }, []);

  const handleClose = useCallback(() => {
    if (loading) return;
    onClose();
    resetForm();
  }, [loading, onClose, resetForm]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, handleClose]);

  const canSubmit =
    firstName.trim() &&
    lastName.trim() &&
    email.trim() &&
    kvkkAccepted &&
    !loading &&
    !submitted &&
    context;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !context) return;

    setLoading(true);

    const payload = {
      role: context.audience,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      message: message.trim() || undefined,
      planId: context.plan.id,
      planName: context.plan.name,
      billingPeriod: context.isYearly ? ("yillik" as const) : ("aylik" as const),
      organization: organization.trim() || undefined,
      teamSize: teamSize.trim() || undefined,
    };

    try {
      const res = await fetch("/api/marketing/register-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok) {
        toast.error(data.error ?? "Teklif gönderilemedi. Lütfen tekrar deneyin.");
        return;
      }

      toast.success("Teklif talebiniz alındı. En kısa sürede size dönüş yapacağız.");
      setSubmitted(true);
    } catch {
      toast.error("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  const plan = context?.plan;
  const priceDisplay = plan ? getPlanPriceDisplay(plan, context?.isYearly ?? false) : null;
  const roleLabel = context ? REGISTER_ROLE_LABELS[context.audience] : "";

  return (
    <AnimatePresence>
      {open && context && plan ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
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
            aria-labelledby="quote-modal-title"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 max-h-[min(92vh,860px)] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl shadow-slate-900/20"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              aria-label="Kapat"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="px-6 pb-8 pt-10 sm:px-10 sm:pb-10">
              {submitted ? (
                <div className="py-8 text-center">
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900">Teklif talebiniz alındı</h2>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-500">
                    <strong className="font-semibold text-slate-700">{plan.name}</strong> paketi için
                    talebiniz ekibimize iletildi.{" "}
                    <strong className="font-semibold text-slate-700">{email}</strong> adresine kısa
                    süre içinde dönüş yapacağız.
                  </p>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="mt-8 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                  >
                    Tamam
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-6 rounded-2xl border border-orange-200/80 bg-orange-50/60 p-4 sm:p-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-orange-600">
                      Seçilen paket
                    </p>
                    <h2 id="quote-modal-title" className="mt-1 text-xl font-extrabold text-slate-900">
                      {plan.name}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">{roleLabel}</p>
                    <div className="mt-3 flex flex-wrap items-baseline gap-2">
                      <span className="text-2xl font-extrabold text-slate-900">
                        {priceDisplay?.price}
                      </span>
                      {priceDisplay?.note ? (
                        <span className="text-xs text-slate-500">{priceDisplay.note}</span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Faturalandırma: {context.isYearly ? "Yıllık (%20 indirimli)" : "Aylık"}
                    </p>
                  </div>

                  <p className="mb-6 text-sm leading-relaxed text-slate-500">
                    Bilgilerinizi doldurun; size özel teklif ve kurulum adımlarını paylaşalım.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormInput
                        id="quote-first-name"
                        label="Ad"
                        icon={User}
                        value={firstName}
                        onChange={setFirstName}
                        placeholder="Adınız"
                        autoComplete="given-name"
                      />
                      <FormInput
                        id="quote-last-name"
                        label="Soyad"
                        icon={User}
                        value={lastName}
                        onChange={setLastName}
                        placeholder="Soyadınız"
                        autoComplete="family-name"
                      />
                    </div>

                    <FormInput
                      id="quote-email"
                      label="E-posta"
                      type="email"
                      icon={Mail}
                      value={email}
                      onChange={setEmail}
                      placeholder="ornek@email.com"
                      autoComplete="email"
                    />

                    <FormInput
                      id="quote-phone"
                      label="Telefon"
                      type="tel"
                      icon={Phone}
                      value={phone}
                      onChange={setPhone}
                      placeholder="05XX XXX XX XX"
                      autoComplete="tel"
                    />

                    {context.audience === "kurum" ? (
                      <FormInput
                        id="quote-org"
                        label="Kurum / dershane adı"
                        icon={Building2}
                        value={organization}
                        onChange={setOrganization}
                        placeholder="Kurumunuzun adı"
                      />
                    ) : (
                      <FormInput
                        id="quote-org"
                        label="Okul / kurum"
                        icon={Building2}
                        value={organization}
                        onChange={setOrganization}
                        placeholder="Örn. XX Anadolu Lisesi"
                        required={false}
                      />
                    )}

                    <FormInput
                      id="quote-team"
                      label={
                        context.audience === "kurum"
                          ? "Tahmini öğrenci / koç sayısı"
                          : context.audience === "koc"
                            ? "Öğrenci sayınız"
                            : "Koçunuz var mı? (not)"
                      }
                      icon={Users}
                      value={teamSize}
                      onChange={setTeamSize}
                      placeholder={
                        context.audience === "kurum"
                          ? "Örn. 120 öğrenci, 8 koç"
                          : context.audience === "koc"
                            ? "Örn. 15 öğrenci"
                            : "Örn. Koçum Derecepanel kullanıyor"
                      }
                      required={false}
                    />

                    <div>
                      <label
                        htmlFor="quote-message"
                        className="mb-1.5 block text-xs font-semibold text-slate-600"
                      >
                        Ek notunuz <span className="font-normal text-slate-400">(isteğe bağlı)</span>
                      </label>
                      <div className="relative">
                        <MessageSquare className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                        <textarea
                          id="quote-message"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="İhtiyaçlarınız, sorularınız veya özel talepleriniz…"
                          rows={3}
                          className="w-full resize-none rounded-xl border border-transparent bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/25"
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="flex gap-3">
                        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                        <label className="flex cursor-pointer items-start gap-3">
                          <Checkbox
                            checked={kvkkAccepted}
                            onCheckedChange={(v) => setKvkkAccepted(v === true)}
                            className="mt-0.5 border-slate-300 data-[state=checked]:border-orange-500 data-[state=checked]:from-orange-500 data-[state=checked]:to-orange-600"
                          />
                          <span className="text-xs leading-relaxed text-slate-600">
                            <LegalDocumentModal
                              doc={KVKK_AYDINLATMA}
                              triggerLabel="KVKK Aydınlatma Metni"
                              triggerClassName={LEGAL_LINK_CLASS}
                            />
                            ,{" "}
                            <LegalDocumentModal
                              doc={TERMS_OF_SERVICE}
                              triggerLabel="Kullanıcı Sözleşmesi"
                              triggerClassName={LEGAL_LINK_CLASS}
                            />{" "}
                            ve{" "}
                            <LegalDocumentModal
                              doc={PRIVACY_POLICY}
                              triggerLabel="Gizlilik Politikası"
                              triggerClassName={LEGAL_LINK_CLASS}
                            />
                            &apos;nı okudum, kabul ediyorum.
                          </span>
                        </label>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!canSubmit}
                      className={cn(
                        "flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white shadow-md transition-colors",
                        "bg-orange-500 shadow-orange-500/25 hover:bg-orange-600",
                        "disabled:cursor-not-allowed disabled:opacity-50"
                      )}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Gönderiliyor…
                        </>
                      ) : (
                        "Teklif Yolla"
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
