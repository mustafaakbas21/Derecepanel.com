import { HTML2CANVAS_SAFE_ONCLONE } from "@/lib/html-export/html2canvas-onclone";
import { slugifyPdfName } from "@/lib/test-maker/export-sanitize";
import {
  renderTercihListPrintSheetHtml,
  type TercihListPrintSnapshot,
} from "@/lib/yks-sim/render-tercih-list-print-html";
import { LANDSCAPE_PRINT_CSS as WEEKLY_LANDSCAPE_CSS } from "@/lib/weekly-planner/weekly-print";

const PRINT_ROOT_ID = "tercih-print-root";

const LANDSCAPE_PRINT_CSS = `
@page { size: A4 landscape; margin: 8mm; }
body { margin: 0; background: #fff; font-family: Inter, system-ui, sans-serif; color: #0f172a; }
.tercih-print-sheet { width: 277mm; max-width: 277mm; margin: 0 auto; box-sizing: border-box; }
.tercih-print-header { margin-bottom: 8px; padding-bottom: 8px; border-bottom: 2px solid #0f172a; }
.tercih-print-header h1 { margin: 0; font-size: 16pt; font-weight: 700; letter-spacing: -0.02em; }
.tercih-print-header p { margin: 4px 0 0; font-size: 8.5pt; color: #475569; line-height: 1.45; }
.tercih-print-meta { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-top: 6px; font-size: 8pt; }
.tercih-print-meta span strong { color: #0f172a; }
.tercih-print-table { width: 100%; border-collapse: collapse; font-size: 7.5pt; table-layout: fixed; }
.tercih-print-table thead { display: table-header-group; }
.tercih-print-table th {
  background: #f1f5f9; color: #334155; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.04em; font-size: 6.5pt; padding: 5px 4px; border: 1px solid #cbd5e1;
  text-align: left;
}
.tercih-print-table th.num { text-align: right; }
.tercih-print-table td {
  padding: 4px 4px; border: 1px solid #e2e8f0; vertical-align: top; line-height: 1.35;
  word-wrap: break-word; overflow-wrap: anywhere;
}
.tercih-print-table td.num { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; }
.tercih-print-table tr:nth-child(even) td { background: #f8fafc; }
.tercih-print-table tr.is-target td { background: #ecfdf5 !important; }
.tercih-print-pt {
  display: inline-block; font-size: 6pt; font-weight: 700; padding: 1px 4px;
  border-radius: 3px; background: #e2e8f0; color: #334155;
}
.tercih-print-foot { margin-top: 8px; font-size: 7pt; color: #64748b; text-align: right; }
`;

function collectStylesheets(): string {
  return Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((el) => el.outerHTML)
    .join("");
}

/** TestMaker printA4Local ile aynı iframe yazdırma akışı */
export function printTercihListLocal(rootId = PRINT_ROOT_ID): boolean {
  const root = document.getElementById(rootId);
  if (!root) return false;

  const clone = root.cloneNode(true) as HTMLElement;
  const iframe = document.createElement("iframe");
  iframe.id = "tercih-print-frame";
  iframe.style.cssText =
    "position:fixed;width:0;height:0;border:0;left:0;bottom:0;opacity:0;pointer-events:none;";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) {
    iframe.remove();
    return false;
  }

  doc.open();
  doc.write(
    `<!DOCTYPE html><html><head><meta charset="utf-8">${collectStylesheets()}
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
<style>${LANDSCAPE_PRINT_CSS}</style></head><body>${clone.outerHTML}</body></html>`
  );
  doc.close();
  iframe.contentWindow?.focus();
  iframe.contentWindow?.print();
  setTimeout(() => iframe.remove(), 2000);
  return true;
}

const HTML2PDF_OPTS = {
  margin: [6, 6, 6, 6] as [number, number, number, number],
  image: { type: "jpeg" as const, quality: 0.92 },
  html2canvas: {
    scale: 2,
    useCORS: true,
    logging: false,
    scrollY: 0,
    backgroundColor: "#ffffff",
    onclone: HTML2CANVAS_SAFE_ONCLONE,
  },
  jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "landscape" as const },
  pagebreak: { mode: ["css", "legacy"] as const },
};

