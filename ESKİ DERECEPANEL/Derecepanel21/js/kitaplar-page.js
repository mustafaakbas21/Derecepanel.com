/**
 * kitaplar.html — envanter listesi + yeni kitap / düzenle modalı (YksMufredatApi).
 * Tasarım: yalnızca Tailwind utility sınıfları (#tw-scope + CDN config).
 */
(function () {
  var grid = document.getElementById("lib-book-grid");
  if (!grid) return;

  var btnOpen = document.getElementById("lib-btn-new-book");
  var btnOpenLabel = document.getElementById("lib-btn-new-book-label");
  var btnOpenIcon = document.getElementById("lib-btn-new-book-icon");
  // Artık gömülü kokpit bölümü kullanıyoruz (modal kaldırıldı)
  var modal = document.getElementById("lib-form-cockpit");
  var modalBackdrop = null;
  var btnClose = document.getElementById("lib-cockpit-toggle");
  var btnCancel = document.getElementById("lib-modal-cancel");
  var form = document.getElementById("lib-form-book");
  var modalTitle = document.getElementById("lib-modal-title");
  var selSubject = document.getElementById("lib-modal-subject");
  var topicHost = document.getElementById("lib-modal-topics");
  var topicHint = document.getElementById("lib-modal-topic-hint");
  var dropZone = document.getElementById("lib-cover-drop");
  var fileInput = document.getElementById("lib-cover-file");
  var coverPreview = document.getElementById("lib-cover-preview");
  var coverData = document.getElementById("lib-cover-data");
  var pdfDrop = document.getElementById("lib-pdf-drop");
  var pdfFile = document.getElementById("lib-pdf-file");
  var pdfData = document.getElementById("lib-pdf-data");
  var pdfNameEl = document.getElementById("lib-pdf-name");
  var starsHost = document.getElementById("lib-difficulty-stars");
  var difficultyHidden = document.getElementById("lib-difficulty-value");

  var selectedDifficulty = 3;
  var coverDataUrl = "";
  var pdfDataUrl = "";
  var pdfFileLabel = "";
  var editingBookId = null;

  var COVER_ACTIVE =
    "ring-2 ring-primary/35 border-primary/50 bg-primary/[0.04] dark:bg-primary/10";
  var PDF_ACTIVE = "ring-2 ring-red-400/40 border-red-400/60 dark:ring-red-500/35";

  /** classList tek seferde yalnızca tek token alır; boşluklu sınıf dizilerini böler */
  function classTokens(s) {
    return String(s || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  }

  function addClassTokens(el, classString) {
    if (!el) return;
    var t = classTokens(classString);
    if (t.length) el.classList.add.apply(el.classList, t);
  }

  function removeClassTokens(el, classString) {
    if (!el) return;
    var t = classTokens(classString);
    if (t.length) el.classList.remove.apply(el.classList, t);
  }

  function kindLabel(k) {
    var m = {
      "soru-bankasi": "Soru Bankası",
      "konu-anlatim": "Konu Anlatımı",
      deneme: "Deneme",
      fasikul: "Fasikül",
    };
    return m[k] || k;
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function slugDownloadName(title) {
    var t = String(title || "kitap")
      .trim()
      .replace(/[^\w\u00C0-\u024F\u0400-\u04FF\- ]+/gi, "_")
      .replace(/\s+/g, "-")
      .slice(0, 72);
    return (t || "kitap") + ".pdf";
  }

  function fillSubjects() {
    if (!selSubject || !window.YksMufredatApi) return;
    selSubject.innerHTML = '<option value="">— Ders seçin —</option>';
    window.YksMufredatApi.getSubjects().forEach(function (s) {
      var o = document.createElement("option");
      o.value = s.id;
      o.textContent = s.name + " · " + s.sinav;
      selSubject.appendChild(o);
    });
  }

  function setAllTopicChecks(checked) {
    if (!topicHost) return;
    topicHost.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
      cb.checked = !!checked;
    });
  }

  function bindTopicBulkButtons() {
    var bar = document.getElementById("lib-topic-bulk-bar");
    var btnAll = document.getElementById("lib-topic-select-all");
    var btnClear = document.getElementById("lib-topic-clear-all");
    if (!bar || !btnAll || !btnClear) return;
    if (btnAll.dataset.bound) return;
    btnAll.dataset.bound = "1";
    btnAll.addEventListener("click", function () {
      setAllTopicChecks(true);
    });
    btnClear.addEventListener("click", function () {
      setAllTopicChecks(false);
    });
  }

  function renderTopicsMulti(subjectId, preselectIds) {
    if (!topicHost) return;
    topicHost.innerHTML = "";
    preselectIds = preselectIds || [];
    var bulkBar = document.getElementById("lib-topic-bulk-bar");
    if (bulkBar) bulkBar.classList.add("hidden");
    if (topicHint) {
      topicHint.textContent = subjectId
        ? "Birden fazla konu seçebilirsiniz."
        : "Önce ders seçin; konu listesi ders seçilene kadar boş kalır.";
    }
    if (!subjectId || !window.YksMufredatApi) return;
    var topics = window.YksMufredatApi.getTopics(subjectId);
    if (!topics.length) {
      topicHost.innerHTML =
        '<p class="rounded-xl border border-[color:var(--header-border)] bg-[color:var(--surface)] px-4 py-3 text-sm text-[color:var(--text-muted)]">Bu derste konu tanımı yok.</p>';
      return;
    }
    var wrap = document.createElement("div");
    wrap.className =
      "max-h-56 overflow-y-auto rounded-xl border border-[color:var(--header-border)] bg-[color:var(--surface)] p-3 shadow-sm sm:max-h-64";
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", "Konu çoklu seçim");
    topics.forEach(function (t) {
      var id = "lib-tp-" + t.id.replace(/[^a-zA-Z0-9_-]/g, "_");
      var lab = document.createElement("label");
      lab.className =
        "flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2.5 transition hover:bg-[color:var(--surface-muted)]";
      lab.setAttribute("for", id);
      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className =
        "mt-1 h-4 w-4 shrink-0 rounded border-[color:var(--header-border)] bg-[color:var(--surface)] text-primary focus:ring-primary/40";
      cb.id = id;
      cb.value = t.id;
      cb.setAttribute("data-topic-name", t.name);
      if (preselectIds.indexOf(t.id) !== -1) cb.checked = true;
      var span = document.createElement("span");
      span.className = "text-sm font-medium leading-snug text-[color:var(--text-primary)]";
      span.textContent = t.name;
      lab.appendChild(cb);
      lab.appendChild(span);
      wrap.appendChild(lab);
    });
    topicHost.appendChild(wrap);
    if (bulkBar) bulkBar.classList.remove("hidden");
    bindTopicBulkButtons();
  }

  var STAR_SVG =
    '<svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';

  var STAR_SVG_SM =
    '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';

  function renderStars() {
    if (!starsHost || !difficultyHidden) return;
    starsHost.innerHTML = "";
    var base =
      "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition focus:outline-none focus:ring-2 focus:ring-primary/40 ";
    var off =
      "border-[color:var(--header-border)] bg-[color:var(--surface)] text-gray-300 hover:border-gray-300 dark:border-gray-600 dark:bg-slate-900 dark:text-gray-500";
    var on =
      "border-amber-400 bg-amber-50 text-amber-600 shadow-sm dark:border-amber-500/60 dark:bg-amber-950/40 dark:text-amber-400";
    for (var i = 1; i <= 5; i++) {
      (function (level) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = base + (level <= selectedDifficulty ? on : off);
        b.setAttribute("aria-pressed", level <= selectedDifficulty ? "true" : "false");
        b.setAttribute("role", "radio");
        b.setAttribute("aria-label", "Zorluk " + level);
        b.innerHTML = STAR_SVG;
        b.addEventListener("click", function () {
          selectedDifficulty = level;
          difficultyHidden.value = String(level);
          renderStars();
        });
        starsHost.appendChild(b);
      })(i);
    }
    difficultyHidden.value = String(selectedDifficulty);
  }

  function difficultyStarsDisplay(d) {
    d = Math.max(0, Math.min(5, parseInt(d, 10) || 0));
    var html =
      '<span class="inline-flex items-center gap-0.5" role="img" aria-label="Zorluk ' +
      d +
      ' üzerinden 5">' +
      "";
    for (var i = 1; i <= 5; i++) {
      var filled = i <= d;
      html +=
        '<span class="' +
        (filled ? "text-amber-500 dark:text-amber-400" : "text-gray-300 dark:text-gray-600") +
        '">' +
        STAR_SVG_SM +
        "</span>";
    }
    return html + "</span>";
  }

  function setCoverFromFile(file) {
    if (!file || !file.type.match(/^image\//)) return;
    var reader = new FileReader();
    reader.onload = function () {
      coverDataUrl = String(reader.result || "");
      if (coverData) coverData.value = coverDataUrl;
      if (coverPreview) {
        coverPreview.src = coverDataUrl;
        coverPreview.classList.remove("hidden");
      }
      removeClassTokens(dropZone, COVER_ACTIVE);
    };
    reader.readAsDataURL(file);
  }

  function setPdfUi(name, dataUrl) {
    pdfDataUrl = dataUrl || "";
    pdfFileLabel = name || "";
    if (pdfData) pdfData.value = pdfDataUrl;
    if (pdfNameEl) {
      if (pdfDataUrl && pdfFileLabel) {
        pdfNameEl.textContent = pdfFileLabel;
        pdfNameEl.classList.remove("hidden");
      } else if (pdfDataUrl) {
        pdfNameEl.textContent = "PDF yüklendi";
        pdfNameEl.classList.remove("hidden");
      } else {
        pdfNameEl.textContent = "";
        pdfNameEl.classList.add("hidden");
      }
    }
  }

  function setPdfFromFile(file) {
    if (!file) return;
    if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) {
      alert("Lütfen yalnızca PDF dosyası seçin.");
      return;
    }
    var reader = new FileReader();
    reader.onerror = function () {
      alert("PDF okunamadı.");
    };
    reader.onload = function () {
      setPdfUi(file.name, String(reader.result || ""));
      removeClassTokens(pdfDrop, PDF_ACTIVE);
    };
    reader.readAsDataURL(file);
  }

  function resetPdfState() {
    setPdfUi("", "");
    if (pdfFile) pdfFile.value = "";
  }

  function resetFormMedia() {
    coverDataUrl = "";
    if (fileInput) fileInput.value = "";
    if (coverPreview) {
      coverPreview.removeAttribute("src");
      coverPreview.classList.add("hidden");
    }
    if (coverData) coverData.value = "";
    resetPdfState();
  }

  function showModal() {
    if (!modal) return;
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    if (btnOpen) btnOpen.setAttribute("aria-expanded", "true");
    if (btnOpenLabel) btnOpenLabel.textContent = "Formu Gizle";
    if (btnOpenIcon) btnOpenIcon.style.transform = "rotate(45deg)";
    removeClassTokens(dropZone, COVER_ACTIVE);
    removeClassTokens(pdfDrop, PDF_ACTIVE);
    try {
      modal.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) {
      modal.scrollIntoView();
    }
    var firstInput = document.getElementById("lib-inp-publisher");
    if (firstInput) {
      try { firstInput.focus({ preventScroll: true }); } catch (e2) { firstInput.focus(); }
    }
  }

  function openModalNew() {
    editingBookId = null;
    if (modalTitle) modalTitle.textContent = "Yeni kitap ekle";
    if (form) form.reset();
    resetFormMedia();
    selectedDifficulty = 3;
    renderStars();
    if (selSubject) selSubject.value = "";
    renderTopicsMulti("", []);
    showModal();
  }

  function openModalEdit(book) {
    if (!book || !form) return;
    editingBookId = book.id;
    if (modalTitle) modalTitle.textContent = "Kitabı düzenle";
    if (form) form.reset();
    resetFormMedia();
    var pub = document.getElementById("lib-inp-publisher");
    var title = document.getElementById("lib-inp-title");
    var kind = document.getElementById("lib-inp-kind");
    if (pub) pub.value = book.publisher || "";
    if (title) title.value = book.title || "";
    if (kind) kind.value = book.kind || "soru-bankasi";
    if (selSubject) selSubject.value = book.subjectId || "";
    var yearEl = document.getElementById("lib-inp-year");
    var qcountEl = document.getElementById("lib-inp-qcount");
    var videoEl = document.getElementById("lib-inp-video");
    var styleEl = document.getElementById("lib-inp-style");
    if (yearEl) yearEl.value = book.publishYear || "";
    if (qcountEl) qcountEl.value = book.estQuestions != null ? book.estQuestions : "";
    if (videoEl) videoEl.checked = !!book.hasVideo;
    if (styleEl) styleEl.value = book.style || "";
    updateVideoLabel();
    selectedDifficulty = Math.max(1, Math.min(5, parseInt(book.difficulty, 10) || 3));
    renderStars();
    coverDataUrl = book.coverDataUrl || "";
    if (coverData) coverData.value = coverDataUrl;
    if (coverPreview) {
      if (coverDataUrl) {
        coverPreview.src = coverDataUrl;
        coverPreview.classList.remove("hidden");
      } else {
        coverPreview.removeAttribute("src");
        coverPreview.classList.add("hidden");
      }
    }
    setPdfUi(book.pdfName || "", book.pdfDataUrl || "");
    renderTopicsMulti(selSubject.value, book.topicIds || []);
    showModal();
  }

  function openModal() {
    openModalNew();
  }

  function closeModal() {
    if (!modal) return;
    removeClassTokens(dropZone, COVER_ACTIVE);
    removeClassTokens(pdfDrop, PDF_ACTIVE);
    var ae = document.activeElement;
    if (ae && modal.contains(ae) && typeof ae.blur === "function") {
      ae.blur();
    }
    if (form) form.reset();
    resetFormMedia();
    selectedDifficulty = 3;
    renderStars();
    if (selSubject) selSubject.value = "";
    renderTopicsMulti("", []);
    updateVideoLabel();
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    if (btnOpen) {
      btnOpen.setAttribute("aria-expanded", "false");
      try { btnOpen.focus({ preventScroll: true }); } catch (e1) { btnOpen.focus(); }
    }
    if (btnOpenLabel) btnOpenLabel.textContent = "Yeni Kitap Ekle";
    if (btnOpenIcon) btnOpenIcon.style.transform = "";
    editingBookId = null;
  }

  function isModalOpen() {
    return modal && !modal.classList.contains("hidden");
  }

  function updateVideoLabel() {
    var v = document.getElementById("lib-inp-video");
    var lbl = document.getElementById("lib-video-label");
    if (v && lbl) lbl.textContent = v.checked ? "Var" : "Yok";
  }

  function subjectBadgeClass() {
    return "inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-400/30";
  }

  function kindBadgeClass() {
    return "inline-flex items-center rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700 ring-1 ring-inset ring-violet-700/10 dark:bg-violet-950/45 dark:text-violet-300 dark:ring-violet-400/25";
  }

  function renderInventory() {
    if (!grid || !window.DereceLibraryStore) return;
    var books = window.DereceLibraryStore.getBooks();
    grid.innerHTML = "";
    if (!books.length) {
      grid.innerHTML =
        '<div class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[color:var(--header-border)] bg-[color:var(--surface-muted)] px-6 py-16 text-center sm:px-10">' +
        '<p class="text-lg font-semibold text-[color:var(--text-primary)]">Henüz kitap yok</p>' +
        '<p class="mt-2 max-w-md text-sm text-[color:var(--text-muted)]">Yeni kitap ekleyerek kütüphaneyi oluşturun. Kapak ve PDF ekleyerek koçların tek tıkla erişmesini sağlayın.</p></div>';
      return;
    }

    var wrap = document.createElement("div");
    wrap.className = "flex w-full flex-col gap-3";

    var head = document.createElement("div");
    head.className =
      "hidden rounded-xl bg-[color:var(--surface-muted)] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[color:var(--text-muted)] md:grid md:grid-cols-[4.5rem_minmax(0,1fr)_minmax(0,10rem)_minmax(0,7rem)_minmax(0,11rem)] md:items-center md:gap-4";
    head.innerHTML =
      '<span class="pl-1">Kapak</span><span>Kitap</span><span class="text-center">Ders &amp; tür</span><span class="text-center">Zorluk</span><span class="text-right pr-1">İşlemler</span>';
    wrap.appendChild(head);

    var list = document.createElement("ul");
    list.className = "flex flex-col gap-3";
    list.setAttribute("aria-label", "Kitap envanteri");

    books.forEach(function (b) {
      var names = { subject: "", topics: "" };
      if (window.YksMufredatApi && b.subjectId) {
        var sub = window.YksMufredatApi.getSubject(b.subjectId);
        names.subject = sub ? sub.name + (sub.sinav ? " · " + sub.sinav : "") : b.subjectId;
        var tnames = [];
        var tlist = window.YksMufredatApi.getTopics(b.subjectId);
        (b.topicIds || []).forEach(function (tid) {
          for (var i = 0; i < tlist.length; i++) {
            if (tlist[i].id === tid) {
              tnames.push(tlist[i].name);
              break;
            }
          }
        });
        names.topics = tnames.join(" · ");
      }

      var thumb = b.coverDataUrl
        ? '<img src="' +
          escapeHtml(b.coverDataUrl) +
          '" alt="" class="h-16 w-12 shrink-0 rounded-md object-cover ring-1 ring-[color:var(--header-border)]" loading="lazy"/>'
        : '<div class="flex h-16 w-12 shrink-0 items-center justify-center rounded-md bg-[color:var(--surface-muted)] text-[color:var(--text-muted)] ring-1 ring-[color:var(--header-border)]" aria-hidden="true"><svg class="h-7 w-7 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.25" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg></div>';

      var pdfHref = b.pdfDataUrl ? escapeHtml(b.pdfDataUrl) : "";
      var dlName = escapeHtml(slugDownloadName(b.title));
      var pdfBtn = b.pdfDataUrl
        ? '<a href="' +
          pdfHref +
          '" download="' +
          dlName +
          '" class="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-red-600 bg-red-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800"><span aria-hidden="true">📄</span> PDF İndir</a>'
        : '<span class="inline-flex shrink-0 cursor-not-allowed items-center gap-1.5 rounded-lg border border-dashed border-[color:var(--header-border)] px-3 py-2 text-xs font-medium text-[color:var(--text-muted)]" title="PDF yüklenmedi">PDF yok</span>';

      var li = document.createElement("li");
      li.className =
        "rounded-xl border border-[color:var(--header-border)] bg-[color:var(--surface)] p-4 shadow-sm transition hover:shadow-md";
      li.innerHTML =
        '<div class="flex flex-col gap-4 md:grid md:grid-cols-[4.5rem_minmax(0,1fr)_minmax(0,10rem)_minmax(0,7rem)_minmax(0,11rem)] md:items-center md:gap-4">' +
        '<div class="flex gap-4 md:contents">' +
        '<div class="shrink-0 md:flex md:justify-center">' +
        thumb +
        "</div>" +
        '<div class="min-w-0 flex-1 md:min-w-0">' +
        '<h3 class="truncate text-base font-bold text-[color:var(--text-primary)]">' +
        escapeHtml(b.title) +
        "</h3>" +
        '<p class="mt-0.5 truncate text-sm text-[color:var(--text-muted)]">' +
        escapeHtml(b.publisher || "—") +
        "</p>" +
        (names.topics
          ? '<p class="mt-1 line-clamp-2 text-xs text-[color:var(--text-muted)]">' + escapeHtml(names.topics) + "</p>"
          : "") +
        "</div></div>" +
        '<div class="flex flex-wrap items-center gap-2 md:justify-center">' +
        '<span class="' +
        subjectBadgeClass() +
        '">' +
        escapeHtml(names.subject || "—") +
        "</span>" +
        '<span class="' +
        kindBadgeClass() +
        '">' +
        escapeHtml(kindLabel(b.kind)) +
        "</span></div>" +
        '<div class="flex justify-start md:justify-center">' +
        difficultyStarsDisplay(b.difficulty) +
        "</div>" +
        '<div class="flex flex-wrap items-center justify-between gap-2 md:justify-end">' +
        pdfBtn +
        '<details class="relative shrink-0">' +
        '<summary class="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-lg border border-[color:var(--header-border)] bg-[color:var(--surface)] text-[color:var(--text-muted)] transition hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--text-primary)] [&::-webkit-details-marker]:hidden" aria-label="Diğer işlemler">' +
        '<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8a2 2 0 110-4 2 2 0 010 4zm0 2a2 2 0 100 4 2 2 0 000-4zm0 6a2 2 0 100 4 2 2 0 000-4z"/></svg></summary>' +
        '<div role="menu" class="absolute right-0 z-30 mt-1 w-44 overflow-hidden rounded-xl border border-[color:var(--header-border)] bg-[color:var(--surface)] py-1 shadow-lg">' +
        '<button type="button" class="lib-act-edit block w-full px-4 py-2.5 text-left text-sm text-[color:var(--text-primary)] hover:bg-[color:var(--surface-muted)]" data-book-id="' +
        escapeHtml(b.id) +
        '">Düzenle</button>' +
        '<button type="button" class="lib-act-del block w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40" data-book-id="' +
        escapeHtml(b.id) +
        '">Sil</button></div></details></div></div>';

      list.appendChild(li);
    });

    wrap.appendChild(list);
    grid.appendChild(wrap);

    list.querySelectorAll(".lib-act-edit").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        var id = btn.getAttribute("data-book-id");
        var book = id && window.DereceLibraryStore.getBookById(id);
        var det = btn.closest("details");
        if (det) det.removeAttribute("open");
        if (book) openModalEdit(book);
      });
    });

    list.querySelectorAll(".lib-act-del").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        var id = btn.getAttribute("data-book-id");
        var det = btn.closest("details");
        if (det) det.removeAttribute("open");
        if (id && confirm("Bu kitabı ve bağlı atamaları silmek istiyor musunuz?")) {
          window.DereceLibraryStore.deleteBook(id);
          renderInventory();
        }
      });
    });
  }

  fillSubjects();
  renderStars();
  renderInventory();

  if (selSubject)
    selSubject.addEventListener("change", function () {
      renderTopicsMulti(selSubject.value, []);
    });

  if (btnOpen)
    btnOpen.addEventListener("click", function () {
      if (isModalOpen()) closeModal();
      else openModalNew();
    });
  if (btnClose) btnClose.addEventListener("click", closeModal);
  if (btnCancel) btnCancel.addEventListener("click", closeModal);

  var videoToggle = document.getElementById("lib-inp-video");
  if (videoToggle) videoToggle.addEventListener("change", updateVideoLabel);

  function bindDropzone(zone, input, onFile, activeClass) {
    if (!zone || !input) return;
    ["dragenter", "dragover"].forEach(function (ev) {
      zone.addEventListener(ev, function (e) {
        e.preventDefault();
        addClassTokens(zone, activeClass);
      });
    });
    ["dragleave", "drop"].forEach(function (ev) {
      zone.addEventListener(ev, function (e) {
        e.preventDefault();
        if (ev === "drop") {
          var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
          onFile(f);
        }
        removeClassTokens(zone, activeClass);
      });
    });
    zone.addEventListener("click", function () {
      input.click();
    });
  }

  bindDropzone(dropZone, fileInput, setCoverFromFile, COVER_ACTIVE);
  if (fileInput)
    fileInput.addEventListener("change", function () {
      var f = fileInput.files && fileInput.files[0];
      setCoverFromFile(f);
    });

  bindDropzone(pdfDrop, pdfFile, setPdfFromFile, PDF_ACTIVE);
  if (pdfFile)
    pdfFile.addEventListener("change", function () {
      var f = pdfFile.files && pdfFile.files[0];
      setPdfFromFile(f);
    });

  if (form)
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var pub = (document.getElementById("lib-inp-publisher") || {}).value.trim();
      var title = (document.getElementById("lib-inp-title") || {}).value.trim();
      var sid = selSubject ? selSubject.value : "";
      var kind = (document.getElementById("lib-inp-kind") || {}).value;
      if (!pub || !title || !sid) {
        alert("Yayınevi, kitap adı ve ders zorunludur.");
        return;
      }
      var topicIds = [];
      topicHost.querySelectorAll('input[type="checkbox"]:checked').forEach(function (cb) {
        topicIds.push(cb.value);
      });
      if (!topicIds.length) {
        alert("En az bir konu seçin.");
        return;
      }
      if (!window.DereceLibraryStore) return;

      var publishYear = (document.getElementById("lib-inp-year") || {}).value || "";
      var qcountRaw = (document.getElementById("lib-inp-qcount") || {}).value;
      var estQuestions = qcountRaw === "" || qcountRaw == null ? null : parseInt(qcountRaw, 10);
      if (isNaN(estQuestions)) estQuestions = null;
      var hasVideo = !!(document.getElementById("lib-inp-video") || {}).checked;
      var style = (document.getElementById("lib-inp-style") || {}).value || "";

      var payload = {
        publisher: pub,
        title: title,
        subjectId: sid,
        topicIds: topicIds,
        difficulty: selectedDifficulty,
        kind: kind || "soru-bankasi",
        publishYear: publishYear || null,
        estQuestions: estQuestions,
        hasVideo: hasVideo,
        style: style || null,
        coverDataUrl: coverDataUrl || null,
        pdfDataUrl: pdfDataUrl || null,
        pdfName: pdfFileLabel || null,
      };

      try {
        if (editingBookId) {
          window.DereceLibraryStore.updateBook(editingBookId, payload);
        } else {
          window.DereceLibraryStore.addBook(payload);
        }
      } catch (err) {
        alert("Kaydedilemedi (dosya çok büyük olabilir). Daha küçük bir PDF deneyin.");
        return;
      }

      closeModal();
      renderInventory();
    });
})();
