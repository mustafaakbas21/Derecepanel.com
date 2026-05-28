(function () {
  var k = "derecepanel-theme";
  var tw = "theme";
  var allowed = { dark: 1, light: 1, blue: 1, orange: 1 };
  var v;
  try {
    v = localStorage.getItem(k);
  } catch (e) {
    v = null;
  }
  var t = v && allowed[v] ? v : "dark";
  document.documentElement.setAttribute("data-theme", t);
  try {
    var htmlTw = localStorage.getItem(tw);
    if (htmlTw === "dark") {
      document.documentElement.classList.add("dark");
    } else if (htmlTw === "light") {
      document.documentElement.classList.remove("dark");
    } else if (t === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  } catch (e2) {}
})();

/** Tüm theme-boot kullanan sayfalarda Sorun Bildir (bug-reporter.js) otomatik yüklenir — DRY */
(function () {
  var bootSrc = "";
  try {
    var cs = document.currentScript;
    bootSrc = cs && cs.src ? String(cs.src) : "";
  } catch (eBr) {}

  function loadBugReporter() {
    if (window.__dereceBugReporterLoaderDone) return;
    window.__dereceBugReporterLoaderDone = true;
    if (!bootSrc) return;
    var brSrc = bootSrc.replace(/theme-boot\.js/i, "bug-reporter.js");
    if (brSrc === bootSrc) return;
    var s = document.createElement("script");
    s.src = brSrc;
    s.defer = true;
    (document.head || document.documentElement).appendChild(s);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadBugReporter);
  } else {
    loadBugReporter();
  }
})();

/**
 * Oturum bağlamı (RBAC / çok kiracılı yerel + Appwrite hazır anahtarlar).
 * theme-boot tüm panel sayfalarında yüklendiği için burada tutulur.
 */
(function dpSessionApi() {
  try {
    window.DP_AUTH_GENERIC_LOGIN_ERROR = "Geçersiz kullanıcı adı veya şifre";
    window.dpGetAuthRole = function () {
      try {
        return String(sessionStorage.getItem("dp_auth_role") || "").trim();
      } catch (e) {
        return "";
      }
    };
    window.dpGetAuthUserId = function () {
      try {
        var a = String(sessionStorage.getItem("dp_auth_user_id") || "").trim();
        if (a) return a;
        return String(sessionStorage.getItem("dp_appwrite_user_id") || "").trim();
      } catch (e2) {
        return "";
      }
    };
    /** Koç veya admin oturumunda veri izolasyonu için koç belge kimliği */
    window.dpGetActiveCoachId = function () {
      var role = window.dpGetAuthRole();
      if (role !== "coach" && role !== "admin") return "";
      return window.dpGetAuthUserId();
    };
    window.dpStudentRecordBelongsToActiveCoach = function (rec) {
      var cid = window.dpGetActiveCoachId();
      if (!cid || !rec || typeof rec !== "object") return false;
      var sc = String(rec.coachId != null ? rec.coachId : rec.koc_id || "").trim();
      return sc === cid;
    };
  } catch (e3) {}
})();

/** Korumalı rotalar: oturumsuz panel erişimini login’e gönderir */
(function dpAuthRouteGuard() {
  try {
    var p = String(location.pathname || "").replace(/\\/g, "/").toLowerCase();
    var file = (p.split("/").pop() || "").trim();
    if (!file) return;
    if (file === "index.html" && (p === "/index.html" || p.endsWith("/index.html"))) return;
    if (/login\.html?$/.test(file)) return;
    if (p.indexOf("super-admin-login") !== -1) return;
    if (file === "super-admin.html") return;
    if (p.indexOf("/docs/") !== -1) return;

    function isStudentShellFile(f) {
      if (f === "ogrenci-panel.html") return true;
      if (f.indexOf("ogrenci-") === 0 && f.indexOf("ogrencilerim") === -1) return true;
      return false;
    }
    /** Tercih / Net / Puan / Konular — öğrenci ve koç oturumu (RBAC) */
    function isYksSimulationPage(f) {
      return (
        f === "tercih-sihirbazi.html" ||
        f === "net-sihirbazi.html" ||
        f === "puan-hesaplama.html" ||
        f === "yks-konulari.html"
      );
    }
    function isCoachStaffPage(f, path) {
      if (f === "koc-paneli.html") return true;
      if (path.indexOf("/pages/") === -1) return false;
      if (f === "login.html") return false;
      if (isStudentShellFile(f)) return false;
      if (isYksSimulationPage(f)) return false;
      return true;
    }
    if (!isStudentShellFile(file) && !isCoachStaffPage(file, p) && !isYksSimulationPage(file)) return;

    var role = "";
    var uid = "";
    try {
      role = String(sessionStorage.getItem("dp_auth_role") || "").trim();
      uid =
        String(sessionStorage.getItem("dp_auth_user_id") || "").trim() ||
        String(sessionStorage.getItem("dp_appwrite_user_id") || "").trim();
    } catch (eS) {}

    var loginHref = p.indexOf("/pages/") !== -1 ? "../login.html" : "login.html";
    function redirect() {
      try {
        location.replace(loginHref);
      } catch (eR) {
        location.href = loginHref;
      }
    }

    if (isStudentShellFile(file)) {
      var qpEmbed = "";
      try {
        qpEmbed = String(new URLSearchParams(location.search).get("og_embed") || "").trim();
      } catch (eQp) {}
      /* Panel iframe / embed: üst kabuk oturumu doğrular — içerik guard'sız yüklenir */
      if (window.self !== window.top || qpEmbed === "1") return;
      var hasCurrentUser = false;
      try {
        var cu = localStorage.getItem("currentUser");
        hasCurrentUser = !!(cu && String(cu).trim());
      } catch (eCu) {}
      if (!hasCurrentUser) {
        try {
          if (window.parent && window.parent !== window) {
            var pcu = window.parent.localStorage.getItem("currentUser");
            hasCurrentUser = !!(pcu && String(pcu).trim());
          }
        } catch (ePar) {}
      }
      var okStudentSession = role === "student" && !!uid;
      if (okStudentSession || hasCurrentUser) return;
      redirect();
      return;
    }
    if (isYksSimulationPage(file)) {
      if (!uid) redirect();
      if (role === "student") {
        try {
          var cu = localStorage.getItem("currentUser");
          if (!cu || !String(cu).trim()) redirect();
        } catch (eCu) {
          redirect();
        }
        return;
      }
      if (role === "coach" || role === "admin") return;
      redirect();
      return;
    }
    if (isCoachStaffPage(file, p)) {
      if ((role !== "coach" && role !== "admin") || !uid) redirect();
    }
  } catch (e0) {}
})();
