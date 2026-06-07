/** Konu matrisi yokken gösterilen özet eksenleri — ders adı gibi sunulmaz */

export const DYB_SUMMARY_GAUGE_NAMES = [
  "Doğruluk (D)",
  "Ort. Net (ölçek)",
  "Katılım (%)",
] as const;

export const DYB_RADAR_AXIS_NAMES = ["Doğru %", "Yanlış %", "Boş %", "Net (ölçek)"] as const;

export function isDyBSummaryGaugeName(name: string): boolean {
  const n = String(name || "").trim();
  return (
    DYB_SUMMARY_GAUGE_NAMES.includes(n as (typeof DYB_SUMMARY_GAUGE_NAMES)[number]) ||
    DYB_RADAR_AXIS_NAMES.includes(n as (typeof DYB_RADAR_AXIS_NAMES)[number])
  );
}

export function buildDyBSummaryGauges(opts: {
  correct: number;
  wrong: number;
  blank: number;
  avgNet: number;
  studentCount: number;
  enrollmentTotal: number;
}): { name: string; rate: number }[] {
  const all = opts.correct + opts.wrong + opts.blank;
  const accPct = all ? Math.round((1000 * opts.correct) / all) / 10 : 0;
  const netBar = Math.max(0, Math.min(100, Math.round((100 * opts.avgNet) / 120)));
  const enroll = Math.max(opts.enrollmentTotal || opts.studentCount, 1);
  const partPct = Math.min(
    100,
    Math.round((1000 * opts.studentCount) / enroll) / 10
  );
  return [
    { name: DYB_SUMMARY_GAUGE_NAMES[0], rate: accPct },
    { name: DYB_SUMMARY_GAUGE_NAMES[1], rate: netBar },
    { name: DYB_SUMMARY_GAUGE_NAMES[2], rate: partPct },
  ];
}

export function buildStudentRadarDyBFallback(
  student: { net: number; correct: number; wrong: number; blank: number },
  allStudents: { net: number; correct: number; wrong: number; blank: number }[]
): { subject: string; student: number; class: number; top: number }[] {
  const tot = student.correct + student.wrong + student.blank;
  const classTotals = allStudents.reduce(
    (a, s) => ({
      c: a.c + s.correct,
      w: a.w + s.wrong,
      b: a.b + s.blank,
      n: a.n + 1,
    }),
    { c: 0, w: 0, b: 0, n: 0 }
  );
  const classAll = classTotals.c + classTotals.w + classTotals.b;
  const top = allStudents.reduce(
    (best, s) => (s.net > best.net ? s : best),
    student
  );
  const topTot = top.correct + top.wrong + top.blank;

  const pct = (c: number, w: number, b: number, t: number) => {
    if (!t) return 0;
    return Math.round((1000 * c) / t) / 10;
  };

  const studentRates = [
    pct(student.correct, student.wrong, student.blank, tot),
    pct(student.wrong, student.correct, student.blank, tot),
    pct(student.blank, student.correct, student.wrong, tot),
    Math.max(0, Math.min(100, Math.round((100 * student.net) / 120))),
  ];
  const classRates = [
    pct(classTotals.c, classTotals.w, classTotals.b, classAll),
    pct(classTotals.w, classTotals.c, classTotals.b, classAll),
    pct(classTotals.b, classTotals.c, classTotals.w, classAll),
    classTotals.n
      ? Math.round(
          (100 *
            allStudents.reduce((s, x) => s + x.net, 0) /
            classTotals.n) /
            1.2
        ) / 10
      : 0,
  ];
  const topRates = [
    pct(top.correct, top.wrong, top.blank, topTot),
    pct(top.wrong, top.correct, top.blank, topTot),
    pct(top.blank, top.correct, top.wrong, topTot),
    Math.max(0, Math.min(100, Math.round((100 * top.net) / 120))),
  ];

  return DYB_RADAR_AXIS_NAMES.map((subject, i) => ({
    subject,
    student: studentRates[i]!,
    class: classRates[i]!,
    top: topRates[i]!,
  }));
}
