/**
 * Tek öğrenci karne HTML + PDF (html2pdf) — Sonuç Merkezi ile aynı üretim ağacı.
 * tools/extract-karne-api.mjs ile basit-deneme-sonuclari.html'den üretilir.
 */
(function () {
  "use strict";

  var allExams = [];

  function refreshExams() {
    allExams = loadMergedExams();
  }

  function readArray(key, altKey) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw && altKey) raw = localStorage.getItem(altKey);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function readExamResults() {
    try {
      var raw = localStorage.getItem("examResults");
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function getKurumAdi() {
    try {
      var keys = ["derecepanel_kurum_adi", "kurumAdi", "tm-brief-kurum", "kurum_adi"];
      for (var i = 0; i < keys.length; i++) {
        var v = localStorage.getItem(keys[i]);
        if (v && String(v).trim()) return String(v).trim();
      }
    } catch (e) {}
    var t = document.querySelector(".sidebar__title");
    return t && t.textContent ? t.textContent.trim() : "Kurum";
  }

  function examSortKey(ex) {
    var d = ex.date || ex.examDate || ex.tarih || ex.scheduledAt || "";
    var t = Date.parse(String(d));
    return isNaN(t) ? 0 : t;
  }

  function formatTrDate(d) {
    if (!d || String(d).length < 10) return d || "—";
    var p = String(d).split("-");
    if (p.length < 3) return d;
    return p[2] + "." + p[1] + "." + p[0];
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalizeExamRow(x, isGlobal) {
    var k = Object.assign({}, x, { isGlobal: !!isGlobal });
    if (!k.sinav && k.tur) k.sinav = k.tur;
    if (!k.name && k.ad) k.name = k.ad;
    if (!k.title && k.ad) k.title = k.ad;
    if (!Array.isArray(k.konu)) k.konu = [];
    if (!Array.isArray(k.konuYazi)) k.konuYazi = [];
    if (!Array.isArray(k.cevaplar)) k.cevaplar = [];
    return k;
  }

  var html2pdfLoadPromise = null;

  function ensureHtml2pdfLoaded() {
    var h2p =
      typeof window.html2pdf === "function"
        ? window.html2pdf
        : window.html2pdf && typeof window.html2pdf.default === "function"
          ? window.html2pdf.default
          : null;
    if (h2p) return Promise.resolve(h2p);
    if (html2pdfLoadPromise) return html2pdfLoadPromise;
    html2pdfLoadPromise = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src =
        "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      s.crossOrigin = "anonymous";
      s.referrerPolicy = "no-referrer";
      s.onload = function () {
        var lib =
          typeof window.html2pdf === "function"
            ? window.html2pdf
            : window.html2pdf && typeof window.html2pdf.default === "function"
              ? window.html2pdf.default
              : null;
        if (lib) resolve(lib);
        else reject(new Error("html2pdf load failed"));
      };
      s.onerror = function () {
        reject(new Error("html2pdf script error"));
      };
      document.head.appendChild(s);
    });
    return html2pdfLoadPromise;
  }

  function loadMergedExams() {
    var kurumsal = readArray("kurumsalExams", "kurum_denemeler_v1").map(function (x) {
      return normalizeExamRow(x, false);
    });
    var global = readArray("globalExams", "global_denemeler_v1").map(function (x) {
      return normalizeExamRow(x, true);
    });
    var seen = {};
    var out = [];
    kurumsal.forEach(function (e) {
      if (!e || !e.id || seen[e.id]) return;
      seen[e.id] = true;
      out.push(e);
    });
    global.forEach(function (e) {
      if (!e || !e.id || seen[e.id]) return;
      seen[e.id] = true;
      out.push(e);
    });
    out.sort(function (a, b) {
      return examSortKey(b) - examSortKey(a);
    });
    return out;
  }

  function findExamById(id) {
    for (var i = 0; i < allExams.length; i++) {
      if (allExams[i] && String(allExams[i].id) === String(id)) return allExams[i];
    }
    return null;
  }

  function normalizeLetter(c) {
    var u = String(c || "").toUpperCase().replace(/[^A-E]/g, "");
    return u.charAt(0) || "";
  }

  function buildKeyString(exam, n) {
    var arr = (exam && exam.cevaplar) || [];
    var s = "";
    for (var i = 0; i < n; i++) {
      var L = normalizeLetter(arr[i]);
      s += L || " ";
    }
    return s.length >= n ? s.slice(0, n) : s.padEnd(n, " ");
  }

  function buildStudentAnswers(rec, n) {
    var raw = String((rec && rec.answers) || "").toUpperCase().replace(/[^A-E]/g, "");
    while (raw.length < n) raw += " ";
    return raw.slice(0, n);
  }

  function countDyn(ans, key, i0, i1Ex) {
    var d = 0,
      y = 0,
      n = 0;
    for (var i = i0; i < i1Ex; i++) {
      var k = key.charAt(i);
      var a = ans.charAt(i);
      if (!k || k === " ") {
        n++;
        continue;
      }
      if (!a || a === " ") n++;
      else if (a === k) d++;
      else y++;
    }
    return { d: d, y: y, n: n };
  }

  function formatDyn(t) {
    return t.d + "/" + t.y + "/" + t.n;
  }

  /** Kurum sıralı liste: "D-Y-Net" (YKS: Net = D - Y/4). Ondalık varsa 2 hane. */
  function formatDynHyphen(t) {
    var d = Number(t && t.d) || 0;
    var y = Number(t && t.y) || 0;
    var netRaw = d - y / 4;
    if (!Number.isFinite(netRaw)) netRaw = 0;
    var net = Math.round(netRaw * 100) / 100;
    var netStr = Math.abs(net - Math.round(net)) > 1e-6 ? net.toFixed(2) : String(Math.round(net));
    return d + "-" + y + "-" + netStr;
  }

  function turkcePredicate(sinav, cell) {
    if (sinav === "AYT") {
      return /^(ayt-edeb|ayt-tar1|ayt-cog1)/.test(cell.subjectId || "");
    }
    if (sinav === "YDT") return true;
    return (cell.subjectId || "") === "tyt-tr";
  }

  function matPredicate(sinav, cell) {
    if (sinav === "AYT") {
      return cell.subjectId === "ayt-mat" || cell.subjectId === "ayt-geo";
    }
    if (sinav === "YDT") return false;
    return cell.subjectId === "tyt-mat" || cell.subjectId === "tyt-geo";
  }

  function sosyalPredicate(sinav, cell) {
    var id = cell.subjectId || "";
    if (sinav === "AYT") {
      return /^(ayt-tar2|ayt-cog2|ayt-fel-grup|ayt-din)/.test(id);
    }
    if (sinav === "YDT") return false;
    return /tyt-(tar|cog|fel|din)/.test(id);
  }

  function fenPredicate(sinav, cell) {
    var id = cell.subjectId || "";
    if (sinav === "AYT") {
      return /^(ayt-fiz|ayt-kim|ayt-biyo)/.test(id);
    }
    if (sinav === "YDT") return false;
    return /tyt-(fiz|kim|biyo)/.test(id);
  }

  function indicesForPred(byIndex, pred) {
    var ix = [];
    for (var i = 0; i < byIndex.length; i++) {
      if (pred(byIndex[i], i)) ix.push(i);
    }
    return ix;
  }

  function dynFromIndices(ans, key, indices) {
    var d = 0,
      y = 0,
      n = 0;
    for (var j = 0; j < indices.length; j++) {
      var i = indices[j];
      var k = key.charAt(i);
      var a = ans.charAt(i);
      if (!k || k === " ") {
        n++;
        continue;
      }
      if (!a || a === " ") n++;
      else if (a === k) d++;
      else y++;
    }
    return { d: d, y: y, n: n };
  }

  function rowTurkMat(rec, exam, layout, keyStr) {
    var sinav = (exam && exam.sinav) || "TYT";
    var n = layout.n;
    var key = keyStr;
    var hasKey = key.replace(/\s/g, "").length > 0;
    var ans = buildStudentAnswers(rec, n);
    var trDyn = { d: 0, y: 0, n: 0 };
    var matDyn = { d: 0, y: 0, n: 0 };
    if (hasKey) {
      var by = layout.byIndex;
      var predT = function (cell) {
        return turkcePredicate(sinav, cell);
      };
      var predM = function (cell) {
        return matPredicate(sinav, cell);
      };
      trDyn = dynFromIndices(ans, key, indicesForPred(by, predT));
      matDyn = dynFromIndices(ans, key, indicesForPred(by, predM));
    } else {
      trDyn = {
        d: Number(rec.correct) || 0,
        y: Number(rec.wrong) || 0,
        n: Number(rec.blank) || 0,
      };
      matDyn = { d: 0, y: 0, n: 0 };
    }
    return { turkStr: formatDyn(trDyn), matStr: formatDyn(matDyn), note: !hasKey };
  }

  function rowFourAreas(rec, exam, layout, keyStr) {
    var sinav = (exam && exam.sinav) || "TYT";
    var n = layout.n;
    var key = keyStr;
    var hasKey = key.replace(/\s/g, "").length > 0;
    var ans = buildStudentAnswers(rec, n);
    var dash = "—";
    if (!hasKey) {
      var tot = { d: Number(rec.correct) || 0, y: Number(rec.wrong) || 0, n: Number(rec.blank) || 0 };
      return {
        turk: formatDynHyphen(tot),
        mat: dash,
        sosyal: dash,
        fen: dash,
        note: true,
      };
    }
    var by = layout.byIndex;
    if (sinav === "YDT") {
      var allIx = [];
      for (var i = 0; i < by.length; i++) {
        allIx.push(i);
      }
      var full = dynFromIndices(ans, key, allIx);
      return {
        turk: formatDynHyphen(full),
        mat: dash,
        sosyal: dash,
        fen: dash,
        note: false,
      };
    }
    function predWrap(fn) {
      return function (cell) {
        return fn(sinav, cell);
      };
    }
    var trD = dynFromIndices(ans, key, indicesForPred(by, predWrap(turkcePredicate)));
    var mD = dynFromIndices(ans, key, indicesForPred(by, predWrap(matPredicate)));
    var sD = dynFromIndices(ans, key, indicesForPred(by, predWrap(sosyalPredicate)));
    var fD = dynFromIndices(ans, key, indicesForPred(by, predWrap(fenPredicate)));
    return {
      turk: formatDynHyphen(trD),
      mat: formatDynHyphen(mD),
      sosyal: formatDynHyphen(sD),
      fen: formatDynHyphen(fD),
      note: false,
    };
  }

  function puanCell(rec) {
    if (rec.puan != null && rec.puan !== "") return escapeHtml(String(rec.puan));
    return "—";
  }

  function studentRowKey(r) {
    return (
      String(r.studentId || "") +
      "::" +
      String(r.studentCode || "") +
      "::" +
      String(r.name || r.studentName || "")
    );
  }

  function subeLabel(r) {
    var s = (r.sube || r.class || r.sinif || "").toString().trim();
    return s || "—";
  }

  function computeRankMeta(examId) {
    var rows = sortByNetDesc(resultsForExam(examId));
    var genel = {};
    var sinif = {};
    var i;
    for (i = 0; i < rows.length; i++) {
      genel[studentRowKey(rows[i])] = i + 1;
    }
    var bySube = {};
    for (i = 0; i < rows.length; i++) {
      var sb = subeLabel(rows[i]);
      if (!bySube[sb]) bySube[sb] = [];
      bySube[sb].push(rows[i]);
    }
    Object.keys(bySube).forEach(function (sb) {
      var grp = sortByNetDesc(bySube[sb]);
      var k;
      for (k = 0; k < grp.length; k++) {
        sinif[studentRowKey(grp[k])] = k + 1;
      }
    });
    return { genel: genel, sinif: sinif, total: rows.length };
  }

  function computeSectionKurumAvgs(examId, exam, layout, keyStr) {
    var rows = resultsForExam(examId);
    var n = layout.n || 120;
    var sections = layout.sections || [];
    var sums = {};
    rows.forEach(function (r) {
      var ans = buildStudentAnswers(r, n);
      sections.forEach(function (sec) {
        var t = countDyn(ans, keyStr, sec.startQ - 1, sec.endQ);
        var nt = sectionNetVal(t);
        var k = sec.title;
        if (!sums[k]) sums[k] = { sum: 0, c: 0 };
        sums[k].sum += nt;
        sums[k].c += 1;
      });
    });
    var avgs = {};
    Object.keys(sums).forEach(function (k) {
      avgs[k] = sums[k].c ? Math.round((sums[k].sum / sums[k].c) * 100) / 100 : 0;
    });
    return avgs;
  }

  function formatTurkDyn(t) {
    return t.d + "D, " + t.y + "Y, " + t.n + "B";
  }

  function sectionNetVal(t) {
    return Math.round((t.d - t.y / 4) * 100) / 100;
  }

  function resultsForExam(examId) {
    return readExamResults().filter(function (r) {
      return r && String(r.examId) === String(examId);
    });
  }

  function sortByNetDesc(rows) {
    return rows.slice().sort(function (a, b) {
      var na = Number(a.net) || 0;
      var nb = Number(b.net) || 0;
      if (nb !== na) return nb - na;
      var ca = String(a.studentCode || a.studentId || "");
      var cb = String(b.studentCode || b.studentId || "");
      return ca.localeCompare(cb, "tr");
    });
  }

  function buildWrongTopicsFromMatrix(examId, r) {
    var sid = String(r.studentId || r.studentCode || "").trim();
    if (!sid || !window.ExamMatrix || typeof window.ExamMatrix.getMatrix !== "function") {
      return (
        '<p class="bds-karne-matrix-empty">Matrix verisi yok. Konu analizi için sınavın soru–konu matrisi ve ExamMatrix sonuç kaydı gerekir.</p>'
      );
    }
    var mx = window.ExamMatrix.getMatrix(examId);
    if (!mx || !mx.questions || !mx.questions.length) {
      return '<p class="bds-karne-matrix-empty">Bu sınav için soru–konu matrisi tanımlı değil.</p>';
    }
    var resList =
      typeof window.ExamMatrix.getResultsByStudent === "function"
        ? window.ExamMatrix.getResultsByStudent(sid)
        : [];
    var matrixRes = null;
    for (var i = 0; i < resList.length; i++) {
      if (resList[i] && String(resList[i].examId) === String(examId)) {
        matrixRes = resList[i];
        break;
      }
    }
    if (!matrixRes || !matrixRes.answers || !matrixRes.answers.length) {
      return (
        '<p class="bds-karne-matrix-empty">Bu sınav için Matrix sonuç kaydı yok (yüklenen optik sonuçları ExamMatrix ile ilişkilendirin).</p>'
      );
    }
    var byQ = {};
    mx.questions.forEach(function (q) {
      byQ[q.qNo] = q;
    });
    var poolExam = findExamById(examId);
    var topics = {};
    matrixRes.answers.forEach(function (a) {
      if (a.result !== "wrong") return;
      var q = byQ[a.qNo];
      if (!q) return;
      var tk = resolveQuestionTopicLabelKarne(q, poolExam, a.qNo);
      topics[tk] = (topics[tk] || 0) + 1;
    });
    var keys = Object.keys(topics);
    if (!keys.length) {
      return '<p class="bds-karne-matrix-empty">Konu etiketli yanlış bulunamadı veya yanlış yok.</p>';
    }
    keys.sort(function (a, b) {
      return topics[b] - topics[a];
    });
    var rows = keys
      .map(function (k) {
        return (
          "<tr><td>" +
          escapeHtml(k) +
          '</td><td class="bds-karne-mono text-center font-bold text-rose-700">' +
          topics[k] +
          "</td></tr>"
        );
      })
      .join("");
    return (
      '<table class="bds-karne-table bds-karne-table--topics w-full text-[12px]">' +
      '<thead><tr><th>Konu</th><th class="text-center">Yanlış sayısı</th></tr></thead><tbody>' +
      rows +
      "</tbody></table>"
    );
  }

  function buildRankedReportHTML(exam) {
    var kurum = escapeHtml(getKurumAdi());
    var exTitle = escapeHtml(exam.name || exam.title || exam.ad || exam.id);
    var exDate = escapeHtml(formatTrDate(exam.date || exam.examDate || exam.tarih || ""));
    var sinav = exam.sinav || "TYT";
    var layout = window.getExamLayout ? window.getExamLayout(sinav) : { n: 120, byIndex: [] };
    var n = layout.n || 120;
    var keyStr = buildKeyString(exam, n);
    var rows = sortByNetDesc(resultsForExam(exam.id));
    var rankMeta = computeRankMeta(exam.id);
    var avgStr = "—";
    if (rows.length) {
      var sumN = 0;
      rows.forEach(function (x) {
        sumN += Number(x.net) || 0;
      });
      avgStr = (sumN / rows.length).toFixed(2);
    }
    var note = "";
    if (!keyStr.replace(/\s/g, "").length) {
      note =
        '<p class="bds-karne-note mt-3 rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-2.5 text-[11px] font-medium text-amber-950">Alan sütunları için sınavda <b>cevap anahtarı</b> tanımlı olmalıdır. Anahtar yokken Türkçe hücresi toplam doğru–yanlış–net (Net = D − Y/4) gösterilir.</p>';
    }
    var body = rows
      .map(function (r, idx) {
        var four = rowFourAreas(r, exam, layout, keyStr);
        var name = escapeHtml(r.name || r.studentName || "—");
        var no = escapeHtml(String(r.studentCode || r.studentId || "—"));
        var net = r.net != null ? Number(r.net).toFixed(2) : "0.00";
        var keyk = studentRowKey(r);
        var kurS = rankMeta.genel[keyk] != null ? String(rankMeta.genel[keyk]) : "—";
        var subS = rankMeta.sinif[keyk] != null ? String(rankMeta.sinif[keyk]) : "—";
        var zebra = idx % 2 === 0 ? "bds-karne-table__row--a" : "bds-karne-table__row--b";
        return (
          '<tr class="' +
          zebra +
          '"><td class="bds-karne-table__rank">' +
          (idx + 1) +
          '</td><td class="bds-karne-mono text-slate-800">' +
          no +
          "</td><td class=\"font-semibold text-slate-900\">" +
          name +
          '</td><td class="bds-karne-mono text-center text-slate-700">' +
          escapeHtml(four.turk) +
          '</td><td class="bds-karne-mono text-center text-slate-700">' +
          escapeHtml(four.mat) +
          '</td><td class="bds-karne-mono text-center text-slate-700">' +
          escapeHtml(four.sosyal) +
          '</td><td class="bds-karne-mono text-center text-slate-700">' +
          escapeHtml(four.fen) +
          '</td><td class="text-center font-extrabold text-slate-900">' +
          net +
          '</td><td class="bds-karne-mono text-center text-slate-700">' +
          puanCell(r) +
          '</td><td class="text-center font-bold text-indigo-800">' +
          escapeHtml(subS) +
          '</td><td class="text-center font-bold text-slate-800">' +
          escapeHtml(kurS) +
          "</td></tr>"
        );
      })
      .join("");
    if (!rows.length) {
      body =
        '<tr><td colspan="11" class="py-12 text-center text-slate-500">Bu sınav için <code>examResults</code> kaydı yok.</td></tr>';
    }
    return (
      '<div class="bds-print-block bds-karne-kurum mx-auto max-w-[100%]">' +
      '<header class="bds-karne-kurum-premium mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-stretch sm:justify-between">' +
      '<div class="flex min-w-0 flex-1 gap-4">' +
      '<div class="bds-karne-logo-ph shrink-0" aria-hidden="true">LOGO</div>' +
      '<div class="min-w-0 text-left">' +
      '<p class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">' +
      kurum +
      "</p>" +
      '<h3 class="mt-1 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">' +
      exTitle +
      "</h3>" +
      '<p class="mt-1 text-sm text-slate-600">Sınav tarihi: <strong>' +
      exDate +
      "</strong> · " +
      escapeHtml(sinav) +
      "</p></div></div>" +
      '<div class="bds-karne-kurum-stats shrink-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm shadow-sm">' +
      '<div class="font-bold text-slate-900">Özet</div>' +
      '<div class="mt-2 space-y-1 text-slate-700"><div>Katılım: <strong>' +
      rows.length +
      "</strong> kişi</div><div>Kurum ort. net: <strong>" +
      escapeHtml(avgStr) +
      "</strong></div></div></div></header>" +
      note +
      '<div class="bds-karne-tablewrap overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">' +
      '<table class="bds-karne-table bds-karne-table--kurum-premium w-full border-collapse text-[11px] sm:text-xs">' +
      "<thead><tr>" +
      '<th>Sıra</th><th>Öğrenci no</th><th>Ad soyad</th>' +
      '<th class="text-center">Türkçe<br/><span class="bds-th-sub">(D-Y-Net)</span></th>' +
      '<th class="text-center">Matematik<br/><span class="bds-th-sub">(D-Y-Net)</span></th>' +
      '<th class="text-center">Sosyal<br/><span class="bds-th-sub">(D-Y-Net)</span></th>' +
      '<th class="text-center">Fen<br/><span class="bds-th-sub">(D-Y-Net)</span></th>' +
      '<th class="text-center">Toplam net</th><th class="text-center">Puan</th>' +
      '<th class="text-center">Şube sırası</th><th class="text-center">Kurum sırası</th>' +
      "</tr></thead><tbody>" +
      body +
      "</tbody></table></div></div>"
    );
  }

  function bdsZorlukLabelKarne(z) {
    var m = { "0": "Kolay", "1": "Orta", "2": "Zor", "3": "Çok zor" };
    return m[String(z)] || "—";
  }

  function bdsSubjectLabelKarne(sid) {
    if (window.YksMufredatApi && typeof window.YksMufredatApi.subjectDisplayName === "function") {
      return window.YksMufredatApi.subjectDisplayName(sid);
    }
    if (window.YksMufredatApi && sid) {
      var s = window.YksMufredatApi.getSubject(sid);
      if (s && s.name) return s.name;
    }
    return sid || "—";
  }

  function topicNameFromMufIdsKarne(sid, tid) {
    if (!tid) return "";
    try {
      if (window.YksMufredatApi && sid) {
        var topics = window.YksMufredatApi.getTopics(sid) || [];
        for (var i = 0; i < topics.length; i++) {
          if (topics[i].id === tid) return topics[i].name || "";
        }
      }
    } catch (eT) {}
    return "";
  }

  function conceptNameFromMufIdsKarne(sid, tid, cid) {
    if (!cid || !tid) return "";
    try {
      if (window.YksMufredatApi && sid) {
        var concepts = window.YksMufredatApi.getConcepts(sid, tid) || [];
        for (var j = 0; j < concepts.length; j++) {
          if (concepts[j].id === cid) return concepts[j].name || "";
        }
      }
    } catch (eC) {}
    return "";
  }

  function parseKonuPipeCellKarne(cell) {
    var raw = String(cell == null ? "" : cell).trim();
    if (!raw) return { sid: "", tid: "", cid: "" };
    if (raw.indexOf("|") < 0) return { sid: "", tid: "", cid: "", plain: raw };
    var p = raw.split("|");
    return {
      sid: (p[0] || "").trim(),
      tid: (p[1] || "").trim(),
      cid: (p[2] || "").trim(),
      plain: "",
    };
  }

  function isWeakKarneTopicName(name) {
    var s = String(name == null ? "" : name).trim();
    return !s || s === "Genel";
  }

  /** konu[] / konuYazi[] hücresinden görünen konu + kavram adları */
  function resolveKonuKavramFromCell(cell, sid, yazi) {
    if (window.YksMufredatApi && typeof window.YksMufredatApi.resolveKonuCell === "function") {
      return window.YksMufredatApi.resolveKonuCell(cell, sid, yazi);
    }
    var out = { konu: "", kavram: "" };
    var y = String(yazi == null ? "" : yazi).trim();
    if (y) {
      var dash = y.indexOf(" — ");
      if (dash >= 0) {
        out.konu = y.slice(0, dash).trim();
        out.kavram = y.slice(dash + 3).trim();
      } else {
        out.konu = y;
      }
      return out;
    }
    var raw = String(cell == null ? "" : cell).trim();
    if (!raw) return out;
    var pipe = parseKonuPipeCellKarne(raw);
    if (pipe.plain) {
      if (/^(tyt-|ayt-|ydt$)/i.test(pipe.plain)) return out;
      out.konu = pipe.plain;
      return out;
    }
    var s = pipe.sid || String(sid || "").trim();
    out.konu = topicNameFromMufIdsKarne(s, pipe.tid);
    out.kavram = pipe.cid ? conceptNameFromMufIdsKarne(s, pipe.tid, pipe.cid) : "";
    return out;
  }

  function resolveTopicDisplayKarne(sid, tid, cid, currentName) {
    var t = String(currentName == null ? "" : currentName).trim();
    if (t && !isWeakKarneTopicName(t) && !/^(tyt-|ayt-|ydt$)/i.test(t)) return t;
    var sidC = String(sid || "").trim();
    var topicBase = topicNameFromMufIdsKarne(sidC, String(tid || "").trim());
    var cname = cid ? conceptNameFromMufIdsKarne(sidC, String(tid || "").trim(), String(cid || "").trim()) : "";
    var built = topicBase && cname ? topicBase + " · " + cname : topicBase || cname;
    return built || t || "Genel";
  }

  function resolveQuestionTopicLabelKarne(q, exam, qNo) {
    if (!q) return "Genel";
    var sid = String(q.subjectId || "").trim();
    var i = (qNo || q.qNo || 1) - 1;
    if (exam) {
      var pk = resolveKonuKavramFromCell(
        exam.konu && i >= 0 && i < exam.konu.length ? exam.konu[i] : "",
        sid,
        exam.konuYazi && i >= 0 && i < exam.konuYazi.length ? exam.konuYazi[i] : ""
      );
      if (pk.konu) {
        return pk.kavram ? pk.konu + " · " + pk.kavram : pk.konu;
      }
    }
    return resolveTopicDisplayKarne(sid, q.topicId, q.conceptId, q.topicName);
  }

  function bdsParseKonuKavramKarne(pipeStr, sid) {
    return resolveKonuKavramFromCell(pipeStr, sid, "");
  }

  function splitKonuKavramLabel(label) {
    var t = String(label == null ? "" : label).trim();
    if (!t) return { konu: "", kavram: "" };
    var sep = t.indexOf(" · ");
    if (sep < 0) sep = t.indexOf(" — ");
    if (sep >= 0) {
      return { konu: t.slice(0, sep).trim(), kavram: t.slice(sep + 3).trim() };
    }
    return { konu: t, kavram: "" };
  }

  function formatKonuKavramParsed(parsed) {
    if (!parsed || !parsed.konu) return "Genel";
    return parsed.kavram ? parsed.konu + " · " + parsed.kavram : parsed.konu;
  }

  function resolveKonuLabelForLayoutQuestion(exam, qNo, layoutCell, mxByQ) {
    var i = (qNo || 1) - 1;
    var sid = layoutCell && layoutCell.subjectId ? layoutCell.subjectId : "";
    var konuCell =
      exam && exam.konu && i >= 0 && i < exam.konu.length ? exam.konu[i] : "";
    var yaziCell =
      exam && exam.konuYazi && i >= 0 && i < exam.konuYazi.length ? exam.konuYazi[i] : "";
    var mxQ = mxByQ && mxByQ[qNo] ? mxByQ[qNo] : null;
    return formatKonuKavramParsed(
      resolveMatrixRowKonuKavram(exam, qNo, sid, konuCell, yaziCell, mxQ)
    );
  }

  function resolveMatrixRowKonuKavram(exam, qNo, sid, konuCell, yaziCell, mxQ) {
    var parsed = resolveKonuKavramFromCell(konuCell, sid, yaziCell);
    if (parsed.konu) return parsed;
    if (mxQ) {
      var label = resolveQuestionTopicLabelKarne(mxQ, exam, qNo);
      if (label && label !== "Genel") {
        var split = splitKonuKavramLabel(label);
        if (split.konu) {
          if (!split.kavram && mxQ.conceptId && mxQ.topicId) {
            split.kavram =
              conceptNameFromMufIdsKarne(mxQ.subjectId || sid, mxQ.topicId, mxQ.conceptId) || split.kavram;
          }
          return split;
        }
      }
      if (mxQ.topicName) {
        return splitKonuKavramLabel(mxQ.topicName);
      }
    }
    return parsed;
  }

  function buildExamMatrixByQ(examId) {
    var out = {};
    if (!window.ExamMatrix || typeof window.ExamMatrix.getMatrix !== "function") return out;
    var mx = window.ExamMatrix.getMatrix(examId);
    if (!mx || !mx.questions) return out;
    mx.questions.forEach(function (q) {
      if (q && q.qNo != null) out[q.qNo] = q;
    });
    return out;
  }

  function buildKarneMatrixWrongPage(exam, r, layout, keyStr, ans) {
    var n = layout.n || 120;
    var by = layout.byIndex || [];
    var konuArr = exam.konu || [];
    var zArr = exam.zorluk || [];
    var yazi = exam.konuYazi || [];
    var mxByQ = buildExamMatrixByQ(exam.id);
    var rows = [];
    for (var i = 0; i < n; i++) {
      var kc = (keyStr.charAt(i) || "").trim();
      var ac = (ans.charAt(i) || "").trim().toUpperCase();
      if (!kc || kc === " ") continue;
      var ok = ac && ac !== "" && ac === kc;
      if (ok) continue;
      var st = !ac || ac === "" ? "Boş" : "Yanlış";
      var qNo = i + 1;
      var sid = by[i] ? by[i].subjectId : "";
      var branch = bdsSubjectLabelKarne(sid);
      var zlab = bdsZorlukLabelKarne(zArr && i < zArr.length ? zArr[i] : "1");
      var parsed = resolveMatrixRowKonuKavram(
        exam,
        qNo,
        sid,
        konuArr && i < konuArr.length ? konuArr[i] : "",
        yazi && i < yazi.length ? yazi[i] : "",
        mxByQ[qNo]
      );
      var konuCol = parsed.konu || "—";
      var kavCol = parsed.kavram || "—";
      rows.push({ q: qNo, branch: branch, konu: konuCol, kavram: kavCol, st: st, z: zlab });
    }
    if (!rows.length) {
      rows.push({
        q: "—",
        branch: "—",
        konu: "Bu sınav için işaretlenmiş yanlış/boş soru yok veya cevap anahtarı eksik.",
        kavram: "—",
        st: "—",
        z: "—",
      });
    }
    var trs = rows
      .map(function (row) {
        return (
          '<tr><td class="bds-karne-mono text-center font-bold">' +
          escapeHtml(String(row.q)) +
          '</td><td class="font-medium">' +
          escapeHtml(row.branch) +
          "</td><td>" +
          escapeHtml(row.konu) +
          "</td><td>" +
          escapeHtml(row.kavram) +
          '</td><td class="text-center font-bold">' +
          escapeHtml(row.st) +
          '</td><td class="text-center">' +
          escapeHtml(row.z) +
          "</td></tr>"
        );
      })
      .join("");
    return (
      '<div class="matrix-page bds-karne-matrix-page bds-print-block" style="page-break-before: always;">' +
      '<div class="bds-karne-sec-title">Matris analizi <span class="bds-karne-sec-hint">Yanlış / boş sorular</span></div>' +
      '<div class="bds-karne-tablewrap overflow-x-auto rounded-xl border border-slate-200">' +
      '<table class="bds-karne-table bds-karne-matrix-detail w-full text-[10px] sm:text-[11px]">' +
      "<thead><tr>" +
      '<th class="text-center">Soru</th><th>Branş</th><th>Konu</th><th>Kavram</th><th class="text-center">Durum</th><th class="text-center">Zorluk</th>' +
      "</tr></thead><tbody>" +
      trs +
      "</tbody></table></div>" +
      '<p class="bds-karne-foot mt-3 text-[9px] text-slate-500">Kaynak: sınav matrisi ve öğrenci cevapları.</p></div>'
    );
  }

  function buildSingleStudentKarnePage(exam, r, rankMeta, layout, keyStr, sectionAvgs) {
    var kurum = escapeHtml(getKurumAdi());
    var exTitle = escapeHtml(exam.name || exam.title || exam.ad || exam.id);
    var exDate = escapeHtml(formatTrDate(exam.date || exam.examDate || exam.tarih || ""));
    var sinav = exam.sinav || exam.tur || "TYT";
    var n = layout.n || 120;
    var ans = buildStudentAnswers(r, n);
    var keyk = studentRowKey(r);
    var kurRank = rankMeta.genel[keyk] != null ? String(rankMeta.genel[keyk]) : "—";
    var subRank = rankMeta.sinif[keyk] != null ? String(rankMeta.sinif[keyk]) : "—";
    var T = Math.max(1, rankMeta.total || 1);
    var rNum = rankMeta.genel[keyk] != null ? rankMeta.genel[keyk] : T;
    var pctile = Math.max(0, Math.min(100, Math.round((1 - (rNum - 1) / T) * 100)));
    var name = escapeHtml(r.name || r.studentName || "—");
    var no = escapeHtml(String(r.studentCode || r.studentId || "—"));
    var sube = escapeHtml(subeLabel(r));
    var netTot = r.net != null ? Number(r.net).toFixed(2) : "0.00";
    var hasKey = keyStr.replace(/\s/g, "").length > 0;
    var secRows = (layout.sections || [])
      .map(function (sec) {
        var t = countDyn(ans, keyStr, sec.startQ - 1, sec.endQ);
        var nt = sectionNetVal(t);
        var avg = sectionAvgs[sec.title] != null ? sectionAvgs[sec.title] : 0;
        var maxQ = sec.endQ - sec.startQ + 1;
        var studPct = maxQ > 0 ? Math.min(100, Math.max(0, (nt / maxQ) * 100)) : 0;
        var avgPct = maxQ > 0 ? Math.min(100, Math.max(0, (avg / maxQ) * 100)) : 0;
        var low = nt + 1e-6 < avg;
        var fillCls = low ? "bds-karne-vsbar-fill--low" : "bds-karne-vsbar-fill--ok";
        return (
          "<tr>" +
          '<td class="font-semibold text-slate-900">' +
          escapeHtml(sec.title) +
          '</td><td class="bds-karne-mono text-center">' +
          t.d +
          '</td><td class="bds-karne-mono text-center">' +
          t.y +
          '</td><td class="bds-karne-mono text-center">' +
          t.n +
          '</td><td class="bds-karne-mono text-center font-extrabold text-slate-900">' +
          nt.toFixed(2) +
          '</td><td class="bds-karne-vsbar-cell">' +
          '<div class="bds-karne-vsbar" title="Yeşil/kırmızı: kurum ortalamasına göre; çizgi: kurum ort.">' +
          '<div class="bds-karne-vsbar-fill ' +
          fillCls +
          '" style="width:' +
          studPct.toFixed(1) +
          '%"></div>' +
          '<div class="bds-karne-vsbar-marker" style="left:' +
          avgPct.toFixed(1) +
          '%"></div></div>' +
          '<div class="bds-karne-vsbar-cap">Ö&nbsp;' +
          nt.toFixed(2) +
          " · ø&nbsp;" +
          avg.toFixed(2) +
          "</div></td></tr>"
        );
      })
      .join("");
    var topicsBlock = buildWrongTopicsFromMatrix(exam.id, r);
    var page1 =
      '<section class="bds-karne-student-page bds-karne-student-page1 bds-karne-a4 bds-print-block">' +
      '<header class="bds-karne-prem-head">' +
      '<div class="bds-karne-prem-head__left">' +
      '<div class="bds-karne-avatar-ph" aria-hidden="true"></div>' +
      '<div class="bds-karne-prem-head__meta">' +
      '<p class="bds-karne-student__eyebrow">' +
      kurum +
      "</p>" +
      '<h2 class="bds-karne-prem-name">' +
      name +
      "</h2>" +
      '<p class="bds-karne-prem-sub">No: <span class="font-mono font-bold">' +
      no +
      "</span> · Şube: " +
      sube +
      " · Toplam net: <strong>" +
      escapeHtml(netTot) +
      "</strong></p>" +
      '<p class="bds-karne-student__meta">' +
      exTitle +
      " · " +
      exDate +
      " · " +
      escapeHtml(sinav) +
      "</p></div></div>" +
      '<div class="bds-karne-qr-ph" aria-label="Sonuç doğrulama barkodu (yer tutucu)">' +
      '<span class="bds-karne-qr-label">Doğrulama</span>' +
      '<div class="bds-karne-qr-grid"></div></div></header>' +
      '<div class="bds-karne-rank-grid bds-karne-rank-grid--3">' +
      '<div class="bds-karne-rank-box bds-karne-rank-box--premium">' +
      '<span class="bds-karne-rank-label">Kurum sırası</span>' +
      '<span class="bds-karne-rank-val">' +
      escapeHtml(kurRank) +
      '</span><span class="bds-karne-rank-sub">/ ' +
      escapeHtml(String(T)) +
      "</span></div>" +
      '<div class="bds-karne-rank-box bds-karne-rank-box--premium">' +
      '<span class="bds-karne-rank-label">Şube sırası</span>' +
      '<span class="bds-karne-rank-val">' +
      escapeHtml(subRank) +
      '</span><span class="bds-karne-rank-sub">şube içi</span></div>' +
      '<div class="bds-karne-rank-box bds-karne-rank-box--premium bds-karne-rank-box--accent">' +
      '<span class="bds-karne-rank-label">Genel yüzdelik dilim</span>' +
      '<span class="bds-karne-rank-val">' +
      escapeHtml(String(pctile)) +
      '%</span><span class="bds-karne-rank-sub">üst dilim</span></div></div>' +
      '<div class="bds-karne-sec-title">Branş analizi <span class="bds-karne-sec-hint">Kurum ortalamasına göre mini bar</span></div>' +
      '<div class="bds-karne-tablewrap overflow-x-auto rounded-xl border border-slate-200">' +
      '<table class="bds-karne-table bds-karne-table--branch w-full text-[11px] sm:text-[12px]">' +
      "<thead><tr>" +
      "<th>Ders / blok</th>" +
      '<th class="text-center">D</th><th class="text-center">Y</th><th class="text-center">B</th>' +
      '<th class="text-center">Net</th><th class="text-center">Kurum karşılaştırma</th>' +
      "</tr></thead><tbody>" +
      secRows +
      "</tbody></table></div>" +
      '<div class="bds-karne-sec-title">Dikkat edilmesi gereken konular <span class="bds-karne-sec-hint">Matrix · yanlış konular</span></div>' +
      '<div class="bds-karne-topics-wrap rounded-xl border border-rose-100 bg-rose-50/40 p-3">' +
      topicsBlock +
      "</div>" +
      '<p class="bds-karne-foot mt-4 text-[9px] leading-relaxed text-slate-500">Net = Doğru − Yanlış ÷ 4 (ÖSYM). ' +
      (hasKey ? "Branş dağılımı cevap anahtarı ile hesaplanmıştır." : "Anahtar eksikse bloklar soru aralığı üzerinden hesaplanır.") +
      "</p></section>";
    var page2 = buildKarneMatrixWrongPage(exam, r, layout, keyStr, ans);
    return '<div class="bds-karne-student-print-unit">' + page1 + page2 + "</div>";
  }

  function buildSelectedStudentKarnesHTML(exam, records, rankMeta) {
    if (!records.length) {
      return '<p class="py-12 text-center text-slate-500">Seçili öğrenci yok.</p>';
    }
    var sinav = exam.sinav || "TYT";
    var layout = window.getExamLayout ? window.getExamLayout(sinav) : { n: 120, sections: [] };
    var n = layout.n || 120;
    var keyStr = buildKeyString(exam, n);
    var sectionAvgs = computeSectionKurumAvgs(exam.id, exam, layout, keyStr);
    return records
      .map(function (r) {
        return buildSingleStudentKarnePage(exam, r, rankMeta, layout, keyStr, sectionAvgs);
      })
      .join("");
  }

  function sanitizeFilenamePart(s) {
    return String(s == null ? "sinav" : s)
      .replace(/[^\w\u00C0-\u024f\-]+/gi, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 80) || "sinav";
  }

  function karnePrintStylesheetHref() {
    try {
      return new URL("../css/ogrenci-deneme-karne-screen.css", window.location.href).href;
    } catch (e) {
      return "../css/ogrenci-deneme-karne-screen.css";
    }
  }

  /** Chrome «Yazdır → PDF olarak kaydet» — html2pdf yerine hızlı yol */
  function openKarnePrintWindow(html, examId, resultRow) {
    return new Promise(function (resolve, reject) {
      try {
        var w = window.open("", "_blank", "noopener,noreferrer");
        if (!w) {
          if (typeof window.alert === "function") {
            window.alert(
              "Yazdırma penceresi açılamadı. Tarayıcı açılır pencere (popup) engelini kapatıp tekrar deneyin."
            );
          }
          reject(new Error("popup blocked"));
          return;
        }
        var title =
          sanitizeFilenamePart(
            (resultRow && (resultRow.examName || resultRow.title)) || "Karne_" + String(examId)
          ) || "Karne";
        var cssHref = karnePrintStylesheetHref();
        w.document.open();
        w.document.write(
          "<!DOCTYPE html><html lang=\"tr\"><head><meta charset=\"UTF-8\"/><title>" +
          escapeHtml(title) +
          "</title><link rel=\"stylesheet\" href=\"" +
          escapeHtml(cssHref) +
          "\"/><style>" +
          "body{margin:0;padding:16px;color:#0f172a;font-family:Inter,system-ui,sans-serif;background:#fff}" +
          ".bds-karne-table{width:100%;border-collapse:collapse}" +
          ".bds-karne-table th,.bds-karne-table td{border:1px solid #e2e8f0;padding:6px 8px;font-size:11px}" +
          ".bds-print-block{page-break-inside:avoid}" +
          ".bds-karne-matrix-page{page-break-before:always}" +
          "@media print{body{margin:0;padding:8mm}}" +
          "</style></head><body>" +
          html +
          '<p class="ogr-ds-print-hint" style="margin-top:14px;font-size:11px;color:#64748b">' +
          "Hedef: PDF olarak kaydet — Yazdır penceresinde «Hedef» olarak <strong>PDF olarak kaydet</strong> seçin.</p>" +
          "<script>window.addEventListener(\"load\",function(){setTimeout(function(){window.focus();window.print();},280);});<\/script></body></html>"
        );
        w.document.close();
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  function resolveExamTitle(examId, resultRow) {
    refreshExams();
    var ex = findExamById(examId);
    if (ex) {
      var nm = ex.name || ex.title || ex.ad || ex.denemeAdi;
      if (nm && String(nm).trim()) return String(nm).trim();
    }
    if (resultRow) {
      var rnm = resultRow.examName || resultRow.denemeAdi || resultRow.title;
      if (rnm && String(rnm).trim() && !/^kd-\d+$/i.test(String(rnm).trim())) return String(rnm).trim();
    }
    return "";
  }

  function getSectionBreakdown(examId, resultRow) {
    refreshExams();
    var ex = findExamById(examId);
    if (!ex || !resultRow) return [];
    var sinav = ex.sinav || ex.tur || "TYT";
    var layout = window.getExamLayout ? window.getExamLayout(sinav) : { n: 120, sections: [] };
    var n = layout.n || 120;
    var keyStr = buildKeyString(ex, n);
    var ans = buildStudentAnswers(resultRow, n);
    return (layout.sections || []).map(function (sec) {
      var t = countDyn(ans, keyStr, sec.startQ - 1, sec.endQ);
      return { label: sec.title, net: sectionNetVal(t) };
    });
  }

  window.DereceStudentKarneApi = {
    refreshExams: refreshExams,

    findExamById: function (id) {
      refreshExams();
      return findExamById(id);
    },

    resolveExamTitle: function (examId, resultRow) {
      return resolveExamTitle(examId, resultRow) || "Deneme";
    },

    getSectionBreakdown: getSectionBreakdown,

    resolveKonuKavramFromCell: resolveKonuKavramFromCell,
    resolveTopicDisplay: resolveTopicDisplayKarne,
    resolveQuestionTopicLabel: resolveQuestionTopicLabelKarne,
    buildExamMatrixByQ: buildExamMatrixByQ,
    resolveMatrixRowKonuKavram: resolveMatrixRowKonuKavram,
    formatKonuKavramParsed: formatKonuKavramParsed,
    resolveKonuLabelForLayoutQuestion: resolveKonuLabelForLayoutQuestion,

    buildKarneHtmlForStudent: function (examId, resultRow) {
      refreshExams();
      var ex = findExamById(examId);
      if (!ex || !resultRow) return "";
      var meta = computeRankMeta(ex.id);
      var sinav = ex.sinav || ex.tur || "TYT";
      var layout = window.getExamLayout ? window.getExamLayout(sinav) : { n: 120, sections: [] };
      var n = layout.n || 120;
      var keyStr = buildKeyString(ex, n);
      var sectionAvgs = computeSectionKurumAvgs(ex.id, ex, layout, keyStr);
      return buildSingleStudentKarnePage(ex, resultRow, meta, layout, keyStr, sectionAvgs);
    },

    downloadKarnePdf: function (examId, resultRow) {
      var html = this.buildKarneHtmlForStudent(examId, resultRow);
      if (!html) {
        if (typeof window.alert === "function") window.alert("Karne oluşturulamadı — sınav veya sonuç bulunamadı.");
        return Promise.reject(new Error("empty karne"));
      }
      return openKarnePrintWindow(html, examId, resultRow);
    },

    openKarnePrintWindow: openKarnePrintWindow,
  };

  function runKarnePdfDownload(h2p, html, examId, resultRow) {
      if (!h2p) {
        return karnePdfPrintFallback(html, examId, resultRow);
      }
      var host = document.createElement("div");
      host.setAttribute("data-derece-karne-pdf-root", "1");
      host.style.cssText =
        "position:fixed;left:-9999px;top:0;width:794px;background:#fff;color:#0f172a;font-family:Inter,system-ui,sans-serif;";
      host.innerHTML =
        '<style data-derece-karne-pdf-style="1">' +
        ".bds-karne-student-print-unit,.bds-karne-matrix-page{box-sizing:border-box;}" +
        ".bds-karne-table{width:100%;border-collapse:collapse;}" +
        ".bds-karne-table th,.bds-karne-table td{border:1px solid #e2e8f0;padding:6px 8px;}" +
        "</style>" +
        html;
      document.body.appendChild(host);
      var base =
        sanitizeFilenamePart((resultRow.studentCode || resultRow.studentId || "ogrenci") + "_" + String(examId));
      var opt = {
        margin: [8, 8, 8, 8],
        filename: "Karne_" + base + ".pdf",
        image: { type: "jpeg", quality: 0.92 },
        html2canvas: {
          scale: 1.5,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          windowWidth: 794,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"] },
      };
      return h2p()
        .set(opt)
        .from(host)
        .save()
        .then(function () {
          if (host.parentNode) host.parentNode.removeChild(host);
        })
        .catch(function (e) {
          if (host.parentNode) host.parentNode.removeChild(host);
          return karnePdfPrintFallback(html, examId, resultRow).catch(function () {
            throw e;
          });
        });
  }
})();

