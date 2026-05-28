/**
 * Pazarlama Asistanı — Instagram Story şablonları (1080x1920) + gerçek deneme verisi
 * Kaynaklar:
 * - Denemeler: kurum_denemeler_v1 + global_denemeler_v1 (+ legacy globalExams)
 * - Sonuçlar: examResults (net/puan vs)
 */
(function () {
  "use strict";

  function $(id) {
    return document.getElementById(id);
  }

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function safeParse(raw, fallback) {
    try {
      var v = raw ? JSON.parse(raw) : fallback;
      return v == null ? fallback : v;
    } catch (e) {
      return fallback;
    }
  }

  function readArray(key, altKey) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw && altKey) raw = localStorage.getItem(altKey);
      var arr = safeParse(raw, []);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function readExamResults() {
    try {
      var arr = safeParse(localStorage.getItem("examResults"), []);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function getKurumAdi() {
    try {
      var keys = ["derecepanel_kurum_adi", "kurumAdi", "tm-brief-kurum", "kurum_adi"];
      for (var i = 0; i < keys.length; i++) {
        var v = localStorage.getItem(keys[i]);
        if (v && String(v).trim()) return String(v).trim();
      }
    } catch (e) {}
    var t = document.querySelector(".sidebar__title");
    return t && t.textContent ? t.textContent.trim() : "Kurum";
  }

  function formatTrDate(d) {
    if (!d || String(d).length < 10) return d || "—";
    var p = String(d).split("-");
    if (p.length < 3) return d;
    return p[2] + "." + p[1] + "." + p[0];
  }

  function initials(name) {
    var parts = String(name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!parts.length) return "DP";
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (parts[0].slice(0, 2) || parts[0][0]).toUpperCase();
  }

  function clamp(n, min, max) {
    n = Number(n);
    if (!isFinite(n)) n = min;
    return Math.max(min, Math.min(max, n));
  }

  function parseYmdLocal(ymd) {
    // input[type=date] => "YYYY-MM-DD"
    var s = String(ymd || "").trim();
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (!m) return null;
    var y = Number(m[1]);
    var mo = Number(m[2]);
    var d = Number(m[3]);
    if (!isFinite(y) || !isFinite(mo) || !isFinite(d)) return null;
    var dt = new Date(y, mo - 1, d, 0, 0, 0, 0);
    if (!isFinite(dt.getTime())) return null;
    return dt;
  }

  function hexToRgbTriplet(hex) {
    var h = String(hex || "").trim().replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (h.length !== 6) return null;
    var r = parseInt(h.slice(0, 2), 16);
    var g = parseInt(h.slice(2, 4), 16);
    var b = parseInt(h.slice(4, 6), 16);
    if (![r, g, b].every(function (x) { return isFinite(x); })) return null;
    return r + " " + g + " " + b;
  }

  function examSortKey(ex) {
    var d = ex.date || ex.examDate || ex.tarih || ex.scheduledAt || "";
    var t = Date.parse(String(d));
    return isNaN(t) ? 0 : t;
  }

  function normalizeExam(x, isGlobal) {
    if (!x) return null;
    var out = Object.assign({}, x);
    out.isGlobal = !!isGlobal;
    if (!out.id) out.id = out.examId || out.key || out.uuid || "";
    if (!out.name) out.name = out.title || out.ad || out.examName || "";
    if (!out.date) out.date = out.tarih || out.examDate || out.scheduledAt || out.date || "";
    if (!out.sinav) out.sinav = out.tur || out.sinav || "";
    return out;
  }

  function loadMergedExams() {
    var kurumsal = readArray("kurumsalExams", "kurum_denemeler_v1").map(function (x) {
      return normalizeExam(x, false);
    });
    var global = readArray("globalExams", "global_denemeler_v1").map(function (x) {
      return normalizeExam(x, true);
    });
    if (!global.length) {
      global = readArray("globalExams").map(function (x) {
        return normalizeExam(x, true);
      });
    }
    var seen = {};
    var out = [];
    kurumsal.forEach(function (e) {
      if (!e || !e.id || seen[e.id]) return;
      seen[e.id] = true;
      out.push(e);
    });
    global.forEach(function (e) {
      if (!e || !e.id || seen[e.id]) return;
      seen[e.id] = true;
      out.push(e);
    });
    out.sort(function (a, b) {
      return examSortKey(b) - examSortKey(a);
    });
    return out;
  }

  function resultsForExam(examId) {
    var id = String(examId || "");
    return readExamResults().filter(function (r) {
      return r && String(r.examId) === id;
    });
  }

  function sortByNetDesc(rows) {
    return rows
      .slice()
      .sort(function (a, b) {
        var na = Number(a.net) || 0;
        var nb = Number(b.net) || 0;
        if (nb !== na) return nb - na;
        var ca = String(a.studentCode || a.studentId || "");
        var cb = String(b.studentCode || b.studentId || "");
        return ca.localeCompare(cb, "tr");
      });
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function setLogo(logoDataUrl) {
    var logoBox = $("pm-logo");
    if (!logoBox) return;
    var img = qs("#pm-logo-img", logoBox);
    var fallback = qs("#pm-logo-fallback", logoBox);
    if (logoDataUrl) {
      if (img) {
        img.src = logoDataUrl;
        img.hidden = false;
        img.style.display = "block";
      }
      if (fallback) fallback.hidden = true;
      logoBox.textContent = "";
      if (img) logoBox.appendChild(img);
      if (fallback) logoBox.appendChild(fallback);
    } else {
      if (img) {
        img.hidden = true;
        img.style.display = "none";
        img.removeAttribute("src");
      }
      if (fallback) fallback.hidden = false;
    }
  }

  function syncBrandPreview(brand) {
    var nameEl = $("pm-brandPreviewName");
    if (nameEl) nameEl.textContent = getKurumAdi();
    var fb = $("pm-brandPreviewFallback");
    if (fb) fb.textContent = initials(getKurumAdi());
    var img = $("pm-brandPreviewImg");
    if (!img) return;
    var has = !!(brand && brand.logoDataUrl);
    img.hidden = !has;
    if (has) {
      img.src = brand.logoDataUrl;
      img.style.display = "block";
    } else {
      img.style.display = "none";
      img.removeAttribute("src");
    }
    if (fb) fb.hidden = has;
  }

  function waitForImages(rootEl, timeoutMs) {
    timeoutMs = timeoutMs == null ? 15000 : Number(timeoutMs);
    if (!isFinite(timeoutMs) || timeoutMs <= 0) timeoutMs = 15000;
    if (!rootEl) return Promise.resolve();

    var imgs = Array.prototype.slice.call(rootEl.querySelectorAll("img"));
    if (!imgs.length) return Promise.resolve();

    function waitImg(img) {
      return new Promise(function (resolve) {
        try {
          if (!img || !img.getAttribute) return resolve();
          var src = img.getAttribute("src");
          if (!src) return resolve();
          if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) return resolve();
          var done = false;
          var t = setTimeout(function () {
            if (done) return;
            done = true;
            resolve();
          }, timeoutMs);
          img.onload = function () {
            if (done) return;
            done = true;
            clearTimeout(t);
            resolve();
          };
          img.onerror = function () {
            if (done) return;
            done = true;
            clearTimeout(t);
            resolve();
          };
          if (img.decode) {
            img
              .decode()
              .then(function () {
                if (done) return;
                done = true;
                clearTimeout(t);
                resolve();
              })
              .catch(function () {});
          }
        } catch (e) {
          resolve();
        }
      });
    }

    return Promise.all(imgs.map(waitImg)).then(function () {});
  }

  function applyBrandToStory(brand) {
    var story = $("pm-story-root");
    if (!story) return;
    var bgFrom = (brand && brand.bgFrom) || "#f3e8ff";
    var bgTo = (brand && brand.bgTo) || "#ffedd5";
    var cardBg = (brand && brand.cardBg) || "rgba(255, 255, 255, 0.55)";
    var textMain = (brand && brand.textMain) || "#312e81";
    var textMuted = (brand && brand.textMuted) || "rgba(49, 46, 129, 0.62)";
    var accent = (brand && brand.accent) || "#a78bfa";

    story.style.setProperty("--bg-from", bgFrom);
    story.style.setProperty("--bg-to", bgTo);
    story.style.setProperty("--card-bg", cardBg);
    story.style.setProperty("--text-main", textMain);
    story.style.setProperty("--text-muted", textMuted);
    story.style.setProperty("--accent-color", accent);
    story.style.setProperty("--accent-rgb", hexToRgbTriplet(accent) || "167 139 250");
    setLogo(brand && brand.logoDataUrl ? brand.logoDataUrl : "");
    syncBrandPreview(brand);
  }

  function loadBrandState() {
    var def = {
      themeId: "lavender",
      bgFrom: "#f3e8ff",
      bgTo: "#ffedd5",
      cardBg: "rgba(255, 255, 255, 0.55)",
      textMain: "#312e81",
      textMuted: "rgba(49, 46, 129, 0.62)",
      accent: "#a78bfa",
      logoDataUrl: "",
    };
    try {
      var v = safeParse(localStorage.getItem("pm_brand_v2"), def);
      if (!v || typeof v !== "object") return def;
      if (typeof v.themeId !== "string") v.themeId = def.themeId;
      if (typeof v.bgFrom !== "string") v.bgFrom = def.bgFrom;
      if (typeof v.bgTo !== "string") v.bgTo = def.bgTo;
      if (typeof v.cardBg !== "string") v.cardBg = def.cardBg;
      if (typeof v.textMain !== "string") v.textMain = def.textMain;
      if (typeof v.textMuted !== "string") v.textMuted = def.textMuted;
      if (typeof v.accent !== "string") v.accent = def.accent;
      if (typeof v.logoDataUrl !== "string") v.logoDataUrl = "";
      return v;
    } catch (e) {
      return def;
    }
  }

  function saveBrandState(state) {
    try {
      localStorage.setItem("pm_brand_v2", JSON.stringify(state));
    } catch (e) {}
  }

  function buildRowHtml(rank, rec) {
    var nm = String(rec.name || rec.studentName || "").trim() || "Belirtilmedi";
    var code = String(rec.studentCode || rec.studentId || "").trim();
    var net = rec.net != null ? Number(rec.net) : 0;
    var netStr = isFinite(net) ? net.toFixed(2) : "0.00";

    var medal = "";
    if (rank === 1) medal = '<span class="pm-medal pm-medal--1" aria-label="Altın">🥇</span>';
    else if (rank === 2) medal = '<span class="pm-medal pm-medal--2" aria-label="Gümüş">🥈</span>';
    else if (rank === 3) medal = '<span class="pm-medal pm-medal--3" aria-label="Bronz">🥉</span>';
    else medal = '<span class="pm-medal" style="background:rgba(255,255,255,.06); color:rgba(255,255,255,.9)">#</span>';

    var cls = "pm-row";
    if (rank === 1) cls += " pm-row--1";
    else if (rank === 2) cls += " pm-row--2";
    else if (rank === 3) cls += " pm-row--3";
    var crown = rank === 1 ? '<span class="pm-crown" aria-hidden="true">👑</span>' : "";

    return (
      '<div class="' +
      cls +
      '" role="row">' +
      crown +
      '<div class="pm-rank">' +
      medal +
      '<span>' +
      rank +
      "</span></div>" +
      '<div><div class="pm-name">' +
      escapeHtml(nm) +
      '</div><div class="pm-sub">' +
      (code ? "No: " + escapeHtml(code) : "—") +
      "</div></div>" +
      '<div class="pm-net">' +
      escapeHtml(netStr) +
      '<small>NET</small>' +
      "</div>" +
      "</div>"
    );
  }

  function buildEmptyStateHtml() {
    return (
      '<div class="pm-empty" role="status" aria-live="polite">' +
      '<div class="pm-empty-ico" aria-hidden="true">⏳</div>' +
      "<h2>Sınav Sonuçları<br>Bekleniyor…</h2>" +
      "<p>Optik yüklemesi veya sonuç kaydı tamamlandığında<br>ilk 10 burada otomatik oluşur.</p>" +
      "</div>"
    );
  }

  function ensureTemplateHost() {
    var host = $("pm-template-host");
    if (!host) return null;
    return host;
  }

  function clampInt(n, min, max, fallback) {
    n = parseInt(String(n || ""), 10);
    if (!isFinite(n)) n = fallback == null ? min : fallback;
    n = Math.max(min, Math.min(max, n));
    return n;
  }

  function styleChoicesFor(kind) {
    if (kind === "leaderboard") {
      return [
        { value: "1", label: "Stil 1 · Glassmorphism Liste" },
        { value: "2", label: "Stil 2 · Floating Cards" },
        { value: "3", label: "Stil 3 · Minimalist Kurumsal" },
      ];
    }
    if (kind === "star") {
      return [
        { value: "1", label: "Stil 1 · Polaroid Frame" },
        { value: "2", label: "Stil 2 · Devasa Tipografi" },
        { value: "3", label: "Stil 3 · Pastel Spotlight" },
      ];
    }
    return [
      { value: "1", label: "Stil 1 · Devasa Rakamlar" },
      { value: "2", label: "Stil 2 · Zen Progress" },
      { value: "3", label: "Stil 3 · Takvim Yaprağı" },
    ];
  }

  function loadTemplateStyleMap() {
    try {
      var v = safeParse(localStorage.getItem("pm_tpl_style_v1"), {});
      return v && typeof v === "object" ? v : {};
    } catch (e) {
      return {};
    }
  }

  function saveTemplateStyleMap(map) {
    try {
      localStorage.setItem("pm_tpl_style_v1", JSON.stringify(map || {}));
    } catch (e) {}
  }

  function setStyleSelectOptions(styleSel, kind, wantedStyle, styleMap) {
    if (!styleSel) return "1";
    var choices = styleChoicesFor(kind);
    var prev = (styleMap && styleMap[kind]) || "";
    var desired = String(wantedStyle || prev || "1");

    styleSel.innerHTML = "";
    for (var i = 0; i < choices.length; i++) {
      var opt = document.createElement("option");
      opt.value = String(choices[i].value);
      opt.textContent = String(choices[i].label);
      styleSel.appendChild(opt);
    }

    var ok = choices.some(function (c) { return String(c.value) === desired; });
    styleSel.value = ok ? desired : "1";
    var finalVal = String(styleSel.value || "1");
    if (styleMap && kind) {
      styleMap[kind] = finalVal;
      saveTemplateStyleMap(styleMap);
    }
    return finalVal;
  }

  function templateMarkup(kind, style) {
    var s = clampInt(style, 1, 3, 1);
    var cls = "pm-tpl pm-kind--" + String(kind || "leaderboard") + " pm-style--" + String(s);

    function topbar(badgeText) {
      return (
        '<div class="pm-watermark" aria-hidden="true"></div>' +
        '<div class="pm-topbar">' +
        '  <div class="pm-brand">' +
        '    <div class="pm-logo" id="pm-logo">' +
        '      <img id="pm-logo-img" alt="Logo" hidden style="width:100%;height:100%;object-fit:contain;border-radius:22px" />' +
        '      <span id="pm-logo-fallback">DP</span>' +
        "    </div>" +
        '    <div class="pm-brand-text">' +
        '      <p class="pm-kurum" id="pm-kurum">Kurum</p>' +
        '      <p class="pm-exam" id="pm-exam">Deneme adı</p>' +
        "    </div>" +
        "  </div>" +
        '  <div class="pm-badge" id="pm-badge">' +
        escapeHtml(badgeText || "") +
        "</div>" +
        "</div>"
      );
    }

    if (kind === "leaderboard") {
      var head =
        '<div class="' +
        cls +
        '">' +
        topbar("TOP 10") +
        '<div class="pm-title">' +
        '  <h1 id="pm-title">İlk 10</h1>' +
        '  <p class="pm-date" id="pm-date">—</p>' +
        "</div>";

      if (s === 1) {
        return (
          head +
          '<div class="pm-board pm-board--glasslist" role="table" aria-label="İlk 10 tablosu">' +
          '  <div class="pm-board-head" role="row">' +
          '    <div class="pm-board-head-title">' +
          '      <strong id="pm-board-title">LİDERLİK TABLOSU</strong>' +
          '      <span id="pm-board-sub">İlk 10</span>' +
          "    </div>" +
          '    <div class="pm-board-head-metric" id="pm-board-metric">Toplam Net</div>' +
          "  </div>" +
          '  <div id="pm-rows" class="pm-rows pm-rows--glasslist"></div>' +
          "</div>" +
          '<div class="pm-foot">' +
          '  <span class="pm-pill" id="pm-foot-left">Veri: examResults</span>' +
          '  <span class="pm-hairline" aria-hidden="true"></span>' +
          '  <span class="pm-pill" id="pm-foot-right">derecepanel</span>' +
          "</div>" +
          "</div>"
        );
      }

      if (s === 2) {
        return (
          head +
          '<div class="pm-board pm-board--floatcards" role="table" aria-label="İlk 10 tablosu">' +
          '  <div class="pm-board-head" role="row">' +
          '    <div class="pm-board-head-title">' +
          '      <strong id="pm-board-title">LİDERLİK TABLOSU</strong>' +
          '      <span id="pm-board-sub">İlk 10</span>' +
          "    </div>" +
          '    <div class="pm-board-head-metric" id="pm-board-metric">Toplam Net</div>' +
          "  </div>" +
          '  <div id="pm-rows" class="pm-rows pm-rows--floatcards"></div>' +
          "</div>" +
          '<div class="pm-foot">' +
          '  <span class="pm-pill" id="pm-foot-left">Veri: examResults</span>' +
          '  <span class="pm-hairline" aria-hidden="true"></span>' +
          '  <span class="pm-pill" id="pm-foot-right">derecepanel</span>' +
          "</div>" +
          "</div>"
        );
      }

      // s === 3
      return (
        head +
        '<div class="pm-board pm-board--minimal" role="table" aria-label="İlk 10 tablosu">' +
        '  <div class="pm-board-head pm-board-head--minimal" role="row">' +
        '    <div class="pm-board-head-title">' +
        '      <strong id="pm-board-title">LİDERLİK TABLOSU</strong>' +
        '      <span id="pm-board-sub">İlk 10</span>' +
        "    </div>" +
        '    <div class="pm-board-head-metric" id="pm-board-metric">Toplam Net</div>' +
        "  </div>" +
        '  <div id="pm-rows" class="pm-rows pm-rows--minimal"></div>' +
        "</div>" +
        '<div class="pm-foot pm-foot--minimal">' +
        '  <span class="pm-pill" id="pm-foot-left">Veri: examResults</span>' +
        '  <span class="pm-hairline" aria-hidden="true"></span>' +
        '  <span class="pm-pill" id="pm-foot-right">derecepanel</span>' +
        "</div>" +
        "</div>"
      );
    }

    if (kind === "star") {
      if (s === 1) {
        return (
          '<div class="' +
          cls +
          '">' +
          topbar("SPOTLIGHT") +
          '<div class="pm-star pm-star--polaroid">' +
          '  <p class="pm-star-kicker" id="pm-star-kicker">GEÇEN SINAVA GÖRE</p>' +
          '  <h1 class="pm-star-title" id="pm-star-title">Haftanın Yıldızı</h1>' +
          '  <p class="pm-star-sub" id="pm-star-sub">Netini en çok artıran öğrencimiz!</p>' +
          '  <div class="pm-polaroid" aria-label="Polaroid çerçeve">' +
          '    <div class="pm-polaroid-photo">' +
          '      <div class="pm-polaroid-avatar" id="pm-star-avatar"><div class="pm-polaroid-avatarInner" id="pm-star-avatar-inner">AA</div></div>' +
          "    </div>" +
          '    <div class="pm-polaroid-name" id="pm-star-name">Öğrenci Adı</div>' +
          "  </div>" +
          '  <div class="pm-star-metrics" id="pm-star-metrics">' +
          '    <div class="pm-star-metric"><div class="pm-star-metric-label">Artış</div><div class="pm-star-metric-value" id="pm-star-delta">+0.00</div></div>' +
          '    <div class="pm-star-metric"><div class="pm-star-metric-label">Yeni Net</div><div class="pm-star-metric-value" id="pm-star-net">0.00</div></div>' +
          "  </div>" +
          "</div>" +
          '<div class="pm-foot">' +
          '  <span class="pm-pill" id="pm-foot-left">Veri: examResults</span>' +
          '  <span class="pm-hairline" aria-hidden="true"></span>' +
          '  <span class="pm-pill" id="pm-foot-right">derecepanel</span>' +
          "</div>" +
          "</div>"
        );
      }

      if (s === 2) {
        return (
          '<div class="' +
          cls +
          '">' +
          topbar("SPOTLIGHT") +
          '<div class="pm-star pm-star--bigtype">' +
          '  <div class="pm-star-watermark" aria-hidden="true">HAFTANIN YILDIZI</div>' +
          '  <p class="pm-star-kicker" id="pm-star-kicker">GEÇEN SINAVA GÖRE</p>' +
          '  <div class="pm-bigName" id="pm-star-name">Öğrenci Adı</div>' +
          '  <div class="pm-bigMeta">' +
          '    <div class="pm-bigMetaLine"><span class="pm-bigMetaK">Artış</span><span class="pm-bigMetaV" id="pm-star-delta">+0.00</span></div>' +
          '    <div class="pm-bigMetaLine"><span class="pm-bigMetaK">Yeni Net</span><span class="pm-bigMetaV" id="pm-star-net">0.00</span></div>' +
          "  </div>" +
          '  <div class="pm-bigAvatar" id="pm-star-avatar"><div class="pm-bigAvatarInner" id="pm-star-avatar-inner">AA</div></div>' +
          // Keep existing ids for text bindings (title/sub hidden in CSS for this style)
          '  <h1 class="pm-star-title" id="pm-star-title">Haftanın Yıldızı</h1>' +
          '  <p class="pm-star-sub" id="pm-star-sub">Netini en çok artıran öğrencimiz!</p>' +
          '  <div class="pm-star-metrics" id="pm-star-metrics"></div>' +
          "</div>" +
          '<div class="pm-foot">' +
          '  <span class="pm-pill" id="pm-foot-left">Veri: examResults</span>' +
          '  <span class="pm-hairline" aria-hidden="true"></span>' +
          '  <span class="pm-pill" id="pm-foot-right">derecepanel</span>' +
          "</div>" +
          "</div>"
        );
      }

      // s === 3
      return (
        '<div class="' +
        cls +
        '">' +
        topbar("SPOTLIGHT") +
        '<div class="pm-star pm-star--spotlight">' +
        '  <div class="pm-spotGlow" aria-hidden="true"></div>' +
        '  <p class="pm-star-kicker" id="pm-star-kicker">GEÇEN SINAVA GÖRE</p>' +
        '  <h1 class="pm-star-title" id="pm-star-title">Haftanın Yıldızı</h1>' +
        '  <div class="pm-spotAvatar" id="pm-star-avatar"><div class="pm-spotAvatarInner" id="pm-star-avatar-inner">AA</div></div>' +
        '  <div class="pm-spotName" id="pm-star-name">Öğrenci Adı</div>' +
        '  <p class="pm-star-sub" id="pm-star-sub">Netini en çok artıran öğrencimiz!</p>' +
        '  <div class="pm-spotMetrics">' +
        '    <div class="pm-spotMetric"><span>Artış</span><strong id="pm-star-delta">+0.00</strong></div>' +
        '    <div class="pm-spotMetric"><span>Yeni Net</span><strong id="pm-star-net">0.00</strong></div>' +
        "  </div>" +
        '  <div class="pm-star-metrics" id="pm-star-metrics"></div>' +
        "</div>" +
        '<div class="pm-foot">' +
        '  <span class="pm-pill" id="pm-foot-left">Veri: examResults</span>' +
        '  <span class="pm-hairline" aria-hidden="true"></span>' +
        '  <span class="pm-pill" id="pm-foot-right">derecepanel</span>' +
        "</div>" +
        "</div>"
      );
    }

    // countdown
    if (s === 1) {
      return (
        '<div class="' +
        cls +
        '">' +
        topbar("MOTİVASYON") +
        '<div class="pm-countdown pm-countdown--huge">' +
        '  <div class="pm-hugeDays" id="pm-countdown-days">—</div>' +
        '  <div class="pm-hugeLabel">GÜN KALDI</div>' +
        '  <div class="pm-hugeHeadline" id="pm-countdown-label">YKS\'YE</div>' +
        '  <div class="pm-hugeSub" id="pm-countdown-sub">Kaldı. Hazırsın.</div>' +
        '  <div class="pm-hugeQuote" id="pm-countdown-quote">Bugün çalış, yarın gurur duy.</div>' +
        '  <div class="pm-progress" aria-label="İlerleme çubuğu" style="margin-top: 32px">' +
        '    <div class="pm-progress-fill" id="pm-progress-fill" style="width: 50%"></div>' +
        "  </div>" +
        "</div>" +
        '<div class="pm-foot">' +
        '  <span class="pm-pill" id="pm-foot-left">Şablon: Geri Sayım</span>' +
        '  <span class="pm-hairline" aria-hidden="true"></span>' +
        '  <span class="pm-pill" id="pm-foot-right">derecepanel</span>' +
        "</div>" +
        "</div>"
      );
    }

    if (s === 2) {
      return (
        '<div class="' +
        cls +
        '">' +
        topbar("MOTİVASYON") +
        '<div class="pm-countdown pm-countdown--zen">' +
        '  <p class="pm-zenQuote" id="pm-countdown-quote">Bugün çalış, yarın gurur duy.</p>' +
        '  <div class="pm-zenDaysRow">' +
        '    <div class="pm-zenDays"><span id="pm-countdown-days">—</span></div>' +
        '    <div class="pm-zenMeta">' +
        '      <div class="pm-zenLabel" id="pm-countdown-label">YKS\'YE</div>' +
        '      <div class="pm-zenSub" id="pm-countdown-sub">Kaldı. Hazırsın.</div>' +
        "    </div>" +
        "  </div>" +
        '  <div class="pm-zenProgressWrap">' +
        '    <div class="pm-zenTrack" aria-hidden="true"></div>' +
        '    <div class="pm-zenFill" id="pm-progress-fill" style="width: 50%"></div>' +
        "  </div>" +
        "</div>" +
        '<div class="pm-foot">' +
        '  <span class="pm-pill" id="pm-foot-left">Şablon: Geri Sayım</span>' +
        '  <span class="pm-hairline" aria-hidden="true"></span>' +
        '  <span class="pm-pill" id="pm-foot-right">derecepanel</span>' +
        "</div>" +
        "</div>"
      );
    }

    // s === 3
    return (
      '<div class="' +
      cls +
      '">' +
      topbar("MOTİVASYON") +
      '<div class="pm-countdown pm-countdown--calendar">' +
      '  <div class="pm-calCard" role="group" aria-label="Takvim kartı">' +
      '    <div class="pm-calTop">' +
      '      <div class="pm-calDots" aria-hidden="true"><span></span><span></span></div>' +
      '      <div class="pm-calMonth" id="pm-countdown-label">YKS\'YE</div>' +
      "    </div>" +
      '    <div class="pm-calDay" id="pm-countdown-days">—</div>' +
      '    <div class="pm-calBottom" id="pm-countdown-sub">GÜN KALDI</div>' +
      "  </div>" +
      '  <div class="pm-calQuote" id="pm-countdown-quote">Bugün çalış, yarın gurur duy.</div>' +
      '  <div class="pm-progress" aria-label="İlerleme çubuğu" style="margin-top: 26px">' +
      '    <div class="pm-progress-fill" id="pm-progress-fill" style="width: 50%"></div>' +
      "  </div>" +
      "</div>" +
      '<div class="pm-foot">' +
      '  <span class="pm-pill" id="pm-foot-left">Şablon: Geri Sayım</span>' +
      '  <span class="pm-hairline" aria-hidden="true"></span>' +
      '  <span class="pm-pill" id="pm-foot-right">derecepanel</span>' +
      "</div>" +
      "</div>"
    );
  }

  function loadTextState() {
    var def = {
      leaderboard: { title: "İlk 10", badge: "TOP 10", boardTitle: "LİDERLİK TABLOSU", metric: "Toplam Net", footRight: "derecepanel" },
      star: {
        badge: "SPOTLIGHT",
        kickerBase: "GEÇEN SINAV",
        kickerEmpty: "GEÇEN SINAV VERİSİ YOK",
        title: "Haftanın Yıldızı",
        sub: "Netini en çok artıran öğrencimiz!",
      },
      countdown: {
        badge: "MOTİVASYON",
        label: "YKS'YE",
        subMsg: "Kaldı. Hazırsın.",
        quote: "Bugün çalış, yarın gurur duy.",
        totalDays: 365,
        footLeft: "Şablon: Geri Sayım",
      },
    };
    try {
      var v = safeParse(localStorage.getItem("pm_text_v2"), def);
      if (!v || typeof v !== "object") return def;
      // shallow merge per section
      v.leaderboard = Object.assign({}, def.leaderboard, v.leaderboard || {});
      v.star = Object.assign({}, def.star, v.star || {});
      v.countdown = Object.assign({}, def.countdown, v.countdown || {});
      return v;
    } catch (e) {
      return def;
    }
  }

  function saveTextState(state) {
    try {
      localStorage.setItem("pm_text_v2", JSON.stringify(state));
    } catch (e) {}
  }

  function buildLeaderboardRowHtml(style, rank, rec) {
    var s = clampInt(style, 1, 3, 1);
    var nm = String(rec.name || rec.studentName || "").trim() || "Belirtilmedi";
    var code = String(rec.studentCode || rec.studentId || "").trim();
    var net = rec.net != null ? Number(rec.net) : 0;
    var netStr = isFinite(net) ? net.toFixed(2) : "0.00";
    var medal = "";
    if (rank === 1) medal = "🥇";
    else if (rank === 2) medal = "🥈";
    else if (rank === 3) medal = "🥉";

    if (s === 1) {
      return (
        '<div class="pm-glassLine pm-glassLine--' +
        rank +
        '">' +
        '<div class="pm-glassRank"><span class="pm-glassMedal" aria-hidden="true">' +
        escapeHtml(medal || "") +
        '</span><strong>#' +
        rank +
        "</strong></div>" +
        '<div class="pm-glassName"><div class="pm-glassNameMain">' +
        escapeHtml(nm) +
        '</div><div class="pm-glassNameSub">' +
        (code ? "No: " + escapeHtml(code) : "—") +
        "</div></div>" +
        '<div class="pm-glassNet"><span class="pm-glassNetVal">' +
        escapeHtml(netStr) +
        '</span><span class="pm-glassNetLbl">NET</span></div>' +
        "</div>"
      );
    }

    if (s === 2) {
      return (
        '<div class="pm-floatCard pm-floatCard--' +
        rank +
        '">' +
        '<div class="pm-floatLeft">' +
        '<div class="pm-floatRank"><span class="pm-floatBadge" aria-hidden="true">' +
        escapeHtml(medal || "#") +
        "</span><strong>" +
        rank +
        "</strong></div>" +
        '<div class="pm-floatName">' +
        escapeHtml(nm) +
        "</div>" +
        "</div>" +
        '<div class="pm-floatRight">' +
        '<div class="pm-floatNet">' +
        escapeHtml(netStr) +
        "</div>" +
        '<div class="pm-floatCode">' +
        (code ? "No: " + escapeHtml(code) : "—") +
        "</div>" +
        "</div>" +
        "</div>"
      );
    }

    // s === 3 minimalist
    return (
      '<div class="pm-minRow pm-minRow--' +
      rank +
      '">' +
      '<div class="pm-minLeft">' +
      '<span class="pm-minRank">' +
      rank +
      '</span><span class="pm-minName">' +
      escapeHtml(nm) +
      "</span>" +
      "</div>" +
      '<div class="pm-minRight">' +
      '<span class="pm-minNet">' +
      escapeHtml(netStr) +
      '</span><span class="pm-minUnit">NET</span>' +
      "</div>" +
      "</div>"
    );
  }

  function buildLeaderboardEmptyStateHtml(style) {
    var s = clampInt(style, 1, 3, 1);
    if (s === 3) {
      return (
        '<div class="pm-minEmpty" role="status" aria-live="polite">' +
        "<div>Sonuç yok.</div>" +
        "<div>Optik/sonuç kaydı tamamlanınca ilk 10 oluşur.</div>" +
        "</div>"
      );
    }
    return buildEmptyStateHtml();
  }

  function renderTop10(exam, brand, style) {
    var kurum = getKurumAdi();
    var logo = $("pm-logo");
    var kurumEl = $("pm-kurum");
    var examEl = $("pm-exam");
    var dateEl = $("pm-date");
    var rowsEl = $("pm-rows");
    var boardSub = $("pm-board-sub");
    var metaCount = $("pm-meta-count");
    var metaTop = $("pm-meta-top");

    if (logo) {
      var fb = $("pm-logo-fallback");
      if (fb) fb.textContent = initials(kurum);
    }
    if (kurumEl) kurumEl.textContent = kurum;
    applyBrandToStory(brand);

    if (!exam || !exam.id) {
      if (examEl) examEl.textContent = "Deneme seçin";
      if (dateEl) dateEl.textContent = "—";
      if (rowsEl) rowsEl.innerHTML = buildLeaderboardEmptyStateHtml(style);
      if (boardSub) boardSub.textContent = "İlk 10";
      if (metaCount) metaCount.textContent = "—";
      if (metaTop) metaTop.textContent = "—";
      return;
    }

    var title = exam.name || exam.title || exam.ad || String(exam.id);
    if (examEl) examEl.textContent = title;
    if (dateEl) dateEl.textContent = formatTrDate(exam.date || exam.tarih || exam.examDate);
    if (boardSub) boardSub.textContent = "İlk 10";

    var all = resultsForExam(exam.id);
    var sorted = sortByNetDesc(all);
    var top = sorted.slice(0, 10);

    if (metaCount) metaCount.textContent = String(all.length || 0);
    if (metaTop) metaTop.textContent = String(top.length || 0);

    var html = "";
    for (var i = 0; i < top.length; i++) {
      html += buildLeaderboardRowHtml(style, i + 1, top[i]);
    }
    if (!html) {
      html = buildLeaderboardEmptyStateHtml(style);
    }
    if (rowsEl) rowsEl.innerHTML = html;
  }

  function prevExamOf(exams, exam) {
    if (!exam || !exam.id) return null;
    var sorted = exams.slice().sort(function (a, b) { return examSortKey(a) - examSortKey(b); });
    var idx = -1;
    for (var i = 0; i < sorted.length; i++) {
      if (sorted[i] && String(sorted[i].id) === String(exam.id)) { idx = i; break; }
    }
    if (idx <= 0) return null;
    for (var j = idx - 1; j >= 0; j--) {
      if (sorted[j] && sorted[j].id) return sorted[j];
    }
    return null;
  }

  function bestImprover(currentExam, previousExam) {
    var cur = currentExam ? resultsForExam(currentExam.id) : [];
    if (!cur.length) return null;
    var prev = previousExam ? resultsForExam(previousExam.id) : [];
    var prevMap = {};
    for (var i = 0; i < prev.length; i++) {
      var p = prev[i];
      var key = String(p.studentCode || p.studentId || "");
      if (!key) continue;
      prevMap[key] = Number(p.net) || 0;
    }
    var best = null;
    for (var j = 0; j < cur.length; j++) {
      var r = cur[j];
      var k = String(r.studentCode || r.studentId || "");
      var curNet = Number(r.net) || 0;
      var prevNet = prevMap.hasOwnProperty(k) ? prevMap[k] : null;
      var delta = prevNet == null ? null : curNet - prevNet;
      if (delta == null) continue;
      if (!best || delta > best.delta) {
        best = { rec: r, delta: delta, net: curNet, code: k };
      }
    }
    if (best) return best;
    // fallback: en yüksek net
    var top = sortByNetDesc(cur)[0];
    if (!top) return null;
    return { rec: top, delta: null, net: Number(top.net) || 0, code: String(top.studentCode || top.studentId || "") };
  }

  function renderStar(exams, exam, brand, textState) {
    var kurum = getKurumAdi();
    var kurumEl = $("pm-kurum");
    var examEl = $("pm-exam");
    var footL = $("pm-foot-left");
    var badge = $("pm-badge");
    if (kurumEl) kurumEl.textContent = kurum;
    if (examEl) examEl.textContent = exam && exam.id ? (exam.name || exam.title || exam.ad || String(exam.id)) : "Deneme seçin";
    if (footL) footL.textContent = "Veri: examResults";
    applyBrandToStory(brand);

    var fb = $("pm-logo-fallback");
    if (fb) fb.textContent = initials(kurum);

    var kicker = $("pm-star-kicker");
    var title = $("pm-star-title");
    var sub = $("pm-star-sub");
    var avatarInner = $("pm-star-avatar-inner");
    var nameEl = $("pm-star-name");
    var deltaEl = $("pm-star-delta");
    var netEl = $("pm-star-net");

    var st = textState && textState.star ? textState.star : null;
    if (badge && st && st.badge) badge.textContent = String(st.badge);
    if (title && st && st.title) title.textContent = String(st.title);
    if (sub && st && st.sub) sub.textContent = String(st.sub);

    if (!exam || !exam.id) {
      if (kicker) kicker.textContent = "DENEME SEÇİN";
      if (sub) sub.textContent = "Bir deneme seçince otomatik oluşturulur.";
      if (avatarInner) avatarInner.textContent = "—";
      if (nameEl) nameEl.textContent = "—";
      if (deltaEl) deltaEl.textContent = "—";
      if (netEl) netEl.textContent = "—";
      return;
    }

    var prev = prevExamOf(exams, exam);
    var best = bestImprover(exam, prev);
    var prevName = prev ? (prev.name || prev.title || prev.ad || String(prev.id)) : "";
    if (kicker) {
      if (prev) kicker.textContent = (st && st.kickerBase ? st.kickerBase : "GEÇEN SINAV") + ": " + prevName;
      else kicker.textContent = (st && st.kickerEmpty ? st.kickerEmpty : "GEÇEN SINAV VERİSİ YOK");
    }

    if (!best) {
      if (avatarInner) avatarInner.textContent = "—";
      if (nameEl) nameEl.textContent = "Veri yok";
      if (deltaEl) deltaEl.textContent = "—";
      if (netEl) netEl.textContent = "—";
      return;
    }

    var nm = String(best.rec.name || best.rec.studentName || "").trim() || "Belirtilmedi";
    if (avatarInner) avatarInner.textContent = initials(nm);
    if (nameEl) nameEl.textContent = nm;
    if (netEl) netEl.textContent = (isFinite(best.net) ? best.net.toFixed(2) : "0.00");
    if (best.delta == null) deltaEl.textContent = "—";
    else deltaEl.textContent = (best.delta >= 0 ? "+" : "") + best.delta.toFixed(2);
  }

  function renderCountdown(custom, brand, textState) {
    var kurum = getKurumAdi();
    var kurumEl = $("pm-kurum");
    var examEl = $("pm-exam");
    applyBrandToStory(brand);
    var fb = $("pm-logo-fallback");
    if (fb) fb.textContent = initials(kurum);
    if (kurumEl) kurumEl.textContent = kurum;
    if (examEl) examEl.textContent = "Motivasyon";

    var label = $("pm-countdown-label");
    var daysEl = $("pm-countdown-days");
    var sub = $("pm-countdown-sub");
    var quote = $("pm-countdown-quote");
    var fill = $("pm-progress-fill");
    var badge = $("pm-badge");
    var footLeft = $("pm-foot-left");

    var ct = textState && textState.countdown ? textState.countdown : null;
    if (badge && ct && ct.badge) badge.textContent = String(ct.badge);
    if (footLeft && ct && ct.footLeft) footLeft.textContent = String(ct.footLeft);

    var t = custom && custom.targetDate ? String(custom.targetDate) : "";
    var headline = (custom && custom.headline) || (ct && ct.label) || "YKS'YE";
    var q = (custom && custom.quote) || (ct && ct.quote) || "Bugün çalış, yarın gurur duy.";
    var subMsg = (custom && custom.subMsg) || (ct && ct.subMsg) || "Kaldı. Hazırsın.";
    var totalDays = custom && custom.totalDays != null ? Number(custom.totalDays) : (ct && ct.totalDays != null ? Number(ct.totalDays) : 365);
    if (!isFinite(totalDays) || totalDays <= 1) totalDays = 365;

    var days = "—";
    var daysNum = null;
    if (t) {
      var dt = parseYmdLocal(t);
      if (dt) {
        var now = new Date();
        // compare local midnights to avoid timezone drift
        var today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        var diff = dt.getTime() - today0.getTime();
        var d = Math.ceil(diff / (24 * 60 * 60 * 1000));
        daysNum = clamp(d, 0, 9999);
        days = String(daysNum);
      }
    }
    if (label) label.textContent = headline;
    if (daysEl) daysEl.textContent = days;
    if (sub) sub.textContent = subMsg;
    if (quote) quote.textContent = q;

    if (fill) {
      var pct = 0.5;
      if (daysNum != null && isFinite(daysNum)) {
        pct = 1 - daysNum / totalDays;
      }
      pct = clamp(pct, 0, 1);
      fill.style.width = Math.round(pct * 100) + "%";
    }
  }

  function computePreviewScale() {
    var preview = $("pm-preview");
    var canvasBox = $("pm-canvas");
    var inner = $("pm-preview-inner");
    var label = $("pm-preview-scale");
    if (!preview || !canvasBox || !inner) return;

    var boxW = canvasBox.clientWidth;
    var boxH = canvasBox.clientHeight;
    if (!boxW || !boxH) return;

    var sw = boxW / 1080;
    var sh = boxH / 1920;
    var s = Math.min(sw, sh, 1);
    s = Math.max(0.15, s);
    // True visual centering: absolute center + scale (transform doesn't affect layout)
    canvasBox.style.position = "relative";
    inner.style.position = "absolute";
    inner.style.left = "50%";
    inner.style.top = "50%";
    inner.style.transformOrigin = "center center";
    inner.style.transform = "translate(-50%, -50%) scale(" + s.toFixed(4) + ")";
    if (label) label.textContent = "Ölçek: %" + Math.round(s * 100);
  }

  function populateExamSelect(exams) {
    var sel = $("pm-exam-select");
    if (!sel) return;
    var cur = sel.value;
    sel.innerHTML = '<option value="">Deneme seçin…</option>';
    for (var i = 0; i < exams.length; i++) {
      var ex = exams[i];
      if (!ex || !ex.id) continue;
      var opt = document.createElement("option");
      opt.value = String(ex.id);
      var dt = ex.date || ex.tarih || ex.examDate || "";
      var meta = dt ? " · " + formatTrDate(dt) : "";
      opt.textContent = (ex.name || ex.title || ex.ad || String(ex.id)) + meta;
      sel.appendChild(opt);
    }
    if (cur) sel.value = cur;
  }

  function findExam(exams, id) {
    var sid = String(id || "");
    for (var i = 0; i < exams.length; i++) {
      if (exams[i] && String(exams[i].id) === sid) return exams[i];
    }
    return null;
  }

  function downloadPngFromStory(templateKind) {
    var story = $("pm-story-root");
    if (!story || !window.html2canvas) return;

    var examSel = $("pm-exam-select");
    var exId = examSel && examSel.value ? String(examSel.value) : "";
    var styleSel = $("pm-template-style");
    var style = styleSel && styleSel.value ? String(styleSel.value) : "";
    var fn =
      "story-" +
      String(templateKind || "template") +
      (style ? "-stil" + style : "") +
      (exId ? "-" + exId : "") +
      ".png";

    var waitFonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    waitFonts
      .then(function () {
        return waitForImages(story, 15000).then(function () {
          return { node: story };
        });
      })
      .then(function (ctx) {
        var exportNode = ctx && ctx.node ? ctx.node : story;
        return window
          .html2canvas(exportNode, {
          // Clone & Render (kritik): preview scale/transform etkilerini clone üstünde temizle.
          scale: 1, // tam 1080x1920 hedef
          width: 1080,
          height: 1920,
          backgroundColor: "transparent",
          useCORS: true,
          logging: false,
          scrollX: 0,
          scrollY: 0,
          imageTimeout: 15000,
          /* Chromium: DOM→SVG yolu ekran düzeniyle daha uyumlu; metin kayması azalır */
          foreignObjectRendering: true,
          onclone: function (clonedDoc) {
            try {
              if (!clonedDoc || !clonedDoc.getElementById) return;
              var el = clonedDoc.getElementById("pm-story-root");
              if (!el) return;

              // DOM temizliği: export sırasında sadece story kalsın
              clonedDoc.body.innerHTML = "";
              clonedDoc.documentElement.style.background = "transparent";
              clonedDoc.body.style.background = "transparent";
              clonedDoc.body.style.margin = "0";
              clonedDoc.body.style.padding = "0";

              var stage = clonedDoc.createElement("div");
              stage.style.position = "fixed";
              stage.style.left = "0";
              stage.style.top = "0";
              stage.style.width = "1080px";
              stage.style.height = "1920px";
              stage.style.margin = "0";
              stage.style.padding = "0";
              stage.style.background = "transparent";
              stage.appendChild(el);
              clonedDoc.body.appendChild(stage);

              // Transform/scale iptali + sabit ölçüler
              el.style.width = "1080px";
              el.style.height = "1920px";
              el.style.margin = "0";
              el.style.left = "0";
              el.style.top = "0";
              el.style.position = "relative";
              el.style.transform = "translateZ(0)"; // scale yok; hw accel var
              el.style.borderRadius = "40px";
              el.style.overflow = "hidden";

              // Remove broken images (can trigger createPattern 0x0)
              var imgs = el.querySelectorAll("img");
              for (var i = 0; i < imgs.length; i++) {
                var im = imgs[i];
                var src = im.getAttribute("src");
                if (!src) {
                  im.parentNode && im.parentNode.removeChild(im);
                  continue;
                }
                // If the clone can't resolve dimensions, hide it rather than crashing export
                if ((im.naturalWidth === 0 && im.naturalHeight === 0) || im.width === 0 || im.height === 0) {
                  im.style.display = "none";
                }
              }

              // Remove any 0x0 canvases (rare, but also trips createPattern)
              var cvs = el.querySelectorAll("canvas");
              for (var j = 0; j < cvs.length; j++) {
                var c = cvs[j];
                if (!c.width || !c.height) {
                  c.parentNode && c.parentNode.removeChild(c);
                }
              }

              // Export stability: disable backdrop-filter (html2canvas can glitch)
              var glass = el.querySelectorAll("*");
              for (var k = 0; k < glass.length; k++) {
                var el2 = glass[k];
                if (!el2 || !el2.style) continue;
                el2.style.backdropFilter = "none";
                el2.style.webkitBackdropFilter = "none";
              }
            } catch (e) {}
          },
        })
          .then(function (canvas) {
            return canvas;
          })
          .catch(function (e) { throw e; });
      })
      .then(function (canvas) {
        if (!canvas || !canvas.width || !canvas.height) throw new Error("Canvas boş üretildi");
        var done = function (url) {
          var a = document.createElement("a");
          a.href = url;
          a.download = fn;
          document.body.appendChild(a);
          a.click();
          a.remove();
        };
        if (canvas.toBlob) {
          canvas.toBlob(function (blob) {
            if (!blob) return done(canvas.toDataURL("image/png"));
            var url = URL.createObjectURL(blob);
            done(url);
            setTimeout(function () { try { URL.revokeObjectURL(url); } catch (e) {} }, 2000);
          }, "image/png");
        } else {
          done(canvas.toDataURL("image/png"));
        }
      })
      .catch(function (err) {
        console.error("[Pazarlama] PNG render hatası:", err);
        alert("PNG oluşturulamadı. Konsolu kontrol edin.");
      });
  }

  function setupTabs() {
    var tabs = [
      { tab: $("pm-tab-data"), panel: $("pm-panel-data") },
      { tab: $("pm-tab-brand"), panel: $("pm-panel-brand") },
      { tab: $("pm-tab-export"), panel: $("pm-panel-export") },
    ];
    tabs.forEach(function (t) {
      if (!t.tab || !t.panel) return;
      t.tab.addEventListener("click", function () {
        tabs.forEach(function (x) {
          if (!x.tab || !x.panel) return;
          var on = x.tab === t.tab;
          x.tab.setAttribute("aria-selected", on ? "true" : "false");
          x.panel.hidden = !on;
        });
      });
    });
  }

  function setPaletteSwatches() {
    var mapping = {
      lavender: { bgFrom: "#f3e8ff", bgTo: "#ffedd5" },
      mint: { bgFrom: "#d1fae5", bgTo: "#e0f2fe" },
      roseSand: { bgFrom: "#fce7f3", bgTo: "#fef3c7" },
      minimalIce: { bgFrom: "#f8fafc", bgTo: "#f1f5f9" },
    };
    var btns = document.querySelectorAll(".pm-palette[data-palette]");
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      var k = b.getAttribute("data-palette");
      var p = mapping[k];
      if (!p) continue;
      b.style.background =
        "radial-gradient(circle at 30% 30%, rgba(255,255,255,.65) 0%, transparent 55%), linear-gradient(135deg, " + p.bgFrom + ", " + p.bgTo + ")";
    }
  }

  function renderCustomFieldsFor(kind, customState) {
    var box = $("pm-custom-fields");
    if (!box) return;
    box.hidden = false;
    box.innerHTML = "";

    if (kind === "leaderboard") {
      box.innerHTML =
        '<label class="pm-field">' +
        '<span class="pm-field-label">Story Başlık</span>' +
        '<input type="text" id="pm-text-lb-title" class="pm-control" placeholder="İlk 10" />' +
        "</label>" +
        '<label class="pm-field">' +
        '<span class="pm-field-label">Rozet</span>' +
        '<input type="text" id="pm-text-lb-badge" class="pm-control" placeholder="TOP 10" />' +
        "</label>" +
        '<label class="pm-field">' +
        '<span class="pm-field-label">Tablo Başlığı</span>' +
        '<input type="text" id="pm-text-lb-board" class="pm-control" placeholder="LİDERLİK TABLOSU" />' +
        "</label>" +
        '<label class="pm-field">' +
        '<span class="pm-field-label">Metrik Etiketi</span>' +
        '<input type="text" id="pm-text-lb-metric" class="pm-control" placeholder="Toplam Net" />' +
        "</label>" +
        '<label class="pm-field">' +
        '<span class="pm-field-label">Alt Sağ Etiket</span>' +
        '<input type="text" id="pm-text-lb-foot" class="pm-control" placeholder="derecepanel" />' +
        "</label>";
      return;
    }

    if (kind === "star") {
      box.innerHTML =
        '<label class="pm-field">' +
        '<span class="pm-field-label">Rozet</span>' +
        '<input type="text" id="pm-text-star-badge" class="pm-control" placeholder="SPOTLIGHT" />' +
        "</label>" +
        '<label class="pm-field">' +
        '<span class="pm-field-label">Başlık</span>' +
        '<input type="text" id="pm-text-star-title" class="pm-control" placeholder="Haftanın Yıldızı" />' +
        "</label>" +
        '<label class="pm-field">' +
        '<span class="pm-field-label">Alt Yazı</span>' +
        '<textarea id="pm-text-star-sub" rows="2" class="pm-control" placeholder="Netini en çok artıran öğrencimiz!"></textarea>' +
        "</label>" +
        '<label class="pm-field">' +
        '<span class="pm-field-label">Kicker (Önceki sınav varsa)</span>' +
        '<input type="text" id="pm-text-star-kickerBase" class="pm-control" placeholder="GEÇEN SINAV" />' +
        "</label>" +
        '<label class="pm-field">' +
        '<span class="pm-field-label">Kicker (Önceki sınav yoksa)</span>' +
        '<input type="text" id="pm-text-star-kickerEmpty" class="pm-control" placeholder="GEÇEN SINAV VERİSİ YOK" />' +
        "</label>";
      return;
    }

    if (kind === "countdown") {
      var target = (customState && customState.targetDate) || "";
      var headline = (customState && customState.headline) || "YKS'YE";
      var quote = (customState && customState.quote) || "Bugün çalış, yarın gurur duy.";
      var subMsg = (customState && customState.subMsg) || "Kaldı. Hazırsın.";
      var totalDays = customState && customState.totalDays != null ? Number(customState.totalDays) : 365;
      if (!isFinite(totalDays) || totalDays <= 1) totalDays = 365;

      box.innerHTML =
        '<label class="pm-field">' +
        '<span class="pm-field-label">Rozet</span>' +
        '<input type="text" id="pm-text-cd-badge" class="pm-control" placeholder="MOTİVASYON" />' +
        "</label>" +
        '<label class="pm-field">' +
        '<span class="pm-field-label">Hedef Tarih</span>' +
        '<input type="date" id="pm-countdown-date" class="pm-control" />' +
        "</label>" +
        '<label class="pm-field">' +
        '<span class="pm-field-label">Başlık</span>' +
        '<input type="text" id="pm-countdown-headline" class="pm-control" />' +
        "</label>" +
        '<label class="pm-field">' +
        '<span class="pm-field-label">Alt Mesaj</span>' +
        '<textarea id="pm-countdown-submsg" rows="2" class="pm-control"></textarea>' +
        "</label>" +
        '<label class="pm-field">' +
        '<span class="pm-field-label">Motivasyon Metni</span>' +
        '<textarea id="pm-countdown-quote-input" rows="4" class="pm-control"></textarea>' +
        "</label>" +
        '<label class="pm-field">' +
        '<span class="pm-field-label">Progress Bar Bazı (Gün)</span>' +
        '<input type="number" min="1" step="1" id="pm-countdown-total" class="pm-control" />' +
        "</label>" +
        '<label class="pm-field">' +
        '<span class="pm-field-label">Alt Sol Etiket</span>' +
        '<input type="text" id="pm-text-cd-foot" class="pm-control" placeholder="Şablon: Geri Sayım" />' +
        "</label>";

      var d = $("pm-countdown-date");
      var h = $("pm-countdown-headline");
      var s = $("pm-countdown-submsg");
      var q = $("pm-countdown-quote-input");
      var tot = $("pm-countdown-total");
      if (d) d.value = target;
      if (h) h.value = headline;
      if (q) q.value = quote;
      if (s) s.value = subMsg;
      if (tot) tot.value = String(totalDays);
      return;
    }

    box.hidden = true;
  }

  function boot() {
    var exams = loadMergedExams();
    populateExamSelect(exams);

    var sel = $("pm-exam-select");
    var tplSel = $("pm-template-select");
    var tplStyleSel = $("pm-template-style");
    var btnRefresh = $("pm-btn-refresh");
    var btnDl = $("pm-btn-download");
    var btnRefreshPanel = $("pm-btn-refresh-panel");
    var btnDlPanel = $("pm-btn-download-panel");
    var btnFit = $("pm-btn-fit");

    setupTabs();
    setPaletteSwatches();

    var brand = loadBrandState();
    var textState = loadTextState();
    var styleMap = loadTemplateStyleMap();
    applyBrandToStory(brand);
    syncBrandPreview(brand);

    var logoUp = $("pm-logo-upload");
    var btnClearLogo = $("pm-btn-clear-logo");
    var logoFn = $("pm-logo-filename");
    if (logoUp) {
      logoUp.addEventListener("change", function () {
        var f = logoUp.files && logoUp.files[0] ? logoUp.files[0] : null;
        if (logoFn) logoFn.textContent = f ? (f.name || "Seçildi") : "Dosya seçilmedi";
        if (!f) return;
        if (!/image\/png/i.test(f.type || "") && !/\.png$/i.test(f.name || "")) {
          alert("Lütfen PNG logo yükleyin.");
          logoUp.value = "";
          if (logoFn) logoFn.textContent = "Dosya seçilmedi";
          return;
        }
        var reader = new FileReader();
        reader.onload = function () {
          brand.logoDataUrl = String(reader.result || "");
          saveBrandState(brand);
          applyBrandToStory(brand);
        };
        reader.readAsDataURL(f);
      });
    }
    if (btnClearLogo) {
      btnClearLogo.addEventListener("click", function () {
        brand.logoDataUrl = "";
        saveBrandState(brand);
        applyBrandToStory(brand);
        if (logoUp) logoUp.value = "";
        if (logoFn) logoFn.textContent = "Dosya seçilmedi";
      });
    }

    var paletteMap = {
      lavender: { themeId: "lavender", bgFrom: "#f3e8ff", bgTo: "#ffedd5", cardBg: "rgba(255, 255, 255, 0.55)", textMain: "#312e81", textMuted: "rgba(49, 46, 129, 0.62)", accent: "#a78bfa" },
      mint: { themeId: "mint", bgFrom: "#d1fae5", bgTo: "#e0f2fe", cardBg: "rgba(255, 255, 255, 0.55)", textMain: "#064e3b", textMuted: "rgba(6, 78, 59, 0.62)", accent: "#2dd4bf" },
      roseSand: { themeId: "roseSand", bgFrom: "#fce7f3", bgTo: "#fef3c7", cardBg: "rgba(255, 255, 255, 0.55)", textMain: "#4c0519", textMuted: "rgba(76, 5, 25, 0.62)", accent: "#fb7185" },
      minimalIce: { themeId: "minimalIce", bgFrom: "#f8fafc", bgTo: "#f1f5f9", cardBg: "rgba(255, 255, 255, 0.55)", textMain: "#1e293b", textMuted: "rgba(30, 41, 59, 0.62)", accent: "#94a3b8" },
    };
    var paletteBtns = document.querySelectorAll(".pm-palette[data-palette]");
    for (var pi = 0; pi < paletteBtns.length; pi++) {
      paletteBtns[pi].addEventListener("click", function (e) {
        var k = e && e.currentTarget ? e.currentTarget.getAttribute("data-palette") : "";
        var p = paletteMap[k];
        if (!p) return;
        brand.themeId = p.themeId;
        brand.bgFrom = p.bgFrom;
        brand.bgTo = p.bgTo;
        brand.cardBg = p.cardBg;
        brand.textMain = p.textMain;
        brand.textMuted = p.textMuted;
        brand.accent = p.accent;
        saveBrandState(brand);
        applyBrandToStory(brand);
      });
    }

    var customState = safeParse(localStorage.getItem("pm_custom_v2"), { targetDate: "", headline: "YKS'YE", subMsg: "Kaldı. Hazırsın.", quote: "Bugün çalış, yarın gurur duy.", totalDays: 365 });
    function saveCustom() {
      try { localStorage.setItem("pm_custom_v2", JSON.stringify(customState)); } catch (e) {}
    }

    function renderFromSelection() {
      var kind = tplSel && tplSel.value ? String(tplSel.value) : "leaderboard";
      var style = setStyleSelectOptions(tplStyleSel, kind, tplStyleSel && tplStyleSel.value ? String(tplStyleSel.value) : "", styleMap);
      var host = ensureTemplateHost();
      if (host) host.innerHTML = templateMarkup(kind, style);

      // data requirement toggle
      var examField = $("pm-exam-field");
      if (examField) examField.hidden = kind === "countdown";
      renderCustomFieldsFor(kind, customState);

      var id = sel && sel.value ? sel.value : "";
      var ex = findExam(exams, id);

      // Non-leaderboard screens: clear meta cards to avoid "stale" counts
      var metaCount = $("pm-meta-count");
      var metaTop = $("pm-meta-top");
      if (kind !== "leaderboard") {
        if (metaCount) metaCount.textContent = "—";
        if (metaTop) metaTop.textContent = "—";
      }

      if (kind === "leaderboard") {
        var lb = textState.leaderboard || {};
        var badge = $("pm-badge");
        var titleEl = $("pm-title");
        var boardTitle = $("pm-board-title");
        var metric = $("pm-board-metric");
        var footRight = $("pm-foot-right");
        if (badge && lb.badge) badge.textContent = String(lb.badge);
        if (titleEl && lb.title) titleEl.textContent = String(lb.title);
        if (boardTitle && lb.boardTitle) boardTitle.textContent = String(lb.boardTitle);
        if (metric && lb.metric) metric.textContent = String(lb.metric);
        if (footRight && lb.footRight) footRight.textContent = String(lb.footRight);

        var lbTitle = $("pm-text-lb-title");
        var lbBadge = $("pm-text-lb-badge");
        var lbBoard = $("pm-text-lb-board");
        var lbMetric = $("pm-text-lb-metric");
        var lbFoot = $("pm-text-lb-foot");
        if (lbTitle) { lbTitle.value = lb.title || ""; lbTitle.oninput = function () { textState.leaderboard.title = String(lbTitle.value || ""); saveTextState(textState); renderFromSelection(); }; }
        if (lbBadge) { lbBadge.value = lb.badge || ""; lbBadge.oninput = function () { textState.leaderboard.badge = String(lbBadge.value || ""); saveTextState(textState); renderFromSelection(); }; }
        if (lbBoard) { lbBoard.value = lb.boardTitle || ""; lbBoard.oninput = function () { textState.leaderboard.boardTitle = String(lbBoard.value || ""); saveTextState(textState); renderFromSelection(); }; }
        if (lbMetric) { lbMetric.value = lb.metric || ""; lbMetric.oninput = function () { textState.leaderboard.metric = String(lbMetric.value || ""); saveTextState(textState); renderFromSelection(); }; }
        if (lbFoot) { lbFoot.value = lb.footRight || ""; lbFoot.oninput = function () { textState.leaderboard.footRight = String(lbFoot.value || ""); saveTextState(textState); renderFromSelection(); }; }

        renderTop10(ex, brand, style);
      } else if (kind === "star") {
        var st = textState.star || {};
        var sBadge = $("pm-badge");
        if (sBadge && st.badge) sBadge.textContent = String(st.badge);
        var sTitle = $("pm-star-title");
        var sSub = $("pm-star-sub");
        if (sTitle && st.title) sTitle.textContent = String(st.title);
        if (sSub && st.sub) sSub.textContent = String(st.sub);

        var eb = $("pm-text-star-badge");
        var et = $("pm-text-star-title");
        var es = $("pm-text-star-sub");
        var ekb = $("pm-text-star-kickerBase");
        var eke = $("pm-text-star-kickerEmpty");
        if (eb) { eb.value = st.badge || ""; eb.oninput = function () { textState.star.badge = String(eb.value || ""); saveTextState(textState); renderFromSelection(); }; }
        if (et) { et.value = st.title || ""; et.oninput = function () { textState.star.title = String(et.value || ""); saveTextState(textState); renderFromSelection(); }; }
        if (es) { es.value = st.sub || ""; es.oninput = function () { textState.star.sub = String(es.value || ""); saveTextState(textState); renderFromSelection(); }; }
        if (ekb) { ekb.value = st.kickerBase || ""; ekb.oninput = function () { textState.star.kickerBase = String(ekb.value || ""); saveTextState(textState); renderFromSelection(); }; }
        if (eke) { eke.value = st.kickerEmpty || ""; eke.oninput = function () { textState.star.kickerEmpty = String(eke.value || ""); saveTextState(textState); renderFromSelection(); }; }

        renderStar(exams, ex, brand, textState);
      } else {
        // bind custom inputs (overwrite handlers to avoid stacking listeners)
        var d = $("pm-countdown-date");
        var h = $("pm-countdown-headline");
        var s = $("pm-countdown-submsg");
        var q = $("pm-countdown-quote-input");
        var tot = $("pm-countdown-total");
        var cdBadge = $("pm-text-cd-badge");
        var cdFoot = $("pm-text-cd-foot");

        var ct = textState.countdown || {};
        if (cdBadge) { cdBadge.value = ct.badge || ""; cdBadge.oninput = function () { textState.countdown.badge = String(cdBadge.value || ""); saveTextState(textState); renderFromSelection(); }; }
        if (cdFoot) { cdFoot.value = ct.footLeft || ""; cdFoot.oninput = function () { textState.countdown.footLeft = String(cdFoot.value || ""); saveTextState(textState); renderFromSelection(); }; }

        if (d) {
          d.oninput = function () {
            customState.targetDate = String(d.value || "");
            saveCustom();
            renderCountdown(customState, brand, textState);
          };
        }
        if (h) {
          h.oninput = function () {
            customState.headline = String(h.value || "YKS'YE");
            saveCustom();
            renderCountdown(customState, brand, textState);
          };
        }
        if (s) {
          s.oninput = function () {
            customState.subMsg = String(s.value || "");
            saveCustom();
            renderCountdown(customState, brand, textState);
          };
        }
        if (q) {
          q.oninput = function () {
            customState.quote = String(q.value || "");
            saveCustom();
            renderCountdown(customState, brand, textState);
          };
        }
        if (tot) {
          tot.oninput = function () {
            customState.totalDays = Number(tot.value);
            saveCustom();
            renderCountdown(customState, brand, textState);
          };
        }

        renderCountdown(customState, brand, textState);
      }

      computePreviewScale();
    }

    if (sel) {
      sel.addEventListener("change", renderFromSelection);
    }
    if (tplSel) {
      tplSel.addEventListener("change", renderFromSelection);
    }
    if (tplStyleSel) {
      tplStyleSel.addEventListener("change", function () {
        // persist per-template
        var kind = tplSel && tplSel.value ? String(tplSel.value) : "leaderboard";
        if (styleMap) {
          styleMap[kind] = String(tplStyleSel.value || "1");
          saveTemplateStyleMap(styleMap);
        }
        renderFromSelection();
      });
    }
    if (btnRefresh) {
      btnRefresh.addEventListener("click", function () {
        exams = loadMergedExams();
        populateExamSelect(exams);
        renderFromSelection();
      });
    }
    if (btnRefreshPanel && btnRefresh) {
      btnRefreshPanel.addEventListener("click", function () { btnRefresh.click(); });
    }
    if (btnDl) {
      btnDl.addEventListener("click", function () {
        var kind = tplSel && tplSel.value ? String(tplSel.value) : "template";
        downloadPngFromStory(kind);
      });
    }
    if (btnDlPanel && btnDl) {
      btnDlPanel.addEventListener("click", function () { btnDl.click(); });
    }
    if (btnFit) {
      btnFit.addEventListener("click", computePreviewScale);
    }

    // İlk render + resize
    renderFromSelection();
    window.addEventListener("resize", computePreviewScale);

    // Veri güncellenince kendini tazele (diğer sayfaların dispatch ettiği event)
    window.addEventListener("examResults:change", function () {
      exams = loadMergedExams();
      populateExamSelect(exams);
      renderFromSelection();
    });
    window.addEventListener("storage", function (e) {
      if (!e || !e.key) return;
      if (e.key === "examResults" || e.key === "kurum_denemeler_v1" || e.key === "global_denemeler_v1" || e.key === "globalExams") {
        exams = loadMergedExams();
        populateExamSelect(exams);
        renderFromSelection();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

// Beta bilgilendirme — her sayfa yüklemesinde (localStorage yok); geri/ileri cache sonrası tekrar göster
document.addEventListener("DOMContentLoaded", function () {
  var betaModal = document.getElementById("betaModal");
  var closeBtn = document.getElementById("closeBetaModal");
  if (closeBtn && betaModal) {
    closeBtn.addEventListener("click", function () {
      betaModal.classList.add("hidden");
      betaModal.classList.remove("flex");
    });
  }
});
window.addEventListener("pageshow", function () {
  var betaModal = document.getElementById("betaModal");
  if (!betaModal) return;
  betaModal.classList.remove("hidden");
  betaModal.classList.add("flex");
});

