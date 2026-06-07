import { NextResponse } from "next/server";

/**
 * Faz 1.5 — hatalı soru havuzu API sözleşmesi.
 * MVP: veri tarayıcı localStorage'da; sunucu kalıcı depolama yok.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    storage: "client",
    key: "derece_hatali_soru_havuzu",
    message: "MVP: use lib/hata-recetesi/storage on client",
  });
}

export async function POST() {
  return NextResponse.json(
    { ok: false, error: "Not implemented — use client localStorage" },
    { status: 501 }
  );
}
