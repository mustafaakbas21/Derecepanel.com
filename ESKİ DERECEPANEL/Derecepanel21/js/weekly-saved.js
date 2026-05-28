(function () {
  var selStudent = null;
  var listEl = null;
  var emptyEl = null;
  var pdfTarget = null;
  var linkNew = null;
  var root = null;

  function fillStudents() {
    if (!selStudent) return;
    if (typeof window.syncDereceStudentCatalog === "function") {
      window.syncDereceStudentCatalog();
    }
    var cat = window.DereceStudentCatalog;
    if (!cat || !cat.length) return;
    while (selStudent.options.length > 1) {
      selStudent.remove(1);
    }
    cat.forEach(function (s) {
      var opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = s.name;
      selStudent.appendChild(opt);
    });
  }

  var DAYS_SHORT = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
  var MONTHS_SHORT = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

  function parseISODate(s) {
    if (!s) return null;
    var p = String(s).split("-");
    if (p.length !== 3) return null;
    return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10), 12, 0, 0, 0);
  }

  function addDays(base, n) {
    var x = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 12, 0, 0, 0);
    x.setDate(x.getDate() + n);
    return x;
  }

  function formatWeekRangeTurkish(monday) {
    var sun = addDays(monday, 6);
    var opts = { day: "numeric", month: "long", year: "numeric" };
    return monday.toLocaleDateString("tr-TR", opts) + " — " + sun.toLocaleDateString("tr-TR", opts);
  }

  function taskLine(x) {
    if (x.summary) return x.summary;
    if (x.label) return x.label;
    return "";
  }

  function programToTasks(program) {
    var tasks = [];
    var n = 0;
    var days = program.days || {};
    for (var di = 0; di < 7; di++) {
      var items = days[String(di)] || [];
      for (var j = 0; j < items.length; j++) {
        var label = taskLine(items[j]);
        if (!label) continue;
        tasks.push({
          id: "t-" + di + "-" + n++,
          dayIndex: di,
          label: label,
          done: false,
        });
      }
    }
    return tasks;
  }

  function computeCompletionPctFromTasks(tasks) {
    if (!tasks || !tasks.length) return 0;
    var ok = 0;
    tasks.forEach(function (t) {
      if (!t) return;
      var st = String(t.studentStatus || "").toLowerCase();
      if (st === "tamamlandi" || t.done) ok += 1;
    });
    return Math.round((100 * ok) / tasks.length);
  }

  function shortWeekRangeLabel(program) {
    if (!program || !program.weekStartISO) return "—";
    var mon = parseISODate(program.weekStartISO);
    if (!mon) return "—";
    var sun = addDays(mon, 6);
    return mon.getDate() + "–" + sun.getDate() + " " + MONTHS_SHORT[mon.getMonth()] + " " + mon.getFullYear();
  }

  function archiveKey(ogrenciId) {
    return "weekly_program_archive_" + String(ogrenciId || "").trim();
  }

  /** Yeni program yazılmadan önce mevcut aktif programı öğrenci geçmiş arşivine alır */
  function pushWeeklyProgramArchive(oid, oldPayload) {
    if (!oid || !oldPayload) return;
    try {
      var tasks = oldPayload.tasks || [];
      var hasProg = !!(oldPayload.program || (oldPayload.programs && oldPayload.programs.length));
      if (!tasks.length && !hasProg) return;
      var entry = {
        archiveId: "wa-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8),
        archivedAt: new Date().toISOString(),
        weekLabel: oldPayload.program ? shortWeekRangeLabel(oldPayload.program) : "—",
        programTitle:
          (oldPayload.program && oldPayload.program.title) ||
          (oldPayload.programs && oldPayload.programs[0] && oldPayload.programs[0].title) ||
          "Haftalık Program",
        completionPct: computeCompletionPctFromTasks(tasks),
        snapshot: oldPayload,
      };
      var keys = [archiveKey(oid)];
      var cid = oldPayload.catalogStudentId;
      if (cid && String(cid) !== String(oid)) keys.push(archiveKey(cid));
      for (var k = 0; k < keys.length; k++) {
        var key = keys[k];
        if (!key || key === "weekly_program_archive_") continue;
        var list = [];
        try {
          var raw = localStorage.getItem(key);
          if (raw) {
            var p = JSON.parse(raw);
            if (Array.isArray(p)) list = p;
          }
        } catch (e0) {
          list = [];
        }
        list.unshift(entry);
        if (list.length > 40) list.length = 40;
        localStorage.setItem(key, JSON.stringify(list));
      }
    } catch (e) {}
  }

  function readStudentsArraysMerged() {
    var out = [];
    var keys = ["derecepanel_students_full_v1", "students"];
    for (var k = 0; k < keys.length; k++) {
      try {
        var raw = localStorage.getItem(keys[k]);
        if (!raw) continue;
        var arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          for (var i = 0; i < arr.length; i++) {
            if (arr[i]) out.push(arr[i]);
          }
        }
      } catch (e) {}
    }
    return out;
  }

  function resolveOgrenciIdFromStorage(catalogStudentId, programStudentName) {
    var catalog = window.DereceStudentCatalog || [];
    var cat = null;
    for (var c = 0; c < catalog.length; c++) {
      if (catalog[c].id === catalogStudentId) {
        cat = catalog[c];
        break;
      }
    }
    var name = String(programStudentName || (cat && cat.name) || "").trim();
    var codeFromCat = cat && cat.code ? String(cat.code).trim() : "";
    if (codeFromCat) return codeFromCat;
    var merged = readStudentsArraysMerged();
    for (var m = 0; m < merged.length; m++) {
      var st = merged[m];
      if (!st) continue;
      var sn = String(st.name || "").trim();
      var sc = String(st.studentCode || "").trim();
      if (name && sn === name) return sc || String(st.id || catalogStudentId);
    }
    return catalogStudentId;
  }

  function distinctStudentNotificationStorageKeys(catalogStudentId, oid) {
    var out = [];
    var seen = Object.create(null);
    [String(catalogStudentId || "").trim(), String(oid || "").trim()].forEach(function (x) {
      if (!x || seen[x]) return;
      seen[x] = true;
      out.push("student_notifications_" + x);
    });
    return out;
  }

  function appendWeeklyProgramStudentNotifications(catalogStudentId, oid) {
    var keys = distinctStudentNotificationStorageKeys(catalogStudentId, oid);
    for (var ki = 0; ki < keys.length; ki++) {
      var k = keys[ki];
      var list = [];
      try {
        var raw = localStorage.getItem(k);
        if (raw) {
          var p = JSON.parse(raw);
          if (Array.isArray(p)) list = p;
          else if (p && typeof p === "object") list = [p];
        }
      } catch (e) {}
      list.push({
        type: "program",
        text: "Koçunuz yeni haftalık programınızı gönderdi. Hemen inceleyin!",
        read: false,
        date: new Date().toISOString(),
      });
      try {
        localStorage.setItem(k, JSON.stringify(list));
      } catch (e2) {}
    }
  }

  function readPreviousActivePayloadForArchive(oid, catId) {
    var prevPayload = null;
    try {
      var prevO = localStorage.getItem("active_program_" + oid);
      if (prevO) prevPayload = JSON.parse(prevO);
    } catch (e0) {}
    if (!prevPayload && catId && String(oid) !== String(catId)) {
      try {
        var prevC = localStorage.getItem("active_program_" + catId);
        if (prevC) prevPayload = JSON.parse(prevC);
      } catch (e1) {}
    }
    return prevPayload;
  }

  window.saveActiveWeeklyProgramForStudent = function (catalogStudentId, currentProgramData) {
    if (!catalogStudentId || !currentProgramData) return;
    var oid = resolveOgrenciIdFromStorage(catalogStudentId, currentProgramData.studentName);
    var catId = String(catalogStudentId || "").trim();
    var payload = {
      version: 1,
      catalogStudentId: catalogStudentId,
      ogrenciId: oid,
      program: currentProgramData,
      tasks: programToTasks(currentProgramData),
      sentAt: new Date().toISOString(),
    };
    try {
      var oldP = readPreviousActivePayloadForArchive(oid, catId);
      if (oldP) pushWeeklyProgramArchive(oid, oldP);
      localStorage.setItem("active_program_" + catId, JSON.stringify(payload));
      if (String(oid) !== catId) {
        localStorage.setItem("active_program_" + oid, JSON.stringify(payload));
      }
      appendWeeklyProgramStudentNotifications(catId, oid);
    } catch (err) {
      if (typeof window.alert === "function") window.alert("Program gönderilemedi: depolama dolu veya izin yok.");
    }
  };

  window.saveActiveWeeklyProgramsBulkForStudent = function (catalogStudentId, programs) {
    if (!catalogStudentId || !programs || !programs.length) return;
    var oid = resolveOgrenciIdFromStorage(catalogStudentId, programs[0].studentName);
    var catId = String(catalogStudentId || "").trim();
    var allTasks = [];
    var uid = 0;
    for (var i = 0; i < programs.length; i++) {
      var p = programs[i];
      var prefix = (p.title || "Program " + (i + 1)) + " · ";
      var dayTasks = programToTasks(p);
      for (var j = 0; j < dayTasks.length; j++) {
        var t = dayTasks[j];
        allTasks.push({
          id: "tb-" + uid++,
          dayIndex: t.dayIndex,
          label: prefix + t.label,
          done: false,
        });
      }
    }
    var payload = {
      version: 2,
      catalogStudentId: catalogStudentId,
      ogrenciId: oid,
      programs: programs,
      tasks: allTasks,
      sentAt: new Date().toISOString(),
    };
    try {
      var oldP2 = readPreviousActivePayloadForArchive(oid, catId);
      if (oldP2) pushWeeklyProgramArchive(oid, oldP2);
      localStorage.setItem("active_program_" + catId, JSON.stringify(payload));
      if (String(oid) !== catId) {
        localStorage.setItem("active_program_" + oid, JSON.stringify(payload));
      }
      appendWeeklyProgramStudentNotifications(catId, oid);
    } catch (err2) {
      if (typeof window.alert === "function") window.alert("Programlar gönderilemedi: depolama dolu veya izin yok.");
    }
  };

  root = document.getElementById("wp-saved-root");
  if (!root) return;

  selStudent = document.getElementById("wp-saved-student");
  listEl = document.getElementById("wp-saved-list");
  emptyEl = document.getElementById("wp-saved-empty");
  pdfTarget = document.getElementById("wp-pdf-source");
  linkNew = document.getElementById("wp-link-new-program");

  function renderPdfPreview(program) {
    if (!pdfTarget) return;
    pdfTarget.querySelector(".wp-pdf__title").textContent = program.title || "Haftalık Program";
    pdfTarget.querySelector(".wp-pdf__student").textContent = program.studentName || "—";
    var weekEl = pdfTarget.querySelector(".wp-pdf__week");
    var monday = program.weekStartISO ? parseISODate(program.weekStartISO) : null;
    if (weekEl) {
      weekEl.textContent = monday ? "Plan haftası: " + formatWeekRangeTurkish(monday) : "";
    }
    var tbody = pdfTarget.querySelector(".wp-pdf__tbody");
    tbody.innerHTML = "";
    var days = program.days || {};
    for (var i = 0; i < 7; i++) {
      var tr = document.createElement("tr");
      var th = document.createElement("th");
      if (monday) {
        var d = addDays(monday, i);
        th.textContent = DAYS_SHORT[i] + " " + d.getDate() + " " + MONTHS_SHORT[d.getMonth()];
      } else {
        th.textContent = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"][i];
      }
      var td = document.createElement("td");
      var items = days[String(i)] || [];
      td.textContent = items.length ? items.map(taskLine).join(" \n ") : "—";
      td.style.whiteSpace = "pre-wrap";
      tr.appendChild(th);
      tr.appendChild(td);
      tbody.appendChild(tr);
    }
  }

  function syncNewProgramLink() {
    if (!linkNew || !selStudent) return;
    linkNew.href = selStudent.value
      ? "haftalik-program-olusturucu.html?student=" + encodeURIComponent(selStudent.value) + "&new=1"
      : "haftalik-program-olusturucu.html";
  }

  function ensureCoachInsightHost() {
    if (!root || document.getElementById("wp-coach-insight")) return;
    var box = document.createElement("section");
    box.id = "wp-coach-insight";
    box.className = "card";
    box.style.marginBottom = "1rem";
    box.hidden = true;
    box.setAttribute("aria-label", "Öğrenci paneli özeti");
    var toolbar = root.querySelector(".wp-toolbar");
    if (toolbar && toolbar.nextSibling) {
      root.insertBefore(box, toolbar.nextSibling);
    } else if (listEl && listEl.parentNode) {
      listEl.parentNode.insertBefore(box, listEl);
    } else {
      root.appendChild(box);
    }
  }

  function coachFocusTodayMax(sid) {
    if (!window.DereceOgrenciBridge || !sid) return 0;
    var ids = [sid];
    var cat = (window.DereceStudentCatalog || []).find(function (s) {
      return s && s.id === sid;
    });
    if (cat && cat.code) ids.push(String(cat.code).trim());
    var max = 0;
    for (var i = 0; i < ids.length; i++) {
      if (!ids[i]) continue;
      var t = window.DereceOgrenciBridge.todayFocusMinutes(ids[i]);
      if (t > max) max = t;
    }
    return max;
  }

  function readActiveProgramForCatalogStudent(sid) {
    if (!sid) return null;
    var cat = (window.DereceStudentCatalog || []).find(function (s) {
      return s && s.id === sid;
    });
    var tries = [String(sid)];
    if (cat && cat.code) tries.push(String(cat.code).trim());
    for (var i = 0; i < tries.length; i++) {
      if (!tries[i]) continue;
      try {
        var raw = localStorage.getItem("active_program_" + tries[i]);
        if (!raw) continue;
        return JSON.parse(raw);
      } catch (e0) {}
    }
    return null;
  }

  function escapeHtmlInsight(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function taskStatusLabelCoach(t) {
    var s = String((t && t.studentStatus) || "").toLowerCase();
    if (s === "tamamlandi" || (t && t.done)) return "Tamamlandı";
    if (s === "yapilamadi") return "Yapılamadı";
    return "Bekliyor";
  }

  function updateCoachInsight(sid) {
    ensureCoachInsightHost();
    var box = document.getElementById("wp-coach-insight");
    if (!box) return;
    if (!sid) {
      box.hidden = true;
      box.innerHTML = "";
      return;
    }
    var parts = [];
    if (window.DereceOgrenciBridge) {
      var sum = window.DereceOgrenciBridge.readCoachCompletedSummary(sid);
      if (sum && sum.data && sum.data.totalCount > 0) {
        parts.push(
          "Öğrenci <strong>" +
            sum.data.completedCount +
            "</strong> / " +
            sum.data.totalCount +
            " görevi tamamladı."
        );
      }
      var focus = coachFocusTodayMax(sid);
      if (focus > 0) {
        parts.push("Bugünkü odak süresi (panel, Pomodoro): <strong>" + focus + "</strong> dk.");
      }
    }

    var taskLines = [];
    var active = readActiveProgramForCatalogStudent(sid);
    if (active && Array.isArray(active.tasks) && active.tasks.length) {
      active.tasks.forEach(function (t) {
        if (!t) return;
        var di = t.dayIndex != null ? Number(t.dayIndex) : 0;
        if (di < 0 || di > 6) di = 0;
        var lbl = String(t.label || t.summary || "").trim();
        if (!lbl) return;
        var st = taskStatusLabelCoach(t);
        var note = String(t.studentNote || "").trim();
        var line =
          "<strong>" +
          escapeHtmlInsight(DAYS_SHORT[di]) +
          "</strong> · " +
          escapeHtmlInsight(lbl) +
          " — " +
          escapeHtmlInsight(st);
        if (note && st === "Yapılamadı") {
          line += ' <span style="color:var(--text-muted,#64748b)">(Not: ' + escapeHtmlInsight(note) + ")</span>";
        }
        taskLines.push(line);
      });
    }

    var html =
      '<div class="distribution-head"><h3>Öğrenci paneli özeti</h3></div><p class="distribution-sub">';
    if (parts.length) {
      html += parts.join(" ");
    } else {
      html +=
        "Henüz görev tamamlama veya Pomodoro kaydı yok. Öğrenci panelinde işaretlendiğinde sayfa yenilenince burada görünür.";
    }
    html += "</p>";
    if (taskLines.length) {
      html +=
        '<p class="distribution-sub" style="margin:0.65rem 0 0.35rem;font-weight:600">Gönderilmiş aktif program — öğrenci durumu</p><ul class="distribution-sub" style="margin:0;padding-left:1.25rem;font-size:0.88rem;line-height:1.55;max-height:14rem;overflow-y:auto">';
      taskLines.forEach(function (line) {
        html += '<li style="margin-bottom:0.35rem">' + line + "</li>";
      });
      html += "</ul>";
    }
    box.innerHTML = html;
    box.hidden = false;
  }

  function renderList() {
    var sid = selStudent.value;
    syncNewProgramLink();
    if (!listEl || !emptyEl) return;
    listEl.innerHTML = "";
    if (!sid) {
      listEl.innerHTML = "";
      emptyEl.hidden = false;
      emptyEl.textContent = "Listelemek için bir öğrenci seçin.";
      updateCoachInsight("");
      return;
    }
    var programs = window.WeeklyProgramStore.listByStudent(sid);
    if (!programs.length) {
      listEl.innerHTML = "";
      emptyEl.hidden = false;
      emptyEl.textContent = "Bu öğrenci için kayıtlı haftalık program yok. Oluşturucudan yeni program ekleyebilirsiniz.";
      updateCoachInsight(sid);
      return;
    }
    emptyEl.hidden = true;
    programs
      .slice()
      .sort(function (a, b) {
        return (b.updatedAt || "").localeCompare(a.updatedAt || "");
      })
      .forEach(function (p) {
        var card = document.createElement("article");
        card.className = "wp-saved-card card";
        var dateStr = "";
        try {
          dateStr = p.updatedAt ? new Date(p.updatedAt).toLocaleString("tr-TR") : "";
        } catch (e) {}
        card.innerHTML =
          '<div class="wp-saved-card__body">' +
          '<h3 class="wp-saved-card__title"></h3>' +
          '<p class="wp-saved-card__meta"></p>' +
          "</div>" +
          '<div class="wp-saved-card__actions">' +
          '<button type="button" class="btn-export wp-saved-edit">Düzenle</button>' +
          '<button type="button" class="btn-add wp-saved-pdf">PDF indir</button>' +
          '<button type="button" class="wp-btn-send-program wp-saved-send" title="Öğrenci panelinde görev listesi olarak görünsün">🚀 Kaydet ve Öğrenciye Gönder</button>' +
          "</div>";
        card.querySelector(".wp-saved-card__title").textContent = p.title || "Program";
        card.querySelector(".wp-saved-card__meta").textContent = dateStr ? "Son güncelleme: " + dateStr : "";
        card.querySelector(".wp-saved-edit").addEventListener("click", function () {
          window.location.href =
            "haftalik-program-olusturucu.html?student=" + encodeURIComponent(sid) + "&edit=" + encodeURIComponent(p.id);
        });
        card.querySelector(".wp-saved-pdf").addEventListener("click", function () {
          renderPdfPreview(p);
          var fn = (p.title || "program") + " - " + (p.studentName || "");
          var pr = window.WeeklyProgramPdf && window.WeeklyProgramPdf.download(pdfTarget, fn);
          if (pr && typeof pr.catch === "function") {
            pr.catch(function (err) {
              console.error("[weekly-saved] PDF", err);
              var msg =
                window.WeeklyProgramPdf && typeof window.WeeklyProgramPdf.formatPdfError === "function"
                  ? window.WeeklyProgramPdf.formatPdfError(err)
                  : "PDF oluşturulamadı.";
              window.alert(msg);
            });
          }
        });
        card.querySelector(".wp-saved-send").addEventListener("click", function () {
          if (typeof window.saveActiveWeeklyProgramForStudent === "function") {
            window.saveActiveWeeklyProgramForStudent(sid, p);
          }
        });
        listEl.appendChild(card);
      });
    updateCoachInsight(sid);
  }

  function sendAllProgramsForSelectedStudent() {
    var sid = selStudent && selStudent.value;
    if (!sid) {
      if (typeof window.alert === "function") window.alert("Önce listeden bir öğrenci seçin.");
      return;
    }
    var programs = window.WeeklyProgramStore.listByStudent(sid);
    if (!programs.length) {
      if (typeof window.alert === "function") window.alert("Bu öğrenci için gönderilecek program yok.");
      return;
    }
    if (typeof window.saveActiveWeeklyProgramsBulkForStudent === "function") {
      window.saveActiveWeeklyProgramsBulkForStudent(sid, programs);
    }
  }

  function ensureBulkSendButton() {
    var tb = document.querySelector(".wp-toolbar__actions");
    if (!tb || document.getElementById("wp-send-all-programs")) return;
    var b = document.createElement("button");
    b.type = "button";
    b.id = "wp-send-all-programs";
    b.className = "wp-btn-send-program";
    b.style.marginRight = "0.5rem";
    b.setAttribute("title", "Seçili öğrencinin tüm kayıtlı programlarını öğrenci paneline gönderir");
    b.textContent = "🚀 Kaydet ve Öğrenciye Gönder";
    tb.insertBefore(b, tb.firstChild);
    b.addEventListener("click", sendAllProgramsForSelectedStudent);
  }

  fillStudents();
  ensureBulkSendButton();
  try {
    var pre = new URLSearchParams(window.location.search).get("student");
    if (pre && selStudent) selStudent.value = pre;
  } catch (e) {}
  selStudent.addEventListener("change", renderList);
  renderList();

  var footerSend = document.getElementById("wp-primary-save-send");
  if (footerSend) {
    footerSend.addEventListener("click", sendAllProgramsForSelectedStudent);
  }
})();
