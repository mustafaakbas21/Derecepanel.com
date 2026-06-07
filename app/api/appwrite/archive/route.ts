import { NextResponse } from "next/server";

import {
  archiveDelete,
  archiveGet,
  archiveList,
  archivePut,
  type ArchiveScope,
} from "@/lib/appwrite/archive-server";
import { getServerAuthSession } from "@/lib/auth/session-server";

const SCOPES = new Set<ArchiveScope>([
  "fmt",
  "pdf_deposu",
  "tarama",
  "recete",
  "question_pool",
]);

function parseScope(raw: string | null): ArchiveScope | null {
  const scope = String(raw || "").trim() as ArchiveScope;
  return SCOPES.has(scope) ? scope : null;
}

export async function GET(request: Request) {
  const session = await getServerAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  }

  const url = new URL(request.url);
  const scope = parseScope(url.searchParams.get("scope"));
  if (!scope) {
    return NextResponse.json({ error: "Geçersiz scope" }, { status: 400 });
  }

  const id = url.searchParams.get("id")?.trim();
  const coachId = session.userId;

  try {
    if (id) {
      const item = await archiveGet(coachId, scope, id);
      if (!item) return NextResponse.json({ error: "Kayıt yok" }, { status: 404 });
      return NextResponse.json({ item });
    }

    const items = await archiveList(coachId, scope);
    return NextResponse.json({ items });
  } catch (err) {
    return NextResponse.json(
      { error: String((err as Error)?.message || "Okuma hatası") },
      { status: 502 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  }

  const form = await request.formData();
  const scope = parseScope(String(form.get("scope") || ""));
  const id = String(form.get("id") || "").trim();
  const payload = String(form.get("payload") || "");
  const file = form.get("file");

  if (!scope || !id) {
    return NextResponse.json({ error: "scope ve id gerekli" }, { status: 400 });
  }

  try {
    let fileBuffer: Buffer | undefined;
    let mimeType: string | undefined;
    let filename: string | undefined;

    if (file instanceof Blob) {
      fileBuffer = Buffer.from(await file.arrayBuffer());
      mimeType = file.type || undefined;
      filename = file instanceof File ? file.name : undefined;
    }

    const item = await archivePut({
      coachId: session.userId,
      scope,
      id,
      payload,
      fileBuffer,
      filename,
      mimeType,
    });

    return NextResponse.json({ item });
  } catch (err) {
    return NextResponse.json(
      { error: String((err as Error)?.message || "Kayıt hatası") },
      { status: 502 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getServerAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  }

  const url = new URL(request.url);
  const scope = parseScope(url.searchParams.get("scope"));
  const id = url.searchParams.get("id")?.trim();

  if (!scope || !id) {
    return NextResponse.json({ error: "scope ve id gerekli" }, { status: 400 });
  }

  try {
    await archiveDelete(session.userId, scope, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: String((err as Error)?.message || "Silme hatası") },
      { status: 502 }
    );
  }
}
