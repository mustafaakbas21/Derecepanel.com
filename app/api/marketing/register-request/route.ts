import { NextResponse } from "next/server";
import { z } from "zod";

import { appendRegistrationRequest } from "@/lib/admin/registration-requests-server";
import type { RegisterRole } from "@/lib/marketing/registration-request";
import { sendRegistrationRequestEmail } from "@/lib/marketing/registration-request";

const bodySchema = z.object({
  role: z.enum(["ogrenci", "koc", "kurum"]),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(30).optional(),
  message: z.string().trim().max(500).optional(),
  planId: z.string().trim().max(80).optional(),
  planName: z.string().trim().max(120).optional(),
  billingPeriod: z.enum(["aylik", "yillik"]).optional(),
  organization: z.string().trim().max(120).optional(),
  teamSize: z.string().trim().max(40).optional(),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Lütfen zorunlu alanları eksiksiz doldurun." },
      { status: 400 }
    );
  }

  const payload = {
    ...parsed.data,
    role: parsed.data.role as RegisterRole,
  };

  try {
    await appendRegistrationRequest(payload);
  } catch (err) {
    console.warn("[register-request] Platform kaydı başarısız:", err);
  }

  const result = await sendRegistrationRequestEmail(payload);

  if (result.ok) {
    return NextResponse.json({ ok: true, delivered: true });
  }

  if (result.reason === "not_configured") {
    console.info("[register-request] Yeni talep (RESEND_API_KEY tanımlı değil):", payload);
    return NextResponse.json({ ok: true, delivered: false });
  }

  return NextResponse.json(
    { error: "Talep şu an iletilemedi. Lütfen biraz sonra tekrar deneyin." },
    { status: 502 }
  );
}
