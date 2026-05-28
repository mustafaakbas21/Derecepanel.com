/**
 * Hatalı Soru Havuzu — arşiv anahtarı derece_hatali_soru_havuzu
 * Öğretmen öğrenci / hata tipi / müfredat filtreleri; soru kartı soru-havuzu ile aynı.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "derece_hatali_soru_havuzu";

  var elSelOgrenci = document.getElementById("hh-sel-ogrenci");
  var elSelDers = document.getElementById("sh-sel-ders");
  var elSelKonu = document.getElementById("sh-sel-konu");
  var elSelKavram = document.getElementById("sh-sel-kavram");
  var elSelHataTipi = document.getElementById("hh-sel-hata-tip");
  var elHkFilter = document.getElementById("hh-hk-filter");
  var elBtnFilter = document.getElementById("sh-btn-filter");
  var elBtnAll = document.getElementById("sh-btn-all");
  var elBtnClearAll = document.getElementById("sh-btn-clear-all");
  var elGrid = document.getElementById("sh-grid");
  var elEmpty = document.getElementById("sh-empty");
  var elShownCount = document.getElementById("sh-shown-count");
  var elTotalCount = document.getElementById("sh-total-count");
  var elCountLabel = document.getElementById("sh-count-label");
  var elDesc = document.getElementById("hh-arsiv-desc");
  var elToast = document.getElementById("sh-toast");

  var DESC_TEXT =
    "Öğrencilerin deneme ve taramalarda yanlış yaptığı veya boş bıraktığı tüm soruların arşivi.";

  var allQuestions = [];
  var hkSelected = { deneme: true, soru_bankasi: true };

  function loadPool() {
    try {
      allQuestions = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch (e) {
      allQuestions = [];
    }
    if (!Array.isArray(allQuestions)) allQuestions = [];
  }

  function savePool() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allQuestions));
    } catch (e) {
      showToast("Kayıt başarısız — depolama dolu olabilir");
    }
  }

  var toastTimer;
  function showToast(msg) {
    elToast.textContent = msg;
    elToast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      elToast.classList.remove("show");
    }, 3000);
  }

  function esc(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normOgrenci(q) {
    return String(q.ogrenciAdi || q.ogrenci || "").trim();
  }

  function hataTipStored(q) {
    var v = String(q.hataTipi || q.hata_tipi || "yanlis")
      .toLowerCase()
      .trim();
    if (v === "bos" || v === "bırakilmis" || v === "bos_birakilmis") return "bos";
    return "yanlis";
  }

  /** Öğrenci select: katalogdan + Tüm Öğrenciler */
  function populateOgrenciSelect() {
    if (!elSelOgrenci) return;
    while (elSelOgrenci.options.length > 1) elSelOgrenci.remove(1);
    if (typeof window.syncDereceStudentCatalog === "function") {
      try {
        window.syncDereceStudentCatalog();
      } catch (e) {}
    }
    var list = window.DereceStudentCatalog;
    if (!Array.isArray(list)) return;

    var nameCounts = {};
    for (var i = 0; i < list.length; i++) {
      var n = String((list[i] && list[i].name) || "").trim();
      if (n) nameCounts[n] = (nameCounts[n] || 0) + 1;
    }

    list.forEach(function (s) {
      if (!s) return;
      var name = String(s.name || "").trim();
      if (!name) return;
      var code = String(s.code || "").trim();
      var dup = (nameCounts[name] || 0) > 1;
      var val = dup && code ? name + " (" + code + ")" : name;
      if (dup && !code) val = name + " · " + String(s.id || "");

      var opt = document.createElement("option");
      opt.value = val;
      opt.textContent = code ? name + " (" + code + ")" : val;
      elSelOgrenci.appendChild(opt);
    });
  }

  function getOptName(sel) {
    var opt = sel.options[sel.selectedIndex];
    return opt && opt.value ? opt.getAttribute("data-name") || opt.textContent : "";
  }

  function getFiltered() {
    var dersName = getOptName(elSelDers);
    var konuName = getOptName(elSelKonu);
    var kavramName = getOptName(elSelKavram);
    var hataFil = elSelHataTipi ? elSelHataTipi.value : "";
    var ogVal = elSelOgrenci ? String(elSelOgrenci.value || "").trim() : "";
    var hkDeneme = !!hkSelected.deneme;
    var hkSb = !!hkSelected.soru_bankasi;
    var shouldFilterHk = (hkDeneme || hkSb) && !(hkDeneme && hkSb);

    return allQuestions.filter(function (q) {
      if (dersName && q.ders !== dersName) return false;
      if (konuName && q.konu !== konuName) return false;
      if (kavramName && q.kavram !== kavramName) return false;
      if (hataFil && hataTipStored(q) !== hataFil) return false;
      if (shouldFilterHk) {
        var hk = String((q && q.hataKaynagi) || "").toLowerCase().trim();
        if (hkDeneme && hk !== "deneme") return false;
        if (hkSb && hk !== "soru_bankasi") return false;
      }

      if (ogVal && normOgrenci(q) !== ogVal) return false;
      return true;
    });
  }

  function applyHkButtonState(btn, on) {
    if (!btn) return;
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.classList.toggle("border-emerald-200", !!on);
    btn.classList.toggle("bg-emerald-50", !!on);
    btn.classList.toggle("text-emerald-700", !!on);
    btn.classList.toggle("border-slate-200", !on);
    btn.classList.toggle("bg-white", !on);
    btn.classList.toggle("text-slate-600", !on);
    var tickWrap = btn.querySelector("span");
    if (tickWrap) {
      tickWrap.classList.toggle("bg-emerald-600", !!on);
      tickWrap.classList.toggle("bg-slate-300", !on);
    }
  }

  function initHkFilter() {
    if (!elHkFilter) return;
    var btns = Array.prototype.slice.call(elHkFilter.querySelectorAll(".hh-hk-btn"));
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
        /* Filtre değişince vitrini anında güncelle */
        try {
          render(getFiltered());
        } catch (e) {}
      });
    });
  }

  function hataKaynagiStored(q) {
    var v = String((q && q.hataKaynagi) || "")
      .toLowerCase()
      .trim();
    if (v === "soru_bankasi" || v === "soru bankasi" || v === "sorubankasi") return "soru_bankasi";
    if (v === "deneme") return "deneme";
    return "";
  }

  function hataKaynagiBadgeLabel(q) {
    var hk = hataKaynagiStored(q);
    if (hk === "deneme") return "Deneme";
    if (hk === "soru_bankasi") return "Soru Bankası";
    return "Kaynak?";
  }

  function hataKaynagiBadgeClass(q) {
    var hk = hataKaynagiStored(q);
    if (hk === "deneme") return "rounded-md bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold text-white";
    if (hk === "soru_bankasi") return "rounded-md bg-violet-600 px-1.5 py-0.5 text-[9px] font-bold text-white";
    return "rounded-md bg-slate-300 px-1.5 py-0.5 text-[9px] font-bold text-white";
  }

  function hataTipBadgeLabel(q) {
    return hataTipStored(q) === "bos" ? "Boş" : "Yanlış";
  }

  function hataTipBadgeClass(q) {
    return hataTipStored(q) === "bos"
      ? "rounded-md bg-slate-500 px-1.5 py-0.5 text-[9px] font-bold text-white"
      : "rounded-md bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-white";
  }

  function render(questions) {
    elGrid.innerHTML = "";

    elShownCount.textContent = questions.length;
    elTotalCount.textContent = allQuestions.length;
    if (elCountLabel)
      elCountLabel.textContent =
        questions.length + " soru gösteriliyor · Toplam arşiv: " + allQuestions.length;

    if (questions.length === 0) {
      elEmpty.classList.remove("hidden");
      elGrid.classList.add("hidden");
      return;
    }

    elEmpty.classList.add("hidden");
    elGrid.classList.remove("hidden");

    questions.forEach(function (q) {
      var card = document.createElement("div");
      card.className = "sh-card rounded-xl border p-4 flex flex-col gap-3 transition-shadow";
      card.setAttribute("data-uuid", q.uuid || "");

      var ogr = normOgrenci(q);

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
      metaBadges +=
        '<span class="' +
        esc(hataTipBadgeClass(q)) +
        '" title="Hata tipi">' +
        esc(hataTipBadgeLabel(q)) +
        "</span>";
      metaBadges +=
        '<span class="' +
        esc(hataKaynagiBadgeClass(q)) +
        '" title="Hata kaynağı">' +
        esc(hataKaynagiBadgeLabel(q)) +
        "</span>";
      metaBadges +=
        '<span class="inline-flex max-w-[130px] truncate rounded-md bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm" title="' +
        esc(ogr) +
        '">' +
        esc(ogr || "Öğrenci") +
        "</span>";
      if (q.page)
        metaBadges +=
          '<span class="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">S.' +
          esc(q.page) +
          "</span>";
      if (q.qNumber)
        metaBadges +=
          '<span class="rounded bg-indigo-100 px-1.5 py-0.5 text-[9px] font-bold text-indigo-600">' +
          esc(q.qNumber) +
          ".</span>";

      var ansBtns = ["A", "B", "C", "D", "E"]
        .map(function (ch) {
          var active = q.answer === ch ? " active" : "";
          return '<button type="button" class="sh-ans-btn' + active + '" data-ans="' + ch + '" data-uuid="' + esc(q.uuid) + '">' + ch + "</button>";
        })
        .join("");

      var savedDate = "";
      if (q.savedAt) {
        try {
          savedDate = new Date(q.savedAt).toLocaleDateString("tr-TR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
        } catch (e2) {}
      }

      var imgUrl = q.dataUrl || q.dataURL || q.image || "";
      var imgBlk = imgUrl
        ? '<img src="' + esc(imgUrl) + '" alt="Soru" class="max-h-64 w-full object-contain" loading="lazy" />'
        : '<div class="flex min-h-[120px] w-full items-center justify-center rounded-lg bg-slate-100 text-[11px] text-slate-400">Görsel yok</div>';

      card.innerHTML =
        '<div class="flex items-start justify-between gap-2">' +
          '<div class="flex min-w-0 flex-1 flex-col gap-1">' +
          '<div class="flex flex-wrap items-center gap-1">' +
          metaBadges +
          "</div>" +
          tagHtml +
          "</div>" +
          '<button type="button" class="sh-delete-btn flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-red-400 transition hover:bg-red-50 hover:text-red-600" data-uuid="' +
          esc(q.uuid) +
          '" title="Arşivden kaldır">' +
          '<svg class="h-3.5 w-3.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>' +
          "</button>" +
        "</div>" +
        '<div class="flex items-center justify-center overflow-hidden rounded-lg bg-slate-50 p-1">' +
          imgBlk +
        "</div>" +
        '<div class="border-t pt-3">' +
          '<div class="mb-1.5 flex items-center justify-between">' +
          '<span class="text-[10px] font-semibold text-slate-400">Doğru Cevap</span>' +
          (savedDate ? '<span class="text-[9px] text-slate-300">' + esc(savedDate) + "</span>" : "") +
          "</div>" +
          '<div class="flex items-center gap-1.5">' +
          ansBtns +
          "</div>" +
        "</div>";

      elGrid.appendChild(card);
    });
  }

  function populateDersDropdown() {
    while (elSelDers.options.length > 1) elSelDers.remove(1);
    elSelKonu.innerHTML = '<option value="">— Tümü —</option>';
    elSelKonu.disabled = true;
    elSelKavram.innerHTML = '<option value="">— Tümü —</option>';
    elSelKavram.disabled = true;

    if (!window.YksMufredat) return;
    (window.YksMufredat.subjects || []).forEach(function (s) {
      var opt = document.createElement("option");
      opt.value = s.id;
      opt.setAttribute("data-name", s.name);
      opt.textContent = s.name + " (" + s.sinav + ")";
      elSelDers.appendChild(opt);
    });
  }

  function populateKonuDropdown(subId) {
    elSelKonu.innerHTML = '<option value="">— Tümü —</option>';
    elSelKavram.innerHTML = '<option value="">— Tümü —</option>';
    elSelKonu.disabled = !subId;
    elSelKavram.disabled = true;
    if (!subId || !window.YksMufredatApi) return;

    var topics = window.YksMufredatApi.getTopics(subId) || [];
    topics.forEach(function (t) {
      var opt = document.createElement("option");
      opt.value = t.id;
      opt.setAttribute("data-name", t.name);
      opt.textContent = t.name;
      elSelKonu.appendChild(opt);
    });
    elSelKonu.disabled = topics.length === 0;
  }

  function populateKavramDropdown(subId, topicId) {
    elSelKavram.innerHTML = '<option value="">— Tümü —</option>';
    elSelKavram.disabled = true;
    if (!subId || !topicId || !window.YksMufredatApi) return;

    var concepts = window.YksMufredatApi.getConcepts(subId, topicId) || [];
    concepts.forEach(function (c) {
      var opt = document.createElement("option");
      opt.value = c.id;
      opt.setAttribute("data-name", c.name);
      opt.textContent = c.name;
      elSelKavram.appendChild(opt);
    });
    elSelKavram.disabled = concepts.length === 0;
  }

  elSelDers.addEventListener("change", function () {
    populateKonuDropdown(elSelDers.value);
  });
  elSelKonu.addEventListener("change", function () {
    populateKavramDropdown(elSelDers.value, elSelKonu.value);
  });

  elBtnFilter.addEventListener("click", function () {
    render(getFiltered());
  });

  elBtnAll.addEventListener("click", function () {
    elSelDers.value = "";
    if (elSelOgrenci) elSelOgrenci.selectedIndex = 0;
    if (elSelHataTipi) elSelHataTipi.value = "";
    populateKonuDropdown("");
    render(allQuestions);
  });

  elGrid.addEventListener("click", function (e) {
    if (e.target.classList.contains("sh-ans-btn")) {
      var btn = e.target;
      var uuid = btn.getAttribute("data-uuid");
      var ans = btn.getAttribute("data-ans");
      var q = allQuestions.find(function (x) {
        return x.uuid === uuid;
      });
      if (!q) return;

      q.answer = q.answer === ans ? null : ans;
      savePool();

      var card = btn.closest(".sh-card");
      if (card) {
        card.querySelectorAll(".sh-ans-btn").forEach(function (b) {
          b.classList.toggle("active", b.getAttribute("data-ans") === q.answer);
        });
      }
      showToast(q.answer ? 'Cevap "' + q.answer + '" kaydedildi' : "Cevap kaldırıldı");
      return;
    }

    var delBtn = e.target.closest(".sh-delete-btn");
    if (delBtn) {
      var uuid = delBtn.getAttribute("data-uuid");
      if (!confirm("Bu kaydı arşivden kaldırmak istiyor musunuz?")) return;
      allQuestions = allQuestions.filter(function (x) {
        return x.uuid !== uuid;
      });
      savePool();
      render(getFiltered());
      populateDersDropdown();
      populateOgrenciSelect();
      showToast("Kayıt kaldırıldı");
    }
  });

  elBtnClearAll.addEventListener("click", function () {
    if (!confirm("Hatalı soru havuzundaki TÜM kayıtlar silinecek. Emin misiniz?")) return;
    allQuestions = [];
    savePool();
    render([]);
    showToast("Arşiv temizlendi");
  });

  function waitMufredatThen(retries, fn) {
    if (window.YksMufredat && window.YksMufredat.subjects && window.YksMufredat.subjects.length) {
      fn();
      return;
    }
    if (retries <= 0) {
      fn();
      return;
    }
    setTimeout(function () {
      waitMufredatThen(retries - 1, fn);
    }, 120);
  }

  function boot() {
    loadPool();
    populateOgrenciSelect();
    populateDersDropdown();
    if (elDesc) elDesc.textContent = DESC_TEXT;
    render(allQuestions);
  }

  document.addEventListener("DOMContentLoaded", function () {
    waitMufredatThen(50, boot);
  });

  /* Boot sonrası filtre butonlarını bağla */
  initHkFilter();
})();
