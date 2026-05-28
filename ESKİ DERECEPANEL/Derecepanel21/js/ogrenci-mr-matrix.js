/**
 * Öğrenci Akademik Matrix
 * Veri: tüm denemeler (kurumsal + global examResults, ExamMatrix), tek deneme değil — tarih aralığındaki hepsi.
 * Müfredat listesi: js/yks-mufredat.js → window.YksMufredatApi (JSON paketi değil; aynı kaynak yks-mufredat.json ile uyumlu tek modül).
 * Başarı %: soru bazında net oranı (doğru=1, yanlış=-0.25, boş=0) / soru sayısı, tüm denemelerde toplanır.
 */
(function () {
  "use strict";

  var C = window.OgrenciMrCore;
  var MX_INK = "#334155";
  /** Radar — koyu pastel (beyaz zeminde okunaklı dolgu) */
  var MX_RADAR_STROKE = "#4a6fa5";
  var MX_RADAR_FILL = "#6b8fd6";
  var MX_RADAR_FILL_OPACITY = 0.55;
  var MX_GRID = "#cbd5e1";
  var radarChart = null;
  var barChart = null;
  var apexLoadPromise = null;

  function ensureApexCharts() {
    if (typeof ApexCharts !== "undefined") return Promise.resolve();
    if (apexLoadPromise) return apexLoadPromise;
    apexLoadPromise = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/apexcharts@3.54.1";
      s.async = true;
      s.onload = function () {
        resolve();
      };
      s.onerror = function () {
        reject(new Error("ApexCharts yüklenemedi"));
      };
      document.head.appendChild(s);
    });
    return apexLoadPromise;
  }

  var state = {
    examSinav: "TYT",
    masteryFiltered: null,
    masteryRaw: null,
    rawMergedResults: null,
    selectedSubjectId: "",
    dataSig: "",
  };

  var mufredatSubjectsCache = { TYT: null, AYT: null };
  var mufredatReadyHooked = false;

  function getMufredatApi() {
    var api = window.YksMufredatApi;
    if (!api || typeof api.getSubjects !== "function") return null;
    return api;
  }

  function invalidateMufredatCache() {
    mufredatSubjectsCache.TYT = null;
    mufredatSubjectsCache.AYT = null;
  }

  function listMufredatSubjects(sinav) {
    var api = getMufredatApi();
    if (!api) return [];
    if (mufredatSubjectsCache[sinav]) return mufredatSubjectsCache[sinav];
    var list = api
      .getSubjects()
      .filter(function (s) {
        return s && s.sinav === sinav && s.name;
      })
      .sort(function (a, b) {
        return String(a.name).localeCompare(String(b.name), "tr");
      });
    mufredatSubjectsCache[sinav] = list;
    return list;
  }

  function masteryKeyMatchesSinav(masteryKey, sinav) {
    var sk = String(masteryKey || "").trim();
    if (!sk) return false;
    if (/^TYT\b/i.test(sk) && sinav === "TYT") return true;
    if (/^AYT\b/i.test(sk) && sinav === "AYT") return true;
    var allowed = allowedSubjectNamesForSinav(sinav);
    if (allowed) return subjectMatchesSinavFilter(sk, sinav, allowed);
    if (sinav === "AYT") return /^AYT\b/i.test(sk);
    return !/^AYT\b/i.test(sk);
  }

  /** API hazır değilken deneme verisindeki ders adlarından seçenek üret */
  function listSubjectsFromMastery(mastery, sinav) {
    var out = [];
    Object.keys((mastery && mastery.bySubject) || {}).forEach(function (mk) {
      if (!masteryKeyMatchesSinav(mk, sinav)) return;
      out.push({
        id: "mk:" + encodeURIComponent(mk),
        name: labelForSubject(mk),
        masteryKey: mk,
      });
    });
    out.sort(function (a, b) {
      return String(a.name).localeCompare(String(b.name), "tr");
    });
    return out;
  }

  function subjectsForSelect(mastery, sinav) {
    var apiList = listMufredatSubjects(sinav);
    if (apiList.length) {
      return apiList.map(function (s) {
        return {
          id: s.id,
          name: s.name,
          masteryKey: findMasterySubjectKey(mastery, s.name),
        };
      });
    }
    return listSubjectsFromMastery(mastery, sinav);
  }

  function bindMufredatReadyOnce() {
    if (mufredatReadyHooked) return;
    mufredatReadyHooked = true;
    window.addEventListener("yks-mufredat:ready", function () {
      invalidateMufredatCache();
      refreshAll({ skipDataReload: true });
    });
  }

  function ensureMufredatThen(fn) {
    bindMufredatReadyOnce();
    if (getMufredatApi()) {
      if (typeof fn === "function") fn();
      return;
    }
    var n = 0;
    function tick() {
      if (getMufredatApi()) {
        invalidateMufredatCache();
        if (typeof fn === "function") fn();
        return;
      }
      n += 1;
      if (n < 40) setTimeout(tick, 25);
      else if (typeof fn === "function") fn();
    }
    tick();
  }

  function normTopicKey(s) {
    return String(s || "")
      .trim()
      .toLocaleLowerCase("tr")
      .replace(/\s+/g, " ");
  }

  function findMasterySubjectKey(mastery, mufredatName) {
    if (!mastery || !mastery.bySubject) return "";
    var target = String(mufredatName || "").trim();
    if (!target) return "";
    var targetBase = baseSubjectName(target).toLocaleLowerCase("tr");
    var keys = Object.keys(mastery.bySubject);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (k === target) return k;
      if (state.examSinav + " " + k === target) return k;
      var kb = baseSubjectName(k).toLocaleLowerCase("tr");
      if (kb === targetBase) return k;
      if (targetBase.length >= 4 && (kb.indexOf(targetBase) >= 0 || targetBase.indexOf(kb) >= 0)) return k;
    }
    return "";
  }

  function matchMatrixTopic(masteryTopics, topicName) {
    if (!masteryTopics) return { rate: 0, asked: 0, correct: 0, wrong: 0 };
    var n = normTopicKey(topicName);
    var keys = Object.keys(masteryTopics);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      var nk = normTopicKey(k);
      if (nk === n) return masteryTopics[k];
      if (n.length >= 3 && (nk.indexOf(n) >= 0 || n.indexOf(nk) >= 0)) return masteryTopics[k];
    }
    return { rate: 0, asked: 0, correct: 0, wrong: 0 };
  }

  function mufredatSubjectName(subjectId) {
    var api = getMufredatApi();
    if (api && typeof api.getSubject === "function") {
      var s = api.getSubject(subjectId);
      if (s && s.name) return s.name;
    }
    return "";
  }

  function emptyMastery() {
    return {
      total: { correct: 0, wrong: 0, empty: 0, asked: 0, netSum: 0, maxNet: 0, rate: 0, examCount: 0 },
      bySubject: {},
      examIds: {},
    };
  }

  function isMatrixShapedAnswers(answers) {
    if (!Array.isArray(answers) || !answers.length) return false;
    var a0 = answers[0];
    return typeof a0 === "object" && a0 != null && "result" in a0;
  }

  function examSinavNorm(exam) {
    var sinav = String((exam && (exam.sinav || exam.tur)) || "TYT").toUpperCase();
    if (sinav === "YKS" || sinav === "GENEL") sinav = "TYT";
    if (sinav !== "AYT" && sinav !== "YDT") sinav = "TYT";
    return sinav;
  }

  function resolveKonuTopicName(cell, sid, yazi, exam, qNo, layoutCell, mxByQ) {
    if (window.YksMufredatApi && typeof window.YksMufredatApi.resolveKonuCell === "function") {
      var ApiEarly = window.DereceStudentKarneApi;
      if (
        ApiEarly &&
        typeof ApiEarly.resolveKonuLabelForLayoutQuestion === "function" &&
        exam &&
        qNo != null
      ) {
        return ApiEarly.resolveKonuLabelForLayoutQuestion(
          exam,
          qNo,
          layoutCell || { subjectId: sid },
          mxByQ
        );
      }
      var pk0 = window.YksMufredatApi.resolveKonuCell(cell, sid, yazi);
      if (pk0 && pk0.konu) {
        return pk0.kavram ? pk0.konu + " · " + pk0.kavram : pk0.konu;
      }
    }
    var Api = window.DereceStudentKarneApi;
    if (
      Api &&
      typeof Api.resolveKonuLabelForLayoutQuestion === "function" &&
      exam &&
      qNo != null
    ) {
      return Api.resolveKonuLabelForLayoutQuestion(exam, qNo, layoutCell || { subjectId: sid }, mxByQ);
    }
    if (Api && typeof Api.resolveKonuKavramFromCell === "function") {
      var pk = Api.resolveKonuKavramFromCell(cell, sid, yazi);
      if (pk && pk.konu) {
        return Api.formatKonuKavramParsed
          ? Api.formatKonuKavramParsed(pk)
          : pk.kavram
            ? pk.konu + " · " + pk.kavram
            : pk.konu;
      }
    }
    var s = String(cell == null ? "" : cell).trim();
    if (!s) return "Genel";
    if (s.indexOf("|") < 0 && !/^(tyt-|ayt-|ydt$)/i.test(s)) return s;
    return "Genel";
  }

  function resolveMatrixQuestionTopic(q, exam, qNo) {
    var Api = window.DereceStudentKarneApi;
    if (Api && typeof Api.resolveQuestionTopicLabel === "function") {
      return Api.resolveQuestionTopicLabel(q, exam, qNo);
    }
    return (q && q.topicName) || "Genel";
  }

  function bumpQuestion(out, subjName, topicName, resultKind) {
    if (resultKind === "nokey") return;
    var subj = String(subjName || "—").trim() || "—";
    var topic = String(topicName || "Genel").trim() || "Genel";
    var s =
      out.bySubject[subj] ||
      (out.bySubject[subj] = {
        subjectName: subj,
        correct: 0,
        wrong: 0,
        empty: 0,
        asked: 0,
        netSum: 0,
        maxNet: 0,
        rate: 0,
        topics: {},
      });
    var t =
      s.topics[topic] ||
      (s.topics[topic] = {
        correct: 0,
        wrong: 0,
        empty: 0,
        asked: 0,
        netSum: 0,
        maxNet: 0,
        rate: 0,
      });
    s.asked++;
    t.asked++;
    out.total.asked++;
    var earned = resultKind === "correct" ? 1 : resultKind === "wrong" ? -0.25 : 0;
    s.netSum += earned;
    s.maxNet += 1;
    t.netSum += earned;
    t.maxNet += 1;
    out.total.netSum += earned;
    out.total.maxNet += 1;
    if (resultKind === "correct") {
      s.correct++;
      t.correct++;
      out.total.correct++;
    } else if (resultKind === "wrong") {
      s.wrong++;
      t.wrong++;
      out.total.wrong++;
    } else {
      s.empty++;
      t.empty++;
      out.total.empty++;
    }
  }

  function finalizeMasteryRates(out) {
    Object.keys(out.bySubject || {}).forEach(function (sk) {
      var s = out.bySubject[sk];
      s.rate =
        s.maxNet > 0 ? Math.min(100, Math.round(Math.max(0, s.netSum / s.maxNet) * 100)) : 0;
      Object.keys(s.topics || {}).forEach(function (tk) {
        var tp = s.topics[tk];
        tp.rate =
          tp.maxNet > 0 ? Math.min(100, Math.round(Math.max(0, tp.netSum / tp.maxNet) * 100)) : 0;
      });
    });
    out.total.rate =
      out.total.maxNet > 0
        ? Math.min(100, Math.round(Math.max(0, out.total.netSum / out.total.maxNet) * 100))
        : 0;
    out.total.examCount = Object.keys(out.examIds || {}).length;
  }

  function readDenemeExamResults(u) {
    if (
      window.DereceOgrenciSimBridge &&
      typeof window.DereceOgrenciSimBridge.readMergedExamResultsForStudent === "function"
    ) {
      return window.DereceOgrenciSimBridge.readMergedExamResultsForStudent(u);
    }
    if (!C || typeof C.aliasStudentIds !== "function" || typeof C.readJsonArray !== "function") return [];
    var ids = C.aliasStudentIds(u);
    var byKey = {};
    function add(rec) {
      if (!rec || rec.examId == null || rec.examId === "") return;
      var k = String(rec.examId);
      var prev = byKey[k];
      if (!prev || String(rec.savedAt || "") >= String(prev.savedAt || "")) byKey[k] = rec;
    }
    ids.forEach(function (id) {
      C.readJsonArray("examResults_" + id).forEach(add);
    });
    C.readJsonArray("examResults").forEach(add);
    return Object.keys(byKey).map(function (k) {
      return byKey[k];
    });
  }

  function aggregateMatrixRecord(out, r) {
    var EM = window.ExamMatrix;
    if (!EM || typeof EM.getMatrix !== "function" || !r || !r.examId) return;
    var mx = EM.getMatrix(r.examId);
    if (!mx || !Array.isArray(mx.questions) || !mx.questions.length) return;
    var Api = window.DereceStudentKarneApi;
    var poolExam = Api && typeof Api.findExamById === "function" ? Api.findExamById(r.examId) : null;
    out.examIds[String(r.examId)] = true;
    var byQ = {};
    mx.questions.forEach(function (q) {
      byQ[q.qNo] = q;
    });
    (r.answers || []).forEach(function (a) {
      var q = byQ[a.qNo];
      if (!q) return;
      var subj = mufredatSubjectName(q.subjectId) || q.subjectName || "—";
      var topic = resolveMatrixQuestionTopic(q, poolExam, a.qNo);
      var res = a.result;
      var kind = res === "correct" ? "correct" : res === "wrong" ? "wrong" : "empty";
      bumpQuestion(out, subj, topic, kind);
    });
  }

  function bumpSectionNet(out, subjName, netVal, qCount) {
    var subj = String(subjName || "—").trim() || "—";
    var topic = "Bölüm özeti";
    var s =
      out.bySubject[subj] ||
      (out.bySubject[subj] = {
        subjectName: subj,
        correct: 0,
        wrong: 0,
        empty: 0,
        asked: 0,
        netSum: 0,
        maxNet: 0,
        rate: 0,
        topics: {},
      });
    var t =
      s.topics[topic] ||
      (s.topics[topic] = {
        correct: 0,
        wrong: 0,
        empty: 0,
        asked: 0,
        netSum: 0,
        maxNet: 0,
        rate: 0,
      });
    var qc = Math.max(1, qCount || 1);
    var net = Number(netVal) || 0;
    s.asked += qc;
    t.asked += qc;
    out.total.asked += qc;
    s.netSum += net;
    s.maxNet += qc;
    t.netSum += net;
    t.maxNet += qc;
    out.total.netSum += net;
    out.total.maxNet += qc;
  }

  function aggregateDenemeSectionFallback(out, rec, exam, layout) {
    var Api = window.DereceStudentKarneApi;
    if (!Api || typeof Api.getSectionBreakdown !== "function") return;
    var rows = Api.getSectionBreakdown(rec.examId, rec);
    if (!rows.length) return;
    out.examIds[String(rec.examId)] = true;
    var sections = layout.sections || [];
    rows.forEach(function (sec, si) {
      var layoutSec = sections[si];
      var qCount = layoutSec ? Math.max(1, layoutSec.endQ - layoutSec.startQ + 1) : 1;
      var subjName = String(sec.label || "—").trim() || "—";
      bumpSectionNet(out, subjName, sec.net, qCount);
    });
  }

  function aggregateDenemeRecord(out, rec) {
    var Api = window.DereceStudentKarneApi;
    if (!Api || !window.getExamLayout || !rec || rec.examId == null) return;
    var exam = Api.findExamById(rec.examId);
    if (!exam) return;
    var sinav = examSinavNorm(exam);
    var layout = window.getExamLayout(sinav);
    var n = layout.n || 0;
    if (!n) return;

    var arr = exam.cevaplar || [];
    var key = "";
    for (var i = 0; i < n; i++) {
      var L = String(arr[i] || "")
        .toUpperCase()
        .replace(/[^A-E]/g, "")
        .charAt(0);
      key += L || " ";
    }
    if (!key.replace(/\s/g, "").length) {
      aggregateDenemeSectionFallback(out, rec, exam, layout);
      return;
    }

    var raw = String(rec.answers || "")
      .toUpperCase()
      .replace(/[^A-E]/g, "");
    while (raw.length < n) raw += " ";
    var ans = raw.slice(0, n);
    var konuArr = exam.konu || [];
    var konuYazi = exam.konuYazi || [];
    var mxByQ =
      Api && typeof Api.buildExamMatrixByQ === "function" ? Api.buildExamMatrixByQ(exam.id) : {};

    out.examIds[String(rec.examId)] = true;

    for (var q = 0; q < n; q++) {
      var cell = layout.byIndex[q];
      if (!cell) continue;
      var k = key.charAt(q);
      if (!k || k === " ") continue;
      var subjName = mufredatSubjectName(cell.subjectId) || cell.sectionTitle || "—";
      var topicName = resolveKonuTopicName(
        konuArr[q],
        cell.subjectId,
        konuYazi[q],
        exam,
        q + 1,
        cell,
        mxByQ
      );
      var a = ans.charAt(q);
      var kind = !a || a === " " ? "empty" : a === k ? "correct" : "wrong";
      bumpQuestion(out, subjName, topicName, kind);
    }
  }

  function aggregateMasteryFromAllSources(matrixRows, denemeRows) {
    var out = emptyMastery();
    var matrixByExam = {};
    (matrixRows || []).forEach(function (r) {
      if (r && r.examId != null) matrixByExam[String(r.examId)] = r;
    });

    (matrixRows || []).forEach(function (r) {
      aggregateMatrixRecord(out, r);
    });

    (denemeRows || []).forEach(function (rec) {
      if (!rec || rec.examId == null || rec.examId === "") return;
      var eid = String(rec.examId);
      var mx = matrixByExam[eid];
      if (mx && isMatrixShapedAnswers(mx.answers) && mx.answers.length) return;

      if (isMatrixShapedAnswers(rec.answers)) {
        aggregateMatrixRecord(out, {
          examId: eid,
          answers: rec.answers,
          studentId: rec.studentId,
          date: resultDateYmd(rec),
        });
        return;
      }

      var ansStr = typeof rec.answers === "string" ? rec.answers : "";
      if (!ansStr.replace(/\s/g, "").length && rec.net == null && rec.correct == null) return;
      aggregateDenemeRecord(out, rec);
    });

    finalizeMasteryRates(out);
    return out;
  }

  function $(id) {
    return document.getElementById(id);
  }

  function setSkel(id, on) {
    var el = $(id);
    if (!el) return;
    el.classList.toggle("is-on", !!on);
  }

  function setEmpty(id, on) {
    var el = $(id);
    if (!el) return;
    el.classList.toggle("is-on", !!on);
  }

  function destroyRadarChart() {
    if (radarChart) {
      try {
        radarChart.destroy();
      } catch (e) {}
      radarChart = null;
    }
    var r = $("og-mx-radar");
    if (r) r.innerHTML = "";
  }

  function destroyBarChart() {
    if (barChart) {
      try {
        barChart.destroy();
      } catch (e) {}
      barChart = null;
    }
    var b = $("og-mx-bar");
    if (b) b.innerHTML = "";
  }

  function resultDateYmd(r) {
    var d = r && (r.date || (typeof r.savedAt === "string" ? r.savedAt.slice(0, 10) : "") || "");
    return String(d || "").slice(0, 10);
  }

  function resultInRange(r, fromYmd, toYmd) {
    if (!fromYmd && !toYmd) return true;
    var ds = resultDateYmd(r);
    if (!ds) return true;
    if (fromYmd && ds < fromYmd) return false;
    if (toYmd && ds > toYmd) return false;
    return true;
  }

  function readLegacyMatrixShapedResults(userId) {
    var out = [];
    if (!userId) return out;
    try {
      var raw = localStorage.getItem("examResults_" + String(userId).trim());
      if (!raw) return out;
      var arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return out;
      arr.forEach(function (rec) {
        if (!rec || rec.examId == null || rec.examId === "") return;
        if (!Array.isArray(rec.answers) || !rec.answers.length) return;
        var a0 = rec.answers[0];
        if (typeof a0 !== "object" || a0 == null || !("result" in a0)) return;
        out.push({
          examId: String(rec.examId),
          studentId: String(rec.studentId || userId),
          studentName: rec.studentName || rec.name || "",
          date: resultDateYmd(rec) || (rec.savedAt && String(rec.savedAt).slice(0, 10)) || "",
          answers: rec.answers,
        });
      });
    } catch (e) {}
    return out;
  }

  function readLegacyMatrixShapedForAliases(ids) {
    var byExam = {};
    (ids || []).forEach(function (userId) {
      readLegacyMatrixShapedResults(userId).forEach(function (r) {
        var eid = String(r.examId);
        var prev = byExam[eid];
        if (!prev || String(r.date || "").localeCompare(String(prev.date || "")) >= 0) {
          byExam[eid] = r;
        }
      });
    });
    return Object.keys(byExam).map(function (k) {
      return byExam[k];
    });
  }

  function collectMatrixResultsFromAliases(ids, fromYmd, toYmd) {
    var EM = window.ExamMatrix;
    if (!EM) return [];
    var flat = [];
    if (typeof EM.getResultsByStudentIds === "function") {
      EM.getResultsByStudentIds(ids).forEach(function (r) {
        if (!r || !r.examId) return;
        if (!resultInRange(r, fromYmd, toYmd)) return;
        flat.push(r);
      });
    } else if (typeof EM.getResultsByStudent === "function") {
      (ids || []).forEach(function (sid) {
        if (!sid) return;
        EM.getResultsByStudent(sid).forEach(function (r) {
          if (!r || !r.examId) return;
          if (!resultInRange(r, fromYmd, toYmd)) return;
          flat.push(r);
        });
      });
    }
    var byExam = {};
    flat.forEach(function (r) {
      var eid = String(r.examId);
      var prev = byExam[eid];
      if (!prev || String(r.date || "").localeCompare(String(prev.date || "")) >= 0) {
        byExam[eid] = r;
      }
    });
    return Object.keys(byExam).map(function (k) {
      return byExam[k];
    });
  }

  function mergeResultsPreferMatrix(matrixRows, legacyRows) {
    var by = {};
    (legacyRows || []).forEach(function (r) {
      by[String(r.examId)] = r;
    });
    (matrixRows || []).forEach(function (r) {
      by[String(r.examId)] = r;
    });
    return Object.keys(by).map(function (k) {
      return by[k];
    });
  }

  function baseSubjectName(name) {
    return String(name || "")
      .trim()
      .replace(/^(TYT|AYT)\s+/i, "")
      .replace(/\s+/g, " ");
  }

  function allowedSubjectNamesForSinav(sinav) {
    var api = window.YksMufredatApi;
    if (!api || typeof api.getSubjects !== "function") return null;
    var set = {};
    api.getSubjects().forEach(function (s) {
      if (s && s.sinav === sinav && s.name) {
        set[s.name] = true;
        var base = baseSubjectName(s.name);
        if (base) set["__base:" + base.toLocaleLowerCase("tr")] = true;
      }
    });
    return set;
  }

  function subjectMatchesSinavFilter(subjectKey, sinav, allowed) {
    if (!allowed) return true;
    var sk = String(subjectKey || "").trim();
    if (!sk) return false;
    if (allowed[sk]) return true;
    if (allowed[sinav + " " + sk]) return true;
    var skBase = baseSubjectName(sk).toLocaleLowerCase("tr");
    if (allowed["__base:" + skBase]) return true;
    var keys = Object.keys(allowed);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (k.indexOf("__base:") === 0) continue;
      var ab = baseSubjectName(k).toLocaleLowerCase("tr");
      if (ab === skBase) return true;
      if (skBase.length >= 4 && (ab.indexOf(skBase) >= 0 || skBase.indexOf(ab) >= 0)) return true;
    }
    return false;
  }

  function filterMasteryBySinav(mastery, sinav) {
    var allowed = allowedSubjectNamesForSinav(sinav);
    if (!allowed) return mastery;
    var out = emptyMastery();
    out.examIds = mastery.examIds || {};
    Object.keys(mastery.bySubject || {}).forEach(function (sk) {
      if (!subjectMatchesSinavFilter(sk, sinav, allowed)) return;
      out.bySubject[sk] = mastery.bySubject[sk];
    });
    Object.keys(out.bySubject).forEach(function (sk) {
      var s = out.bySubject[sk];
      out.total.correct += s.correct;
      out.total.wrong += s.wrong;
      out.total.empty += s.empty;
      out.total.asked += s.asked;
      out.total.netSum += s.netSum || 0;
      out.total.maxNet += s.maxNet || 0;
    });
    finalizeMasteryRates(out);
    return out;
  }

  function labelForSubject(name) {
    var n = String(name || "").trim();
    if (!n) return n;
    if (/TYT|AYT/i.test(n)) return n;
    var tytRe =
      /^(Türkçe|Matematik|Geometri|Fizik|Kimya|Biyoloji|Tarih|Coğrafya|Felsefe|Din|İngilizce|Sosyal|Fen)/i;
    if (tytRe.test(n)) return "TYT " + n;
    return n;
  }

  function buildRadarPack(mastery) {
    var subs = Object.keys(mastery.bySubject || {}).map(function (k) {
      return mastery.bySubject[k];
    });
    subs.sort(function (a, b) {
      return (b.asked || 0) - (a.asked || 0);
    });
    subs = subs.slice(0, 10);
    return {
      labels: subs.map(function (s) {
        return labelForSubject(s.subjectName || "—");
      }),
      data: subs.map(function (s) {
        return typeof s.rate === "number" ? s.rate : 0;
      }),
    };
  }

  function renderStats(mastery) {
    var t =
      mastery && mastery.total
        ? mastery.total
        : { asked: 0, correct: 0, wrong: 0, empty: 0, rate: 0, examCount: 0, netSum: 0, maxNet: 0 };
    var solved = $("og-mx-stat-solved");
    var dw = $("og-mx-stat-dw");
    var ratio = $("og-mx-stat-dw-ratio");
    var rateEl = $("og-mx-stat-rate");
    if (solved) {
      solved.textContent = t.asked
        ? String(t.asked) + (t.examCount ? " · " + t.examCount + " deneme" : "")
        : t.examCount
          ? "0 soru · " + t.examCount + " deneme"
          : "0";
    }
    if (dw) dw.textContent = t.asked ? t.correct + " / " + t.wrong : "—";
    var wrRatio = t.correct + t.wrong > 0 ? t.wrong / (t.correct + t.wrong) : 0;
    if (ratio) ratio.textContent = t.asked ? "Yanlış oranı ~ %" + Math.round(wrRatio * 100) : "—";
    var rate = typeof t.rate === "number" ? t.rate : 0;
    if (rateEl) rateEl.textContent = t.maxNet ? rate + "%" : "—";
  }

  function renderRadar(pack) {
    destroyRadarChart();
    var el = $("og-mx-radar");
    if (!el || typeof ApexCharts === "undefined") return;

    var labels = pack.labels || [];
    var data = pack.data || [];
    if (!labels.length) {
      setEmpty("og-mx-empty-radar", true);
      setSkel("og-mx-skel-radar", false);
      return;
    }
    setEmpty("og-mx-empty-radar", false);
    setSkel("og-mx-skel-radar", true);

    radarChart = new ApexCharts(el, {
      chart: {
        type: "radar",
        height: 360,
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        toolbar: { show: false },
        animations: { enabled: true, easing: "easeinout", speed: 520 },
        events: {
          mounted: function () {
            setSkel("og-mx-skel-radar", false);
            try {
              if (C && typeof C.notifyParentResize === "function") C.notifyParentResize();
            } catch (e1) {}
          },
        },
      },
      plotOptions: {
        radar: {
          polygons: {
            strokeColors: "#b8c9e6",
            connectorColors: "#b8c9e6",
            fill: { colors: ["#eef3fb", "#f8fafc"] },
          },
        },
      },
      stroke: { width: 2.75, colors: [MX_RADAR_STROKE] },
      fill: { type: "solid", colors: [MX_RADAR_FILL], opacity: MX_RADAR_FILL_OPACITY },
      markers: {
        size: 6,
        strokeWidth: 2,
        strokeColors: "#fff",
        colors: [MX_RADAR_STROKE],
        hover: { size: 7 },
      },
      dataLabels: {
        enabled: true,
        background: {
          enabled: true,
          foreColor: "#fff",
          backgroundColor: MX_RADAR_STROKE,
          borderRadius: 6,
          padding: 5,
          opacity: 1,
          borderWidth: 0,
          dropShadow: { enabled: false },
        },
        style: { fontSize: "11px", fontWeight: 800, colors: ["#ffffff"] },
        formatter: function (val) {
          return Math.round(Number(val) || 0) + "%";
        },
      },
      yaxis: { show: false, min: 0, max: 100, tickAmount: 4 },
      xaxis: {
        categories: labels,
        labels: {
          style: {
            fontSize: "11px",
            fontWeight: 800,
            colors: labels.map(function () {
              return MX_INK;
            }),
          },
        },
      },
      series: [{ name: "Başarı", data: data }],
      colors: [MX_RADAR_STROKE],
      tooltip: {
        theme: "light",
        y: { formatter: function (v) { return (v != null ? Math.round(v) : "—") + "%"; } },
      },
    });
    radarChart.render();
  }

  function buildBarRowsFromMasteryKey(mastery, masteryKey, topicQuery) {
    if (!masteryKey || !mastery || !mastery.bySubject) return [];
    var masterySub = mastery.bySubject[masteryKey];
    if (!masterySub || !masterySub.topics) return [];
    var q = String(topicQuery || "")
      .trim()
      .toLowerCase();
    var rows = [];
    Object.keys(masterySub.topics).forEach(function (tk) {
      if (q && String(tk).toLowerCase().indexOf(q) < 0) return;
      var tp = masterySub.topics[tk];
      rows.push({
        name: tk,
        rate: typeof tp.rate === "number" ? tp.rate : 0,
        asked: tp.asked || 0,
      });
    });
    rows.sort(function (a, b) {
      if (b.asked !== a.asked) return (b.asked || 0) - (a.asked || 0);
      return b.rate - a.rate;
    });
    return rows;
  }

  function buildBarRowsForMufredatSubject(mastery, subjectId, topicQuery) {
    if (!subjectId) return [];
    if (String(subjectId).indexOf("mk:") === 0) {
      return buildBarRowsFromMasteryKey(
        mastery,
        decodeURIComponent(String(subjectId).slice(3)),
        topicQuery
      );
    }
    var api = getMufredatApi();
    if (!api) return [];
    var subj =
      typeof api.getSubject === "function" ? api.getSubject(subjectId) : null;
    if (!subj) return [];
    var masteryKey = findMasterySubjectKey(mastery, subj.name);
    var masterySub = masteryKey && mastery.bySubject ? mastery.bySubject[masteryKey] : null;
    var mTopics =
      typeof api.getTopics === "function" ? api.getTopics(subjectId) || [] : [];
    var q = String(topicQuery || "")
      .trim()
      .toLowerCase();
    var rows = [];
    var seen = {};

    mTopics.forEach(function (t) {
      if (!t || !t.name) return;
      if (q && String(t.name).toLowerCase().indexOf(q) < 0) return;
      var tp = matchMatrixTopic(masterySub && masterySub.topics, t.name);
      var rate = typeof tp.rate === "number" ? tp.rate : 0;
      rows.push({ name: t.name, rate: rate, asked: tp.asked || 0 });
      seen[normTopicKey(t.name)] = true;
    });

    if (masterySub && masterySub.topics) {
      Object.keys(masterySub.topics).forEach(function (tk) {
        if (seen[normTopicKey(tk)]) return;
        if (q && String(tk).toLowerCase().indexOf(q) < 0) return;
        var tp = masterySub.topics[tk];
        rows.push({
          name: tk,
          rate: typeof tp.rate === "number" ? tp.rate : 0,
          asked: tp.asked || 0,
        });
      });
    }

    rows.sort(function (a, b) {
      if (b.asked !== a.asked) return (b.asked || 0) - (a.asked || 0);
      return b.rate - a.rate;
    });
    return rows;
  }

  function renderBarForSubject(mastery, subjectId, topicQuery) {
    var el = $("og-mx-bar");
    if (!el || typeof ApexCharts === "undefined") return;

    destroyBarChart();

    if (!subjectId) {
      setEmpty("og-mx-empty-bar", true);
      setSkel("og-mx-skel-bar", false);
      return;
    }

    var rows = buildBarRowsForMufredatSubject(mastery, subjectId, topicQuery);

    if (!rows.length) {
      setEmpty("og-mx-empty-bar", true);
      setSkel("og-mx-skel-bar", false);
      return;
    }
    setEmpty("og-mx-empty-bar", false);
    setSkel("og-mx-skel-bar", true);

    var cats = rows.map(function (x) {
      return x.name;
    });
    var vals = rows.map(function (x) {
      return x.rate;
    });

    barChart = new ApexCharts(el, {
      chart: {
        type: "bar",
        height: Math.max(320, rows.length * 28),
        toolbar: { show: false },
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        animations: { enabled: true, speed: 480 },
        events: {
          mounted: function () {
            setSkel("og-mx-skel-bar", false);
            try {
              if (C && typeof C.notifyParentResize === "function") C.notifyParentResize();
            } catch (e2) {}
          },
        },
      },
      plotOptions: {
        bar: { horizontal: true, borderRadius: 6, barHeight: "72%", distributed: false },
      },
      dataLabels: {
        enabled: true,
        formatter: function (v) {
          return Math.round(v) + "%";
        },
        offsetX: 6,
        style: { fontSize: "11px", fontWeight: 800, colors: ["#ffffff"] },
      },
      xaxis: {
        categories: cats,
        max: 100,
        labels: {
          style: { colors: MX_INK, fontWeight: 700 },
          formatter: function (v) {
            return Math.round(v);
          },
        },
      },
      yaxis: {
        labels: {
          maxWidth: 260,
          style: { fontSize: "12px", fontWeight: 800, colors: [MX_INK] },
        },
      },
      series: [{ name: "Başarı %", data: vals }],
      colors: [MX_INK],
      fill: { colors: [MX_INK], opacity: 0.85 },
      grid: { strokeDashArray: 4, borderColor: MX_GRID },
      tooltip: {
        y: {
          formatter: function (v, opts) {
            var i = opts.dataPointIndex;
            var r = rows[i];
            return Math.round(v) + "% · " + (r && r.asked ? r.asked + " soru" : "");
          },
        },
      },
    });
    barChart.render();
  }

  function criticalTopicsBelow40(mastery) {
    var out = [];
    if (!mastery || !mastery.bySubject) return out;
    Object.keys(mastery.bySubject).forEach(function (sk) {
      var sub = mastery.bySubject[sk];
      Object.keys(sub.topics || {}).forEach(function (tk) {
        var t = sub.topics[tk];
        if (!t || !t.asked) return;
        var rate = typeof t.rate === "number" ? t.rate : 0;
        if (rate < 40) {
          out.push({
            subject: sk,
            topic: tk,
            rate: rate,
            asked: t.asked,
            wrong: t.wrong != null ? t.wrong : Math.max(0, t.asked - (t.correct || 0)),
          });
        }
      });
    });
    out.sort(function (a, b) {
      if (a.rate !== b.rate) return a.rate - b.rate;
      return (b.asked || 0) - (a.asked || 0);
    });
    return out;
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function renderCritical(mastery) {
    var host = $("og-mx-critical-list");
    if (!host) return;
    host.innerHTML = "";
    var list = criticalTopicsBelow40(mastery);
    if (!list.length) {
      host.innerHTML =
        '<p style="margin:0;font-size:0.88rem;font-weight:600;color:var(--text-muted);">' +
        "Şu an başarısı %40 altında ve yeterli veriyle ölçülmüş kritik konu yok. Harika gidiyorsun — yine de düzenli tekrar önerilir." +
        "</p>";
      return;
    }
    list.forEach(function (row) {
      var div = document.createElement("div");
      div.className = "og-mx-critical-item";
      div.innerHTML =
        '<span class="og-mx-critical-badge">Acil tekrar</span>' +
        '<span class="og-mx-critical-topic">' +
        escapeHtml(row.subject) +
        " — " +
        escapeHtml(row.topic) +
        "</span>" +
        '<span class="og-mx-critical-meta">Başarı %' +
        escapeHtml(String(row.rate)) +
        " · " +
        escapeHtml(String(row.asked)) +
        " soru · " +
        escapeHtml(String(row.wrong)) +
        " yanlış</span>";
      host.appendChild(div);
    });
  }

  function updateBarChartTitle() {
    var h = $("og-mx-bar-title");
    if (!h) return;
    var sid = state.selectedSubjectId || ($("og-mx-ders") && $("og-mx-ders").value);
    if (sid && String(sid).indexOf("mk:") === 0) {
      h.textContent =
        "Konu bazlı başarı — " + decodeURIComponent(String(sid).slice(3));
      return;
    }
    var api = getMufredatApi();
    if (api && sid && typeof api.getSubject === "function") {
      var s = api.getSubject(sid);
      if (s && s.name) {
        h.textContent = "Konu bazlı başarı — " + s.name;
        return;
      }
    }
    h.textContent = "Konu bazlı başarı (seçili ders)";
  }

  function fillDersSelect(mastery) {
    var sel = $("og-mx-ders");
    if (!sel) return;
    var prev = sel.value || state.selectedSubjectId;
    var subjects = subjectsForSelect(mastery, state.examSinav);
    sel.innerHTML = "";

    if (!subjects.length) {
      var o0 = document.createElement("option");
      o0.value = "";
      o0.textContent = getMufredatApi()
        ? "— Bu sınav için ders yok —"
        : Object.keys((mastery && mastery.bySubject) || {}).length
          ? "— Ders eşleşmesi yok —"
          : "— Müfredat yükleniyor… —";
      sel.appendChild(o0);
      sel.disabled = true;
      state.selectedSubjectId = "";
      return;
    }

    sel.disabled = false;
    subjects.forEach(function (s) {
      var o = document.createElement("option");
      o.value = s.id;
      var label = s.name;
      var mk = s.masteryKey || findMasterySubjectKey(mastery, s.name);
      if (mk && mastery.bySubject[mk] && mastery.bySubject[mk].asked) {
        label += " · " + mastery.bySubject[mk].asked + " soru";
      }
      o.textContent = label;
      if (mk) o.setAttribute("data-mastery-key", mk);
      sel.appendChild(o);
    });

    var stillValid = subjects.some(function (s) {
      return s.id === prev;
    });
    sel.value = stillValid ? prev : subjects[0].id;
    state.selectedSubjectId = sel.value;
  }

  function refreshAll(opts) {
    opts = opts || {};
    if (!C) return;
    var u = C.getCurrentUser();
    if (!u) {
      window.location.replace("../login.html");
      return;
    }
    try {
      if (typeof window.ensureDereceStudentCatalog === "function") {
        window.ensureDereceStudentCatalog();
      }
    } catch (eCat) {}

    if (window.DereceStudentKarneApi && typeof window.DereceStudentKarneApi.refreshExams === "function") {
      window.DereceStudentKarneApi.refreshExams();
    }

    var strictId = String(u.id || "").trim();
    var ids = typeof C.aliasStudentIds === "function" ? C.aliasStudentIds(u) : [];
    if (strictId && ids.indexOf(strictId) < 0) ids.unshift(strictId);

    var fromYmd = "";
    var toYmd = "";
    var sig = ids.join(",") + "|" + fromYmd + "|" + toYmd;

    if (!opts.skipDataReload || !state.rawMergedResults || state.dataSig !== sig) {
      var matrixRows = window.ExamMatrix ? collectMatrixResultsFromAliases(ids, fromYmd, toYmd) : [];
      var legacyRows = readLegacyMatrixShapedForAliases(ids).filter(function (r) {
        return resultInRange(r, fromYmd, toYmd);
      });
      var mergedMatrix = mergeResultsPreferMatrix(matrixRows, legacyRows);
      var denemeRows = readDenemeExamResults(u).filter(function (rec) {
        return resultInRange({ date: resultDateYmd(rec), savedAt: rec.savedAt }, fromYmd, toYmd);
      });
      state.rawMergedResults = { matrix: mergedMatrix, deneme: denemeRows };
      state.dataSig = sig;
      state.masteryRaw = aggregateMasteryFromAllSources(mergedMatrix, denemeRows);
    }

    var masteryRaw = state.masteryRaw || emptyMastery();
    var mastery = filterMasteryBySinav(masteryRaw, state.examSinav);
    if (
      !Object.keys(mastery.bySubject || {}).length &&
      Object.keys(masteryRaw.bySubject || {}).length
    ) {
      mastery = masteryRaw;
    }
    state.masteryFiltered = mastery;

    renderStats(mastery);
    fillDersSelect(mastery);
    updateBarChartTitle();
    renderCritical(mastery);

    function paintCharts() {
      var pack = buildRadarPack(mastery);
      if (!pack.labels.length) {
        setEmpty("og-mx-empty-radar", true);
        setSkel("og-mx-skel-radar", false);
        destroyRadarChart();
      } else {
        renderRadar(pack);
      }

      var dersId = state.selectedSubjectId || ($("og-mx-ders") && $("og-mx-ders").value) || "";
      if (!dersId) {
        destroyBarChart();
        setEmpty("og-mx-empty-bar", true);
      } else {
        renderBarForSubject(mastery, dersId, "");
      }
      try {
        if (C && typeof C.notifyParentResize === "function") C.notifyParentResize();
      } catch (e0) {}
    }

    ensureApexCharts()
      .then(paintCharts)
      .catch(function () {
        paintCharts();
      });
  }

  function wire() {
    var tyt = $("og-mx-exam-tyt");
    var ayt = $("og-mx-exam-ayt");
    if (tyt)
      tyt.addEventListener("click", function () {
        state.examSinav = "TYT";
        tyt.classList.add("mr-toggle__btn--active");
        ayt.classList.remove("mr-toggle__btn--active");
        tyt.setAttribute("aria-pressed", "true");
        ayt.setAttribute("aria-pressed", "false");
        refreshAll({ skipDataReload: true });
      });
    if (ayt)
      ayt.addEventListener("click", function () {
        state.examSinav = "AYT";
        ayt.classList.add("mr-toggle__btn--active");
        tyt.classList.remove("mr-toggle__btn--active");
        ayt.setAttribute("aria-pressed", "true");
        tyt.setAttribute("aria-pressed", "false");
        refreshAll({ skipDataReload: true });
      });

    var sel = $("og-mx-ders");
    if (sel)
      sel.addEventListener("change", function () {
        state.selectedSubjectId = sel.value || "";
        updateBarChartTitle();
        var m = state.masteryFiltered;
        if (!m) return;
        renderBarForSubject(m, state.selectedSubjectId, "");
        try {
          if (C && typeof C.notifyParentResize === "function") C.notifyParentResize();
        } catch (e3) {}
      });

    window.addEventListener("storage", function (e) {
      if (!e) return;
      if (
        e.key === "derece_exam_results_matrix_v1" ||
        e.key === "derece_exam_matrix_v1" ||
        e.key === "kurum_denemeler_v1" ||
        e.key === "global_denemeler_v1" ||
        e.key === "kurumsalExams" ||
        e.key === "globalExams" ||
        e.key === "examResults" ||
        e.key === "derece_exam_matrix_v1" ||
        e.key === "derece_exam_results_matrix_v1" ||
        (e.key && e.key.indexOf("examResults_") === 0)
      ) {
        refreshAll();
      }
    });
    window.addEventListener("examResults:change", refreshAll);
    window.addEventListener("mr:session-changed", refreshAll);
  }

  function boot() {
    if (!C) return;
    bindMufredatReadyOnce();
    wire();
    function start() {
      if (window.OgrenciMufredatGate && typeof window.OgrenciMufredatGate.assertScriptOrder === "function") {
        window.OgrenciMufredatGate.assertScriptOrder("ogrenci-mr-matrix");
      }
      if (window.OgStudentPerf && typeof window.OgStudentPerf.runAfterPaint === "function") {
        window.OgStudentPerf.runAfterPaint(refreshAll);
      } else {
        refreshAll();
      }
    }
    if (window.OgrenciMufredatGate && typeof window.OgrenciMufredatGate.ensureReady === "function") {
      window.OgrenciMufredatGate.ensureReady(start);
    } else {
      ensureMufredatThen(start);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
