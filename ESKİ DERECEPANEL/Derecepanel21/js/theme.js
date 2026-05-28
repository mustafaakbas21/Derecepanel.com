/**
 * Tema motoru — data-theme + localStorage (FOUC head script ile eşlenik)
 */
(function () {
  var STORAGE_KEY = "derecepanel-theme";
  var VALID = { dark: true, light: true, blue: true, orange: true };

  function normalizeTheme(name) {
    return VALID[name] ? name : "dark";
  }

  function applyTheme(name) {
    var t = normalizeTheme(name);
    document.documentElement.setAttribute("data-theme", t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
      if (t === "dark") {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
    } catch (e) {}
    syncSwatches(t);
    if (window.DerecepanelHeaderThemeIcons && typeof window.DerecepanelHeaderThemeIcons.sync === "function") {
      try {
        window.DerecepanelHeaderThemeIcons.sync(t === "dark");
      } catch (e2) {}
    }
    return t;
  }

  function syncSwatches(active) {
    document.querySelectorAll(".theme-swatch[data-theme]").forEach(function (btn) {
      var v = btn.getAttribute("data-theme");
      var isOn = v === active;
      btn.classList.toggle("is-active", isOn);
      btn.setAttribute("aria-pressed", isOn ? "true" : "false");
    });
  }

  function init() {
    var current =
      document.documentElement.getAttribute("data-theme") || localStorage.getItem(STORAGE_KEY) || "dark";
    applyTheme(current);
    document.querySelectorAll(".theme-swatch[data-theme]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var next = btn.getAttribute("data-theme");
        if (next) applyTheme(next);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.DerecepanelTheme = { applyTheme: applyTheme, STORAGE_KEY: STORAGE_KEY };
})();
