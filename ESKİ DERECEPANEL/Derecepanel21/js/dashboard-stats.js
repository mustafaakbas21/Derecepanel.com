/**
 * Dashboard — özet: yaklaşan global denemeler, soru havuzu, randevu, kitap.
 * Global deneme listesi boş başlar; kayıtlar eklendikçe ilgili sayfada yönetilir.
 */
(function () {
  var POOL_KEY = "derece_soru_havuzu";
  var RANDEVU_KEY = "derecepanel_randevular_v2";
  var STUDENT_CAT_KEY = "derecepanel_student_catalog_v1";
  var MONTHS_TR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function iso(y, m, d) {
    return y + "-" + pad(m) + "-" + pad(d);
  }

  function todayIso() {
    var t = new Date();
    return iso(t.getFullYear(), t.getMonth() + 1, t.getDate());
  }

  function sortExams(rows) {
    rows.sort(function (a, b) {
      return a.tarih.localeCompare(b.tarih) || (a.saat || "").localeCompare(b.saat || "");
    });
  }

  /** Global takvimde henüz merkezi kaynak yok; yaklaşan deneme sayısı 0. */
  function getGlobalExams() {
    return [];
  }

  function formatDayMonth(iso) {
    var p = iso.split("-");
    if (p.length < 3) return iso;
    var dom = parseInt(p[2], 10);
    var mon = parseInt(p[1], 10) - 1;
    if (isNaN(dom) || isNaN(mon) || mon < 0 || mon > 11) return iso;
    return dom + " " + MONTHS_TR[mon].slice(0, 3);
  }

  function safeParseArr(raw) {
    try {
      var v = JSON.parse(raw || "[]");
      return Array.isArray(v) ? v : [];
    } catch (e) {
      return [];
    }
  }

  function studentCatalogCount() {
    try {
      var raw = typeof localStorage !== "undefined" ? localStorage.getItem(STUDENT_CAT_KEY) : null;
      var v = JSON.parse(raw || "[]");
      if (!Array.isArray(v)) return 0;
      var role = "";
      var cid = "";
      try {
        role = String(sessionStorage.getItem("dp_auth_role") || "").trim();
        cid =
          String(sessionStorage.getItem("dp_auth_user_id") || sessionStorage.getItem("dp_appwrite_user_id") || "").trim();
      } catch (eR) {}
      if ((role === "coach" || role === "admin") && cid) {
        var n = 0;
        for (var i = 0; i < v.length; i++) {
          if (v[i] && String(v[i].coachId || "").trim() === cid) n++;
        }
        return n;
      }
      return v.length;
    } catch (e) {
      return 0;
    }
  }

  function coachRosterCount() {
    try {
      var raw = typeof localStorage !== "undefined" ? localStorage.getItem("coaches") : null;
      var v = JSON.parse(raw || "[]");
      return Array.isArray(v) ? v.length : 0;
    } catch (e) {
      return 0;
    }
  }

  function refreshDashboardStats() {
    var t0 = todayIso();
    var allExams = getGlobalExams();
    sortExams(allExams);
    var upcoming = allExams.filter(function (e) {
      return e.tarih >= t0;
    }).slice(0, 5);

    var elUpVal = document.getElementById("dash-val-upcoming");
    var elUpNote = document.getElementById("dash-note-upcoming");
    if (elUpVal) elUpVal.textContent = String(upcoming.length);
    if (elUpNote) {
      if (upcoming.length && upcoming[0]) {
        var f = upcoming[0];
        elUpNote.textContent = "İlk sıra: " + formatDayMonth(f.tarih) + " · " + f.tur;
      } else {
        elUpNote.textContent = "Yaklaşan kayıt yok";
      }
    }

    var elSt = document.getElementById("dashboard-total-students");
    var elStNote = document.querySelector(".card--total-students .ts-note");
    if (elSt) {
      var nSt = studentCatalogCount();
      elSt.textContent = nSt.toLocaleString("tr-TR");
    }
    if (elStNote) elStNote.textContent = "Öğrencilerim ile senkron (bu tarayıcı)";

    var elCo = document.getElementById("dashboard-total-coaches");
    var elCoNote = document.querySelector(".card--total-coaches .ts-note");
    var nCo = coachRosterCount();
    if (elCo) elCo.textContent = nCo.toLocaleString("tr-TR");
    if (elCoNote)
      elCoNote.textContent = nCo ? "Koçlar listesi ile senkron (bu tarayıcı)" : "Koçlar sayfasından kadro ekleyin";

    var pool = safeParseArr(typeof localStorage !== "undefined" ? localStorage.getItem(POOL_KEY) : null);
    var elPool = document.getElementById("dash-val-pool");
    var elPoolNote = document.getElementById("dash-note-pool");
    if (elPool) elPool.textContent = String(pool.length);
    if (elPoolNote) elPoolNote.textContent = pool.length ? "Yerel depo (bu tarayıcı)" : "Henüz havuza soru eklenmedi";

    var rnd = safeParseArr(typeof localStorage !== "undefined" ? localStorage.getItem(RANDEVU_KEY) : null);
    var elR = document.getElementById("dash-val-randevu");
    var elRnote = document.getElementById("dash-note-randevu");
    if (elR) elR.textContent = String(rnd.length);
    if (elRnote) elRnote.textContent = rnd.length ? "Randevu takviminde" : "Henüz randevu yok";

    var books = [];
    if (typeof window.DereceLibraryStore !== "undefined" && typeof window.DereceLibraryStore.getBooks === "function") {
      books = window.DereceLibraryStore.getBooks() || [];
    }
    if (!Array.isArray(books)) books = [];
    var elB = document.getElementById("dash-val-books");
    var elBnote = document.getElementById("dash-note-books");
    if (elB) elB.textContent = String(books.length);
    if (elBnote) elBnote.textContent = books.length ? "Kitap listesi — yerel" : "Henüz kitap eklenmedi";
  }

  document.addEventListener("DOMContentLoaded", refreshDashboardStats);
  window.addEventListener("storage", refreshDashboardStats);
  window.addEventListener("focus", refreshDashboardStats);
  window.refreshDashboardStats = refreshDashboardStats;
})();
