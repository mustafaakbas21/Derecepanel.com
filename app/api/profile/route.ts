import { NextResponse } from "next/server";

import {
  getProfileForSession,
  updateCoachProfile,
  updateStudentProfile,
} from "@/lib/appwrite/profile-server";
import { getServerAuthSession } from "@/lib/auth/session-server";

export async function GET() {
  try {
    const session = await getServerAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
    }
    if (session.role !== "coach" && session.role !== "student" && session.role !== "admin") {
      return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
    }
    const profile = await getProfileForSession(session);
    return NextResponse.json({ profile });
  } catch (err) {
    return NextResponse.json(
      { error: String((err as Error).message || "Profil yüklenemedi.") },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    if (session.role === "student") {
      const profile = await updateStudentProfile(session, body);
      return NextResponse.json({ profile, ok: true });
    }

    if (session.role === "coach" || session.role === "admin") {
      const profile = await updateCoachProfile(session, {
        displayName: body.displayName !== undefined ? String(body.displayName) : undefined,
        username: body.username !== undefined ? String(body.username) : undefined,
        phone: body.phone !== undefined ? String(body.phone) : undefined,
        specialty: body.specialty !== undefined ? String(body.specialty) : undefined,
        currentPassword:
          body.currentPassword !== undefined ? String(body.currentPassword) : undefined,
        newPassword: body.newPassword !== undefined ? String(body.newPassword) : undefined,
      });
      return NextResponse.json({ profile, ok: true, reloginSuggested: Boolean(body.username || body.newPassword) });
    }

    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  } catch (err) {
    const msg = String((err as Error).message || "Güncelleme başarısız.");
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
