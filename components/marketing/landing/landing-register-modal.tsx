"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  User,
  Mail,
  Phone,
  ShieldCheck,
  Loader2,
  GraduationCap,
  Building2,
  Briefcase,
  CheckCircle2,
} from "lucide-react";

import { LegalDocumentModal } from "@/components/marketing/legal-document-modal";
import { Checkbox } from "@/components/ui/checkbox";
import {
  REGISTER_ROLE_LABELS,
  type RegisterRole,
} from "@/lib/marketing/registration-request";
import {
  KVKK_AYDINLATMA,
  PRIVACY_POLICY,
  TERMS_OF_SERVICE,
} from "@/lib/marketing/legal-content";
import { toast } from "@/lib/notify";
import { cn } from "@/lib/utils";

const ROLE_OPTIONS: {
  id: RegisterRole;
  label: string;
  icon: typeof GraduationCap;
}[] = [
  { id: "ogrenci", label: "Öğrenci", icon: GraduationCap },
  { id: "koc", label: "Eğitim Koçu", icon: Briefcase },
  { id: "kurum", label: "Kurum/Dershane", icon: Building2 },
];

const LEGAL_LINK_CLASS =
  "inline font-semibold text-slate-900 underline underline-offset-2 transition-colors hover:text-orange-600";

type LandingRegisterModalProps = {
  open: boolean;
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

export function LandingRegisterModal({ open, onClose }: LandingRegisterModalProps) {
  const [role, setRole] = useState<RegisterRole>("koc");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const resetForm = useCallback(() => {
    setRole("koc");
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
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
    firstName.trim() && lastName.trim() && email.trim() && kvkkAccepted && !loading && !submitted;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);

    const payload = {
      role,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
    };

    try {
      const res = await fetch("/api/marketing/register-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        delivered?: boolean;
        fallback?: string;
        error?: string;
      };

      if (!res.ok) {
        toast.error(data.error ?? "Talep gönderilemedi. Lütfen tekrar deneyin.");
        return;
      }

      toast.success("Kayıt talebiniz alındı. En kısa sürede size dönüş yapacağız.");
      setSubmitted(true);
    } catch {
      toast.error("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.button
            type="button"
            aria-label="Modalı kapat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="register-modal-title"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 max-h-[min(92vh,820px)] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl shadow-slate-900/20"
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
                  <h2 className="text-xl font-extrabold text-slate-900">Talebiniz bize ulaştı</h2>
                  <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-500">
                    Ekibimiz <strong className="font-semibold text-slate-700">{REGISTER_ROLE_LABELS[role]}</strong>{" "}
                    kaydınızı inceleyip <strong className="font-semibold text-slate-700">{email}</strong> adresine
                    kısa süre içinde dönüş yapacak. Hesabınızı birlikte açacağız.
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
                  <div className="mb-8 max-w-lg">
                    <h2
                      id="register-modal-title"
                      className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-[1.65rem]"
                    >
                      Derecepanel&apos;e Hoş Geldiniz
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500 sm:text-base">
                      Bilgilerinizi bırakın; ekibimiz sizinle iletişime geçip hesabınızı birlikte
                      açalım. Anında otomatik kayıt oluşturulmaz.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <p className="mb-2.5 text-xs font-semibold text-slate-600">Hesap tipi</p>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {ROLE_OPTIONS.map(({ id, label, icon: Icon }) => {
                          const active = role === id;
                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() => setRole(id)}
                              className={cn(
                                "flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition-all",
                                active
                                  ? "border-orange-500 bg-orange-500 text-white shadow-md shadow-orange-500/25"
                                  : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white"
                              )}
                            >
                              <Icon className="h-4 w-4 shrink-0" />
                              <span className="text-center leading-tight">{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormInput
                        id="register-first-name"
                        label="Ad"
                        icon={User}
                        value={firstName}
                        onChange={setFirstName}
                        placeholder="Adınız"
                        autoComplete="given-name"
                      />
                      <FormInput
                        id="register-last-name"
                        label="Soyad"
                        icon={User}
                        value={lastName}
                        onChange={setLastName}
                        placeholder="Soyadınız"
                        autoComplete="family-name"
                      />
                    </div>

                    <FormInput
                      id="register-email"
                      label="E-posta"
                      type="email"
                      icon={Mail}
                      value={email}
                      onChange={setEmail}
                      placeholder="ornek@email.com"
                      autoComplete="email"
                    />

                    <FormInput
                      id="register-phone"
                      label="Telefon"
                      type="tel"
                      icon={Phone}
                      value={phone}
                      onChange={setPhone}
                      placeholder="05XX XXX XX XX"
                      autoComplete="tel"
                      required={false}
                    />

                    <div className="rounded-2xl bg-slate-50 p-4 sm:p-5">
                      <div className="flex gap-3">
                        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                        <div className="min-w-0 flex-1">
                          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Güvenlik ve gizlilik
                          </p>
                          <label className="flex cursor-pointer items-start gap-3">
                            <Checkbox
                              checked={kvkkAccepted}
                              onCheckedChange={(v) => setKvkkAccepted(v === true)}
                              className="mt-0.5 border-slate-300 data-[state=checked]:border-orange-500 data-[state=checked]:from-orange-500 data-[state=checked]:to-orange-600"
                            />
                            <span className="text-xs leading-relaxed text-slate-600 sm:text-[13px]">
                              Kişisel verilerimin{" "}
                              <LegalDocumentModal
                                doc={KVKK_AYDINLATMA}
                                triggerLabel="KVKK Aydınlatma Metni"
                                triggerClassName={LEGAL_LINK_CLASS}
                              />{" "}
                              kapsamında işlenmesini,{" "}
                              <LegalDocumentModal
                                doc={TERMS_OF_SERVICE}
                                triggerLabel="Kullanıcı Sözleşmesi"
                                triggerClassName={LEGAL_LINK_CLASS}
                              />
                              &apos;ni ve{" "}
                              <LegalDocumentModal
                                doc={PRIVACY_POLICY}
                                triggerLabel="Gizlilik Politikası"
                                triggerClassName={LEGAL_LINK_CLASS}
                              />
                              &apos;nı okuyup anladığımı kabul ediyorum.
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!canSubmit}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-bold text-white shadow-md shadow-orange-500/25 transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Talebiniz iletiliyor…
                        </>
                      ) : (
                        "Kayıt Talebini Gönder"
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
