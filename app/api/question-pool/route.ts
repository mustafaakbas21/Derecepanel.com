import { NextResponse } from "next/server";

import type { QuestionPoolItem } from "@/lib/test-maker/types";

/** MVP: sunucu tarafı depo yok; istemci localStorage kullanır. API sözleşmesi hazır. */
const memory = new Map<string, QuestionPoolItem[]>();

function coachKey(req: Request) {
  return req.headers.get("x-coach-id") ?? "demo";
}

export async function GET(req: Request) {
  const list = memory.get(coachKey(req)) ?? [];
  return NextResponse.json({ items: list });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { items?: QuestionPoolItem[] };
    const items = body.items ?? [];
    const key = coachKey(req);
    const prev = memory.get(key) ?? [];
    memory.set(key, [...items, ...prev]);
    return NextResponse.json({ ok: true, count: items.length });
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
}