export async function downloadTercihListPdf(
  title: string,
  rootId = PRINT_ROOT_ID
): Promise<boolean> {
  const root = document.getElementById(rootId);
  if (!root) return false;

  const host = document.createElement("div");
  host.id = "tercih-html2pdf-host";
  host.setAttribute("aria-hidden", "true");
  host.style.cssText =
    "position:fixed;left:-20000px;top:0;width:277mm;background:#fff;z-index:-1;";
  const clone = root.cloneNode(true) as HTMLElement;
  host.appendChild(clone);
  document.body.appendChild(host);

  const html2pdf = (await import("html2pdf.js")).default;
  const fname = slugifyPdfName(title || "tercih-listesi");

  try {
    const blob = (await html2pdf()
      .set({ ...HTML2PDF_OPTS, filename: fname })
      .from(host)
      .output("blob")) as Blob;
    if (!(blob instanceof Blob)) return false;

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fname;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    return true;
  } finally {
    host.remove();
  }
}

export const TERCIH_PRINT_ROOT_ID = PRINT_ROOT_ID;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const TERCIH_LIST_PRINT_FIT_SCRIPT = `
(function () {
  function fit() {
    var sheet = document.querySelector(".tercih-print-sheet");
    var viewport = document.getElementById("wp-print-viewport");
    if (!sheet || !viewport) return;
    sheet.style.transform = "none";
    var maxW = viewport.clientWidth - 8;
    var maxH = viewport.clientHeight - 8;
    var sw = sheet.offsetWidth;
    var sh = sheet.offsetHeight;
    if (!sw || !sh) return;
    var scale = Math.min(1, maxW / sw, maxH / sh);
    scale = Math.max(scale, 0.72);
    sheet.style.transform = "scale(" + scale + ")";
    sheet.style.transformOrigin = "top center";
  }
  window.addEventListener("load", function () { fit(); setTimeout(fit, 80); });
  window.addEventListener("resize", fit);
  window.addEventListener("beforeprint", function () {
    var sheet = document.querySelector(".tercih-print-sheet");
    if (sheet) sheet.style.transform = "none";
  });
  window.addEventListener("afterprint", fit);
})();
`;

/** Haftalık program ile aynı blob önizleme penceresi */
export function buildTercihListPrintWindowHtml(
  sheetHtml: string,
  documentTitle: string
): string {
  const title = escapeHtml(documentTitle || "Tercih listesi");
  const combinedCss = `${LANDSCAPE_PRINT_CSS}\n${WEEKLY_LANDSCAPE_CSS}
.tercih-print-table td.rank { font-weight: 800; color: #0f172a; background: #f1f5f9; }
`;
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
  <style>${combinedCss}</style>
</head>
<body>
  <div class="wp-preview-toolbar">
    <button type="button" class="primary" onclick="window.print()">Yazdır</button>
    <button type="button" class="ghost" onclick="window.close()">Kapat</button>
    <span class="hint">A4 yatay · PDF için yazdır → «PDF olarak kaydet»</span>
  </div>
  <div id="wp-print-viewport" class="wp-print-viewport">
    ${sheetHtml}
  </div>
  <script>${TERCIH_LIST_PRINT_FIT_SCRIPT}<\/script>
</body>
</html>`;
}

export function openPrintWindowWithHtml(html: string): boolean {
  if (typeof window === "undefined") return false;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const printWin = window.open(url, "_blank", "width=1200,height=820");
  if (!printWin) {
    URL.revokeObjectURL(url);
    return false;
  }
  printWin.addEventListener(
    "load",
    () => {
      printWin.focus();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    },
    { once: true }
  );
  return true;
}

export function openTercihListPrintPreview(
  snapshot: TercihListPrintSnapshot,
  documentTitle = "Tercih listesi"
): boolean {
  const sheetHtml = renderTercihListPrintSheetHtml(snapshot);
  const html = buildTercihListPrintWindowHtml(sheetHtml, documentTitle);
  return openPrintWindowWithHtml(html);
}
