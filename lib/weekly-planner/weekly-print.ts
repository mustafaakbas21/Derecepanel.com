export const WEEKLY_PRINT_ROOT_ID = "weekly-planner-print-root";

/** Yazdırma ve önizleme penceresi — Tailwind bu sınıfları yüklemez */
export const LANDSCAPE_PRINT_CSS = `
@page { size: A4 landscape; margin: 6mm; }

html {
  box-sizing: border-box;
}

*, *::before, *::after {
  box-sizing: inherit;
}

body {
  margin: 0;
  font-family: Inter, system-ui, sans-serif;
  color: #0f172a;
  background: #e2e8f0;
}

.wp-preview-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.75rem;
  padding: 0.65rem 1rem;
  background: #0f172a;
  color: #f8fafc;
  border-bottom: 1px solid #1e293b;
}

.wp-preview-toolbar button {
  border: 0;
  border-radius: 0.5rem;
  padding: 0.45rem 0.85rem;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
}

.wp-preview-toolbar button.primary {
  background: #fff;
  color: #0f172a;
}

.wp-preview-toolbar button.ghost {
  background: transparent;
  color: #e2e8f0;
  border: 1px solid #475569;
}

.wp-preview-toolbar .hint {
  margin-left: auto;
  font-size: 0.75rem;
  color: #94a3b8;
}

.wp-print-viewport {
  width: 100vw;
  height: calc(100vh - 49px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow: hidden;
  padding: 12px;
}

.wp-print-sheet {
  width: 285mm;
  max-width: 285mm;
  min-height: 198mm;
  margin: 0 auto;
  background: #fff;
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.18);
  display: flex;
  flex-direction: column;
  overflow: visible;
  transform-origin: top center;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.wp-print-header {
  flex-shrink: 0;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 2px solid #0f172a;
}

.wp-print-header h1 {
  margin: 0;
  font-size: 16pt;
  font-weight: 800;
  line-height: 1.2;
  color: #0f172a;
}

.wp-print-header p {
  margin: 4px 0 0;
  font-size: 10pt;
  font-weight: 500;
  color: #1e293b;
  line-height: 1.35;
}

.wp-print-meta {
  margin-top: 4px;
  font-size: 9pt;
  font-weight: 500;
  color: #334155;
}

.wp-print-main {
  flex: 1 1 auto;
  min-height: 88mm;
  display: flex;
  flex-direction: column;
  overflow: visible;
}

.wp-print-grid {
  width: 100%;
  height: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.wp-print-grid th {
  background: #0f172a;
  color: #fff;
  font-size: 8.5pt;
  font-weight: 700;
  padding: 6px 4px;
  border: 1px solid #0f172a;
  text-align: center;
  vertical-align: middle;
}

.wp-print-grid th .wp-day-date {
  display: block;
  font-weight: 600;
  font-size: 8pt;
  margin-top: 2px;
  color: #e2e8f0;
}

.wp-print-grid th .wp-load {
  display: block;
  font-size: 7.5pt;
  font-weight: 600;
  margin-top: 3px;
  color: #f8fafc;
}

.wp-print-grid tbody tr {
  height: 88mm;
}

.wp-print-grid td {
  border: 1px solid #94a3b8;
  vertical-align: top;
  padding: 5px;
  height: 88mm;
  background: #fafaf9;
  overflow: visible;
}

.wp-print-task {
  margin-bottom: 5px;
  padding: 5px 6px;
  background: #fff;
  border: 1px solid #cbd5e1;
  border-left: 4px solid #64748b;
  border-radius: 4px;
  font-size: 8pt;
  line-height: 1.4;
  page-break-inside: avoid;
}

.wp-print-task.accent-math { border-left-color: #f97316; }
.wp-print-task.accent-turkish { border-left-color: #10b981; }
.wp-print-task.accent-science { border-left-color: #0ea5e9; }

.wp-print-task-title {
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 3px;
  line-height: 1.3;
  word-break: break-word;
}

.wp-print-task-meta {
  color: #334155;
  font-size: 7.5pt;
  font-weight: 500;
  line-height: 1.35;
  word-break: break-word;
}

.wp-print-empty {
  color: #64748b;
  font-size: 8pt;
  font-style: italic;
  text-align: center;
  padding: 8px 4px;
}

.wp-print-detail-wrap {
  flex-shrink: 0;
  margin-top: 8px;
  overflow: visible;
}

.wp-print-detail-title {
  font-size: 10pt;
  font-weight: 800;
  margin: 0 0 5px;
  color: #0f172a;
}

.wp-print-detail {
  width: 100%;
  border-collapse: collapse;
  font-size: 8.5pt;
  table-layout: fixed;
}

.wp-print-detail th {
  background: #e2e8f0;
  border: 1px solid #94a3b8;
  padding: 5px 6px;
  text-align: left;
  font-size: 8pt;
  font-weight: 700;
  color: #0f172a;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.wp-print-detail td {
  border: 1px solid #cbd5e1;
  padding: 5px 6px;
  vertical-align: top;
  color: #0f172a;
  line-height: 1.35;
  word-break: break-word;
}

.wp-print-detail-day-sub {
  display: block;
  margin-top: 2px;
  font-size: 7.5pt;
  font-weight: 500;
  color: #475569;
}

.wp-print-detail tr:nth-child(even) td {
  background: #f8fafc;
}

.wp-print-foot {
  flex-shrink: 0;
  margin-top: 6px;
  font-size: 8pt;
  font-weight: 500;
  color: #475569;
  text-align: right;
}

@media print {
  .wp-preview-toolbar {
    display: none !important;
  }

  html, body {
    width: auto;
    height: auto;
    overflow: visible;
    background: #fff;
  }

  .wp-print-viewport {
    width: auto;
    height: auto;
    overflow: visible;
    padding: 0;
    display: block;
  }

  .wp-print-sheet {
    width: 100% !important;
    max-width: none !important;
    height: auto !important;
    max-height: none !important;
    box-shadow: none !important;
    transform: none !important;
    overflow: visible !important;
  }

  .wp-print-main {
    overflow: visible;
  }

  .wp-print-grid td {
    overflow: visible;
  }

  .wp-print-detail-wrap {
    max-height: none;
    overflow: visible;
  }
}
`;

