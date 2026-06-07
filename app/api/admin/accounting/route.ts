import { NextResponse } from "next/server";
import { z } from "zod";

import {
  deleteAccountingTransaction,
  listAccountingTransactions,
  upsertAccountingTransaction,
} from "@/lib/admin/accounting-server";
import { AuthError, requireAdminAuth } from "@/lib/admin/require-admin";

const draftSchema = z.object({
  type: z.enum(["gelir", "gider"]),
  category: z.enum([
    "ogrenci_ucreti",
    "kurum_anlasmasi",
    "abonelik",
    "diger_gelir",
    "maas",
    "ofis",
    "pazarlama",
    "yazilim",
    "vergi",
    "diger_gider",
  ]),
  title: z.string().trim().min(1).max(200),
  amount: z.number().positive(),
  date: z.string().trim().min(1),
  status: z.enum(["odendi", "beklemede", "iptal"]),
  description: z.string().trim().max(500).optional(),
  relatedCoachId: z.string().trim().max(80).optional(),
  relatedStudentId: z.string().trim().max(80).optional(),
  relatedInstitutionId: z.string().trim().max(80).optional(),
});

const postSchema = draftSchema;
const patchSchema = draftSchema.extend({
  id: z.string().trim().min(1),
});

async function guardAdmin() {
  try {
    await requireAdminAuth();
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }
  return null;
}

export async function GET() {
  const denied = await guardAdmin();
  if (denied) return denied;

  const items = await listAccountingTransactions();
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Form verileri geçersiz." }, { status: 400 });
  }

  try {
    const item = await upsertAccountingTransaction(parsed.data);
    return NextResponse.json({ ok: true, item });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Kayıt başarısız." },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;

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

  const { id, ...draft } = parsed.data;

  try {
    const item = await upsertAccountingTransaction(draft, id);
    return NextResponse.json({ ok: true, item });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Güncellenemedi.";
    const status = message === "Kayıt bulunamadı." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const id = String((json as { id?: string })?.id || "").trim();
  if (!id) {
    return NextResponse.json({ error: "Kayıt kimliği gerekli." }, { status: 400 });
  }

  const ok = await deleteAccountingTransaction(id);
  if (!ok) {
    return NextResponse.json({ error: "Kayıt bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
