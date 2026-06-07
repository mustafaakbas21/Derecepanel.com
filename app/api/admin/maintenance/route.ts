import { NextResponse } from "next/server";

import { MAINTENANCE_KEY } from "@/lib/admin/maintenance";
import { getPlatformData, setPlatformData } from "@/lib/admin/platform-store-server";
import { AuthError, requireAdminAuth } from "@/lib/admin/require-admin";

export async function GET() {
  const raw = await getPlatformData(MAINTENANCE_KEY);
  return NextResponse.json({ enabled: raw === "true" });
}

export async function PUT(request: Request) {
  try {
    await requireAdminAuth();
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  let body: { enabled?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const enabled = Boolean(body.enabled);
  await setPlatformData(MAINTENANCE_KEY, enabled ? "true" : "false");
  return NextResponse.json({ ok: true, enabled });
}
