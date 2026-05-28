/**
 * Öğrenci — Kurum denemeleri (salt okunur). Veri: localStorage kurum_denemeler_v1
 */
(function () {
  var LS_KEY = "kurum_denemeler_v1";

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function todayIso() {
    var t = new Date();
    return t.getFullYear() + "-" + pad(t.getMonth() + 1) + "-" + pad(t.getDate());
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function formatTrDate(iso) {
    if (!iso || String(iso).length < 10) return "—";
    var p = String(iso).split("-");
    if (p.length < 3) return String(iso);
    return p[2] + "." + p[1] + "." + p[0];
  }

  function loadList() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function durumLabel(d) {
    var x = String(d || "").toLowerCase();
    if (x === "aktif") return "Aktif";
    if (x === "tamamlandi") return "Tamamlandı";
    return "Taslak";
  }

  function render() {
    var root = document.getElementById("ogr-kdy-ro-list");
    var empty = document.getElementById("ogr-kdy-ro-empty");
    if (!root) return;
    var t0 = todayIso();
    var rows = loadList()
      .filter(function (r) {
        return r && r.tarih && String(r.tarih) >= t0;
      })
      .sort(function (a, b) {
        return String(a.tarih).localeCompare(String(b.tarih)) || String(a.saat || "").localeCompare(String(b.saat || ""));
      });

    root.innerHTML = "";
    if (!rows.length) {
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;

    rows.forEach(function (r) {
      var art = document.createElement("article");
      art.className = "ogr-kdy-ro-item";
      var ad = String(r.ad || "Kurum denemesi").trim() || "Kurum denemesi";
      var sinav = String(r.sinav || "TYT").trim();
      var saat = String(r.saat || "09:00");
      var durum = durumLabel(r.durum);
      art.innerHTML =
        '<div class="ogr-kdy-ro-item__top">' +
        '<h2 class="ogr-kdy-ro-item__title">' +
        escapeHtml(ad) +
        '</h2><span class="ogr-kdy-ro-item__pill">' +
        escapeHtml(sinav) +
        "</span></div>" +
        '<div class="ogr-kdy-ro-item__meta">' +
        '<span class="ogr-kdy-ro-item__date">' +
        escapeHtml(formatTrDate(r.tarih)) +
        '</span><span class="ogr-kdy-ro-item__time">' +
        escapeHtml(saat) +
        '</span><span class="ogr-kdy-ro-item__durum">' +
        escapeHtml(durum) +
        "</span></div>";
      root.appendChild(art);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    render();
    window.addEventListener("storage", function (e) {
      if (e && e.key === LS_KEY) render();
    });
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) render();
    });
  });
})();
