/**
 * ÖSYM uyumlu soru blokları → YksMufredat subjectId eşlemesi.
 * TYT 120 | AYT 160 (tam alan) | YDT 80
 */
(function () {
  function flatFromBlocks(blocks) {
    var out = [];
    for (var b = 0; b < blocks.length; b++) {
      var B = blocks[b];
      for (var i = 0; i < B.count; i++) {
        out.push({ subjectId: B.subjectId, sectionTitle: B.sectionTitle });
      }
    }
    return out;
  }

  /** TYT toplam 120: TR 40, Sosyal 20, Mat 40, Fen 20 */
  function tytBlocks() {
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

  /**
   * AYT toplam 160 (Sayısal + EA + Sözel tam set — kurum denemesi planlama matrisi).
   * Matematik 40 | Fen 40 | SB-1 40 | SB-2 40
   */
  function aytBlocks() {
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

  function ydtBlocks() {
    return [{ sectionTitle: "Yabancı Dil (İngilizce vb.)", count: 80, subjectId: "ydt" }];
  }

  /**
   * @param {string} sinav TYT|AYT|YDT
   * @returns {{ n: number, sections: { title: string, startQ: number, endQ: number }[], byIndex: { subjectId: string, sectionTitle: string }[] }}
   */
  function getExamLayout(sinav) {
    var blocks;
    if (sinav === "AYT") blocks = aytBlocks();
    else if (sinav === "YDT") blocks = ydtBlocks();
    else blocks = tytBlocks();

    var byIndex = flatFromBlocks(blocks);
    var sections = [];
    var q = 1;
    for (var b = 0; b < blocks.length; b++) {
      var B = blocks[b];
      var last = sections.length ? sections[sections.length - 1] : null;
      if (!last || last.title !== B.sectionTitle) {
        sections.push({ title: B.sectionTitle, startQ: q, endQ: q + B.count - 1 });
      } else {
        last.endQ = q + B.count - 1;
      }
      q += B.count;
    }

    return { n: byIndex.length, sections: sections, byIndex: byIndex };
  }

  function getExamQuestionCount(sinav) {
    return getExamLayout(sinav).n;
  }

  window.getExamLayout = getExamLayout;
  window.getExamQuestionCount = getExamQuestionCount;
})();
