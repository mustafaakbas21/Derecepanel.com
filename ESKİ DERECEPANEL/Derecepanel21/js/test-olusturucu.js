/**
 * Test Oluşturucu — müfredat, kanvas, Sortable sorular, pan / kırpma, PDF, cevap anahtarı (A4).
 */
(function () {
  "use strict";

  var sortableInstance = null;
  /** Kullanıcı zoom çarpanı — PDF.js zoom anında tekrar çizer (CSS scale yok) */
  var pdfUserScale = 1.0;
  /** Render jenerasyonu: stale (eski) render callback'lerini engeller */
  var pdfRenderGen = 0;
  /** Son render'ın PDF ölçeği ve DPR'i — kırpma için koordinat dönüşümünde kullanılır */
  var pdfRenderFinalScale = 1;
  var pdfRenderDpr = 1;
  /** Sayfa başına düşen maksimum soru sayısı */
  var qPerPage = 4;
  /** Kullanıcının "Sayfa Ekle" ile eklediği ekstra boş sayfa sayısı */
  var manualPages = 0;
  var pdfFiles = [];
  var activePdfEntry = null;
  var pdfJsDocument = null;
  var pdfTotalPages = 0;
  var pdfPageIndex = 1;
  /** Kurumsal deneme kitapçıkları (taranmış / görselli) için üst sınır */
  var PDF_MAX_MB = 100;
  var PDF_MAX_BYTES = PDF_MAX_MB * 1024 * 1024;

  /** Pan / kırpma senkron (karşılıklı kapama) */
  var syncPanModeFn = null;
  var syncCropModeFn = null;

  /** PDF önizleme: translate ile elle gez (taşma olmasa da çalışır) */
  var pdfPanX = 0;
  var pdfPanY = 0;

  /** PDF.js: üst üste binen render yarışını ve kırpma sırasındaki yanlış çizimi önlemek için */
  var pdfRenderTask = null;
  /** Kırpma sürüklenirken ResizeObserver ile yeniden çizim yapılmasın (bazen ters/ bozuk kare) */
  var pdfCropDragActive = false;
  /** PDF kırpma şık çubuğunda seçilen harf (Tamam ile onaylanır) */
  var pdfCropSelectedLetter = null;

  /** Gelişmiş Kırpma Modalı — önizleme canvas'ından bağımsız render ölçeği */
  var studioPdfRenderFinalScale = 1;
  var studioPdfRenderDpr = 1;
  var studioPdfPageIndexFrozen = 1;
  /** Stüdyoda "sayfaya sığdır" çarpanına göre yakınlaştırma (0.5 … 4.0, adım 0.1) */
  var studioPdfUserZoom = 1.0;
  var studioPdfRenderGen = 0;
  var studioPdfRenderTask = null;

  function applyPdfPanTransform() {
    var el = document.getElementById("tm-pdf-pan-inner");
    if (el) {
      el.style.transform = "translate(" + Math.round(pdfPanX) + "px, " + Math.round(pdfPanY) + "px)";
    }
  }

  function resetPdfPan() {
    pdfPanX = 0;
    pdfPanY = 0;
    applyPdfPanTransform();
  }

  function ensureMufredatApi() {
    if (window.YksMufredatApi && typeof window.YksMufredatApi.getSubjects === "function") {
      return window.YksMufredatApi;
    }
    var fallback = {
      Matematik: ["Trigonometri", "Türev", "İntegral", "Limit", "Polinomlar"],
      Türkçe: ["Sözcükte Anlam", "Paragraf", "Cümlede Anlam", "Yazım Kuralları"],
      Fizik: ["Kuvvet ve Hareket", "Elektrik", "Dalgalar", "Optik"],
      Kimya: ["Atom ve Periyodik Sistem", "Kimyasal Türler Arası Etkileşimler", "Asit Baz"],
    };
    var dersler = Object.keys(fallback);
    return {
      getSubjects: function () {
        return dersler.map(function (name, i) {
          return { id: "fb-" + i, name: name };
        });
      },
      getTopics: function (subjectId) {
        var idx = parseInt(String(subjectId).replace("fb-", ""), 10);
        var name = dersler[isNaN(idx) ? 0 : idx];
        if (!name) name = dersler[0];
        var topics = fallback[name] || [];
        return topics.map(function (t, j) {
          return { id: "fb-t-" + idx + "-" + j, name: t };
        });
      },
    };
  }

  function fillKonuAnimated(konuEl, wrap, subjectId, api, onDone) {
    var topics = api.getTopics(subjectId);
    if (wrap) wrap.classList.add("opacity-40");
    window.setTimeout(function () {
      konuEl.innerHTML = "";
      topics.forEach(function (t) {
        var o = document.createElement("option");
        o.value = t.id;
        o.textContent = t.name;
        konuEl.appendChild(o);
      });
      if (wrap) wrap.classList.remove("opacity-40");
      if (typeof onDone === "function") onDone();
    }, 120);
  }

  function getSelectTexts() {
    var dersEl = document.getElementById("tm-select-ders");
    var konuEl = document.getElementById("tm-select-konu");
    var dersText = "";
    var konuText = "";
    if (dersEl && dersEl.options.length && dersEl.selectedIndex >= 0) {
      dersText = (dersEl.options[dersEl.selectedIndex] && dersEl.options[dersEl.selectedIndex].textContent) || "";
    }
    if (konuEl && konuEl.options.length && konuEl.selectedIndex >= 0) {
      konuText = (konuEl.options[konuEl.selectedIndex] && konuEl.options[konuEl.selectedIndex].textContent) || "";
    }
    return { ders: dersText.trim(), konu: konuText.trim() };
  }

  function syncCanvasFromSelects() {
    var t = getSelectTexts();
    var lineMain = "";
    if (t.ders && t.konu) lineMain = t.ders + " — " + t.konu;
    else lineMain = t.ders || t.konu || "—";

    var el = document.getElementById("tm-cover-line-ders-konu");
    if (el) el.textContent = lineMain;

    el = document.getElementById("tm-sh-q-ders");
    if (el) el.textContent = t.ders;
    el = document.getElementById("tm-sh-q-konu");
    if (el) el.textContent = t.konu;

    el = document.getElementById("tm-sh-a-ders");
    if (el) el.textContent = t.ders;
    el = document.getElementById("tm-sh-a-konu");
    if (el) el.textContent = t.konu;

    var meta = t.ders && t.konu ? t.ders + " — " + t.konu : lineMain;
    document.querySelectorAll(".tm-q-meta").forEach(function (n) {
      n.textContent = meta;
    });
  }

  function syncInstitutionFromInput() {
    var inp = document.getElementById("tm-input-kurum");
    var raw = inp && inp.value != null ? String(inp.value).trim() : "";
    var display = raw || "KURUM ADI";
    document.querySelectorAll(".tm-sync-institution").forEach(function (node) {
      node.textContent = display;
    });
  }

  /** Kapak başlığı — her seferinde güncel DOM */
  function syncLiveCoverTitleFromInputs() {
    var titleInput = document.getElementById("cover-title-input");
    var liveTitle = document.getElementById("live-cover-title");
    if (!liveTitle) return;
    var coverVal = titleInput && titleInput.value != null ? String(titleInput.value).trim() : "";
    liveTitle.textContent = coverVal !== "" ? coverVal : "SINAV BAŞLIĞI";
  }

  /**
   * Test yapılandırması → A4 önizleme: input/change olaylarını #tw-scope üzerinde topla
   * (tekrar bağlama, autofill ve gelecekteki DOM değişimlerine dayanıklı).
   */
  function initTestMakerLiveConfigSync() {
    var root = document.getElementById("tw-scope") || document.body;
    function onConfigInput(e) {
      var t = e.target;
      if (!t || !t.id) return;
      if (t.id === "cover-title-input") {
        syncLiveCoverTitleFromInputs();
      } else if (t.id === "tm-input-kurum") {
        syncInstitutionFromInput();
      }
    }
    root.addEventListener("input", onConfigInput);
    root.addEventListener("change", function (e) {
      var t = e.target;
      if (!t || !t.id) return;
      if (t.id === "cover-title-input" || t.id === "tm-input-kurum") {
        onConfigInput(e);
      }
    });
    syncInstitutionFromInput();
    syncLiveCoverTitleFromInputs();
  }

  function initMufredat() {
    var dersEl = document.getElementById("tm-select-ders");
    var konuEl = document.getElementById("tm-select-konu");
    var konuWrap = document.getElementById("tm-konu-wrap");
    if (!dersEl || !konuEl) return;

    var api = ensureMufredatApi();
    var subjects = api.getSubjects();
    dersEl.innerHTML = "";
    subjects.forEach(function (s) {
      var o = document.createElement("option");
      o.value = s.id;
      o.textContent = s.name;
      dersEl.appendChild(o);
    });
    if (subjects.length === 0) return;

    dersEl.addEventListener("change", function () {
      fillKonuAnimated(konuEl, konuWrap, dersEl.value, api, syncCanvasFromSelects);
    });
    konuEl.addEventListener("change", syncCanvasFromSelects);

    fillKonuAnimated(konuEl, konuWrap, subjects[0].id, api, function () {
      syncCanvasFromSelects();
      applyTaramaConfigTransfer(api, konuWrap);
    });
  }

  function findOptionValueByValueOrText(selectEl, wantedValue, wantedText) {
    if (!selectEl) return "";
    var value = String(wantedValue || "");
    var text = String(wantedText || "").trim();
    for (var i = 0; i < selectEl.options.length; i++) {
      var opt = selectEl.options[i];
      if (value && opt.value === value) return opt.value;
      var optName = (opt.getAttribute("data-name") || opt.textContent || "").trim();
      if (text && optName === text) return opt.value;
    }
    return "";
  }

  function applyTaramaConfigTransfer(api, konuWrap) {
    var dersVal = "";
    var konuVal = "";
    var dersText = "";
    var konuText = "";
    try {
      dersVal = localStorage.getItem("aktarilanDers") || "";
      konuVal = localStorage.getItem("aktarilanKonu") || "";
      dersText = localStorage.getItem("aktarilanDersText") || "";
      konuText = localStorage.getItem("aktarilanKonuText") || "";
    } catch (e) {}

    if (!dersVal && !konuVal && !dersText && !konuText) return;

    var dersEl = document.getElementById("tm-select-ders");
    var konuEl = document.getElementById("tm-select-konu");
    if (!dersEl || !konuEl) return;

    function clearTransfer() {
      try {
        localStorage.removeItem("aktarilanDers");
        localStorage.removeItem("aktarilanKonu");
        localStorage.removeItem("aktarilanDersText");
        localStorage.removeItem("aktarilanKonuText");
      } catch (e) {}
    }

    var resolvedDers = findOptionValueByValueOrText(dersEl, dersVal, dersText);
    if (!resolvedDers) {
      clearTransfer();
      return;
    }

    dersEl.value = resolvedDers;
    dersEl.dispatchEvent(new Event("change"));

    fillKonuAnimated(konuEl, konuWrap, dersEl.value, api, function () {
      var resolvedKonu = findOptionValueByValueOrText(konuEl, konuVal, konuText);
      if (resolvedKonu) {
        konuEl.value = resolvedKonu;
        konuEl.dispatchEvent(new Event("change"));
      } else {
        syncCanvasFromSelects();
      }
      clearTransfer();
    });
  }


  function initPageSettings() {
    var cbCover = document.getElementById("tm-cb-cover");
    var cbAnswer = document.getElementById("tm-cb-answer");
    var badgeCover = document.getElementById("tm-badge-cover");
    var badgeAnswer = document.getElementById("tm-badge-answer");
    if (!cbCover || !cbAnswer || !badgeCover || !badgeAnswer) return;

    function setBadge(el, show) {
      if (show) {
        el.classList.remove("hidden");
        el.setAttribute("aria-hidden", "false");
        window.requestAnimationFrame(function () {
          el.classList.remove("opacity-0", "scale-95");
          el.classList.add("opacity-100", "scale-100");
        });
      } else {
        if (el.classList.contains("hidden")) {
          el.setAttribute("aria-hidden", "true");
          return;
        }
        el.classList.remove("opacity-100", "scale-100");
        el.classList.add("opacity-0", "scale-95");
        window.setTimeout(function () {
          el.classList.add("hidden");
          el.setAttribute("aria-hidden", "true");
        }, 280);
      }
    }

    var sheetCover = document.getElementById("tm-sheet-cover");
    var sheetAnswer = document.getElementById("tm-sheet-answer");

    function sync() {
      setBadge(badgeCover, cbCover.checked);
      setBadge(badgeAnswer, cbAnswer.checked);
      cbCover.setAttribute("aria-checked", cbCover.checked ? "true" : "false");
      cbAnswer.setAttribute("aria-checked", cbAnswer.checked ? "true" : "false");
      if (sheetCover) sheetCover.classList.toggle("hidden", !cbCover.checked);
      if (sheetAnswer) sheetAnswer.classList.toggle("hidden", !cbAnswer.checked);
    }

    cbCover.addEventListener("change", sync);
    cbAnswer.addEventListener("change", sync);
    sync();
  }

  function initPdfJsWorker() {
    if (typeof pdfjsLib === "undefined") return;
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }

  function cancelPdfRenderTask() {
    if (pdfRenderTask && typeof pdfRenderTask.cancel === "function") {
      try {
        pdfRenderTask.cancel();
      } catch (e) {}
    }
    pdfRenderTask = null;
  }

  function destroyPdfJs() {
    cancelPdfRenderTask();
    if (pdfJsDocument && pdfJsDocument.destroy) {
      pdfJsDocument.destroy().catch(function () {});
    }
    pdfJsDocument = null;
    pdfTotalPages = 0;
    pdfPageIndex = 1;
  }

  function clearPdfCanvasVisual() {
    cancelPdfRenderTask();
    var canvas = document.getElementById("tm-pdf-canvas");
    var empty = document.getElementById("tm-pdf-preview-empty");
    if (canvas) {
      canvas.classList.add("hidden");
      canvas.style.width = "";
      canvas.style.height = "";
      var ctx = canvas.getContext("2d");
      if (canvas.width && canvas.height) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      canvas.width = 0;
      canvas.height = 0;
    }
    resetPdfPan();
    updateCanvasScaleWrap();
    if (empty) empty.classList.remove("hidden");
  }

  /** PDF araç çubuğu: sayfa input'undan Enter / blur ile çağrılır */
  function commitPdfPageFromInput() {
    var inp = document.getElementById("tm-page-num");
    if (!inp || !pdfJsDocument || pdfTotalPages === 0) return;
    var raw = String(inp.value != null ? inp.value : "").trim();
    if (raw === "") {
      inp.value = String(pdfPageIndex);
      return;
    }
    var n = parseInt(raw, 10);
    if (!isFinite(n) || isNaN(n)) {
      inp.value = String(pdfPageIndex);
      return;
    }
    var clamped = Math.max(1, Math.min(pdfTotalPages, n));
    var changed = clamped !== pdfPageIndex;
    pdfPageIndex = clamped;
    syncPdfControlsUi();
    if (changed) renderCurrentPdfPage();
  }

  function syncPdfControlsUi() {
    var num = document.getElementById("tm-page-num");
    var totalEl = document.getElementById("tm-page-total");
    var prev = document.getElementById("tm-page-prev");
    var next = document.getElementById("tm-page-next");
    var zlab = document.getElementById("tm-zoom-label");
    if (zlab) zlab.textContent = "%" + Math.round(pdfUserScale * 100);

    if (!pdfJsDocument || pdfTotalPages === 0) {
      if (num) {
        num.value = "";
        num.disabled = true;
        num.removeAttribute("min");
        num.removeAttribute("max");
      }
      if (totalEl) totalEl.textContent = "—";
      if (prev) {
        prev.disabled = true;
        prev.classList.add("opacity-50", "cursor-not-allowed");
      }
      if (next) {
        next.disabled = true;
        next.classList.add("opacity-50", "cursor-not-allowed");
      }
      var studioBtn0 = document.getElementById("tm-btn-crop-studio");
      if (studioBtn0) {
        studioBtn0.disabled = true;
        studioBtn0.classList.add("opacity-50", "cursor-not-allowed");
      }
      return;
    }
    if (num) {
      num.disabled = false;
      num.setAttribute("min", "1");
      num.setAttribute("max", String(pdfTotalPages));
      num.value = String(pdfPageIndex);
    }
    if (totalEl) totalEl.textContent = String(pdfTotalPages);
    if (prev) {
      prev.disabled = pdfPageIndex <= 1;
      prev.classList.toggle("opacity-50", prev.disabled);
      prev.classList.toggle("cursor-not-allowed", prev.disabled);
    }
    if (next) {
      next.disabled = pdfPageIndex >= pdfTotalPages;
      next.classList.toggle("opacity-50", next.disabled);
      next.classList.toggle("cursor-not-allowed", next.disabled);
    }
    var studioBtn = document.getElementById("tm-btn-crop-studio");
    if (studioBtn) {
      var studioOk = !!(pdfJsDocument && pdfTotalPages > 0);
      studioBtn.disabled = !studioOk;
      studioBtn.classList.toggle("opacity-50", !studioOk);
      studioBtn.classList.toggle("cursor-not-allowed", !studioOk);
    }
  }

  function renderCurrentPdfPage() {
    if (!pdfJsDocument) return;
    var canvas = document.getElementById("tm-pdf-canvas");
    var wrap = document.getElementById("tm-pdf-canvas-wrap");
    var empty = document.getElementById("tm-pdf-preview-empty");
    if (!canvas || !wrap) return;

    function runRender() {
      var w = wrap.clientWidth || wrap.offsetWidth;
      if (w < 40) {
        window.requestAnimationFrame(function () {
          w = wrap.clientWidth || wrap.offsetWidth;
          if (w < 40) w = 320;
          doPage(w);
        });
        return;
      }
      doPage(w);
    }

    function doPage(maxW) {
      cancelPdfRenderTask();
      /* Her render için benzersiz jenerasyon no: stale callback'leri filtreler */
      var myGen = ++pdfRenderGen;

      pdfJsDocument
        .getPage(pdfPageIndex)
        .then(function (page) {
          /* Bu render hâlâ geçerli mi? Yoksa yeni biri başlamış mı? */
          if (myGen !== pdfRenderGen) return;

          var rot = typeof page.rotate === "number" ? page.rotate : 0;

          /* Kapsayıcıya sığacak taban ölçek */
          var base     = page.getViewport({ scale: 1, rotation: rot });
          var fitScale = Math.max(160, maxW) / base.width;

          /* Kullanıcı zoom'u doğrudan render ölçeğine eklenir —
             CSS transform yok, PDF.js sayfayı yüksek çözünürlükte baştan çizer */
          var finalScale = fitScale * pdfUserScale;
          var viewport   = page.getViewport({ scale: finalScale, rotation: rot });

          /* Retina / HiDPI: buffer'ı fiziksel piksel sayısıyla büyüt (max 3× yeterli) */
          var dpr = Math.min(window.devicePixelRatio || 1, 3);

          /* Canvas buffer boyutu = CSS boyutu × DPR (Retina netliği) */
          var bufW = Math.max(1, Math.floor(viewport.width  * dpr));
          var bufH = Math.max(1, Math.floor(viewport.height * dpr));

          /* Boyutu değiştirmeden önce kontrol: aynıysa context sıfırlanmaz */
          if (canvas.width !== bufW)  canvas.width  = bufW;
          if (canvas.height !== bufH) canvas.height = bufH;

          /* CSS boyutu = görsel (mantıksal) piksel — tarayıcı ölçeklendirir */
          canvas.style.width  = Math.floor(viewport.width)  + "px";
          canvas.style.height = Math.floor(viewport.height) + "px";

          /* Context temizle ve sıfırla */
          var ctx = canvas.getContext("2d", { alpha: false });
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, bufW, bufH);

          if (empty) empty.classList.add("hidden");
          canvas.classList.remove("hidden");
          resetPdfPan();

          /* Son render parametrelerini sakla — kırpma fonksiyonu PDF
             koordinatlarına geri dönüştürmek için bunları kullanır */
          pdfRenderFinalScale = finalScale;
          pdfRenderDpr = dpr;

          /* DPR transform'u: PDF.js koordinatlarını fiziksel piksele eşler.
             DPR=1'de transform gereksiz → dahil etmiyoruz (null geçmekten kaçın) */
          var renderOpts = { canvasContext: ctx, viewport: viewport };
          if (dpr !== 1) renderOpts.transform = [dpr, 0, 0, dpr, 0, 0];

          var renderTask = page.render(renderOpts);
          pdfRenderTask = renderTask;

          return renderTask.promise.then(
            function () {
              /* Stale mı? Başka bir render başlamışsa hiçbir şey yapma */
              if (myGen !== pdfRenderGen) return;
              if (pdfRenderTask === renderTask) pdfRenderTask = null;
              updateCanvasScaleWrap();
            },
            function (reason) {
              /* İptal edilen render için sessizce çık */
              if (pdfRenderTask === renderTask) pdfRenderTask = null;
            }
          );
        })
        .catch(function (e) {
          pdfRenderTask = null;
          if (myGen === pdfRenderGen) console.error("PDF render hatası:", e);
        });
    }

    runRender();
  }

  function loadPdfFromEntry(entry) {
    destroyPdfJs();
    clearPdfCanvasVisual();
    syncPdfControlsUi();

    if (!entry || !entry.url) {
      return;
    }
    if (typeof pdfjsLib === "undefined") {
      window.alert("PDF önizleme kütüphanesi yüklenemedi. Sayfayı yenileyin.");
      return;
    }

    var loadingTask = pdfjsLib.getDocument({ url: entry.url });
    loadingTask.promise
      .then(function (pdf) {
        pdfJsDocument = pdf;
        pdfTotalPages = pdf.numPages;
        pdfPageIndex = 1;
        syncPdfControlsUi();
        window.requestAnimationFrame(function () {
          renderCurrentPdfPage();
        });
      })
      .catch(function (err) {
        console.error(err);
        window.alert("PDF açılamadı.");
        destroyPdfJs();
        clearPdfCanvasVisual();
        syncPdfControlsUi();
      });
  }

  function updatePdfPreview() {
    var nameEl = document.getElementById("tm-pdf-preview-name");
    var entry = activePdfEntry;
    if (entry && pdfFiles.indexOf(entry) === -1) entry = null;
    if (!entry && pdfFiles.length) entry = pdfFiles[pdfFiles.length - 1];
    activePdfEntry = entry;
    if (nameEl) nameEl.textContent = entry ? entry.name : "";
    loadPdfFromEntry(entry);
  }

  function renderPdfUi() {
    var empty = document.getElementById("tm-pdf-empty");
    var listEl = document.getElementById("tm-pdf-list");
    var countWrap = document.getElementById("tm-pdf-count-wrap");
    var countNum = document.getElementById("tm-pdf-count");
    var n = pdfFiles.length;

    if (countNum) countNum.textContent = String(n);
    if (countWrap) countWrap.classList.toggle("hidden", n === 0);

    if (empty) empty.classList.toggle("hidden", n > 0);
    if (listEl) {
      listEl.classList.toggle("hidden", n === 0);
      listEl.innerHTML = "";
      pdfFiles.forEach(function (entry) {
        var li = document.createElement("li");
        var isActive = activePdfEntry === entry;
        li.className =
          "flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-2 py-1.5 text-xs transition " +
          (isActive
            ? "border-indigo-300 bg-indigo-50/90 text-slate-800 ring-1 ring-indigo-200/80"
            : "border-slate-100 bg-white text-slate-700 hover:border-slate-200");
        li.setAttribute("role", "button");
        li.setAttribute("tabindex", "0");
        li.setAttribute("aria-pressed", isActive ? "true" : "false");
        var name = document.createElement("span");
        name.className = "min-w-0 flex-1 truncate font-medium";
        name.textContent = entry.name;
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "shrink-0 rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600";
        btn.setAttribute("aria-label", "PDF kaldır");
        btn.innerHTML =
          '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>';
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          destroyPdfJs();
          if (entry.url) {
            try {
              URL.revokeObjectURL(entry.url);
            } catch (err) {}
          }
          pdfFiles = pdfFiles.filter(function (x) {
            return x !== entry;
          });
          if (activePdfEntry === entry) {
            activePdfEntry = pdfFiles.length ? pdfFiles[pdfFiles.length - 1] : null;
          }
          renderPdfUi();
          updatePdfPreview();
        });
        li.addEventListener("click", function () {
          activePdfEntry = entry;
          renderPdfUi();
          updatePdfPreview();
        });
        li.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            activePdfEntry = entry;
            renderPdfUi();
            updatePdfPreview();
          }
        });
        li.appendChild(name);
        li.appendChild(btn);
        listEl.appendChild(li);
      });
    }
    updatePdfPreview();
  }

  function addPdfFile(file) {
    if (!file) return;
    if (file.type && file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) {
      window.alert("Lütfen yalnızca PDF dosyası seçin.");
      return;
    }
    if (file.size > PDF_MAX_BYTES) {
      window.alert("Dosya en fazla " + PDF_MAX_MB + " MB olabilir. Daha küçük bir PDF deneyin veya dosyayı sıkıştırın.");
      return;
    }
    var url = URL.createObjectURL(file);
    var entry = { name: file.name, size: file.size, file: file, url: url };
    pdfFiles.push(entry);
    activePdfEntry = entry;
    renderPdfUi();
  }

  // PDF Deposu köprüsü: harici modül (pdf-deposu.js) buradan çalışma alanına PDF yükler.
  window.TestOlusturucuPdf = window.TestOlusturucuPdf || {};
  window.TestOlusturucuPdf.loadToWorkspace = function (file) {
    try {
      addPdfFile(file);
    } catch (e) {
      console.error("PDF deposu → çalışma alanı aktarımı başarısız:", e);
    }
  };

  function initPdfDropzone() {
    var dz = document.getElementById("tm-pdf-dropzone");
    var input = document.getElementById("tm-pdf-file");
    if (!dz || !input) return;

    renderPdfUi();

    function activate(on) {
      dz.classList.toggle("border-indigo-400", on);
      dz.classList.toggle("bg-indigo-50/40", on);
    }

    dz.addEventListener("click", function () {
      input.click();
    });
    dz.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        input.click();
      }
    });

    input.addEventListener("change", function () {
      var f = input.files && input.files[0];
      if (f) addPdfFile(f);
      input.value = "";
    });

    dz.addEventListener("dragover", function (e) {
      e.preventDefault();
      e.stopPropagation();
      activate(true);
    });
    dz.addEventListener("dragleave", function (e) {
      e.preventDefault();
      if (e.target === dz) activate(false);
    });
    dz.addEventListener("drop", function (e) {
      e.preventDefault();
      e.stopPropagation();
      activate(false);
      var files = e.dataTransfer && e.dataTransfer.files;
      if (files && files[0]) addPdfFile(files[0]);
    });
  }

  /* ── Sayfalandırma Motoru ───────────────────────────────── */

  /**
   * TÜM sayfalardaki .tm-q-item öğelerini sırayla döndürür.
   * Önce ana #sortable-list, sonra extra sayfalar.
   */
  function getAllQuestionItems() {
    var result = [];
    var mainList = document.getElementById("sortable-list");
    if (mainList) {
      mainList.querySelectorAll(".tm-q-item").forEach(function (el) { result.push(el); });
    }
    document.querySelectorAll(".tm-q-extra-list").forEach(function (list) {
      list.querySelectorAll(".tm-q-item").forEach(function (el) { result.push(el); });
    });
    return result;
  }

  /** Aktif şablona uygun bir ek soru sayfası (A4) DOM elementi üretir
   *  YAPI: A4 → flex-col justify-between (sabit yükseklik)
   *        HEADER  (shrink-0)
   *        DIVIDER (shrink-0)
   *        QUESTIONS-WRAPPER (flex-1 min-h-0, scroll) → grid 2 sütun, satırlar auto, items-start
   *        FOOTER  (shrink-0 z-20) - her zaman üstte, sorular altına giremez
   */
  function createExtraQuestionPage() {
    /* A4 sayfa — group sınıfı hover çöp kovası için zorunlu */
    var page = document.createElement("div");
    page.className =
      "tm-q-extra-page relative group mb-8 flex w-full flex-col justify-between overflow-hidden rounded-sm border border-slate-200/80 bg-white shadow-xl shadow-slate-300/40 aspect-[21/29.7] print:w-[210mm] print:h-[297mm] print:shadow-none print:border-none print:m-0 print:p-[12mm_15mm] print:break-after-page print:break-inside-avoid print:bg-white";

    /* Mevcut sayfadan bilgileri al */
    var institutionEl = document.querySelector(".tm-sync-institution");
    var institution   = institutionEl ? institutionEl.textContent.trim() : "KURUM ADI";
    var dateEl        = document.querySelector("#tm-sheet-questions .font-medium.opacity-80");
    var dateText      = dateEl ? dateEl.textContent.trim() : "";
    var dersEl  = document.getElementById("tm-sh-q-ders");
    var ders    = dersEl ? dersEl.textContent.trim() : "";
    var konuEl  = document.getElementById("tm-sh-q-konu");
    var konu    = konuEl ? konuEl.textContent.trim() : "";

    page.innerHTML =
      /* Hayalet çöp kovası: absolute → normal akışı sıfır bozmaz */
      '<button class="tm-delete-page-btn teacher-only-ui absolute top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-400 opacity-0 shadow-sm transition-all duration-300 group-hover:opacity-100 hover:bg-red-500 hover:text-white print:hidden" data-page-type="extra" title="Sayfayı sil" aria-label="Sayfayı sil">' +
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>' +
      '<line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>' +
      /* HEADER: Üst şablon bandı */
      '<div class="tm-tpl-hdr-bg flex shrink-0 items-start justify-between px-5 pb-2 pt-4 text-[11px]">' +
      '<span class="tm-sync-institution font-bold uppercase tracking-wide">' + institution + "</span>" +
      '<span class="font-medium opacity-80">' + dateText + "</span></div>" +
      /* Ders / konu ayırıcı */
      '<div class="tm-tpl-divider border-b px-5 pb-3 pt-2 text-center">' +
      '<p class="tm-tpl-font-head text-sm font-bold text-slate-900">' + ders + "</p>" +
      '<p class="text-xs font-semibold text-slate-800">' + konu + "</p></div>" +
      /* QUESTIONS WRAPPER: içerik yüksekliği gridde auto; taşma kaydırılır */
      '<div class="questions-wrapper relative flex-1 min-h-0 flex flex-col overflow-y-auto overflow-x-hidden">' +
      '<div class="pointer-events-none absolute left-1/2 top-0 bottom-0 w-px bg-slate-200" aria-hidden="true"></div>' +
      '<div class="tm-q-extra-list tm-strict-grid grid grid-cols-2 grid-rows-[auto_auto] items-start gap-x-8 gap-y-4 w-full p-4"></div>' +
      "</div>" +
      /* FOOTER: z-20 ile sorular üzerine asla çıkamaz */
      '<div class="tm-q-footer flex shrink-0 relative z-20 items-center justify-center bg-slate-900 px-6 py-3 text-white">' +
      '<span class="tm-sync-institution font-semibold uppercase tracking-widest text-xs">' + institution + "</span></div>";

    return page;
  }

  /**
   * qPerPage değerine göre grid listesine doğru grid-rows sınıfını atar.
   * Tailwind JIT'e güvenmek yerine sınıfı doğrudan className üzerinden yönetir.
   */
  function applyStrictGridClass(listEl, extraClass) {
    /* 1fr satırlar komşu hücreyi sürdürür; auto + items-start → her kart kendi içerik yüksekliğinde */
    var rowClass = qPerPage === 6 ? "grid-rows-[auto_auto_auto]" : "grid-rows-[auto_auto]";
    listEl.className =
      (extraClass ? extraClass + " " : "") +
      "tm-strict-grid grid grid-cols-2 " + rowClass +
      " items-start gap-x-8 gap-y-4 w-full p-4";
  }

  /**
   * Tüm sorular tek havuzdan alınır, qPerPage'e göre A4 sayfalarına
   * yeniden dağıtılır. Her değişiklikte çağrılır.
   */
  function paginateQuestions() {
    var items       = getAllQuestionItems();
    var mainList    = document.getElementById("sortable-list");
    var extraWrap   = document.getElementById("tm-q-extra-pages");
    if (!mainList || !extraWrap) return;

    /* Tüm mevcut sayfaları temizle */
    while (mainList.firstChild) mainList.removeChild(mainList.firstChild);
    while (extraWrap.firstChild) extraWrap.removeChild(extraWrap.firstChild);

    /* Grid satır sayısını qPerPage'e göre güncelle */
    applyStrictGridClass(mainList);

    /* Kaç ek sayfa gerekiyor? (soru sayısına göre otomatik + kullanıcı ekledi) */
    var autoExtra   = items.length === 0 ? 0 : Math.max(0, Math.ceil(items.length / qPerPage) - 1);
    var totalExtra  = Math.max(autoExtra, manualPages);

    if (items.length === 0 && manualPages === 0) {
      renumerateQuestions();
      return;
    }

    /* İlk sayfa: mevcut #sortable-list */
    var mainEnd = Math.min(qPerPage, items.length);
    for (var i = 0; i < mainEnd; i++) mainList.appendChild(items[i]);

    /* Ek sayfalar */
    for (var p = 0; p < totalExtra; p++) {
      var extraPage = createExtraQuestionPage();
      extraWrap.appendChild(extraPage);
      var extraList = extraPage.querySelector(".tm-q-extra-list");
      applyStrictGridClass(extraList, "tm-q-extra-list");

      var start = (p + 1) * qPerPage;
      var end   = Math.min(start + qPerPage, items.length);
      for (var j = start; j < end; j++) extraList.appendChild(items[j]);

      /* SortableJS — cross-page sürüklemeye izin ver (aynı group) */
      if (window.Sortable && extraList) {
        window.Sortable.create(extraList, {
          animation: 160,
          handle: ".tm-q-handle",
          ghostClass: "opacity-50",
          dragClass: "shadow-md",
          group: "tm-questions",
          onEnd: function () {
            window.setTimeout(paginateQuestions, 0);
          },
        });
      }
    }

    renumerateQuestions();
  }

  /* ── Cevap Anahtarı Tablosu ─────────────────────────────── */

  function syncA4AnswerTable() {
    var col1 = document.getElementById("tm-ak-col-1");
    var col2 = document.getElementById("tm-ak-col-2");
    var col3 = document.getElementById("tm-ak-col-3");
    if (!col1 || !col2 || !col3) return;

    col1.innerHTML = "";
    col2.innerHTML = "";
    col3.innerHTML = "";

    var items = getAllQuestionItems();
    var n = items.length;
    if (n === 0) return;

    var perCol = Math.ceil(n / 3);
    var cols = [col1, col2, col3];

    items.forEach(function (el, i) {
      var num = i + 1;
      var correct = el.getAttribute("data-correct") || "—";
      var colIdx = Math.min(Math.floor(i / perCol), 2);

      var row = document.createElement("div");
      row.className = "flex items-center gap-2 border-b border-gray-100 py-1";
      row.innerHTML =
        '<span class="w-6 shrink-0 text-right text-[10.5px] font-bold tabular-nums text-slate-800">' + num + ".</span>" +
        '<div class="flex-1 self-center border-t border-dashed border-gray-200"></div>' +
        '<span class="w-6 shrink-0 text-center text-sm font-black text-indigo-600">' + correct + "</span>";
      cols[colIdx].appendChild(row);
    });
  }

  function renumerateQuestions() {
    /* Tüm sayfalar dahil — kesintisiz numaralandırma */
    getAllQuestionItems().forEach(function (el, i) {
      var n = i + 1;
      el.setAttribute("data-order", String(n));
      var numEl = el.querySelector(".tm-q-num");
      if (numEl) numEl.textContent = "Soru " + n + ")";
    });
    syncA4AnswerTable();
  }

  function buildChoiceButtonsHtml() {
    var letters = ["A", "B", "C", "D", "E"];
    var parts =
      /* teacher-only-ui → baskı öncesi klondan tamamen kazınır */
      '<div class="teacher-only-ui tm-q-choices mt-2 shrink-0 hidden border-t border-slate-100 pt-2 pb-1 bg-white relative z-10">' +
      '<p class="mb-1.5 text-[10px] font-semibold text-slate-600">Doğru şık</p>' +
      '<div class="tm-q-opt-group flex flex-wrap gap-1" role="group" aria-label="Doğru şık">';
    letters.forEach(function (L) {
      parts +=
        '<button type="button" class="tm-q-opt min-w-[2rem] rounded-md border border-slate-200 bg-white px-2 py-1 text-center text-[11px] font-bold text-slate-600 transition hover:border-emerald-400 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-400" data-letter="' +
        L +
        '">' +
        L +
        "</button>";
    });
    parts += "</div></div>";
    return parts;
  }

  function addQuestionCard(opts) {
    opts = opts || {};
    var list = document.getElementById("sortable-list");
    if (!list) return;

    var qId = "q-" + Date.now();
    var item = document.createElement("div");
    item.className =
      "tm-q-item group relative flex h-fit w-full flex-col overflow-hidden break-inside-avoid rounded-lg border border-transparent transition-all hover:border-slate-200 hover:shadow-sm";
    item.setAttribute("data-q-id", qId);

    var hasImage = !!opts.imageDataUrl;
    /* Görsel: üst başlık (Soru N) ile aynı sol iç boşluk — px-2; ortalama yok, sola dayalı */
    var bodyBlock = hasImage
      ? '<div class="tm-q-img-wrap flex w-full shrink-0 flex-col items-start overflow-visible rounded border border-slate-200 bg-slate-50/80 px-2 py-1">' +
        '<img class="tm-q-image block h-auto w-full max-w-full object-contain object-left" alt="Soru görseli" />' +
        "</div>"
      : '<button type="button" class="tm-q-crop-target flex min-h-[4.5rem] w-full shrink-0 flex-col items-center justify-center rounded border border-dashed border-amber-200/80 bg-slate-50 p-2 text-center text-[10px] font-medium text-slate-500 transition hover:border-amber-400 hover:bg-amber-50/50 focus:outline-none focus:ring-2 focus:ring-amber-300">' +
        "<span>PDF önizlemesinden Soru kırpıcı ile ekleyin</span>" +
        '<span class="mt-1 text-[9px] text-slate-400">+ Soru Ekle ile boş kart da açabilirsiniz</span>' +
        "</button>";

    item.innerHTML =
      /* teacher-only-ui → baskı öncesi klondan tamamen kazınır */
      '<div class="teacher-only-ui absolute right-2 top-2 z-10 hidden items-center gap-1 rounded-md border border-slate-100 bg-white/95 p-0.5 shadow-sm group-hover:flex">' +
      '<button type="button" class="tm-q-handle cursor-grab rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 active:cursor-grabbing" aria-label="Sürükleyerek taşı" title="Taşı">' +
      '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"/></svg>' +
      "</button>" +
      '<button type="button" class="tm-q-delete rounded p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600" aria-label="Soruyu sil" title="Sil">' +
      '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>' +
      "</button></div>" +
      /* Soru no + meta — shrink-0 ile asla küçülmez */
      '<div class="flex flex-wrap items-center justify-between gap-2 shrink-0 rounded-t-md border border-b-0 border-slate-200 bg-slate-100 px-2 py-1.5 text-[11px]">' +
      '<span class="tm-q-num font-bold text-slate-800">Soru 0)</span>' +
      '<span class="tm-q-meta max-w-[65%] truncate rounded-full bg-white px-2 py-0.5 text-[9px] font-medium text-slate-500 ring-1 ring-slate-200/80"></span>' +
      "</div>" +
      /* İçerik alanı: yükseklik içeriğe göre (h-fit), sabit germe yok */
      '<div class="rounded-b-md border border-slate-200 bg-white p-2 flex h-fit flex-col overflow-visible">' +
      bodyBlock +
      buildChoiceButtonsHtml() +
      "</div>";

    list.appendChild(item);
    if (hasImage) {
      var img = item.querySelector(".tm-q-image");
      if (img) img.src = opts.imageDataUrl;
    }
    if (opts.correctLetter) {
      item.setAttribute("data-cropped", "true");
      var ch = item.querySelector(".tm-q-choices");
      if (ch) ch.classList.remove("hidden");
      setChoiceSelection(item, opts.correctLetter);
    } else if (hasImage && opts.fromHavuz) {
      item.setAttribute("data-cropped", "true");
      var ch2 = item.querySelector(".tm-q-choices");
      if (ch2) ch2.classList.remove("hidden");
    }
    syncCanvasFromSelects();
    paginateQuestions();
  }

  /**
   * Seçili kırpma alanını yüksek çözünürlüklü (~216 DPI) data-URL olarak döndürür.
   * Kaynak canvas + sayfa + render ölçekleri parametre ile verilebilir (Gelişmiş Kırpma modalı).
   *
   * @param {DOMRect|{left:number,top:number,width:number,height:number}} frozenMarqueeRect
   * @param {HTMLCanvasElement|null} sourceCanvas
   * @param {number} pageIndex  PDF.js 1-tabanlı sayfa
   * @param {number} renderFinalScale  viewport scale (pdf.js)
   * @param {number} renderDpr  cihaz ölçeği
   * @param {function} callback  (dataUrl: string|null) => void
   */
  function extractPdfRegionToDataUrlExt(
    frozenMarqueeRect,
    sourceCanvas,
    pageIndex,
    renderFinalScale,
    renderDpr,
    callback
  ) {
    if (!sourceCanvas || !pdfJsDocument) {
      return callback(null);
    }
    if (
      sourceCanvas.id === "tm-pdf-canvas" &&
      sourceCanvas.classList.contains("hidden")
    ) {
      return callback(null);
    }
    if (!frozenMarqueeRect || frozenMarqueeRect.width < 4 || frozenMarqueeRect.height < 4) {
      return callback(null);
    }

    var canvasRect = sourceCanvas.getBoundingClientRect();
    var scaleX = sourceCanvas.width / canvasRect.width;
    var scaleY = sourceCanvas.height / canvasRect.height;

    var sourceX = (frozenMarqueeRect.left - canvasRect.left) * scaleX;
    var sourceY = (frozenMarqueeRect.top - canvasRect.top) * scaleY;
    var sourceWidth = frozenMarqueeRect.width * scaleX;
    var sourceHeight = frozenMarqueeRect.height * scaleY;

    var finalX = Math.max(0, Math.min(sourceX, sourceCanvas.width));
    var finalY = Math.max(0, Math.min(sourceY, sourceCanvas.height));
    var finalWidth = Math.max(4, Math.min(sourceWidth, sourceCanvas.width - finalX));
    var finalHeight = Math.max(4, Math.min(sourceHeight, sourceCanvas.height - finalY));

    if (finalWidth < 4 || finalHeight < 4) return callback(null);

    var totalRenderScale = (renderFinalScale || 1) * (renderDpr || 1);
    if (totalRenderScale <= 0) totalRenderScale = 1;

    var pdfLeft = finalX / totalRenderScale;
    var pdfTop = finalY / totalRenderScale;
    var pdfWidth = finalWidth / totalRenderScale;
    var pdfHeight = finalHeight / totalRenderScale;

    var HI_SCALE = 3.0;

    function fallbackCrop() {
      try {
        var fb = document.createElement("canvas");
        fb.width = Math.floor(finalWidth);
        fb.height = Math.floor(finalHeight);
        var fc = fb.getContext("2d");
        fc.imageSmoothingEnabled = true;
        fc.imageSmoothingQuality = "high";
        fc.drawImage(
          sourceCanvas,
          finalX,
          finalY,
          finalWidth,
          finalHeight,
          0,
          0,
          fb.width,
          fb.height
        );
        callback(fb.toDataURL("image/png", 1.0));
      } catch (e) {
        callback(null);
      }
    }

    pdfJsDocument
      .getPage(pageIndex)
      .then(function (page) {
        var rot = typeof page.rotate === "number" ? page.rotate : 0;
        var hiViewport = page.getViewport({ scale: HI_SCALE, rotation: rot });

        var hiCanvas = document.createElement("canvas");
        hiCanvas.width = Math.ceil(hiViewport.width);
        hiCanvas.height = Math.ceil(hiViewport.height);

        var hiCtx = hiCanvas.getContext("2d", { alpha: false });
        hiCtx.fillStyle = "#ffffff";
        hiCtx.fillRect(0, 0, hiCanvas.width, hiCanvas.height);

        return page.render({ canvasContext: hiCtx, viewport: hiViewport }).promise.then(function () {
          var hx = Math.floor(pdfLeft * HI_SCALE);
          var hy = Math.floor(pdfTop * HI_SCALE);
          var hw = Math.ceil(pdfWidth * HI_SCALE);
          var hh = Math.ceil(pdfHeight * HI_SCALE);

          hx = Math.max(0, Math.min(hx, hiCanvas.width));
          hy = Math.max(0, Math.min(hy, hiCanvas.height));
          hw = Math.max(4, Math.min(hw, hiCanvas.width - hx));
          hh = Math.max(4, Math.min(hh, hiCanvas.height - hy));

          var cropCanvas = document.createElement("canvas");
          cropCanvas.width = hw;
          cropCanvas.height = hh;

          var ctx = cropCanvas.getContext("2d");
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";

          ctx.drawImage(hiCanvas, hx, hy, hw, hh, 0, 0, hw, hh);

          try {
            callback(cropCanvas.toDataURL("image/png", 1.0));
          } catch (e) {
            fallbackCrop();
          }
        });
      })
      .catch(function () {
        fallbackCrop();
      });
  }

  /**
   * Sağ önizleme canvas'ından kırpma (mevcut davranış — pdfPageIndex + pdfRender* kullanır).
   */
  function extractPdfRegionToDataUrl(frozenMarqueeRect, callback) {
    extractPdfRegionToDataUrlExt(
      frozenMarqueeRect,
      document.getElementById("tm-pdf-canvas"),
      pdfPageIndex,
      pdfRenderFinalScale,
      pdfRenderDpr,
      callback
    );
  }

  function cancelStudioPdfRenderTask() {
    if (studioPdfRenderTask && studioPdfRenderTask.cancel) {
      try {
        studioPdfRenderTask.cancel();
      } catch (e) {}
    }
    studioPdfRenderTask = null;
  }

  function hideStudioMarquee() {
    var mq = document.getElementById("tm-crop-studio-marquee");
    if (mq) {
      mq.classList.add("hidden");
      mq.style.display = "none";
      mq.style.width = "0px";
      mq.style.height = "0px";
    }
  }

  function syncCropStudioChromeUi() {
    var prev = document.getElementById("tm-studio-page-prev");
    var next = document.getElementById("tm-studio-page-next");
    var num = document.getElementById("tm-studio-page-num");
    var tot = document.getElementById("tm-studio-page-total");
    var zlab = document.getElementById("tm-studio-zoom-label");
    if (zlab) zlab.textContent = "%" + Math.round(studioPdfUserZoom * 100);

    if (!pdfJsDocument || pdfTotalPages === 0) {
      if (num) {
        num.value = "";
        num.disabled = true;
      }
      if (tot) tot.textContent = "—";
      if (prev) prev.disabled = true;
      if (next) next.disabled = true;
      return;
    }
    if (num) {
      num.disabled = false;
      num.setAttribute("min", "1");
      num.setAttribute("max", String(pdfTotalPages));
      num.value = String(studioPdfPageIndexFrozen);
    }
    if (tot) tot.textContent = String(pdfTotalPages);
    if (prev) prev.disabled = studioPdfPageIndexFrozen <= 1;
    if (next) next.disabled = studioPdfPageIndexFrozen >= pdfTotalPages;
  }

  /** Stüdyo sayfa input — Enter / blur */
  function commitCropStudioPageInput() {
    var ov = document.getElementById("tm-crop-studio-overlay");
    if (!ov || !ov.classList.contains("is-open")) return;
    var inp = document.getElementById("tm-studio-page-num");
    if (!inp || !pdfJsDocument || pdfTotalPages === 0) return;
    var raw = String(inp.value != null ? inp.value : "").trim();
    if (raw === "") {
      inp.value = String(studioPdfPageIndexFrozen);
      return;
    }
    var n = parseInt(raw, 10);
    if (!isFinite(n) || isNaN(n)) {
      inp.value = String(studioPdfPageIndexFrozen);
      return;
    }
    var clamped = Math.max(1, Math.min(pdfTotalPages, n));
    studioPdfPageIndexFrozen = clamped;
    hideStudioMarquee();
    syncCropStudioChromeUi();
    renderStudioPdfPage(null);
  }

  function renderStudioPdfPage(done) {
    cancelStudioPdfRenderTask();
    var canvas = document.getElementById("tm-crop-studio-canvas");
    var body = document.getElementById("tm-crop-studio-body");
    if (!canvas || !body || !pdfJsDocument) {
      syncCropStudioChromeUi();
      if (done) done();
      return;
    }

    var myGen = ++studioPdfRenderGen;
    var maxW = Math.max(480, (body.clientWidth || body.offsetWidth) - 24);
    var maxH = Math.max(400, (body.clientHeight || body.offsetHeight) - 16);

    pdfJsDocument
      .getPage(studioPdfPageIndexFrozen)
      .then(function (page) {
        if (myGen !== studioPdfRenderGen) return;

        var rot = typeof page.rotate === "number" ? page.rotate : 0;
        var base = page.getViewport({ scale: 1, rotation: rot });
        var fitW = maxW / base.width;
        var fitH = maxH / base.height;
        /* Sayfayı görünür alana sığdıran taban ölçek (contain) */
        var fitContain = Math.min(fitW, fitH);
        var zoom = Math.max(0.5, Math.min(4.0, studioPdfUserZoom));
        studioPdfUserZoom = zoom;
        var finalScale = fitContain * zoom;
        var viewport = page.getViewport({ scale: finalScale, rotation: rot });

        var maxBuf = 8192;
        if (viewport.width > maxBuf || viewport.height > maxBuf) {
          var shrink = maxBuf / Math.max(viewport.width, viewport.height);
          finalScale *= shrink;
          viewport = page.getViewport({ scale: finalScale, rotation: rot });
        }

        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var bufW = Math.max(1, Math.floor(viewport.width * dpr));
        var bufH = Math.max(1, Math.floor(viewport.height * dpr));

        if (canvas.width !== bufW) canvas.width = bufW;
        if (canvas.height !== bufH) canvas.height = bufH;
        canvas.style.width = Math.floor(viewport.width) + "px";
        canvas.style.height = Math.floor(viewport.height) + "px";

        var ctx = canvas.getContext("2d", { alpha: false });
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, bufW, bufH);

        studioPdfRenderFinalScale = finalScale;
        studioPdfRenderDpr = dpr;

        var renderOpts = { canvasContext: ctx, viewport: viewport };
        if (dpr !== 1) renderOpts.transform = [dpr, 0, 0, dpr, 0, 0];

        var renderTask = page.render(renderOpts);
        studioPdfRenderTask = renderTask;

        return renderTask.promise.then(
          function () {
            if (myGen !== studioPdfRenderGen) return;
            if (studioPdfRenderTask === renderTask) studioPdfRenderTask = null;
            hideStudioMarquee();
            syncCropStudioChromeUi();
            if (done) done();
          },
          function () {
            if (studioPdfRenderTask === renderTask) studioPdfRenderTask = null;
          }
        );
      })
      .catch(function (e) {
        if (myGen === studioPdfRenderGen) console.error("Crop studio render:", e);
        syncCropStudioChromeUi();
        if (done) done();
      });
  }

  function closeCropStudioModal() {
    var overlay = document.getElementById("tm-crop-studio-overlay");
    if (overlay) {
      overlay.classList.remove("is-open");
      overlay.setAttribute("aria-hidden", "true");
    }
    try {
      document.body.style.overflow = "";
    } catch (e) {}
    cancelStudioPdfRenderTask();
    ++studioPdfRenderGen;
    hideStudioMarquee();
    try {
      if (pdfJsDocument && pdfTotalPages > 0) {
        pdfPageIndex = studioPdfPageIndexFrozen;
        syncPdfControlsUi();
        renderCurrentPdfPage();
      }
    } catch (eSync) {}
    var c = document.getElementById("tm-crop-studio-canvas");
    if (c) {
      var x = c.getContext("2d");
      if (x && c.width && c.height) x.clearRect(0, 0, c.width, c.height);
      c.width = 0;
      c.height = 0;
      c.style.width = "";
      c.style.height = "";
    }
  }

  function openCropStudioModal() {
    if (!pdfJsDocument || pdfTotalPages < 1) return;
    var empty = document.getElementById("tm-pdf-preview-empty");
    if (empty && !empty.classList.contains("hidden")) return;

    studioPdfPageIndexFrozen = pdfPageIndex;
    studioPdfUserZoom = 1.0;
    var overlay = document.getElementById("tm-crop-studio-overlay");
    if (!overlay) return;
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    syncCropStudioChromeUi();
    try {
      document.body.style.overflow = "hidden";
    } catch (e) {}

    window.requestAnimationFrame(function () {
      renderStudioPdfPage(null);
    });
  }

  function initCropStudio() {
    var btn = document.getElementById("tm-btn-crop-studio");
    var overlay = document.getElementById("tm-crop-studio-overlay");
    var stage = document.getElementById("tm-crop-studio-stage");
    var marquee = document.getElementById("tm-crop-studio-marquee");
    var closeBtn = document.getElementById("tm-crop-studio-close");
    var clearBtn = document.getElementById("tm-crop-studio-clear");
    var okBtn = document.getElementById("tm-crop-studio-confirm");
    if (!btn || !overlay || !stage || !marquee) return;

    var drawing = false;
    var sx = 0;
    var sy = 0;

    function pageXY(e) {
      var r = stage.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    function clearSelection() {
      drawing = false;
      hideStudioMarquee();
    }

    btn.addEventListener("click", function () {
      if (btn.disabled) return;
      openCropStudioModal();
    });

    var backdrop = document.getElementById("tm-crop-studio-backdrop");
    if (backdrop) {
      backdrop.addEventListener("click", function () {
        closeCropStudioModal();
      });
    }
    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        closeCropStudioModal();
      });
    }
    if (clearBtn) {
      clearBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        clearSelection();
      });
    }

    var stPrev = document.getElementById("tm-studio-page-prev");
    var stNext = document.getElementById("tm-studio-page-next");
    var stNum = document.getElementById("tm-studio-page-num");
    var stZoomOut = document.getElementById("tm-studio-zoom-out");
    var stZoomIn = document.getElementById("tm-studio-zoom-in");
    var stZoomFit = document.getElementById("tm-studio-zoom-fit");
    if (stPrev) {
      stPrev.addEventListener("click", function (e) {
        e.stopPropagation();
        if (!pdfJsDocument || studioPdfPageIndexFrozen <= 1) return;
        studioPdfPageIndexFrozen -= 1;
        hideStudioMarquee();
        syncCropStudioChromeUi();
        renderStudioPdfPage(null);
      });
    }
    if (stNext) {
      stNext.addEventListener("click", function (e) {
        e.stopPropagation();
        if (!pdfJsDocument || studioPdfPageIndexFrozen >= pdfTotalPages) return;
        studioPdfPageIndexFrozen += 1;
        hideStudioMarquee();
        syncCropStudioChromeUi();
        renderStudioPdfPage(null);
      });
    }
    if (stNum && stNum.tagName === "INPUT") {
      stNum.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          stNum.blur();
        }
      });
      stNum.addEventListener("blur", function () {
        if (!overlay.classList.contains("is-open")) return;
        commitCropStudioPageInput();
      });
    }
    function bumpStudioZoom(delta) {
      studioPdfUserZoom = Math.max(
        0.5,
        Math.min(4.0, Math.round((studioPdfUserZoom + delta) * 10) / 10)
      );
      hideStudioMarquee();
      renderStudioPdfPage(null);
    }
    if (stZoomOut) {
      stZoomOut.addEventListener("click", function (e) {
        e.stopPropagation();
        bumpStudioZoom(-0.1);
      });
    }
    if (stZoomIn) {
      stZoomIn.addEventListener("click", function (e) {
        e.stopPropagation();
        bumpStudioZoom(0.1);
      });
    }
    if (stZoomFit) {
      stZoomFit.addEventListener("click", function (e) {
        e.stopPropagation();
        studioPdfUserZoom = 1.0;
        hideStudioMarquee();
        renderStudioPdfPage(null);
      });
    }

    if (okBtn) {
      okBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        var canvas = document.getElementById("tm-crop-studio-canvas");
        if (!canvas || !canvas.width) {
          window.alert("PDF yüklenemedi. Modalı kapatıp tekrar deneyin.");
          return;
        }
        if (marquee.classList.contains("hidden")) {
          window.alert("Lütfen önce fareyle bir alan seçin.");
          return;
        }
        var rw = parseFloat(marquee.style.width) || 0;
        var rh = parseFloat(marquee.style.height) || 0;
        if (rw < 12 || rh < 12) {
          window.alert("Seçim çok küçük. Daha geniş bir dikdörtgen çizin.");
          return;
        }
        var frozen = marquee.getBoundingClientRect();
        extractPdfRegionToDataUrlExt(
          frozen,
          canvas,
          studioPdfPageIndexFrozen,
          studioPdfRenderFinalScale,
          studioPdfRenderDpr,
          function (dataUrl) {
            if (!dataUrl) {
              window.alert("Kırpma oluşturulamadı. Alanı genişletip tekrar deneyin.");
              return;
            }
            addQuestionCard({ imageDataUrl: dataUrl, fromHavuz: true });
            var list = document.getElementById("sortable-list");
            var last = list && list.querySelector(".tm-q-item:last-child");
            if (last && last.scrollIntoView) {
              last.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
            closeCropStudioModal();
          }
        );
      });
    }

    stage.addEventListener(
      "mousedown",
      function (e) {
        if (!overlay.classList.contains("is-open")) return;
        if (e.button !== 0) return;
        e.preventDefault();
        clearSelection();
        drawing = true;
        var p = pageXY(e);
        sx = p.x;
        sy = p.y;
        marquee.classList.remove("hidden");
        marquee.style.display = "block";
        marquee.style.left = sx + "px";
        marquee.style.top = sy + "px";
        marquee.style.width = "0px";
        marquee.style.height = "0px";
      },
      true
    );

    window.addEventListener(
      "mousemove",
      function (e) {
        if (!drawing || !overlay.classList.contains("is-open")) return;
        var p = pageXY(e);
        var x = Math.min(sx, p.x);
        var y = Math.min(sy, p.y);
        var w = Math.abs(p.x - sx);
        var h = Math.abs(p.y - sy);
        marquee.style.left = x + "px";
        marquee.style.top = y + "px";
        marquee.style.width = w + "px";
        marquee.style.height = h + "px";
      },
      { passive: true }
    );

    window.addEventListener("mouseup", function () {
      if (!drawing) return;
      drawing = false;
      if (!overlay.classList.contains("is-open")) return;
      var rw = parseFloat(marquee.style.width) || 0;
      var rh = parseFloat(marquee.style.height) || 0;
      if (rw < 12 || rh < 12) {
        hideStudioMarquee();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (!overlay || !overlay.classList.contains("is-open")) return;
      if (e.key === "Escape") {
        e.preventDefault();
        closeCropStudioModal();
        return;
      }
      var ae = document.activeElement;
      var tag = ae && ae.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        bumpStudioZoom(0.1);
        return;
      }
      if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        bumpStudioZoom(-0.1);
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        if (!pdfJsDocument || studioPdfPageIndexFrozen <= 1) return;
        e.preventDefault();
        studioPdfPageIndexFrozen -= 1;
        hideStudioMarquee();
        syncCropStudioChromeUi();
        renderStudioPdfPage(null);
        return;
      }
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        if (!pdfJsDocument || studioPdfPageIndexFrozen >= pdfTotalPages) return;
        e.preventDefault();
        studioPdfPageIndexFrozen += 1;
        hideStudioMarquee();
        syncCropStudioChromeUi();
        renderStudioPdfPage(null);
      }
    });

    var rz = null;
    window.addEventListener(
      "resize",
      function () {
        if (!overlay.classList.contains("is-open")) return;
        window.clearTimeout(rz);
        rz = window.setTimeout(function () {
          if (!overlay.classList.contains("is-open")) return;
          renderStudioPdfPage(null);
        }, 200);
      },
      { passive: true }
    );

    var studioBody = document.getElementById("tm-crop-studio-body");
    if (studioBody) {
      studioBody.addEventListener(
        "wheel",
        function (e) {
          if (!overlay.classList.contains("is-open")) return;
          if (!e.ctrlKey && !e.metaKey) return;
          e.preventDefault();
          bumpStudioZoom(e.deltaY < 0 ? 0.12 : -0.12);
        },
        { passive: false }
      );
    }
  }

  function syncPdfCropFloaterLetters() {
    var floater = document.getElementById("tm-pdf-crop-floater");
    if (!floater) return;
    floater.querySelectorAll(".tm-pdf-crop-letter").forEach(function (b) {
      var L = b.getAttribute("data-letter");
      var on = L === pdfCropSelectedLetter;
      b.classList.toggle("border-amber-400", on);
      b.classList.toggle("bg-amber-400", on);
      b.classList.toggle("text-white", on);
      b.classList.toggle("ring-2", on);
      b.classList.toggle("ring-amber-300", on);
      b.classList.toggle("border-slate-200", !on);
      b.classList.toggle("bg-slate-100", !on);
      b.classList.toggle("text-slate-700", !on);
    });
    var ok = document.getElementById("tm-pdf-crop-ok");
    if (ok) ok.disabled = !pdfCropSelectedLetter;
  }

  function positionPdfCropFloater() {
    var wrap = document.getElementById("tm-pdf-canvas-wrap");
    var marquee = document.getElementById("tm-pdf-crop-marquee");
    var floater = document.getElementById("tm-pdf-crop-floater");
    if (!wrap || !marquee || !floater || marquee.classList.contains("hidden")) return;

    floater.classList.remove("hidden");
    floater.style.position = "fixed";
    var wr = wrap.getBoundingClientRect();
    var mr = marquee.getBoundingClientRect();
    var gap = 8;
    floater.style.visibility = "hidden";
    floater.style.display = "flex";
    var fh = floater.offsetHeight || 80;
    floater.style.visibility = "";
    var cx = mr.left + mr.width / 2;
    var placeTop = mr.bottom + gap;
    if (placeTop + fh > wr.bottom - 6) {
      placeTop = Math.max(wr.top + 6, mr.top - fh - gap);
    }
    placeTop = Math.max(wr.top + 4, Math.min(wr.bottom - fh - 4, placeTop));
    var maxW = Math.max(160, Math.min(wr.width - 16, 320));
    floater.style.left = cx + "px";
    floater.style.top = placeTop + "px";
    floater.style.transform = "translateX(-50%)";
    floater.style.maxWidth = maxW + "px";
  }

  function attachCropHandleDots(marquee) {
    if (!marquee) return;
    marquee.querySelectorAll(".tm-crop-hdl").forEach(function (n) {
      if (n.parentNode) n.parentNode.removeChild(n);
    });
    var spots = [
      { l: "0", t: "0" },
      { l: "50%", t: "0" },
      { l: "100%", t: "0" },
      { l: "100%", t: "50%" },
      { l: "100%", t: "100%" },
      { l: "50%", t: "100%" },
      { l: "0", t: "100%" },
      { l: "0", t: "50%" },
    ];
    spots.forEach(function (p) {
      var h = document.createElement("span");
      h.className = "tm-crop-hdl";
      h.setAttribute("aria-hidden", "true");
      h.style.cssText =
        "pointer-events:none;position:absolute;z-index:2;width:8px;height:8px;transform:translate(-50%,-50%);border-radius:2px;border:1px solid #fff;background:#94a3b8;box-shadow:0 1px 2px rgba(0,0,0,0.2);";
      h.style.left = p.l;
      h.style.top = p.t;
      marquee.appendChild(h);
    });
  }

  function hidePdfCropUi() {
    var marquee = document.getElementById("tm-pdf-crop-marquee");
    var floater = document.getElementById("tm-pdf-crop-floater");
    pdfCropSelectedLetter = null;
    if (marquee) {
      marquee.classList.add("hidden");
      marquee.style.display = "none";
      marquee.querySelectorAll(".tm-crop-hdl").forEach(function (n) {
        if (n.parentNode) n.parentNode.removeChild(n);
      });
    }
    if (floater) {
      floater.classList.add("hidden");
      floater.style.cssText = "";
    }
    syncPdfCropFloaterLetters();
  }

  function confirmPdfCropSelection() {
    if (!pdfCropSelectedLetter) return;
    var letter = pdfCropSelectedLetter;

    /* KRİTİK: Marquee'nin ekran koordinatlarını UI gizlenmeden ÖNCE kaydet.
       hidePdfCropUi() → display:none → getBoundingClientRect() sıfır döner;
       bu yüzden rect'i burada donduruyoruz. */
    var marquee = document.getElementById("tm-pdf-crop-marquee");
    var frozenRect = marquee ? marquee.getBoundingClientRect() : null;

    /* UI'ı hemen kapat; arka planda hi-res kırpma başlasın */
    hidePdfCropUi();

    extractPdfRegionToDataUrl(frozenRect, function (dataUrl) {
      if (!dataUrl) {
        window.alert("Kırpma alanı çok küçük veya geçersiz. Lütfen PDF üzerinde daha geniş bir alan seçip tekrar deneyin.");
        return;
      }
      addQuestionCard({ imageDataUrl: dataUrl, correctLetter: letter });
      var list = document.getElementById("sortable-list");
      var last = list && list.querySelector(".tm-q-item:last-child");
      if (last && last.scrollIntoView) {
        last.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
  }

  function initSortable() {
    var el = document.getElementById("sortable-list");
    if (!el || typeof window.Sortable === "undefined") return;

    sortableInstance = window.Sortable.create(el, {
      animation: 160,
      handle: ".tm-q-handle",
      ghostClass: "opacity-50",
      dragClass: "shadow-md",
      group: "tm-questions",        /* Extra sayfalarla cross-page sürükleme */
      onEnd: function () {
        window.setTimeout(paginateQuestions, 0);
      },
    });
  }

  function removeQuestionCardAnimated(item) {
    if (!item || !item.parentNode) return;
    item.style.transition = "opacity 0.22s ease, transform 0.22s ease";
    item.style.opacity = "0";
    item.style.transform = "scale(0.98)";
    window.setTimeout(function () {
      if (item.parentNode) item.parentNode.removeChild(item);
      paginateQuestions();
    }, 220);
  }

  function setChoiceSelection(card, letter) {
    var group = card.querySelector(".tm-q-opt-group");
    if (!group) return;
    group.querySelectorAll(".tm-q-opt").forEach(function (b) {
      var L = b.getAttribute("data-letter");
      var on = L === letter;
      b.classList.toggle("border-emerald-500", on);
      b.classList.toggle("bg-emerald-50", on);
      b.classList.toggle("text-emerald-800", on);
      b.classList.toggle("border-slate-200", !on);
      b.classList.toggle("bg-white", !on);
      b.classList.toggle("text-slate-600", !on);
    });
    card.setAttribute("data-correct", letter);
    syncA4AnswerTable();
  }

  function initQuestionInteractions() {
    var list = document.getElementById("sortable-list");
    if (!list) return;

    list.addEventListener("click", function (e) {
      var del = e.target.closest ? e.target.closest(".tm-q-delete") : null;
      if (del && list.contains(del)) {
        e.preventDefault();
        var cardDel = del.closest(".tm-q-item");
        if (cardDel) removeQuestionCardAnimated(cardDel);
        return;
      }

      var opt = e.target.closest ? e.target.closest(".tm-q-opt") : null;
      if (opt && list.contains(opt)) {
        e.preventDefault();
        var card = opt.closest(".tm-q-item");
        if (!card || card.getAttribute("data-cropped") !== "true") return;
        var L = opt.getAttribute("data-letter");
        if (L) setChoiceSelection(card, L);
        return;
      }

      var cropTarget = e.target.closest ? e.target.closest(".tm-q-crop-target") : null;
      if (cropTarget && list.contains(cropTarget)) {
        var card = cropTarget.closest(".tm-q-item");
        var cropBtn = document.getElementById("tm-btn-crop");
        if (!card || !cropBtn || cropBtn.getAttribute("aria-pressed") !== "true") {
          return;
        }
        e.preventDefault();
        card.setAttribute("data-cropped", "true");
        cropTarget.classList.remove("border-dashed", "border-amber-200/80");
        cropTarget.classList.add("border border-emerald-200", "bg-emerald-50/30");
        cropTarget.innerHTML =
          '<span class="text-[10px] font-medium text-emerald-800">Kırpma kaydedildi · doğru şıkkı seçin</span>';
        var ch = card.querySelector(".tm-q-choices");
        if (ch) ch.classList.remove("hidden");
      }
    });
  }

  function initCropMode() {
    var btn = document.getElementById("tm-btn-crop");
    var pdfPanel = document.getElementById("tm-pdf-preview-panel");
    var wrap = document.getElementById("tm-pdf-canvas-wrap");
    var hint = document.getElementById("tm-pdf-crop-hint");
    var marquee = document.getElementById("tm-pdf-crop-marquee");
    var floater = document.getElementById("tm-pdf-crop-floater");
    var panBtn = document.getElementById("tm-btn-pan");
    if (!btn || !pdfPanel || !wrap) return;

    var drawing = false;
    var sx = 0;
    var sy = 0;

    function sync() {
      var on = btn.getAttribute("aria-pressed") === "true";
      btn.classList.toggle("bg-amber-50", on);
      btn.classList.toggle("text-amber-600", on);
      btn.classList.toggle("ring-2", on);
      btn.classList.toggle("ring-amber-300", on);
      btn.classList.toggle("text-slate-500", !on);
      pdfPanel.classList.toggle("ring-2", on);
      pdfPanel.classList.toggle("ring-amber-400", on);
      pdfPanel.classList.toggle("ring-offset-1", on);
      if (hint) hint.classList.toggle("hidden", !on);
      wrap.classList.toggle("select-none", on);
      wrap.classList.toggle("cursor-crosshair", on);
      if (!on) {
        wrap.classList.remove("cursor-crosshair");
        hidePdfCropUi();
      }
    }

    syncCropModeFn = sync;

    btn.addEventListener("click", function () {
      var on = btn.getAttribute("aria-pressed") !== "true";
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      if (on && panBtn && panBtn.getAttribute("aria-pressed") === "true") {
        panBtn.setAttribute("aria-pressed", "false");
        if (typeof syncPanModeFn === "function") syncPanModeFn();
      }
      sync();
    });
    sync();

    if (floater) {
      floater.addEventListener("mousedown", function (e) {
        e.stopPropagation();
      });
      floater.addEventListener("click", function (e) {
        e.stopPropagation();
      });
      floater.querySelectorAll(".tm-pdf-crop-letter").forEach(function (b) {
        b.addEventListener("click", function () {
          var L = b.getAttribute("data-letter");
          pdfCropSelectedLetter = L || null;
          syncPdfCropFloaterLetters();
        });
      });
      var okBtn = document.getElementById("tm-pdf-crop-ok");
      if (okBtn) {
        okBtn.addEventListener("click", function () {
          if (!pdfCropSelectedLetter) return;
          confirmPdfCropSelection();
        });
      }
      var cancelBtn = document.getElementById("tm-pdf-crop-cancel");
      if (cancelBtn) {
        cancelBtn.addEventListener("click", function () {
          hidePdfCropUi();
        });
      }
    }

    function pageXY(e) {
      var panInner = document.getElementById("tm-pdf-pan-inner");
      var node = panInner || wrap;
      var r = node.getBoundingClientRect();
      return {
        x: e.clientX - r.left,
        y: e.clientY - r.top,
      };
    }

    wrap.addEventListener(
      "mousedown",
      function (e) {
        if (btn.getAttribute("aria-pressed") !== "true") return;
        if (!pdfJsDocument) return;
        var empty = document.getElementById("tm-pdf-preview-empty");
        if (empty && !empty.classList.contains("hidden")) return;
        if (e.button !== 0) return;
        if (e.target.closest && e.target.closest("#tm-pdf-crop-floater")) return;
        if (floater && !floater.classList.contains("hidden") && marquee && !marquee.classList.contains("hidden")) {
          var pKeep = pageXY(e);
          var ml = parseFloat(marquee.style.left) || 0;
          var mt = parseFloat(marquee.style.top) || 0;
          var mw = parseFloat(marquee.style.width) || 0;
          var mh = parseFloat(marquee.style.height) || 0;
          if (pKeep.x >= ml && pKeep.x <= ml + mw && pKeep.y >= mt && pKeep.y <= mt + mh) {
            return;
          }
        }
        e.preventDefault();
        e.stopPropagation();
        hidePdfCropUi();
        drawing = true;
        pdfCropDragActive = true;
        var p = pageXY(e);
        sx = p.x;
        sy = p.y;
        if (marquee) {
          marquee.classList.remove("hidden");
          marquee.style.display = "block";
          marquee.style.left = sx + "px";
          marquee.style.top = sy + "px";
          marquee.style.width = "0px";
          marquee.style.height = "0px";
        }
      },
      true
    );

    window.addEventListener(
      "mousemove",
      function (e) {
        if (!drawing || !marquee) return;
        var p = pageXY(e);
        var x = Math.min(sx, p.x);
        var y = Math.min(sy, p.y);
        var w = Math.abs(p.x - sx);
        var h = Math.abs(p.y - sy);
        marquee.style.left = x + "px";
        marquee.style.top = y + "px";
        marquee.style.width = w + "px";
        marquee.style.height = h + "px";
      },
      { passive: true }
    );

    window.addEventListener("mouseup", function () {
      if (!drawing) return;
      drawing = false;
      pdfCropDragActive = false;
      if (!marquee || btn.getAttribute("aria-pressed") !== "true") return;
      var rw = parseFloat(marquee.style.width) || 0;
      var rh = parseFloat(marquee.style.height) || 0;
      if (rw < 12 || rh < 12) {
        hidePdfCropUi();
        return;
      }
      attachCropHandleDots(marquee);
      pdfCropSelectedLetter = null;
      syncPdfCropFloaterLetters();
      window.requestAnimationFrame(function () {
        positionPdfCropFloater();
        window.requestAnimationFrame(function () {
          positionPdfCropFloater();
        });
      });
    });

    var resizeT = null;
    window.addEventListener(
      "resize",
      function () {
        var f = document.getElementById("tm-pdf-crop-floater");
        if (!f || f.classList.contains("hidden")) return;
        window.clearTimeout(resizeT);
        resizeT = window.setTimeout(function () {
          positionPdfCropFloater();
        }, 80);
      },
      { passive: true }
    );

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      var f = document.getElementById("tm-pdf-crop-floater");
      if (f && !f.classList.contains("hidden")) {
        e.preventDefault();
        hidePdfCropUi();
      }
    });
  }

  function initPanMode() {
    var btn     = document.getElementById("tm-btn-pan");
    var wrap    = document.getElementById("tm-pdf-canvas-wrap");
    var cropBtn = document.getElementById("tm-btn-crop");
    if (!btn || !wrap) return;

    var isDown    = false;
    var startX    = 0;
    var startY    = 0;
    var originPanX = 0;
    var originPanY = 0;

    function active() {
      return btn.getAttribute("aria-pressed") === "true";
    }

    function syncClasses() {
      var on = active();
      btn.classList.toggle("bg-indigo-50",    on);
      btn.classList.toggle("text-indigo-600", on);
      btn.classList.toggle("ring-2",          on);
      btn.classList.toggle("ring-indigo-300", on);
      btn.classList.toggle("text-slate-500",  !on);
      /* Cursor ve metin seçimi: grab ↔ grabbing ↔ default */
      wrap.style.cursor     = on ? (isDown ? "grabbing" : "grab") : "";
      wrap.style.userSelect = on ? "none" : "";
    }

    syncPanModeFn = syncClasses;

    btn.addEventListener("click", function () {
      var on = btn.getAttribute("aria-pressed") !== "true";
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      /* Pan açıldığında crop modu kapat */
      if (on && cropBtn && cropBtn.getAttribute("aria-pressed") === "true") {
        cropBtn.setAttribute("aria-pressed", "false");
        if (typeof syncCropModeFn === "function") syncCropModeFn();
      }
      /* Drag ortasında mod kapatıldıysa temizle */
      if (!on && isDown) { isDown = false; }
      syncClasses();
    });
    syncClasses();

    /* ── Pointer Capture ile takılmayan sürükleme ──────────────────────────
       setPointerCapture: parmak/fare wrap'ın dışına çıksa bile tüm
       pointer olayları wrap'a yönlendirilir → "fare takılma" hatası olmaz.
       pointercancel (Alt+Tab, sistem olayı vb.) de yakalanır. */

    wrap.addEventListener("pointerdown", function (e) {
      if (!active()) return;
      if (e.button !== 0) return;
      if (cropBtn && cropBtn.getAttribute("aria-pressed") === "true") return;

      e.preventDefault();
      try { wrap.setPointerCapture(e.pointerId); } catch (_) {}

      isDown     = true;
      startX     = e.clientX;
      startY     = e.clientY;
      originPanX = pdfPanX;
      originPanY = pdfPanY;
      syncClasses();
    });

    wrap.addEventListener("pointermove", function (e) {
      if (!isDown || !active()) return;
      /* Smoothness: requestAnimationFrame gereksiz, pointer event zaten
         display refresh rate'e kilitli modern tarayıcılarda */
      pdfPanX = originPanX + (e.clientX - startX);
      pdfPanY = originPanY + (e.clientY - startY);
      applyPdfPanTransform();
    });

    function endPan(e) {
      if (!isDown) return;
      try { wrap.releasePointerCapture(e.pointerId); } catch (_) {}
      isDown = false;
      syncClasses();
    }

    wrap.addEventListener("pointerup",     endPan);
    wrap.addEventListener("pointercancel", endPan); /* Alt+Tab / sistem kesintisi */
  }

  function updateCanvasScaleWrap() {
    var canvas = document.getElementById("tm-pdf-canvas");
    var host   = document.getElementById("tm-canvas-size-host");
    var sWrap  = document.getElementById("tm-canvas-scale-wrap");
    if (!host || !sWrap) return;

    /* CSS transform tamamen kaldırıldı — zoom artık PDF.js re-render ile yapılır */
    sWrap.style.transform = "none";

    var hidden = !canvas || canvas.classList.contains("hidden");
    if (hidden) {
      host.style.width  = "1px";
      host.style.height = "1px";
      return;
    }

    /* Host boyutunu canvas'ın CSS (mantıksal piksel) boyutuna eşitle */
    var nw = parseFloat(canvas.style.width)  || canvas.offsetWidth  || 0;
    var nh = parseFloat(canvas.style.height) || canvas.offsetHeight || 0;
    host.style.width  = Math.round(nw) + "px";
    host.style.height = Math.round(nh) + "px";

    syncPdfControlsUi();
  }

  /* Zoom değiştiğinde CSS scale yerine PDF.js'i yeni ölçekte tekrar çiz */
  function applyZoom() {
    renderCurrentPdfPage();
  }

  function initZoom() {
    var out = document.getElementById("tm-zoom-out");
    var inn = document.getElementById("tm-zoom-in");
    if (!out || !inn) return;
    out.addEventListener("click", function () {
      pdfUserScale = Math.max(0.5, Math.round((pdfUserScale - 0.1) * 10) / 10);
      applyZoom();
    });
    inn.addEventListener("click", function () {
      pdfUserScale = Math.min(3.0, Math.round((pdfUserScale + 0.1) * 10) / 10);
      applyZoom();
    });
    syncPdfControlsUi();
  }

  function initPageNav() {
    var prev = document.getElementById("tm-page-prev");
    var next = document.getElementById("tm-page-next");
    var num = document.getElementById("tm-page-num");
    if (!prev || !next) return;
    prev.addEventListener("click", function () {
      if (!pdfJsDocument || pdfPageIndex <= 1) return;
      pdfPageIndex -= 1;
      syncPdfControlsUi();
      renderCurrentPdfPage();
    });
    next.addEventListener("click", function () {
      if (!pdfJsDocument || pdfPageIndex >= pdfTotalPages) return;
      pdfPageIndex += 1;
      syncPdfControlsUi();
      renderCurrentPdfPage();
    });
    if (num && num.tagName === "INPUT") {
      num.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          num.blur();
        }
      });
      num.addEventListener("blur", function () {
        commitPdfPageFromInput();
      });
    }
  }

  function initPdfPreviewResize() {
    var t = null;
    window.addEventListener(
      "resize",
      function () {
        if (!pdfJsDocument) return;
        if (pdfCropDragActive) return;
        window.clearTimeout(t);
        t = window.setTimeout(function () {
          if (pdfCropDragActive) return;
          renderCurrentPdfPage();
        }, 120);
      },
      { passive: true }
    );

    var wrap = document.getElementById("tm-pdf-canvas-wrap");
    if (wrap && typeof ResizeObserver !== "undefined") {
      var t2 = null;
      var ro = new ResizeObserver(function () {
        if (!pdfJsDocument) return;
        if (pdfCropDragActive) return;
        window.clearTimeout(t2);
        t2 = window.setTimeout(function () {
          if (pdfCropDragActive) return;
          renderCurrentPdfPage();
        }, 150);
      });
      ro.observe(wrap);
    }
  }

  function initAddQuestion() {
    var btn = document.getElementById("tm-btn-add-question");
    if (!btn) return;
    btn.addEventListener("click", function () {
      addQuestionCard({});
    });
  }

  /* ── Modal (Sıfırla onay kutusu için) ────────────────────── */
  function openModal(el) {
    if (!el) return;
    el.style.display = "flex";
    el.removeAttribute("aria-hidden");
  }

  function closeModal(el) {
    if (!el) return;
    el.style.display = "none";
    el.setAttribute("aria-hidden", "true");
  }

  /* ── Şablon Motoru ─────────────────────────────────────── */

  function applyTemplate(tpl, name) {
    var page = document.getElementById("tm-a4-page");
    if (!page) return;
    page.setAttribute("data-tpl", tpl);

    var label = document.getElementById("tm-tpl-active-name");
    if (label) label.textContent = name;

    /* Popover'daki seçili kartı vurgula */
    document.querySelectorAll(".tm-tpl-card").forEach(function (btn) {
      var isActive = btn.getAttribute("data-tpl") === tpl;
      btn.style.background  = isActive ? "#f0f9ff" : "transparent";
      btn.style.borderColor = isActive ? "#6366f1" : "transparent";
    });
  }

  function openPopover() {
    var popover = document.getElementById("tm-tpl-popover");
    var btn     = document.getElementById("tm-btn-sablon");
    if (!popover || !btn) return;

    var r    = btn.getBoundingClientRect();
    var left = r.left;
    if (left + 232 > window.innerWidth - 8) left = window.innerWidth - 240;

    popover.style.top     = (r.bottom + 6) + "px";
    popover.style.left    = left + "px";
    popover.style.display = "block";
  }

  function closePopover() {
    var popover = document.getElementById("tm-tpl-popover");
    if (popover) popover.style.display = "none";
  }

  function initSablon() {
    var openBtn = document.getElementById("tm-btn-sablon");
    var popover = document.getElementById("tm-tpl-popover");
    if (!openBtn || !popover) return;

    /* Aç / kapat toggle — scroll kilidi yok */
    openBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      popover.style.display === "block" ? closePopover() : openPopover();
    });

    /* Click-outside: backdrop div'i olmadan dışarı tıklanınca kapat */
    document.addEventListener("click", function (e) {
      if (popover.style.display !== "block") return;
      if (!popover.contains(e.target) && e.target !== openBtn && !openBtn.contains(e.target)) {
        closePopover();
      }
    });

    /* Esc tuşu kapatır */
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closePopover();
    });

    /* Şablon kartlarına tıklama */
    popover.querySelectorAll(".tm-tpl-card").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var tpl  = btn.getAttribute("data-tpl");
        var name = btn.getAttribute("data-name") || tpl;
        applyTemplate(tpl, name);
        closePopover();
      });
    });

    /* Varsayılan şablon */
    applyTemplate("derece", "Derece Kurumsal");
  }

  /* ── Sayfa Başı Soru Limiti ────────────────────────────── */
  function initQPerPage() {
    var btn4 = document.getElementById("tm-qpp-4");
    var btn6 = document.getElementById("tm-qpp-6");
    if (!btn4 || !btn6) return;

    function setLimit(n) {
      qPerPage = n;
      /* Aktif buton vurgula */
      btn4.style.background = n === 4 ? "#6366f1" : "#fff";
      btn4.style.color      = n === 4 ? "#fff"    : "#64748b";
      btn6.style.background = n === 6 ? "#6366f1" : "#fff";
      btn6.style.color      = n === 6 ? "#fff"    : "#64748b";
      paginateQuestions();
    }

    btn4.addEventListener("click", function () { setLimit(4); });
    btn6.addEventListener("click", function () { setLimit(6); });
  }

  /* ── Fasikül → öğrenci kütüphanesi köprüsü ─────────── */
  function gatherFasciclePayloadFromDOM() {
    function rv(id) {
      var el = document.getElementById(id);
      if (!el) return "";
      var v = (el.value == null ? el.textContent : el.value) || "";
      return String(v).trim();
    }
    var title = rv("cover-title-input") || "Test";
    var cards = document.querySelectorAll("#sortable-list .tm-q-item");
    var keyParts = [];
    cards.forEach(function (card) {
      var a = (card.getAttribute("data-correct") || "").toUpperCase().trim();
      keyParts.push(/^[A-E]$/.test(a) ? a : " ");
    });
    var answerKey = keyParts.join("");
    var questionCount = cards.length;
    var a4 = document.getElementById("tm-a4-page");
    var pdfId = "";
    try {
      pdfId = String(window.__testMakerLastPdfFileId || "").trim();
    } catch (e) {}
    return {
      title: title,
      questionCount: questionCount,
      answerKey: answerKey,
      template: (a4 && a4.getAttribute("data-tpl")) || "",
      pdf_file_id: pdfId,
    };
  }

  function populateTmOgrenciSelect() {
    var sel = document.getElementById("tm-select-ogrenci");
    if (!sel) return;
    sel.innerHTML =
      '<option value="">— Öğrenci seçin —</option>' +
      '<option value="all">Tüm sınıf (yalnızca yazdırma)</option>';
    (window.DereceStudentCatalog || []).forEach(function (s) {
      if (!s || !s.id) return;
      var o = document.createElement("option");
      o.value = s.id;
      o.textContent = s.name + (s.code ? " (" + s.code + ")" : "");
      sel.appendChild(o);
    });
  }

  function updateFascicleCoachInsight(ogrenciId) {
    var el = document.getElementById("tm-fascicle-insight");
    if (!el || !window.DereceFascicleBridge) return;
    if (!ogrenciId || ogrenciId === "all") {
      el.classList.add("hidden");
      return;
    }
    var pct = window.DereceFascicleBridge.lastResultSummaryPct(ogrenciId);
    var items = window.DereceFascicleBridge.readResults(ogrenciId);
    var last = items.length ? items[items.length - 1] : null;
    if (pct == null) {
      el.textContent = "Bu öğrenci için henüz sanal optik sonucu yok.";
    } else {
      var line = "Son sanal optik başarısı: %" + pct + " (öğrenci paneli).";
      if (last && last.correct != null) {
        line +=
          " Son teslim: " +
          last.correct +
          " doğru, " +
          last.wrong +
          " yanlış, " +
          last.blank +
          " boş.";
      }
      el.textContent = line;
    }
    el.classList.remove("hidden");
  }

  function sendFascicleToStudentLibrary() {
    if (!window.DereceFascicleBridge) {
      tmToast("Köprü yüklenmedi", "Sayfayı yenileyin", true);
      return;
    }
    var sel = document.getElementById("tm-select-ogrenci");
    var oid = sel && sel.value;
    if (!oid || oid === "all") {
      tmToast("Öğrenci seçin", "Listeden bir öğrenci seçmelisiniz.", true);
      return;
    }
    var payload = gatherFasciclePayloadFromDOM();
    if (!payload.questionCount) {
      tmToast("Soru yok", "Önce soru ekleyin.", true);
      return;
    }
    var filled = payload.answerKey.replace(/ /g, "").length;
    if (!filled) {
      tmToast("Cevap anahtarı yok", "Sorularda doğru şıkkı işaretleyin.", true);
      return;
    }
    var cat = (window.DereceStudentCatalog || []).find(function (s) {
      return s && s.id === oid;
    });
    window.DereceFascicleBridge.appendAssigned(
      oid,
      Object.assign({}, payload, {
        studentCode: cat && cat.code ? String(cat.code) : "",
        source: "test_maker_send",
      })
    );
    tmToast("Öğrenci kütüphanesine gönderildi", (payload.title || "Test") + " · " + payload.questionCount + " soru", false);
    updateFascicleCoachInsight(oid);
  }

  function initFascicleStudentBridge() {
    populateTmOgrenciSelect();
    var sel = document.getElementById("tm-select-ogrenci");
    if (sel) {
      sel.addEventListener("change", function () {
        updateFascicleCoachInsight(sel.value);
      });
    }
    var btn = document.getElementById("tm-btn-fascicle-send");
    if (btn) btn.addEventListener("click", sendFascicleToStudentLibrary);
    try {
      var p = new URLSearchParams(window.location.search).get("student");
      if (p && sel) {
        sel.value = p;
        updateFascicleCoachInsight(p);
      }
    } catch (e) {}
  }

  /* ── PDF İndir ─────────────────────────────────────── */
  function initPdfIndir() {
    var btn = document.getElementById("tm-btn-pdf-indir");
    if (!btn) return;
    btn.addEventListener("click", function () {
      exportTestPdfToCloud(null).catch(function (err) {
        console.error(err);
        tmToast("PDF / bulut hatası", (err && err.message) || String(err), true);
      });
    });
  }

  /**
   * A4 test çıktısı — html2pdf.js ile Blob üretimi + Appwrite Storage yükleme.
   * window.print / popup yazdırma kaldırıldı.
   */
  function setPdfCloudOverlay(visible, message) {
    var ov = document.getElementById("tm-pdf-cloud-overlay");
    if (!ov) return;
    var msgEl = document.getElementById("tm-pdf-cloud-msg");
    if (msgEl && message) msgEl.textContent = message;
    if (visible) {
      ov.classList.remove("hidden");
      ov.classList.add("flex");
      ov.setAttribute("aria-hidden", "false");
    } else {
      ov.classList.add("hidden");
      ov.classList.remove("flex");
      ov.setAttribute("aria-hidden", "true");
    }
  }

  function slugifyPdfName(raw) {
    var t = String(raw || "deneme_sinavi").trim().toLowerCase();
    t = t.replace(/[^a-z0-9ğüşıöçĞÜŞİÖÇ]+/gi, "_").replace(/^_+|_+$/g, "");
    if (!t) t = "deneme_sinavi";
    if (t.length > 80) t = t.slice(0, 80);
    return t + ".pdf";
  }

  function stripTeacherUiFromTmA4Clone(clone) {
    clone.querySelectorAll(
      ".teacher-only-ui, " +
      ".tm-q-handle, .tm-q-delete, " +
      ".tm-q-crop-target, .sortable-ghost, .sortable-drag, " +
      "#tm-crop-overlay, #tm-pdf-crop-hint, " +
      "#tm-pdf-crop-marquee, #tm-pdf-crop-floater, " +
      "#tm-canvas-badges, " +
      ".tm-page-controls, .tm-delete-page-btn"
    ).forEach(function (el) {
      el.remove();
    });
    clone.querySelectorAll(".tm-q-item").forEach(function (card) {
      card.style.border = "none";
      card.style.boxShadow = "none";
      card.style.background = "transparent";
      card.style.padding = "0";
    });
    clone.querySelectorAll(".tm-q-item .bg-slate-100").forEach(function (hdr) {
      hdr.style.background = "transparent";
      hdr.style.border = "none";
      hdr.style.borderRadius = "0";
    });
    clone.querySelectorAll(".tm-q-item .rounded-b-md").forEach(function (body) {
      body.style.border = "none";
      body.style.borderRadius = "0";
      body.style.padding = "2px 0 0 0";
    });
  }

  function applyExportLayoutToTmA4Clone(clone) {
    clone.style.transform = "none";
    clone.style.width = "210mm";
    clone.style.marginLeft = "0";
    clone.style.marginRight = "0";
    clone.style.background = "#ffffff";
  }

  function sanitizeA4CloneForExport(clone) {
    stripTeacherUiFromTmA4Clone(clone);
    applyExportLayoutToTmA4Clone(clone);
    clone.removeAttribute("id");
  }

  /** html2pdf dışı: Chrome yazdır / «PDF olarak kaydet» için #tm-a4-page seçicileri korunur */
  function prepareA4CloneForChromePrint(clone) {
    stripTeacherUiFromTmA4Clone(clone);
    applyExportLayoutToTmA4Clone(clone);
  }

  function absResourceUrl(relativeOrAbsolute) {
    try {
      return new URL(relativeOrAbsolute, window.location.href).href;
    } catch (e) {
      return relativeOrAbsolute;
    }
  }

  function collectTmHeadStyleInnerHtml() {
    var out = [];
    document.querySelectorAll("head > style").forEach(function (st) {
      out.push(st.innerHTML || "");
    });
    return out.join("\n");
  }

  /**
   * Bulut yok: gizli iframe + tarayıcı print() — yeni sekme açılmaz; önizleme yazdırma penceresindedir.
   */
  function openTestChromePrintPreview() {
    var a4PageEl = document.getElementById("tm-a4-page");
    if (!a4PageEl) {
      tmToast("Önizleme açılamadı", "A4 alanı bulunamadı.", true);
      return;
    }

    var old = document.getElementById("tm-chrome-print-frame");
    if (old && old.parentNode) old.parentNode.removeChild(old);

    var iframe = document.createElement("iframe");
    iframe.id = "tm-chrome-print-frame";
    iframe.setAttribute("title", "Test yazdırma");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText =
      "position:fixed;width:0;height:0;border:0;left:0;bottom:0;opacity:0;pointer-events:none;visibility:hidden;";
    document.body.appendChild(iframe);

    var clone = a4PageEl.cloneNode(true);
    prepareA4CloneForChromePrint(clone);

    var fontEl = document.querySelector('head link[href*="fonts.googleapis.com/css"]');
    var fontsHref =
      fontEl && fontEl.href
        ? fontEl.href
        : "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap&subset=latin-ext";
    var styleCssHref = absResourceUrl("../css/style.css");
    var themeAttr = "";
    try {
      var dt = document.documentElement.getAttribute("data-theme");
      if (dt) themeAttr = ' data-theme="' + String(dt).replace(/"/g, "") + '"';
    } catch (e1) {}

    var twCfgJson = JSON.stringify({
      important: "#tw-scope",
      corePlugins: { preflight: false },
      darkMode: ["selector", '[data-theme="dark"]'],
      theme: {
        extend: {
          fontFamily: { sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"] },
          aspectRatio: { a4: "210 / 297" },
        },
      },
    });

    var headStyles = collectTmHeadStyleInnerHtml();
    var titleSafe = (readValueTm("cover-title-input") || "Test").slice(0, 120);

    var html =
      "<!DOCTYPE html><html lang=\"tr\"" +
      themeAttr +
      "><head><meta charset=\"utf-8\"/><title>" +
      titleSafe.replace(/</g, "") +
      " — yazdır</title>" +
      "<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\"/>" +
      "<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin/>" +
      "<link rel=\"stylesheet\" href=\"" +
      fontsHref.replace(/"/g, "") +
      "\"/>" +
      "<link rel=\"stylesheet\" href=\"" +
      styleCssHref.replace(/"/g, "") +
      "\"/>" +
      "<style>" +
      headStyles.replace(/<\/style/gi, "<\\/style") +
      "</style></head><body style=\"margin:0;background:#fff;\">" +
      "<div id=\"tw-scope\">" +
      clone.outerHTML +
      "</div>" +
      "<script src=\"https://cdn.tailwindcss.com\"><\/script>" +
      "<script>tailwind.config=" +
      twCfgJson +
      ";<\/script>" +
      "</body></html>";

    var iwin = iframe.contentWindow;
    var idoc = iframe.contentDocument || (iwin && iwin.document);
    if (!idoc || !iwin) {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      tmToast("Yazdırma hazırlanamadı", "Iframe oluşturulamadı.", true);
      return;
    }

    idoc.open();
    idoc.write(html);
    idoc.close();

    function removePrintFrame() {
      var f = document.getElementById("tm-chrome-print-frame");
      if (f && f.parentNode) f.parentNode.removeChild(f);
    }

    try {
      iwin.addEventListener("afterprint", removePrintFrame);
    } catch (e2) {}

    function runPrint() {
      try {
        iwin.focus();
        iwin.print();
      } catch (e3) {}
    }

    function kickPrint() {
      window.setTimeout(runPrint, 620);
    }

    if (idoc.readyState === "complete") {
      kickPrint();
    } else {
      iwin.addEventListener("load", kickPrint);
    }
  }

  function initChromePdfPrintPreview() {
    var btn = document.getElementById("tm-btn-chrome-pdf");
    if (!btn) return;
    btn.addEventListener("click", function () {
      openTestChromePrintPreview();
    });
  }

  function readValueTm(id) {
    var el = document.getElementById(id);
    if (!el) return "";
    var v = (el.value == null ? el.textContent : el.value) || "";
    return String(v).trim();
  }

  /**
   * @param {{ silent?: boolean }} opts
   * @returns {Promise<void>}
   */
  function exportTestPdfToCloud(opts) {
    opts = opts || {};
    if (typeof html2pdf === "undefined") {
      return Promise.reject(new Error("html2pdf yüklenemedi. Sayfayı yenileyin."));
    }
    var a4PageEl = document.getElementById("tm-a4-page");
    if (!a4PageEl) return Promise.reject(new Error("A4 sayfası bulunamadı."));

    if (!window.DPAppwrite || !window.DPAppwrite.isStorageConfigured()) {
      return Promise.reject(
        new Error(
          "Appwrite Storage yapılandırması yok. test-olusturucu.html içinde window.DP_APPWRITE (endpoint, projectId, bucketId, apiKey veya sessionJwt) tanımlayın."
        )
      );
    }

    var fname = slugifyPdfName(readValueTm("cover-title-input"));

    setPdfCloudOverlay(true, "PDF oluşturuluyor…");

    var clone = a4PageEl.cloneNode(true);
    sanitizeA4CloneForExport(clone);

    var host = document.createElement("div");
    host.id = "tm-html2pdf-export-root";
    host.setAttribute("aria-hidden", "true");
    host.style.cssText =
      "position:fixed;left:-16000px;top:0;width:210mm;max-width:210mm;background:#fff;z-index:-1;overflow:visible;";
    host.appendChild(clone);
    document.body.appendChild(host);

    var opt = {
      margin: [0, 0, 0, 0],
      filename: fname,
      image: { type: "jpeg", quality: 0.95 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        scrollY: 0,
        backgroundColor: "#ffffff",
        windowWidth: host.scrollWidth,
        windowHeight: host.scrollHeight,
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
    };

    function cleanupHost() {
      try {
        if (host && host.parentNode) host.parentNode.removeChild(host);
      } catch (e) {}
    }

    return new Promise(function (resolve, reject) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          setTimeout(function () {
            setPdfCloudOverlay(true, "PDF oluşturuluyor (html2canvas)…");
            var chain = html2pdf().set(opt).from(host).output("blob");
            Promise.resolve(chain)
              .then(function (pdfBlob) {
                if (!(pdfBlob instanceof Blob)) {
                  throw new Error("PDF Blob alınamadı.");
                }
                setPdfCloudOverlay(true, "Buluta yükleniyor…");
                return window.DPAppwrite.uploadPdfBlob(pdfBlob, fname);
              })
              .then(function (uploadResult) {
                var fid = uploadResult && uploadResult.$id ? String(uploadResult.$id) : "";
                if (!fid) throw new Error("Appwrite dosya ID dönmedi.");
                try {
                  window.__testMakerLastPdfFileId = fid;
                } catch (e1) {}
                var patch = { pdf_file_id: fid };
                var pDb = Promise.resolve(null);
                if (currentTaramaId && window.TaramaDeposu) {
                  pDb = window.TaramaDeposu.update(currentTaramaId, patch).catch(function (e2) {
                    console.warn("IndexedDB pdf_file_id güncellenemedi:", e2);
                    return null;
                  });
                }
                return pDb.then(function () {
                  if (
                    currentTaramaId &&
                    window.DPAppwrite &&
                    window.DPAppwrite.isDatabaseConfigured &&
                    window.DPAppwrite.isDatabaseConfigured()
                  ) {
                    return window.DPAppwrite
                      .upsertTaramaDeposuDocument(currentTaramaId, {
                        pdf_file_id: fid,
                        depo_id: currentTaramaId,
                        name: readValueTm("cover-title-input") || "",
                      })
                      .catch(function (e3) {
                        console.warn("Appwrite DB köprüsü:", e3);
                        return null;
                      });
                  }
                  return null;
                });
              })
              .then(function () {
                cleanupHost();
                setPdfCloudOverlay(false);
                if (!opts.silent) {
                  tmToast("PDF buluta yüklendi", fname + " · dosya ID kaydedildi", false);
                }
                resolve();
              })
              .catch(function (err) {
                cleanupHost();
                setPdfCloudOverlay(false);
                reject(err);
              });
          }, 220);
        });
      });
    });
  }

  /* ── Sıfırla ───────────────────────────────────────── */
  function doResetTest() {
    manualPages = 0;
    var sortList = document.getElementById("sortable-list");
    if (sortList) sortList.innerHTML = "";
    /* Extra soru sayfalarını temizle */
    var extraWrap = document.getElementById("tm-q-extra-pages");
    if (extraWrap) extraWrap.innerHTML = "";
    syncA4AnswerTable();
    renumerateQuestions();

    var inpKurum = document.getElementById("tm-input-kurum");
    if (inpKurum) { inpKurum.value = ""; syncInstitutionFromInput(); }

    /* Kapak başlığını varsayılana döndür */
    var coverTitleInput = document.getElementById("cover-title-input");
    var liveTitle       = document.getElementById("live-cover-title");
    if (coverTitleInput) coverTitleInput.value = "KURUMSAL DENEME SINAVI";
    if (liveTitle) liveTitle.textContent = "KURUMSAL DENEME SINAVI";

    var selDers = document.getElementById("tm-select-ders");
    var selKonu = document.getElementById("tm-select-konu");
    if (selDers) { selDers.selectedIndex = 0; }
    if (selKonu) { selKonu.selectedIndex = 0; }
    syncCanvasFromSelects();

    var cbCover = document.getElementById("tm-cb-cover");
    var cbAnswer = document.getElementById("tm-cb-answer");
    if (cbCover && !cbCover.checked) { cbCover.checked = true; cbCover.dispatchEvent(new Event("change")); }
    if (cbAnswer && !cbAnswer.checked) { cbAnswer.checked = true; cbAnswer.dispatchEvent(new Event("change")); }

    applyTemplate("derece", "Derece Kurumsal");

    destroyPdfJs();
    clearPdfCanvasVisual();
    pdfFiles = [];
    activePdfEntry = null;
    renderPdfUi();
    pdfUserScale = 1.0;
    applyZoom();
  }

  /* ── Sayfa Ekle / Sil ──────────────────────────────────── */
  function initAddPage() {
    var addBtn = document.getElementById("tm-btn-add-page");
    if (addBtn) {
      addBtn.addEventListener("click", function () {
        manualPages++;
        paginateQuestions();
      });
    }

    /* Event delegation: tüm çöp kovası butonlarını yakala */
    var a4Page = document.getElementById("tm-a4-page");
    if (!a4Page) return;

    a4Page.addEventListener("click", function (e) {
      var deleteBtn = e.target.closest ? e.target.closest(".tm-delete-page-btn") : null;
      if (!deleteBtn) return;
      e.preventDefault();

      var pageType = deleteBtn.getAttribute("data-page-type");

      if (pageType === "main") {
        /* Ana liste: tüm soruları sil, sayfa yapısı kalır */
        var mainList = document.getElementById("sortable-list");
        if (mainList) {
          var toRemove = Array.prototype.slice.call(mainList.querySelectorAll(".tm-q-item"));
          toRemove.forEach(function (item) { mainList.removeChild(item); });
        }
      } else {
        /* Ek sayfa: soruları sil, manualPages'i düşür */
        var pageEl = deleteBtn.closest(".tm-q-extra-page");
        if (pageEl) {
          var extraList = pageEl.querySelector(".tm-q-extra-list");
          if (extraList) {
            var toRemoveEx = Array.prototype.slice.call(extraList.querySelectorAll(".tm-q-item"));
            toRemoveEx.forEach(function (item) { extraList.removeChild(item); });
          }
          if (manualPages > 0) manualPages--;
        }
      }

      paginateQuestions();
    });
  }

  function initReset() {
    var modal = document.getElementById("tm-reset-modal");
    var openBtn = document.getElementById("tm-btn-reset");
    var cancelBtn = document.getElementById("tm-reset-cancel");
    var confirmBtn = document.getElementById("tm-reset-confirm");
    if (!modal) return;

    if (openBtn) {
      openBtn.addEventListener("click", function () {
        openModal(modal);
      });
    }
    if (cancelBtn) {
      cancelBtn.addEventListener("click", function () {
        closeModal(modal);
      });
    }
    if (confirmBtn) {
      confirmBtn.addEventListener("click", function () {
        closeModal(modal);
        doResetTest();
      });
    }
    modal.addEventListener("click", function (e) {
      if (e.target === modal) closeModal(modal);
    });
  }

  /* ── Soru Havuzu Mega Modal (soru-havuzu.html ile aynı filtre + localStorage) ─ */

  var HAVUZ_STORAGE_KEY = "derece_soru_havuzu";
  var havuzPoolRaw = [];
  var havuzSelectedKeys = {};
  /** Son ekranda listelenen sorular (filtre veya tümü); Teste Ekle bu liste + seçim ile çalışır */
  var havuzModalViewList = [];
  /** "all" | "filter" — silme sonrası hangi listeyi yeniden çizeceğimizi bilir */
  var tmHavuzLastMode = "all";
  var tmHavuzToastTimer;

  function havuzCardKey(q) {
    if (q && q.uuid) return String(q.uuid);
    var u = q && (q.dataUrl || q.dataURL || q.image) ? String(q.dataUrl || q.dataURL || q.image) : "";
    var h = 0;
    for (var i = 0; i < Math.min(u.length, 400); i++) {
      h = ((h << 5) - h + u.charCodeAt(i)) >>> 0;
    }
    return "h-" + h;
  }

  function havuzQuestionImageUrl(q) {
    if (!q) return "";
    return q.dataUrl || q.dataURL || q.image || "";
  }

  function havuzEsc(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function havuzLoadPool() {
    try {
      var raw = localStorage.getItem(HAVUZ_STORAGE_KEY);
      var arr = JSON.parse(raw || "[]");
      havuzPoolRaw = Array.isArray(arr) ? arr : [];
    } catch (err) {
      havuzPoolRaw = [];
    }
  }

  function havuzSavePool() {
    try {
      localStorage.setItem(HAVUZ_STORAGE_KEY, JSON.stringify(havuzPoolRaw));
    } catch (e) {
      tmHavuzShowToast("Kayıt başarısız — depolama dolu olabilir");
    }
  }

  function tmHavuzShowToast(msg) {
    var el = document.getElementById("tm-havuz-toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(tmHavuzToastTimer);
    tmHavuzToastTimer = setTimeout(function () {
      el.classList.remove("show");
    }, 2800);
  }

  function tmHavuzElDers() {
    return document.getElementById("tm-havuz-sel-ders");
  }
  function tmHavuzElKonu() {
    return document.getElementById("tm-havuz-sel-konu");
  }
  function tmHavuzElKavram() {
    return document.getElementById("tm-havuz-sel-kavram");
  }
  function tmHavuzElAns() {
    return document.getElementById("tm-havuz-sel-ans");
  }

  function tmHavuzGetOptName(sel) {
    if (!sel) return "";
    var opt = sel.options[sel.selectedIndex];
    return opt && opt.value ? opt.getAttribute("data-name") || opt.textContent || "" : "";
  }

  function tmHavuzGetFiltered() {
    var dersName = tmHavuzGetOptName(tmHavuzElDers());
    var konuName = tmHavuzGetOptName(tmHavuzElKonu());
    var kavramName = tmHavuzGetOptName(tmHavuzElKavram());
    var elAns = tmHavuzElAns();
    var ansMode = elAns && elAns.value ? elAns.value : "";

    return havuzPoolRaw.filter(function (q) {
      if (!q) return false;
      if (dersName && q.ders !== dersName) return false;
      if (konuName && q.konu !== konuName) return false;
      if (kavramName && q.kavram !== kavramName) return false;
      if (ansMode === "answered" && !q.answer) return false;
      if (ansMode === "unanswered" && q.answer) return false;
      if (["A", "B", "C", "D", "E"].indexOf(ansMode) !== -1 && q.answer !== ansMode) return false;
      return true;
    });
  }

  function tmHavuzPopulateDersDropdown() {
    var elSelDers = tmHavuzElDers();
    var elSelKonu = tmHavuzElKonu();
    var elSelKavram = tmHavuzElKavram();
    if (!elSelDers || !elSelKonu || !elSelKavram) return;
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

  function tmHavuzPopulateKonuDropdown(subId) {
    var elSelDers = tmHavuzElDers();
    var elSelKonu = tmHavuzElKonu();
    var elSelKavram = tmHavuzElKavram();
    if (!elSelKonu || !elSelKavram) return;
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
    if (elSelDers && !elSelDers.value) {
      elSelKonu.disabled = true;
    }
  }

  function tmHavuzPopulateKavramDropdown(subId, topicId) {
    var elSelKavram = tmHavuzElKavram();
    if (!elSelKavram) return;
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

  function tmHavuzResetFilterUi() {
    var elDers = tmHavuzElDers();
    var elAns = tmHavuzElAns();
    if (elDers) elDers.value = "";
    if (elAns) elAns.value = "";
    tmHavuzPopulateKonuDropdown("");
  }

  function tmHavuzWaitForYks(done, attempt) {
    var n = attempt == null ? 0 : attempt;
    if (window.YksMufredat && window.YksMufredatApi) {
      done();
      return;
    }
    if (n > 80) {
      done();
      return;
    }
    setTimeout(function () {
      tmHavuzWaitForYks(done, n + 1);
    }, 50);
  }

  function havuzCheckIconHtml(selected) {
    if (selected) {
      return (
        '<div class="check-icon flex h-6 w-6 items-center justify-center rounded border-2 border-indigo-600 bg-indigo-600 transition-colors">' +
        '<svg class="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">' +
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>' +
        "</svg></div>"
      );
    }
    return (
      '<div class="check-icon flex h-6 w-6 items-center justify-center rounded border-2 border-gray-300 bg-white transition-colors"></div>'
    );
  }

  function havuzUpdateSelectedCount() {
    var el = document.getElementById("havuz-selected-count");
    if (!el) return;
    var n = Object.keys(havuzSelectedKeys).filter(function (k) {
      return havuzSelectedKeys[k];
    }).length;
    el.textContent = n + " Soru Seçildi";
  }

  function havuzRenderFromList(questions) {
    havuzModalViewList = questions;
    var grid = document.getElementById("havuz-modal-grid");
    var elEmpty = document.getElementById("tm-havuz-empty");
    var elShown = document.getElementById("tm-havuz-shown-count");
    var elTotal = document.getElementById("tm-havuz-total-count");
    var elLabel = document.getElementById("tm-havuz-count-label");
    var elEmptyTitle = document.getElementById("tm-havuz-empty-title");
    var elEmptyDesc = document.getElementById("tm-havuz-empty-desc");
    var elEmptyLink = document.getElementById("tm-havuz-empty-link");
    if (!grid) return;

    if (elShown) elShown.textContent = String(questions.length);
    if (elTotal) elTotal.textContent = String(havuzPoolRaw.length);
    if (elLabel) {
      elLabel.textContent =
        questions.length +
        " soru gösteriliyor · Toplam: " +
        havuzPoolRaw.length +
        (tmHavuzLastMode === "filter" ? " (filtreli)" : "");
    }

    grid.innerHTML = "";

    if (questions.length === 0) {
      if (elEmpty) elEmpty.classList.remove("hidden");
      grid.classList.add("hidden");
      if (elEmptyTitle && elEmptyDesc) {
        if (havuzPoolRaw.length === 0) {
          elEmptyTitle.textContent = "Havuzda henüz soru yok";
          elEmptyDesc.textContent = "Otomatik Kırpıcı'dan soru ekleyin veya filtreyi değiştirin.";
          if (elEmptyLink) elEmptyLink.classList.remove("hidden");
        } else {
          elEmptyTitle.textContent = "Filtreye uygun soru yok";
          elEmptyDesc.textContent = "Ders, konu, alt kavram veya cevap durumunu değiştirip «Filtrele & Göster»e basın.";
          if (elEmptyLink) elEmptyLink.classList.add("hidden");
        }
      }
      havuzUpdateSelectedCount();
      return;
    }

    if (elEmpty) elEmpty.classList.add("hidden");
    grid.classList.remove("hidden");

    questions.forEach(function (q) {
      var key = havuzCardKey(q);
      var sel = !!havuzSelectedKeys[key];
      var imgUrl = havuzQuestionImageUrl(q);

      var tagParts = [];
      if (q.ders) tagParts.push(q.ders);
      if (q.konu) tagParts.push(q.konu);
      if (q.kavram) tagParts.push(q.kavram);
      var tagHtml = tagParts.length
        ? '<span class="truncate text-[10px] font-semibold text-indigo-600 max-w-[200px]" title="' +
          havuzEsc(tagParts.join(" › ")) +
          '">' +
          havuzEsc(tagParts.join(" › ")) +
          "</span>"
        : '<span class="text-[10px] text-slate-300 italic">Etiket yok</span>';

      var metaBadges = "";
      if (q.page) {
        metaBadges +=
          '<span class="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">S.' + havuzEsc(q.page) + "</span>";
      }
      if (q.qNumber) {
        metaBadges +=
          '<span class="rounded bg-indigo-100 px-1.5 py-0.5 text-[9px] font-bold text-indigo-600">' +
          havuzEsc(q.qNumber) +
          ".</span>";
      }

      var ansBtns = ["A", "B", "C", "D", "E"]
        .map(function (ch) {
          var active = q.answer === ch ? " active" : "";
          return (
            '<button type="button" class="tm-havuz-ans-btn' +
            active +
            '" data-ans="' +
            ch +
            '" data-uuid="' +
            havuzEsc(q.uuid) +
            '" data-key="' +
            havuzEsc(key) +
            '">' +
            ch +
            "</button>"
          );
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

      var imgBlock = imgUrl
        ? '<img src="' + havuzEsc(imgUrl) + '" alt="Soru" class="max-h-64 w-full object-contain pointer-events-none" />'
        : '<div class="flex min-h-[120px] items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400 pointer-events-none">Görsel yok</div>';

      var card = document.createElement("div");
      card.className =
        "havuz-card tm-havuz-sh-card relative cursor-pointer rounded-xl border border-slate-200 p-4 flex flex-col gap-3 transition-shadow" +
        (sel ? " ring-4 ring-indigo-500" : "");
      card.setAttribute("data-key", key);
      card.setAttribute("data-img", imgUrl || "");
      card.setAttribute("data-uuid", q.uuid || "");
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");

      card.innerHTML =
        '<div class="havuz-check-slot pointer-events-none absolute right-3 top-3 z-20">' +
        havuzCheckIconHtml(sel) +
        "</div>" +
        '<div class="flex items-start justify-between gap-2 pr-10">' +
        '<div class="flex min-w-0 flex-col gap-1">' +
        '<div class="flex items-center gap-1">' +
        metaBadges +
        "</div>" +
        tagHtml +
        "</div>" +
        '<button type="button" class="tm-havuz-delete-btn flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-red-400 transition hover:bg-red-50 hover:text-red-600" data-uuid="' +
        havuzEsc(q.uuid) +
        '" data-key="' +
        havuzEsc(key) +
        '" title="Soruyu havuzdan sil">' +
        '<svg class="h-3.5 w-3.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>' +
        "</button>" +
        "</div>" +
        '<div class="flex items-center justify-center overflow-hidden rounded-lg bg-slate-50 p-1 pointer-events-none">' +
        imgBlock +
        "</div>" +
        '<div class="border-t border-slate-100 pt-3">' +
        '<div class="mb-1.5 flex items-center justify-between pointer-events-none">' +
        '<span class="text-[10px] font-semibold text-slate-400">Doğru Cevap</span>' +
        (savedDate ? '<span class="text-[9px] text-slate-300">' + havuzEsc(savedDate) + "</span>" : "") +
        "</div>" +
        '<div class="flex items-center gap-1.5 tm-havuz-ans-row">' +
        ansBtns +
        "</div>" +
        "</div>";

      grid.appendChild(card);
    });

    grid.querySelectorAll(".tm-havuz-ans-btn").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
      });
    });
    grid.querySelectorAll(".tm-havuz-delete-btn").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
      });
    });

    havuzUpdateSelectedCount();
  }

  function havuzToggleCard(card) {
    if (!card || !card.classList.contains("havuz-card")) return;
    var key = card.getAttribute("data-key");
    if (!key) return;
    var on = !havuzSelectedKeys[key];
    havuzSelectedKeys[key] = on;
    card.classList.toggle("ring-4", on);
    card.classList.toggle("ring-indigo-500", on);
    var wrap = card.querySelector(".havuz-check-slot");
    if (wrap) {
      wrap.innerHTML = havuzCheckIconHtml(on);
    }
    havuzUpdateSelectedCount();
  }

  /**
   * Havuz verisini modala yükler (YKS dropdown + tüm sorular). Modal açılınca çağrılır.
   * Global: window.loadHavuzDataToModal
   */
  function loadHavuzDataToModal() {
    havuzLoadPool();
    havuzSelectedKeys = {};
    tmHavuzLastMode = "all";
    tmHavuzWaitForYks(function () {
      tmHavuzPopulateDersDropdown();
      tmHavuzResetFilterUi();
      havuzRenderFromList(havuzPoolRaw);
    });
  }

  window.loadHavuzDataToModal = loadHavuzDataToModal;

  function havuzCloseModal() {
    var modal = document.getElementById("havuz-mega-modal");
    if (!modal) return;
    modal.classList.remove("is-open");
    document.body.style.overflow = "";
    havuzSelectedKeys = {};
    havuzModalViewList = [];
    tmHavuzLastMode = "all";
    var grid = document.getElementById("havuz-modal-grid");
    if (grid) {
      grid.innerHTML = "";
      grid.classList.add("hidden");
    }
    var elEmpty = document.getElementById("tm-havuz-empty");
    if (elEmpty) elEmpty.classList.remove("hidden");
    var cnt = document.getElementById("havuz-selected-count");
    if (cnt) cnt.textContent = "0 Soru Seçildi";
    var elShown = document.getElementById("tm-havuz-shown-count");
    var elTotal = document.getElementById("tm-havuz-total-count");
    var elLabel = document.getElementById("tm-havuz-count-label");
    if (elShown) elShown.textContent = "0";
    if (elTotal) elTotal.textContent = "0";
    if (elLabel) elLabel.textContent = "";
  }

  function havuzAddSelectedToTest() {
    var toAdd = [];
    havuzModalViewList.forEach(function (q) {
      var key = havuzCardKey(q);
      if (havuzSelectedKeys[key] && havuzQuestionImageUrl(q)) toAdd.push(q);
    });
    if (toAdd.length === 0) {
      window.alert("Lütfen en az bir soru seçin (görseli olan sorular teste eklenebilir).");
      return;
    }
    toAdd.forEach(function (q) {
      var url = havuzQuestionImageUrl(q);
      var letter =
        q.answer && /^[A-E]$/.test(String(q.answer).toUpperCase()) ? String(q.answer).toUpperCase() : null;
      addQuestionCard({
        imageDataUrl: url,
        correctLetter: letter || undefined,
        fromHavuz: true,
      });
    });
    havuzCloseModal();
  }

  /**
   * Mega modal aç/kapa — DOMContentLoaded içinde ilk sırada çağrılır (diğer init hatalarından etkilenmesin).
   */
  function initHavuzModalShell() {
    var btnOpenHavuz = document.getElementById("btn-open-havuz-modal");
    var havuzModal = document.getElementById("havuz-mega-modal");
    var btnCloseHavuz = document.getElementById("close-havuz-modal");

    if (btnOpenHavuz && havuzModal) {
      btnOpenHavuz.addEventListener("click", function (e) {
        e.preventDefault();
        havuzModal.classList.add("is-open");
        document.body.style.overflow = "hidden";
        if (typeof window.loadHavuzDataToModal === "function") {
          window.loadHavuzDataToModal();
        }
      });
    } else {
      console.error(
        "Hata: btn-open-havuz-modal veya havuz-mega-modal elementi DOM içinde bulunamadı. IDleri kontrol et."
      );
    }

    if (btnCloseHavuz && havuzModal) {
      btnCloseHavuz.addEventListener("click", function () {
        havuzCloseModal();
      });
    }

    if (havuzModal) {
      havuzModal.addEventListener("click", function (e) {
        if (e.target === havuzModal) {
          havuzCloseModal();
        }
      });
    }
  }

  function initHavuzMegaModal() {
    var modal = document.getElementById("havuz-mega-modal");
    var addBtn = document.getElementById("btn-havuz-add-test");
    var grid = document.getElementById("havuz-modal-grid");
    var elDers = tmHavuzElDers();
    var elKonu = tmHavuzElKonu();
    var elKavram = tmHavuzElKavram();
    var btnFilter = document.getElementById("tm-havuz-btn-filter");
    var btnAll = document.getElementById("tm-havuz-btn-all");
    if (!modal || !grid) return;

    if (addBtn) {
      addBtn.addEventListener("click", function () {
        havuzAddSelectedToTest();
      });
    }

    if (elDers) {
      elDers.addEventListener("change", function () {
        tmHavuzPopulateKonuDropdown(elDers.value || "");
      });
    }
    if (elKonu) {
      elKonu.addEventListener("change", function () {
        var sid = elDers ? elDers.value : "";
        tmHavuzPopulateKavramDropdown(sid || "", elKonu.value || "");
      });
    }

    if (btnFilter) {
      btnFilter.addEventListener("click", function () {
        havuzSelectedKeys = {};
        tmHavuzLastMode = "filter";
        havuzRenderFromList(tmHavuzGetFiltered());
      });
    }
    if (btnAll) {
      btnAll.addEventListener("click", function () {
        havuzLoadPool();
        havuzSelectedKeys = {};
        tmHavuzLastMode = "all";
        tmHavuzPopulateDersDropdown();
        tmHavuzResetFilterUi();
        havuzRenderFromList(havuzPoolRaw);
      });
    }

    grid.addEventListener("click", function (e) {
      var ansBtn = e.target.closest && e.target.closest(".tm-havuz-ans-btn");
      if (ansBtn && grid.contains(ansBtn)) {
        var cardKey = ansBtn.getAttribute("data-key");
        var ans = ansBtn.getAttribute("data-ans");
        var q = havuzPoolRaw.find(function (x) {
          return x && havuzCardKey(x) === cardKey;
        });
        if (!q) return;
        q.answer = q.answer === ans ? null : ans;
        havuzSavePool();
        var card = ansBtn.closest(".havuz-card");
        if (card) {
          card.querySelectorAll(".tm-havuz-ans-btn").forEach(function (b) {
            b.classList.toggle("active", b.getAttribute("data-ans") === q.answer);
          });
        }
        tmHavuzShowToast(q.answer ? 'Cevap "' + q.answer + '" kaydedildi' : "Cevap kaldırıldı");
        return;
      }

      var delBtn = e.target.closest && e.target.closest(".tm-havuz-delete-btn");
      if (delBtn && grid.contains(delBtn)) {
        var dk = delBtn.getAttribute("data-key");
        if (!dk) return;
        if (!window.confirm("Bu soruyu havuzdan silmek istiyor musunuz?")) return;
        havuzPoolRaw = havuzPoolRaw.filter(function (x) {
          return !x || havuzCardKey(x) !== dk;
        });
        havuzSavePool();
        havuzSelectedKeys = {};
        if (tmHavuzLastMode === "filter") {
          havuzRenderFromList(tmHavuzGetFiltered());
        } else {
          havuzRenderFromList(havuzPoolRaw);
        }
        tmHavuzShowToast("Soru silindi");
        return;
      }

      var card = e.target.closest ? e.target.closest(".havuz-card") : null;
      if (!card || !grid.contains(card)) return;
      havuzToggleCard(card);
    });

    grid.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var card = e.target.closest ? e.target.closest(".havuz-card") : null;
      if (!card || !grid.contains(card)) return;
      e.preventDefault();
      havuzToggleCard(card);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initHavuzModalShell();

    initPdfJsWorker();
    initMufredat();
    initTestMakerLiveConfigSync();
    initPageSettings();
    initPdfDropzone();
    initPdfPreviewResize();
    syncCanvasFromSelects();
    syncA4AnswerTable();
    initSortable();
    initQuestionInteractions();
    initCropMode();
    initPanMode();
    initZoom();
    initPageNav();
    initCropStudio();
    initAddQuestion();
    initSablon();
    initQPerPage();
    initAddPage();
    initPdfIndir();
    initChromePdfPrintPreview();
    initFascicleStudentBridge();
    initReset();
    initHavuzMegaModal();
    intakeReceteTransfer();
    intakeTaramaTransfer();
    initSaveTaramaDeposu();
    intakeTaramaEdit();
  });

  /**
   * reçete-yaz.html → aktarilanReceteSorulari (tek kullanımlık).
   */
  function intakeReceteTransfer() {
    var KEY = "aktarilanReceteSorulari";
    var raw;
    try {
      raw = localStorage.getItem(KEY);
    } catch (e) {
      return;
    }
    if (!raw) return;
    var list;
    try {
      list = JSON.parse(raw);
    } catch (e) {
      localStorage.removeItem(KEY);
      return;
    }
    try {
      localStorage.removeItem(KEY);
    } catch (e) {}
    if (!Array.isArray(list) || !list.length) return;

    list.forEach(function (q) {
      if (!q) return;
      var url = q.dataUrl || q.dataURL || q.image || "";
      if (!url) return;
      var letter =
        q.answer && /^[A-E]$/i.test(String(q.answer))
          ? String(q.answer).toUpperCase()
          : undefined;
      try {
        addQuestionCard({
          imageDataUrl: url,
          correctLetter: letter,
          fromHavuz: true,
        });
      } catch (err) {
        console.warn("Reçete transferinde soru eklenemedi:", err);
      }
    });
  }

  /**
   * tarama-olusturucu.html → transfer_tarama_sorulari (tek kullanımlık).
   */
  function intakeTaramaTransfer() {
    var KEY = "transfer_tarama_sorulari";
    var raw;
    try {
      raw = localStorage.getItem(KEY);
    } catch (e) {
      return;
    }
    if (!raw) return;
    var list;
    try {
      list = JSON.parse(raw);
    } catch (e) {
      localStorage.removeItem(KEY);
      return;
    }
    try {
      localStorage.removeItem(KEY);
    } catch (e) {}
    if (!Array.isArray(list) || !list.length) return;

    list.forEach(function (q) {
      if (!q) return;
      var url = q.dataUrl || q.dataURL || q.image || "";
      if (!url) return;
      var letter =
        q.answer && /^[A-E]$/i.test(String(q.answer))
          ? String(q.answer).toUpperCase()
          : undefined;
      try {
        addQuestionCard({
          imageDataUrl: url,
          correctLetter: letter,
          fromHavuz: true,
        });
      } catch (err) {
        console.warn("Tarama transferinde soru eklenemedi:", err);
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════════════════════
   * TARAMA DEPOSU — SAVE SYSTEM
   * A4 canvas'ındaki tüm soruları + meta bilgilerini IndexedDB'ye arşivle.
   * Ayrıca tarama-deposu.html'den 'Düzenle' ile gelen kaydı otomatik yükle.
   * ═══════════════════════════════════════════════════════════════════════════ */

  /** Yüklü tarama için düzenleme kaydını tutan state (güncelle vs. yeni). */
  var currentTaramaId = null;

  function tmToast(title, sub, isError) {
    var el = document.getElementById("tm-tarama-toast");
    if (!el) {
      // Fallback: native alert
      if (isError) window.alert((title || "Hata") + (sub ? " — " + sub : ""));
      return;
    }
    var tEl = document.getElementById("tm-tarama-toast__title");
    var sEl = document.getElementById("tm-tarama-toast__sub");
    if (tEl) tEl.textContent = title || "Başarılı";
    if (sEl) sEl.textContent = sub || "";
    el.classList.toggle("is-error", !!isError);
    el.classList.add("is-show");
    clearTimeout(tmToast._t);
    tmToast._t = setTimeout(function () {
      el.classList.remove("is-show");
    }, 2600);
  }

  /** Canvas'taki tüm soru kartlarını { id, imageDataUrl, answer } olarak topla. */
  function collectQuestionsFromCanvas() {
    var out = [];
    var cards = document.querySelectorAll("#sortable-list .tm-q-item");
    cards.forEach(function (card) {
      var img = card.querySelector(".tm-q-image");
      var url = img && img.getAttribute("src") ? img.getAttribute("src") : "";
      if (!url) return;
      var answer = card.getAttribute("data-correct") || "";
      out.push({
        id: card.getAttribute("data-q-id") || "q-" + Date.now() + "-" + out.length,
        imageDataUrl: url,
        answer: answer || null,
      });
    });
    return out;
  }

  function readValue(id) {
    var el = document.getElementById(id);
    if (!el) return "";
    var v = (el.value == null ? el.textContent : el.value) || "";
    return String(v).trim();
  }

  function readSelectLabel(id) {
    var el = document.getElementById(id);
    if (!el) return "";
    if (el.tagName === "SELECT") {
      var opt = el.options[el.selectedIndex];
      return opt ? String(opt.textContent || opt.value || "").trim() : "";
    }
    return readValue(id);
  }

  /** Tarama Analiz sayfası — localStorage köprüsü (deneme matrisinden ayrı). */
  function syncTaramaAnalizFromTestMaker(depoId, savedRec, questions) {
    if (!depoId || !questions || !questions.length) return;
    var cevap = questions
      .map(function (q) {
        var a = String(q && q.answer != null ? q.answer : "").trim().toUpperCase();
        var m = a.match(/[ABCDE]/);
        return m ? m[0] : "";
      })
      .join("");
    var mx = null;
    try {
      mx = window.__testMakerLastMatrix || null;
    } catch (e0) {
      mx = null;
    }
    var payload = {
      id: depoId,
      depoId: depoId,
      name: (savedRec && savedRec.name) || "Tarama",
      soruSayisi: questions.length,
      cevapAnahtari: cevap,
      savedAt: new Date().toISOString(),
      matrixSnapshot: mx,
    };
    try {
      localStorage.setItem("tarama_data_" + depoId, JSON.stringify(payload));
    } catch (e1) {}
    var list = [];
    try {
      list = JSON.parse(localStorage.getItem("test_maker_exports") || "[]");
    } catch (e2) {
      list = [];
    }
    if (!Array.isArray(list)) list = [];
    list = list.filter(function (x) {
      return !x || String(x.id) !== String(depoId);
    });
    list.unshift({
      id: depoId,
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

  function initSaveTaramaDeposu() {
    var btn = document.getElementById("tm-btn-save-tarama");
    if (!btn) return;
    btn.addEventListener("click", function () {
      if (!window.TaramaDeposu) {
        tmToast("Depo yüklenmedi", "Sayfayı yenileyip tekrar deneyin", true);
        return;
      }
      var questions = collectQuestionsFromCanvas();
      if (!questions.length) {
        tmToast("Soru yok", "Arşivlenecek en az 1 soru olmalı", true);
        return;
      }

      var ders = readSelectLabel("tm-select-ders");
      var konu = readSelectLabel("tm-select-konu");
      var kurum = readValue("tm-input-kurum");
      var coverTitle = readValue("cover-title-input");

      // Arşiv kaydı adı: kapak başlığı; yoksa ders · konu · tarih
      var archiveName = coverTitle;
      if (!archiveName) {
        var parts = [];
        if (ders) parts.push(ders);
        if (konu) parts.push(konu);
        var d = new Date();
        parts.push(d.toLocaleDateString("tr-TR"));
        archiveName = parts.join(" · ") || "İsimsiz Tarama";
      }

      // Layout (sayfa ayarları)
      var qPerPageEl = document.getElementById("tm-qperpage");
      var sablonEl = document.getElementById("tm-sablon");
      var layout = {
        qPerPage: qPerPageEl ? qPerPageEl.value : null,
        sablon: sablonEl ? sablonEl.value : null,
      };

      // Thumbnails — ilk 4 soru önizlemesi
      var thumbs = questions.slice(0, 4).map(function (q) {
        return q.imageDataUrl;
      });

      var pdfFileId = "";
      try {
        pdfFileId = String(window.__testMakerLastPdfFileId || "").trim();
      } catch (ePdf) {}
      var rec = {
        id: currentTaramaId || null,
        name: archiveName,
        ders: ders || "Genel",
        konu: konu || "",
        kurum: kurum || "",
        coverTitle: coverTitle || "",
        layout: layout,
        questions: questions,
        thumbs: thumbs,
        pdf_file_id: pdfFileId || undefined,
      };

      btn.disabled = true;
      var originalHtml = btn.innerHTML;
      btn.innerHTML =
        '<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.3"/><path fill="currentColor" d="M12 2a10 10 0 0110 10h-3a7 7 0 00-7-7V2z"/></svg> Kaydediliyor...';

      var op = currentTaramaId
        ? window.TaramaDeposu.update(currentTaramaId, rec)
        : window.TaramaDeposu.add(rec);

      op.then(function (saved) {
        currentTaramaId = saved.id;
        syncTaramaAnalizFromTestMaker(saved.id, saved, questions);
        tmToast(
          currentTaramaId && rec.id ? "Tarama güncellendi" : "Başarıyla Arşivlendi",
          saved.name + " · " + questions.length + " soru"
        );
      }).catch(function (err) {
        console.error(err);
        tmToast("Kaydedilemedi", (err && err.message) || "Bilinmeyen hata", true);
      }).then(function () {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
      });
    });
  }

  /**
   * tarama-deposu.html → test-olusturucu.html düzenleme köprüsü.
   * localStorage.transfer_tarama_edit = taramaId  (tek kullanımlık).
   * Bu ID ile kaydı IndexedDB'den çekip canvas'ı doldururuz.
   */
  function intakeTaramaEdit() {
    var KEY = "transfer_tarama_edit";
    var id;
    try {
      id = localStorage.getItem(KEY);
    } catch (e) {
      return;
    }
    if (!id) return;
    try {
      localStorage.removeItem(KEY);
    } catch (e) {}
    if (!window.TaramaDeposu) return;

    window.TaramaDeposu.get(id).then(function (rec) {
      if (!rec) {
        tmToast("Tarama bulunamadı", "Arşivdeki kayıt silinmiş olabilir", true);
        return;
      }
      currentTaramaId = rec.id;

      // Meta alanlarını doldur
      var map = {
        "tm-input-kurum": rec.kurum,
        "cover-title-input": rec.coverTitle || rec.name || "",
      };
      Object.keys(map).forEach(function (k) {
        var el = document.getElementById(k);
        if (el && map[k]) {
          el.value = map[k];
          try {
            el.dispatchEvent(new Event("input", { bubbles: true }));
          } catch (e) {}
        }
      });

      // Soruları ekle
      (rec.questions || []).forEach(function (q) {
        if (!q || !q.imageDataUrl) return;
        var letter =
          q.answer && /^[A-E]$/i.test(String(q.answer))
            ? String(q.answer).toUpperCase()
            : undefined;
        try {
          addQuestionCard({
            imageDataUrl: q.imageDataUrl,
            correctLetter: letter,
            fromHavuz: true,
          });
        } catch (err) {
          console.warn("Tarama editinde soru eklenemedi:", err);
        }
      });

      tmToast("Arşivden yüklendi", rec.name + " · düzenleme modu");

      // Auto-print bayrağı varsa PDF'i tetikle
      var autoPrint = null;
      try { autoPrint = localStorage.getItem("transfer_tarama_autoprint"); } catch (e) {}
      if (autoPrint) {
        try { localStorage.removeItem("transfer_tarama_autoprint"); } catch (e) {}
        setTimeout(function () {
          var pdfBtn = document.getElementById("tm-btn-pdf-indir");
          if (pdfBtn) pdfBtn.click();
        }, 700);
      }
    }).catch(function (err) {
      console.error(err);
      tmToast("Yüklenemedi", (err && err.message) || "", true);
    });
  }
})();
