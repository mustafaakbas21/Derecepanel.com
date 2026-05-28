/**
 * Omnibox — #fm-global-search + #fm-search-results
 * Gerçek veri: localStorage (öğrenciler, denemeler, taramalar, koçlar) + sabit menü.
 * overflow:hidden bloklarından taşmaması için dropdown fixed konumlu.
 */
(function () {
  "use strict";

  var MIN_CHARS = 1;

  /** Sabit HTML rotaları (pages/*.html bağlamında dosya adı) — Dashboard = kök koç paneli */
  var MENU_DATA = [
    { title: "Dashboard", type: "Menü", url: "koc-paneli.html" },
    { title: "Öğrencilerim", type: "Menü", url: "ogrencilerim.html" },
    { title: "Test Oluşturucu", type: "Menü", url: "test-olusturucu.html" },
    { title: "Otomatik Soru Kırpıcı", type: "Menü", url: "otomatik-soru-kirpici.html" },
    { title: "Soru Havuzu", type: "Menü", url: "soru-havuzu.html" },
    { title: "Reçete Yaz", type: "Menü", url: "recete-yaz.html" },
    { title: "Reçete Deposu", type: "Menü", url: "recete-deposu.html" },
    { title: "Hatalı Soru Havuzu", type: "Menü", url: "hatali-soru-havuzu.html" },
    { title: "Tarama Oluşturma", type: "Menü", url: "tarama-olusturucu.html" },
    { title: "Tercih Sihirbazı", type: "Menü", url: "tercih-sihirbazi.html" },
  ];

  var TYPE_ORDER = ["Menü", "Öğrenci", "Deneme", "Koç"];

  var CATEGORY_HEAD_UPPER = {
    Menü: "MENÜ",
    Öğrenci: "ÖĞRENCİLER",
    Deneme: "DENEMELER",
    Koç: "KOÇLAR",
    Diğer: "DİĞER",
  };

  var DOC_ICON =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';

  var ROW_CHEVRON_ICON =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';

  function headingForType(tp) {
    if (tp && CATEGORY_HEAD_UPPER[tp]) return CATEGORY_HEAD_UPPER[tp];
    return String(tp || "Diğer").toLocaleUpperCase("tr-TR");
  }

  /** Birincil iki kelimenin ilk harfi (öğrenci avatarı) */
  function studentInitials(title) {
    var parts = String(title || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    var ini = "";
    if (parts.length >= 2) ini = parts[0].charAt(0) + parts[parts.length - 1].charAt(0);
    else if (parts.length === 1 && parts[0].length >= 2) ini = parts[0].slice(0, 2);
    else if (parts.length === 1) ini = parts[0].charAt(0) || "";
    ini = ini.toLocaleUpperCase("tr-TR");
    return ini || "?";
  }

  function secondaryMetaLine(row) {
    var subt = row.subtitle ? String(row.subtitle).trim() : "";
    if (subt) return subt;
    if (row.type === "Menü") return "Sayfa";
    return String(row.type || "").trim();
  }

  function pagesContext() {
    var path = String(window.location.pathname || "").replace(/\\/g, "/");
    return path.indexOf("/pages/") !== -1 || /\/pages\//.test(path);
  }

  function resolveHref(href) {
    if (!href) return "#";
    if (/^https?:\/\//i.test(href)) return href;
    var ps = href.split("?");
    var pathPart = ps[0].replace(/^\.\//, "");
    var qs = ps.length > 1 ? "?" + ps.slice(1).join("?") : "";
    if (pagesContext()) {
      if (/^\.\.\//.test(pathPart)) return pathPart + qs;
      /* Kök dizindeki koç girişi — pages/*.html için bir üst */
      if (/^koc-paneli\.html/i.test(pathPart)) return "../" + pathPart + qs;
      return pathPart + qs;
    }
    if (/^pages\//i.test(pathPart)) return pathPart + qs;
    return "pages/" + pathPart.replace(/^\/+/, "") + qs;
  }

  function readLs(key) {
    try {
      if (typeof localStorage === "undefined") return null;
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function parseJsonArray(raw) {
    try {
      if (!raw || !String(raw).trim()) return [];
      var v = JSON.parse(raw);
      return Array.isArray(v) ? v : [];
    } catch (e2) {
      return [];
    }
  }

  function lsArrayPrimaryOrAlt(a, b) {
    var x = parseJsonArray(readLs(a));
    if (x.length) return x;
    return parseJsonArray(readLs(b));
  }

  function examDisplayName(ex) {
    if (!ex) return "";
    return String(ex.ad || ex.name || ex.title || ex.examName || ex.denemeAdi || ex.baslik || "").trim();
  }

  function coachField(c, keys) {
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (c && c[k] != null && String(c[k]).trim()) return String(c[k]).trim();
    }
    return "";
  }

  function studentUrl(p) {
    var qs = [];
    var code = String((p && p.studentCode) || (p && p.code) || "").trim();
    var oid = String((p && p.ogrenciId) || (p && p.id) || "").trim();
    if (code) qs.push("code=" + encodeURIComponent(code));
    if (oid) qs.push("ogrenciId=" + encodeURIComponent(oid));
    return "ogrencilerim.html" + (qs.length ? "?" + qs.join("&") : "");
  }

  function dedupeStudentKey(p) {
    var code = String((p && (p.studentCode || p.code || p.ogrenciId || p.id)) || "")
      .trim()
      .toLowerCase();
    if (code) return "c:" + code;
    return "n:" + loTr((p && p.name) || "");
  }

  /** Yerel sınav takvimi (kurum + global) */
  function loadMergedCalendarExams() {
    var kurumsal = lsArrayPrimaryOrAlt("kurumsalExams", "kurum_denemeler_v1");
    var global = lsArrayPrimaryOrAlt("globalExams", "global_denemeler_v1");
    var seen = {};
    var out = [];

    kurumsal.forEach(function (x) {
      if (!x || !x.id || seen[String(x.id)]) return;
      seen[String(x.id)] = true;
      var c = typeof x === "object" ? Object.assign({}, x) : {};
      c._calKind = "kurum";
      out.push(c);
    });
    global.forEach(function (x) {
      if (!x || !x.id || seen[String(x.id)]) return;
      seen[String(x.id)] = true;
      var g = typeof x === "object" ? Object.assign({}, x) : {};
      g._calKind = "global";
      out.push(g);
    });
    return out;
  }

  /**
   * Her çağrıda localStorage okur (canlı).
   * @returns {Array<{ title: string, type: string, url: string, subtitle?: string }>}
   */
  function buildAllData() {
    var rows = [];
    var seen = {};

    function pushRow(title, type, url, subtitle) {
      var t = String(title || "").trim();
      if (!t) return;
      var u = url || "#";
      var sk = type + "|" + loTr(t) + "|" + u;
      if (seen[sk]) return;
      seen[sk] = true;
      rows.push({
        title: t,
        type: type || "Diğer",
        url: u,
        subtitle: subtitle ? String(subtitle).trim() : "",
      });
    }

    MENU_DATA.forEach(function (m) {
      pushRow(m.title, m.type || "Menü", m.url, "");
    });

    var seenStu = {};

    function addStudent(name, payload) {
      var nm = String(name || "").trim();
      if (!nm) return;
      var pseudo = {
        name: nm,
        studentCode: payload && payload.studentCode,
        ogrenciId: payload && payload.ogrenciId,
        code: payload && payload.code,
        id: payload && payload.id,
      };
      var k = dedupeStudentKey(pseudo);
      if (seenStu[k]) return;
      seenStu[k] = true;

      pushRow(nm, "Öğrenci", studentUrl(pseudo), "");

    }

    parseJsonArray(readLs("derecepanel_students_full_v1")).forEach(function (p) {
      if (!p || !p.name) return;
      addStudent(p.name, { studentCode: p.studentCode, ogrenciId: p.ogrenciId });
    });

    parseJsonArray(readLs("students")).forEach(function (p) {
      if (!p || !p.name) return;
      addStudent(p.name, {
        studentCode: p.studentCode || p.code,
        ogrenciId: p.ogrenciId || p.id,
      });
    });

    parseJsonArray(readLs("derecepanel_student_catalog_v1")).forEach(function (c) {
      if (!c || !c.name) return;
      addStudent(c.name, { code: c.code, id: c.id, studentCode: c.code, ogrenciId: c.id });
    });

    parseJsonArray(readLs("examResults")).forEach(function (r) {
      if (!r) return;
      var sn = String(r.studentName || "").trim();
      if (!sn) return;
      addStudent(sn, {
        studentCode: r.studentCode || r.studentId,
        ogrenciId: r.studentId,
      });
    });

    var seenDen = {};

    function addDeneme(title, subtitle, url, dedupeKey) {
      var t = String(title || "").trim();
      if (!t) return;
      var dk = dedupeKey != null ? String(dedupeKey) : "";
      var nk = dk || loTr(t) + "|" + String(url || "");
      if (seenDen[nk]) return;
      seenDen[nk] = true;
      pushRow(t, "Deneme", url || "basit-deneme-sonuclari.html", subtitle || "");
    }

    /** examResults satırlarında examId → takvimden okunabilir ad */
    var calExamIdToName = {};

    loadMergedCalendarExams().forEach(function (ex) {
      var id = ex && ex.id != null ? String(ex.id) : "";
      var nm = examDisplayName(ex);
      if (id && nm) calExamIdToName[id] = nm;
      if (!id && !nm) return;
      if (!nm) nm = "İsimsiz deneme";
      var dateBits = String(ex.tarih || ex.date || ex.examDate || "").slice(0, 10);
      var lbl = ex._calKind === "global" ? "Global takvim" : "Kurum takvimi";
      var subt = [lbl, dateBits, ex.sinav || ex.tur].filter(Boolean).join(" · ");
      var href = id
        ? "basit-deneme-sonuclari.html?examId=" + encodeURIComponent(id)
        : "basit-deneme-sonuclari.html";
      addDeneme(nm, subt, href, id ? "cal:" + id : "caln:" + loTr(nm));
    });

    parseJsonArray(readLs("examResults")).forEach(function (r) {
      if (!r) return;
      var eid = r.examId != null ? String(r.examId) : "";
      var en = String(r.examName || r.examTitle || r.denemeAdi || r.title || r.name || r.ad || "").trim();
      if (!en && eid && calExamIdToName[eid]) en = calExamIdToName[eid];
      if (!en && eid) en = "İsimsiz deneme";
      if (!en) return;
      var subt = r.examDate || r.date ? String(r.examDate || r.date).slice(0, 10) : "Sonuç kaydı";
      var href = eid
        ? "basit-deneme-sonuclari.html?examId=" + encodeURIComponent(eid)
        : "basit-deneme-sonuclari.html";
      addDeneme(en, subt, href, eid ? "exr:" + eid : "exrn:" + loTr(en));
    });

    parseJsonArray(readLs("test_maker_exports")).forEach(function (e) {
      if (!e || e.id == null) return;
      var id = String(e.id);
      var title = String(e.name || e.title || e.baslik || "Tarama").trim() || id;
      var subt = e.soruSayisi ? e.soruSayisi + " soru" : "Tarama / depo";
      var href = "tarama-analiz.html?examId=" + encodeURIComponent(id);
      addDeneme(title, subt, href, "tar:" + id);
    });

    try {
      if (typeof localStorage !== "undefined") {
        for (var li = 0; li < localStorage.length; li++) {
          var lk = localStorage.key(li);
          if (!lk || lk.indexOf("tarama_data_") !== 0) continue;
          var tid = lk.slice("tarama_data_".length);
          if (!tid) continue;
          var obj = null;
          try {
            obj = JSON.parse(localStorage.getItem(lk) || "null");
          } catch (eJ) {
            obj = null;
          }
          var title = String((obj && obj.name) || tid).trim();
          var subt = "Tarama verisi";
          var href = "tarama-analiz.html?examId=" + encodeURIComponent(tid);
          addDeneme(title, subt, href, "tar:" + tid);
        }
      }
    } catch (e0) {}

    parseJsonArray(readLs("coaches")).forEach(function (c) {
      if (!c) return;
      var name = coachField(c, ["name", "fullName", "displayName"]);
      if (!name) return;
      var spec = coachField(c, ["specialtyLabel", "specialty", "branch", "title"]);
      pushRow(name, "Koç", "koclar.html", spec || "");
    });

    return rows;
  }

  function loTr(s) {
    return String(s || "").toLocaleLowerCase("tr-TR");
  }

  function matchesQuery(q, row) {
    var blob = loTr(
      [row.title, row.type, row.subtitle || ""].filter(Boolean).join(" ")
    );
    return blob.indexOf(q) !== -1;
  }

  function filterData(all, rawQ) {
    var q = loTr(String(rawQ || "").trim());
    if (q.length < MIN_CHARS) return [];
    var out = [];
    for (var i = 0; i < all.length; i++) {
      if (matchesQuery(q, all[i])) out.push(all[i]);
    }
    var maxTotal = q.length <= 2 ? 20 : 50;
    return out.slice(0, maxTotal);
  }

  function escHtml(t) {
    return String(t || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  var DD_OPEN = null;

  function closeHooks() {
    if (!DD_OPEN) return;
    window.removeEventListener("scroll", DD_OPEN.scroll, true);
    window.removeEventListener("resize", DD_OPEN.resize);
    DD_OPEN = null;
  }

  function syncDropdownGeom(inputEl, ddEl) {
    if (!inputEl || !ddEl || ddEl.classList.contains("hidden")) return;
    var r = inputEl.getBoundingClientRect();
    var top = Math.round(r.bottom + 8);
    var vh =
      typeof window.innerHeight === "number"
        ? window.innerHeight
        : document.documentElement && document.documentElement.clientHeight
        ? document.documentElement.clientHeight
        : 520;
    ddEl.style.position = "fixed";
    ddEl.style.left = Math.round(Math.max(8, r.left)) + "px";
    ddEl.style.top = top + "px";
    ddEl.style.width = Math.round(Math.max(200, r.width)) + "px";
    ddEl.style.zIndex = "10070";
    ddEl.style.boxSizing = "border-box";
    ddEl.style.maxHeight = Math.max(160, Math.min(400, vh - top - 12)) + "px";
  }

  function attachGeom(inputEl, ddEl) {
    closeHooks();
    function tick() {
      syncDropdownGeom(inputEl, ddEl);
    }
    var sc = tick;
    var rs = tick;
    window.addEventListener("scroll", sc, true);
    window.addEventListener("resize", rs);
    DD_OPEN = { scroll: sc, resize: rs };
    tick();
  }

  function hideDropdown(inp, dd) {
    closeHooks();
    if (!dd) return;
    dd.classList.add("hidden");
    dd.innerHTML = "";
    if (inp) inp.setAttribute("aria-expanded", "false");
    dd.style.cssText = "";
  }

  function groupByType(list) {
    var m = {};
    for (var i = 0; i < TYPE_ORDER.length; i++) {
      m[TYPE_ORDER[i]] = [];
    }
    for (var j = 0; j < list.length; j++) {
      var it = list[j];
      var tp = it.type || "Diğer";
      if (!m[tp]) m[tp] = [];
      m[tp].push(it);
    }
    return m;
  }

  function render(inp, dd, rawQ) {
    if (!inp || !dd) return;
    dd.innerHTML = "";
    hideDropdown(inp, dd);
    var qTrim = String(rawQ || "").trim();
    if (loTr(qTrim).length < MIN_CHARS) return;

    var allData = buildAllData();
    var matches = filterData(allData, rawQ);
    if (!matches.length) {
      dd.innerHTML =
        '<div class="py-8 px-4 text-center text-sm text-slate-400">' +
        "Eşleşen kayıt yok." +
        "</div>";
      dd.classList.remove("hidden");
      inp.setAttribute("aria-expanded", "true");
      attachGeom(inp, dd);
      return;
    }

    var g = groupByType(matches);
    var renderOrder = TYPE_ORDER.slice();
    Object.keys(g).forEach(function (k) {
      if (renderOrder.indexOf(k) === -1) renderOrder.push(k);
    });

    var buf = [];
    var firstHdr = true;
    for (var ti = 0; ti < renderOrder.length; ti++) {
      var t = renderOrder[ti];
      var arr = g[t];
      if (!arr || !arr.length) continue;

      buf.push(
        '<div class="' +
          (firstHdr ? "text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-3" : "text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 mt-3 px-3") +
          '">' +
          escHtml(headingForType(t)) +
          "</div>"
      );
      firstHdr = false;

      for (var ji = 0; ji < arr.length; ji++) {
        var item = arr[ji];
        var href = escHtml(resolveHref(item.url || "#"));
        var sideIcon =
          item.type === "Öğrenci"
            ? '<div class="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 font-semibold text-sm">' +
              escHtml(studentInitials(item.title)) +
              "</div>"
            : '<div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">' +
              DOC_ICON +
              "</div>";
        buf.push(
          '<a href="' +
            href +
            '" role="option" class="group flex items-center justify-between w-full px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer gap-4 no-underline text-inherit">' +
            '<div class="flex items-center gap-3.5 flex-1 min-w-0">' +
            sideIcon +
            '<div class="flex flex-col flex-1 min-w-0">' +
            '<div class="text-sm font-semibold text-slate-800 truncate">' +
            escHtml(item.title) +
            "</div>" +
            '<div class="text-xs text-slate-400 truncate">' +
            escHtml(secondaryMetaLine(item)) +
            "</div>" +
            "</div></div>" +
            '<div class="text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity pr-2 shrink-0">' +
            ROW_CHEVRON_ICON +
            "</div></a>"
        );
      }
    }
    dd.innerHTML = buf.join("");

    dd.classList.remove("hidden");
    inp.setAttribute("aria-expanded", "true");
    attachGeom(inp, dd);
  }

  function boot() {
    var inp = document.getElementById("fm-global-search");
    var dd = document.getElementById("fm-search-results");
    if (!inp || !dd || inp.getAttribute("data-gsearch-wired") === "1") return;
    inp.setAttribute("data-gsearch-wired", "1");

    document.addEventListener("click", function (ev) {
      if (!dd.classList.contains("hidden") && inp && dd) {
        if (inp.contains(ev.target)) return;
        if (dd.contains(ev.target)) return;
        hideDropdown(inp, dd);
      }
    });

    inp.addEventListener("input", function () {
      render(inp, dd, inp.value);
    });

    inp.addEventListener("focus", function () {
      render(inp, dd, inp.value);
    });

    inp.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        hideDropdown(inp, dd);
        inp.blur();
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
