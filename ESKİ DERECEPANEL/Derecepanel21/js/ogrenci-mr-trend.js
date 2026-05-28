(function () {
  "use strict";
  var C = window.OgrenciMrCore;
  var lineChart = null;
  var MR_MOOD_FEED_KEY = "dp_v2_session_mr_feed_v1";

  function readMoodFeed() {
    try {
      var raw = localStorage.getItem(MR_MOOD_FEED_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function applyMoodKpi(u) {
    if (!C || !u) return;
    var valEl = document.getElementById("og-tr-kpi-mood-val");
    var hintEl = document.getElementById("og-tr-kpi-mood-hint");
    if (!valEl) return;
    var canon = C.canonicalStudentId(u);
    var oid = String((u && u.id) || (u && u.ogrenciId) || "").trim();
    var feed = readMoodFeed();
    var mine = feed.filter(function (e) {
      if (!e) return false;
      var mids = e.matchIds || (e.studentId ? [e.studentId] : []);
      for (var i = 0; i < mids.length; i++) {
        var m = String(mids[i] || "").trim();
        if (m && (m === canon || m === oid)) return true;
      }
      var sid = String(e.studentId || "").trim();
      return sid && (sid === canon || sid === oid);
    });
    mine.sort(function (a, b) {
      return String(b.recordedAt || "").localeCompare(String(a.recordedAt || ""));
    });
    if (!mine.length) {
      valEl.textContent = "—";
      if (hintEl) hintEl.textContent = "Koç görüşmesinde ruh hali işaretlenince burada görünür.";
      return;
    }
    var last = mine[0];
    var emoji = String(last.emoji || "").trim();
    var lab = String(last.moodLabel || last.moodId || "—").trim();
    valEl.textContent = (emoji ? emoji + " " : "") + lab;
    if (hintEl) {
      var dt = last.recordedAt ? new Date(last.recordedAt) : null;
      hintEl.textContent =
        dt && !isNaN(dt.getTime())
          ? "Son kayıt: " + dt.toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })
          : "";
    }
  }

  function isAytExam(rec) {
    var n = String(rec.examName || rec.title || rec.examTitle || "").toUpperCase();
    if (n.indexOf("AYT") >= 0) return true;
    if (n.indexOf("SAYISAL") >= 0 || n.indexOf("SÖZEL") >= 0 || n.indexOf("EŞİT") >= 0) return true;
    return false;
  }

  function dateBits(rec) {
    var s = String(rec.savedAt || rec.date || "").trim();
    var d = s.slice(0, 10);
    if (d.length === 10 && d.indexOf("-") === 4) {
      var p = d.split("-");
      return p[2] + "." + p[1] + "." + p[0].slice(2);
    }
    return "";
  }

  function shortenExamLabel(rec) {
    var n = String(rec.examName || rec.title || rec.examTitle || "Deneme").trim();
    if (n.length > 18) n = n.slice(0, 16) + "…";
    return n || "Deneme";
  }

  function examXLabel(rec) {
    var bits = dateBits(rec);
    var base = shortenExamLabel(rec);
    return bits ? base + " · " + bits : base;
  }

  function buildExamTimeline(u) {
    var rows = C.readExamResultsForSession(u)
      .slice()
      .sort(function (a, b) {
        return String(a.savedAt || "").localeCompare(String(b.savedAt || ""));
      });
    var cats = [];
    var tyt = [];
    var ayt = [];
    var nets = [];
    rows.forEach(function (rec) {
      var net = parseFloat(rec.net);
      if (isNaN(net)) return;
      var rounded = Math.round(net * 10) / 10;
      cats.push(examXLabel(rec));
      nets.push(rounded);
      if (isAytExam(rec)) {
        ayt.push(rounded);
        tyt.push(null);
      } else {
        tyt.push(rounded);
        ayt.push(null);
      }
    });
    return { cats: cats, tyt: tyt, ayt: ayt, nets: nets };
  }

  function fmtNet(v) {
    if (v == null || isNaN(v)) return "—";
    var n = Math.round(v * 10) / 10;
    return String(n).indexOf(".") >= 0 ? String(n) : String(n) + ".0";
  }

  function applyKpis(pack) {
    var firstEl = document.getElementById("og-tr-kpi-first");
    var lastEl = document.getElementById("og-tr-kpi-last");
    var deltaNum = document.getElementById("og-tr-kpi-delta-num");
    var deltaWrap = document.getElementById("og-tr-kpi-delta-wrap");
    if (!firstEl || !lastEl || !deltaNum || !deltaWrap) return;
    if (!pack.nets || !pack.nets.length) {
      firstEl.textContent = "—";
      lastEl.textContent = "—";
      deltaNum.textContent = "—";
      deltaWrap.classList.remove("is-neg");
      return;
    }
    var first = pack.nets[0];
    var last = pack.nets[pack.nets.length - 1];
    var d = Math.round((last - first) * 10) / 10;
    firstEl.textContent = fmtNet(first);
    lastEl.textContent = fmtNet(last);
    deltaNum.textContent = (d > 0 ? "+" : "") + (isNaN(d) ? "—" : String(d));
    if (d < 0) deltaWrap.classList.add("is-neg");
    else deltaWrap.classList.remove("is-neg");
  }

  function setSkel(on) {
    var s = document.getElementById("og-tr-skel");
    if (!s) return;
    if (on) s.classList.add("is-on");
    else s.classList.remove("is-on");
  }

  function setEmpty(on) {
    var e = document.getElementById("og-tr-empty");
    if (!e) return;
    if (on) e.classList.add("is-on");
    else e.classList.remove("is-on");
  }

  function destroyChart() {
    if (lineChart) {
      try {
        lineChart.destroy();
      } catch (e) {}
      lineChart = null;
    }
    var el = document.getElementById("og-tr-line");
    if (el) el.innerHTML = "";
  }

  function draw() {
    if (!C) return;
    var u = C.getCurrentUser();
    if (!u) return;
    var el = document.getElementById("og-tr-line");
    if (!el || typeof ApexCharts === "undefined") return;

    destroyChart();
    setEmpty(false);
    setSkel(true);
    applyKpis({ nets: [] });
    applyMoodKpi(u);

    window.requestAnimationFrame(function () {
      window.setTimeout(function () {
        var pack = buildExamTimeline(u);
        if (!pack.cats.length) {
          setSkel(false);
          setEmpty(true);
          applyKpis({ nets: [] });
          applyMoodKpi(u);
          C.notifyParentResize();
          return;
        }

        applyKpis(pack);
        applyMoodKpi(u);
        setEmpty(false);

        lineChart = new ApexCharts(el, {
          chart: {
            type: "area",
            height: 420,
            toolbar: { show: false },
            fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
            zoom: { enabled: false },
            animations: { enabled: true, easing: "easeinout", speed: 520 },
            events: {
              mounted: function () {
                setSkel(false);
                C.notifyParentResize();
              },
            },
          },
          stroke: {
            curve: "smooth",
            width: 3,
            connectNulls: true,
          },
          fill: {
            type: "gradient",
            gradient: {
              shade: "light",
              type: "vertical",
              shadeIntensity: 0.45,
              opacityFrom: 0.38,
              opacityTo: 0.04,
              stops: [0, 88, 100],
            },
          },
          colors: ["#1e3a8a", "#06b6d4"],
          series: [
            { name: "TYT net", data: pack.tyt },
            { name: "AYT net", data: pack.ayt },
          ],
          xaxis: {
            categories: pack.cats,
            labels: {
              style: { fontSize: "10px", fontWeight: 600, colors: "#64748b" },
              rotate: -35,
              rotateAlways: pack.cats.length > 6,
              hideOverlappingLabels: true,
            },
            tickAmount: undefined,
          },
          yaxis: {
            labels: {
              formatter: function (v) {
                return v == null ? "" : String(v);
              },
            },
            min: 0,
            forceNiceScale: true,
          },
          dataLabels: { enabled: false },
          legend: { position: "top", fontWeight: 700, markers: { radius: 5 } },
          grid: { strokeDashArray: 4, borderColor: "#e2e8f0" },
          tooltip: {
            shared: true,
            intersect: false,
            y: {
              formatter: function (v) {
                return v == null || v === "" ? "—" : String(v) + " net";
              },
            },
          },
          markers: {
            size: 4,
            strokeWidth: 2,
            strokeColors: "#fff",
            hover: { size: 6 },
          },
        });
        lineChart.render();
      }, 160);
    });
  }

  function boot() {
    if (!C) return;
    var u = C.getCurrentUser();
    if (!u) {
      window.location.replace("../login.html");
      return;
    }
    if (!C.canonicalStudentId(u)) {
      window.location.replace("../login.html");
      return;
    }
    draw();
    window.addEventListener("storage", function (e) {
      if (!e || !e.key) return;
      if (e.key === "examResults" || e.key.indexOf("examResults_") === 0) draw();
      if (e.key === MR_MOOD_FEED_KEY) draw();
    });
    window.addEventListener("examResults:change", draw);
    window.addEventListener("load", function () {
      setTimeout(C.notifyParentResize, 200);
      setTimeout(C.notifyParentResize, 700);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