const PRINT_FIT_SCRIPT = `
(function () {
  function fit() {
    var sheet = document.querySelector(".wp-print-sheet");
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
  window.addEventListener("load", function () {
    fit();
    setTimeout(fit, 80);
  });
  window.addEventListener("resize", fit);
  window.addEventListener("beforeprint", function () {
    var sheet = document.querySelector(".wp-print-sheet");
    if (sheet) sheet.style.transform = "none";
  });
  window.addEventListener("afterprint", fit);
})();
`;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildWeeklyPrintWindowHtml(sheetHtml: string, documentTitle: string): string {
  const title = escapeHtml(documentTitle || "Haftalık program");
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
  <style>${LANDSCAPE_PRINT_CSS}</style>
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
  <script>${PRINT_FIT_SCRIPT}<\/script>
</body>
</html>`;
}

/** Blob URL ile yeni sekme — noopener + document.write beyaz sayfa sorununu önler */
export function openPrintWindowWithHtml(html: string): boolean {
  if (typeof window === "undefined") return false;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const printWin = window.open(url, "_blank", "width=1100,height=780");
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

/** Snapshot HTML ile önizleme penceresi */
export function openWeeklyPlannerPrintPreview(
  sheetHtml: string,
  documentTitle = "Haftalık program"
): boolean {
  const html = buildWeeklyPrintWindowHtml(sheetHtml, documentTitle);
  return openPrintWindowWithHtml(html);
}

/** DOM öğesinden (yedek) */
export function openWeeklyPlannerPrintWindow(
  rootId = WEEKLY_PRINT_ROOT_ID,
  documentTitle = "Haftalık program"
): boolean {
  if (typeof window === "undefined") return false;
  const root = document.getElementById(rootId);
  if (!root) return false;

  const clone = root.cloneNode(true) as HTMLElement;
  clone.removeAttribute("id");
  clone.removeAttribute("aria-hidden");
  clone.className = "wp-print-sheet";
  clone.style.cssText =
    "width:285mm;max-width:285mm;min-height:198mm;opacity:1;position:relative;left:auto;top:auto;pointer-events:auto;";

  return openWeeklyPlannerPrintPreview(clone.outerHTML, documentTitle);
}

export function printWeeklyPlannerLocal(rootId = WEEKLY_PRINT_ROOT_ID): boolean {
  return openWeeklyPlannerPrintWindow(rootId);
}
