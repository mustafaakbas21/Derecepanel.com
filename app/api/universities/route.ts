import { NextResponse } from "next/server";

import {
  getDepartmentsForUniversity,
  getUniversityList,
} from "@/lib/universities/atlas-server";
import type { UniversityDegreeLevel } from "@/lib/universities/types";

function parseLevel(raw: string | null): UniversityDegreeLevel | null {
  if (raw === "lisans" || raw === "onlisans") return raw;
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const level = parseLevel(searchParams.get("level"));
  if (!level) {
    return NextResponse.json(
      { error: "level parametresi gerekli: lisans veya onlisans" },
      { status: 400 }
    );
  }

  const university = searchParams.get("university")?.trim();

  try {
    if (!university) {
      const universities = await getUniversityList(level);
      return NextResponse.json({ level, universities });
    }

    const departments = await getDepartmentsForUniversity(level, university);
    return NextResponse.json({ level, university, departments });
  } catch {
    return NextResponse.json(
      { error: "YÖK Atlas verisi okunamadı" },
      { status: 500 }
    );
  }
}
