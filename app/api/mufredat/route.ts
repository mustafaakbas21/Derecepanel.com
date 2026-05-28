import { NextResponse } from "next/server";

import {
  getDerslerByTrack,
  getSubjects,
  getTopics,
} from "@/lib/mufredat";
import type { MufredatTrack } from "@/lib/mufredat/types";

function parseTrack(raw: string | null): MufredatTrack | "ALL" | null {
  if (!raw || raw === "all") return "ALL";
  if (raw === "TYT" || raw === "AYT") return raw;
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const track = parseTrack(searchParams.get("track"));
  const dersId = searchParams.get("dersId")?.trim();

  if (!track) {
    return NextResponse.json(
      { error: "track: TYT, AYT veya all" },
      { status: 400 }
    );
  }

  if (dersId) {
    return NextResponse.json({
      dersId,
      topics: getTopics(dersId),
    });
  }

  return NextResponse.json({
    track,
    subjects: getSubjects(track),
    dersler: getDerslerByTrack(track),
  });
}
