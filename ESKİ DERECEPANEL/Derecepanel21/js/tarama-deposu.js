/**
 * Tarama Deposu — kurumsal arşiv tablosu + filtre + köprüler.
 *
 * • IndexedDB (window.TaramaDeposu) kaynak; localStorage tarama_data_* analiz köprüsü.
 * • Filtreler: arama, ders, konu, tarih — canlı uygulanır.
 * • İşlemler: PDF önizleme (yeni sekme), öğrenciye gönder (modal + DereceFascicleBridge),
 *   analiz sayfası (?examId=), sil (confirm + LS temizliği).
 */
(function () {
  "use strict";

  var els = {};
  var state = {
    all: [],
    filtered: [],
    filters: { q: "", ders: "", konu: "", days: "" },
    sendRec: null,
  };

  function $(id) {
    return document.getElementById(id);
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fmtDate(ts) {
    if (!ts) return "—";
    try {
      var d = new Date(ts);
      return d.toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch (e) {
      return "";
    }
  }

  function toast(msg, isError) {
    var t = $("td-toast");
    var txt = $("td-toast-text");
    if (!t) return;
    if (txt) txt.textContent = msg;
    t.classList.toggle("is-error", !!isError);
    t.classList.add("is-show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      t.classList.remove("is-show");
    }, 2400);
  }

  function debounce(fn, ms) {
    var t;
    return function () {
      var a = arguments;
      var ctx = this;
      clearTimeout(t);
      t = setTimeout(function () {
        fn.apply(ctx, a);
      }, ms);
    };
  }

  /* ── Analiz köprüsü (test_maker_exports + tarama_data_*) ─────────────── */
  function syncTaramaDataMirror(rec) {
    if (!rec || !rec.id) return;
    var questions = rec.questions || [];
    var cevap = questions
      .map(function (q) {
        var a = String(q && q.answer != null ? q.answer : "").trim().toUpperCase();
        var m = a.match(/[A-E]/);
        return m ? m[0] : "";
      })
      .join("");
    var savedIso = rec.updatedAt || rec.createdAt
      ? new Date(rec.updatedAt || rec.createdAt).toISOString()
      : new Date().toISOString();
    var payload = {
      id: rec.id,
      depoId: rec.id,
      name: rec.name || "Tarama",
      soruSayisi: questions.length,
      cevapAnahtari: cevap,
      savedAt: savedIso,
      matrixSnapshot: null,
    };
    try {
      localStorage.setItem("tarama_data_" + rec.id, JSON.stringify(payload));
    } catch (e1) {}
    var list = [];
    try {
      list = JSON.parse(localStorage.getItem("test_maker_exports") || "[]");
    } catch (e2) {
      list = [];
    }
    if (!Array.isArray(list)) list = [];
    list = list.filter(function (x) {
      return !x || String(x.id) !== String(rec.id);
    });
    list.unshift({
      id: rec.id,
      name: payload.name,
      soruSayisi: questions.length,
      savedAt: payload.savedAt,
    });
    if (list.length > 500) list = list.slice(0, 500);
    try {
      localStorage.setItem("test_maker_exports", JSON.stringify(list));
    } catch (e3) {}
    try {
      window.dispatchEvent(new CustomEvent("taramaAnaliz:change"));
    } catch (e4) {}
  }

  function purgeTaramaLsMirror(id) {
    if (!id) return;
    try {
      localStorage.removeItem("tarama_data_" + id);
    } catch (e) {}
    try {
      var list = JSON.parse(localStorage.getItem("test_maker_exports") || "[]");
      if (!Array.isArray(list)) return;
      list = list.filter(function (x) {
        return !x || String(x.id) !== String(id);
      });
      localStorage.setItem("test_maker_exports", JSON.stringify(list));
    } catch (e2) {}
    try {
      window.dispatchEvent(new CustomEvent("taramaAnaliz:change"));
    } catch (e3) {}
  }

  function mirrorMissingToLs(items) {
    if (!items || !items.length) return;
    var list = [];
    try {
      list = JSON.parse(localStorage.getItem("test_maker_exports") || "[]");
    } catch (e0) {
      list = [];
    }
    if (!Array.isArray(list)) list = [];
    var seenExport = {};
    list.forEach(function (x) {
      if (x && x.id) seenExport[String(x.id)] = true;
    });
    var exportsChanged = false;
    for (var i = 0; i < items.length; i++) {
      var rec = items[i];
      if (!rec || !rec.id) continue;
      try {
        if (localStorage.getItem("tarama_data_" + rec.id)) continue;
      } catch (e1) {
        continue;
      }
      var questions = rec.questions || [];
      var cevap = questions
        .map(function (q) {
          var a = String(q && q.answer != null ? q.answer : "").trim().toUpperCase();
          var m = a.match(/[A-E]/);
          return m ? m[0] : "";
        })
        .join("");
      var savedIso = rec.updatedAt || rec.createdAt
        ? new Date(rec.updatedAt || rec.createdAt).toISOString()
        : new Date().toISOString();
      var payload = {
        id: rec.id,
        depoId: rec.id,
        name: rec.name || "Tarama",
        soruSayisi: questions.length,
        cevapAnahtari: cevap,
        savedAt: savedIso,
        matrixSnapshot: null,
      };
      try {
        localStorage.setItem("tarama_data_" + rec.id, JSON.stringify(payload));
      } catch (e2) {}
      if (!seenExport[String(rec.id)]) {
        list.unshift({
          id: rec.id,
          name: payload.name,
          soruSayisi: questions.length,
          savedAt: savedIso,
        });
        seenExport[String(rec.id)] = true;
        exportsChanged = true;
      }
    }
    if (exportsChanged) {
      if (list.length > 500) list = list.slice(0, 500);
      try {
        localStorage.setItem("test_maker_exports", JSON.stringify(list));
      } catch (e3) {}
      try {
        window.dispatchEvent(new CustomEvent("taramaAnaliz:change"));
      } catch (e4) {}
    }
  }

  /* ── Fasikül payload (depo kaydından) ─────────────────────────────────── */
  function buildFasciclePayloadFromTaramaRecord(rec) {
    var questions = rec.questions || [];
    var keyParts = questions.map(function (q) {
      var a = String(q && q.answer != null ? q.answer : "").trim().toUpperCase();
      var m = a.match(/[A-E]/);
      return m ? m[0] : " ";
    });
    var title =
      (rec.coverTitle && String(rec.coverTitle).trim()) ||
      (rec.name && String(rec.name).trim()) ||
      "Tarama";
    return {
      id: rec.id,
      title: title,
      questionCount: questions.length,
      answerKey: keyParts.join(""),
      template: (rec.layout && rec.layout.sablon) || "",
      source: "tarama_deposu",
      depoId: rec.id,
      metaName: rec.name || "",
      pdf_file_id: rec.pdf_file_id || rec.pdfFileId || "",
    };
  }

  function studentClassLabel(s) {
    if (!s) return "";
    var sub = (s.sube || s.class || "").trim();
    if (sub) return sub;
    var meta = (s.meta || "").trim();
    if (meta) return meta.split("·")[0].trim() || meta;
    return "";
  }

  /* ── Filtre dropdownları ──────────────────────────────────────────────── */
  function populateFilterOptions() {
    var dersSet = new Set();
    var konuSet = new Set();
    state.all.forEach(function (r) {
      if (r.ders) dersSet.add(r.ders);
      if (r.konu) konuSet.add(r.konu);
    });
    fillSelect(els.ders, Array.from(dersSet).sort(), state.filters.ders);
    fillSelect(els.konu, Array.from(konuSet).sort(), state.filters.konu);
  }

  function fillSelect(sel, opts, keepVal) {
    if (!sel) return;
    var cur = keepVal || "";
    sel.innerHTML =
      '<option value="">Tümü</option>' +
      opts
        .map(function (v) {
          return (
            '<option value="' +
            esc(v) +
            '"' +
            (v === cur ? " selected" : "") +
            ">" +
            esc(v) +
            "</option>"
          );
        })
        .join("");
  }

  function applyFilters() {
    var f = state.filters;
    var q = f.q.trim().toLowerCase();
    var days = parseInt(f.days, 10);
    var since = days ? Date.now() - days * 86400000 : 0;

    state.filtered = state.all.filter(function (r) {
      if (f.ders && (r.ders || "") !== f.ders) return false;
      if (f.konu && (r.konu || "") !== f.konu) return false;
      if (since && (r.createdAt || 0) < since) return false;
      if (q) {
        var hay = (
          (r.name || "") +
          " " +
          (r.konu || "") +
          " " +
          (r.kurum || "") +
          " " +
          (r.ders || "") +
          " " +
          (r.coverTitle || "")
        ).toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });
    render();
  }

  /**
   * Üst 4 KPI kartını kayıtlardan türetir.
   * En aktif ders: tarama sayısına göre en çok tekrar eden ders.
   */
  function calculateStats() {
    var items = state.all;
    var totalQ = 0;
    var byDersExams = Object.create(null);
    var thisMonth = 0;
    var now = new Date();
    items.forEach(function (r) {
      var qc = (r.questions && r.questions.length) || 0;
      totalQ += qc;
      var d = (r.ders || "Genel").trim() || "Genel";
      byDersExams[d] = (byDersExams[d] || 0) + 1;
      if (r.createdAt) {
        var dt = new Date(r.createdAt);
        if (dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth()) {
          thisMonth++;
        }
      }
    });
    var topDers = "—";
    var topCount = 0;
    Object.keys(byDersExams).forEach(function (k) {
      if (byDersExams[k] > topCount) {
        topCount = byDersExams[k];
        topDers = k;
      }
    });
    if (els.statTotal) els.statTotal.textContent = String(items.length);
    if (els.statQ) els.statQ.textContent = String(totalQ);
    if (els.statTopDers) els.statTopDers.textContent = items.length ? topDers : "—";
    if (els.statThisMonth) els.statThisMonth.textContent = String(thisMonth);
  }

  function renderTableRow(r) {
    var qCount = (r.questions && r.questions.length) || 0;
    var cover = (r.coverTitle && String(r.coverTitle).trim()) || "—";
    var name = r.name || "İsimsiz";
    var dk =
      '<span class="td-pill-dk">' +
      '<span class="td-badge-soft">' +
      esc(r.ders || "Genel") +
      "</span>" +
      (r.konu
        ? '<span class="td-badge-soft td-badge-soft--muted">' + esc(r.konu) + "</span>"
        : "") +
      "</span>";

    return (
      "<tr data-id=\"" +
      esc(r.id) +
      "\">" +
      "<td>" +
      '<div class="td-cell-title">' +
      "<strong>" +
      esc(name) +
      "</strong>" +
      "<small>Kapak: " +
      esc(cover) +
      "</small>" +
      '<button type="button" class="td-link-edit" data-td-act="edit">Test Maker’da düzenle</button>' +
      "</div>" +
      "</td>" +
      "<td>" +
      dk +
      "</td>" +
      '<td><span class="td-num">' +
      qCount +
      "</span></td>" +
      "<td>" +
      esc(fmtDate(r.createdAt)) +
      "</td>" +
      '<td><span class="td-status">Hazır</span></td>' +
      "<td>" +
      '<div class="td-actions">' +
      '<button type="button" class="td-act-pill td-act-pill--pv" data-td-act="pdf">' +
      "👁️ PDF Önizle" +
      "</button>" +
      '<button type="button" class="td-act-pill td-act-pill--send" data-td-act="send">' +
      "🎒 Öğrenciye Gönder" +
      "</button>" +
      '<button type="button" class="td-act-pill td-act-pill--analiz" data-td-act="analiz">' +
      "📊 Analize Git" +
      "</button>" +
      '<button type="button" class="td-act-pill td-act-pill--del" data-td-act="delete">' +
      "🗑️ Sil" +
      "</button>" +
      "</div>" +
      "</td>" +
      "</tr>"
    );
  }

  function render() {
    var items = state.filtered;
    if (els.count) els.count.textContent = items.length + " tarama";

    if (!state.all.length) {
      if (els.tableWrap) els.tableWrap.style.display = "none";
      els.empty.style.display = "flex";
      $("td-empty-title").textContent = "Henüz bir sınav arşivlemediniz";
      $("td-empty-sub").innerHTML =
        'Test Oluşturucu\'da hazırladığınız testleri <b>"Tarama Deposuna Kaydet"</b> diyerek buraya gönderebilirsiniz.';
      return;
    }
    if (!items.length) {
      if (els.tableWrap) els.tableWrap.style.display = "none";
      els.empty.style.display = "flex";
      $("td-empty-title").textContent = "Eşleşen tarama yok";
      $("td-empty-sub").innerHTML = "Filtreleri gevşetmeyi veya aramayı temizlemeyi deneyin.";
      return;
    }
    els.empty.style.display = "none";
    if (els.tableWrap) els.tableWrap.style.display = "block";
    if (els.tableBody) {
      els.tableBody.innerHTML = items.map(function (r) {
        return renderTableRow(r);
      }).join("");
    }
  }

  function findRec(id) {
    for (var i = 0; i < state.all.length; i++) {
      if (state.all[i].id === id) return state.all[i];
    }
    return null;
  }

  function goEdit(id) {
    try {
      localStorage.setItem("transfer_tarama_edit", id);
    } catch (e) {}
    window.location.href = "test-olusturucu.html";
  }

  function openPdfPreviewTab(rec) {
    var questions = rec.questions || [];
    var title = esc(rec.name || "Tarama");
    var cover = esc(rec.coverTitle || "");
    var rows = questions
      .map(function (q, i) {
        var src = q && q.imageDataUrl ? esc(q.imageDataUrl) : "";
        var ans = q && q.answer ? esc(String(q.answer)) : "—";
        return (
          "<section class=\"q\">" +
          "<header>#" +
          (i + 1) +
          " · Doğru: <b>" +
          ans +
          "</b></header>" +
          (src ? '<div class="imgwrap"><img src="' + src + '" alt="Soru ' + (i + 1) + '" /></div>' : "<p>Görsel yok</p>") +
          "</section>"
        );
      })
      .join("");
    var pdfFileId = String(rec.pdf_file_id || rec.pdfFileId || "").trim();
    var cloudBar = "";
    if (pdfFileId && window.DPAppwrite && window.DPAppwrite.isStorageConfigured()) {
      var dl = window.DPAppwrite.getFileDownloadUrl(pdfFileId);
      cloudBar =
        '<div class="toolbar"><a href="' +
        esc(dl) +
        '" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:10px 16px;border-radius:10px;border:0;background:#f59e0b;color:#fff;font-weight:700;text-decoration:none">PDF indir (Appwrite Storage)</a></div>';
    } else {
      cloudBar =
        '<div class="toolbar" style="font-size:13px;color:#64748b">Bu kayıt için bulut PDF yok. Test Oluşturucu’da <b>PDF → Bulut</b> ile yükleyin.</div>';
    }
    var html =
      "<!DOCTYPE html><html lang=\"tr\"><head><meta charset=\"utf-8\"/><title>" +
      title +
      "</title>" +
      "<style>body{font-family:Inter,system-ui,sans-serif;padding:20px;color:#0f172a;background:#fff;}h1{font-size:1.1rem;margin:0 0 4px;}h2{font-size:.8rem;color:#64748b;font-weight:600;margin:0 0 20px;}.toolbar{margin-bottom:16px;}button{padding:10px 16px;border-radius:10px;border:0;background:#4f46e5;color:#fff;font-weight:700;cursor:pointer;}section.q{break-inside:avoid;margin-bottom:18px;border:1px solid #e2e8f0;border-radius:12px;padding:12px;}header{font-size:12px;color:#475569;margin-bottom:8px;}.imgwrap img{max-width:100%;height:auto;display:block;}</style></head><body>" +
      "<h1>" +
      title +
      "</h1>" +
      (cover ? "<h2>" + cover + "</h2>" : "") +
      cloudBar +
      rows +
      "</body></html>";
    var w = window.open("", "_blank");
    if (!w) {
      toast("Pop-up engellendi; tarayıcıda yeni sekme izni verin.", true);
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  function goAnaliz(rec) {
    syncTaramaDataMirror(rec);
    window.location.href = "tarama-analiz.html?examId=" + encodeURIComponent(rec.id);
  }

  function handleDelete(rec) {
    if (!window.confirm('"' + (rec.name || "Bu tarama") + '" kalıcı olarak silinsin mi?')) return;
    window.TaramaDeposu.remove(rec.id)
      .then(function () {
        purgeTaramaLsMirror(rec.id);
        state.all = state.all.filter(function (r) {
          return r.id !== rec.id;
        });
        populateFilterOptions();
        calculateStats();
        applyFilters();
        toast("Tarama silindi");
      })
      .catch(function (err) {
        toast("Silinemedi: " + (err && err.message), true);
      });
  }

  /* ── Tablo tıklamaları ────────────────────────────────────────────────── */
  function onTableClick(e) {
    var editBtn = e.target.closest && e.target.closest(".td-link-edit");
    var actBtn = e.target.closest && e.target.closest("button[data-td-act]");
    var tr = e.target.closest && e.target.closest("tr[data-id]");
    if (!tr) return;
    var id = tr.getAttribute("data-id");
    var rec = findRec(id);
    if (!rec) return;
    if (editBtn) {
      goEdit(id);
      return;
    }
    if (!actBtn) return;
    var act = actBtn.getAttribute("data-td-act");
    if (act === "pdf") openPdfPreviewTab(rec);
    else if (act === "send") openSendModal(rec);
    else if (act === "analiz") goAnaliz(rec);
    else if (act === "delete") handleDelete(rec);
  }

  /* ── Öğrenciye gönder modal ───────────────────────────────────────────── */
  function populateSendClassFilter() {
    var sel = els.sendClass;
    if (!sel) return;
    var classes = {};
    (window.DereceStudentCatalog || []).forEach(function (s) {
      if (!s || !s.id) return;
      var lab = studentClassLabel(s);
      if (lab) classes[lab] = true;
    });
    var opts = Object.keys(classes).sort();
    var cur = sel.value;
    sel.innerHTML = '<option value="">Tüm öğrenciler</option>';
    opts.forEach(function (c) {
      var o = document.createElement("option");
      o.value = c;
      o.textContent = c;
      sel.appendChild(o);
    });
    if (opts.indexOf(cur) >= 0) sel.value = cur;
  }

  function populateSendStudentSelect(classFilter) {
    var sel = els.sendStudent;
    if (!sel) return;
    var cf = (classFilter || "").trim();
    sel.innerHTML = "";
    var list = window.DereceStudentCatalog || [];
    var added = 0;
    list.forEach(function (s) {
      if (!s || !s.id) return;
      if (cf && studentClassLabel(s) !== cf) return;
      var o = document.createElement("option");
      o.value = s.id;
      o.textContent = s.name + (s.code ? " (" + s.code + ")" : "");
      sel.appendChild(o);
      added++;
    });
    if (!added) {
      var ph = document.createElement("option");
      ph.value = "";
      ph.textContent = "Öğrenci kataloğu boş — Öğrencilerim’den ekleyin";
      ph.disabled = true;
      ph.selected = true;
      sel.appendChild(ph);
    }
  }

  function openSendModal(rec) {
    if (!window.DereceFascicleBridge) {
      toast("Köprü yüklenemedi; sayfayı yenileyin.", true);
      return;
    }
    if (typeof window.syncDereceStudentCatalog === "function") {
      try {
        window.syncDereceStudentCatalog();
      } catch (e) {}
    }
    state.sendRec = rec;
    var sub = $("td-send-sub");
    if (sub) {
      sub.textContent =
        (rec.name || "Tarama") +
        " · " +
        ((rec.questions && rec.questions.length) || 0) +
        " soru — öğrenci kütüphanesine (assigned_fascicles) eklenir.";
    }
    populateSendClassFilter();
    populateSendStudentSelect(els.sendClass ? els.sendClass.value : "");
    var modal = $("td-send-modal");
    if (modal) {
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }
  }

  function closeSendModal() {
    state.sendRec = null;
    var modal = $("td-send-modal");
    if (modal) {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
    }
    document.body.style.overflow = "";
  }

  function confirmSendFascicle() {
    var rec = state.sendRec;
    if (!rec || !window.DereceFascicleBridge) return;
    var sel = els.sendStudent;
    var oid = sel && sel.value;
    if (!oid) {
      toast("Öğrenci seçin", "Listeden bir öğrenci seçmelisiniz.", true);
      return;
    }
    var questions = rec.questions || [];
    if (!questions.length) {
      toast("Bu kayıtta soru yok", "", true);
      return;
    }
    var payload = buildFasciclePayloadFromTaramaRecord(rec);
    var filled = String(payload.answerKey || "").replace(/ /g, "").length;
    if (!filled) {
      toast("Cevap anahtarı eksik", "Test Maker’da şıkları işaretleyip tekrar kaydedin.", true);
      return;
    }
    var cat = (window.DereceStudentCatalog || []).find(function (s) {
      return s && s.id === oid;
    });
    window.DereceFascicleBridge.appendAssigned(
      oid,
      Object.assign({}, payload, {
        studentCode: cat && cat.code ? String(cat.code) : "",
        source: "tarama_deposu_send",
      })
    );
    closeSendModal();
    toast("Öğrenci kütüphanesine gönderildi", (payload.title || rec.name) + " · " + questions.length + " soru");
  }

  function closePreview() {
    var modal = $("td-preview-modal");
    if (!modal) return;
    modal.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  /* ── Filtre eventleri ─────────────────────────────────────────────────── */
  function wireFilters() {
    els.q.addEventListener(
      "input",
      debounce(function () {
        state.filters.q = els.q.value;
        applyFilters();
      }, 120)
    );
    els.ders.addEventListener("change", function () {
      state.filters.ders = els.ders.value;
      applyFilters();
    });
    els.konu.addEventListener("change", function () {
      state.filters.konu = els.konu.value;
      applyFilters();
    });
    els.date.addEventListener("change", function () {
      state.filters.days = els.date.value;
      applyFilters();
    });
    els.clear.addEventListener("click", function () {
      state.filters = { q: "", ders: "", konu: "", days: "" };
      els.q.value = "";
      els.ders.value = "";
      els.konu.value = "";
      els.date.value = "";
      applyFilters();
    });
  }

  function wireSendModal() {
    if (els.sendClass) {
      els.sendClass.addEventListener("change", function () {
        populateSendStudentSelect(els.sendClass.value);
      });
    }
    if (els.sendClose) els.sendClose.addEventListener("click", closeSendModal);
    if (els.sendCancel) els.sendCancel.addEventListener("click", closeSendModal);
    if (els.sendConfirm) els.sendConfirm.addEventListener("click", confirmSendFascicle);
    var sm = $("td-send-modal");
    if (sm) {
      sm.addEventListener("click", function (e) {
        if (e.target === sm) closeSendModal();
      });
    }
  }

  function init() {
    els = {
      tableWrap: $("td-table-wrap"),
      tableBody: $("td-table-body"),
      empty: $("td-empty"),
      count: $("td-list-count"),
      q: $("td-q"),
      ders: $("td-ders"),
      konu: $("td-konu"),
      date: $("td-date"),
      clear: $("td-clear"),
      statTotal: $("td-stat-total"),
      statQ: $("td-stat-questions"),
      statTopDers: $("td-stat-topders"),
      statThisMonth: $("td-stat-thismonth"),
      sendModal: $("td-send-modal"),
      sendClass: $("td-send-class"),
      sendStudent: $("td-send-student"),
      sendClose: $("td-send-close"),
      sendCancel: $("td-send-cancel"),
      sendConfirm: $("td-send-confirm"),
    };
    if (!els.empty) return;

    wireFilters();
    wireSendModal();
    if (els.tableBody) els.tableBody.addEventListener("click", onTableClick);

    var pvClose = $("td-pv-close");
    var pvModal = $("td-preview-modal");
    if (pvClose) pvClose.addEventListener("click", closePreview);
    if (pvModal) {
      pvModal.addEventListener("click", function (e) {
        if (e.target === pvModal) closePreview();
      });
    }
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      var sm = $("td-send-modal");
      if (sm && sm.classList.contains("is-open")) {
        closeSendModal();
        return;
      }
      if (pvModal && pvModal.classList.contains("is-open")) closePreview();
    });

    if (!window.TaramaDeposu) {
      toast("Depo modülü yüklenemedi", true);
      return;
    }

    window.TaramaDeposu.list()
      .then(function (items) {
        state.all = items || [];
        state.filtered = state.all.slice();
        mirrorMissingToLs(state.all);
        populateFilterOptions();
        calculateStats();
        applyFilters();
      })
      .catch(function (err) {
        toast("Depo okunamadı: " + (err && err.message), true);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
