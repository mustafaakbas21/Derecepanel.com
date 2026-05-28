/**
 * tarama-olusturucu.js — Soru havuzu üzerinden "tarama" oluşturma motoru.
 *
 * Sorumluluklar:
 *  1) Havuzdaki (localStorage: derece_soru_havuzu) her soruya benzersiz id garanti et
 *     (uuid / id). Eksikleri tamamlayıp havuzu tekrar yazar.
 *  2) Ders / Konu / Kavram dropdownlarını YksMufredatApi ile doldurur.
 *  3) "Manuel Filtrele" seçilen kriterlere uyan soruları listeler (seçimsiz).
 *  4) "Yapay Zeka ile Getir" istenen sayıda, mükerrer olmayan rastgele seçim yapar
 *     ve seçili işaretler.
 *  5) Seçili sorular sticky footer sayacına yansır.
 *  6) "Test Tasarımına Git" seçili soruları `transfer_tarama_sorulari` anahtarıyla
 *     localStorage'a koyar ve test-olusturucu.html'e yönlenir.
 */
(function () {
  "use strict";

  var STORAGE_KEY_POOL = "derece_soru_havuzu";
  var STORAGE_KEY_TRANSFER = "transfer_tarama_sorulari";

  // ——— DOM refs ———
  var elDers = document.getElementById("tr-sel-ders");
  var elKonu = document.getElementById("tr-sel-konu");
  var elKavram = document.getElementById("tr-sel-kavram");
  var elCount = document.getElementById("tr-inp-count");
  var elBtnAi = document.getElementById("tr-btn-ai");
  var elBtnFilter = document.getElementById("tr-btn-filter");
  var elBtnClear = document.getElementById("tr-btn-clear");
  var elBtnSelectAll = document.getElementById("tr-btn-select-all");
  var elBtnGo = document.getElementById("tr-btn-go");
  var elGrid = document.getElementById("tr-grid");
  var elEmpty = document.getElementById("tr-empty");
  var elViewMeta = document.getElementById("tr-view-meta");
  var elSelectedCount = document.getElementById("tr-selected-count");
  var elPoolCount = document.getElementById("tr-pool-count");
  var elAiInfo = document.getElementById("tr-ai-info");

  if (!elGrid || !elDers) return;

  // ——— Durum ———
  /** Tüm havuz (idempotent) */
  var pool = [];
  /** Şu an vitrinde görünen sorular */
  var viewList = [];
  /** Seçili soru id'leri (Set gibi) — key: question id */
  var selectedIds = Object.create(null);

  // ——— Yardımcılar ———
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

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  // ——— Havuz yükleme + ID garantisi ———
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
        q.uuid = nid; // soru havuzu sayfası uuid anahtarı kullanıyor; uyumlu tutalım
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

  // ——— Dropdown'lar ———
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
    elKavram.innerHTML = '<option value="">— Hepsi —</option>';
    elKonu.disabled = !subId;
    elKavram.disabled = true;
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

  function populateKavram(subId, topicId) {
    elKavram.innerHTML = '<option value="">— Hepsi —</option>';
    elKavram.disabled = true;
    if (!subId || !topicId || !window.YksMufredatApi) return;
    var concepts = window.YksMufredatApi.getConcepts(subId, topicId) || [];
    concepts.forEach(function (c) {
      var opt = document.createElement("option");
      opt.value = c.id;
      opt.setAttribute("data-name", c.name);
      opt.textContent = c.name;
      elKavram.appendChild(opt);
    });
    elKavram.disabled = concepts.length === 0;
  }

  function getOptName(sel) {
    if (!sel) return "";
    var opt = sel.options[sel.selectedIndex];
    return opt && opt.value ? opt.getAttribute("data-name") || opt.textContent : "";
  }

  // ——— Filtreleme ———
  function filterPool() {
    var ders = getOptName(elDers);
    var konu = getOptName(elKonu);
    var kavram = getOptName(elKavram);
    return pool.filter(function (q) {
      if (ders && q.ders !== ders) return false;
      if (konu && q.konu !== konu) return false;
      if (kavram && q.kavram !== kavram) return false;
      if (!questionImageUrl(q)) return false;
      return true;
    });
  }

  // ——— AI Seçim motoru ———
  function autoSelectQuestions(count) {
    var pool0 = filterPool();
    if (pool0.length === 0) return [];

    // Benzersiz id garanti; aynı id iki kere gelmesin diye Set kullan
    var seen = Object.create(null);
    var shuffled = shuffle(pool0);
    var picked = [];
    for (var i = 0; i < shuffled.length && picked.length < count; i++) {
      var q = shuffled[i];
      var id = questionId(q);
      if (!id) continue;
      if (seen[id]) continue;
      seen[id] = true;
      picked.push(q);
    }
    return picked;
  }

  // ——— Render ———
  function renderGrid(list, allSelected) {
    viewList = list.slice();
    elGrid.innerHTML = "";
    if (!list.length) {
      elGrid.classList.add("hidden");
      elGrid.classList.remove("grid");
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
      if (allSelected) selectedIds[id] = true;
      var isSel = !!selectedIds[id];

      var card = document.createElement("div");
      card.className = "tr-card" + (isSel ? " is-selected" : "");
      card.setAttribute("data-id", id);

      var tagParts = [];
      if (q.ders) tagParts.push(q.ders);
      if (q.konu) tagParts.push(q.konu);
      var tagText = tagParts.join(" › ") || "Etiketsiz";

      var answerBadge = q.answer && /^[A-E]$/i.test(q.answer)
        ? '<span class="absolute bottom-2 left-2 inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-emerald-500 px-1.5 text-[11px] font-bold text-white shadow">' + esc(String(q.answer).toUpperCase()) + "</span>"
        : "";

      card.innerHTML =
        '<span class="tr-card__tag" title="' + esc(tagText) + '">' + esc(tagText) + "</span>" +
        '<button type="button" class="tr-card__check" data-role="toggle" aria-label="Seç">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12l5 5L20 7" /></svg>' +
        "</button>" +
        '<img class="tr-card__img" src="' + esc(questionImageUrl(q)) + '" alt="Soru" loading="lazy" />' +
        answerBadge;
      frag.appendChild(card);
    });
    elGrid.appendChild(frag);

    var shown = list.length;
    var selCount = countSelectedInView();
    elViewMeta.textContent = shown + " soru · " + selCount + " seçili";
    updateSelectionUi();
  }

  function countSelectedInView() {
    var n = 0;
    for (var i = 0; i < viewList.length; i++) {
      if (selectedIds[questionId(viewList[i])]) n++;
    }
    return n;
  }

  function updateSelectionUi() {
    var total = 0;
    for (var k in selectedIds) if (selectedIds[k]) total++;
    elSelectedCount.textContent = String(total);
    elBtnGo.disabled = total === 0;
    var inView = countSelectedInView();
    if (elViewMeta && viewList.length)
      elViewMeta.textContent = viewList.length + " soru · " + inView + " seçili";
  }

  // ——— Etkileşim ———
  elGrid.addEventListener("click", function (e) {
    var card = e.target.closest && e.target.closest(".tr-card");
    if (!card) return;
    var id = card.getAttribute("data-id");
    if (!id) return;
    selectedIds[id] = !selectedIds[id];
    card.classList.toggle("is-selected", !!selectedIds[id]);
    updateSelectionUi();
  });

  if (elDers)
    elDers.addEventListener("change", function () {
      populateKonu(elDers.value);
    });
  if (elKonu)
    elKonu.addEventListener("change", function () {
      populateKavram(elDers.value, elKonu.value);
    });

  if (elBtnFilter)
    elBtnFilter.addEventListener("click", function () {
      var list = filterPool();
      renderGrid(list, false);
      if (elAiInfo) elAiInfo.classList.add("hidden");
    });

  if (elBtnAi)
    elBtnAi.addEventListener("click", function () {
      var n = parseInt(elCount.value, 10);
      if (!n || n < 1) {
        window.alert("Lütfen 1 veya daha büyük bir soru sayısı girin.");
        return;
      }
      var picked = autoSelectQuestions(n);
      if (picked.length === 0) {
        window.alert("Bu kriterlere uyan soru bulunamadı. Filtreyi gevşetip tekrar deneyin.");
        renderGrid([], false);
        return;
      }
      if (picked.length < n) {
        // Uyarı: istenen kadar bulunamadı
        if (elAiInfo) {
          elAiInfo.classList.remove("hidden");
          elAiInfo.innerHTML =
            "<strong class=\"font-bold\">Uyarı:</strong> İstediğiniz " +
            n +
            " sorudan yalnızca <b>" +
            picked.length +
            "</b> benzersiz soru bulunabildi.";
        }
      } else if (elAiInfo) {
        elAiInfo.classList.remove("hidden");
        elAiInfo.innerHTML =
          '<strong class="font-bold">AI Seçim Motoru:</strong> ' +
          picked.length +
          " mükerrer olmayan soru rastgele seçildi.";
      }
      renderGrid(picked, true);
    });

  if (elBtnClear)
    elBtnClear.addEventListener("click", function () {
      selectedIds = Object.create(null);
      // UI'daki kartları da temizle
      var cards = elGrid.querySelectorAll(".tr-card.is-selected");
      for (var i = 0; i < cards.length; i++) cards[i].classList.remove("is-selected");
      updateSelectionUi();
    });

  if (elBtnSelectAll)
    elBtnSelectAll.addEventListener("click", function () {
      if (!viewList.length) return;
      var allOn = countSelectedInView() === viewList.length;
      viewList.forEach(function (q) {
        selectedIds[questionId(q)] = !allOn;
      });
      var cards = elGrid.querySelectorAll(".tr-card");
      for (var i = 0; i < cards.length; i++) {
        var id = cards[i].getAttribute("data-id");
        cards[i].classList.toggle("is-selected", !!selectedIds[id]);
      }
      updateSelectionUi();
    });

  if (elBtnGo)
    elBtnGo.addEventListener("click", function () {
      // Seçili id'lere ait tam soru objelerini topla
      var idx = {};
      for (var i = 0; i < pool.length; i++) {
        var id = questionId(pool[i]);
        if (id) idx[id] = pool[i];
      }
      var selected = [];
      for (var key in selectedIds) {
        if (!selectedIds[key]) continue;
        var q = idx[key];
        if (q) selected.push(q);
      }
      if (!selected.length) return;
      try {
        localStorage.setItem(STORAGE_KEY_TRANSFER, JSON.stringify(selected));
        localStorage.setItem("aktarilanDers", elDers ? elDers.value || "" : "");
        localStorage.setItem("aktarilanKonu", elKonu ? elKonu.value || "" : "");
        localStorage.setItem("aktarilanDersText", getOptName(elDers));
        localStorage.setItem("aktarilanKonuText", getOptName(elKonu));
      } catch (err) {
        window.alert(
          "Aktarım başarısız — depolama dolu olabilir. Daha az soruyla tekrar deneyin."
        );
        return;
      }
      window.location.href = "test-olusturucu.html";
    });

  // ——— Init ———
  function boot() {
    loadAndEnsureIds();
    populateDers();
  }

  // YksMufredat modül olarak yükleniyor, subjects hazır olana kadar bekle
  function waitForMufredat(retries) {
    if (window.YksMufredat && window.YksMufredat.subjects && window.YksMufredat.subjects.length) {
      boot();
      return;
    }
    if (retries <= 0) {
      // Yine de havuzu yükle ve dropdownlar boş kalsın
      loadAndEnsureIds();
      return;
    }
    setTimeout(function () {
      waitForMufredat(retries - 1);
    }, 120);
  }

  document.addEventListener("DOMContentLoaded", function () {
    waitForMufredat(60);
  });
})();
