/**
 * Derecepanel — standart üst şerit (Geri + Omnibox + bildirim / tema / profil)
 * Omnibox: yerel localStorage (öğrenci tam/katalog, examResults; kurum+global sınav takvimi;
 * coaches) + gerçek panel modül kısayolları. Mock öğrenci/deneme adı yoktur.
 * - #dp-standard-header varsa içini kablolur.
 * - Yoksa ana main içindeki .topbar klasik bloğunu yükseltir (data-dp-skip-header-upgrade ile iptal).
 * Mobil: window.DerecepanelTheme.applyTheme ile tema döngüsü.
 */
(function () {
  "use strict";

  var MIN_CHARS = 1;

  /** Yalnızca gerçek modül bağlantıları (yerel liste = panel rotaları). Öğrenci/deneme/koç = localStorage. */
  var FM_STATIC_NAV = [
    { type: "sayfa", isim: "Tarama oluşturucu", subtitle: "YKS müfredat · soru seçimi", tags: "tarama test yks", url: "tarama-olusturucu.html" },
    { type: "sayfa", isim: "Test oluşturucu", subtitle: "Paketleme", tags: "test olustur", url: "test-olusturucu.html" },
    { type: "sayfa", isim: "Reçete yazma", subtitle: "Kişisel program", tags: "recete program", url: "recete-yaz.html" },
    { type: "sayfa", isim: "Otomatik soru kırpıcı", subtitle: "PDF → etiket", tags: "kirpici pdf", url: "otomatik-soru-kirpici.html" },
    { type: "sayfa", isim: "Analiz merkezi", subtitle: "Özet metrikler", tags: "analiz rapor", url: "analiz-merkezi.html" },
    { type: "sayfa", isim: "Sonuç merkezi", subtitle: "Deneme tabloları", tags: "deneme sonuc", url: "basit-deneme-sonuclari.html" },
    { type: "sayfa", isim: "Soru havuzu", subtitle: "Banka", tags: "soru banka", url: "soru-havuzu.html" },
    { type: "sayfa", isim: "Hatalı soru havuzu", subtitle: "Tekrar çalış", tags: "hata yanlis", url: "hatali-soru-havuzu.html" },
    { type: "sayfa", isim: "Net sihirbazı", subtitle: "Hedef hesap", tags: "net hedef", url: "net-sihirbazi.html" },
    { type: "sayfa", isim: "Puan hesaplama", subtitle: "YKS", tags: "puan yks", url: "puan-hesaplama.html" },
    { type: "sayfa", isim: "Tercih sihirbazı", subtitle: "Simülasyon", tags: "tercih universite", url: "tercih-sihirbazi.html" },
    { type: "sayfa", isim: "Öğrencilerim", subtitle: "Kayıtlı liste", tags: "ogrenci liste", url: "ogrencilerim.html" },
    { type: "sayfa", isim: "Randevular", subtitle: "Takvim", tags: "randevu", url: "randevular.html" },
  ];

  function fmReadLsJson(key) {
    try {
      if (typeof localStorage === "undefined") return null;
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function fmParseJsonArray(raw) {
    try {
      if (!raw || !String(raw).trim()) return [];
      var v = JSON.parse(raw);
      return Array.isArray(v) ? v : [];
    } catch (e2) {
      return [];
    }
  }

  function fmLsArrayPrimaryOrAlt(primaryKey, altKey) {
    var a = fmParseJsonArray(fmReadLsJson(primaryKey));
    if (a.length) return a;
    return fmParseJsonArray(fmReadLsJson(altKey));
  }

  /** Kurum + global takvim (kurumsalExams/kurum_denemeler_v1 + globalExams/global_denemeler_v1) */
  function fmLoadMergedCalendarExams() {
    var kurumsal = fmLsArrayPrimaryOrAlt("kurumsalExams", "kurum_denemeler_v1");
    var global = fmLsArrayPrimaryOrAlt("globalExams", "global_denemeler_v1");
    var seen = {};
    var out = [];

    kurumsal.forEach(function (x) {
      if (!x || !x.id || seen[String(x.id)]) return;
      seen[String(x.id)] = true;
      var c = typeof x === "object" ? Object.assign({}, x) : {};
      if (!c.sinav && c.tur) c.sinav = c.tur;
      c.fmCalKind = "kurum";
      out.push(c);
    });
    global.forEach(function (x) {
      if (!x || !x.id || seen[String(x.id)]) return;
      seen[String(x.id)] = true;
      var g = typeof x === "object" ? Object.assign({}, x) : {};
      if (!g.sinav && g.tur) g.sinav = g.tur;
      g.fmCalKind = "global";
      out.push(g);
    });

    function sortTs(ex) {
      var d = ex.date || ex.examDate || ex.tarih || ex.scheduledAt || "";
      var t = Date.parse(String(d));
      return isNaN(t) ? 0 : t;
    }

    out.sort(function (a, b) {
      return sortTs(b) - sortTs(a);
    });
    return out;
  }

  function fmExamDisplayName(raw) {
    if (!raw) return "";
    return String(raw.ad || raw.name || raw.title || raw.examName || "").trim();
  }

  function fmCoachField(c, variants) {
    for (var i = 0; i < variants.length; i++) {
      var k = variants[i];
      if (c && c[k] != null && String(c[k]).trim()) return String(c[k]).trim();
    }
    return "";
  }

  function fmDedupeStudentKey(p) {
    var code = String((p && (p.studentCode || p.ogrenciId || p.id)) || "").trim().toLowerCase();
    if (code) return "c:" + code;
    return "n:" + fmNorm((p && p.name) || "");
  }

  function fmBuildRealtimeSearchIndex() {
    var items = FM_STATIC_NAV.slice();

    var seenOg = {};
    function addOgrenci(name, subtitle, tagsParts, urlExtra) {
      var nm = String(name || "").trim();
      if (!nm) return;
      var pseudo = {
        name: nm,
        studentCode: "",
        ogrenciId: "",
        id: "",
      };
      if (typeof urlExtra === "object" && urlExtra) {
        if (urlExtra.studentCode) pseudo.studentCode = urlExtra.studentCode;
        if (urlExtra.ogrenciId) pseudo.ogrenciId = urlExtra.ogrenciId;
        if (urlExtra.id) pseudo.id = urlExtra.id;
      }
      var k = fmDedupeStudentKey(pseudo);
      if (seenOg[k]) return;
      seenOg[k] = true;

      var sub = subtitle || "";
      var tags =
        (Array.isArray(tagsParts) ? tagsParts : [])
          .filter(Boolean)
          .join(" ") +
        " " +
        nm;

      var qs = [];
      if (pseudo.studentCode) qs.push("code=" + encodeURIComponent(pseudo.studentCode));
      if (pseudo.ogrenciId) qs.push("ogrenciId=" + encodeURIComponent(pseudo.ogrenciId));
      var href = "ogrencilerim.html" + (qs.length ? "?" + qs.join("&") : "");

      items.push({
        type: "ogrenci",
        isim: nm,
        subtitle: sub || "Öğrencilerim",
        tags: tags,
        url: href,
      });
    }

    fmParseJsonArray(fmReadLsJson("derecepanel_students_full_v1")).forEach(function (p) {
      if (!p) return;
      var bits = [p.sinifBranch, p.studentCode, p.alan].filter(function (x) {
        return x && String(x).trim();
      });
      addOgrenci(p.name, bits.join(" · "), [p.studentCode, p.alan, p.goal, p.city, p.kullaniciAdi], {
        studentCode: p.studentCode,
        ogrenciId: p.ogrenciId,
      });
    });

    fmParseJsonArray(fmReadLsJson("students")).forEach(function (p) {
      if (!p || !p.name) return;
      var bits = [p.sinifBranch, p.studentCode, p.alan].filter(function (x) {
        return x && String(x).trim();
      });
      addOgrenci(p.name, bits.join(" · "), [p.studentCode, p.alan], {
        studentCode: p.studentCode,
        ogrenciId: p.ogrenciId || p.id,
      });
    });

    fmParseJsonArray(fmReadLsJson("derecepanel_student_catalog_v1")).forEach(function (c) {
      if (!c) return;
      var bits = [c.sube, c.code, c.alan].filter(function (x) {
        return x && String(x).trim();
      });
      addOgrenci(c.name, bits.join(" · "), [c.code, c.alan], { id: c.id, studentCode: c.code });
    });

    fmParseJsonArray(fmReadLsJson("examResults")).forEach(function (r) {
      if (!r) return;
      var sn = String(r.studentName || "").trim();
      if (!sn) return;
      addOgrenci(sn, "Sonuç kaydı", [r.studentCode || r.studentId, r.examName], {
        studentCode: r.studentCode || r.studentId,
        ogrenciId: r.studentId,
      });
    });

    var seenDen = {};
    /** optExamId ile takvim vs examResults birleştirmede tekilleştirilir */
    function addDeneme(isim, subtitle, tags, url, optExamId) {
      var nm = String(isim || "").trim();
      if (!nm) return;
      var idk = "";
      if (optExamId != null && String(optExamId).trim() !== "") idk = "id:" + String(optExamId);
      var u = url || "basit-deneme-sonuclari.html";
      var nk = "n:" + fmNorm(nm) + "|" + fmNorm(u);
      if (idk && seenDen[idk]) return;
      if (seenDen[nk]) return;
      if (idk) seenDen[idk] = true;
      seenDen[nk] = true;
      items.push({ type: "deneme", isim: nm, subtitle: subtitle, tags: tags || "", url: u });
    }

    fmLoadMergedCalendarExams().forEach(function (ex) {
      var id = ex && ex.id != null ? String(ex.id) : "";
      var nm = fmExamDisplayName(ex);
      if (!id && !nm) return;
      if (!nm) nm = "Sınav " + id;
      var dateBits = String(ex.tarih || ex.date || ex.examDate || "").slice(0, 10);
      var formattedDate = dateBits.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$3.$2.$1");
      var lbl = ex.fmCalKind === "global" ? "Global takvim" : "Kurum takvimi";
      var subt = [lbl, formattedDate, ex.sinav || ex.tur].filter(Boolean).join(" · ");
      var href = id ? "basit-deneme-sonuclari.html?examId=" + encodeURIComponent(id) : "basit-deneme-sonuclari.html";
      addDeneme(nm, subt, String(ex.sinav || ex.tur || "") + " " + id, href, id || null);
    });

    fmParseJsonArray(fmReadLsJson("examResults")).forEach(function (r) {
      if (!r) return;
      var eid = r.examId != null ? String(r.examId) : "";
      var en = String(r.examName || r.examTitle || "").trim();
      if (!en && eid) en = "Sınav " + eid;
      if (!en) return;
      var subt = r.examDate || r.date ? String(r.examDate || r.date).slice(0, 10) : "Sonuç Merkezi kaydı";
      var href = eid ? "basit-deneme-sonuclari.html?examId=" + encodeURIComponent(eid) : "basit-deneme-sonuclari.html";
      addDeneme(en, subt, String(eid) + " " + String(r.sinavTur || ""), href, eid || null);
    });

    fmParseJsonArray(fmReadLsJson("coaches")).forEach(function (c) {
      if (!c) return;
      var name = fmCoachField(c, ["name", "fullName", "displayName"]);
      if (!name) return;
      var spec = fmCoachField(c, ["specialtyLabel", "specialty", "branch", "title"]);
      items.push({
        type: "koc",
        isim: name,
        subtitle: spec || "Koçlar",
        tags: fmCoachField(c, ["email", "phone"]),
        url: "koclar.html",
      });
    });

    return items;
  }

  var CATEGORY_ORDER = ["ogrenci", "deneme", "koc", "sayfa"];

  var CATEGORY_LABEL = {
    ogrenci: "Öğrenciler",
    deneme: "Denemeler",
    koc: "Koçlar",
    sayfa: "Sayfalar & Araçlar",
  };

  var FM_CATEGORY_HEAD_UPPER = {
    ogrenci: "ÖĞRENCİLER",
    deneme: "DENEMELER",
    koc: "KOÇLAR",
    sayfa: "MENÜ",
  };

  var FM_DD_DOC_ICON =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';

  var FM_DD_ROW_CHEV =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';

  function fmHeadingForCategory(cat) {
    if (cat && FM_CATEGORY_HEAD_UPPER[cat]) return FM_CATEGORY_HEAD_UPPER[cat];
    var lb = CATEGORY_LABEL[cat];
    return String(lb || cat || "").toLocaleUpperCase("tr-TR");
  }

  function fmStudentInitials(title) {
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

  function fmSecondaryMetaLine(item) {
    var subt = item.subtitle ? String(item.subtitle).trim() : "";
    if (subt) return subt;
    if (item.type === "sayfa") return "Sayfa";
    if (item.type === "deneme") return "Deneme";
    if (item.type === "koc") return "Koç";
    if (item.type === "ogrenci") return "Öğrenci";
    return "";
  }

  var THEME_CYCLE = ["dark", "light", "blue", "orange"];

  function fmPagesContext() {
    var path = String(window.location.pathname || "").replace(/\\/g, "/");
    return path.indexOf("/pages/") !== -1 || /\/pages\//.test(path);
  }

  function fmResolveHref(href) {
    if (!href) return "#";
    if (/^https?:\/\//i.test(href)) return href;
    var parts = href.split("?");
    var pathPart = parts[0].replace(/^\.\//, "");
    var qs = parts.length > 1 ? "?" + parts.slice(1).join("?") : "";
    if (fmPagesContext()) {
      if (/^\.\.\//.test(pathPart)) return pathPart + qs;
      return pathPart + qs;
    }
    if (/^pages\//i.test(pathPart)) return pathPart + qs;
    return "pages/" + pathPart.replace(/^\/+/, "") + qs;
  }

  function fmMapDemoTarget(pathWithQuery) {
    var qi = pathWithQuery.indexOf("?");
    var base = qi === -1 ? pathWithQuery : pathWithQuery.slice(0, qi);
    var q = qi === -1 ? "" : pathWithQuery.slice(qi);
    if (/^ogrenci-detay\.html$/i.test(base)) return "ogrencilerim.html" + q;
    if (/^deneme-detay\.html$/i.test(base)) return "basit-deneme-sonuclari.html" + q;
    if (/^koc-detay\.html$/i.test(base)) return "koclar.html" + q;
    return pathWithQuery;
  }

  function fmNorm(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .trim();
  }

  function fmEsc(t) {
    return String(t || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  var FM_DD_OPEN = null;

  function fmClearDropdownAnchoring(resultsEl, inputEl) {
    fmCloseRepositionHooks();
    if (!resultsEl) return;
    resultsEl.classList.remove("fm-search-results--fixed");
    resultsEl.style.position = "";
    resultsEl.style.left = "";
    resultsEl.style.top = "";
    resultsEl.style.width = "";
    resultsEl.style.zIndex = "";
    resultsEl.style.maxHeight = "";
    if (inputEl) inputEl.setAttribute("aria-expanded", "false");
  }

  function fmCloseRepositionHooks() {
    if (!FM_DD_OPEN) return;
    window.removeEventListener("scroll", FM_DD_OPEN.onScroll, true);
    window.removeEventListener("resize", FM_DD_OPEN.onResize);
    FM_DD_OPEN = null;
  }

  function fmPositionDropdown(inputEl, resultsEl) {
    if (!inputEl || !resultsEl || resultsEl.classList.contains("hidden")) return;
    var r = inputEl.getBoundingClientRect();
    var gap = 6;
    var top = r.bottom + gap;
    resultsEl.style.position = "fixed";
    resultsEl.style.left = Math.round(Math.max(8, r.left)) + "px";
    resultsEl.style.top = Math.round(top) + "px";
    resultsEl.style.width = Math.round(r.width) + "px";
    resultsEl.style.zIndex = "10050";
    var vh =
      typeof window.innerHeight === "number"
        ? window.innerHeight
        : document.documentElement && document.documentElement.clientHeight
        ? document.documentElement.clientHeight
        : 600;
    resultsEl.style.maxHeight = Math.max(160, Math.min(400, vh - top - 12)) + "px";
    resultsEl.classList.add("fm-search-results--fixed");
  }

  function fmAttachDropdownAnchor(inputEl, resultsEl) {
    fmCloseRepositionHooks();
    function tick() {
      fmPositionDropdown(inputEl, resultsEl);
    }
    var onScroll = function () {
      tick();
    };
    var onResize = function () {
      tick();
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    FM_DD_OPEN = { inputEl: inputEl, resultsEl: resultsEl, onScroll: onScroll, onResize: onResize };
    tick();
  }

  function fmItemBlob(it) {
    return fmNorm(
      [it && it.isim, it && it.subtitle, it && it.tags, it && it.type === "sayfa" ? "arac Panel" : ""].join(" ")
    );
  }

  function fmScoreTokens(queryNorm, blob) {
    var q = String(queryNorm || "").trim();
    if (!q.length) return -1;
    var tokens = q.split(/\s+/).filter(Boolean);
    if (!tokens.length) return -1;
    var score = 0;
    var i;
    var t;
    var pos;
    for (i = 0; i < tokens.length; i++) {
      t = tokens[i];
      pos = blob.indexOf(t);
      if (pos === -1) return -1;
      score += 8 + t.length * 2;
      if (pos === 0) score += 10;
      if (blob.indexOf(" " + t) !== -1) score += 4;
      if (blob.indexOf(t + " ") !== -1) score += 2;
    }
    if (blob.indexOf(q) !== -1) score += 14;
    return score;
  }

  /** Kelime başından eşleşme (FM “yazdıkça daralt”) — tek harfte gürültüyü keser */
  function fmLeadingBonus(queryNorm, isimNorm) {
    var q = String(queryNorm || "").trim();
    if (!q.length) return 0;
    if (isimNorm.indexOf(q) === 0) return 22;
    if (isimNorm.indexOf(" " + q) !== -1) return 12;
    return 0;
  }

  function fmSearchItems(query) {
    var nq = fmNorm(query);
    if (nq.length < MIN_CHARS) return [];
    var index = fmBuildRealtimeSearchIndex();
    var out = [];
    var maxOut = nq.length === 1 ? 10 : nq.length === 2 ? 24 : 40;
    for (var i = 0; i < index.length; i++) {
      var it = index[i];
      if (!it) continue;
      var blob = fmItemBlob(it);
      var sc = fmScoreTokens(nq, blob);
      if (sc < 0) continue;
      var inorm = fmNorm(it.isim);
      sc += fmLeadingBonus(nq, inorm);
      if (nq.length <= 2) {
        var initials = inorm
          .split(/\s+/)
          .filter(Boolean)
          .map(function (w) {
            return w.charAt(0);
          })
          .join("");
        if (initials.indexOf(nq) === 0) sc += 6;
      }
      out.push({ item: it, score: sc });
    }
    out.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return String(a.item.isim).length - String(b.item.isim).length;
    });
    var flat = [];
    for (var j = 0; j < out.length && j < maxOut; j++) flat.push(out[j].item);
    return flat;
  }

  function fmGroupByCategory(matches) {
    var map = {};
    for (var c = 0; c < CATEGORY_ORDER.length; c++) map[CATEGORY_ORDER[c]] = [];
    for (var i = 0; i < matches.length; i++) {
      var m = matches[i];
      var t = m.type;
      if (!map[t]) map[t] = [];
      map[t].push(m);
    }
    return map;
  }

  function fmClearActiveRows(resultsEl) {
    if (!resultsEl) return;
    resultsEl.querySelectorAll(".fm-dd-item.fm-dd-item--active").forEach(function (el) {
      el.classList.remove("fm-dd-item--active");
    });
  }

  function fmSetActiveRowByIndex(resultsEl, idx) {
    if (!resultsEl) return;
    var items = resultsEl.querySelectorAll(".fm-dd-item");
    fmClearActiveRows(resultsEl);
    if (idx < 0 || idx >= items.length) return;
    items[idx].classList.add("fm-dd-item--active");
    try {
      items[idx].scrollIntoView({ block: "nearest" });
    } catch (e) {}
  }

  function fmNavigateRow(resultsEl, delta, stateHolder) {
    var items = resultsEl.querySelectorAll(".fm-dd-item");
    if (!items.length) return;
    if (typeof stateHolder.idx !== "number" || stateHolder.idx < 0) stateHolder.idx = 0;
    else stateHolder.idx = (stateHolder.idx + delta + items.length) % items.length;
    fmSetActiveRowByIndex(resultsEl, stateHolder.idx);
  }

  function fmActivateFocusedOrFirst(resultsEl) {
    var items = resultsEl.querySelectorAll(".fm-dd-item");
    if (!items.length) return false;
    var el = resultsEl.querySelector(".fm-dd-item.fm-dd-item--active");
    if (!el) el = items[0];
    el.click();
    return true;
  }

  function fmRenderDropdown(resultsEl, inputEl, query) {
    if (!resultsEl) return;
    if (inputEl && inputEl.__dpFmNav) inputEl.__dpFmNav.idx = -1;
    fmClearDropdownAnchoring(resultsEl, inputEl);
    resultsEl.innerHTML = "";
    var matches = fmSearchItems(query);
    if (fmNorm(query).length < MIN_CHARS) {
      resultsEl.classList.add("hidden");
      return;
    }
    if (!matches.length) {
      resultsEl.innerHTML =
        '<div class="py-8 px-4 text-center text-sm text-slate-400">Eşleşen kayıt yok. Bu tarayıcıdaki yerel liste boşsa önce Öğrencilerim veya deneme takvim / sonuç yüklemeden kayıt ekleyin; modül için kısayol adını (örn. &quot;tarama&quot;, &quot;analiz&quot;) yazın.</div>';
      resultsEl.classList.remove("hidden");
      if (inputEl) inputEl.setAttribute("aria-expanded", "true");
      fmAttachDropdownAnchor(inputEl, resultsEl);
      return;
    }
    var grouped = fmGroupByCategory(matches);
    var buf = [];
    var firstHdr = true;
    var ci;
    var cat;
    var list;
    var item;
    var ji;
    var rowIx = 0;

    for (ci = 0; ci < CATEGORY_ORDER.length; ci++) {
      cat = CATEGORY_ORDER[ci];
      list = grouped[cat];
      if (!list || !list.length) continue;

      buf.push(
        '<div class="' +
          (firstHdr
            ? "text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-3"
            : "text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 mt-3 px-3") +
          '">' +
          fmEsc(fmHeadingForCategory(cat)) +
          "</div>"
      );
      firstHdr = false;

      for (ji = 0; ji < list.length; ji++) {
        item = list[ji];
        var href = fmEsc(fmResolveHref(fmMapDemoTarget(item.url || "#")));
        var sideIcon =
          item.type === "ogrenci"
            ? '<div class="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 font-semibold text-sm">' +
              fmEsc(fmStudentInitials(item.isim)) +
              "</div>"
            : '<div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">' +
              FM_DD_DOC_ICON +
              "</div>";
        buf.push(
          '<a href="' +
            href +
            '" role="option" data-dd-ix="' +
            rowIx +
            '" class="fm-dd-item group flex items-center justify-between w-full px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer gap-4 no-underline text-inherit outline-none">' +
            '<div class="flex items-center gap-3.5 flex-1 min-w-0">' +
            sideIcon +
            '<div class="flex flex-col flex-1 min-w-0">' +
            '<div class="text-sm font-semibold text-slate-800 truncate">' +
            fmEsc(item.isim || "") +
            "</div>" +
            '<div class="text-xs text-slate-400 truncate">' +
            fmEsc(fmSecondaryMetaLine(item)) +
            "</div>" +
            "</div></div>" +
            '<div class="text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity pr-2 shrink-0">' +
            FM_DD_ROW_CHEV +
            "</div></a>"
        );
        rowIx += 1;
      }
    }

    resultsEl.innerHTML = buf.join("");

    Array.prototype.forEach.call(resultsEl.querySelectorAll(".fm-dd-item"), function (row, ix) {
      row.addEventListener("mousedown", function (e) {
        e.preventDefault();
      });
      row.addEventListener("mouseenter", function () {
        if (inputEl && inputEl.__dpFmNav) inputEl.__dpFmNav.idx = ix;
        fmClearActiveRows(resultsEl);
        row.classList.add("fm-dd-item--active");
      });
    });

    resultsEl.classList.remove("hidden");
    if (inputEl) inputEl.setAttribute("aria-expanded", "true");
    fmAttachDropdownAnchor(inputEl, resultsEl);
  }

  var __dpOutsideBound = false;
  function dpBindOutsideCloser() {
    if (__dpOutsideBound) return;
    __dpOutsideBound = true;
    document.addEventListener(
      "click",
      function (ev) {
        document.querySelectorAll(".fm-omni-field").forEach(function (wrap) {
          var results = wrap.querySelector("#fm-search-results");
          var inp = wrap.querySelector("#fm-global-search");
          if (!results || results.classList.contains("hidden")) return;
          if (wrap.contains(ev.target)) return;
          fmClearDropdownAnchoring(results, inp || null);
          results.classList.add("hidden");
          results.innerHTML = "";
        });
      },
      false
    );
  }

  function dpWireOmniboxWithin(root) {
    if (!root) return;
    var input = root.querySelector("#fm-global-search");
    var results = root.querySelector("#fm-search-results");
    if (!input || !results) return;
    if (input.getAttribute("data-dp-omni-wired") === "1") return;
    input.setAttribute("data-dp-omni-wired", "1");

    dpBindOutsideCloser();

    input.__dpFmNav = { idx: -1 };

    function hideResults() {
      fmClearDropdownAnchoring(results, input);
      results.classList.add("hidden");
      results.innerHTML = "";
      if (input.__dpFmNav) input.__dpFmNav.idx = -1;
    }

    input.addEventListener("input", function () {
      if (input.__dpFmNav) input.__dpFmNav.idx = -1;
      fmRenderDropdown(results, input, input.value);
    });
    input.addEventListener("focus", function () {
      if (input.__dpFmNav) input.__dpFmNav.idx = -1;
      fmRenderDropdown(results, input, input.value);
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        hideResults();
        input.blur();
        return;
      }
      var nav = input.__dpFmNav || { idx: -1 };
      var open = !results.classList.contains("hidden");
      var itemCount = results.querySelectorAll(".fm-dd-item").length;

      if (e.key === "ArrowDown") {
        if (!open || !itemCount) {
          fmRenderDropdown(results, input, input.value);
          itemCount = results.querySelectorAll(".fm-dd-item").length;
        }
        if (itemCount) {
          e.preventDefault();
          fmNavigateRow(results, 1, nav);
        }
        return;
      }
      if (e.key === "ArrowUp") {
        if (open && itemCount) {
          e.preventDefault();
          fmNavigateRow(results, -1, nav);
        }
        return;
      }
      if (e.key === "Enter") {
        if (open && itemCount && fmActivateFocusedOrFirst(results)) {
          e.preventDefault();
        }
      }
    });
  }

  function dpWireBack(root) {
    var btn = root.querySelector('[data-dp-action="back"], #dp-header-back');
    if (!btn || btn.getAttribute("data-dp-bound") === "1") return;
    btn.setAttribute("data-dp-bound", "1");
    btn.addEventListener("click", function () {
      window.history.back();
    });
  }

  function dpWireNotify(root) {
    var btn = root.querySelector("#dp-header-notify");
    if (!btn || btn.getAttribute("data-dp-bound") === "1") return;
    btn.setAttribute("data-dp-bound", "1");
    btn.addEventListener("click", function () {
      window.alert("Bildirimler yakında kullanılabilir olacaktır.");
    });
  }

  function dpWireTheme(root) {
    var btn = root.querySelector("#dp-header-theme");
    if (!btn || btn.getAttribute("data-dp-bound") === "1") return;
    btn.setAttribute("data-dp-bound", "1");
    btn.addEventListener("click", function () {
      if (typeof window.DerecepanelTheme === "undefined" || typeof window.DerecepanelTheme.applyTheme !== "function") {
        window.alert("Tema modülü yüklenemedi.");
        return;
      }
      var cur = document.documentElement.getAttribute("data-theme") || "dark";
      var idx = THEME_CYCLE.indexOf(cur);
      if (idx < 0) idx = 0;
      var next = THEME_CYCLE[(idx + 1) % THEME_CYCLE.length];
      window.DerecepanelTheme.applyTheme(next);
    });
  }

  function dpInitHeaderRoot(root) {
    if (!root) return;
    dpWireBack(root);
    dpWireOmniboxWithin(root);
    dpWireNotify(root);
    dpWireTheme(root);
  }

  function dpBuildProfileBlock() {
    var wrap = document.createElement("div");
    wrap.className = "header-profile-wrap dp-header-profile-slot";
    wrap.setAttribute("data-header-profile", "");
    wrap.innerHTML =
      '<button type="button" class="header-profile__trigger" id="headerProfileTrigger" aria-expanded="false" aria-haspopup="menu" aria-controls="headerProfileMenu">' +
      '<span id="headerAvatarContainer" title="Profil" aria-hidden="true">?</span>' +
      "</button>" +
      '<div id="headerProfileMenu" class="header-profile__menu" hidden role="menu">' +
      '<div class="header-profile__menu-inner">' +
      '<div class="header-profile__hero" role="none">' +
      '<span class="header-profile__hero-avatar" id="headerProfileMenuAvatar" aria-hidden="true">?</span>' +
      '<div class="header-profile__hero-text">' +
      '<p class="header-profile__name" id="headerProfileName"></p>' +
      '<p class="header-profile__meta" id="headerProfileMeta"></p>' +
      "</div></div>" +
      '<div class="header-profile__list">' +
      '<button type="button" class="header-profile__row" role="menuitem" data-profile-open="detay">' +
      '<span class="header-profile__row-label">Detay</span>' +
      '<svg class="header-profile__row-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      "</button>" +
      '<button type="button" class="header-profile__row" role="menuitem" data-profile-open="duzenle">' +
      '<span class="header-profile__row-label">Düzenle</span>' +
      '<svg class="header-profile__row-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      "</button></div>" +
      '<div class="header-profile__sep" role="separator"></div>' +
      '<button type="button" class="header-profile__row header-profile__row--logout btn-logout" role="menuitem">' +
      '<span class="header-profile__row-label">Çıkış yap</span>' +
      '<svg class="header-profile__row-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      "</button></div></div>";
    return wrap;
  }

  function dpBuildStandardHeaderHtml() {
    var header = document.createElement("header");
    header.id = "dp-standard-header";
    header.className =
      "dp-standard-header topbar flex w-full flex-row flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-6";
    header.setAttribute("data-dp-standard-header", "1");

    var left = document.createElement("div");
    left.className = "dp-header-left flex min-w-0 flex-1 flex-row items-center gap-3";

    var backBtn = document.createElement("button");
    backBtn.type = "button";
    backBtn.id = "dp-header-back";
    backBtn.className =
      "dp-header-icon-btn flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition-colors hover:bg-slate-50";
    backBtn.setAttribute("aria-label", "Geri dön");
    backBtn.setAttribute("data-dp-action", "back");
    backBtn.innerHTML =
      '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M19 12H5M12 19l-7-7 7-7"/></svg>';

    var omni = document.createElement("div");
    omni.className = "fm-omni-field dp-header-omni relative min-w-0 flex-1";
    omni.innerHTML =
      '<div class="fm-omni-inner flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 shadow-sm">' +
      '<svg class="fm-omni-mag shrink-0 text-slate-400" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35"/></svg>' +
      '<input type="text" id="fm-global-search" class="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-slate-400" autocomplete="off" aria-expanded="false" aria-controls="fm-search-results" placeholder="Öğrenci, deneme, koç veya konu ara..." />' +
      "</div>" +
      '<div id="fm-search-results" class="fm-search-results absolute w-full bg-white shadow-2xl border border-slate-100 rounded-2xl mt-2 z-50 hidden max-h-[400px] overflow-y-auto p-2" role="listbox" aria-label="Arama sonuçları"></div>';

    left.appendChild(backBtn);
    left.appendChild(omni);

    var right = document.createElement("div");
    right.className = "dp-header-right flex shrink-0 flex-row items-center gap-4";

    var bell = document.createElement("button");
    bell.type = "button";
    bell.id = "dp-header-notify";
    bell.className =
      "dp-header-icon-btn flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50";
    bell.setAttribute("aria-label", "Bildirimler");
    bell.innerHTML =
      '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>';

    var themeBtn = document.createElement("button");
    themeBtn.type = "button";
    themeBtn.id = "dp-header-theme";
    themeBtn.className =
      "dp-header-icon-btn flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-amber-500 transition-colors hover:bg-slate-50";
    themeBtn.setAttribute("aria-label", "Tema değiştir");
    themeBtn.innerHTML =
      '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';

    right.appendChild(bell);
    right.appendChild(themeBtn);
    right.appendChild(dpBuildProfileBlock());

    header.appendChild(left);
    header.appendChild(right);
    return header;
  }

  function dpUpgradeLegacyTopbar() {
    if (document.body.getAttribute("data-fm-global-search") === "off") return;
    if (document.body.getAttribute("data-dp-skip-header-upgrade") === "1") return;
    if (document.querySelector("main.og-student-main")) return;
    if (document.getElementById("og-topbar-anasayfa")) return;
    if (document.getElementById("dp-standard-header")) return;

    var shell = document.getElementById("panel-shell");
    var main = shell ? shell.querySelector("main.main") : document.querySelector("main.main");
    if (!main) return;

    var oldHeader = main.querySelector(":scope > header.topbar");
    if (!oldHeader) return;

    var preserved = [];
    var leftInner = oldHeader.querySelector(".topbar__left");
    if (leftInner) {
      for (var i = 0; i < leftInner.children.length; i++) preserved.push(leftInner.children[i]);
    }

    var newHeader = dpBuildStandardHeaderHtml();
    main.insertBefore(newHeader, oldHeader);
    oldHeader.remove();

    var leftWrap = newHeader.querySelector(".dp-header-left");
    preserved.forEach(function (child) {
      if (!child) return;
      if (child.matches(".search-bar")) return;
      if (
        child.matches('a.btn-icon[aria-label="Geri"], button.btn-icon[aria-label="Geri"], button[aria-label="Geri"], a[aria-label="Geri"], button[aria-label="Geri"]')
      )
        return;
      leftWrap.appendChild(child);
    });

    dpInitHeaderRoot(newHeader);
  }

  function dpBoot() {
    if (document.body.getAttribute("data-fm-global-search") === "off") return;

    dpBindOutsideCloser();

    var std = document.getElementById("dp-standard-header");
    if (std) {
      dpInitHeaderRoot(std);
      return;
    }
    dpUpgradeLegacyTopbar();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", dpBoot);
  } else {
    dpBoot();
  }

  window.DerecepanelStdHeader = { init: dpBoot, initRoot: dpInitHeaderRoot };
})();
