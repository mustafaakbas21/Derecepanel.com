import {
  flattenModernColorsInClone,
  HTML2CANVAS_SAFE_ONCLONE,
} from "@/lib/html-export/html2canvas-onclone";

export type IframeHtml2PdfOptions = {
  filename: string;
  margin?: number | number[];
  html2canvas?: Record<string, unknown>;
  jsPDF?: Record<string, unknown>;
};

/**
 * Tam HTML belgesini ana uygulama stillerinden izole iframe'de PDF'e çevirir.
 * (html2canvas lab()/oklch() hatasını önler)
 */
export async function downloadPdfFromHtmlDocument(
  html: string,
  options: IframeHtml2PdfOptions
): Promise<void> {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.title = "PDF export";
  iframe.style.cssText =
    "position:fixed;left:-12000px;top:0;width:210mm;height:297mm;border:0;visibility:hidden;";

  document.body.appendChild(iframe);

  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error("Karne PDF zaman aşımı"));
    }, 60000);
    iframe.onload = () => {
      window.clearTimeout(timer);
      resolve();
    };
    iframe.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error("Karne içeriği yüklenemedi"));
    };
    iframe.srcdoc = html;
  });

  const doc = iframe.contentDocument;
  if (!doc?.body) {
    iframe.remove();
    throw new Error("Karne gövdesi bulunamadı");
  }

  await new Promise((r) => requestAnimationFrame(() => r(undefined)));
  if (doc.fonts?.ready) await doc.fonts.ready;
  flattenModernColorsInClone(doc);

  try {
    const html2pdf = (await import("html2pdf.js")).default;
    const margin = options.margin ?? 8;
    await html2pdf()
      .set({
        margin: margin as number | [number, number] | [number, number, number, number],
        filename: options.filename,
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          onclone: HTML2CANVAS_SAFE_ONCLONE,
          ...options.html2canvas,
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait",
          ...options.jsPDF,
        },
      })
      .from(doc.body)
      .save();
  } finally {
    iframe.remove();
  }
}
