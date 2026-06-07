"use client";

import { bursDisplayLabel, type YokAtlasProgramEnriched } from "@/lib/yks-sim/atlas-enrich";
import {
  bolumDiliLabel,
  depremKontenjanLabel,
  formatUniversiteDisplayName,
} from "@/lib/yks-sim/atlas-program-display";
import { basariKey, tabanKey } from "@/lib/yks-sim/atlas-filter";
import { formatAtlasSira, formatAtlasTaban } from "@/lib/format/numbers";
import { TERCIH_PRINT_ROOT_ID } from "@/lib/yks-sim/tercih-print";
import type { YokAtlasProgram } from "@/lib/universities/types";

export type TercihPrintDocumentProps = {
  rows: YokAtlasProgram[];
  year: string;
  filterSummary: string;
  totalFiltered: number;
  truncated?: boolean;
  targetLabel?: string;
  pinnedKodu?: string;
};

export function TercihPrintDocument({
  rows,
  year,
  filterSummary,
  totalFiltered,
  truncated,
  targetLabel,
  pinnedKodu,
}: TercihPrintDocumentProps) {
  const generatedAt = new Date().toLocaleString("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div
      id={TERCIH_PRINT_ROOT_ID}
      className="tercih-print-sheet pointer-events-none fixed -left-[20000px] top-0 z-[-1] bg-white"
      aria-hidden
    >
      <header className="tercih-print-header">
        <h1>Tercih Sihirbazı — Program Listesi</h1>
        <p>DerecePanel · YÖK Atlas lisans · {generatedAt}</p>
        <div className="tercih-print-meta">
          <span>
            <strong>{rows.length.toLocaleString("tr-TR")}</strong>
            {truncated ? ` / ${totalFiltered.toLocaleString("tr-TR")} program (ilk sayfalar)` : ` program`}
          </span>
          {targetLabel ? (
            <span>
              Hedef: <strong>{targetLabel}</strong>
            </span>
          ) : null}
        </div>
        <p style={{ marginTop: 6, fontSize: "7.5pt", color: "#64748b" }}>{filterSummary}</p>
      </header>

      <table className="tercih-print-table">
        <thead>
          <tr>
            <th style={{ width: "4%" }}>Puan</th>
            <th style={{ width: "22%" }}>Bölüm</th>
            <th style={{ width: "24%" }}>Üniversite</th>
            <th style={{ width: "9%" }}>Şehir</th>
            <th style={{ width: "8%" }}>Dil</th>
            <th style={{ width: "11%" }}>Burs</th>
            <th style={{ width: "6%" }}>Dep.</th>
            <th className="num" style={{ width: "8%" }}>
              Taban {year}
            </th>
            <th className="num" style={{ width: "8%" }}>
              Sıra {year}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const enriched = p as YokAtlasProgramEnriched;
            const kod = String(p.Program_Kodu ?? "");
            const isTarget = Boolean(pinnedKodu && kod === pinnedKodu);
            const uni =
              enriched.universiteDisplay ?? formatUniversiteDisplayName(p.Universite ?? "");
            return (
              <tr key={kod || `${p.Bolum}-${uni}`} className={isTarget ? "is-target" : undefined}>
                <td>
                  <span className="tercih-print-pt">{p.Puan_Tipi}</span>
                </td>
                <td>
                  <strong>{p.Bolum}</strong>
                  {isTarget ? (
                    <span style={{ marginLeft: 4, fontSize: "6pt", color: "#047857" }}>★ Hedef</span>
                  ) : null}
                </td>
                <td>{uni}</td>
                <td>{p.Sehir}</td>
                <td>{bolumDiliLabel(enriched.bolumDili ?? "turkce")}</td>
                <td>{bursDisplayLabel(enriched.bursTuru || "Burssuz")}</td>
                <td>{depremKontenjanLabel(p)}</td>
                <td className="num">
                  {formatAtlasTaban(p[tabanKey(year)] ?? p.Taban_Puani_Guncel)}
                </td>
                <td className="num">
                  {formatAtlasSira(p[basariKey(year)] ?? p.Basari_Sirasi_Guncel)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <footer className="tercih-print-foot">
        derecepanel · Tercih Sihirbazı · {year} taban/sıra
        {truncated ? " · Liste uzun olduğu için kısaltıldı" : ""}
      </footer>
    </div>
  );
}
