import type { ExamLayout, ExamLayoutCell, ExamLayoutSection, SinavTipi } from "@/lib/exams/types";

type Block = { sectionTitle: string; count: number; subjectId: string };

function flatFromBlocks(blocks: Block[]): ExamLayoutCell[] {
  const out: ExamLayoutCell[] = [];
  for (const b of blocks) {
    for (let i = 0; i < b.count; i++) {
      out.push({ subjectId: b.subjectId, sectionTitle: b.sectionTitle });
    }
  }
  return out;
}

function tytBlocks(): Block[] {
  return [
    { sectionTitle: "TYT Türkçe", count: 40, subjectId: "tyt-tr" },
    { sectionTitle: "TYT Sosyal Bilimler", count: 5, subjectId: "tyt-tar" },
    { sectionTitle: "TYT Sosyal Bilimler", count: 5, subjectId: "tyt-cog" },
    { sectionTitle: "TYT Sosyal Bilimler", count: 5, subjectId: "tyt-fel" },
    { sectionTitle: "TYT Sosyal Bilimler", count: 5, subjectId: "tyt-din" },
    { sectionTitle: "TYT Temel Matematik", count: 24, subjectId: "tyt-mat" },
    { sectionTitle: "TYT Temel Matematik", count: 16, subjectId: "tyt-geo" },
    { sectionTitle: "TYT Fen Bilimleri", count: 7, subjectId: "tyt-fiz" },
    { sectionTitle: "TYT Fen Bilimleri", count: 7, subjectId: "tyt-kim" },
    { sectionTitle: "TYT Fen Bilimleri", count: 6, subjectId: "tyt-biyo" },
  ];
}

function aytBlocks(): Block[] {
  return [
    { sectionTitle: "AYT Matematik", count: 30, subjectId: "ayt-mat" },
    { sectionTitle: "AYT Matematik", count: 10, subjectId: "ayt-geo" },
    { sectionTitle: "AYT Fen Bilimleri — Fizik", count: 14, subjectId: "ayt-fiz" },
    { sectionTitle: "AYT Fen Bilimleri — Kimya", count: 13, subjectId: "ayt-kim" },
    { sectionTitle: "AYT Fen Bilimleri — Biyoloji", count: 13, subjectId: "ayt-biyo" },
    {
      sectionTitle: "AYT Türk Dili ve Edebiyatı – Sosyal Bilimler-1 — Edebiyat",
      count: 24,
      subjectId: "ayt-edeb",
    },
    {
      sectionTitle: "AYT Türk Dili ve Edebiyatı – Sosyal Bilimler-1 — Tarih-1",
      count: 10,
      subjectId: "ayt-tar1",
    },
    {
      sectionTitle: "AYT Türk Dili ve Edebiyatı – Sosyal Bilimler-1 — Coğrafya-1",
      count: 6,
      subjectId: "ayt-cog1",
    },
    { sectionTitle: "AYT Sosyal Bilimler-2 — Tarih-2", count: 11, subjectId: "ayt-tar2" },
    { sectionTitle: "AYT Sosyal Bilimler-2 — Coğrafya-2", count: 11, subjectId: "ayt-cog2" },
    { sectionTitle: "AYT Sosyal Bilimler-2 — Felsefe Grubu", count: 12, subjectId: "ayt-fel-grup" },
    {
      sectionTitle: "AYT Sosyal Bilimler-2 — Din Kültürü ve Ahlak Bilgisi",
      count: 6,
      subjectId: "ayt-din",
    },
  ];
}

function ydtBlocks(): Block[] {
  return [{ sectionTitle: "Yabancı Dil (İngilizce vb.)", count: 80, subjectId: "ydt" }];
}

/** ÖSYM uyumlu soru blokları — TYT 120 | AYT 160 | YDT 80 */
export function getExamLayout(sinav: SinavTipi): ExamLayout {
  const blocks =
    sinav === "AYT" ? aytBlocks() : sinav === "YDT" ? ydtBlocks() : tytBlocks();
  const byIndex = flatFromBlocks(blocks);
  const sections: ExamLayoutSection[] = [];
  let q = 1;
  for (const b of blocks) {
    const last = sections.length ? sections[sections.length - 1] : null;
    if (!last || last.title !== b.sectionTitle) {
      sections.push({ title: b.sectionTitle, startQ: q, endQ: q + b.count - 1 });
    } else {
      last.endQ = q + b.count - 1;
    }
    q += b.count;
  }
  return { n: byIndex.length, sections, byIndex };
}

export function getExamQuestionCount(sinav: SinavTipi): number {
  return getExamLayout(sinav).n;
}
