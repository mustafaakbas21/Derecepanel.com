/**
 * YKS Simülasyon sayfaları — öğrenci panel iframe içinde krem zemin + koç üst şeridi gizle.
 * Güvenlik: theme-boot dpAuthRouteGuard (öğrenci oturumu + currentUser zorunlu).
 */
(function () {
  "use strict";

  function inStudentPanelFrame() {
    try {
      if (window.self !== window.top) return true;
      var fe = window.frameElement;
      if (fe && String(fe.name || fe.id || "") === "og-student-frame") return true;
    } catch (e) {}
    return false;
  }

  function isStudentSession() {
    try {
      return String(sessionStorage.getItem("dp_auth_role") || "").trim() === "student";
    } catch (e2) {
      return false;
    }
  }

  function notifyParentResize() {
    if (window.OgStudentPerf && typeof window.OgStudentPerf.notifyParentResize === "function") {
      window.OgStudentPerf.notifyParentResize();
      return;
    }
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: "og-iframe-content" }, "*");
      }
    } catch (e3) {}
  }

  function applyStudentEmbedSurface() {
    var docEl = document.documentElement;
    var body = document.body;
    if (!body) return;

    body.classList.add("og-student-embed");
    if (docEl) {
      docEl.classList.add("og-student-embed-root");
      docEl.setAttribute("data-theme", "light");
      docEl.classList.remove("dark");
    }

    if (inStudentPanelFrame()) {
      var topbar = document.querySelector("main.og-partial-main > header.dp-topbar-sheet");
      if (topbar) {
        topbar.setAttribute("hidden", "");
        topbar.setAttribute("aria-hidden", "true");
      }
    }

    notifyParentResize();
  }

  function observeResize() {
    if (!window.ResizeObserver || !document.body) return;
    var ro = new ResizeObserver(function () {
      notifyParentResize();
    });
    ro.observe(document.body);
    var main = document.querySelector("main.og-partial-main");
    if (main) ro.observe(main);
  }

  function boot() {
    if (!inStudentPanelFrame() && !isStudentSession()) return;
    applyStudentEmbedSurface();
    observeResize();
    window.addEventListener("load", function () {
      notifyParentResize();
    });
    window.addEventListener("resize", notifyParentResize);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
