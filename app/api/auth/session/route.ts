import { NextResponse } from "next/server";

import { getServerAuthSession } from "@/lib/auth/session-server";

export async function GET() {
  try {
    const session = await getServerAuthSession();
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    return NextResponse.json({
      authenticated: true,
      role: session.role,
      userId: session.userId,
      email: session.email,
      username: session.username ?? null,
    });
  } catch (err) {
    console.error("[auth/session]", err);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
