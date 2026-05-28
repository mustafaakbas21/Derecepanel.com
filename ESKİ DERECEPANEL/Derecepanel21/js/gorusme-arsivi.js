/**
 * Görüşme Arşivi — liste, filtre, öğrenci seçimi, detay modalı, silme;
 * düzenleme görüşme odasında (edit_meeting_id).
 */
(function () {
  "use strict";

  var LS_KEY = "derece_gorusme_arsivi";
  var SESSION_EDIT_MEETING = "edit_meeting_id";

  var root = document.getElementById("ga-archive-root");
  var toastEl = document.getElementById("go-toast");
  var elMeta = document.getElementById("ga-archive-meta");
  var inpQ = document.getElementById("ga-q");
  var selStudent = document.getElementById("ga-filter-student");
  var selCategory = document.getElementById("ga-filter-category");
  var selPeriod = document.getElementById("ga-filter-period");
  var selSort = document.getElementById("ga-sort");
  var btnReset = document.getElementById("ga-filter-reset");
  var modalDetail = document.getElementById("ga-modal-detail");
  var modalDetailBody = document.getElementById("ga-modal-detail-body");
  var modalDetailClose = document.getElementById("ga-modal-detail-close");

  var KNOWN_CATEGORIES = ["Akademik Gelişim", "Motivasyon ve Psikoloji", "Hata Analizi", "Veli Görüşmesi"];

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function stripHtmlToPlain(html) {
    try {
      var d = document.createElement("div");
      d.innerHTML = String(html || "");
      return String(d.innerText || "").trim();
    } catch (e) {
      return "";
    }
  }

  function showToast(msg, isErr) {
    if (!toastEl || !msg) return;
    toastEl.textContent = msg;
    toastEl.classList.remove("go-toast--error", "go-toast--success", "go-toast--hidden");
    toastEl.classList.add(isErr ? "go-toast--error" : "go-toast--success");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      toastEl.classList.add("go-toast--hidden");
    }, 2800);
  }

  function readArchive() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function writeArchive(arr) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(arr));
      return true;
    } catch (e) {
      showToast("Kaydedilemedi (depolama dolu olabilir).", true);
      return false;
    }
  }

  function formatDateTr(iso) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
    } catch (e) {
      return String(iso);
    }
  }

  function parseMs(iso) {
    if (!iso) return 0;
    var t = Date.parse(String(iso));
    return isNaN(t) ? 0 : t;
  }

  function periodStartMs(key) {
    var now = Date.now();
    if (key === "7d") return now - 7 * 86400000;
    if (key === "30d") return now - 30 * 86400000;
    if (key === "year") {
      var d = new Date();
      return new Date(d.getFullYear(), 0, 1).getTime();
    }
    return 0;
  }

  function applyNotesToView(viewEl, rec) {
    var rich = rec && (rec.notesRich || rec.notesHtml);
    if (rich && String(rich).trim()) {
      viewEl.classList.add("ga-notes-view--rich");
      viewEl.classList.remove("whitespace-pre-wrap");
      viewEl.innerHTML = String(rich);
    } else {
      viewEl.classList.remove("ga-notes-view--rich");
      viewEl.classList.add("whitespace-pre-wrap");
      var pl = String((rec && rec.notes) || "").trim();
      viewEl.textContent = pl ? pl : "(Not yok)";
    }
  }

  function rowPlainNotes(row) {
    var rich = row && (row.notesRich || row.notesHtml);
    if (rich && String(rich).trim()) return stripHtmlToPlain(rich);
    return String((row && row.notes) || "").trim();
  }

  function openModalDetail() {
    if (!modalDetail) return;
    modalDetail.classList.add("go-modal-open");
    modalDetail.setAttribute("aria-hidden", "false");
    try {
      document.documentElement.classList.add("go-modal-scroll-lock");
    } catch (e) {}
  }

  function closeModalDetail() {
    if (!modalDetail) return;
    modalDetail.classList.remove("go-modal-open");
    modalDetail.setAttribute("aria-hidden", "true");
    try {
      document.documentElement.classList.remove("go-modal-scroll-lock");
    } catch (e2) {}
  }

  function moodLine(row) {
    var m = row && row.mood;
    if (!m || typeof m !== "object") return "";
    var parts = [];
    if (m.emoji) parts.push(String(m.emoji));
    if (m.moodLabel || m.label) parts.push(String(m.moodLabel || m.label));
    return parts.length ? parts.join(" ") : "";
  }

  function fillDetailModal(row) {
    if (!modalDetailBody || !row) return;
    var id = String(row.id || "").trim();
    var mood = moodLine(row);
    var notesRich = row.notesRich || row.notesHtml;
    var notesBlock =
      notesRich && String(notesRich).trim()
        ? '<div class="ga-notes-view--rich rounded-xl border border-slate-600 bg-slate-800/80 p-4 text-sm leading-relaxed text-slate-100">' +
          String(notesRich) +
          "</div>"
        : '<pre class="whitespace-pre-wrap rounded-xl border border-slate-600 bg-slate-800/80 p-4 font-sans text-sm text-slate-100">' +
          esc(String(row.notes || "").trim() || "(Not yok)") +
          "</pre>";

    modalDetailBody.innerHTML =
      '<dl class="grid gap-3 text-xs sm:grid-cols-2">' +
      '<div><dt class="font-semibold uppercase tracking-wide text-slate-500">Tarih</dt><dd class="mt-1 text-slate-100">' +
      esc(formatDateTr(row.dateISO)) +
      "</dd></div>" +
      '<div><dt class="font-semibold uppercase tracking-wide text-slate-500">Öğrenci</dt><dd class="mt-1 font-semibold text-slate-50">' +
      esc(row.studentName || row.studentId || "—") +
      '</dd></div><div><dt class="font-semibold uppercase tracking-wide text-slate-500">Öğrenci ID</dt><dd class="mt-1 font-mono text-slate-300">' +
      esc(String(row.studentId || "—")) +
      "</dd></div>" +
      '<div><dt class="font-semibold uppercase tracking-wide text-slate-500">Süre</dt><dd class="mt-1 text-slate-100">' +
      esc(row.durationLabel || "—") +
      "</dd></div>" +
      '<div><dt class="font-semibold uppercase tracking-wide text-slate-500">Etiket</dt><dd class="mt-1 text-slate-100">' +
      esc(row.noteCategory || "—") +
      "</dd></div>" +
      '<div><dt class="font-semibold uppercase tracking-wide text-slate-500">Kaynak</dt><dd class="mt-1 text-slate-300">' +
      esc(String(row.source || "—")) +
      "</dd></div>" +
      '<div class="sm:col-span-2"><dt class="font-semibold uppercase tracking-wide text-slate-500">Ruh hali</dt><dd class="mt-1 text-slate-100">' +
      esc(mood || "—") +
      "</dd></div>" +
      '<div class="sm:col-span-2"><dt class="font-semibold uppercase tracking-wide text-slate-500">Kayıt ID</dt><dd class="mt-1 break-all font-mono text-[11px] text-slate-400">' +
      esc(id) +
      "</dd></div></dl>" +
      '<div><p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Notlar</p>' +
      notesBlock +
      "</div>" +
      '<div class="flex flex-wrap gap-2 pt-2">' +
      '<button type="button" class="ga-detail-edit rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-500" data-archive-id="' +
      esc(id) +
      '">Görüşme odasında düzenle</button>' +
      "</div>";

    var btnEd = modalDetailBody.querySelector(".ga-detail-edit");
    if (btnEd) {
      btnEd.addEventListener("click", function () {
        try {
          sessionStorage.setItem(SESSION_EDIT_MEETING, id);
        } catch (err) {}
        window.location.href = "gorusme-odasi.html";
      });
    }
  }

  function selectHasValue(select, val) {
    if (!select || val == null || val === "") return false;
    var v = String(val);
    for (var i = 0; i < select.options.length; i++) {
      if (select.options[i].value === v) return true;
    }
    return false;
  }

  function refreshFilterOptions(fullArr) {
    if (!selStudent || !selCategory) return;
    var curSt = selStudent.value;
    var curCat = selCategory.value;

    var byStudent = {};
    fullArr.forEach(function (row) {
      if (!row) return;
      var sid = String(row.studentId || "").trim();
      if (!sid) return;
      var label = String(row.studentName || sid).trim();
      if (!byStudent[sid]) byStudent[sid] = label;
    });

    selStudent.innerHTML = '<option value="">Tüm öğrenciler</option>';
    Object.keys(byStudent)
      .sort(function (a, b) {
        return byStudent[a].localeCompare(byStudent[b], "tr");
      })
      .forEach(function (sid) {
        var opt = document.createElement("option");
        opt.value = sid;
        opt.textContent = byStudent[sid] + " · " + sid;
        selStudent.appendChild(opt);
      });
    selStudent.value = selectHasValue(selStudent, curSt) ? curSt : "";

    var cats = {};
    KNOWN_CATEGORIES.forEach(function (c) {
      cats[c] = true;
    });
    fullArr.forEach(function (row) {
      var c = row && row.noteCategory ? String(row.noteCategory).trim() : "";
      if (c) cats[c] = true;
    });

    selCategory.innerHTML =
      '<option value="">Tüm etiketler</option><option value="__none__">Etiketsiz</option>';
    Object.keys(cats)
      .sort(function (a, b) {
        return a.localeCompare(b, "tr");
      })
      .forEach(function (c) {
        var opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        selCategory.appendChild(opt);
      });
    selCategory.value = selectHasValue(selCategory, curCat) ? curCat : "";
  }

  function filterArchive(arr) {
    var q = inpQ ? String(inpQ.value || "").toLowerCase().trim() : "";
    var sid = selStudent ? String(selStudent.value || "").trim() : "";
    var cat = selCategory ? String(selCategory.value || "").trim() : "";
    var period = selPeriod ? String(selPeriod.value || "all") : "all";
    var start = periodStartMs(period);

    return arr.filter(function (row) {
      if (!row) return false;
      if (sid && String(row.studentId || "").trim() !== sid) return false;

      if (cat === "__none__") {
        if (String(row.noteCategory || "").trim()) return false;
      } else if (cat && String(row.noteCategory || "").trim() !== cat) return false;

      if (start && parseMs(row.dateISO) < start) return false;

      if (q) {
        var hay = (
          String(row.studentName || "") +
          " " +
          String(row.studentId || "") +
          " " +
          rowPlainNotes(row)
        ).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  function sortArchive(arr) {
    var dir = selSort && selSort.value === "asc" ? 1 : -1;
    return arr.slice().sort(function (a, b) {
      var ta = parseMs(a.dateISO);
      var tb = parseMs(b.dateISO);
      if (ta !== tb) return ta < tb ? -dir : dir;
      return String(b.id || "").localeCompare(String(a.id || ""));
    });
  }

  function deleteArchiveRow(id) {
    var sid = String(id || "").trim();
    if (!sid) return;
    if (!window.confirm("Bu görüşme kaydını kalıcı olarak silmek istiyor musunuz?")) return;
    var full = readArchive();
    var next = full.filter(function (r) {
      return String((r && r.id) || "").trim() !== sid;
    });
    if (next.length === full.length) {
      showToast("Kayıt bulunamadı.", true);
      return;
    }
    if (!writeArchive(next)) return;
    showToast("Kayıt silindi.");
    render();
  }

  function render() {
    if (!root) return;
    var full = readArchive();
    refreshFilterOptions(full);

    var filtered = sortArchive(filterArchive(full));
    root.innerHTML = "";

    if (elMeta) {
      elMeta.textContent =
        full.length === 0
          ? "Kayıt yok."
          : filtered.length === full.length
            ? "Toplam " + full.length + " görüşme."
            : filtered.length + " görüşme listeleniyor (toplam " + full.length + ").";
    }

    if (!full.length) {
      root.innerHTML =
        '<p class="rounded-2xl border border-dashed border-[color:var(--header-border)] bg-[color:var(--surface-muted)]/30 px-6 py-10 text-center text-sm text-[color:var(--text-muted)]">Henüz arşiv kaydı yok. <a href="gorusme-odasi.html" class="font-semibold text-indigo-600 underline underline-offset-2">Yeni Görüşme</a> ekranından «Görüşmeyi Kaydet ve Bitir» kullanın.</p>';
      return;
    }

    if (!filtered.length) {
      root.innerHTML =
        '<p class="rounded-2xl border border-dashed border-amber-200 bg-amber-50/80 px-6 py-10 text-center text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">Filtrelere uyan görüşme yok. Arama veya tarih aralığını genişletin ya da <button type="button" id="ga-empty-reset" class="font-semibold text-indigo-600 underline underline-offset-2 dark:text-indigo-400">filtreleri sıfırlayın</button>.</p>';
      var er = document.getElementById("ga-empty-reset");
      if (er)
        er.addEventListener("click", function () {
          resetFilters();
        });
      return;
    }

    filtered.forEach(function (row) {
      var id = String((row && row.id) || "").trim();
      if (!id) return;

      var details = document.createElement("details");
      details.className =
        "group rounded-2xl border border-[color:var(--header-border)] bg-white shadow-md transition-shadow open:shadow-lg dark:bg-[color:var(--surface)]";
      details.dataset.archiveId = id;

      var sum = document.createElement("summary");
      sum.className =
        "flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 transition hover:bg-[color:var(--surface-muted)]/35 [&::-webkit-details-marker]:hidden";
      sum.innerHTML =
        '<div class="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2 text-sm">' +
        '<span class="shrink-0 font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">' +
        esc(formatDateTr(row.dateISO)) +
        "</span>" +
        '<span class="min-w-0 truncate font-bold text-[color:var(--text-primary)]">' +
        esc(row.studentName || row.studentId || "Öğrenci") +
        "</span>" +
        '<span class="inline-flex shrink-0 items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-200">' +
        esc(row.durationLabel || "—") +
        "</span>" +
        (row.noteCategory
          ? '<span class="inline-flex shrink-0 items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">' +
            esc(row.noteCategory) +
            "</span>"
          : "") +
        "</div>" +
        '<svg class="h-5 w-5 shrink-0 text-[color:var(--text-muted)] transition group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>';

      var body = document.createElement("div");
      body.className = "border-t border-[color:var(--header-border)] px-5 py-5";

      var view = document.createElement("div");
      view.className =
        "ga-notes-view max-h-64 overflow-y-auto rounded-xl bg-[color:var(--surface-muted)]/40 px-4 py-3 text-sm leading-relaxed text-[color:var(--text-primary)]";
      applyNotesToView(view, row);

      var actions = document.createElement("div");
      actions.className = "mt-4 flex flex-wrap gap-2";

      function mkBtn(label, cls, onClick) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = cls;
        b.textContent = label;
        b.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          onClick();
        });
        return b;
      }

      actions.appendChild(
        mkBtn(
          "Detay",
          "inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700",
          function () {
            fillDetailModal(row);
            openModalDetail();
          }
        )
      );

      actions.appendChild(
        mkBtn(
          "Düzenle",
          "inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs font-bold text-indigo-800 shadow-sm transition hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-100 dark:hover:bg-indigo-900/50",
          function () {
            try {
              sessionStorage.setItem(SESSION_EDIT_MEETING, id);
            } catch (err) {}
            window.location.href = "gorusme-odasi.html";
          }
        )
      );

      actions.appendChild(
        mkBtn(
          "Sil",
          "inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-800 shadow-sm transition hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-950/70",
          function () {
            deleteArchiveRow(id);
          }
        )
      );

      body.appendChild(view);
      body.appendChild(actions);
      details.appendChild(sum);
      details.appendChild(body);
      root.appendChild(details);
    });
  }

  function resetFilters() {
    if (inpQ) inpQ.value = "";
    if (selStudent) selStudent.value = "";
    if (selCategory) selCategory.value = "";
    if (selPeriod) selPeriod.value = "all";
    if (selSort) selSort.value = "desc";
    render();
  }

  function wireFilters() {
    [inpQ, selStudent, selCategory, selPeriod, selSort].forEach(function (el) {
      if (!el) return;
      el.addEventListener("input", function () {
        render();
      });
      el.addEventListener("change", function () {
        render();
      });
    });
    if (btnReset) btnReset.addEventListener("click", resetFilters);
    if (modalDetailClose)
      modalDetailClose.addEventListener("click", function () {
        closeModalDetail();
      });
    if (modalDetail)
      modalDetail.addEventListener("click", function (e) {
        if (e.target === modalDetail) closeModalDetail();
      });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (modalDetail && modalDetail.classList.contains("go-modal-open")) closeModalDetail();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    wireFilters();
    render();
    window.addEventListener("storage", function (e) {
      if (e.key === LS_KEY) render();
    });
  });
})();
