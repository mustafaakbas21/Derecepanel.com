/**
 * YKS simülasyon köprüsü — hedef (tercih), deneme netleri, konu tamamlama, matrix uyumu
 */
(function () {
  "use strict";

  var NS_TO_SUBJECTS = {
    tyt_tr: ["tyt-tr"],
    tyt_mat: ["tyt-mat", "tyt-geo"],
    tyt_fen: ["tyt-fiz", "tyt-kim", "tyt-biyo"],
    tyt_sos: ["tyt-tar", "tyt-cog", "tyt-fel", "tyt-din"],
    ayt_mat: ["ayt-mat", "ayt-geo"],
    ayt_fiz: ["ayt-fiz"],
    ayt_kim: ["ayt-kim"],
    ayt_bio: ["ayt-biyo"],
    ayt_edb: ["ayt-edeb"],
    ayt_tar1: ["ayt-tar1"],
    ayt_cog1: ["ayt-cog1"],
    ayt_tar2: ["ayt-tar2"],
    ayt_cog2: ["ayt-cog2"],
    ayt_dil: ["ydt"],
  };

  function getCurrentUser() {
    try {
      var raw = localStorage.getItem("currentUser");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function catalogIdForUser(u) {
    if (!u) return "";
    var list = window.DereceStudentCatalog || [];
    var uname = String(u.name || "").trim();
    var code = String(u.studentCode || "").trim();
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (!c) continue;
      if (code && String(c.code || "").trim() === code) return c.id;
      if (uname && String(c.name || "").trim() === uname) return c.id;
    }
    return "";
  }

  function studentCodeForUser(u) {
    if (!u) return "";
    var code = String(u.studentCode || "").trim();
    if (code) return code;
    var cid = catalogIdForUser(u);
    var cat = (window.DereceStudentCatalog || []).find(function (s) {
      return s && s.id === cid;
    });
    return cat && cat.code ? String(cat.code).trim() : "";
  }

  /** Koç atamaları / depolarla uyumlu birincil yazma kimliği */
  function primaryWriteId(u) {
    return catalogIdForUser(u) || studentCodeForUser(u) || String((u && u.kullaniciAdi) || "").trim();
  }

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
    return n || "";
  }

  function storageKeyCandidates(u) {
    var out = [];
    var seen = {};
    function add(k) {
      k = String(k || "").trim();
      if (!k || seen[k]) return;
      seen[k] = true;
      out.push(k);
    }
    if (!u) return out;
    add(catalogIdForUser(u));
    add(studentCodeForUser(u));
    add(u.id);
    add(u.ogrenciId);
    add(u.kullaniciAdi);
    add(u.username);
    add(u.userName);
    add(u.login);
    if (u.email) {
      var em = String(u.email).trim();
      add(em);
      var at = em.indexOf("@");
      if (at > 0) add(em.slice(0, at));
    }
    add(slugFromName(u.name));
    if (!out.length) add(primaryWriteId(u));
    return out;
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

  function sameStudent(rec, ids, u) {
    if (!rec) return false;
    var sid = String(rec.studentId || "").trim();
    var sc = String(rec.studentCode || "").trim();
    for (var i = 0; i < ids.length; i++) {
      if (ids[i] && (sid === ids[i] || sc === ids[i])) return true;
    }
    var nm = String(rec.name || rec.studentName || "").trim();
    if (u && nm && nm === String(u.name || "").trim()) return true;
    return false;
  }

  function readMergedExamResultsForStudent(u) {
    var ids = storageKeyCandidates(u);
    var byKey = {};
    function add(rec) {
      if (!rec || rec.examId == null || rec.examId === "") return;
      if (!sameStudent(rec, ids, u)) return;
      var k = String(rec.examId);
      var prev = byKey[k];
      if (!prev || String(rec.savedAt || "") >= String(prev.savedAt || "")) byKey[k] = rec;
    }
    ids.forEach(function (id) {
      readJsonArray("examResults_" + id).forEach(add);
    });
    readJsonArray("examResults").forEach(add);
    var out = Object.keys(byKey).map(function (k) {
      return byKey[k];
    });
    out.sort(function (a, b) {
      var ta = Date.parse(String(a.savedAt || "").slice(0, 19)) || 0;
      var tb = Date.parse(String(b.savedAt || "").slice(0, 19)) || 0;
      if (ta !== tb) return ta - tb;
      return String(a.examName || "").localeCompare(String(b.examName || ""), "tr");
    });
    return out;
  }

  function getLastExamRecord(u) {
    var rows = readMergedExamResultsForStudent(u);
    return rows.length ? rows[rows.length - 1] : null;
  }

  function normalizeLetter(c) {
    return String(c || "")
      .toUpperCase()
      .replace(/[^A-E]/g, "")
      .charAt(0) || "";
  }

  function buildStudentAnswers(rec, n) {
    var raw = String((rec && rec.answers) || "")
      .toUpperCase()
      .replace(/[^A-E]/g, "");
    while (raw.length < n) raw += " ";
    return raw.slice(0, n);
  }

  function buildKeyString(exam, n) {
    var arr = (exam && exam.cevaplar) || [];
    var s = "";
    for (var i = 0; i < n; i++) {
      var L = normalizeLetter(arr[i]);
      s += L || " ";
    }
    while (s.length < n) s += " ";
    return s.slice(0, n);
  }

  function dynNetFromIndices(ans, key, indices) {
    var d = 0;
    var y = 0;
    var b = 0;
    for (var j = 0; j < indices.length; j++) {
      var i = indices[j];
      var k = key.charAt(i);
      var a = ans.charAt(i);
      if (!k || k === " ") {
        b++;
        continue;
      }
      if (!a || a === " ") b++;
      else if (a === k) d++;
      else y++;
    }
    return Math.round((d - y / 4) * 10) / 10;
  }

  function indicesForNsBranch(byIndex, branchId) {
    var ids = NS_TO_SUBJECTS[branchId];
    if (!ids || !ids.length || !byIndex || !byIndex.length) return [];
    var set = {};
    for (var i = 0; i < ids.length; i++) set[ids[i]] = true;
    var ix = [];
    for (var j = 0; j < byIndex.length; j++) {
      var sid = (byIndex[j] && byIndex[j].subjectId) || "";
      if (set[sid]) ix.push(j);
    }
    return ix;
  }

  /**
   * Son deneme kaydından Net Sihirbazı branş id'lerine (tyt_mat vb.) net üretir.
   */
  function computeNsBranchNetsFromRecord(rec) {
    var out = {};
    if (!rec || !window.getExamLayout || !window.DereceStudentKarneApi) return out;
    var exam = window.DereceStudentKarneApi.findExamById(rec.examId);
    if (!exam) return out;
    var sinavRaw = String(exam.sinav || exam.tur || "TYT").toUpperCase();
    var sinav = sinavRaw;
    if (sinav === "YKS" || sinav === "GENEL") sinav = "TYT";
    if (sinav !== "AYT" && sinav !== "YDT") sinav = "TYT";
    var layout = window.getExamLayout(sinav);
    var n = layout.n || 0;
    if (!n || !layout.byIndex || !layout.byIndex.length) return out;
    var keyStr = buildKeyString(exam, n);
    if (!keyStr.replace(/\s/g, "").length) return out;
    var ans = buildStudentAnswers(rec, n);
    var branchIds = Object.keys(NS_TO_SUBJECTS);
    for (var b = 0; b < branchIds.length; b++) {
      var bid = branchIds[b];
      var ix = indicesForNsBranch(layout.byIndex, bid);
      if (!ix.length) continue;
      var net = dynNetFromIndices(ans, keyStr, ix);
      if (Number.isFinite(net)) out[bid] = net;
    }
    return out;
  }

  var STUDENTS_FULL_KEYS = ["derecepanel_students_full_v1", "students"];

  function formatGoalLabelFromTarget(o) {
    if (!o || typeof o !== "object") return "";
    var uni = String(o.universite || o.university || "").trim();
    var bol = String(o.bolum || o.department || "").trim();
    if (!uni && !bol) return "";
    if (uni && bol) return uni + " – " + bol;
    return uni || bol;
  }

  var TARGET_REV_KEY = "derece_student_target_rev";

  function targetRevisionBump() {
    var rev = String(Date.now());
    try {
      sessionStorage.setItem(TARGET_REV_KEY, rev);
    } catch (e) {}
    return rev;
  }

  function readStudentTargetForUser(u) {
    var tries = storageKeyCandidates(u);
    var best = null;
    var bestMs = 0;
    for (var i = 0; i < tries.length; i++) {
      if (!tries[i]) continue;
      try {
        var raw = localStorage.getItem("student_target_" + tries[i]);
        if (!raw || !String(raw).trim()) continue;
        var o = JSON.parse(raw);
        if (!o || !(o.universite || o.bolum || o.university || o.department)) continue;
        var ms = Date.parse(o.setAt || "") || 0;
        if (!best || ms >= bestMs) {
          best = o;
          bestMs = ms;
        }
      } catch (e) {}
    }
    return best;
  }

  function studentMatchesPayload(p, u, ids) {
    if (!p || !u) return false;
    var code = studentCodeForUser(u);
    var name = String(u.name || "").trim();
    var cid = catalogIdForUser(u);
    var uid = String(u.id || "").trim();
    var ogid = String(u.ogrenciId || "").trim();
    if (cid && String(p.ogrenciId || p.id || "").trim() === cid) return true;
    if (uid && String(p.id || p.ogrenciId || "").trim() === uid) return true;
    if (ogid && String(p.ogrenciId || p.id || "").trim() === ogid) return true;
    for (var i = 0; i < ids.length; i++) {
      var id = ids[i];
      if (!id) continue;
      if (String(p.ogrenciId || p.id || "").trim() === id) return true;
      if (String(p.studentCode || "").trim() === id) return true;
      if (String(p.kullaniciAdi || "").trim() === id) return true;
    }
    if (code && String(p.studentCode || "").trim() === code) return true;
    if (name && String(p.name || "").trim() === name) return true;
    return false;
  }

  function syncGoalToStudentsFull(u, goalLabel) {
    var ids = storageKeyCandidates(u);
    var label = String(goalLabel || "").trim();
    var any = false;
    STUDENTS_FULL_KEYS.forEach(function (storageKey) {
      try {
        var raw = localStorage.getItem(storageKey);
        var arr = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(arr)) return;
        var changed = false;
        for (var i = 0; i < arr.length; i++) {
          if (!studentMatchesPayload(arr[i], u, ids)) continue;
          arr[i].goal = label;
          changed = true;
        }
        if (changed) {
          localStorage.setItem(storageKey, JSON.stringify(arr));
          any = true;
        }
      } catch (e) {}
    });
    if (any) {
      try {
        if (typeof window.ensureDereceStudentCatalog === "function") {
          window.ensureDereceStudentCatalog();
        } else if (typeof window.syncDereceStudentCatalog === "function") {
          window.syncDereceStudentCatalog();
        }
      } catch (e2) {}
    }
    return any;
  }

  function updateCurrentUserGoal(goalLabel) {
    try {
      var raw = localStorage.getItem("currentUser");
      if (!raw) return;
      var u = JSON.parse(raw);
      if (!u || typeof u !== "object") return;
      u.goal = String(goalLabel || "").trim();
      localStorage.setItem("currentUser", JSON.stringify(u));
    } catch (e) {}
  }

  function notifyStudentTargetChanged(ids) {
    targetRevisionBump();
    try {
      window.dispatchEvent(
        new CustomEvent("derece:student-target-changed", {
          detail: { ids: ids || [] },
        })
      );
    } catch (e) {}
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: "derece-student-target-updated" }, "*");
      }
    } catch (e2) {}
    try {
      if (window.top && window.top !== window) {
        window.top.postMessage({ type: "derece-student-target-updated" }, "*");
      }
    } catch (e3) {}
  }

  /** Tercih Sihirbazı «Hedefim Yap» — tüm kimlik anahtarları + koç CRM goal alanı */
  function saveStudentTargetForUser(u, hedefData) {
    if (!u || !hedefData || typeof hedefData !== "object") return false;
    var uni = String(hedefData.universite || hedefData.university || "").trim();
    var bol = String(hedefData.bolum || hedefData.department || "").trim();
    if (!uni && !bol) return false;
    var payload = Object.assign({}, hedefData, {
      universite: uni,
      bolum: bol,
      setAt: hedefData.setAt || new Date().toISOString(),
    });
    var keys = storageKeyCandidates(u);
    if (!keys.length) return false;
    keys.forEach(function (kid) {
      if (!kid) return;
      try {
        localStorage.setItem("student_target_" + kid, JSON.stringify(payload));
      } catch (e) {}
    });
    var goalLabel = formatGoalLabelFromTarget(payload);
    syncGoalToStudentsFull(u, goalLabel);
    updateCurrentUserGoal(goalLabel);
    notifyStudentTargetChanged(keys);
    try {
      window.dispatchEvent(
        new CustomEvent("derece:students-full-goal-sync", {
          detail: { goal: goalLabel, name: String(u.name || "").trim(), studentCode: studentCodeForUser(u) },
        })
      );
    } catch (eEv) {}
    return true;
  }

  function completedTopicsKey(ogrenciId) {
    return "completed_topics_" + String(ogrenciId || "").trim();
  }

  function readCompletedTopicsMap(ogrenciId) {
    try {
      var raw = localStorage.getItem(completedTopicsKey(ogrenciId));
      if (!raw) return {};
      var o = JSON.parse(raw);
      return o && typeof o === "object" && !Array.isArray(o) ? o : {};
    } catch (e) {
      return {};
    }
  }

  function setTopicCompleted(ogrenciId, topicTitle, done) {
    if (!ogrenciId || !topicTitle) return;
    var map = readCompletedTopicsMap(ogrenciId);
    var k = String(topicTitle).trim();
    if (!k) return;
    if (done) map[k] = true;
    else delete map[k];
    try {
      localStorage.setItem(completedTopicsKey(ogrenciId), JSON.stringify(map));
    } catch (e2) {}
  }

  function normTopic(s) {
    return String(s || "")
      .toLocaleLowerCase("tr-TR")
      .replace(/\s+/g, " ")
      .trim();
  }

  function matrixWeakTopicsTop3(examId, studentId) {
    if (!window.ExamMatrix || !examId || !studentId) return [];
    var mx = window.ExamMatrix.getMatrix(examId);
    if (!mx || !mx.questions || !mx.questions.length) return [];
    var resList = window.ExamMatrix.getResultsByStudent(String(studentId)) || [];
    var matrixRes = null;
    for (var i = 0; i < resList.length; i++) {
      if (resList[i] && String(resList[i].examId) === String(examId)) {
        matrixRes = resList[i];
        break;
      }
    }
    if (!matrixRes || !matrixRes.answers) return [];
    var byQ = {};
    mx.questions.forEach(function (q) {
      byQ[q.qNo] = q;
    });
    var topicMap = {};
    matrixRes.answers.forEach(function (a) {
      if (a.result !== "wrong" && a.result !== "empty") return;
      var q = byQ[a.qNo];
      if (!q) return;
      var tk = (q.topicName || q.subjectName || "Genel").trim();
      topicMap[tk] = (topicMap[tk] || 0) + 1;
    });
    var keys = Object.keys(topicMap);
    keys.sort(function (a, b) {
      return topicMap[b] - topicMap[a];
    });
    return keys.slice(0, 3).map(function (name) {
      var c = topicMap[name];
      var pot = Math.round(c * 0.25 * 10) / 10;
      return { name: name, mistakes: c, netPotential: pot };
    });
  }

  function findCompletedVersusMatrixConflict(u) {
    var pid = primaryWriteId(u);
    if (!pid) return null;
    var completed = readCompletedTopicsMap(pid);
    var doneTitles = Object.keys(completed).filter(function (k) {
      return completed[k];
    });
    if (!doneTitles.length) return null;
    var last = getLastExamRecord(u);
    if (!last) return null;
    var sid = String(last.studentId || last.studentCode || "").trim();
    var weak = matrixWeakTopicsTop3(last.examId, sid);
    if (!weak.length) return null;
    for (var i = 0; i < weak.length; i++) {
      var wn = normTopic(weak[i].name);
      for (var j = 0; j < doneTitles.length; j++) {
        var cn = normTopic(doneTitles[j]);
        if (!cn || !wn) continue;
        if (cn === wn || cn.indexOf(wn) !== -1 || wn.indexOf(cn) !== -1) {
          return { completedLabel: doneTitles[j], matrixLabel: weak[i].name, mistakes: weak[i].mistakes };
        }
      }
    }
    return null;
  }

  window.DereceOgrenciSimBridge = {
    getCurrentUser: getCurrentUser,
    catalogIdForUser: catalogIdForUser,
    primaryWriteId: primaryWriteId,
    storageKeyCandidates: storageKeyCandidates,
    readMergedExamResultsForStudent: readMergedExamResultsForStudent,
    getLastExamRecord: getLastExamRecord,
    computeNsBranchNetsFromRecord: computeNsBranchNetsFromRecord,
    readStudentTargetForUser: readStudentTargetForUser,
    saveStudentTargetForUser: saveStudentTargetForUser,
    formatGoalLabelFromTarget: formatGoalLabelFromTarget,
    targetRevisionBump: targetRevisionBump,
    TARGET_REV_KEY: TARGET_REV_KEY,
    readCompletedTopicsMap: readCompletedTopicsMap,
    setTopicCompleted: setTopicCompleted,
    findCompletedVersusMatrixConflict: findCompletedVersusMatrixConflict,
    completedTopicsStorageKey: completedTopicsKey,
  };
})();
