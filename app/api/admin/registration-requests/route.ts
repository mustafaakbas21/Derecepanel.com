import { NextResponse } from "next/server";
import { z } from "zod";

import {
  deleteRegistrationRequest,
  listRegistrationRequests,
  updateRegistrationRequest,
} from "@/lib/admin/registration-requests-server";
import { AuthError, requireAdminAuth } from "@/lib/admin/require-admin";

const patchSchema = z.object({
  id: z.string().trim().min(1),
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  email: z.string().trim().email().max(200).optional(),
  phone: z.string().trim().max(30).optional(),
  message: z.string().trim().max(500).optional(),
  role: z.enum(["ogrenci", "koc", "kurum"]).optional(),
  status: z.enum(["yeni", "okundu"]).optional(),
  planName: z.string().trim().max(120).optional(),
  billingPeriod: z.enum(["aylik", "yillik"]).optional(),
  organization: z.string().trim().max(120).optional(),
  teamSize: z.string().trim().max(40).optional(),
});

export async function GET() {
  try {
    await requireAdminAuth();
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const items = await listRegistrationRequests();
  return NextResponse.json({ items });
}

export async function PATCH(request: Request) {
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

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Form verileri geçersiz." }, { status: 400 });
  }

  const { id, ...patch } = parsed.data;
  const item = await updateRegistrationRequest(id, patch);
  if (!item) {
    return NextResponse.json({ error: "Kayıt bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, item });
}

export async function DELETE(request: Request) {
  try {
    await requireAdminAuth();
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  let id = "";
  try {
    const body = (await request.json()) as { id?: string };
    id = String(body.id || "").trim();
  } catch {
    const url = new URL(request.url);
    id = url.searchParams.get("id")?.trim() || "";
  }

  if (!id) {
    return NextResponse.json({ error: "Kayıt kimliği gerekli." }, { status: 400 });
  }

  const deleted = await deleteRegistrationRequest(id);
  if (!deleted) {
    return NextResponse.json({ error: "Kayıt bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
