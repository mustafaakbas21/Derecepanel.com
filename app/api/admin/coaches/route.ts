import { NextResponse } from "next/server";
import { z } from "zod";

import { provisionCoachWithAppwrite } from "@/lib/admin/provision-coach";
import { AuthError, requireAdminAuth } from "@/lib/admin/require-admin";

const bodySchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  username: z.string().trim().min(1).max(80),
  password: z.string().min(6).max(200),
  coachId: z.string().trim().optional(),
  phone: z.string().trim().max(30).optional(),
  specialty: z.string().trim().max(120).optional(),
  status: z.enum(["Aktif", "Pasif"]).optional(),
});

export async function POST(request: Request) {
  try {
    await requireAdminAuth();
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Form verileri geçersiz." }, { status: 400 });
  }

  const coachId = parsed.data.coachId?.trim() || `coach-${crypto.randomUUID()}`;

  try {
    const result = await provisionCoachWithAppwrite({
      username: parsed.data.username,
      password: parsed.data.password,
      displayName: parsed.data.displayName,
      coachId,
    });

    return NextResponse.json({
      ok: true,
      coachId,
      email: result.email,
      appwriteProvisioned: result.appwriteProvisioned,
    });
  } catch (err) {
    return NextResponse.json(
      { error: String((err as Error)?.message || "Koç hesabı oluşturulamadı.") },
      { status: 500 }
    );
  }
}
