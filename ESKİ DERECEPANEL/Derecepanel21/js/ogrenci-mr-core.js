/**
 * Öğrenci MR modülü — ortak oturum, examResults izolasyonu, efor günlüğü anahtarları.
 * Matrix sayfası: öncelik currentUser.id ile ExamMatrix + examResults eşlemesi.
 */
(function () {
  "use strict";

  var LESSONS = [
    "Türkçe",
    "Matematik",
    "Geometri",
    "Fizik",
    "Kimya",
    "Biyoloji",
    "Tarih",
    "Coğrafya",
    "Felsefe",
    "Edebiyat",
    "Din Kültürü ve Ahlak Bilgisi",
    "İngilizce",
    "Diğer",
  ];

  function slugFromName(name) {
    var n = String(name || "")
      .trim()
      .toLowerCase()
      .replace(/ı/g, "i")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return n || "ogrenci";
  }

  function canonicalStudentId(u) {
    if (!u || typeof u !== "object") return "";
    var oid = String(u.id || u.ogrenciId || "").trim();
    if (oid) return oid;
    var code = String(u.studentCode || u.code || "").trim();
    if (code) return code.toLowerCase().replace(/\s+/g, "-");
    return slugFromName(u.name);
  }

  /** Oturum kimliği — Matrix / sınav eşlemesi için öncelik: currentUser.id */
  function strictSessionStudentId(u) {
    if (!u) return "";
    var id = String(u.id || "").trim();
    if (id) return id;
    return canonicalStudentId(u);
  }

  function catalogIdForUser(u) {
    if (!u) return "";
    var list = window.DereceStudentCatalog || [];
    var uname = String(u.name || "").trim();
    var code = String(u.studentCode || "").trim();
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (!c) continue;
      if (code && String(c.code || "").trim() === code) return String(c.id || "").trim();
      if (uname && String(c.name || "").trim() === uname) return String(c.id || "").trim();
    }
    return "";
  }

  function aliasStudentIds(u) {
    var primary = canonicalStudentId(u);
    var out = [];
    function add(x) {
      x = String(x || "").trim();
      if (!x || out.indexOf(x) !== -1) return;
      out.push(x);
    }
    add(primary);
    add(u && u.id);
    add(u && u.ogrenciId);
    var code = String((u && u.studentCode) || (u && u.code) || "").trim();
    if (code) {
      add(code);
      add(code.toLowerCase().replace(/\s+/g, "-"));
    }
    add(catalogIdForUser(u));
    add(u && u.kullaniciAdi);
    add(slugFromName(u && u.name));
    return out;
  }

  function mrDataKey(primary) {
    return "mr_data_student_" + primary;
  }

  function effortLogKey(primary) {
    return "student_effort_log_" + primary;
  }

  function examResultsKeyForId(id) {
    return "examResults_" + id;
  }

  function readJsonArray(key) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return [];
      var a = JSON.parse(raw);
      return Array.isArray(a) ? a : [];
    } catch (e) {
      return [];
    }
  }

  function readMrDataShell(primary) {
    try {
      var raw = localStorage.getItem(mrDataKey(primary));
      if (!raw) return {};
      var o = JSON.parse(raw);
      return o && typeof o === "object" ? o : {};
    } catch (e2) {
      return {};
    }
  }

  function touchMrDataStudent(primary) {
    try {
      var cur = readMrDataShell(primary);
      cur.v = 1;
      cur.lastStudentMrActivityAt = new Date().toISOString();
      localStorage.setItem(mrDataKey(primary), JSON.stringify(cur));
    } catch (e) {}
  }

  function belongsToSession(rec, aliasIds, u) {
    if (!rec) return false;
    var sid = String(rec.studentId || "").trim();
    var sc = String(rec.studentCode || "").trim();
    for (var i = 0; i < aliasIds.length; i++) {
      var aid = String(aliasIds[i] || "").trim();
      if (aid && (sid === aid || sc === aid)) return true;
    }
    var nm = String(rec.name || rec.studentName || "").trim();
    if (u && nm && nm === String(u.name || "").trim()) return true;
    return false;
  }

  /**
   * examResults + examResults_* — yalnızca currentUser.id ile eşleşen kayıtlar (varsa).
   * id yoksa güvenli geri dönüş: alias + isim eşlemesi (eski veri).
   */
  function readExamResultsForSession(u) {
    var strictId = String(u && u.id ? u.id : "").trim();
    var aliasIds = aliasStudentIds(u);
    var byExam = {};
    function ingest(rec) {
      if (!rec || rec.examId == null || rec.examId === "") return;
      if (strictId) {
        if (String(rec.studentId || "").trim() !== strictId) return;
      } else {
        if (!belongsToSession(rec, aliasIds, u)) return;
      }
      var k = String(rec.examId);
      var prev = byExam[k];
      if (!prev || String(rec.savedAt || "") >= String(prev.savedAt || "")) byExam[k] = rec;
    }
    if (strictId) {
      readJsonArray(examResultsKeyForId(strictId)).forEach(ingest);
    } else {
      aliasIds.forEach(function (aid) {
        readJsonArray(examResultsKeyForId(aid)).forEach(ingest);
      });
    }
    readJsonArray("examResults").forEach(ingest);
    return Object.keys(byExam)
      .map(function (k) {
        return byExam[k];
      })
      .sort(function (a, b) {
        return String(b.savedAt || "").localeCompare(String(a.savedAt || ""));
      });
  }

  function pickMatrixMasteryForSession(u) {
    if (!window.ExamMatrix || typeof window.ExamMatrix.getSubjectMastery !== "function") return null;
    var strictId = String(u && u.id ? u.id : "").trim();
    var order = [];
    if (strictId) order.push(strictId);
    aliasStudentIds(u).forEach(function (x) {
      if (order.indexOf(x) === -1) order.push(x);
    });
    for (var i = 0; i < order.length; i++) {
      var id = order[i];
      if (!id) continue;
      var m = window.ExamMatrix.getSubjectMastery(id);
      if (m && m.bySubject && Object.keys(m.bySubject).length) return m;
    }
    return null;
  }

  function buildRadarFromMastery(mastery) {
    var subs = Object.keys(mastery.bySubject || {}).map(function (k) {
      return mastery.bySubject[k];
    });
    subs.sort(function (a, b) {
      return (b.asked || 0) - (a.asked || 0);
    });
    subs = subs.slice(0, 10);
    var labels = subs.map(function (s) {
      return s.subjectName || "—";
    });
    var data = subs.map(function (s) {
      return typeof s.rate === "number" ? s.rate : 0;
    });
    return { labels: labels, data: data };
  }

  /** Konu bazlı zayıf alanlar — düşük başarı oranı önce */
  function buildWeakTopicsFromMastery(mastery, limit) {
    var lim = limit || 10;
    if (!mastery || !mastery.bySubject) return [];
    var rows = [];
    Object.keys(mastery.bySubject).forEach(function (sk) {
      var sub = mastery.bySubject[sk];
      var topics = sub.topics || {};
      Object.keys(topics).forEach(function (tk) {
        var t = topics[tk];
        if (!t || !t.asked) return;
        var rate = typeof t.rate === "number" ? t.rate : 0;
        rows.push({
          subject: sub.subjectName || sk,
          topic: tk,
          asked: t.asked,
          wrong: t.wrong != null ? t.wrong : Math.max(0, t.asked - (t.correct || 0)),
          rate: rate,
        });
      });
    });
    rows.sort(function (a, b) {
      if (a.rate !== b.rate) return a.rate - b.rate;
      return (b.wrong || 0) - (a.wrong || 0);
    });
    return rows.slice(0, lim);
  }

  function readEffortLog(primary) {
    return readJsonArray(effortLogKey(primary));
  }

  function writeEffortLog(primary, list) {
    try {
      localStorage.setItem(effortLogKey(primary), JSON.stringify(list));
    } catch (e) {}
  }

  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function formatNow() {
    var d = new Date();
    return (
      d.getFullYear() +
      "-" +
      pad2(d.getMonth() + 1) +
      "-" +
      pad2(d.getDate()) +
      " " +
      pad2(d.getHours()) +
      ":" +
      pad2(d.getMinutes())
    );
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function notifyParentResize() {
    if (window.OgStudentPerf && typeof window.OgStudentPerf.notifyParentResize === "function") {
      window.OgStudentPerf.notifyParentResize();
      return;
    }
    try {
      if (window.parent !== window) {
        window.parent.postMessage({ type: "og-iframe-content" }, "*");
      }
    } catch (e) {}
  }

  function fillLessonSelect(selId) {
    var sel = document.getElementById(selId || "og-mr-ders");
    if (!sel) return;
    sel.innerHTML = "";
    LESSONS.forEach(function (L) {
      var o = document.createElement("option");
      o.value = L;
      o.textContent = L;
      sel.appendChild(o);
    });
  }

  function getCurrentUser() {
    if (window.OgStudentPerf && typeof window.OgStudentPerf.getCurrentUser === "function") {
      return window.OgStudentPerf.getCurrentUser();
    }
    try {
      var raw = localStorage.getItem("currentUser");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  window.OgrenciMrCore = {
    LESSONS: LESSONS,
    getCurrentUser: getCurrentUser,
    canonicalStudentId: canonicalStudentId,
    strictSessionStudentId: strictSessionStudentId,
    aliasStudentIds: aliasStudentIds,
    readExamResultsForSession: readExamResultsForSession,
    pickMatrixMasteryForSession: pickMatrixMasteryForSession,
    buildRadarFromMastery: buildRadarFromMastery,
    buildWeakTopicsFromMastery: buildWeakTopicsFromMastery,
    readEffortLog: readEffortLog,
    writeEffortLog: writeEffortLog,
    effortLogKey: effortLogKey,
    touchMrDataStudent: touchMrDataStudent,
    readMrDataShell: readMrDataShell,
    mrDataKey: mrDataKey,
    readJsonArray: readJsonArray,
    escapeHtml: escapeHtml,
    formatNow: formatNow,
    pad2: pad2,
    notifyParentResize: notifyParentResize,
    fillLessonSelect: fillLessonSelect,
  };
})();
