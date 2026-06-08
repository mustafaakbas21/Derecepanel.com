import { NextResponse } from "next/server";

import {
  APPWRITE_DATABASE_ID,
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
} from "@/lib/appwrite/config";
import { getAdminDatabases, isAppwriteServerConfigured } from "@/lib/appwrite/server";

/** Appwrite yapılandırma durumu — deploy sonrası kontrol (hassas veri dönmez) */
export async function GET() {
  const configured = isAppwriteServerConfigured();

  if (!configured) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        missing: [
          !APPWRITE_ENDPOINT && "NEXT_PUBLIC_APPWRITE_ENDPOINT",
          !APPWRITE_PROJECT_ID && "NEXT_PUBLIC_APPWRITE_PROJECT_ID",
          !process.env.APPWRITE_API_KEY?.trim() && "APPWRITE_API_KEY",
        ].filter(Boolean),
      },
      { status: 503 }
    );
  }

  try {
    const db = getAdminDatabases();
    await db.get(APPWRITE_DATABASE_ID);
    return NextResponse.json({
      ok: true,
      configured: true,
      endpoint: APPWRITE_ENDPOINT,
      projectId: APPWRITE_PROJECT_ID,
      databaseId: APPWRITE_DATABASE_ID,
      sessionSigning: Boolean(
        process.env.SESSION_SIGNING_SECRET?.trim() || process.env.APPWRITE_API_KEY?.trim()
      ),
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        configured: true,
        error: String((err as Error)?.message || "Appwrite erişim hatası"),
        hint: "API key scope: databases.read, users.read/write, sessions.write, storage",
      },
      { status: 502 }
    );
  }
}
