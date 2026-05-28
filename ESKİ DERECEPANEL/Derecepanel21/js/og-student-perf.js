/**
 * Öğrenci panel — iframe resize, localStorage önbelleği, ertelenmiş init, hafif oturum.
 */
(function () {
  "use strict";

  var resizeTimer = null;
  var resizeRaf = 0;

  var _currentUser = null;
  var _currentUserRaw = null;
  var _lsJsonCache = {};
  var _shellWarmed = false;
  var _apexLoadPromise = null;

  function notifyParentResizeNow() {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: "og-iframe-content" }, "*");
      }
    } catch (e) {}
  }

  function notifyParentResizeDebounced(delayMs) {
    var delay = typeof delayMs === "number" ? delayMs : 140;
    if (resizeRaf) {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = 0;
    }
    resizeRaf = requestAnimationFrame(function () {
      resizeRaf = 0;
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        resizeTimer = null;
        notifyParentResizeNow();
      }, delay);
    });
  }

  function readCurrentUserRaw() {
    try {
      var raw = localStorage.getItem("currentUser");
      if (raw && String(raw).trim()) return raw;
    } catch (e0) {}
    try {
      if (window.parent && window.parent !== window) {
        var pr = window.parent.localStorage.getItem("currentUser");
        if (pr && String(pr).trim()) return pr;
      }
    } catch (e1) {}
    return "";
  }

  function getCurrentUser() {
    try {
      var raw = readCurrentUserRaw();
      if (_currentUserRaw === raw && _currentUser) return _currentUser;
      _currentUserRaw = raw;
      if (!raw || !String(raw).trim()) {
        _currentUser = null;
        return null;
      }
      _currentUser = JSON.parse(raw);
      return _currentUser;
    } catch (e) {
      _currentUser = null;
      return null;
    }
  }

  function invalidateCurrentUser() {
    _currentUser = null;
    _currentUserRaw = null;
  }

  function getLsJson(key) {
    var k = String(key || "");
    if (!k) return null;
    try {
      var raw = localStorage.getItem(k);
      if (_lsJsonCache[k] && _lsJsonCache[k].raw === raw) {
        return _lsJsonCache[k].val;
      }
      if (!raw) {
        _lsJsonCache[k] = { raw: raw, val: null };
        return null;
      }
      var val = JSON.parse(raw);
      _lsJsonCache[k] = { raw: raw, val: val };
      return val;
    } catch (e2) {
      _lsJsonCache[k] = { raw: null, val: null };
      return null;
    }
  }

  function bustLsJson(key) {
    if (key) delete _lsJsonCache[String(key)];
    else _lsJsonCache = {};
  }

  function programKeyCacheId(u) {
    if (!u) return "";
    return (
      String(u.id || "").trim() ||
      String(u.ogrenciId || "").trim() ||
      String(u.studentCode || "").trim() ||
      String(u.name || "").trim()
    );
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

  function buildActiveProgramTryKeys(u) {
    if (!u) return [];
    var uid = String(u.id || "").trim();
    var ogid = String(u.ogrenciId || "").trim();
    var code = String(u.studentCode || "").trim();
    var cid = catalogIdForUser(u);
    var tryKeys = [];
    if (uid) tryKeys.push("active_program_" + uid);
    if (ogid) tryKeys.push("active_program_" + ogid);
    if (code) tryKeys.push("active_program_" + code);
    if (cid) tryKeys.push("active_program_" + cid);
    return tryKeys;
  }

  /** Hızlı yol: bilinen anahtarlar + oturum önbelleği (tüm localStorage taraması yok). */
  function findActiveProgramStorageKeyFast(u) {
    if (!u) return null;
    var cacheId = programKeyCacheId(u);
    if (cacheId) {
      try {
        var cached = sessionStorage.getItem("og_active_program_key_" + cacheId);
        if (cached && localStorage.getItem(cached)) return cached;
      } catch (eCache) {}
    }
    var tryKeys = buildActiveProgramTryKeys(u);
    for (var t = 0; t < tryKeys.length; t++) {
      try {
        if (localStorage.getItem(tryKeys[t])) {
          if (cacheId) sessionStorage.setItem("og_active_program_key_" + cacheId, tryKeys[t]);
          return tryKeys[t];
        }
      } catch (e) {}
    }
    return null;
  }

  /** Yavaş yedek: isim eşlemesi için tüm active_program_* anahtarları (boşta çalıştırın). */
  function findActiveProgramStorageKeyByScan(u) {
    if (!u) return null;
    var fast = findActiveProgramStorageKeyFast(u);
    if (fast) return fast;
    var cacheId = programKeyCacheId(u);
    var scanKey = cacheId ? "og_active_program_scanned_" + cacheId : "";
    if (scanKey) {
      try {
        var prev = sessionStorage.getItem(scanKey);
        if (prev === "none") return null;
        if (prev && prev.indexOf("active_program_") === 0 && localStorage.getItem(prev)) return prev;
      } catch (ePrev) {}
    }
    var targetName = String(u.name || "").trim();
    if (!targetName) {
      if (scanKey) try { sessionStorage.setItem(scanKey, "none"); } catch (eN) {}
      return null;
    }
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!k || k.indexOf("active_program_") !== 0) continue;
        var raw = localStorage.getItem(k);
        if (!raw) continue;
        var data = JSON.parse(raw);
        var nm = String((data && data.program && data.program.studentName) || "").trim();
        if (nm && nm === targetName) {
          if (cacheId) {
            try {
              sessionStorage.setItem("og_active_program_key_" + cacheId, k);
              if (scanKey) sessionStorage.setItem(scanKey, k);
            } catch (eSet) {}
          }
          return k;
        }
      }
    } catch (e2) {}
    if (scanKey) {
      try { sessionStorage.setItem(scanKey, "none"); } catch (eNone) {}
    }
    return null;
  }

  function runAfterPaint(fn) {
    if (typeof fn !== "function") return;
    requestAnimationFrame(function () {
      setTimeout(fn, 0);
    });
  }

  function runIdle(fn, timeoutMs) {
    if (typeof fn !== "function") return;
    var to = typeof timeoutMs === "number" ? timeoutMs : 1200;
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(
        function (deadline) {
          try {
            fn(deadline);
          } catch (e) {}
        },
        { timeout: to }
      );
      return;
    }
    setTimeout(function () {
      try {
        fn();
      } catch (e2) {}
    }, 16);
  }

  function ensureApexCharts() {
    if (typeof ApexCharts !== "undefined") return Promise.resolve();
    if (_apexLoadPromise) return _apexLoadPromise;
    _apexLoadPromise = new Promise(function (resolve, reject) {
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
    return _apexLoadPromise;
  }

  function syncAuthSessionFromParent() {
    if (window.self === window.top) return;
    try {
      if (!window.parent || window.parent === window) return;
      var keys = ["dp_auth_role", "dp_auth_user_id", "dp_appwrite_user_id", "dp_auth_user"];
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (sessionStorage.getItem(k)) continue;
        var v = window.parent.sessionStorage.getItem(k);
        if (v != null && String(v).trim() !== "") sessionStorage.setItem(k, String(v));
      }
    } catch (eSync) {}
  }

  function warmStudentShell() {
    if (_shellWarmed) return;
    _shellWarmed = true;
    syncAuthSessionFromParent();
    getCurrentUser();
    try {
      if (typeof window.ensureDereceStudentCatalog === "function") {
        window.ensureDereceStudentCatalog();
      }
    } catch (eCat) {}
    try {
      sessionStorage.setItem("og_student_shell_warm", String(Date.now()));
    } catch (eS) {}
  }

  function isStudentPanelEmbed() {
    try {
      if (document.body && document.body.classList.contains("og-student-embed")) return true;
      var path = (window.location.pathname || "").replace(/\\/g, "/").toLowerCase();
      if (path.indexOf("/ogrenci-") !== -1) return true;
      if (window.self !== window.top) {
        var par = (window.parent.location.pathname || "").replace(/\\/g, "/").toLowerCase();
        return par.indexOf("ogrenci-panel") !== -1;
      }
    } catch (e2) {
      return false;
    }
    return false;
  }

  function bindStudentLogout() {
    var loginUrl = "../login.html";
    document.querySelectorAll(".btn-logout").forEach(function (btn) {
      if (btn.getAttribute("data-og-logout-bound") === "1") return;
      btn.setAttribute("data-og-logout-bound", "1");
      btn.addEventListener("click", function () {
        if (!confirm("Çıkış yapmak istediğinize emin misiniz?")) return;
        try {
          sessionStorage.removeItem("dp_auth_user");
          sessionStorage.removeItem("dp_auth_role");
          sessionStorage.removeItem("dp_auth_user_id");
          sessionStorage.removeItem("dp_appwrite_user_id");
          sessionStorage.removeItem("dp_local_auth");
          sessionStorage.removeItem("dp_coach_login_email_v1");
          localStorage.removeItem("currentUser");
        } catch (e) {}
        invalidateCurrentUser();
        window.location.href = loginUrl;
      });
    });
  }

  window.OgStudentPerf = {
    notifyParentResize: notifyParentResizeDebounced,
    notifyParentResizeNow: notifyParentResizeNow,
    getCurrentUser: getCurrentUser,
    invalidateCurrentUser: invalidateCurrentUser,
    getLsJson: getLsJson,
    bustLsJson: bustLsJson,
    findActiveProgramStorageKeyFast: findActiveProgramStorageKeyFast,
    findActiveProgramStorageKeyByScan: findActiveProgramStorageKeyByScan,
    runAfterPaint: runAfterPaint,
    runIdle: runIdle,
    warmStudentShell: warmStudentShell,
    ensureApexCharts: ensureApexCharts,
    isStudentPanelEmbed: isStudentPanelEmbed,
    bindStudentLogout: bindStudentLogout,
  };

  try {
    window.addEventListener("storage", function (e) {
      if (!e || !e.key) return;
      if (e.key === "currentUser") invalidateCurrentUser();
      if (
        e.key.indexOf("active_program_") === 0 ||
        e.key === "global_denemeler_v1" ||
        e.key === "kurum_denemeler_v1" ||
        e.key === "globalExams"
      ) {
        bustLsJson(e.key);
      }
    });
  } catch (eSt) {}

  if (document.body && document.body.classList.contains("og-student-shell-body")) {
    runAfterPaint(function () {
      warmStudentShell();
    });
  } else if (window.self !== window.top || isStudentPanelEmbed()) {
    syncAuthSessionFromParent();
  }
})();
