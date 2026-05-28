/**
 * Header karanlık mod — html.dark + localStorage 'theme' (light | dark).
 * Mevcut data-theme (theme.js) ile senkron tutulur.
 */
(function () {
  var THEME_KEY = "theme";
  var LEGACY_KEY = "derecepanel-theme";

  function isDark() {
    return document.documentElement.classList.contains("dark");
  }

  function setDark(on) {
    try {
      localStorage.setItem(THEME_KEY, on ? "dark" : "light");
      localStorage.setItem(LEGACY_KEY, on ? "dark" : "light");
    } catch (e) {}
    if (typeof window.DerecepanelTheme !== "undefined" && typeof window.DerecepanelTheme.applyTheme === "function") {
      window.DerecepanelTheme.applyTheme(on ? "dark" : "light");
    } else {
      if (on) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
      syncToggleIcons(on);
    }
  }

  function syncToggleIcons(dark) {
    var sun = document.getElementById("themeToggleSun");
    var moon = document.getElementById("themeToggleMoon");
    if (!sun || !moon) return;
    sun.style.opacity = dark ? "0" : "1";
    sun.style.transform = dark ? "scale(0.82)" : "scale(1)";
    sun.style.pointerEvents = dark ? "none" : "auto";
    moon.style.opacity = dark ? "1" : "0";
    moon.style.transform = dark ? "scale(1)" : "scale(0.82)";
    moon.style.pointerEvents = dark ? "auto" : "none";
  }

  window.DerecepanelHeaderThemeIcons = { sync: syncToggleIcons };

  function applyFromStorage() {
    var wantDark = true;
    try {
      var t = localStorage.getItem(THEME_KEY);
      if (t === "dark" || t === "light") {
        wantDark = t === "dark";
      } else {
        var leg = localStorage.getItem(LEGACY_KEY);
        if (leg === "light" || leg === "dark") wantDark = leg === "dark";
        else {
          var dt = document.documentElement.getAttribute("data-theme");
          wantDark = dt !== "light" && dt !== "blue" && dt !== "orange";
        }
      }
    } catch (e) {}
    setDark(wantDark);
  }

  function init() {
    applyFromStorage();
    var btn = document.getElementById("themeToggle");
    if (!btn) return;
    btn.addEventListener("click", function () {
      setDark(!isDark());
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
