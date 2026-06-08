import { NextResponse } from "next/server";
import { z } from "zod";

import {
  deleteInstitutionById,
  listInstitutions,
  upsertInstitution,
} from "@/lib/admin/institutions-server";
import { AuthError, requireAdminAuth } from "@/lib/admin/require-admin";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(200),
  contactName: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(30).optional(),
  email: z.string().trim().max(120).optional(),
  status: z.enum(["Aktif", "Pasif"]).optional(),
  id: z.string().trim().optional(),
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

  try {
    const institutions = await listInstitutions();
    return NextResponse.json({ institutions });
  } catch (err) {
    return NextResponse.json(
      { error: String((err as Error)?.message || "Kurum listesi yüklenemedi.") },
      { status: 500 }
    );
  }
}

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

  try {
    const institution = await upsertInstitution(parsed.data, parsed.data.id);
    return NextResponse.json({ ok: true, institution });
  } catch (err) {
    return NextResponse.json(
      { error: String((err as Error)?.message || "Kurum kaydedilemedi.") },
      { status: 500 }
    );
  }
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

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ error: "Kurum kimliği gerekli." }, { status: 400 });
  }

  try {
    const ok = await deleteInstitutionById(id);
    if (!ok) return NextResponse.json({ error: "Kurum bulunamadı." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: String((err as Error)?.message || "Kurum silinemedi.") },
      { status: 500 }
    );
  }
}
