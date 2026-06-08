import { NextResponse } from "next/server";

import {
  loadAdminPlatformPanelItems,
  saveAdminPlatformPanelKey,
} from "@/lib/admin/platform-panel-server";
import { isAdminPlatformKey } from "@/lib/admin/platform-keys";
import { isBuiltinAdminSession } from "@/lib/auth/builtin-admin";
import {
  deleteBuiltinPanelData,
  listBuiltinPanelData,
  setBuiltinPanelData,
} from "@/lib/auth/builtin-panel-store";
import { getServerAuthSession } from "@/lib/auth/session-server";
import { isAppwriteServerConfigured } from "@/lib/appwrite/server";
import {
  loadBridgedPanelKeys,
  saveBridgedPanelKey,
  isBridgedPanelKey,
} from "@/lib/appwrite/collection-bridge";
import {
  deletePanelDataEntry,
  listPanelDataForOwner,
  setPanelDataEntry,
} from "@/lib/appwrite/panel-data-server";

async function mergeAdminPlatformItems(
  items: Record<string, string>
): Promise<Record<string, string>> {
  try {
    const platform = await loadAdminPlatformPanelItems();
    return { ...items, ...platform };
  } catch {
    return items;
  }
}

export async function GET() {
  const session = await getServerAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  }

  if (isBuiltinAdminSession(session.sessionSecret)) {
    const items = await mergeAdminPlatformItems(listBuiltinPanelData(session.userId));
    return NextResponse.json({ items });
  }

  if (!isAppwriteServerConfigured()) {
    return NextResponse.json({ items: {} });
  }

  try {
    const [panelItems, bridged] = await Promise.all([
      listPanelDataForOwner(session.userId),
      loadBridgedPanelKeys(session.userId),
    ]);
    const items =
      session.role === "admin"
        ? await mergeAdminPlatformItems({ ...panelItems, ...bridged })
        : { ...panelItems, ...bridged };
    return NextResponse.json({ items });
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[panel-store] Appwrite list failed:", err);
      return NextResponse.json({ items: {} });
    }
    return NextResponse.json(
      { error: String((err as Error)?.message || "Veri yüklenemedi.") },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const session = await getServerAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  }

  let body: { key?: string; value?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const key = String(body.key || "").trim();
  if (!key) {
    return NextResponse.json({ error: "Anahtar gerekli." }, { status: 400 });
  }

  const value = String(body.value ?? "");

  if (session.role === "admin" && isAdminPlatformKey(key)) {
    try {
      await saveAdminPlatformPanelKey(key, value);
      return NextResponse.json({ ok: true });
    } catch (err) {
      return NextResponse.json(
        { error: String((err as Error)?.message || "Kayıt başarısız.") },
        { status: 500 }
      );
    }
  }

  if (isBuiltinAdminSession(session.sessionSecret)) {
    setBuiltinPanelData(session.userId, key, value);
    return NextResponse.json({ ok: true });
  }

  if (!isAppwriteServerConfigured()) {
    return NextResponse.json({ error: "Appwrite yapılandırılmadı." }, { status: 503 });
  }

  try {
    await Promise.all([
      setPanelDataEntry(session.userId, key, value),
      isBridgedPanelKey(key)
        ? saveBridgedPanelKey(session.userId, key, value)
        : Promise.resolve(),
    ]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: String((err as Error)?.message || "Kayıt başarısız.") },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getServerAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  }

  let body: { key?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const key = String(body.key || "").trim();
  if (!key) {
    return NextResponse.json({ error: "Anahtar gerekli." }, { status: 400 });
  }

  if (session.role === "admin" && isAdminPlatformKey(key)) {
    try {
      await saveAdminPlatformPanelKey(key, "");
      return NextResponse.json({ ok: true });
    } catch (err) {
      return NextResponse.json(
        { error: String((err as Error)?.message || "Silme başarısız.") },
        { status: 500 }
      );
    }
  }

  if (isBuiltinAdminSession(session.sessionSecret)) {
    deleteBuiltinPanelData(session.userId, key);
    return NextResponse.json({ ok: true });
  }

  if (!isAppwriteServerConfigured()) {
    return NextResponse.json({ error: "Appwrite yapılandırılmadı." }, { status: 503 });
  }

  try {
    await deletePanelDataEntry(session.userId, key);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: String((err as Error)?.message || "Silme başarısız.") },
      { status: 500 }
    );
  }
}
