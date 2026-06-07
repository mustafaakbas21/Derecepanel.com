"use client";

import { Fragment } from "react";

import { getConcepts, getDersById, getTopicOptions } from "@/lib/mufredat";
import type { MatrixState } from "@/hooks/use-exam-matrix";
import type { ExamLayout } from "@/lib/exams/types";

const ZORLUK = [
  { v: "0", l: "Kolay" },
  { v: "1", l: "Orta" },
  { v: "2", l: "Zor" },
  { v: "3", l: "Çok zor" },
];

type Props = {
  matrix: MatrixState;
  layout: ExamLayout;
  onUpdateRow: (
    qi: number,
    data: {
      cevap?: string;
      zorluk?: string;
      topicId?: string;
      conceptId?: string;
      subjectId: string;
      konuYazi?: string;
    }
  ) => void;
  getRowDecoded: (qi: number) => {
    subjectId: string;
    topicId: string;
    conceptId: string;
  };
};

export function ExamMatrixTable({ matrix, layout, onUpdateRow, getRowDecoded }: Props) {
  return (
    <div className="kdy-matrix-wrap kdy-matrix-wrap--table">
      <div className="kdy-matrix-scroll" id="kdy-matrix-scroll">
        <table className="kdy-matrix-table" aria-label="Soru matrisi">
          <thead>
            <tr>
              <th scope="col" className="kdy-mth kdy-mth--no">
                Soru
              </th>
              <th scope="col" className="kdy-mth kdy-mth--cevap">
                Doğru cevap
              </th>
              <th scope="col" className="kdy-mth kdy-mth--konu">
                Konu
              </th>
              <th scope="col" className="kdy-mth kdy-mth--kav">
                Kavram
              </th>
              <th scope="col" className="kdy-mth kdy-mth--zor">
                Zorluk
              </th>
            </tr>
          </thead>
          <tbody id="kdy-matrix-tbody">
            {layout.sections.map((sec) => {
              const nInSec = sec.endQ - sec.startQ + 1;
              return (
                <Fragment key={sec.title}>
                  <tr className="kdy-matrix-sec">
                    <td colSpan={5}>
                      <span className="kdy-matrix-sec__inner">
                        {sec.title}{" "}
                        <span className="kdy-matrix-sec__cnt">({nInSec} Soru)</span>
                      </span>
                    </td>
                  </tr>
                  {Array.from({ length: nInSec }, (_, j) => {
                    const qi = sec.startQ - 1 + j;
                    const cell = layout.byIndex[qi];
                    const subjectId = cell?.subjectId || "";
                    const ders = getDersById(subjectId);
                    const decoded = getRowDecoded(qi);
                    const topics = subjectId ? getTopicOptions(subjectId) : [];
                    const concepts =
                      subjectId && decoded.topicId
                        ? getConcepts(subjectId, decoded.topicId)
                        : [];
                    const z = matrix.zorluk[qi] || "2";
                    const konuYazi = (matrix.konuYazi[qi] || "").trim();
                    const konuSelectValue = decoded.topicId
                      ? decoded.topicId
                      : konuYazi
                        ? "__xlsx__"
                        : "";

                    return (
                      <tr
                        key={qi}
                        className={`kdy-mrow kdy-mrow--z${z}`}
                        data-qindex={qi}
                      >
                        <td className="kdy-mtd kdy-mtd--no">{qi + 1}</td>
                        <td className="kdy-mtd">
                          <select
                            className="kdy-mrow__cevap kdy-input"
                            aria-label="Doğru cevap"
                            value={matrix.cevaplar[qi] || ""}
                            onChange={(e) =>
                              onUpdateRow(qi, { subjectId, cevap: e.target.value })
                            }
                          >
                            <option value="">—</option>
                            {["A", "B", "C", "D", "E"].map((L) => (
                              <option key={L} value={L}>
                                {L}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="kdy-mtd kdy-mtd--stack">
                          <span className="kdy-mrow__subhint" title={ders?.dersAdi}>
                            {ders?.dersAdi || cell?.sectionTitle || ""}
                          </span>
                          <select
                            className="kdy-muf-sel kdy-muf-sel--konu kdy-input"
                            aria-label="Konu"
                            value={konuSelectValue}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val.startsWith("__xlsx__")) return;
                              const tLabel = topics.find((t) => t.id === val)?.label;
                              onUpdateRow(qi, {
                                subjectId,
                                topicId: val,
                                conceptId: "",
                                konuYazi: tLabel
                                  ? `${ders?.dersAdi || ""} — ${tLabel}`
                                  : "",
                              });
                            }}
                          >
                            <option value="">—</option>
                            {topics.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.label}
                              </option>
                            ))}
                            {konuYazi && !decoded.topicId && (
                              <option value="__xlsx__">{konuYazi}</option>
                            )}
                          </select>
                        </td>
                        <td className="kdy-mtd kdy-mtd--stack">
                          <span
                            className="kdy-mrow__subhint kdy-mrow__subhint--spacer"
                            aria-hidden
                          >
                            &nbsp;
                          </span>
                          <select
                            className="kdy-muf-sel kdy-muf-sel--kavram kdy-input"
                            aria-label="Kavram"
                            disabled={!decoded.topicId && !konuYazi}
                            value={decoded.conceptId || ""}
                            onChange={(e) => {
                              const cid = e.target.value;
                              if (cid.startsWith("__xlsx__")) return;
                              const cLabel = concepts.find((c) => c.id === cid)?.name;
                              const tLabel = topics.find((t) => t.id === decoded.topicId)?.label;
                              onUpdateRow(qi, {
                                subjectId,
                                topicId: decoded.topicId,
                                conceptId: cid,
                                konuYazi:
                                  tLabel && cLabel
                                    ? `${ders?.dersAdi || ""} — ${tLabel} (${cLabel})`
                                    : matrix.konuYazi[qi],
                              });
                            }}
                          >
                            <option value="">—</option>
                            {concepts.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="kdy-mtd">
                          <select
                            className={`kdy-mrow__zor kdy-input`}
                            aria-label="Zorluk"
                            value={z}
                            onChange={(e) =>
                              onUpdateRow(qi, { subjectId, zorluk: e.target.value })
                            }
                          >
                            {ZORLUK.map((o) => (
                              <option key={o.v} value={o.v}>
                                {o.l}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
