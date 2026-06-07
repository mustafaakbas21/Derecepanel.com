import { NextResponse } from "next/server";

import {
  PDF_ENGINE_MAX_BYTES,
  parseExamPdf,
  type PdfParseResult,
} from "@/lib/pdfEngine";
import type { SinavTipi } from "@/lib/exams/types";

export const runtime = "nodejs";

const SINAV_SET = new Set<SinavTipi>(["TYT", "AYT", "YDT"]);

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const sinavRaw = String(form.get("sinav") || "TYT").toUpperCase();

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "PDF dosyası gerekli" }, { status: 400 });
    }

    const sinav = SINAV_SET.has(sinavRaw as SinavTipi) ? (sinavRaw as SinavTipi) : "TYT";

    if (file.size > PDF_ENGINE_MAX_BYTES) {
      return NextResponse.json(
        { error: `PDF en fazla ${Math.round(PDF_ENGINE_MAX_BYTES / (1024 * 1024))} MB olabilir` },
        { status: 413 }
      );
    }

    const mime = file.type || "";
    const name = file instanceof File ? file.name : "upload.pdf";
    if (!/\.pdf$/i.test(name) && mime && !mime.includes("pdf")) {
      return NextResponse.json({ error: "Yalnızca PDF dosyası kabul edilir" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result: PdfParseResult = await parseExamPdf(buffer, sinav);

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "PDF işlenemedi";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
