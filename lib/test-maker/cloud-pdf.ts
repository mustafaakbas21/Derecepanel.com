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

export async function exportTestPdfToCloud(
  coverTitle: string,
  onProgress?: CloudPdfProgress
): Promise<string> {
  const a4 = document.getElementById("tm-a4-page");
  if (!a4) throw new Error("A4 sayfası bulunamadı");

  const configured = await isCloudPdfConfigured();
  if (!configured) {
    throw new Error("NOT_CONFIGURED");
  }

  const html2pdf = (await import("html2pdf.js")).default;
  const fname = slugifyPdfName(coverTitle);

  onProgress?.("PDF oluşturuluyor…");

  const clone = a4.cloneNode(true) as HTMLElement;
  sanitizeA4CloneForExport(clone);

  const host = document.createElement("div");
  host.id = "tm-html2pdf-export-root";
  host.setAttribute("aria-hidden", "true");
  host.style.cssText =
    "position:fixed;left:-16000px;top:0;width:210mm;max-width:210mm;background:#fff;z-index:-1;overflow:visible;";
  host.appendChild(clone);
  document.body.appendChild(host);

  const opt = {
    margin: [0, 0, 0, 0] as [number, number, number, number],
    filename: fname,
    image: { type: "jpeg" as const, quality: 0.95 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      scrollY: 0,
      backgroundColor: "#ffffff",
    },
    jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const },
    pagebreak: { mode: ["avoid-all", "css", "legacy"] as const },
  };

  try {
    onProgress?.("PDF oluşturuluyor (html2canvas)…");
    const pdfBlob = (await html2pdf().set(opt).from(host).output("blob")) as Blob;
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
    host.remove();
  }
}

/** Yerel yazdırma — gelişmiş clone (ESKİ prepareA4CloneForChromePrint) */
export function printA4Local(rootId = "tm-a4-page") {
  const root = document.getElementById(rootId);
  if (!root) return false;
  const clone = root.cloneNode(true) as HTMLElement;
  prepareA4CloneForPrint(clone);
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
<style>@page{size:A4 portrait;margin:0}body{margin:0;background:#fff}</style>
</head><body>${clone.outerHTML}</body></html>`
  );
  doc.close();
  iframe.contentWindow?.focus();
  iframe.contentWindow?.print();
  setTimeout(() => iframe.remove(), 1500);
  return true;
}
