import type { TaramaRecord } from "@/lib/taramalar/types";

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function openTaramaPdfPreviewTab(rec: TaramaRecord): boolean {
  const questions = rec.questions ?? [];
  const title = esc(rec.name || "Tarama");
  const cover = esc(rec.coverTitle || "");
  const rows = questions
    .map((q, i) => {
      const src = q.imageDataUrl ? esc(q.imageDataUrl) : "";
      const ans = q.answer ? esc(String(q.answer)) : "—";
      return `<section class="q"><header>#${i + 1} · Doğru: <b>${ans}</b></header>${
        src
          ? `<div class="imgwrap"><img src="${src}" alt="Soru ${i + 1}" /></div>`
          : "<p>Görsel yok</p>"
      }</section>`;
    })
    .join("");
  const pdfFileId = String(rec.pdf_file_id ?? "").trim();
  const cloudBar = pdfFileId
    ? `<div class="toolbar"><p style="font-size:13px;color:#64748b">Bulut PDF ID: <code>${esc(pdfFileId)}</code> — Test Oluşturucu’dan indirilebilir.</p></div>`
    : `<div class="toolbar" style="font-size:13px;color:#64748b">Bu kayıt için bulut PDF yok. Test Oluşturucu’da <b>PDF → Bulut</b> ile yükleyin.</div>`;
  const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"/><title>${title}</title><style>body{font-family:Inter,system-ui,sans-serif;padding:20px;color:#0f172a;background:#fff;}h1{font-size:1.1rem;margin:0 0 4px;}h2{font-size:.8rem;color:#64748b;font-weight:600;margin:0 0 20px;}section.q{break-inside:avoid;margin-bottom:18px;border:1px solid #e2e8f0;border-radius:12px;padding:12px;}header{font-size:12px;color:#475569;margin-bottom:8px;}.imgwrap img{max-width:100%;height:auto;display:block;}</style></head><body><h1>${title}</h1>${cover ? `<h2>${cover}</h2>` : ""}${cloudBar}${rows}</body></html>`;
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  return true;
}
