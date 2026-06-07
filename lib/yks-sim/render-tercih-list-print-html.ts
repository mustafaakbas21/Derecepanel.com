import { bursDisplayLabel } from "@/lib/yks-sim/atlas-enrich";
import { bolumDiliLabel } from "@/lib/yks-sim/atlas-program-display";
import { formatAtlasSira, formatAtlasTaban } from "@/lib/format/numbers";
import type { TercihListItem } from "@/lib/yks-sim/tercih-list-storage";

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type TercihListPrintSnapshot = {
  studentName?: string;
  items: TercihListItem[];
  generatedAt?: string;
};

export function renderTercihListPrintSheetHtml(snapshot: TercihListPrintSnapshot): string {
  const generatedAt =
    snapshot.generatedAt ??
    new Date().toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
  const rows = snapshot.items
    .slice()
    .sort((a, b) => a.sira - b.sira)
    .map((item) => {
      const uni = item.universiteDisplay ?? item.universite;
      return `<tr>
        <td class="num rank">${item.sira}</td>
        <td><span class="tercih-print-pt">${esc(item.puanTipi ?? "—")}</span></td>
        <td><strong>${esc(item.bolum)}</strong></td>
        <td>${esc(uni)}</td>
        <td>${esc(item.sehir ?? "—")}</td>
        <td>${esc(bolumDiliLabel((item.bolumDili as "turkce" | "ingilizce") ?? "turkce"))}</td>
        <td>${esc(bursDisplayLabel(item.bursTuru || "Burssuz"))}</td>
        <td class="num">${esc(formatAtlasTaban(item.taban))}</td>
        <td class="num">${esc(formatAtlasSira(item.basari))}</td>
      </tr>`;
    })
    .join("");

  const studentLine = snapshot.studentName
    ? `<span>Öğrenci: <strong>${esc(snapshot.studentName)}</strong></span>`
    : "";

  return `<div class="tercih-print-sheet wp-print-sheet">
    <header class="tercih-print-header wp-print-header">
      <h1>Tercih Listesi</h1>
      <p>DerecePanel · YÖK Atlas · ${esc(generatedAt)}</p>
      <div class="tercih-print-meta">
        <span><strong>${snapshot.items.length}</strong> program</span>
        ${studentLine}
      </div>
    </header>
    <table class="tercih-print-table">
      <thead>
        <tr>
          <th class="num" style="width:5%">Sıra</th>
          <th style="width:6%">Puan</th>
          <th style="width:22%">Bölüm</th>
          <th style="width:24%">Üniversite</th>
          <th style="width:9%">Şehir</th>
          <th style="width:8%">Dil</th>
          <th style="width:10%">Burs</th>
          <th class="num" style="width:8%">Taban</th>
          <th class="num" style="width:8%">Başarı</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <footer class="tercih-print-foot">derecepanel · Tercih Sihirbazı · tercih listesi</footer>
  </div>`;
}
