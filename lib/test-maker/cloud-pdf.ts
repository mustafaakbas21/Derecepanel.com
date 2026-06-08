import {
  HTML2CANVAS_SAFE_ONCLONE,
  patchDocumentStylesForHtml2Canvas,
} from "@/lib/html-export/html2canvas-onclone";
import { TM_A4_PRINT_CSS } from "@/lib/test-maker/a4-print-css";
import {
  prepareA4CloneForPrint,
  sanitizeA4CloneForExport,
  slugifyPdfName,
} from "@/lib/test-maker/export-sanitize";
import { tmToast } from "@/lib/test-maker/notify";

export type CloudPdfProgress = (message: string) => void;

export async function isCloudPdfConfigured(): Promise<boolean> {
  try {
    const res = await fetch("/api/test-maker/pdf-upload");
    if (!res.ok) return false;
    const data = (await res.json()) as { configured?: boolean };
    return Boolean(data.configured);
  } catch {
    return false;
  }
}

function applyA4FixedSizeToSheets(container: HTMLElement) {
  // Gizli sayfaları (kapaksız / cevap anahtarsız) önce kaldır ki son sayfa
  // tespiti ve trailing boş sayfa engelleme doğru çalışsın.
  container.querySelectorAll<HTMLElement>(".hidden").forEach((el) => el.remove());

  const sheets = Array.from(container.querySelectorAll<HTMLElement>(".tm-a4-sheet"));
  sheets.forEach((sheet, idx) => {
    // Yalnızca A4 boyutunu sabitle; dikey hizalama / flex davranışını EKRAN
    // önizlemesinden (Tailwind sınıfları: kapakta justify-between, soru
    // sayfasında flex-1 grid) gelmesi için DOKUNMA. justify-content veya
    // grid flex'ini override etmek kapağı yukarı toplar, footer'ı kaydırır.
    sheet.style.width = "210mm";
    sheet.style.maxWidth = "210mm";
    sheet.style.minHeight = "297mm";
    sheet.style.height = "auto";
    sheet.style.aspectRatio = "auto";
    sheet.style.boxSizing = "border-box";
    sheet.style.overflow = "visible";
    sheet.style.border = "none";
    sheet.style.boxShadow = "none";
    sheet.style.margin = "0 auto";

    // Son görünür sayfada zorunlu sayfa sonu BIRAKMA — aksi halde tarayıcı
    // sonda boş bir A4 daha basar.
    const isLast = idx === sheets.length - 1;
    sheet.style.pageBreakAfter = isLast ? "auto" : "always";
    sheet.style.breakAfter = isLast ? "auto" : "page";
  });

  container
    .querySelectorAll<HTMLElement>(".tm-q-sheet-body, .tm-split-columns, .tm-q-extra-list")
    .forEach((grid) => {
      grid.style.overflow = "visible";
    });
}

function createA4ExportClone(rootId = "tm-a4-page"): HTMLElement | null {
  const a4 = document.getElementById(rootId);
  if (!a4) return null;
  const clone = a4.cloneNode(true) as HTMLElement;
  sanitizeA4CloneForExport(clone);
  applyA4FixedSizeToSheets(clone);
  return clone;
}

function createExportHost(clone: HTMLElement): HTMLElement {
  const host = document.createElement("div");
  host.id = "tm-html2pdf-export-root";
  host.setAttribute("aria-hidden", "true");
  host.style.cssText =
    "position:fixed;left:-16000px;top:0;width:210mm;max-width:210mm;background:#fff;z-index:-1;overflow:visible;";
  const printStyle = document.createElement("style");
  printStyle.textContent = TM_A4_PRINT_CSS;
  host.appendChild(printStyle);
  host.appendChild(clone);
  document.body.appendChild(host);
  return host;
}

