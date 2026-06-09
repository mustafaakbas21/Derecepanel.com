import { NextResponse } from "next/server";
import { z } from "zod";

import {
  deleteCoachFromPlatform,
  loadPlatformCoaches,
  resolveCoachUsername,
  saveCoachToPlatform,
  updateCoachOnPlatform,
} from "@/lib/admin/coaches-server";
import { provisionCoachWithAppwrite } from "@/lib/admin/provision-coach";
import {
  resolveAuthEmailFromUsername,
  translateAppwriteUserError,
} from "@/lib/appwrite/auth-users-server";
import { AuthError, requireAdminAuth } from "@/lib/admin/require-admin";

function coachErrorResponse(err: unknown) {
  const raw = err instanceof Error ? err.message : String(err || "Koç hesabı oluşturulamadı.");
  const message = translateAppwriteUserError(err instanceof Error ? err : new Error(raw)).message;
  const isDuplicate = /zaten kullanılıyor|zaten kayıtlı/i.test(message);
  return NextResponse.json({ error: message || raw }, { status: isDuplicate ? 409 : 500 });
}

const bodySchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  username: z.string().trim().min(1).max(80),
  password: z.string().min(8).max(200),
  coachId: z.string().trim().optional(),
  phone: z.string().trim().max(30).optional(),
  specialty: z.string().trim().max(120).optional(),
  status: z.enum(["Aktif", "Pasif"]).optional(),
});

const patchSchema = z.object({
  coachId: z.string().trim().min(1),
  displayName: z.string().trim().min(1).max(120),
  username: z.string().trim().min(1).max(80),
  password: z.string().min(8).max(200).optional(),
  phone: z.string().trim().max(30).optional(),
  specialty: z.string().trim().max(120).optional(),
  status: z.enum(["Aktif", "Pasif"]).optional(),
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
    const coaches = await loadPlatformCoaches();
    return NextResponse.json({ coaches });
  } catch (err) {
    return NextResponse.json(
      { error: String((err as Error)?.message || "Koç listesi yüklenemedi.") },
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
    const passwordIssue = parsed.error.issues.find((issue) => issue.path[0] === "password");
    if (passwordIssue) {
      return NextResponse.json({ error: "Şifre en az 8 karakter olmalı." }, { status: 400 });
    }
    return NextResponse.json({ error: "Form verileri geçersiz." }, { status: 400 });
  }

  let username: string;
  let loginEmail: string;
  try {
    username = resolveCoachUsername(parsed.data.username);
    loginEmail = resolveAuthEmailFromUsername(parsed.data.username);
  } catch (err) {
    return NextResponse.json(
      { error: String((err as Error)?.message || "Geçersiz kullanıcı adı.") },
      { status: 400 }
    );
  }

  const coachId = parsed.data.coachId?.trim() || crypto.randomUUID();

  const existingCoaches = await loadPlatformCoaches();
  const duplicateCoach = existingCoaches.find((c) => c.username === username);
  if (duplicateCoach) {
    try {
      const result = await provisionCoachWithAppwrite({
        username,
        password: parsed.data.password,
        displayName: parsed.data.displayName,
        coachId: duplicateCoach.coachId,
      });

      const coach = await saveCoachToPlatform({
        coachId: duplicateCoach.coachId,
        username,
        password: parsed.data.password,
        displayName: parsed.data.displayName.trim() || username,
        email: result.email,
        phone: parsed.data.phone,
        specialty: parsed.data.specialty,
        status: parsed.data.status,
      });

      return NextResponse.json({
        ok: true,
        coach,
        coachId: duplicateCoach.coachId,
        email: result.email,
        appwriteProvisioned: result.appwriteProvisioned,
        repaired: true,
      });
    } catch (err) {
      return coachErrorResponse(err);
    }
  }

  try {
    const result = await provisionCoachWithAppwrite({
      username,
      password: parsed.data.password,
      displayName: parsed.data.displayName,
      coachId,
    });

    if (result.email !== loginEmail) {
      throw new Error(`E-posta uyuşmazlığı: ${result.email}`);
    }

    const coach = await saveCoachToPlatform({
      coachId,
      username,
      password: parsed.data.password,
      displayName: parsed.data.displayName.trim() || username,
      email: result.email,
      phone: parsed.data.phone,
      specialty: parsed.data.specialty,
      status: parsed.data.status,
    });

    return NextResponse.json({
      ok: true,
      coach,
      coachId,
      email: result.email,
      appwriteProvisioned: result.appwriteProvisioned,
    });
  } catch (err) {
    return coachErrorResponse(err);
  }
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

  try {
    const username = resolveCoachUsername(parsed.data.username);
    const existing = await loadPlatformCoaches().then((list) =>
      list.find((c) => c.coachId === parsed.data.coachId)
    );
    if (!existing) {
      return NextResponse.json({ error: "Koç bulunamadı." }, { status: 404 });
    }

    const password = parsed.data.password?.trim() || existing.password;

    await provisionCoachWithAppwrite({
      username,
      password,
      displayName: parsed.data.displayName,
      coachId: parsed.data.coachId,
    });

    const coach = await updateCoachOnPlatform({
      coachId: parsed.data.coachId,
      displayName: parsed.data.displayName,
      username,
      password: parsed.data.password,
      phone: parsed.data.phone,
      specialty: parsed.data.specialty,
      status: parsed.data.status,
    });
    return NextResponse.json({ ok: true, coach });
  } catch (err) {
    return coachErrorResponse(err);
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

  const coachId = new URL(request.url).searchParams.get("coachId")?.trim();
  if (!coachId) {
    return NextResponse.json({ error: "Koç kimliği gerekli." }, { status: 400 });
  }

  try {
    await deleteCoachFromPlatform(coachId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: String((err as Error)?.message || "Koç silinemedi.") },
      { status: 500 }
    );
  }
}
