/**
 * Öğrenci deneme sonuçları — grafikler, doğru sınav adları, Sonuç Merkezi karnesi.
 */
(function () {
  "use strict";

  var CHART_COLORS = ["#3b82c4", "#60a5fa", "#93c5fd", "#c5d8eb", "#64748b", "#34d399"];
  var activeRow = null;
  var lastMergedRows = null;

  function getApi() {
    return window.DereceStudentKarneApi || null;
  }

  function getCurrentUser() {
    if (window.OgStudentPerf && typeof window.OgStudentPerf.getCurrentUser === "function") {
      return window.OgStudentPerf.getCurrentUser();
    }
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

  function storageIdsForUser(u) {
    var ids = [];
    if (!u) return ids;
    var seen = {};
    function add(x) {
      x = String(x || "").trim();
      if (!x || seen[x]) return;
      seen[x] = true;
      ids.push(x);
    }
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
    return ids;
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
    return n || "ogrenci";
  }

  function sameStudent(rec, ids, u) {
    if (!rec || !u) return false;
    var sid = String(rec.studentId || "").trim();
    var sc = String(rec.studentCode || "").trim();
    for (var i = 0; i < ids.length; i++) {
      if (ids[i] && (sid === ids[i] || sc === ids[i])) return true;
    }
    var myName = normName(u.name);
    var recName = normName(rec.name || rec.studentName || rec.ogrenci);
    if (myName && recName && myName === recName) return true;
    var strict = u.id != null ? String(u.id).trim() : "";
    if (strict && sid === strict) return true;
    return false;
  }

  function normName(s) {
    return String(s || "")
      .trim()
      .toLocaleLowerCase("tr")
      .replace(/\s+/g, " ");
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

  function readMergedResultsForStudent(u) {
    var ids = storageIdsForUser(u);
    var strict = u && u.id != null ? String(u.id).trim() : "";
    if (strict && ids.indexOf(strict) === -1) ids.unshift(strict);
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
      return String(b.savedAt || "").localeCompare(String(a.savedAt || ""));
    });
    return out;
  }

  function formatDisplayDate(rec) {
    var s = rec && rec.savedAt ? String(rec.savedAt) : "";
    if (s.length >= 10) {
      var p = s.slice(0, 10).split("-");
      if (p.length === 3) return p[2] + "." + p[1] + "." + p[0];
    }
    return "—";
  }

  function examSortTs(rec) {
    var Api = getApi();
    var ex = Api && Api.findExamById ? Api.findExamById(rec.examId) : null;
    var d = (ex && (ex.date || ex.examDate || ex.tarih)) || (rec && rec.savedAt) || "";
    var t = Date.parse(String(d));
    return isNaN(t) ? 0 : t;
  }

  function resolveTitle(rec) {
    var Api = getApi();
    if (Api && typeof Api.resolveExamTitle === "function") {
      return Api.resolveExamTitle(rec.examId, rec);
    }
    var nm = rec.examName || rec.denemeAdi || rec.title;
    if (nm && String(nm).trim() && !/^kd-\d+$/i.test(String(nm).trim())) return String(nm).trim();
    return String(rec.examId || "Deneme");
  }

  function resolveSinavBadge(rec) {
    var Api = getApi();
    var ex = Api && Api.findExamById ? Api.findExamById(rec.examId) : null;
    var s = (ex && (ex.sinav || ex.tur)) || rec.sinav || rec.tur || "";
    return String(s || "").trim().toUpperCase();
  }

  function pickPuan(rec) {
    if (!rec) return "—";
    var cands = [rec.puan, rec.hamPuan, rec.tytPuan, rec.aytPuan, rec.genelPuan, rec.toplamPuan];
    for (var i = 0; i < cands.length; i++) {
      if (cands[i] != null && String(cands[i]).trim() !== "") return String(cands[i]);
    }
    return "—";
  }

  function parseNet(rec) {
    if (!rec || rec.net == null || rec.net === "") return null;
    var n = Number(rec.net);
    return isNaN(n) ? null : n;
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function isModalOpen() {
    var modal = document.getElementById("ogr-ds-modal");
    return !!(modal && !modal.classList.contains("hidden"));
  }

  function notifyResize() {
    if (isModalOpen()) return;
    if (window.OgStudentPerf && typeof window.OgStudentPerf.notifyParentResize === "function") {
      window.OgStudentPerf.notifyParentResize();
      return;
    }
    try {
      if (window.parent !== window) {
        window.parent.postMessage({ type: "og-iframe-content" }, "*");
      }
    } catch (e) {}
  }

  function shortLabel(title, max) {
    var t = String(title || "");
    if (t.length <= (max || 10)) return t;
    return t.slice(0, max || 10) + "…";
  }

  function renderKpis(rows) {
    var el = document.getElementById("ogr-ds-kpis");
    if (!el) return;
    if (!rows.length) {
      el.innerHTML = "";
      return;
    }
    var nets = rows.map(parseNet).filter(function (n) {
      return n != null;
    });
    var avg =
      nets.length > 0
        ? (nets.reduce(function (a, b) {
            return a + b;
          }, 0) /
            nets.length
          ).toFixed(2)
        : "—";
    var best =
      nets.length > 0
        ? Math.max.apply(
            null,
            nets.map(function (n) {
              return n;
            })
          ).toFixed(2)
        : "—";
    var latest = rows[0];
    var latestNet = parseNet(latest);
    var cards = [
      { label: "Toplam deneme", val: String(rows.length), sub: "kayıtlı sınav" },
      { label: "Son net", val: latestNet != null ? latestNet.toFixed(2) : "—", sub: shortLabel(resolveTitle(latest), 28) },
      { label: "Ortalama net", val: avg, sub: "tüm denemeler" },
      { label: "En yüksek net", val: best, sub: "kişisel rekor" },
    ];
    el.innerHTML = cards
      .map(function (c) {
        return (
          '<div class="ogr-ds-kpi">' +
          '<div class="ogr-ds-kpi__label">' +
          escapeHtml(c.label) +
          "</div>" +
          '<div class="ogr-ds-kpi__val">' +
          escapeHtml(c.val) +
          "</div>" +
          '<div class="ogr-ds-kpi__sub">' +
          escapeHtml(c.sub) +
          "</div></div>"
        );
      })
      .join("");
  }

  function getLast5ExamPoints(rows) {
    var chronological = rows.slice().sort(function (a, b) {
      return examSortTs(a) - examSortTs(b);
    });
    return chronological
      .map(function (r) {
        var n = parseNet(r);
        if (n == null) return null;
        return {
          label: resolveTitle(r),
          date: formatDisplayDate(r),
          net: n,
          examId: r.examId,
          rec: r,
        };
      })
      .filter(Boolean)
      .slice(-5);
  }

  function computeAxisMax(values) {
    var maxV = Math.max.apply(null, values.concat([0]));
    if (maxV <= 0) return 40;
    var step = maxV <= 50 ? 10 : 20;
    var axisMax = Math.ceil(maxV / step) * step;
    return Math.min(120, Math.max(40, axisMax));
  }

  function buildAxisTicks(axisMax) {
    var step = axisMax <= 50 ? 10 : 20;
    var ticks = [];
    for (var t = 0; t <= axisMax; t += step) ticks.push(t);
    return ticks;
  }

  function collectSectionMatrix(examPoints) {
    var Api = getApi();
    if (!Api || typeof Api.getSectionBreakdown !== "function") return null;
    var labelOrder = [];
    var labelSeen = {};
    examPoints.forEach(function (ep) {
      Api.getSectionBreakdown(ep.examId, ep.rec).forEach(function (sec) {
        var lab = String(sec.label || "").trim();
        if (!lab || labelSeen[lab]) return;
        labelSeen[lab] = true;
        labelOrder.push(lab);
      });
    });
    if (!labelOrder.length) return null;
    return labelOrder.map(function (lab) {
      var nets = examPoints.map(function (ep) {
        var hit = Api.getSectionBreakdown(ep.examId, ep.rec).filter(function (s) {
          return String(s.label || "").trim() === lab;
        })[0];
        return hit ? hit.net : 0;
      });
      return { label: lab, nets: nets };
    });
  }

  function buildDetailedNetBarChart(examPoints) {
    if (!examPoints.length) {
      return '<p class="ogr-ds-chart-card__hint" style="margin:1rem 0">Grafik için en az bir net kaydı gerekir.</p>';
    }

    var sectionRows = collectSectionMatrix(examPoints);
    var useSections = sectionRows && sectionRows.length > 0;
    var allVals = [];

    if (useSections) {
      sectionRows.forEach(function (row) {
        row.nets.forEach(function (n) {
          allVals.push(n);
        });
      });
    } else {
      examPoints.forEach(function (p) {
        allVals.push(p.net);
      });
    }

    var axisMax = computeAxisMax(allVals);
    var ticks = buildAxisTicks(axisMax);
    var gridHtml = ticks
      .map(function (t) {
        var pct = axisMax > 0 ? (t / axisMax) * 100 : 0;
        return '<div class="ogr-ds-hbar__gridline" style="left:' + pct + '%"></div>';
      })
      .join("");
    var scaleHtml = ticks
      .map(function (t) {
        return "<span>" + t + "</span>";
      })
      .join("");

    var rowsHtml;
    if (useSections) {
      rowsHtml = sectionRows
        .map(function (row) {
          var miniBars = row.nets
            .map(function (net, i) {
              var pct = axisMax > 0 ? Math.max(3, (Math.max(0, net) / axisMax) * 100) : 0;
              var color = CHART_COLORS[i % CHART_COLORS.length];
              return (
                '<div class="ogr-ds-hbar-mini" style="width:' +
                pct.toFixed(1) +
                "%;background:" +
                color +
                '"><span class="ogr-ds-hbar-mini__val">' +
                escapeHtml(net.toFixed(1)) +
                "</span></div>"
              );
            })
            .join("");
          return (
            '<div class="ogr-ds-hbar-row ogr-ds-hbar-row--group">' +
            '<span class="ogr-ds-hbar-row__label" title="' +
            escapeHtml(row.label) +
            '">' +
            escapeHtml(shortLabel(row.label, 20)) +
            '</span><div class="ogr-ds-hbar-row__track"><div class="ogr-ds-hbar-row__stack">' +
            miniBars +
            "</div></div></div>"
          );
        })
        .join("");
    } else {
      rowsHtml = examPoints
        .map(function (p, i) {
          var pct = axisMax > 0 ? Math.max(4, (p.net / axisMax) * 100) : 0;
          var color = CHART_COLORS[i % CHART_COLORS.length];
          return (
            '<div class="ogr-ds-hbar-row">' +
            '<span class="ogr-ds-hbar-row__label" title="' +
            escapeHtml(p.label) +
            '">' +
            escapeHtml(shortLabel(p.label, 22)) +
            '</span><div class="ogr-ds-hbar-row__track"><div class="ogr-ds-hbar-row__fill" style="width:' +
            pct.toFixed(1) +
            "%;background:" +
            color +
            '"><span class="ogr-ds-hbar-row__val">' +
            escapeHtml(p.net.toFixed(2)) +
            "</span></div></div></div>"
          );
        })
        .join("");
    }

    var legendHtml = examPoints
      .map(function (p, i) {
        var color = CHART_COLORS[i % CHART_COLORS.length];
        return (
          "<li><i style=\"background:" +
          color +
          '"></i><span><strong>' +
          escapeHtml(shortLabel(p.label, 16)) +
          "</strong>" +
          (p.date && p.date !== "—" ? " · " + escapeHtml(p.date) : "") +
          " · " +
          escapeHtml(p.net.toFixed(2)) +
          " net</span></li>"
        );
      })
      .join("");

    return (
      '<div class="ogr-ds-hbar" role="img" aria-label="Son ' +
      examPoints.length +
      ' deneme net grafiği">' +
      '<div class="ogr-ds-hbar__title-row"><h4>Net</h4></div>' +
      '<div class="ogr-ds-hbar__scale-top">' +
      scaleHtml +
      "</div>" +
      '<div class="ogr-ds-hbar__body">' +
      '<div class="ogr-ds-hbar__grid-bg">' +
      gridHtml +
      "</div>" +
      '<div class="ogr-ds-hbar__rows">' +
      rowsHtml +
      "</div></div>" +
      '<ul class="ogr-ds-hbar-legend">' +
      legendHtml +
      "</ul></div>"
    );
  }

  function buildLineTrendChart(examPoints) {
    if (!examPoints.length) {
      return '<p class="ogr-ds-chart-card__hint" style="margin:auto">Trend için veri yok.</p>';
    }
    var w = 420;
    var h = 170;
    var padL = 38;
    var padR = 14;
    var padT = 18;
    var padB = 36;
    var innerW = w - padL - padR;
    var innerH = h - padT - padB;
    var vals = examPoints.map(function (p) {
      return p.net;
    });
    var minV = Math.min(0, Math.min.apply(null, vals));
    var maxV = Math.max.apply(null, vals);
    if (maxV - minV < 0.5) {
      minV -= 1;
      maxV += 2;
    }
    var step = maxV - minV <= 20 ? 5 : 10;
    var y0 = Math.floor(minV / step) * step;
    var y1 = Math.ceil(maxV / step) * step;
    if (y1 - y0 < step) y1 = y0 + step;

    function yPos(v) {
      return padT + innerH * (1 - (v - y0) / (y1 - y0 || 1));
    }
    function xPos(i) {
      if (examPoints.length === 1) return padL + innerW / 2;
      return padL + (innerW * i) / (examPoints.length - 1);
    }

    var gridLines = "";
    for (var g = y0; g <= y1; g += step) {
      var gy = yPos(g);
      gridLines +=
        '<line x1="' +
        padL +
        '" y1="' +
        gy.toFixed(1) +
        '" x2="' +
        (w - padR) +
        '" y2="' +
        gy.toFixed(1) +
        '" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4 3"/>' +
        '<text x="' +
        (padL - 6) +
        '" y="' +
        (gy + 3.5).toFixed(1) +
        '" text-anchor="end" font-size="9" fill="#64748b" font-weight="600">' +
        g +
        "</text>";
    }

    var coords = examPoints.map(function (p, i) {
      return { x: xPos(i), y: yPos(p.net), net: p.net, label: p.label };
    });
    var lineD = coords
      .map(function (c, i) {
        return (i === 0 ? "M" : "L") + c.x.toFixed(1) + " " + c.y.toFixed(1);
      })
      .join(" ");
    var areaD =
      lineD +
      " L" +
      coords[coords.length - 1].x.toFixed(1) +
      " " +
      (h - padB) +
      " L" +
      coords[0].x.toFixed(1) +
      " " +
      (h - padB) +
      " Z";
    var dots = coords
      .map(function (c, i) {
        var col = CHART_COLORS[i % CHART_COLORS.length];
        return (
          '<circle cx="' +
          c.x.toFixed(1) +
          '" cy="' +
          c.y.toFixed(1) +
          '" r="5" fill="#fff" stroke="' +
          col +
          '" stroke-width="2.5"/>' +
          '<text x="' +
          c.x.toFixed(1) +
          '" y="' +
          (c.y - 9).toFixed(1) +
          '" text-anchor="middle" font-size="8" font-weight="800" fill="' +
          col +
          '">' +
          c.net.toFixed(1) +
          "</text>"
        );
      })
      .join("");
    var xLabels = coords
      .map(function (c) {
        return (
          '<text x="' +
          c.x.toFixed(1) +
          '" y="' +
          (h - 10) +
          '" text-anchor="middle" font-size="7" fill="#475569" font-weight="600">' +
          escapeHtml(shortLabel(c.label, 9)) +
          "</text>"
        );
      })
      .join("");

    var deltaHtml = "";
    if (examPoints.length >= 2) {
      var d = examPoints[examPoints.length - 1].net - examPoints[0].net;
      var cls = d > 0.05 ? "ogr-ds-delta-pill--up" : d < -0.05 ? "ogr-ds-delta-pill--down" : "ogr-ds-delta-pill--flat";
      var sign = d > 0 ? "+" : "";
      deltaHtml =
        '<span class="ogr-ds-delta-pill ' +
        cls +
        '">' +
        (d > 0.05 ? "▲" : d < -0.05 ? "▼" : "●") +
        " " +
        sign +
        d.toFixed(2) +
        " net (ilk → son deneme)</span>";
    }

    return (
      '<div class="ogr-ds-line-trend">' +
      deltaHtml +
      '<svg viewBox="0 0 ' +
      w +
      " " +
      h +
      '" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' +
      "<defs><linearGradient id=\"ogrDsTrendGrad\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\">" +
      '<stop offset="0%" stop-color="#3b82c4" stop-opacity="0.28"/>' +
      '<stop offset="100%" stop-color="#3b82c4" stop-opacity="0.02"/></linearGradient></defs>' +
      gridLines +
      '<path d="' +
      areaD +
      '" fill="url(#ogrDsTrendGrad)"/>' +
      '<path d="' +
      lineD +
      '" fill="none" stroke="#3b82c4" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      dots +
      xLabels +
      "</svg></div>"
    );
  }

  function buildVerticalNetChart(examPoints) {
    if (!examPoints.length) {
      return '<p class="ogr-ds-chart-card__hint" style="margin:auto">Karşılaştırma için veri yok.</p>';
    }
    var max = Math.max.apply(
      null,
      examPoints.map(function (p) {
        return Math.max(0, p.net);
      })
    );
    if (max < 1) max = 1;
    var cols = examPoints
      .map(function (p, i) {
        var pct = Math.max(6, Math.round((Math.max(0, p.net) / max) * 100));
        var color = CHART_COLORS[i % CHART_COLORS.length];
        return (
          '<div class="ogr-ds-vcol__col">' +
          '<span class="ogr-ds-vcol__val">' +
          escapeHtml(p.net.toFixed(2)) +
          '</span><div class="ogr-ds-vcol__fill" style="height:' +
          pct +
          "%;background:linear-gradient(180deg," +
          color +
          ",color-mix(in srgb," +
          color +
          ' 70%, #1e293b))"></div>' +
          '<span class="ogr-ds-vcol__lbl" title="' +
          escapeHtml(p.label) +
          '">' +
          escapeHtml(shortLabel(p.label, 8)) +
          "</span></div>"
        );
      })
      .join("");
    return '<div class="ogr-ds-vcol"><div class="ogr-ds-vcol__plot">' + cols + "</div></div>";
  }

  function buildBranchProgressChart(sections) {
    if (!sections.length) {
      return '<p class="ogr-ds-chart-card__hint" style="margin:auto">Branş verisi yok.</p>';
    }
    var maxPos = Math.max.apply(
      null,
      sections.map(function (s) {
        return Math.max(0, s.net);
      })
    );
    if (maxPos < 1) maxPos = 1;
    var rows = sections
      .map(function (sec, i) {
        var n = sec.net;
        var pct = Math.max(0, Math.min(100, (Math.max(0, n) / maxPos) * 100));
        var color = CHART_COLORS[i % CHART_COLORS.length];
        var fillStyle =
          n < 0
            ? "width:100%;background:linear-gradient(90deg,#fecaca,#f87171)"
            : "width:" + pct.toFixed(1) + "%;background:" + color;
        return (
          '<div class="ogr-ds-branch-bar">' +
          '<span class="ogr-ds-branch-bar__name" title="' +
          escapeHtml(sec.label) +
          '">' +
          escapeHtml(shortLabel(sec.label, 12)) +
          '</span><div class="ogr-ds-branch-bar__track"><div class="ogr-ds-branch-bar__fill" style="' +
          fillStyle +
          '"></div></div>' +
          '<span class="ogr-ds-branch-bar__net">' +
          escapeHtml(n.toFixed(1)) +
          "</span></div>"
        );
      })
      .join("");
    return '<div class="ogr-ds-branch-bars">' + rows + "</div>";
  }

  function buildDonutChart(sections) {
    if (!sections.length) {
      return '<p class="ogr-ds-chart-card__hint" style="margin:auto">Branş dağılımı hesaplanamadı.</p>';
    }
    var total = sections.reduce(function (s, x) {
      return s + Math.max(0, x.net);
    }, 0);
    if (total <= 0) total = 1;
    var r = 42;
    var cx = 55;
    var cy = 55;
    var C = 2 * Math.PI * r;
    var offset = 0;
    var segs = "";
    var legend = "";
    sections.forEach(function (sec, i) {
      var frac = Math.max(0, sec.net) / total;
      var len = frac * C;
      var color = CHART_COLORS[i % CHART_COLORS.length];
      segs +=
        '<circle cx="' +
        cx +
        '" cy="' +
        cy +
        '" r="' +
        r +
        '" fill="none" stroke="' +
        color +
        '" stroke-width="12" stroke-dasharray="' +
        len.toFixed(2) +
        " " +
        (C - len).toFixed(2) +
        '" stroke-dashoffset="' +
        (-offset).toFixed(2) +
        '" transform="rotate(-90 ' +
        cx +
        " " +
        cy +
        ')"/>';
      offset += len;
      legend +=
        "<li><i style=\"background:" +
        color +
        '"></i>' +
        escapeHtml(shortLabel(sec.label, 14)) +
        " · <strong>" +
        sec.net.toFixed(1) +
        "</strong></li>";
    });
    return (
      '<div class="ogr-ds-donut-wrap">' +
      '<svg class="ogr-ds-donut-svg" viewBox="0 0 110 110" aria-hidden="true">' +
      '<circle cx="' +
      cx +
      '" cy="' +
      cy +
      '" r="' +
      r +
      '" fill="none" stroke="#f1f5f9" stroke-width="12"/>' +
      segs +
      "</svg>" +
      '<ul class="ogr-ds-donut-legend">' +
      legend +
      "</ul></div>"
    );
  }

  function buildBarChart(points) {
    if (!points.length) {
      return '<p class="ogr-ds-chart-card__hint" style="margin:auto">Veri yok.</p>';
    }
    var max = Math.max.apply(
      null,
      points.map(function (p) {
        return p.net;
      })
    );
    if (max < 1) max = 1;
    return (
      '<div class="ogr-ds-bar-chart">' +
      points
        .map(function (p, i) {
          var pct = Math.max(6, Math.round((p.net / max) * 100));
          return (
            '<div class="ogr-ds-bar-col">' +
            '<div class="ogr-ds-bar-fill" style="height:' +
            pct +
            '%;opacity:' +
            (0.55 + (i / Math.max(1, points.length - 1)) * 0.45) +
            '"></div>' +
            '<span class="ogr-ds-bar-lbl">' +
            escapeHtml(shortLabel(p.label, 6)) +
            "</span></div>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function renderCharts(rows) {
    var el = document.getElementById("ogr-ds-charts");
    if (!el) return;
    if (!rows.length) {
      el.innerHTML = "";
      return;
    }
    var examPts = getLast5ExamPoints(rows);
    var latest = rows[0];
    var Api = getApi();
    var sections = [];
    try {
      if (Api && typeof Api.getSectionBreakdown === "function") {
        sections = Api.getSectionBreakdown(latest.examId, latest) || [];
      }
    } catch (eSec) {
      sections = [];
    }

    try {
      el.innerHTML =
      '<article class="ogr-ds-chart-card ogr-ds-chart-card--feature">' +
      '<h3 class="ogr-ds-chart-card__title">Net gelişimi</h3>' +
      '<p class="ogr-ds-chart-card__hint">Son ' +
      examPts.length +
      " deneme · detaylı yatay grafik (branş / toplam net)</p>" +
      buildDetailedNetBarChart(examPts) +
      "</article>" +
      '<div class="ogr-ds-charts-sub">' +
      '<article class="ogr-ds-chart-card">' +
      '<h3 class="ogr-ds-chart-card__title">Net eğrisi</h3>' +
      '<p class="ogr-ds-chart-card__hint">Son ' +
      examPts.length +
      " deneme · toplam net trendi</p>" +
      buildLineTrendChart(examPts) +
      "</article>" +
      '<article class="ogr-ds-chart-card">' +
      '<h3 class="ogr-ds-chart-card__title">Deneme karşılaştırma</h3>' +
      '<p class="ogr-ds-chart-card__hint">Son ' +
      examPts.length +
      " deneme · sütun grafik</p>" +
      buildVerticalNetChart(examPts) +
      "</article>" +
      '<article class="ogr-ds-chart-card">' +
      '<h3 class="ogr-ds-chart-card__title">Son deneme — branş dağılımı</h3>' +
      '<p class="ogr-ds-chart-card__hint">' +
      escapeHtml(shortLabel(resolveTitle(latest), 36)) +
      " · halka grafik</p>" +
      buildDonutChart(sections) +
      "</article>" +
      '<article class="ogr-ds-chart-card">' +
      '<h3 class="ogr-ds-chart-card__title">Branş net özeti</h3>' +
      '<p class="ogr-ds-chart-card__hint">' +
      escapeHtml(shortLabel(resolveTitle(latest), 36)) +
      " · son deneme blokları</p>" +
      buildBranchProgressChart(sections) +
      "</article></div>";
    } catch (eChart) {
      if (window.console && window.console.error) window.console.error("ogr-ds charts", eChart);
      el.innerHTML =
        '<p class="ogr-ds-empty">Grafikler yüklenirken hata oluştu. Tablodan denemelerinize erişebilirsiniz.</p>';
    }
  }

  function ensureYksMufredatReady(done) {
    if (window.OgrenciMufredatGate && typeof window.OgrenciMufredatGate.ensureReady === "function") {
      window.OgrenciMufredatGate.ensureReady(done);
      return;
    }
    if (window.YksMufredatApi && typeof window.YksMufredatApi.getSubjects === "function") {
      if (typeof done === "function") done();
      return;
    }
    var tries = 0;
    function tick() {
      if (window.YksMufredatApi && typeof window.YksMufredatApi.getSubjects === "function") {
        if (typeof done === "function") done();
        return;
      }
      tries += 1;
      if (tries < 80) setTimeout(tick, 50);
      else if (typeof done === "function") done();
    }
    tick();
  }

  function canDownloadKarnePdf(Api, rec) {
    if (!Api || !rec || typeof Api.downloadKarnePdf !== "function") return false;
    if (typeof Api.buildKarneHtmlForStudent !== "function") return false;
    var html = Api.buildKarneHtmlForStudent(rec.examId, rec);
    return !!(html && String(html).trim());
  }

  function updateModalPdfButton(pdfBtn, Api, rec, hasKarneHtml) {
    if (!pdfBtn) return;
    var show =
      hasKarneHtml === true
        ? Api && typeof Api.downloadKarnePdf === "function"
        : canDownloadKarnePdf(Api, rec);
    pdfBtn.classList.toggle("hidden", !show);
    pdfBtn.disabled = false;
    pdfBtn.textContent = "PDF / Yazdır";
  }

  function scrollEmbedToTop() {
    try {
      window.scrollTo(0, 0);
    } catch (e) {}
    try {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    } catch (e2) {}
  }

  function lockModalViewport(lock) {
    var html = document.documentElement;
    if (!html) return;
    if (lock) html.classList.add("ogr-ds-modal-open");
    else html.classList.remove("ogr-ds-modal-open");
  }

  function downloadActiveKarnePdf(pdfBtn) {
    var Api = getApi();
    if (!activeRow || !Api) return;
    var run =
      typeof Api.openKarnePrintWindow === "function"
        ? Api.openKarnePrintWindow.bind(Api)
        : typeof Api.downloadKarnePdf === "function"
          ? Api.downloadKarnePdf.bind(Api)
          : null;
    if (!run) return;
    if (pdfBtn) {
      pdfBtn.disabled = true;
      pdfBtn.textContent = "Pencere açılıyor…";
    }
    run(activeRow.examId, activeRow)
      .catch(function (err) {
        if (typeof console !== "undefined" && console.error) console.error("ogr-ds pdf", err);
        if (typeof window.alert === "function") {
          window.alert(
            err && err.message === "popup blocked"
              ? "Yazdırma penceresi engellendi. Lütfen bu site için açılır pencereye izin verin."
              : err && err.message === "empty karne"
                ? "Bu deneme için karne oluşturulamadı."
                : "Yazdırma penceresi açılamadı."
          );
        }
      })
      .finally(function () {
        if (pdfBtn && activeRow) updateModalPdfButton(pdfBtn, Api, activeRow);
      });
  }

  function openModal(rec) {
    activeRow = rec;
    var modal = document.getElementById("ogr-ds-modal");
    var body = document.getElementById("ogr-ds-modal-body");
    var titleEl = document.getElementById("ogr-ds-modal-title");
    var pdfBtn = document.getElementById("ogr-ds-modal-pdf");
    if (!modal || !body) return;

    var title = resolveTitle(rec);
    if (titleEl) titleEl.textContent = title + " — Karne";

    scrollEmbedToTop();
    lockModalViewport(true);
    modal.classList.remove("hidden");
    modal.removeAttribute("hidden");
    document.body.style.overflow = "hidden";
    body.innerHTML = '<p class="ogr-ds-empty">Karne yükleniyor…</p>';

    ensureYksMufredatReady(function () {
      if (activeRow !== rec) return;
      if (window.OgrenciMufredatGate && typeof window.OgrenciMufredatGate.assertScriptOrder === "function") {
        window.OgrenciMufredatGate.assertScriptOrder("ogrenci-deneme-sonuclari karne");
      }
      var Api = getApi();
      var html = "";
      if (Api && typeof Api.buildKarneHtmlForStudent === "function") {
        html = Api.buildKarneHtmlForStudent(rec.examId, rec);
      }
      if (!html) {
        html =
          '<p class="ogr-ds-empty">Bu deneme için detaylı karne oluşturulamadı. Sınav takviminde kayıt ve cevap anahtarı kontrol edin.</p>';
      }
      body.innerHTML = html;
      body.scrollTop = 0;
      updateModalPdfButton(pdfBtn, Api, rec, !!(html && String(html).trim()));
    });
  }

  function closeModal() {
    var modal = document.getElementById("ogr-ds-modal");
    if (!modal) return;
    modal.classList.add("hidden");
    modal.setAttribute("hidden", "");
    lockModalViewport(false);
    document.body.style.overflow = "";
    activeRow = null;
    window.setTimeout(notifyResize, 80);
  }

  function renderTable(rows) {
    var tbody = document.getElementById("ogr-ds-tbody");
    var empty = document.getElementById("ogr-ds-empty");
    if (!tbody) return;

    tbody.innerHTML = "";
    if (!rows.length) {
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;

    rows.forEach(function (r) {
      var tr = document.createElement("tr");
      tr.className = "ogr-ds-row";
      tr.tabIndex = 0;
      tr.setAttribute("role", "button");
      tr.setAttribute("aria-label", resolveTitle(r) + " karnesini aç");

      var title = resolveTitle(r);
      var badge = resolveSinavBadge(r);
      var netDisp = r.net != null && r.net !== "" ? String(r.net) : "—";
      var badgeHtml = badge
        ? '<span class="ogr-ds-badge">' + escapeHtml(badge) + "</span>"
        : "";

      tr.innerHTML =
        '<td><span class="ogr-ds-exam-name">' +
        escapeHtml(title) +
        "</span>" +
        badgeHtml +
        "</td><td>" +
        escapeHtml(formatDisplayDate(r)) +
        "</td><td>" +
        escapeHtml(netDisp) +
        "</td><td>" +
        escapeHtml(pickPuan(r)) +
        "</td>";

      tr.addEventListener("click", function () {
        openModal(r);
      });
      tr.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          openModal(r);
        }
      });
      tbody.appendChild(tr);
    });
  }

  function renderData() {
    var u = getCurrentUser();
    if (!u) {
      window.location.href = "../login.html";
      return null;
    }
    try {
      if (typeof window.ensureDereceStudentCatalog === "function") {
        window.ensureDereceStudentCatalog();
      }
    } catch (eCat) {}
    var Api = getApi();
    if (Api && typeof Api.refreshExams === "function") Api.refreshExams();
    return readMergedResultsForStudent(u);
  }

  function render() {
    var rows = renderData();
    if (!rows) return;
    lastMergedRows = rows;
    renderKpis(rows);
    renderTable(rows);
    notifyResize();
    if (window.OgStudentPerf && typeof window.OgStudentPerf.runIdle === "function") {
      window.OgStudentPerf.runIdle(function () {
        if (lastMergedRows) {
          renderCharts(lastMergedRows);
          notifyResize();
        }
      }, 1200);
    } else {
      setTimeout(function () {
        if (lastMergedRows) {
          renderCharts(lastMergedRows);
          notifyResize();
        }
      }, 24);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var closeBtn = document.getElementById("ogr-ds-modal-close");
    var modal = document.getElementById("ogr-ds-modal");
    var pdfBtn = document.getElementById("ogr-ds-modal-pdf");

    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (modal) {
      modal.addEventListener("click", function (ev) {
        if (ev.target === modal) closeModal();
      });
    }
    if (pdfBtn) {
      pdfBtn.addEventListener("click", function () {
        downloadActiveKarnePdf(pdfBtn);
      });
    }
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") closeModal();
    });

    function bootDenemeSonuclari() {
      render();
    }

    if (window.OgrenciMufredatGate && typeof window.OgrenciMufredatGate.ensureReady === "function") {
      window.OgrenciMufredatGate.ensureReady(bootDenemeSonuclari);
    } else {
      ensureYksMufredatReady(bootDenemeSonuclari);
    }

    window.addEventListener("yks-mufredat:ready", function () {
      render();
      if (!activeRow) return;
      var modalEl = document.getElementById("ogr-ds-modal");
      if (!modalEl || modalEl.classList.contains("hidden")) {
        return;
      }
      var bodyEl = document.getElementById("ogr-ds-modal-body");
      var Api = getApi();
      if (!bodyEl || !Api || typeof Api.buildKarneHtmlForStudent !== "function") return;
      var html = Api.buildKarneHtmlForStudent(activeRow.examId, activeRow);
      if (html) {
        bodyEl.innerHTML = html;
        updateModalPdfButton(pdfBtn, Api, activeRow, true);
        notifyResize();
      }
    });
    window.addEventListener("examResults:change", render);
    window.addEventListener("exams:change", render);
    window.addEventListener("storage", function (e) {
      if (!e || !e.key) return;
      if (
        e.key === "examResults" ||
        e.key.indexOf("examResults_") === 0 ||
        e.key === "kurum_denemeler_v1" ||
        e.key === "global_denemeler_v1" ||
        e.key === "kurumsalExams" ||
        e.key === "globalExams"
      ) {
        render();
      }
    });
  });
})();
