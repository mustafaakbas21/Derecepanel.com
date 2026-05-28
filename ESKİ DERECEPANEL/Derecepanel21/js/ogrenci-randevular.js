/**
 * Öğrenci randevuları — gelecek / geçmiş (tek seferde yalnızca bir sekmede).
 */
(function () {
  "use strict";

  var MOS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  var activeTab = "upcoming";

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

  function normName(s) {
    return String(s || "")
      .trim()
      .toLocaleLowerCase("tr")
      .replace(/\s+/g, " ");
  }

  function catalogIdForUser(u) {
    if (!u) return "";
    var list = window.DereceStudentCatalog || [];
    var uname = String(u.name || "").trim();
    var code = String(u.studentCode || u.code || "").trim();
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (!c) continue;
      if (code && String(c.code || "").trim() === code) return c.id;
      if (uname && String(c.name || "").trim() === uname) return c.id;
    }
    return "";
  }

  /** Koç panelindeki studentId ile eşleşecek tüm aday kimlikler */
  function studentMatchIds(u) {
    var out = [];
    var seen = {};
    function add(x) {
      x = String(x || "").trim();
      if (!x || seen[x]) return;
      seen[x] = true;
      out.push(x);
    }
    if (!u) return out;
    add(u.id);
    add(u.ogrenciId);
    add(u.studentCode);
    add(u.code);
    add(u.kullaniciAdi);
    add(catalogIdForUser(u));
    var code = String(u.studentCode || u.code || "").trim();
    if (code) {
      add(
        code
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9ğüşıöçĞÜŞİÖÇ\-_.]/g, "")
      );
    }
    add(slugFromName(u.name));
    return out;
  }

  function currentUser() {
    try {
      var raw = localStorage.getItem("currentUser");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function loadAppointments() {
    try {
      var raw = localStorage.getItem("appointments");
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e2) {
      return [];
    }
  }

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function formatTrDate(iso) {
    var p = String(iso || "").split("-").map(Number);
    if (p.length < 3 || isNaN(p[1])) return iso || "—";
    return pad(p[2]) + " " + MOS[p[1] - 1] + " " + p[0];
  }

  function parseSaatParts(saat) {
    var tt = String(saat || "00:00").trim().split(":");
    return {
      h: parseInt(tt[0], 10) || 0,
      m: parseInt(tt[1], 10) || 0,
    };
  }

  /** Randevu başlangıç zamanı (ms). Önce kayıtlı ts, yoksa tarih+saat. */
  function appointmentTs(r) {
    if (!r) return NaN;
    if (typeof r.ts === "number" && !isNaN(r.ts) && r.ts > 0) return r.ts;

    var tarih = String(r.tarih || "").trim();
    var sp = parseSaatParts(r.saat);
    var y, mo, d;

    if (/^\d{4}-\d{2}-\d{2}$/.test(tarih)) {
      var p = tarih.split("-").map(Number);
      y = p[0];
      mo = p[1];
      d = p[2];
    } else if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(tarih)) {
      var p2 = tarih.split(".").map(Number);
      d = p2[0];
      mo = p2[1];
      y = p2[2];
    } else {
      return NaN;
    }

    if (isNaN(y) || isNaN(mo) || isNaN(d)) return NaN;
    return new Date(y, mo - 1, d, sp.h, sp.m, 0, 0).getTime();
  }

  /** Gelecek: başlangıç >= şimdi. Geçmiş: başlangıç < şimdi. Kesişim yok. */
  function splitByTime(rows, nowMs) {
    var upcoming = [];
    var past = [];
    var now = typeof nowMs === "number" ? nowMs : Date.now();

    rows.forEach(function (r) {
      var ts = appointmentTs(r);
      if (isNaN(ts)) return;
      if (ts >= now) upcoming.push(r);
      else past.push(r);
    });

    upcoming.sort(function (a, b) {
      return appointmentTs(a) - appointmentTs(b);
    });
    past.sort(function (a, b) {
      return appointmentTs(b) - appointmentTs(a);
    });

    return { upcoming: upcoming, past: past };
  }

  function belongsToStudent(r, matchIds, myNameNorm) {
    if (!r) return false;
    var sid = String(r.studentId || "").trim();
    if (sid) {
      for (var i = 0; i < matchIds.length; i++) {
        if (sid === matchIds[i]) return true;
      }
    }
    if (myNameNorm) {
      var on = normName(r.ogrenci);
      if (on && on === myNameNorm) return true;
    }
    return false;
  }

  function tipLabel(tip) {
    if (tip === "online") return "Online";
    if (tip === "telefon") return "Telefon";
    return "Yüz yüze";
  }

  function pillClass(tip) {
    if (tip === "online") return "ogr-rnd-card__pill ogr-rnd-card__pill--in";
    if (tip === "telefon") return "ogr-rnd-card__pill";
    return "ogr-rnd-card__pill ogr-rnd-card__pill--ff";
  }

  function isZoomable(url) {
    return /^https?:\/\//i.test(String(url || "").trim());
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function renderCard(r) {
    var tip = r.tip || "yuz_yuze";
    var online = tip === "online";
    var link = String(r.yer || "").trim();
    var konu = String(r.konu || "").trim() || "Görüşme";
    var el = document.createElement("article");
    el.className = "ogr-rnd-card";
    var row = document.createElement("div");
    row.className = "ogr-rnd-card__row";
    var meta = document.createElement("div");
    meta.className = "ogr-rnd-card__meta";
    var sp1 = document.createElement("span");
    sp1.textContent = formatTrDate(r.tarih);
    var sp2 = document.createElement("span");
    sp2.textContent = "Saat: " + (r.saat || "—");
    meta.appendChild(sp1);
    meta.appendChild(sp2);
    var pill = document.createElement("span");
    pill.className = pillClass(tip);
    pill.textContent = tipLabel(tip);
    row.appendChild(meta);
    row.appendChild(pill);
    var p = document.createElement("p");
    p.className = "ogr-rnd-card__konu";
    p.innerHTML = "<strong>Konu:</strong> " + escapeHtml(konu);
    el.appendChild(row);
    el.appendChild(p);
    if (online && isZoomable(link)) {
      var a = document.createElement("a");
      a.className = "ogr-rnd__btn-zoom";
      a.href = link;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = "Zoom / Meet linkine git";
      el.appendChild(a);
    }
    return el;
  }

  function fillPanel(panelEl, rows) {
    if (!panelEl) return;
    panelEl.innerHTML = "";
    rows.forEach(function (r) {
      panelEl.appendChild(renderCard(r));
    });
  }

  function activate(which) {
    activeTab = which === "past" ? "past" : "upcoming";
    var pastMode = activeTab === "past";

    var tabUp = document.getElementById("ogr-rnd-tab-upcoming");
    var tabPast = document.getElementById("ogr-rnd-tab-past");
    var panelUp = document.getElementById("ogr-rnd-upcoming");
    var panelPast = document.getElementById("ogr-rnd-past");
    var emptyUp = document.getElementById("ogr-rnd-empty-up");
    var emptyPast = document.getElementById("ogr-rnd-empty-past");

    if (tabUp) {
      tabUp.classList.toggle("ogr-rnd__tab--active", !pastMode);
      tabUp.setAttribute("aria-selected", pastMode ? "false" : "true");
    }
    if (tabPast) {
      tabPast.classList.toggle("ogr-rnd__tab--active", pastMode);
      tabPast.setAttribute("aria-selected", pastMode ? "true" : "false");
    }
    if (panelUp) panelUp.hidden = pastMode;
    if (panelPast) panelPast.hidden = !pastMode;

    var upCount = panelUp ? panelUp.children.length : 0;
    var pastCount = panelPast ? panelPast.children.length : 0;

    if (emptyUp) emptyUp.hidden = pastMode || upCount > 0;
    if (emptyPast) emptyPast.hidden = !pastMode || pastCount > 0;
  }

  function render() {
    var u = currentUser();
    if (!u) {
      window.location.replace("../login.html");
      return;
    }

    if (typeof window.ensureDereceStudentCatalog === "function") {
      window.ensureDereceStudentCatalog();
    }

    var matchIds = studentMatchIds(u);
    var myNameNorm = normName(u.name);
    var mine = loadAppointments().filter(function (r) {
      return belongsToStudent(r, matchIds, myNameNorm);
    });

    var buckets = splitByTime(mine, Date.now());
    fillPanel(document.getElementById("ogr-rnd-upcoming"), buckets.upcoming);
    fillPanel(document.getElementById("ogr-rnd-past"), buckets.past);
    activate(activeTab);

    try {
      if (window.parent !== window) {
        window.parent.postMessage({ type: "og-iframe-content" }, "*");
      }
    } catch (e) {}
  }

  document.addEventListener("DOMContentLoaded", function () {
    var tabUp = document.getElementById("ogr-rnd-tab-upcoming");
    var tabPast = document.getElementById("ogr-rnd-tab-past");

    if (tabUp) {
      tabUp.addEventListener("click", function () {
        activate("upcoming");
      });
    }
    if (tabPast) {
      tabPast.addEventListener("click", function () {
        activate("past");
      });
    }

    render();

    window.addEventListener("storage", function (e) {
      if (e && e.key === "appointments") render();
    });
    window.addEventListener("appointments:change", render);
  });
})();
