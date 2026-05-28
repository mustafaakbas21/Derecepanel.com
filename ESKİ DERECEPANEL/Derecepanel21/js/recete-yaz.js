/**
 * recete-yaz.js — Hatalı soru havuzundan (derece_hatali_soru_havuzu — hatali-soru-havuzu.html) filtre +
 * soru kartları; seçimler → aktarilanReceteSorulari + receteOgrenciAdi → test-olusturucu.
 */
(function () {
  "use strict";

  /** Ana veri kaynağı — hatali-soru-havuzu.html ile aynı anahtar */
  var STORAGE_KEY_POOL = "derece_hatali_soru_havuzu";
  var STORAGE_AKTARILAN = "aktarilanReceteSorulari";
  var STORAGE_OGRENCI = "receteOgrenciAdi";

  var elOgrenci = document.getElementById("rz-inp-ogrenci");
  var elComboRoot = document.getElementById("rz-ogrenci-combo");
  var elPopover = document.getElementById("rz-ogrenci-popover");
  var elListbox = document.getElementById("rz-ogrenci-listbox");
  var elToggle = document.getElementById("rz-ogrenci-toggle");
  var elChevron = elToggle ? elToggle.querySelector("svg") : null;
  var elDers = document.getElementById("rz-sel-ders");
  var elKonu = document.getElementById("rz-sel-konu");
  var elKaynak = document.getElementById("rz-sel-kaynak");
  var elHkFilter = document.getElementById("rz-hk-filter");
  var elBtnGet = document.getElementById("rz-btn-get");
  var elBtnClear = document.getElementById("rz-btn-clear");
  var elBtnSelectAll = document.getElementById("rz-btn-select-all");
  var elBtnGo = document.getElementById("rz-btn-go");
  var elGrid = document.getElementById("rz-grid");
  var elEmpty = document.getElementById("rz-empty");
  var elViewMeta = document.getElementById("rz-view-meta");
  var elSelectedCount = document.getElementById("rz-selected-count");
  var elPoolCount = document.getElementById("rz-pool-count");
  var elToast = document.getElementById("rz-toast");
  var elToastText = document.getElementById("rz-toast-text");

  if (!elGrid || !elDers) return;

  var pool = [];
  var viewList = [];
  var selectedIds = Object.create(null);
  var secilenReceteSorulari = [];
  var hkSelected = { deneme: true, soru_bankasi: true };

  /** Listeden seçilen öğrenci — havuz eşlemesi bu canonical değer ile (hatali-soru-havuzu ile aynı) */
  var rzSelectedCanonical = "";
  var lastRzStudentLabel = "";
  var rzStudentRows = [];

  var SEL_CLASSES = ["ring-2", "ring-indigo-500", "bg-indigo-50", "dark:bg-indigo-950/30", "dark:ring-indigo-400", "rz-sh-card--selected"];

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function genId() {
    try {
      if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
      }
    } catch (e) {}
    return Date.now().toString(36) + "-" + Math.random().toString(36).substr(2, 10);
  }

  function questionId(q) {
    if (!q) return "";
    return q.id || q.uuid || "";
  }

  function questionImageUrl(q) {
    if (!q) return "";
    return q.dataUrl || q.dataURL || q.image || "";
  }

  function rzToast(msg, isError) {
    if (!msg) return;
    if (elToast && elToastText) {
      elToastText.textContent = msg;
      elToast.classList.toggle("is-error", !!isError);
      elToast.classList.add("is-show");
      clearTimeout(rzToast._t);
      rzToast._t = setTimeout(function () {
        elToast.classList.remove("is-show");
      }, 2800);
    } else {
      window.alert(msg);
    }
  }

  function loadAndEnsureIds() {
    var raw;
    try {
      raw = JSON.parse(localStorage.getItem(STORAGE_KEY_POOL) || "[]");
    } catch (e) {
      raw = [];
    }
    if (!Array.isArray(raw)) raw = [];

    var mutated = false;
    for (var i = 0; i < raw.length; i++) {
      var q = raw[i];
      if (!q || typeof q !== "object") continue;
      if (!q.id && !q.uuid) {
        var nid = genId();
        q.id = nid;
        q.uuid = nid;
        mutated = true;
      } else if (!q.id && q.uuid) {
        q.id = q.uuid;
        mutated = true;
      } else if (q.id && !q.uuid) {
        q.uuid = q.id;
        mutated = true;
      }
    }
    if (mutated) {
      try {
        localStorage.setItem(STORAGE_KEY_POOL, JSON.stringify(raw));
      } catch (err) {
        console.warn("Havuz güncellenemedi:", err);
      }
    }
    pool = raw;
    if (elPoolCount) elPoolCount.textContent = String(pool.length);
  }

  function syncSecilenRecete() {
    secilenReceteSorulari.length = 0;
    for (var i = 0; i < pool.length; i++) {
      var q = pool[i];
      var id = questionId(q);
      if (id && selectedIds[id]) secilenReceteSorulari.push(q);
    }
  }

  function populateDers() {
    while (elDers.options.length > 1) elDers.remove(1);
    if (!window.YksMufredat) return;
    var subs = window.YksMufredat.subjects || [];
    subs.forEach(function (s) {
      var opt = document.createElement("option");
      opt.value = s.id;
      opt.setAttribute("data-name", s.name);
      opt.textContent = s.name + (s.sinav ? " (" + s.sinav + ")" : "");
      elDers.appendChild(opt);
    });
  }

  function populateKonu(subId) {
    elKonu.innerHTML = '<option value="">— Hepsi —</option>';
    elKonu.disabled = !subId;
    if (!subId || !window.YksMufredatApi) return;
    var topics = window.YksMufredatApi.getTopics(subId) || [];
    topics.forEach(function (t) {
      var opt = document.createElement("option");
      opt.value = t.id;
      opt.setAttribute("data-name", t.name);
      opt.textContent = t.name;
      elKonu.appendChild(opt);
    });
    elKonu.disabled = topics.length === 0;
  }

  function getOptName(sel) {
    if (!sel) return "";
    var opt = sel.options[sel.selectedIndex];
    return opt && opt.value ? opt.getAttribute("data-name") || opt.textContent : "";
  }

  function filterPool() {
    var ders = getOptName(elDers);
    var konu = getOptName(elKonu);
    var ogrenciFilter = ogrenciAdiTrim();
    var hkDeneme = !!hkSelected.deneme;
    var hkSb = !!hkSelected.soru_bankasi;
    var shouldFilterHk = (hkDeneme || hkSb) && !(hkDeneme && hkSb);
    return pool.filter(function (q) {
      if (ogrenciFilter && normOgrenci(q) !== ogrenciFilter) return false;
      if (ders && q.ders !== ders) return false;
      if (konu && q.konu !== konu) return false;
      if (!questionImageUrl(q)) return false;
      if (shouldFilterHk) {
        var hk = String((q && q.hataKaynagi) || "").toLowerCase().trim();
        if (hkDeneme && hk !== "deneme") return false;
        if (hkSb && hk !== "soru_bankasi") return false;
      }
      return true;
    });
  }

  function loadRzStudentRows() {
    rzStudentRows.length = 0;
    if (typeof window.syncDereceStudentCatalog === "function") {
      try {
        window.syncDereceStudentCatalog();
      } catch (e) {}
    }
    var list =
      typeof window.getDereceStudentsWithUniqueCode === "function"
        ? window.getDereceStudentsWithUniqueCode()
        : window.DereceStudentCatalog;
    if (!Array.isArray(list) || !list.length) return;

    for (var j = 0; j < list.length; j++) {
      var st = list[j];
      if (!st) continue;
      var name = String(st.name || "").trim();
      if (!name) continue;
      var code = String(st.code || "").trim();
      if (!code) continue;
      var canonical = name + " (" + code + ")";
      var label = canonical;
      var needle = (name + " " + code + " " + String(st.id || "") + " " + canonical).toLowerCase();
      rzStudentRows.push({ canonical: canonical, label: label, needle: needle });
    }
    rzStudentRows.sort(function (a, b) {
      return a.label.localeCompare(b.label, "tr");
    });
  }

  function openStudentCombo() {
    if (!elPopover || !elOgrenci) return;
    elPopover.classList.remove("hidden");
    elOgrenci.setAttribute("aria-expanded", "true");
    if (elChevron) elChevron.classList.add("rotate-180");
  }

  function closeStudentCombo() {
    if (!elPopover || !elOgrenci) return;
    elPopover.classList.add("hidden");
    elOgrenci.setAttribute("aria-expanded", "false");
    if (elChevron) elChevron.classList.remove("rotate-180");

    if (!rzSelectedCanonical) {
      elOgrenci.value = "";
      lastRzStudentLabel = "";
    } else {
      elOgrenci.value = lastRzStudentLabel;
    }
    updateGoButton();
  }

  function renderStudentOptions(filterText) {
    if (!elListbox) return;
    var q = String(filterText || "")
      .toLowerCase()
      .trim();

    var matched = !q
      ? rzStudentRows.slice()
      : rzStudentRows.filter(function (row) {
          return row.needle.indexOf(q) !== -1;
        });

    elListbox.innerHTML = "";
    if (!matched.length) {
      var empty = document.createElement("li");
      empty.className = "rz-ogrenci-empty";
      empty.setAttribute("role", "presentation");
      empty.textContent = rzStudentRows.length ? "Eşleşen öğrenci yok." : "Öğrenci yok — Öğrencilerim üzerinden ekleyin.";
      elListbox.appendChild(empty);
      return;
    }

    for (var i = 0; i < matched.length; i++) {
      var row = matched[i];
      var li = document.createElement("li");
      li.className = "rz-ogrenci-opt";
      li.setAttribute("role", "option");
      li.setAttribute("tabindex", "-1");
      li.setAttribute("data-canonical", row.canonical);
      li.setAttribute("data-label", row.label);
      li.textContent = row.label;
      elListbox.appendChild(li);
    }
  }

  function pickStudent(canonical, label) {
    rzSelectedCanonical = String(canonical || "").trim();
    lastRzStudentLabel = String(label || "").trim();
    if (elOgrenci) elOgrenci.value = lastRzStudentLabel;
    closeStudentCombo();
  }

  /** Görüşme Odası → sessionStorage aktarilanOgrenci (tek seferlik) */
  function applyGorusmeHandoff() {
    try {
      var raw = sessionStorage.getItem("aktarilanOgrenci");
      if (!raw) return;
      var o = JSON.parse(raw);
      sessionStorage.removeItem("aktarilanOgrenci");
      var canon = String(o.receteCanonical || "").trim();
      var lbl = String(o.receteLabel || o.name || "").trim();
      if (canon && lbl) pickStudent(canon, lbl);
    } catch (e) {}
  }

  function ogrenciAdiTrim() {
    return String(rzSelectedCanonical || "").trim();
  }

  /** hatali-soru-havuzu.js ile aynı isim kaynağı (ogrenciAdi / ogrenci) */
  function normOgrenci(q) {
    if (!q || typeof q !== "object") return "";
    return String(q.ogrenciAdi || q.ogrenci || "").trim();
  }

  function getKaynakLabel() {
    if (!elKaynak) return "";
    var opt = elKaynak.options[elKaynak.selectedIndex];
    return opt ? opt.textContent : "";
  }

  function updateGoButton() {
    if (!elBtnGo) return;
    elBtnGo.disabled = ogrenciAdiTrim() === "";
  }

  function wireStudentCombo() {
    if (!elComboRoot || !elOgrenci) return;

    if (elListbox) {
      elListbox.addEventListener("mousedown", function (e) {
        e.preventDefault();
      });
      elListbox.addEventListener("click", function (e) {
        var li = e.target.closest(".rz-ogrenci-opt");
        if (!li || !elListbox.contains(li)) return;
        pickStudent(li.getAttribute("data-canonical"), li.getAttribute("data-label"));
      });
    }

    elComboRoot.addEventListener("click", function (e) {
      e.stopPropagation();
    });

    elOgrenci.addEventListener("focus", function () {
      openStudentCombo();
      renderStudentOptions(elOgrenci.value || "");
    });
    elOgrenci.addEventListener("input", function () {
      var v = String(elOgrenci.value || "");
      if (rzSelectedCanonical && v !== lastRzStudentLabel) {
        rzSelectedCanonical = "";
      }
      openStudentCombo();
      renderStudentOptions(v);
      updateGoButton();
    });
    elOgrenci.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeStudentCombo();
        elOgrenci.blur();
      }
    });
    elOgrenci.addEventListener("blur", function () {
      setTimeout(function () {
        if (elComboRoot && !elComboRoot.contains(document.activeElement)) {
          closeStudentCombo();
        }
      }, 180);
    });

    if (elToggle) {
      elToggle.addEventListener("click", function (e) {
        e.stopPropagation();
        if (!elPopover) return;
        if (elPopover.classList.contains("hidden")) {
          elOgrenci.focus();
          openStudentCombo();
          renderStudentOptions(elOgrenci.value || "");
        } else {
          closeStudentCombo();
        }
      });
    }

    document.addEventListener("click", function () {
      if (elPopover && !elPopover.classList.contains("hidden")) {
        closeStudentCombo();
      }
    });
  }

  function applyHkButtonState(btn, on) {
    if (!btn) return;
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.classList.toggle("border-emerald-200", !!on);
    btn.classList.toggle("bg-emerald-50", !!on);
    btn.classList.toggle("text-emerald-700", !!on);
    btn.classList.toggle("border-slate-200", !on);
    btn.classList.toggle("bg-[color:var(--surface)]", !on);
    btn.classList.toggle("text-slate-600", !on);
    var tickWrap = btn.querySelector("span");
    if (tickWrap) {
      tickWrap.classList.toggle("bg-emerald-600", !!on);
      tickWrap.classList.toggle("bg-slate-300", !on);
    }
  }

  function initHkFilter() {
    if (!elHkFilter) return;
    var btns = Array.prototype.slice.call(elHkFilter.querySelectorAll(".rz-hk-btn"));
    if (!btns.length) return;

    btns.forEach(function (btn) {
      var hk = btn.getAttribute("data-hk");
      var on = hk === "deneme" ? !!hkSelected.deneme : hk === "soru_bankasi" ? !!hkSelected.soru_bankasi : true;
      applyHkButtonState(btn, on);
      btn.addEventListener("click", function () {
        var key = btn.getAttribute("data-hk");
        if (key !== "deneme" && key !== "soru_bankasi") return;
        hkSelected[key] = !hkSelected[key];
        applyHkButtonState(btn, !!hkSelected[key]);
      });
    });
  }

  function toggleCardVisual(card, on) {
    if (!card) return;
    for (var i = 0; i < SEL_CLASSES.length; i++) {
      card.classList.toggle(SEL_CLASSES[i], !!on);
    }
  }

  /**
   * soru-havuzu.html kart şablonu — silme yok, sağ üst checkbox + «Seç».
   */
  function buildRecipeCardMarkup(q, isSel, qid) {
    var tagParts = [];
    if (q.ders) tagParts.push(q.ders);
    if (q.konu) tagParts.push(q.konu);
    if (q.kavram) tagParts.push(q.kavram);
    var tagHtml = tagParts.length
      ? '<span class="truncate text-[10px] font-semibold text-indigo-600 max-w-[200px]" title="' +
        esc(tagParts.join(" › ")) +
        '">' +
        esc(tagParts.join(" › ")) +
        "</span>"
      : '<span class="text-[10px] text-slate-300 italic">Etiket yok</span>';

    var metaBadges = "";
    if (q.page)
      metaBadges +=
        '<span class="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500 dark:bg-slate-800">S.' +
        esc(String(q.page)) +
        "</span>";
    if (q.qNumber)
      metaBadges +=
        '<span class="rounded bg-indigo-100 px-1.5 py-0.5 text-[9px] font-bold text-indigo-600 dark:bg-indigo-900/60 dark:text-indigo-200">' +
        esc(String(q.qNumber)) +
        ".</span>";

    var ansBtns = ["A", "B", "C", "D", "E"]
      .map(function (ch) {
        var active = q.answer === ch ? " active" : "";
        return '<span class="sh-ans-btn' + active + ' pointer-events-none select-none">' + ch + "</span>";
      })
      .join("");

    var imgUrlRaw = questionImageUrl(q);
    var imgBlk = imgUrlRaw
      ? '<img src="' +
        esc(imgUrlRaw) +
        '" alt="Soru" class="max-h-64 w-full object-contain" loading="lazy" />'
      : '<div class="flex min-h-[120px] w-full items-center justify-center text-xs text-slate-400">Görsel yok</div>';

    var savedDate = "";
    if (q.savedAt) {
      try {
        savedDate = new Date(q.savedAt).toLocaleDateString("tr-TR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      } catch (e) {}
    }

    return (
      '<div class="flex items-start justify-between gap-2">' +
        '<div class="flex min-w-0 flex-col gap-1">' +
        '<div class="flex flex-wrap items-center gap-1">' +
        metaBadges +
        "</div>" +
        tagHtml +
        "</div>" +
        '<label class="flex h-8 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-lg border border-slate-200 bg-[color:var(--surface)] px-2 text-[10px] font-bold text-indigo-600 shadow-sm transition hover:border-indigo-400 hover:bg-indigo-50 dark:border-slate-600">' +
        '<input type="checkbox" class="rz-card-check h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"' +
        (isSel ? " checked" : "") +
        ' data-id="' +
        esc(qid) +
        '" aria-label="Reçeteye seç" />' +
        '<span class="hidden sm:inline">Seç</span>' +
        "</label>" +
        "</div>" +
        '<div class="flex items-center justify-center overflow-hidden rounded-lg bg-slate-50 p-1 dark:bg-slate-900/40">' +
        imgBlk +
        "</div>" +
        '<div class="border-t border-[color:var(--header-border)] pt-3">' +
        '<div class="mb-1.5 flex items-center justify-between">' +
        '<span class="text-[10px] font-semibold text-slate-400">Doğru Cevap</span>' +
        (savedDate ? '<span class="text-[9px] text-slate-400">' + esc(savedDate) + "</span>" : "") +
        "</div>" +
        '<div class="flex flex-wrap items-center gap-1.5">' +
        ansBtns +
        "</div>" +
        "</div>"
    );
  }

  function countSelectedInView() {
    var n = 0;
    for (var i = 0; i < viewList.length; i++) {
      if (selectedIds[questionId(viewList[i])]) n++;
    }
    return n;
  }

  function updateSelectionUi() {
    syncSecilenRecete();
    elSelectedCount.textContent = String(secilenReceteSorulari.length);
    updateGoButton();
    var inView = countSelectedInView();
    if (elViewMeta && viewList.length)
      elViewMeta.textContent = viewList.length + " soru · " + inView + " vitrinde işaretli";
  }

  function renderGrid(list) {
    viewList = list.slice();
    elGrid.innerHTML = "";
    if (!list.length) {
      elGrid.classList.add("hidden");
      elEmpty.classList.remove("hidden");
      elViewMeta.textContent = "Sonuç bulunamadı";
      if (elBtnSelectAll) elBtnSelectAll.classList.add("hidden");
      updateSelectionUi();
      return;
    }
    elEmpty.classList.add("hidden");
    elGrid.classList.remove("hidden");
    elGrid.classList.add("grid");
    if (elBtnSelectAll) {
      elBtnSelectAll.classList.remove("hidden");
      elBtnSelectAll.classList.add("inline-flex");
    }

    var frag = document.createDocumentFragment();
    list.forEach(function (q) {
      var id = questionId(q);
      if (!id) return;
      var isSel = !!selectedIds[id];
      var card = document.createElement("div");
      card.className =
        "sh-card rz-sh-card flex flex-col gap-3 rounded-xl border p-4 transition-all" +
        (isSel ? " ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 dark:ring-indigo-400 rz-sh-card--selected" : "");
      card.setAttribute("data-id", id);
      card.innerHTML = buildRecipeCardMarkup(q, isSel, id);
      frag.appendChild(card);
    });
    elGrid.appendChild(frag);

    var shown = list.length;
    elViewMeta.textContent =
      shown + " soru · " + countSelectedInView() + " vitrinde işaretli · Toplam seçili: " + secilenReceteSorulari.length;

    syncSecilenRecete();
    elSelectedCount.textContent = String(secilenReceteSorulari.length);
    updateGoButton();
  }

  elGrid.addEventListener("change", function (e) {
    var inp = e.target;
    if (!inp || !inp.classList.contains("rz-card-check")) return;
    var qid = inp.getAttribute("data-id");
    if (!qid) return;
    var card = inp.closest(".rz-sh-card");
    if (inp.checked) selectedIds[qid] = true;
    else delete selectedIds[qid];
    toggleCardVisual(card, inp.checked);
    syncSecilenRecete();
    elSelectedCount.textContent = String(secilenReceteSorulari.length);
    var inView = countSelectedInView();
    if (elViewMeta && viewList.length)
      elViewMeta.textContent =
        viewList.length + " soru · " + inView + " vitrinde işaretli · Toplam seçili: " + secilenReceteSorulari.length;
  });

  if (elDers)
    elDers.addEventListener("change", function () {
      populateKonu(elDers.value);
    });

  if (elBtnGet)
    elBtnGet.addEventListener("click", function () {
      if (!ogrenciAdiTrim()) {
        rzToast("Listeden bir öğrenci seçin (arama kutusuna tıklayıp isimle arayın, satıra tıklayın).", true);
        elOgrenci && elOgrenci.focus();
        return;
      }
      var list = filterPool();
      renderGrid(list);
      if (!list.length) rzToast("Bu kriterlere uyan soru bulunamadı.", true);
    });

  if (elBtnClear)
    elBtnClear.addEventListener("click", function () {
      selectedIds = Object.create(null);
      secilenReceteSorulari.length = 0;
      var checks = elGrid.querySelectorAll(".rz-card-check");
      for (var i = 0; i < checks.length; i++) {
        checks[i].checked = false;
        toggleCardVisual(checks[i].closest(".rz-sh-card"), false);
      }
      syncSecilenRecete();
      elSelectedCount.textContent = "0";
      updateGoButton();
      if (elViewMeta && viewList.length)
        elViewMeta.textContent = viewList.length + " soru · 0 vitrinde işaretli · Toplam seçili: 0";
    });

  if (elBtnSelectAll)
    elBtnSelectAll.addEventListener("click", function () {
      if (!viewList.length) return;
      var allOn = countSelectedInView() === viewList.length;
      viewList.forEach(function (q) {
        selectedIds[questionId(q)] = !allOn;
      });
      var cards = elGrid.querySelectorAll(".rz-sh-card");
      for (var i = 0; i < cards.length; i++) {
        var id = cards[i].getAttribute("data-id");
        var on = !!(id && selectedIds[id]);
        var cb = cards[i].querySelector(".rz-card-check");
        if (cb) cb.checked = on;
        toggleCardVisual(cards[i], on);
      }
      syncSecilenRecete();
      elSelectedCount.textContent = String(secilenReceteSorulari.length);
      if (elViewMeta && viewList.length)
        elViewMeta.textContent =
          viewList.length + " soru · " + countSelectedInView() + " vitrinde işaretli · Toplam seçili: " + secilenReceteSorulari.length;
    });

  if (elBtnGo)
    elBtnGo.addEventListener("click", function () {
      var ad = ogrenciAdiTrim();
      if (!ad) {
        rzToast("Listeden bir öğrenci seçin.", true);
        elOgrenci && elOgrenci.focus();
        return;
      }
      syncSecilenRecete();
      if (!secilenReceteSorulari.length) {
        rzToast("Lütfen en az bir soru seçin", true);
        return;
      }

      try {
        localStorage.setItem(STORAGE_AKTARILAN, JSON.stringify(secilenReceteSorulari));
        localStorage.setItem(STORAGE_OGRENCI, ad);
      } catch (err) {
        rzToast("Kayıt yapılamadı — tarayıcı depolaması dolu olabilir.", true);
        return;
      }
      window.location.href = "test-olusturucu.html";
    });

  function boot() {
    loadAndEnsureIds();
    populateDers();
    updateGoButton();
  }

  function waitForMufredat(retries) {
    if (window.YksMufredat && window.YksMufredat.subjects && window.YksMufredat.subjects.length) {
      boot();
      return;
    }
    if (retries <= 0) {
      loadAndEnsureIds();
      populateDers();
      updateGoButton();
      return;
    }
    setTimeout(function () {
      waitForMufredat(retries - 1);
    }, 120);
  }

  document.addEventListener("DOMContentLoaded", function () {
    loadRzStudentRows();
    wireStudentCombo();
    applyGorusmeHandoff();
    initHkFilter();
    loadAndEnsureIds();
    waitForMufredat(60);
  });
})();
