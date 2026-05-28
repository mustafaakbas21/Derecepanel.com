/**
 * Öğrenci dashboard V2 — haftalık program, ana takvim (app.js), yaklaşan denemeler.
 * Bağımlılık: ogrenci-coach-bridge.js, student-catalog (opsiyonel), app.js (takvim)
 */
(function () {
  var ogrenciId = "";
  var activeProgramKey = "";
  var activeProgramData = null;

  function getCurrentUser() {
    if (window.OgStudentPerf && typeof window.OgStudentPerf.getCurrentUser === "function") {
      return window.OgStudentPerf.getCurrentUser();
    }
    try {
      var raw = localStorage.getItem("currentUser");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  /** Tek kelimeyi Türkçe yerelleştirme ile baş harf büyük. */
  function capitalizeWord(w) {
    var t = String(w == null ? "" : w).trim();
    if (!t) return "";
    var lo = t.toLocaleLowerCase("tr");
    return lo.charAt(0).toLocaleUpperCase("tr") + lo.slice(1);
  }

  /**
   * Ad + soyad varsa "Mustafa Akbaş"; yalnızca kullanıcı adı / tek parça ise en az ilk harf büyük.
   */
  function formatDisplayName(u) {
    if (!u) return "Öğrenci";
    var fn = String(u.firstName || u.ad || "").trim();
    var ln = String(u.lastName || u.soyad || u.soyisim || "").trim();
    if (fn || ln) {
      return [capitalizeWord(fn), capitalizeWord(ln)].filter(Boolean).join(" ");
    }
    var full = String(u.name || "").trim();
    if (full) {
      var parts = full.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) return parts.map(capitalizeWord).join(" ");
      if (parts.length === 1) return capitalizeWord(parts[0]);
    }
    var login = String(u.username || u.userName || u.login || u.email || "").trim();
    if (login) {
      var at = login.indexOf("@");
      if (at > 0) login = login.slice(0, at);
      return capitalizeWord(login);
    }
    return "Öğrenci";
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

  function programKeyCacheId(u) {
    return (
      String(u.id || "").trim() ||
      String(u.ogrenciId || "").trim() ||
      String(u.studentCode || "").trim() ||
      String(u.name || "").trim()
    );
  }

  function findActiveProgramStorageKey(u) {
    if (window.OgStudentPerf && typeof window.OgStudentPerf.findActiveProgramStorageKeyFast === "function") {
      return window.OgStudentPerf.findActiveProgramStorageKeyFast(u);
    }
    if (!u) return null;
    var uid = String(u.id || "").trim();
    var ogid = String(u.ogrenciId || "").trim();
    var code = String(u.studentCode || "").trim();
    var tryKeys = [];
    if (uid) tryKeys.push("active_program_" + uid);
    if (ogid) tryKeys.push("active_program_" + ogid);
    if (code) tryKeys.push("active_program_" + code);
    for (var t = 0; t < tryKeys.length; t++) {
      try {
        if (localStorage.getItem(tryKeys[t])) return tryKeys[t];
      } catch (e) {}
    }
    return null;
  }

  function getTasksFromPayload(data) {
    if (!data) return [];
    if (Array.isArray(data.tasks) && data.tasks.length) return data.tasks;
    return [];
  }

  function persistActiveProgram() {
    if (!activeProgramKey || !activeProgramData) return;
    try {
      localStorage.setItem(activeProgramKey, JSON.stringify(activeProgramData));
    } catch (e) {}
  }

  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function todayIso() {
    var t = new Date();
    return t.getFullYear() + "-" + pad2(t.getMonth() + 1) + "-" + pad2(t.getDate());
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function formatTrDate(iso) {
    if (!iso || String(iso).length < 10) return "—";
    var p = String(iso).split("-");
    if (p.length < 3) return String(iso);
    return p[2] + "." + p[1] + "." + p[0];
  }

  var _globalExamsCache = { sig: "", list: null };
  var _kurumExamsCache = { sig: "", list: null };

  function loadGlobalRaw() {
    try {
      var raw = localStorage.getItem("global_denemeler_v1") || localStorage.getItem("globalExams");
      var sig = String(raw || "");
      if (_globalExamsCache.sig === sig && _globalExamsCache.list) return _globalExamsCache.list;
      var arr = null;
      if (window.OgStudentPerf && typeof window.OgStudentPerf.getLsJson === "function") {
        if (localStorage.getItem("global_denemeler_v1")) {
          arr = window.OgStudentPerf.getLsJson("global_denemeler_v1");
        } else if (localStorage.getItem("globalExams")) {
          arr = window.OgStudentPerf.getLsJson("globalExams");
        }
      }
      if (!arr && raw) arr = JSON.parse(raw);
      var list = Array.isArray(arr) ? arr : [];
      _globalExamsCache = { sig: sig, list: list };
      return list;
    } catch (e) {
      return [];
    }
  }

  function loadKurumRaw() {
    try {
      var raw = localStorage.getItem("kurum_denemeler_v1");
      var sig = String(raw || "");
      if (_kurumExamsCache.sig === sig && _kurumExamsCache.list) return _kurumExamsCache.list;
      var arr = null;
      if (window.OgStudentPerf && typeof window.OgStudentPerf.getLsJson === "function") {
        arr = window.OgStudentPerf.getLsJson("kurum_denemeler_v1");
      }
      if (!arr && raw) arr = JSON.parse(raw);
      var list = Array.isArray(arr) ? arr : [];
      _kurumExamsCache = { sig: sig, list: list };
      return list;
    } catch (e) {
      return [];
    }
  }

  function eventSortKey(ev) {
    return String(ev.date || "") + " " + String(ev.time || "00:00");
  }

  function buildUpcomingFive() {
    var t0 = todayIso();
    var out = [];
    loadGlobalRaw().forEach(function (r) {
      if (!r || !r.tarih || String(r.tarih) < t0) return;
      out.push({
        title: String(r.ad || "Global deneme").trim() || "Global deneme",
        date: r.tarih,
        time: r.saat || "09:00",
        badge: r.tur || r.sinav || "TYT",
      });
    });
    loadKurumRaw().forEach(function (r) {
      if (!r || !r.tarih || String(r.tarih) < t0) return;
      out.push({
        title: String(r.ad || "Kurum denemesi").trim() || "Kurum denemesi",
        date: r.tarih,
        time: r.saat || "09:00",
        badge: r.sinav || "TYT",
      });
    });
    out.sort(function (a, b) {
      var ka = eventSortKey(a);
      var kb = eventSortKey(b);
      if (ka !== kb) return ka.localeCompare(kb);
      return String(a.title).localeCompare(String(b.title), "tr");
    });
    return out.slice(0, 5);
  }

  function renderUpcomingExams() {
    var root = document.getElementById("og-upcoming-list");
    if (!root) return;
    var evs = buildUpcomingFive();
    root.innerHTML = "";
    if (!evs.length) {
      var p = document.createElement("p");
      p.className = "distribution-sub";
      p.style.margin = "0";
      p.textContent = "Yaklaşan kayıtlı deneme yok.";
      root.appendChild(p);
      return;
    }
    evs.forEach(function (ev) {
      var row = document.createElement("div");
      row.className = "og-upcoming-row";
      row.innerHTML =
        '<div class="og-upcoming-row__meta">' +
        '<span class="og-upcoming-row__date">' +
        escapeHtml(formatTrDate(ev.date)) +
        '</span><span class="og-upcoming-row__time">' +
        escapeHtml(ev.time) +
        '</span></div><div class="og-upcoming-row__body">' +
        '<span class="og-upcoming-row__title">' +
        escapeHtml(ev.title) +
        '</span><span class="og-upcoming-row__badge">' +
        escapeHtml(ev.badge) +
        "</span></div>";
      root.appendChild(row);
    });
  }

  function syncCompletedBridge(u, tasks) {
    if (!window.DereceOgrenciBridge || !ogrenciId) return;
    window.DereceOgrenciBridge.writeCompletedTasksSnapshot(
      ogrenciId,
      tasks,
      (u && u.name) || (activeProgramData && activeProgramData.program && activeProgramData.program.studentName) || ""
    );
  }

  var DAYS_SHORT = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
  var DAYS_FULL = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
  var weekModalBound = false;

  function todayDayIndexMon0() {
    return (new Date().getDay() + 6) % 7;
  }

  function getNormalizedStatus(t) {
    var s = String((t && t.studentStatus) || "").toLowerCase();
    if (s === "bekliyor" || s === "tamamlandi" || s === "yapilamadi") return s;
    if (t && t.done) return "tamamlandi";
    return "bekliyor";
  }

  function parseTaskLabelParts(task) {
    var raw = String((task && (task.label || task.summary)) || "Görev").trim();
    var kind = "";
    var m0 = raw.match(/^([^:]+):\s*(.+)$/);
    if (m0) {
      kind = m0[1].trim();
      raw = m0[2].trim();
    }
    var parts = raw
      .split(/\s*>\s*/)
      .map(function (p) {
        return p.trim();
      })
      .filter(Boolean);
    if (!parts.length) parts = [raw || "Görev"];
    var sinav = "";
    var ders = parts[0] || "Görev";
    var sm = ders.match(/^(TYT|AYT)\s+(.+)$/i);
    if (sm) {
      sinav = sm[1].toUpperCase();
      ders = sm[2].trim();
    }
    return {
      kind: kind || "Konu çalışması",
      sinav: sinav,
      ders: ders,
      konu: parts.length > 1 ? parts[parts.length - 1] : "",
      topics: parts.length > 1 ? parts.slice(1) : [],
      fullLabel: String((task && (task.label || task.summary)) || "").trim(),
    };
  }

  function statusLabelTr(st) {
    if (st === "tamamlandi") return "Tamamlandı";
    if (st === "yapilamadi") return "Yapılamadı";
    return "Bekliyor";
  }

  function taskKindLabel(task) {
    var k = String((task && task.taskKind) || "").trim();
    var map = {
      konu_calisma: "Konu çalışması",
      soru_cozme: "Soru çözümü",
      deneme: "Deneme",
      tekrar: "Tekrar",
      etut_mola: "Etüt / mola",
    };
    return map[k] || "";
  }

  function closeWeekTaskModal() {
    var modal = document.getElementById("og-week-task-modal");
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    notifyParentIframeResize();
  }

  function openWeekTaskModal(dayIndex, task) {
    var modal = document.getElementById("og-week-task-modal");
    if (!modal || !task) return;
    var info = parseTaskLabelParts(task);
    var st = getNormalizedStatus(task);
    var dayName = DAYS_FULL[dayIndex] || DAYS_SHORT[dayIndex] || "Gün";

    var dayEl = document.getElementById("og-week-modal-day");
    var titleEl = document.getElementById("og-week-modal-title");
    var rowsEl = document.getElementById("og-week-modal-rows");
    if (!rowsEl) return;

    if (dayEl) dayEl.textContent = dayName;
    if (titleEl) titleEl.textContent = info.ders;

    rowsEl.innerHTML = "";

    function addRow(label, html) {
      var row = document.createElement("div");
      row.className = "og-week-modal__row";
      row.innerHTML =
        "<dt>" + escapeHtml(label) + "</dt><dd>" + html + "</dd>";
      rowsEl.appendChild(row);
    }

    var tk = taskKindLabel(task);
    if (tk) addRow("Görev türü", escapeHtml(tk));
    if (info.kind && info.kind !== "Konu çalışması") addRow("Plan türü", escapeHtml(info.kind));
    if (info.sinav) addRow("Sınav", escapeHtml(info.sinav));
    if (info.konu) addRow("Konu", escapeHtml(info.konu));
    if (info.topics && info.topics.length > 1) {
      addRow("Konu yolu", '<p class="og-week-modal__trail">' + escapeHtml(info.topics.join(" › ")) + "</p>");
    }
    addRow(
      "Durum",
      '<span class="og-week-modal__badge og-week-modal__badge--' +
        escapeHtml(st) +
        '">' +
        escapeHtml(statusLabelTr(st)) +
        "</span>"
    );
    if (task.durationMin) addRow("Süre", escapeHtml(String(task.durationMin) + " dk"));
    if (task.targetQuestions) addRow("Hedef soru", escapeHtml(String(task.targetQuestions)));
    if (info.fullLabel) addRow("Program notu", escapeHtml(info.fullLabel));
    if (st === "yapilamadi" && task.studentNote) {
      addRow("Öğrenci notu", escapeHtml(String(task.studentNote)));
    }

    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    notifyParentIframeResize();

    var closeBtn = modal.querySelector(".og-week-modal__close");
    if (closeBtn) closeBtn.focus();
  }

  function bindWeekTaskModal() {
    if (weekModalBound) return;
    weekModalBound = true;
    var modal = document.getElementById("og-week-task-modal");
    if (!modal) return;
    modal.querySelectorAll("[data-og-week-modal-close]").forEach(function (el) {
      el.addEventListener("click", closeWeekTaskModal);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal && !modal.hidden) closeWeekTaskModal();
    });
  }

  function groupTasksByDay(tasks) {
    var byDay = [[], [], [], [], [], [], []];
    (tasks || []).forEach(function (t, idx) {
      if (!t || String(t.taskKind || "").trim() === "etut_mola") return;
      var di = t.dayIndex != null ? Number(t.dayIndex) : 0;
      if (isNaN(di) || di < 0 || di > 6) di = 0;
      byDay[di].push({ task: t, idx: idx });
    });
    return byDay;
  }

  function renderMatrixConflictCard(u) {
    var card = document.getElementById("og-dash-matrix-warn");
    var msg = document.getElementById("og-dash-matrix-warn-msg");
    if (!card || !msg) return;
    if (!window.DereceOgrenciSimBridge) {
      card.hidden = true;
      return;
    }
    var c = window.DereceOgrenciSimBridge.findCompletedVersusMatrixConflict(u);
    if (!c) {
      card.hidden = true;
      return;
    }
    msg.textContent =
      "Dikkat! Tamamladığını belirttiğin " +
      c.completedLabel +
      " konusundan son denemede soru kaçırdın. Tekrar etmen önerilir.";
    card.hidden = false;
  }

  function ensureSession(u) {
    if (!u) {
      try {
        if (window.parent && window.parent !== window) {
          var pr = window.parent.localStorage.getItem("currentUser");
          if (pr && String(pr).trim()) u = JSON.parse(pr);
        }
      } catch (ePar) {}
    }
    if (!u) {
      if (window.parent && window.parent !== window) {
        try {
          window.parent.postMessage({ type: "og-iframe-auth-missing" }, "*");
        } catch (ePm) {}
      } else {
        window.location.href = "../login.html";
      }
      return false;
    }
    var nameEl = document.getElementById("og-dash-name");
    if (nameEl) nameEl.textContent = formatDisplayName(u);
    return true;
  }

  function renderWeeklyProgram(u) {
    var grid = document.getElementById("og-week-mini-grid");
    var hint = document.getElementById("og-week-hint");
    if (!grid) return;

    activeProgramKey = findActiveProgramStorageKey(u);
    activeProgramData = null;
    grid.innerHTML = "";
    ogrenciId = "";

    if (!activeProgramKey) {
      if (hint) {
        hint.hidden = false;
        hint.textContent = "Henüz gönderilmiş bir program yok.";
      }
      return;
    }

    var raw = null;
    try {
      raw = localStorage.getItem(activeProgramKey);
    } catch (e3) {
      raw = null;
    }
    if (!raw) {
      if (hint) {
        hint.hidden = false;
        hint.textContent = "Program anahtarı bulundu ancak veri okunamadı.";
      }
      return;
    }

    try {
      activeProgramData = JSON.parse(raw);
    } catch (e4) {
      if (hint) hint.hidden = false;
      return;
    }

    ogrenciId =
      (activeProgramData && activeProgramData.ogrenciId) ||
      activeProgramKey.replace(/^active_program_/, "") ||
      String(u.studentCode || "").trim() ||
      catalogIdForUser(u);

    if (!ogrenciId && u) {
      ogrenciId = String(u.studentCode || "").trim() || catalogIdForUser(u);
    }

    var tasks = getTasksFromPayload(activeProgramData).slice();
    var byDay = groupTasksByDay(tasks);
    var totalShown = 0;
    byDay.forEach(function (arr) {
      totalShown += arr.length;
    });

    if (hint) {
      hint.hidden = !!totalShown;
      if (!totalShown) hint.textContent = "Program gönderildi; bu hafta için görev tanımlı değil.";
      else hint.textContent = "Göreve tıklayarak detayları görüntüleyebilirsin; durum için Aktif Program.";
    }

    var todayIdx = todayDayIndexMon0();

    DAYS_SHORT.forEach(function (dayLabel, di) {
      var dayItems = byDay[di] || [];
      var col = document.createElement("div");
      col.className = "og-week-mini__day" + (di === todayIdx ? " og-week-mini__day--today" : "");

      var head = document.createElement("div");
      head.className = "og-week-mini__day-head";
      var nameEl = document.createElement("span");
      nameEl.className = "og-week-mini__day-name";
      nameEl.textContent = dayLabel;
      var countEl = document.createElement("span");
      countEl.className = "og-week-mini__day-count";
      countEl.textContent = dayItems.length ? String(dayItems.length) : "·";
      head.appendChild(nameEl);
      head.appendChild(countEl);
      col.appendChild(head);

      if (!dayItems.length) {
        var emptyP = document.createElement("p");
        emptyP.className = "og-week-mini__empty";
        emptyP.textContent = "—";
        col.appendChild(emptyP);
      } else {
        var ul = document.createElement("ul");
        ul.className = "og-week-mini__tasks";

        dayItems.forEach(function (item) {
          var task = item.task;
          var idx = item.idx;
          var st = getNormalizedStatus(task);
          var info = parseTaskLabelParts(task);

          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "og-week-mini__task og-week-mini__task--" + st;
          btn.setAttribute(
            "aria-label",
            dayLabel + " — " + info.ders + (st === "tamamlandi" ? " tamamlandı" : "")
          );

          var dot = document.createElement("span");
          dot.className = "og-week-mini__dot";
          dot.setAttribute("aria-hidden", "true");

          var body = document.createElement("span");
          body.className = "og-week-mini__task-body";
          var dersEl = document.createElement("span");
          dersEl.className = "og-week-mini__ders";
          dersEl.textContent = info.ders;
          dersEl.title = info.ders;
          body.appendChild(dersEl);
          if (info.konu) {
            var konuEl = document.createElement("span");
            konuEl.className = "og-week-mini__konu";
            konuEl.textContent = info.konu;
            konuEl.title = info.konu;
            body.appendChild(konuEl);
          }

          btn.appendChild(dot);
          btn.appendChild(body);

          btn.addEventListener("click", function () {
            openWeekTaskModal(di, task);
          });

          var li = document.createElement("li");
          li.appendChild(btn);
          ul.appendChild(li);
        });

        col.appendChild(ul);
      }

      grid.appendChild(col);
    });

    if (totalShown) syncCompletedBridge(u, tasks);
    notifyParentIframeResize();
  }

  function wireRefreshers() {
    try {
      window.addEventListener("globalDenemeler:updated", function () {
        _globalExamsCache = { sig: "", list: null };
        _kurumExamsCache = { sig: "", list: null };
        renderUpcomingExams();
      });
    } catch (e) {}
    window.addEventListener("storage", function (e) {
      if (!e || !e.key) return;
      if (
        e.key === "global_denemeler_v1" ||
        e.key === "globalExams" ||
        e.key === "kurum_denemeler_v1"
      ) {
        _globalExamsCache = { sig: "", list: null };
        _kurumExamsCache = { sig: "", list: null };
        renderUpcomingExams();
      }
      if (e.key === activeProgramKey || (e.key && e.key.indexOf("active_program_") === 0)) {
        var u = getCurrentUser();
        if (u) renderWeeklyProgram(u);
      }
    });
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) renderUpcomingExams();
    });
  }

  function scrollWeekIfHash() {
    try {
      if (location.hash === "#og-week-program") {
        var el = document.getElementById("og-week-program");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } catch (e) {}
  }

  function notifyParentIframeResize() {
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

  function bootSlow(u) {
    if (!u) return;
    renderMatrixConflictCard(u);
    if (window.OgStudentPerf && typeof window.OgStudentPerf.findActiveProgramStorageKeyByScan === "function") {
      var scanned = window.OgStudentPerf.findActiveProgramStorageKeyByScan(u);
      if (scanned && scanned !== activeProgramKey) renderWeeklyProgram(u);
    }
    notifyParentIframeResize();
  }

  function boot() {
    var u = getCurrentUser();
    if (!ensureSession(u)) return;
    bindWeekTaskModal();
    renderUpcomingExams();
    renderWeeklyProgram(u);
    wireRefreshers();
    scrollWeekIfHash();
    notifyParentIframeResize();
    if (window.OgStudentPerf && typeof window.OgStudentPerf.runIdle === "function") {
      window.OgStudentPerf.runIdle(function () {
        bootSlow(u);
      }, 1500);
    } else {
      setTimeout(function () {
        bootSlow(u);
      }, 32);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
