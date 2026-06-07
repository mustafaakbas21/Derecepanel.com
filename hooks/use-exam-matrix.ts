"use client";

import { useCallback, useMemo, useState } from "react";

import { getExamLayout } from "@/lib/exams/exam-layout";
import { hydrateExamMatrixForEdit } from "@/lib/exams/storage/exam-matrix-hydrate";
import { encodeKonuCell, decodeKonuCell } from "@/lib/exams/konu-cell";
import type { KurumDeneme, SinavTipi } from "@/lib/exams/types";

export type MatrixState = {
  n: number;
  cevaplar: string[];
  zorluk: string[];
  konu: string[];
  konuYazi: string[];
};

function pad<T>(arr: T[] | undefined, len: number, fill: T): T[] {
  const out = [...(arr || [])];
  while (out.length < len) out.push(fill);
  return out.slice(0, len);
}

export function createEmptyMatrix(sinav: SinavTipi): MatrixState {
  const n = getExamLayout(sinav).n;
  return {
    n,
    cevaplar: Array(n).fill(""),
    zorluk: Array(n).fill("2"),
    konu: Array(n).fill(""),
    konuYazi: Array(n).fill(""),
  };
}

export function matrixFromExam(exam: KurumDeneme): MatrixState {
  const n = exam.soruSayisi || getExamLayout(exam.sinav).n;
  return {
    n,
    cevaplar: pad(exam.cevaplar, n, ""),
    zorluk: pad(exam.zorluk, n, "2"),
    konu: pad(exam.konu, n, ""),
    konuYazi: pad(exam.konuYazi, n, ""),
  };
}

export function layoutHintFor(sinav: SinavTipi): string {
  const map: Record<SinavTipi, string> = {
    TYT: "TYT: 120 soru (ÖSYM)",
    AYT: "AYT: 160 soru (tam alan, ÖSYM)",
    YDT: "YDT: 80 soru (ÖSYM)",
  };
  return (
    (map[sinav] || "") +
    ". Sorular ders bloklarına ayrılmıştır; konu ve kavram listeleri yalnızca o satırın branşından gelir."
  );
}

export function useExamMatrix(initialSinav: SinavTipi = "TYT") {
  const [sinav, setSinav] = useState<SinavTipi>(initialSinav);
  const [matrix, setMatrix] = useState<MatrixState>(() => createEmptyMatrix(initialSinav));

  const layout = useMemo(() => getExamLayout(sinav), [sinav]);

  const rebuildForSinav = useCallback((next: SinavTipi) => {
    setSinav(next);
    setMatrix(createEmptyMatrix(next));
  }, []);

  const loadFromExam = useCallback((exam: KurumDeneme) => {
    const hydrated = hydrateExamMatrixForEdit(exam);
    setSinav(hydrated.sinav);
    setMatrix(matrixFromExam(hydrated));
  }, []);

  const resetEmpty = useCallback((s: SinavTipi = "TYT") => {
    setSinav(s);
    setMatrix(createEmptyMatrix(s));
  }, []);

  const applyBulkKey = useCallback((raw: string) => {
    const letters = String(raw || "")
      .toUpperCase()
      .replace(/[^ABCDE]/g, "");
    setMatrix((m) => {
      const cevaplar = [...m.cevaplar];
      for (let i = 0; i < m.n && i < letters.length; i++) {
        cevaplar[i] = letters.charAt(i);
      }
      return { ...m, cevaplar };
    });
  }, []);

  const updateRow = useCallback(
    (qi: number, data: {
      cevap?: string;
      zorluk?: string;
      topicId?: string;
      conceptId?: string;
      subjectId: string;
      konuYazi?: string;
    }) => {
      setMatrix((m) => {
        if (qi < 0 || qi >= m.n) return m;
        const cevaplar = [...m.cevaplar];
        const zorluk = [...m.zorluk];
        const konu = [...m.konu];
        const konuYazi = [...m.konuYazi];
        if (data.cevap !== undefined) cevaplar[qi] = data.cevap;
        if (data.zorluk !== undefined) zorluk[qi] = data.zorluk;
        if (data.topicId !== undefined || data.conceptId !== undefined) {
          konu[qi] = encodeKonuCell({
            subjectId: data.subjectId,
            topicId: data.topicId,
            conceptId: data.conceptId,
          });
          konuYazi[qi] = data.konuYazi || "";
        }
        return { ...m, cevaplar, zorluk, konu, konuYazi };
      });
    },
    []
  );

  const mergeExcel = useCallback(
    (merged: Pick<MatrixState, "cevaplar" | "zorluk" | "konu" | "konuYazi">) => {
      setMatrix((m) => ({
        ...m,
        cevaplar: [...merged.cevaplar],
        zorluk: [...merged.zorluk],
        konu: [...merged.konu],
        konuYazi: [...merged.konuYazi],
      }));
    },
    []
  );

  const getRowDecoded = useCallback(
    (qi: number) => {
      const cell = matrix.konu[qi] || "";
      return decodeKonuCell(cell);
    },
    [matrix.konu]
  );

  return {
    sinav,
    setSinav,
    matrix,
    layout,
    rebuildForSinav,
    loadFromExam,
    resetEmpty,
    applyBulkKey,
    updateRow,
    mergeExcel,
    getRowDecoded,
    layoutHint: layoutHintFor(sinav),
  };
}
