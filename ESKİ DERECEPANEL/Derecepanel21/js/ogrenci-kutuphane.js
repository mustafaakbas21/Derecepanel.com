/**
 * Öğrenci kütüphanesi — kitap + dijital kaynaklar, YKS müfredat ders filtresi.
 */
(function () {
  "use strict";
  var libraryList = [];
  var digitalSinavFilter = "all";
  var digitalSubjectFilter = "";
  var currentSource = "books";
  var bookRowsAll = [];
  var bookFilterQ = "";
  var bookFilterKind = "";
  var mufredatSubjects = [];

  var BRANCH_UI = {
    "tyt-mat": { hero: "og-lib-card__hero--tyt-mat", tag: "TYT · Mat" },
    "tyt-tr": { hero: "og-lib-card__hero--tyt-tr", tag: "TYT · Türkçe" },
    "tyt-fen": { hero: "og-lib-card__hero--tyt-fen", tag: "TYT · Fen" },
    "tyt-sos": { hero: "og-lib-card__hero--tyt-sos", tag: "TYT · Sosyal" },
    "ayt-say": { hero: "og-lib-card__hero--ayt-say", tag: "AYT · Say" },
    "ayt-ea": { hero: "og-lib-card__hero--ayt-ea", tag: "AYT · EA" },
    uncat: { hero: "og-lib-card__hero--uncat", tag: "Genel" },
  };

  var BRANCH_SUBJECT_HINTS = {
    "tyt-fen": ["tyt-fiz", "tyt-kim", "tyt-biyo"],
    "tyt-sos": ["tyt-tar", "tyt-cog", "tyt-fel", "tyt-din"],
    "ayt-say": ["ayt-mat", "ayt-geo", "ayt-fiz", "ayt-kim", "ayt-biyo"],
    "ayt-ea": ["ayt-edeb", "ayt-tar1", "ayt-tar2", "ayt-cog1", "ayt-cog2", "ayt-fel-grup", "ayt-din"],
  };

  function getCurrentUser() {
    try {
      var raw = localStorage.getItem("currentUser");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function syncStudentCatalog() {
    if (typeof window.ensureDereceStudentCatalog === "function") {
      try {
        window.ensureDereceStudentCatalog();
      } catch (e) {}
    }
  }

  function kindLabel(k) {
    var m = {
      "soru-bankasi": "Soru Bankası",
      "konu-anlatim": "Konu Anlatımı",
      deneme: "Deneme",
      fasikul: "Fasikül",
    };
    return m[k] || k || "Kaynak";
  }

  function subjectLabelFor(subjectId) {
    if (!subjectId) return "";
    if (window.YksMufredatApi && typeof window.YksMufredatApi.getSubject === "function") {
      var sub = window.YksMufredatApi.getSubject(subjectId);
      if (sub && sub.name) return sub.name;
    }
    return subjectId;
  }

  function assignmentMatchesStudent(asg, candidates) {
    var sid = String((asg && asg.studentId) || "")
      .trim()
      .toLowerCase();
    if (!sid) return false;
    for (var i = 0; i < candidates.length; i++) {
      if (
        String(candidates[i] || "")
          .trim()
          .toLowerCase() === sid
      ) {
        return true;
      }
    }
    return false;
  }

  function loadBookRowsForUser(u) {
    if (!window.DereceLibraryStore || !u) return [];
    var candidates = fascicleStorageCandidates(u);
    var assignments = window.DereceLibraryStore.getAssignments();
    var rows = [];
    for (var i = 0; i < assignments.length; i++) {
      var a = assignments[i];
      if (!a || !assignmentMatchesStudent(a, candidates)) continue;
      var book = window.DereceLibraryStore.getBookById(a.bookId);
      if (!book) continue;
      rows.push({ assignment: a, book: book });
    }
    rows.sort(function (x, y) {
      var ta = new Date((x.assignment && x.assignment.createdAt) || 0).getTime();
      var tb = new Date((y.assignment && y.assignment.createdAt) || 0).getTime();
      return tb - ta;
    });
    return rows;
  }

  function filterBookRows(rows) {
    var q = bookFilterQ.toLowerCase().trim();
    return rows.filter(function (row) {
      var b = row.book;
      if (bookFilterKind && b.kind !== bookFilterKind) return false;
      if (!q) return true;
      var title = String(b.title || "").toLowerCase();
      var pub = String(b.publisher || "").toLowerCase();
      var sub = subjectLabelFor(b.subjectId).toLowerCase();
      return title.indexOf(q) !== -1 || pub.indexOf(q) !== -1 || sub.indexOf(q) !== -1;
    });
  }

  function formatDueLabel(due) {
    if (!due) return "";
    var ms = new Date(due).getTime();
    if (isNaN(ms)) return "";
    return new Date(ms).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function postIframeResize() {
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

  /** .hidden sınıfı + [hidden] — sayfada Tailwind olmadığı için ikisi de kullanılır */
  function setPanelVisible(el, visible) {
    if (!el) return;
    el.classList.toggle("hidden", !visible);
    el.hidden = !visible;
  }

  function setSource(src) {
    currentSource = src === "digital" ? "digital" : "books";
    var bar = document.getElementById("og-lib-source-bar");
    if (bar) {
      bar.querySelectorAll(".og-lib-source-btn").forEach(function (btn) {
        var on = btn.getAttribute("data-source") === currentSource;
        btn.classList.toggle("og-lib-source-btn--active", on);
        btn.setAttribute("aria-selected", on ? "true" : "false");
      });
    }
    var booksPanel = document.getElementById("og-lib-books-panel");
    var digitalPanel = document.getElementById("og-lib-digital-panel");
    if (booksPanel) {
      booksPanel.classList.toggle("hidden", currentSource !== "books");
      booksPanel.hidden = currentSource !== "books";
    }
    if (digitalPanel) {
      digitalPanel.classList.toggle("hidden", currentSource !== "digital");
      digitalPanel.hidden = currentSource !== "digital";
    }
    var sub = document.getElementById("og-lib-sub");
    if (sub) {
      sub.textContent =
        currentSource === "books"
          ? "Koçunuzun atadığı soru bankaları, konu anlatımları ve denemeler burada listelenir."
          : "Fasikül, tarama ve test PDF'leri bu bölümde listelenir.";
    }
    if (currentSource === "digital") {
      ensureMufredatReady(function () {
        wireDigitalToolbar();
        applyGridFilter();
      });
    }
    postIframeResize();
  }

  function wireSourceSwitch() {
    var bar = document.getElementById("og-lib-source-bar");
    if (!bar) return;
    bar.querySelectorAll(".og-lib-source-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setSource(btn.getAttribute("data-source") || "books");
      });
    });
  }

  function wireBookFilters() {
    var inp = document.getElementById("og-lib-books-search");
    var sel = document.getElementById("og-lib-books-kind");
    if (inp) {
      inp.addEventListener("input", function () {
        bookFilterQ = inp.value;
        renderBooksPanel(getCurrentUser());
      });
    }
    if (sel) {
      sel.addEventListener("change", function () {
        bookFilterKind = sel.value;
        renderBooksPanel(getCurrentUser());
      });
    }
  }

  function renderBooksPanel(u) {
    var grid = document.getElementById("og-lib-books-grid");
    var empty = document.getElementById("og-lib-books-empty");
    var filterEmpty = document.getElementById("og-lib-books-filter-empty");
    var countEl = document.getElementById("og-lib-books-count");
    if (!grid) return;

    if (!u) {
      bookRowsAll = [];
      grid.innerHTML = "";
      setPanelVisible(empty, true);
      setPanelVisible(grid, false);
      setPanelVisible(filterEmpty, false);
      if (countEl) countEl.textContent = "";
      postIframeResize();
      return;
    }

    bookRowsAll = loadBookRowsForUser(u);
    var shown = filterBookRows(bookRowsAll);
    grid.innerHTML = "";

    if (countEl) {
      countEl.textContent =
        bookRowsAll.length === 0
          ? ""
          : shown.length === bookRowsAll.length
            ? shown.length + " kitap"
            : shown.length + " / " + bookRowsAll.length + " kitap";
    }

    var isEmpty = bookRowsAll.length === 0;
    var hasFilter = !!(bookFilterQ && bookFilterQ.trim()) || !!bookFilterKind;
    var showFilterEmpty = !isEmpty && shown.length === 0 && hasFilter;

    setPanelVisible(empty, isEmpty);
    setPanelVisible(grid, !isEmpty && shown.length > 0);
    setPanelVisible(filterEmpty, showFilterEmpty);

    if (isEmpty) {
      postIframeResize();
      return;
    }

    if (!shown.length) {
      postIframeResize();
      return;
    }

    for (var i = 0; i < shown.length; i++) {
      var row = shown[i];
      var b = row.book;
      var a = row.assignment;
      var pct = typeof a.progress === "number" ? Math.max(0, Math.min(100, a.progress)) : 0;
      var due = formatDueLabel(a.dueDate);
      var hasPdf = !!(b.pdfDataUrl && String(b.pdfDataUrl).trim());

      var art = document.createElement("article");
      art.className = "og-lib-book-tile";
      var coverInner = b.coverDataUrl
        ? '<img src="' + esc(b.coverDataUrl) + '" alt="" loading="lazy"/>'
        : '<div class="flex h-full w-full items-center justify-center" style="color:#1e3a5f"><svg class="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg></div>';

      art.innerHTML =
        '<div class="og-lib-book-tile__cover">' +
        coverInner +
        '</div><div class="og-lib-book-tile__body"><p class="og-lib-book-tile__title">' +
        esc(b.title || "Kitap") +
        '</p><p class="og-lib-book-tile__meta">' +
        esc(kindLabel(b.kind)) +
        (b.publisher ? " · " + esc(b.publisher) : "") +
        '</p><div class="og-lib-book-prog" aria-hidden="true"><div class="og-lib-book-prog__bar" style="width:' +
        pct +
        '%"></div></div><p class="og-lib-book-due">' +
        (due ? "Hedef: " + esc(due) : pct + "% ilerleme") +
        (a.note ? " · " + esc(a.note) : "") +
        '</p><button type="button" class="og-lib-book-pdf"' +
        (hasPdf ? "" : " disabled") +
        ">PDF</button></div>";

      var pdfBtn = art.querySelector(".og-lib-book-pdf");
      if (pdfBtn && hasPdf) {
        pdfBtn.addEventListener("click", function () {
          window.open(b.pdfDataUrl, "_blank", "noopener,noreferrer");
        });
      } else if (pdfBtn) {
        pdfBtn.addEventListener("click", function () {
          toast("Bu kitap için PDF henüz yüklenmemiş.", false);
        });
      }

      grid.appendChild(art);
    }

    postIframeResize();
  }

  function refreshBooks(u) {
    renderBooksPanel(u);
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

  function studentCodeForUser(u) {
    if (!u) return "";
    var code = String(u.studentCode || "").trim();
    if (code) return code;
    var cid = catalogIdForUser(u);
    var cat = (window.DereceStudentCatalog || []).find(function (s) {
      return s && s.id === cid;
    });
    return cat && cat.code ? String(cat.code).trim() : "";
  }

  function fascicleStorageCandidates(u) {
    var out = [];
    function add(x) {
      x = String(x || "").trim();
      if (x && out.indexOf(x) < 0) out.push(x);
    }
    if (u) {
      add(u.id);
      add(u.ogrenciId);
    }
    var cid = catalogIdForUser(u);
    var code = studentCodeForUser(u);
    var ka = String((u && u.kullaniciAdi) || "").trim();
    add(cid);
    add(code);
    add(ka);
    return out;
  }

  function mergeAssignedLists(candidates) {
    var byId = {};
    var bridge = window.DereceFascicleBridge;
    if (!bridge) return [];
    for (var i = 0; i < candidates.length; i++) {
      var id = candidates[i];
      if (!id) continue;
      var list = bridge.readAssigned(id);
      for (var j = 0; j < list.length; j++) {
        var rec = list[j];
        if (!rec || !rec.id) continue;
        byId[String(rec.id)] = rec;
      }
    }
    var merged = [];
    Object.keys(byId).forEach(function (k) {
      merged.push(byId[k]);
    });
    merged.sort(function (a, b) {
      var ta = new Date(a.assignedAt || 0).getTime();
      var tb = new Date(b.assignedAt || 0).getTime();
      return tb - ta;
    });
    return merged;
  }

  function hasResultForFascicle(fascicleId, u) {
    var bridge = window.DereceFascicleBridge;
    if (!bridge || !fascicleId) return false;
    var tries = fascicleStorageCandidates(u);
    for (var i = 0; i < tries.length; i++) {
      var items = bridge.readResults(tries[i]);
      for (var j = 0; j < items.length; j++) {
        if (items[j] && String(items[j].fascicleId) === String(fascicleId)) return true;
      }
    }
    return false;
  }

  function effectiveStatus(rec, u) {
    var st = String((rec && rec.status) || "").toLowerCase();
    if (st === "tamamlandı" || st === "tamamlandi") return "tamamlandı";
    if (hasResultForFascicle(rec && rec.id, u)) return "tamamlandı";
    return "bekliyor";
  }

  function classifyBranch(rec) {
    var raw =
      String(rec.branch || rec.brans || rec.category || rec.track || rec.alan || "") +
      " " +
      String(rec.title || "") +
      " " +
      String(rec.notes || "") +
      " " +
      String(rec.template || "");
    var t = raw.toLowerCase();

    if (rec.branchId && rec.branchId !== "all" && BRANCH_UI[rec.branchId]) {
      return rec.branchId;
    }
    if (rec.subjectId && mufredatSubjects.length) {
      for (var si = 0; si < mufredatSubjects.length; si++) {
        if (mufredatSubjects[si].id === rec.subjectId) {
          var sn = String(mufredatSubjects[si].name || "").toLowerCase();
          if (/mat|geometri/.test(sn) && !/edeb/.test(sn)) return "tyt-mat";
          if (/türk|turk|edeb/.test(sn)) return "tyt-tr";
          if (/fizik|kimya|biyoloji|fen/.test(sn)) return "tyt-fen";
          if (/tarih|coğrafya|cografya|felsefe|din|sosyal/.test(sn)) return "tyt-sos";
          if (mufredatSubjects[si].sinav === "AYT") {
            if (/eşit|esit|sözel|edeb|tarih|coğrafya|felsefe|din/.test(sn)) return "ayt-ea";
            return "ayt-say";
          }
        }
      }
    }

    if (/ayt\s*eşit|ayt\s*esit|eşit\s*ağırlık|esit\s*agirlik|\bea\b/i.test(t)) return "ayt-ea";
    if (/ayt\s*say|ayt\s*sayısal|sayısal\s*ayt/i.test(t)) return "ayt-say";
    if (/\bayt\b/.test(t)) {
      if (/eşit|esit|sözel|sozel|tarih|edebiyat|coğrafya|cografya|felsefe/i.test(t) && !/mat|fizik|kimya|biyol|geo|geometri/i.test(t)) return "ayt-ea";
      return "ayt-say";
    }
    if (/türk|turk|paragraf|dil\s*bilgisi|tyt\s*türk|tyt\s*turk/i.test(t)) return "tyt-tr";
    if (/fizik|kimya|biyoloji|fen\s*bil|tyt\s*fen/i.test(t)) return "tyt-fen";
    if (/tarih|coğrafya|cografya|felsefe|din|edebiyat|inkılap|inkilap|sosyal|tyt\s*sos/i.test(t)) return "tyt-sos";
    if (/matematik|geometri|sayı|sayi|problem|tyt\s*mat/i.test(t)) return "tyt-mat";
    return "uncat";
  }

  function parseDueMs(rec) {
    var d = rec.dueAt || rec.dueDate || rec.deadline || rec.teslimTarihi || "";
    if (!d) return null;
    var ms = new Date(d).getTime();
    return isNaN(ms) ? null : ms;
  }

  function pickUrgentFascicles(list, u) {
    var open = list.filter(function (r) {
      return effectiveStatus(r, u) !== "tamamlandı";
    });
    open.sort(function (a, b) {
      var da = parseDueMs(a);
      var db = parseDueMs(b);
      if (da != null && db != null) return da - db;
      if (da != null) return -1;
      if (db != null) return 1;
      return new Date(b.assignedAt || 0).getTime() - new Date(a.assignedAt || 0).getTime();
    });
    return open.slice(0, 2);
  }

  function toast(msg, isError) {
    var el = document.getElementById("og-lib-toast");
    if (!el) {
      window.alert(msg);
      return;
    }
    el.hidden = false;
    el.textContent = msg;
    el.classList.remove("og-lib-toast--ok", "og-lib-toast--err", "is-on");
    el.classList.add(isError ? "og-lib-toast--err" : "og-lib-toast--ok");
    requestAnimationFrame(function () {
      el.classList.add("is-on");
    });
    window.clearTimeout(toast._t);
    toast._t = window.setTimeout(function () {
      el.classList.remove("is-on");
    }, 4200);
  }

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  var mufredatReadyHooked = false;

  function loadMufredatSubjects() {
    if (!window.YksMufredatApi || typeof window.YksMufredatApi.getSubjects !== "function") {
      mufredatSubjects = [];
      return false;
    }
    mufredatSubjects = window.YksMufredatApi.getSubjects().slice().sort(function (a, b) {
      if (a.sinav !== b.sinav) return a.sinav === "TYT" ? -1 : 1;
      return String(a.name || "").localeCompare(String(b.name || ""), "tr");
    });
    return mufredatSubjects.length > 0;
  }

  function onMufredatSubjectsReady() {
    if (!loadMufredatSubjects()) return;
    wireDigitalToolbar();
    if (currentSource === "digital") {
      applyGridFilter();
      postIframeResize();
    }
  }

  function bindMufredatReadyOnce() {
    if (mufredatReadyHooked) return;
    mufredatReadyHooked = true;
    window.addEventListener("yks-mufredat:ready", onMufredatSubjectsReady);
  }

  /** yks-mufredat.js yüklenene kadar bekle (iframe / script sırası) */
  function ensureMufredatReady(done) {
    bindMufredatReadyOnce();
    function finish() {
      loadMufredatSubjects();
      if (typeof done === "function") done();
    }
    if (window.OgrenciMufredatGate && typeof window.OgrenciMufredatGate.ensureReady === "function") {
      window.OgrenciMufredatGate.ensureReady(finish);
      return;
    }
    if (loadMufredatSubjects()) {
      finish();
      return;
    }
    var tries = 0;
    function tick() {
      if (loadMufredatSubjects()) {
        finish();
        return;
      }
      tries += 1;
      if (tries < 120) setTimeout(tick, 40);
      else finish();
    }
    tick();
  }

  function subjectDisplayName(subjectId) {
    if (!subjectId) return "Genel";
    var api = window.YksMufredatApi;
    if (api && typeof api.getSubject === "function") {
      var s = api.getSubject(subjectId);
      if (s && s.name) return s.name;
    }
    return subjectId;
  }

  function resolveRecSubjectId(rec) {
    if (!rec) return "";
    if (rec.subjectId && window.YksMufredatApi) {
      var hit = window.YksMufredatApi.getSubject(rec.subjectId);
      if (hit) return rec.subjectId;
    }
    if (!mufredatSubjects.length) loadMufredatSubjects();
    var blob = (
      String(rec.title || "") +
      " " +
      String(rec.notes || "") +
      " " +
      String(rec.template || "") +
      " " +
      String(rec.branch || rec.brans || "")
    ).toLowerCase();
    var sorted = mufredatSubjects.slice().sort(function (a, b) {
      return String(b.name || "").length - String(a.name || "").length;
    });
    for (var i = 0; i < sorted.length; i++) {
      var nm = String(sorted[i].name || "").toLowerCase();
      if (nm && blob.indexOf(nm) !== -1) return sorted[i].id;
      var short = nm.replace(/^(tyt|ayt)\s+/i, "").trim();
      if (short.length > 3 && blob.indexOf(short) !== -1) return sorted[i].id;
    }
    return "";
  }

  function getRecSinav(rec) {
    var sid = resolveRecSubjectId(rec);
    if (sid && window.YksMufredatApi) {
      var sub = window.YksMufredatApi.getSubject(sid);
      if (sub && sub.sinav) return sub.sinav;
    }
    var branch = classifyBranch(rec);
    if (branch.indexOf("ayt") === 0) return "AYT";
    if (branch.indexOf("tyt") === 0) return "TYT";
    return "";
  }

  function recMatchesSubjectFilter(rec, subjectId) {
    if (!subjectId) return true;
    if (resolveRecSubjectId(rec) === subjectId) return true;
    var branch = classifyBranch(rec);
    var hints = BRANCH_SUBJECT_HINTS[branch];
    if (hints && hints.indexOf(subjectId) !== -1) return true;
    return false;
  }

  function branchLabel(id) {
    var ui = BRANCH_UI[id];
    if (ui) return ui.tag.replace(" · ", " ");
    return "Diğer";
  }

  function populateSubjectSelect() {
    var sel = document.getElementById("og-lib-subject-select");
    if (!sel) return;
    if (!mufredatSubjects.length) loadMufredatSubjects();
    var prev = sel.value;
    sel.innerHTML = '<option value="">Tüm dersler</option>';
    if (!mufredatSubjects.length) {
      var optWait = document.createElement("option");
      optWait.disabled = true;
      optWait.textContent = "Müfredat yükleniyor…";
      sel.appendChild(optWait);
      return;
    }
    mufredatSubjects.forEach(function (s) {
      if (digitalSinavFilter !== "all" && s.sinav !== digitalSinavFilter) return;
      var opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = s.name + (s.sinav ? " (" + s.sinav + ")" : "");
      sel.appendChild(opt);
    });
    var ok = false;
    for (var i = 0; i < sel.options.length; i++) {
      if (sel.options[i].value === prev) ok = true;
    }
    sel.value = ok ? prev : "";
    digitalSubjectFilter = sel.value;
  }

  function syncSinavPills() {
    var wrap = document.getElementById("og-lib-sinav-pills");
    if (!wrap) return;
    wrap.querySelectorAll(".og-lib-pill").forEach(function (btn) {
      var on = btn.getAttribute("data-sinav") === digitalSinavFilter;
      btn.classList.toggle("og-lib-pill--active", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
    });
  }

  function wireDigitalToolbar() {
    var pillsWrap = document.getElementById("og-lib-sinav-pills");
    var sel = document.getElementById("og-lib-subject-select");
    if (!pillsWrap) return;

    loadMufredatSubjects();
    pillsWrap.innerHTML = "";
    [
      { id: "all", label: "Tümü" },
      { id: "TYT", label: "TYT" },
      { id: "AYT", label: "AYT" },
    ].forEach(function (p) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "og-lib-pill" + (digitalSinavFilter === p.id ? " og-lib-pill--active" : "");
      btn.setAttribute("role", "tab");
      btn.setAttribute("data-sinav", p.id);
      btn.setAttribute("aria-selected", digitalSinavFilter === p.id ? "true" : "false");
      btn.textContent = p.label;
      btn.addEventListener("click", function () {
        digitalSinavFilter = p.id;
        syncSinavPills();
        populateSubjectSelect();
        applyGridFilter();
      });
      pillsWrap.appendChild(btn);
    });
    syncSinavPills();
    populateSubjectSelect();

    if (sel && !sel._ogBound) {
      sel._ogBound = true;
      sel.addEventListener("change", function () {
        digitalSubjectFilter = sel.value;
        applyGridFilter();
      });
    }
  }

  function applyGridFilter() {
    if (currentSource !== "digital") return;
    var grid = document.getElementById("og-lib-grid");
    var emptyModule = document.getElementById("og-lib-empty-module");
    var filterEmpty = document.getElementById("og-lib-filter-empty");
    var countEl = document.getElementById("og-lib-count");
    var toolbar = document.getElementById("og-lib-digital-toolbar");
    if (!grid) return;
    var cards = grid.querySelectorAll(".og-lib-card");
    var visible = 0;
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      var show = true;
      var cardSinav = c.getAttribute("data-sinav") || "";
      var cardSubject = c.getAttribute("data-subject-id") || "";
      var matchSubjects = (c.getAttribute("data-match-subjects") || "").split(",").filter(Boolean);

      if (digitalSinavFilter !== "all" && cardSinav && cardSinav !== digitalSinavFilter) show = false;
      if (digitalSubjectFilter) {
        var subjectOk =
          cardSubject === digitalSubjectFilter || matchSubjects.indexOf(digitalSubjectFilter) !== -1;
        if (!subjectOk) show = false;
      }
      c.style.display = show ? "" : "none";
      if (show) visible++;
    }
    var isGlobalEmpty = libraryList.length === 0;
    if (countEl) {
      countEl.textContent =
        isGlobalEmpty ? "" : visible + " / " + libraryList.length + " materyal";
    }
    setPanelVisible(emptyModule, isGlobalEmpty);
    setPanelVisible(grid, !isGlobalEmpty);
    setPanelVisible(
      toolbar,
      !isGlobalEmpty
    );
    setPanelVisible(
      filterEmpty,
      libraryList.length > 0 &&
        visible === 0 &&
        (digitalSinavFilter !== "all" || !!digitalSubjectFilter)
    );
    postIframeResize();
  }

  function renderUrgentRow(list, u) {
    var wrap = document.getElementById("og-lib-urgent-wrap");
    var row = document.getElementById("og-lib-urgent-row");
    if (!wrap || !row) return;
    var urgent = pickUrgentFascicles(list, u);
    row.innerHTML = "";
    if (!urgent.length) {
      setPanelVisible(wrap, false);
      return;
    }
    setPanelVisible(wrap, true);
    urgent.forEach(function (rec) {
      var due = parseDueMs(rec);
      var dueStr = due
        ? new Date(due).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
        : "Tarih belirtilmedi";
      var art = document.createElement("article");
      art.className =
        "min-w-0 flex-1 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:max-w-md";
      art.style.borderLeft = "4px solid #1e3a5f";
      art.innerHTML =
        '<div class="flex flex-col gap-1">' +
        '<span class="text-[10px] font-bold uppercase tracking-wider" style="color:#1e3a5f">Öncelikli</span>' +
        '<h3 class="text-base font-bold leading-snug text-slate-900 dark:text-slate-100">' +
        esc(rec.title || "Test") +
        "</h3>" +
        '<p class="text-xs font-medium text-slate-500 dark:text-slate-400">Teslim: ' +
        esc(dueStr) +
        "</p>" +
        '<p class="mt-1 text-xs text-slate-600 dark:text-slate-300">' +
        (rec.questionCount ? esc(String(rec.questionCount)) + " soru" : "—") +
        "</p></div>";
      row.appendChild(art);
    });
  }

  function renderGrid(list, u) {
    libraryList = list;
    var grid = document.getElementById("og-lib-grid");
    if (!grid) return;
    grid.innerHTML = "";

    renderUrgentRow(list, u);

    if (!list.length) {
      applyGridFilter();
      return;
    }

    for (var i = 0; i < list.length; i++) {
      var rec = list[i];
      var status = effectiveStatus(rec, u);
      var statusLine = status === "tamamlandı" ? "Tamamlandı" : "Bekliyor";

      var branch = classifyBranch(rec);
      var ui = BRANCH_UI[branch] || BRANCH_UI.uncat;
      var subjectId = resolveRecSubjectId(rec);
      var sinav = getRecSinav(rec);
      var subLabel = subjectId ? subjectDisplayName(subjectId) : ui.tag;

      var card = document.createElement("article");
      card.className = "og-lib-card";
      card.setAttribute("data-branch", branch);
      card.setAttribute("data-subject-id", subjectId);
      card.setAttribute("data-sinav", sinav);
      var hintIds = BRANCH_SUBJECT_HINTS[branch];
      if (hintIds && hintIds.length) card.setAttribute("data-match-subjects", hintIds.join(","));

      card.innerHTML =
        '<div class="og-lib-card__hero ' +
        esc(ui.hero) +
        '">' +
        '<span class="og-lib-card__tag">' +
        esc(ui.tag) +
        "</span>" +
        '<span class="og-lib-card__branch">' +
        esc(subLabel) +
        "</span></div>" +
        '<div class="og-lib-card__body">' +
        '<h3 class="og-lib-card__title">' +
        esc(rec.title || "Test") +
        "</h3>" +
        '<p class="og-lib-card__meta">' +
        (rec.questionCount ? esc(String(Number(rec.questionCount))) + " soru" : "Soru sayısı —") +
        " · " +
        esc(statusLine) +
        "</p>" +
        '<div class="og-lib-card__actions">' +
        '<button type="button" class="og-lib-pdf og-lib-btn-outline" data-fid="' +
        esc(rec.id) +
        '"><span aria-hidden="true">📄</span> PDF</button></div></div>';

      grid.appendChild(card);
    }

    grid.querySelectorAll(".og-lib-pdf").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var fid = btn.getAttribute("data-fid");
        var found = list.find(function (x) {
          return x && String(x.id) === String(fid);
        });
        onPdfClick(found);
      });
    });
    applyGridFilter();
  }

  function onPdfClick(rec) {
    if (!rec) return;
    var fid = String(rec.pdf_file_id || rec.pdfFileId || "").trim();
    if (
      fid &&
      window.DPAppwrite &&
      typeof window.DPAppwrite.isStorageConfigured === "function" &&
      window.DPAppwrite.isStorageConfigured()
    ) {
      try {
        var url = window.DPAppwrite.getFileDownloadUrl(fid);
        if (url) {
          window.open(url, "_blank", "noopener,noreferrer");
          return;
        }
      } catch (e) {
        console.warn(e);
      }
    }
    toast(
      "Bu test için bulut PDF tanımlı değil veya Appwrite yapılandırması eksik. Koçunuzdan PDF → Bulut yüklemesini isteyebilirsiniz. (" +
        (rec.title || "Test") +
        ")",
      false
    );
  }

  function refresh(u) {
    var list = mergeAssignedLists(fascicleStorageCandidates(u));
    renderGrid(list, u);
  }

  function init() {
    syncStudentCatalog();
    wireSourceSwitch();
    wireBookFilters();
    setSource("books");

    var u = getCurrentUser();
    var sub = document.getElementById("og-lib-sub");
    if (!u) {
      if (sub) {
        sub.textContent =
          "Oturum bulunamadı. Lütfen giriş yapın; giriş yaptıktan sonra kütüphaneniz burada görüntülenecektir.";
      }
      refreshBooks(null);
      return;
    }
    refreshBooks(u);
    ensureMufredatReady(function () {
      wireDigitalToolbar();
    });
    if (!window.DereceFascicleBridge) {
      toast("Dijital kütüphane köprüsü yüklenemedi. Kitaplar görüntülenebilir; sayfayı yenileyin.", true);
    } else {
      refresh(u);
    }

    window.addEventListener("derece:library-changed", function () {
      refreshBooks(getCurrentUser() || u);
    });
    window.addEventListener("storage", function (e) {
      if (!e || !e.key) return;
      if (e.key.indexOf("derecepanel.library") !== -1) {
        refreshBooks(getCurrentUser() || u);
      }
    });

    window.addEventListener("derece:fascicle-assigned", function () {
      refresh(getCurrentUser() || u);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
