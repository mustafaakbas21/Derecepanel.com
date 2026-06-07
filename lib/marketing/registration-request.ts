export type RegisterRole = "ogrenci" | "koc" | "kurum";

export type RegistrationRequestPayload = {
  role: RegisterRole;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  message?: string;
  planId?: string;
  planName?: string;
  billingPeriod?: "aylik" | "yillik";
  organization?: string;
  teamSize?: string;
};

export const REGISTER_ROLE_LABELS: Record<RegisterRole, string> = {
  ogrenci: "Öğrenci",
  koc: "Eğitim Koçu",
  kurum: "Kurum / Dershane",
};

export function buildRegistrationEmailHtml(payload: RegistrationRequestPayload): string {
  const roleLabel = REGISTER_ROLE_LABELS[payload.role];
  return `
    <h2>Yeni kayıt talebi</h2>
    <p><strong>Hesap tipi:</strong> ${roleLabel}</p>
    <p><strong>Ad Soyad:</strong> ${payload.firstName} ${payload.lastName}</p>
    <p><strong>E-posta:</strong> <a href="mailto:${payload.email}">${payload.email}</a></p>
    ${payload.phone ? `<p><strong>Telefon:</strong> ${payload.phone}</p>` : ""}
    ${payload.planName ? `<p><strong>Paket:</strong> ${payload.planName}${payload.planId ? ` (${payload.planId})` : ""}</p>` : ""}
    ${payload.billingPeriod ? `<p><strong>Faturalandırma:</strong> ${payload.billingPeriod === "yillik" ? "Yıllık" : "Aylık"}</p>` : ""}
    ${payload.organization ? `<p><strong>Kurum / okul:</strong> ${payload.organization}</p>` : ""}
    ${payload.teamSize ? `<p><strong>Ekip / öğrenci sayısı:</strong> ${payload.teamSize}</p>` : ""}
    ${payload.message ? `<p><strong>Not:</strong> ${payload.message}</p>` : ""}
    <hr />
    <p style="color:#64748b;font-size:12px;">Derecepanel landing kayıt formu</p>
  `.trim();
}

export async function sendRegistrationRequestEmail(
  payload: RegistrationRequestPayload
): Promise<{ ok: true } | { ok: false; reason: "not_configured" | "send_failed" }> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.REGISTRATION_TO_EMAIL ?? "info@derecepanel.com";
  const from =
    process.env.REGISTRATION_FROM_EMAIL ?? "Derecepanel <onboarding@resend.dev>";

  if (!apiKey) {
    return { ok: false, reason: "not_configured" };
  }

  const roleLabel = REGISTER_ROLE_LABELS[payload.role];
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: payload.email,
      subject: payload.planName
        ? `Teklif Talebi — ${payload.planName} — ${payload.firstName} ${payload.lastName}`
        : `Kayıt Talebi — ${roleLabel} — ${payload.firstName} ${payload.lastName}`,
      html: buildRegistrationEmailHtml(payload),
    }),
  });

  if (!res.ok) {
    console.error("[register-request] Resend error:", await res.text());
    return { ok: false, reason: "send_failed" };
  }

  return { ok: true };
}