const HTML2PDF_OPTS = {
  margin: [10, 10, 10, 10] as [number, number, number, number],
  image: { type: "jpeg" as const, quality: 0.95 },
  html2canvas: {
    scale: 2,
    useCORS: true,
    logging: false,
    scrollY: 0,
    windowWidth: 794,
    backgroundColor: "#ffffff",
    onclone: HTML2CANVAS_SAFE_ONCLONE,
  },
  jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const },
  pagebreak: {
    mode: ["css", "avoid-all"] as const,
    after: ".tm-a4-sheet",
    avoid: [".tm-q-item", "li"],
  },
};

export async function downloadPdfLocal(coverTitle: string): Promise<boolean> {
  const clone = createA4ExportClone();
  if (!clone) return false;

  const html2pdf = (await import("html2pdf.js")).default;
  const fname = slugifyPdfName(coverTitle);
  const host = createExportHost(clone);

  const restoreStyles = patchDocumentStylesForHtml2Canvas();
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
    restoreStyles();
    host.remove();
  }
}

export async function exportTestPdfToCloud(
  coverTitle: string,
  onProgress?: CloudPdfProgress
): Promise<string> {
  const clone = createA4ExportClone();
  if (!clone) throw new Error("A4 sayfası bulunamadı");

  const configured = await isCloudPdfConfigured();
  if (!configured) {
    throw new Error("NOT_CONFIGURED");
  }

  const html2pdf = (await import("html2pdf.js")).default;
  const fname = slugifyPdfName(coverTitle);

  onProgress?.("PDF oluşturuluyor…");

  const host = createExportHost(clone);

  const restoreStyles = patchDocumentStylesForHtml2Canvas();
  try {
    onProgress?.("PDF oluşturuluyor (html2canvas)…");
    const pdfBlob = (await html2pdf()
      .set({ ...HTML2PDF_OPTS, filename: fname })
      .from(host)
      .output("blob")) as Blob;
    if (!(pdfBlob instanceof Blob)) {
      throw new Error("PDF Blob alınamadı");
    }

    onProgress?.("Buluta yükleniyor…");
    const form = new FormData();
    form.append("file", pdfBlob, fname);

    const res = await fetch("/api/test-maker/pdf-upload", {
      method: "POST",
      body: form,
    });
    const data = (await res.json()) as { fileId?: string; error?: string };
    if (!res.ok || !data.fileId) {
      throw new Error(data.error || "Yükleme başarısız");
    }

    if (typeof window !== "undefined") {
      (window as unknown as { __testMakerLastPdfFileId?: string }).__testMakerLastPdfFileId =
        data.fileId;
    }

    return data.fileId;
  } finally {
    restoreStyles();
    host.remove();
  }
}

/** Yerel yazdırma — gelişmiş clone (ESKİ prepareA4CloneForChromePrint) */
export function printA4Local(rootId = "tm-a4-page") {
  const root = document.getElementById(rootId);
  if (!root) return false;
  const clone = root.cloneNode(true) as HTMLElement;
  prepareA4CloneForPrint(clone);
  applyA4FixedSizeToSheets(clone);
  const iframe = document.createElement("iframe");
  iframe.id = "tm-chrome-print-frame";
  iframe.style.cssText =
    "position:fixed;width:0;height:0;border:0;left:0;bottom:0;opacity:0;pointer-events:none;";
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument;
  if (!doc) return false;
  const styles = Array.from(
    document.querySelectorAll('link[rel="stylesheet"], style')
  )
    .map((el) => el.outerHTML)
    .join("");
  doc.open();
  doc.write(
    `<!DOCTYPE html><html><head><meta charset="utf-8">${styles}
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
<style>${TM_A4_PRINT_CSS}</style>
</head><body>${clone.outerHTML}</body></html>`
  );
  doc.close();

  const iwin = iframe.contentWindow;
  const removeFrame = () => {
    iframe.remove();
  };
  try {
    iwin?.addEventListener("afterprint", removeFrame);
  } catch {
    /* ignore */
  }

  const runPrint = () => {
    iwin?.focus();
    iwin?.print();
    setTimeout(removeFrame, 2000);
  };

  if (doc.readyState === "complete") {
    setTimeout(runPrint, 480);
  } else {
    iwin?.addEventListener("load", () => setTimeout(runPrint, 480));
  }
  return true;
}
