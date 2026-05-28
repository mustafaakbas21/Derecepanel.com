/**
 * kaynak-atama.html — öğrenci + kitap ataması, aktif atamalar.
 */
(function () {
  var root = document.getElementById("tw-scope");
  if (!root) return;

  var inpSearch = document.getElementById("lib-stu-search");
  var listStu = document.getElementById("lib-stu-list");
  var hidStu = document.getElementById("lib-stu-id");
  var pickBooks = document.getElementById("lib-pick-books");
  var hidBook = document.getElementById("lib-pick-book-id");
  var inpBookSearch = document.getElementById("lib-book-filter-search");
  var selBookKind = document.getElementById("lib-book-filter-kind");
  var selBookSubject = document.getElementById("lib-book-filter-subject");
  var lblBookCount = document.getElementById("lib-book-filter-count");
  var inpDue = document.getElementById("lib-assign-due");
  var bookFilterQ = "";
  var bookFilterKind = "";
  var bookFilterSubject = "";
  var inpNote = document.getElementById("lib-assign-note");
  var formAssign = document.getElementById("lib-form-assign");
  var listActive = document.getElementById("lib-active-list");

  function getStudentCatalog() {
    return window.DereceStudentCatalog || [];
  }

  function getAssignableStudents() {
    if (typeof window.getDereceStudentsWithUniqueCode === "function") {
      return window.getDereceStudentsWithUniqueCode();
    }
    var byCode = {};
    var out = [];
    getStudentCatalog().forEach(function (s) {
      if (!s) return;
      var code = String(s.code || "").trim();
      if (!code) return;
      var key = code.toLowerCase();
      if (byCode[key]) return;
      byCode[key] = true;
      out.push(s);
    });
    return out;
  }

  function refreshStudentCatalog() {
    if (typeof window.syncDereceStudentCatalog === "function") {
      window.syncDereceStudentCatalog();
    }
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
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

  function filterStudents(q) {
    var catalog = getAssignableStudents();
    q = (q || "").toLowerCase().trim();
    if (!q) return catalog.slice();
    return catalog.filter(function (s) {
      var code = String(s.code || "").toLowerCase();
      return (
        s.name.toLowerCase().indexOf(q) !== -1 ||
        String(s.id).toLowerCase().indexOf(q) !== -1 ||
        code.indexOf(q) !== -1
      );
    });
  }

  function renderStudentDropdown(q) {
    if (!listStu) return;
    var rows = filterStudents(q);
    listStu.innerHTML = "";
    if (!rows.length) {
      var emptyMsg = getAssignableStudents().length
        ? "Eşleşen öğrenci yok"
        : 'Öğrenci no tanımlı kayıt yok. <a href="ogrencilerim.html" class="font-semibold underline">Öğrencilerim</a> sayfasında numara girin veya sayfayı yenileyin.';
      listStu.innerHTML = '<li class="lib-muted px-4 py-3 text-sm">' + emptyMsg + "</li>";
      return;
    }
    rows.forEach(function (s) {
      var li = document.createElement("li");
      li.setAttribute("role", "option");
      li.className =
        "cursor-pointer border-b border-[color:var(--header-border)] px-4 py-3 text-sm font-medium text-[color:var(--text-primary)] last:border-0 hover:bg-[color:var(--surface-muted)]";
      li.textContent = s.name + " · " + String(s.code || "").trim();
      li.setAttribute("data-id", s.id);
      li.setAttribute("data-name", s.name);
      li.addEventListener("mousedown", function (e) {
        e.preventDefault();
      });
      li.addEventListener("click", function () {
        if (hidStu) hidStu.value = s.id;
        if (inpSearch) inpSearch.value = s.name + " · " + String(s.code || "").trim();
        listStu.classList.add("hidden");
        listStu.innerHTML = "";
      });
      listStu.appendChild(li);
    });
  }

  function applyGorusmeHandoff() {
    try {
      var raw = sessionStorage.getItem("aktarilanOgrenci");
      if (!raw || !hidStu || !inpSearch) return;
      var o = JSON.parse(raw);
      sessionStorage.removeItem("aktarilanOgrenci");
      var id = String(o.id || "").trim();
      if (!id) return;
      hidStu.value = id;
      inpSearch.value = String(o.name || "").trim();
    } catch (e) {}
  }

  function subjectLabelFor(subjectId) {
    if (!subjectId) return "—";
    if (window.YksMufredatApi && typeof window.YksMufredatApi.getSubject === "function") {
      var sub = window.YksMufredatApi.getSubject(subjectId);
      if (sub && sub.name) return sub.name + (sub.sinav ? " · " + sub.sinav : "");
    }
    return subjectId;
  }

  function getFilteredBooks() {
    if (!window.DereceLibraryStore) return [];
    var books = window.DereceLibraryStore.getBooks();
    var q = bookFilterQ.toLowerCase().trim();
    return books.filter(function (b) {
      if (bookFilterKind && b.kind !== bookFilterKind) return false;
      if (bookFilterSubject && b.subjectId !== bookFilterSubject) return false;
      if (!q) return true;
      var title = String(b.title || "").toLowerCase();
      var pub = String(b.publisher || "").toLowerCase();
      return title.indexOf(q) !== -1 || pub.indexOf(q) !== -1;
    });
  }

  function updateBookFilterCount(shown, total) {
    if (!lblBookCount) return;
    if (!total) {
      lblBookCount.textContent = "—";
      return;
    }
    lblBookCount.textContent =
      shown === total ? shown + " kitap" : shown + " / " + total + " kitap";
  }

  function populateBookSubjectFilter() {
    if (!selBookSubject || !window.DereceLibraryStore) return;
    var prev = selBookSubject.value;
    var ids = {};
    window.DereceLibraryStore.getBooks().forEach(function (b) {
      if (b && b.subjectId) ids[b.subjectId] = true;
    });
    var sorted = Object.keys(ids).sort(function (a, b) {
      return subjectLabelFor(a).localeCompare(subjectLabelFor(b), "tr");
    });
    selBookSubject.innerHTML = '<option value="">Tüm dersler</option>';
    sorted.forEach(function (sid) {
      var opt = document.createElement("option");
      opt.value = sid;
      opt.textContent = subjectLabelFor(sid);
      selBookSubject.appendChild(opt);
    });
    if (prev && ids[prev]) selBookSubject.value = prev;
    else selBookSubject.value = "";
    bookFilterSubject = selBookSubject.value;
  }

  function renderBookPicker(clearSelection) {
    if (!pickBooks || !hidBook || !window.DereceLibraryStore) return;
    if (clearSelection !== false) hidBook.value = "";
    pickBooks.innerHTML = "";
    var all = window.DereceLibraryStore.getBooks();
    var books = getFilteredBooks();
    updateBookFilterCount(books.length, all.length);

    if (!all.length) {
      pickBooks.innerHTML =
        '<p class="lib-empty col-span-full rounded-xl px-3 py-6 text-center text-xs">Önce <a href="kitaplar.html" class="font-semibold text-[color:var(--btn-primary-bg)] underline underline-offset-2">Kitap Listesi</a> üzerinden kitap ekleyin.</p>';
      return;
    }
    if (!books.length) {
      pickBooks.innerHTML =
        '<p class="lib-empty col-span-full rounded-xl px-3 py-6 text-center text-xs">Filtreye uyan kitap yok. Aramayı veya filtreleri değiştirin.</p>';
      return;
    }

    var selectedId = hidBook ? hidBook.value : "";
    books.forEach(function (b) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "lib-pick-tile";
      btn.setAttribute("role", "option");
      btn.setAttribute("aria-selected", selectedId === b.id ? "true" : "false");
      btn.setAttribute("data-book-id", b.id);
      btn.title = (b.title || "") + (b.publisher ? " · " + b.publisher : "");
      if (selectedId === b.id) btn.classList.add("lib-pick-tile--selected");

      var coverInner = b.coverDataUrl
        ? '<img src="' + escapeHtml(b.coverDataUrl) + '" alt="" loading="lazy"/>'
        : '<div class="lib-pick-placeholder flex h-full w-full items-center justify-center"><svg class="h-7 w-7 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.25" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg></div>';

      btn.innerHTML =
        '<div class="lib-pick-tile__cover">' +
        coverInner +
        '</div><div class="lib-pick-tile__body"><p class="lib-pick-tile__title">' +
        escapeHtml(b.title) +
        '</p><p class="lib-pick-tile__kind">' +
        escapeHtml(kindLabel(b.kind)) +
        "</p></div>";

      btn.addEventListener("click", function () {
        pickBooks.querySelectorAll(".lib-pick-tile").forEach(function (el) {
          el.classList.remove("lib-pick-tile--selected");
          el.setAttribute("aria-selected", "false");
        });
        btn.classList.add("lib-pick-tile--selected");
        btn.setAttribute("aria-selected", "true");
        hidBook.value = b.id;
      });
      pickBooks.appendChild(btn);
    });
  }

  function bindBookFilters() {
    if (inpBookSearch) {
      inpBookSearch.addEventListener("input", function () {
        bookFilterQ = inpBookSearch.value;
        renderBookPicker(false);
      });
    }
    if (selBookKind) {
      selBookKind.addEventListener("change", function () {
        bookFilterKind = selBookKind.value;
        renderBookPicker(false);
      });
    }
    if (selBookSubject) {
      selBookSubject.addEventListener("change", function () {
        bookFilterSubject = selBookSubject.value;
        renderBookPicker(false);
      });
    }
  }

  function studentName(id) {
    var m = window.DereceStudentCatalogById || {};
    return m[id] ? m[id].name : id;
  }

  function renderActive() {
    if (!listActive || !window.DereceLibraryStore) return;
    var rows = window.DereceLibraryStore.getAssignments();
    listActive.innerHTML = "";
    if (!rows.length) {
      listActive.innerHTML =
        '<p class="lib-empty rounded-2xl px-4 py-10 text-center text-sm">Aktif atama yok. Yukarıdaki formdan yeni atama oluşturun.</p>';
      return;
    }
    rows.forEach(function (a) {
      var book = window.DereceLibraryStore.getBookById(a.bookId);
      var pct = typeof a.progress === "number" ? a.progress : 0;
      var art = document.createElement("article");
      art.className =
        "lib-assignment-card flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center";
      var cover = book && book.coverDataUrl;
      var left =
        '<div class="flex shrink-0 gap-4 sm:w-52">' +
        (cover ?
          '<img src="' + escapeHtml(cover) + '" class="h-20 w-20 rounded-2xl object-cover shadow-md" alt=""/>' :
          '<div class="lib-pick-placeholder flex h-20 w-20 items-center justify-center rounded-2xl text-2xl">📘</div>') +
        '<div class="min-w-0 flex-1"><h3 class="truncate font-bold text-[color:var(--text-primary)]">' +
        escapeHtml(book ? book.title : "Silinmiş kitap") +
        '</h3><p class="text-sm font-medium text-[color:var(--btn-primary-bg)]">' +
        escapeHtml(studentName(a.studentId)) +
        "</p>" +
        (a.dueDate ? '<p class="lib-muted mt-1 text-xs">Hedef: ' + escapeHtml(a.dueDate) + "</p>" : "") +
        (a.note ? '<p class="mt-1 line-clamp-2 text-xs text-[color:var(--text-primary)] opacity-90">' + escapeHtml(a.note) + "</p>" : "") +
        "</div></div>";
      var right =
        '<div class="flex min-w-0 flex-1 flex-col gap-2 sm:max-w-md">' +
        '<label class="flex items-center gap-3 text-xs font-semibold text-[color:var(--text-primary)]"><span class="w-24 shrink-0">İlerleme</span>' +
        '<input type="range" min="0" max="100" value="' +
        pct +
        '" class="lib-prog-range h-2 flex-1 cursor-pointer" data-asg-id="' +
        escapeHtml(a.id) +
        '"/>' +
        '<span class="lib-prog-lbl w-10 text-right font-mono text-sm text-[color:var(--text-primary)]">' +
        pct +
        "%</span></label>" +
        '<div class="lib-prog-track h-2.5 w-full overflow-hidden rounded-full">' +
        '<div class="lib-prog-bar h-full rounded-full transition-all duration-300" style="width:' +
        pct +
        '%"></div></div>' +
        '<button type="button" class="lib-rm-asg lib-btn-ghost self-start rounded-xl px-3 py-1.5 text-xs font-semibold" data-asg-id="' +
        escapeHtml(a.id) +
        '">Atamayı kaldır</button></div>';
      art.innerHTML = left + right;
      listActive.appendChild(art);
    });

    listActive.querySelectorAll(".lib-prog-range").forEach(function (rng) {
      rng.addEventListener("input", function () {
        var id = rng.getAttribute("data-asg-id");
        var v = Number(rng.value) || 0;
        var art = rng.closest("article");
        var lbl = art && art.querySelector(".lib-prog-lbl");
        var bar = art && art.querySelector(".lib-prog-bar");
        if (lbl) lbl.textContent = v + "%";
        if (bar) bar.style.width = v + "%";
        if (id) window.DereceLibraryStore.setAssignmentProgress(id, v);
      });
    });

    listActive.querySelectorAll(".lib-rm-asg").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-asg-id");
        if (id && confirm("Bu atamayı kaldırmak istiyor musunuz?")) {
          window.DereceLibraryStore.removeAssignment(id);
          renderActive();
        }
      });
    });
  }

  if (inpSearch && listStu) {
    inpSearch.addEventListener("focus", function () {
      renderStudentDropdown(inpSearch.value);
      listStu.classList.remove("hidden");
    });
    inpSearch.addEventListener("input", function () {
      renderStudentDropdown(inpSearch.value);
      listStu.classList.remove("hidden");
    });
    document.addEventListener("click", function (e) {
      if (!listStu || !inpSearch) return;
      if (!listStu.contains(e.target) && e.target !== inpSearch) listStu.classList.add("hidden");
    });
  }

  if (formAssign)
    formAssign.addEventListener("submit", function (e) {
      e.preventDefault();
      var sid = hidStu ? hidStu.value : "";
      var bid = hidBook ? hidBook.value : "";
      if (!sid || !bid) {
        alert("Öğrenci ve kitap seçin.");
        return;
      }
      window.DereceLibraryStore.addAssignment({
        studentId: sid,
        bookId: bid,
        dueDate: inpDue && inpDue.value ? inpDue.value : "",
        note: inpNote && inpNote.value ? inpNote.value.trim() : "",
        progress: 0,
      });
      if (inpDue) inpDue.value = "";
      if (inpNote) inpNote.value = "";
      if (hidBook) hidBook.value = "";
      if (inpSearch) inpSearch.value = "";
      if (hidStu) hidStu.value = "";
      renderBookPicker(true);
      renderActive();
    });

  function initPage() {
    refreshStudentCatalog();
    bindBookFilters();
    populateBookSubjectFilter();
    applyGorusmeHandoff();
    renderBookPicker(true);
    renderActive();
    if (inpSearch && getAssignableStudents().length) {
      renderStudentDropdown("");
    }
  }

  window.addEventListener("storage", function (e) {
    if (!e || !e.key) return;
    if (
      e.key === "derecepanel_student_catalog_v1" ||
      e.key === "derecepanel_students_full_v1" ||
      e.key === "students"
    ) {
      refreshStudentCatalog();
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPage);
  } else {
    initPage();
  }
})();
