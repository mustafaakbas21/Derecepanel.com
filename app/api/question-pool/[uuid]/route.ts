import { NextResponse } from "next/server";

import type { AnswerLetter, QuestionPoolItem } from "@/lib/test-maker/types";

const memory = new Map<string, QuestionPoolItem[]>();

function coachKey(req: Request) {
  return req.headers.get("x-coach-id") ?? "demo";
}

function list(req: Request) {
  const key = coachKey(req);
  if (!memory.has(key)) memory.set(key, []);
  return memory.get(key)!;
}

type Ctx = { params: Promise<{ uuid: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const { uuid } = await ctx.params;
  const body = (await req.json()) as { answer?: AnswerLetter | null };
  const items = list(req);
  const item = items.find((x) => x.uuid === uuid);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  item.answer = body.answer ?? null;
  return NextResponse.json({ item });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const { uuid } = await ctx.params;
  const key = coachKey(req);
  const items = list(req).filter((x) => x.uuid !== uuid);
  memory.set(key, items);
  return NextResponse.json({ ok: true });
}
