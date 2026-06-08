import { NextResponse } from "next/server";

import { AuthError, requireCoachAuth } from "@/lib/auth/require-coach-server";
import { getExamLayout } from "@/lib/exams/exam-layout";
import type { SinavTipi } from "@/lib/exams/types";
import * as XLSX from "xlsx";

export async function GET(request: Request) {
  try {
    await requireCoachAuth();
    const sinav = (new URL(request.url).searchParams.get("sinav") || "TYT") as SinavTipi;
    const layout = getExamLayout(sinav);
    const rows: string[][] = [
      ["Soru No", "Doğru Cevap", "Konu (ders)", "Kavram", "Zorluk"],
    ];
    for (let i = 1; i <= layout.n; i++) {
      rows.push([String(i), "", "", "", "2"]);
    }
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Matris");
    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
    return new NextResponse(buf, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="kurum-${sinav}-sablon.xlsx"`,
      },
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
