/**
 * Öğrenci — arşivlenmiş haftalık programlar (weekly_program_archive_*).
 */
(function () {
  var listEl = document.getElementById("og-arch-list");
  var overlay = document.getElementById("og-arch-modal-overlay");
  var modalTitle = document.getElementById("og-arch-modal-title");
  var modalSub = document.getElementById("og-arch-modal-sub");
  var modalBody = document.getElementById("og-arch-modal-body");
  var btnClose = document.getElementById("og-arch-modal-close");
  var btnDone = document.getElementById("og-arch-modal-done");
  if (!listEl) return;

  var DAYS_SHORT = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

  function getCurrentUser() {
    try {
      var raw = localStorage.getItem("currentUser");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
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

  function archiveKeyCandidates(u) {
    var o = {};
    function add(x) {
      x = String(x || "").trim();
      if (!x) return;
      o["weekly_program_archive_" + x] = true;
    }
    if (!u) return [];
    add(u.id);
    add(u.ogrenciId);
    add(u.studentCode);
    add(u.kullaniciAdi);
    add(catalogIdForUser(u));
    return Object.keys(o);
  }

  function readArchiveArray(key) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function mergedArchiveEntries(u) {
    var byId = {};
    var keys = archiveKeyCandidates(u);
    keys.forEach(function (key) {
      readArchiveArray(key).forEach(function (entry) {
        if (!entry || !entry.archiveId) return;
        var prev = byId[entry.archiveId];
        if (!prev || String(entry.archivedAt || "") > String(prev.archivedAt || "")) {
          byId[entry.archiveId] = entry;
        }
      });
    });
    return Object.keys(byId)
      .map(function (k) {
        return byId[k];
      })
      .sort(function (a, b) {
        return String(b.archivedAt || "").localeCompare(String(a.archivedAt || ""));
      });
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function statusLabel(t) {
    var s = String((t && t.studentStatus) || "").toLowerCase();
    if (s === "tamamlandi" || (t && t.done)) return "Tamamlandı";
    if (s === "yapilamadi") return "Yapılamadı";
    return "Bekliyor";
  }

  function openModal(entry) {
    if (!overlay || !modalBody || !modalTitle) return;
    var snap = entry.snapshot || {};
    var tasks = Array.isArray(snap.tasks) ? snap.tasks : [];
    modalTitle.textContent = entry.programTitle || "Haftalık program";
    modalSub.textContent =
      (entry.weekLabel || "—") +
      " · Tamamlama %" +
      String(entry.completionPct != null ? entry.completionPct : "—") +
      " · Salt okunur";

    var byDay = [[], [], [], [], [], [], []];
    tasks.forEach(function (t) {
      var di = t && t.dayIndex != null ? Number(t.dayIndex) : 0;
      if (di < 0 || di > 6) di = 0;
      byDay[di].push(t);
    });

    var html = "";
    for (var d = 0; d < 7; d++) {
      if (!byDay[d].length) continue;
      html += '<div class="og-arch-modal__day"><h4>' + escapeHtml(DAYS_SHORT[d]) + "</h4>";
      byDay[d].forEach(function (t) {
        var line = escapeHtml(t.label || t.summary || "Görev");
        var st = escapeHtml(statusLabel(t));
        var note = t.studentNote ? String(t.studentNote).trim() : "";
        html +=
          '<div class="og-arch-modal__task">' +
          line +
          " <strong>· " +
          st +
          "</strong>";
        if (note) {
          html += "<small>Not: " + escapeHtml(note) + "</small>";
        }
        html += "</div>";
      });
      html += "</div>";
    }
    if (!html) {
      html =
        '<p class="og-arch-empty" style="margin:0">Bu arşiv kaydında görev satırı yok.</p>';
    }
    modalBody.innerHTML = html;
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    notifyParentResize();
  }

  function closeModal() {
    if (!overlay) return;
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    notifyParentResize();
  }

  function notifyParentResize() {
    try {
      if (window.parent !== window) {
        window.parent.postMessage({ type: "og-iframe-content" }, "*");
      }
    } catch (e) {}
  }

  function renderList(u) {
    listEl.innerHTML = "";
    var entries = mergedArchiveEntries(u);
    if (!entries.length) {
      var empty = document.createElement("div");
      empty.className = "og-arch-empty";
      empty.textContent = "Henüz arşivlenmiş program yok. Yeni program gönderildiğinde önceki hafta burada listelenir.";
      listEl.appendChild(empty);
      notifyParentResize();
      return;
    }

    entries.forEach(function (entry) {
      var row = document.createElement("article");
      row.className = "og-arch-row";

      var top = document.createElement("div");
      top.className = "og-arch-row__top";
      var week = document.createElement("span");
      week.className = "og-arch-row__week";
      week.textContent = entry.weekLabel || "—";
      var title = document.createElement("h2");
      title.className = "og-arch-row__title";
      title.textContent = entry.programTitle || "Program";
      top.appendChild(week);
      top.appendChild(title);

      var meta = document.createElement("div");
      meta.className = "og-arch-row__meta";
      var pct = entry.completionPct != null ? Math.max(0, Math.min(100, Number(entry.completionPct))) : 0;
      var pctWrap = document.createElement("span");
      pctWrap.className = "og-arch-pct";
      pctWrap.innerHTML =
        '<span class="og-arch-pct__bar"><span class="og-arch-pct__fill" style="width:' +
        pct +
        '%"></span></span> %' +
        pct;

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "og-arch-btn";
      btn.textContent = "Görüntüle";
      btn.addEventListener("click", function () {
        openModal(entry);
      });

      meta.appendChild(pctWrap);
      meta.appendChild(btn);
      row.appendChild(top);
      row.appendChild(meta);
      listEl.appendChild(row);
    });

    notifyParentResize();
    window.setTimeout(notifyParentResize, 300);
  }

  if (overlay) {
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeModal();
    });
  }
  if (btnClose) btnClose.addEventListener("click", closeModal);
  if (btnDone) btnDone.addEventListener("click", closeModal);

  window.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && overlay && overlay.classList.contains("is-open")) closeModal();
  });

  window.addEventListener("load", function () {
    if (typeof window.ensureDereceStudentCatalog === "function") {
      window.ensureDereceStudentCatalog();
    }
    var u = getCurrentUser();
    if (!u) {
      window.location.href = "../login.html";
      return;
    }
    renderList(u);

    window.addEventListener("storage", function (e) {
      if (!e || !e.key || e.key.indexOf("weekly_program_archive_") !== 0) return;
      renderList(getCurrentUser());
    });
  });
})();
