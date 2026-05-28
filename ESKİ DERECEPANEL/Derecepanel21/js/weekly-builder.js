(function () {
  var board = document.getElementById("wp-board");
  if (!board) return;

  var DAYS_TR = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
  var DAYS_SHORT = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
  var MONTHS_SHORT = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  var SLOT_LABELS = ["Sabah", "Öğle", "İkindi", "Akşam"];
  var SLOT_PERIOD_CLASS = ["wp-slot--sabah", "wp-slot--ogle", "wp-slot--ikindi", "wp-slot--aksam"];

  var selStudent = document.getElementById("wp-student");
  var selTargetExam = document.getElementById("wp-target-exam");
  var inpTitle = document.getElementById("wp-title");
  var inpMotto = document.getElementById("wp-motto");
  var btnSave = document.getElementById("wp-save");
  var btnPdf = document.getElementById("wp-pdf");
  var btnPrint = document.getElementById("wp-print");
  var btnClear = document.getElementById("wp-clear");
  var metricsList = document.getElementById("wp-metrics-list");
  var metricsSoru = document.getElementById("wp-metrics-soru");
  var toastEl = document.getElementById("wp-toast");
  var deleteOverlay = document.getElementById("wp-delete-overlay");
  var deleteConfirmBtn = document.getElementById("wp-delete-confirm");
  var deleteCancelBtn = document.getElementById("wp-delete-cancel");
  var weekLabelEl = document.getElementById("wp-week-label");
  var btnWeekPrev = document.getElementById("wp-week-prev");
  var btnWeekNext = document.getElementById("wp-week-next");
  var pendingDeleteChip = null;

  var overlay = document.getElementById("modal-wp-task-overlay");
  var modalClose = document.getElementById("modal-wp-close");
  var btnModalCancel = document.getElementById("modal-wp-cancel");
  var formTask = document.getElementById("form-wp-task");
  var selSubject = document.getElementById("wp-m-subject");
  var selTopic = document.getElementById("wp-m-topic");
  var conceptListEl = document.getElementById("wp-m-concept-list");
  var conceptShellEl = document.getElementById("wp-m-concept-shell");
  var conceptToolbarEl = document.getElementById("wp-m-concept-toolbar");
  var btnConceptAll = document.getElementById("wp-m-concept-all");
  var btnConceptNone = document.getElementById("wp-m-concept-none");
  var conceptCountEl = document.getElementById("wp-m-concept-count");
  var selGorevTipi = document.getElementById("wp-m-gorev-tipi");
  var inpHedefSoru = document.getElementById("wp-m-hedef-soru");
  var inpSure = document.getElementById("wp-m-sure");
  var inpKaynak = document.getElementById("wp-m-kaynak");
  var inpVideo = document.getElementById("wp-m-video");
  var inpDate = document.getElementById("wp-m-date");
  var taNot = document.getElementById("wp-m-not");
  var modalSubtitle = document.getElementById("modal-wp-subtitle");

  var currentProgramId = null;
  var weekMonday = mondayOf(new Date());
  var modalCtx = { mode: "create", dayIndex: 0, slotIndex: 0, chipEl: null };

  function mondayOf(d) {
    var x = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
    var day = x.getDay();
    var diff = day === 0 ? -6 : 1 - day;
    x.setDate(x.getDate() + diff);
    return x;
  }

  function addDays(base, n) {
    var x = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 12, 0, 0, 0);
    x.setDate(x.getDate() + n);
    return x;
  }

  function toISODate(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function parseISODate(s) {
    if (!s) return null;
    var p = s.split("-");
    if (p.length !== 3) return null;
    return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10), 12, 0, 0, 0);
  }

  function formatWeekRangeTurkish() {
    var sun = addDays(weekMonday, 6);
    var opts = { day: "numeric", month: "long", year: "numeric" };
    return weekMonday.toLocaleDateString("tr-TR", opts) + " — " + sun.toLocaleDateString("tr-TR", opts);
  }

  function dayDateForIndex(i) {
    return addDays(weekMonday, i);
  }

  function formatDayHead(i) {
    var d = dayDateForIndex(i);
    return DAYS_SHORT[i] + " " + d.getDate() + " " + MONTHS_SHORT[d.getMonth()];
  }

  function toast(msg, kind) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.remove("wp-toast--success", "wp-toast--error");
    if (kind === "success") toastEl.classList.add("wp-toast--success");
    if (kind === "error") toastEl.classList.add("wp-toast--error");
    toastEl.hidden = false;
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () {
      toastEl.hidden = true;
      toastEl.classList.remove("wp-toast--success", "wp-toast--error");
    }, 3400);
  }

  function openDeleteConfirm(chip) {
    pendingDeleteChip = chip;
    if (deleteOverlay) {
      deleteOverlay.classList.add("is-open");
      deleteOverlay.setAttribute("aria-hidden", "false");
    }
  }

  function closeDeleteConfirm() {
    pendingDeleteChip = null;
    if (deleteOverlay) {
      deleteOverlay.classList.remove("is-open");
      deleteOverlay.setAttribute("aria-hidden", "true");
    }
  }

  function injectSkeletons() {
    for (var i = 0; i < 7; i++) {
      for (var s = 0; s < 4; s++) {
        var drop = getDropZone(i, s);
        if (!drop || drop.querySelector("[data-wp-skeleton]")) continue;
        var sk = document.createElement("div");
        sk.className = "wp-slot-skeleton";
        sk.setAttribute("data-wp-skeleton", "1");
        sk.innerHTML =
          '<div class="wp-slot-skeleton__line wp-slot-skeleton__line--med"></div><div class="wp-slot-skeleton__line wp-slot-skeleton__line--short"></div>';
        drop.insertBefore(sk, drop.firstChild);
      }
    }
  }

  function fillQuickAddDays() {
    var sel = document.getElementById("wp-qa-day");
    if (!sel) return;
    sel.innerHTML = "";
    for (var i = 0; i < 7; i++) {
      var opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = DAYS_TR[i] + " · " + formatDayHead(i);
      sel.appendChild(opt);
    }
  }

  var REMOVE_BTN_HTML =
    '<button type="button" class="wp-chip__remove wp-chip__remove--icon" aria-label="Sil" title="Sil">' +
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M10 11v6M14 11v6" stroke-linecap="round"/></svg>' +
    "</button>";

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
      opt.textContent = s.name + " (" + alanLabel(s.alan) + ")";
      selStudent.appendChild(opt);
    });
  }

  function alanLabel(a) {
    var m = { sayisal: "Sayısal", esit: "Eşit ağ.", sozel: "Sözel", dil: "Dil", tyt: "TYT" };
    return m[a] || a;
  }

  function emptyDaysObject() {
    var o = {};
    for (var i = 0; i < 7; i++) o[String(i)] = [];
    return o;
  }

  function buildBoardShell(boardEl) {
    boardEl.innerHTML = "";
    for (var i = 0; i < 7; i++) {
      var day = document.createElement("div");
      day.className = "wp-day";
      day.setAttribute("data-day-index", String(i));
      var head = document.createElement("div");
      head.className = "wp-day__head";
      var body = document.createElement("div");
      body.className = "wp-day__body";
      for (var s = 0; s < 4; s++) {
        var slot = document.createElement("div");
        slot.className = "wp-slot " + SLOT_PERIOD_CLASS[s];
        slot.setAttribute("data-day-index", String(i));
        slot.setAttribute("data-slot-index", String(s));
        var sh = document.createElement("div");
        sh.className = "wp-slot__head";
        var sl = document.createElement("span");
        sl.textContent = SLOT_LABELS[s];
        sh.appendChild(sl);
        var drop = document.createElement("div");
        drop.className = "wp-slot__drop";
        var ghost = document.createElement("button");
        ghost.type = "button";
        ghost.className = "wp-slot__ghost-add";
        ghost.textContent = "+ Görev Ekle";
        ghost.setAttribute("aria-label", SLOT_LABELS[s] + " dilimine görev ekle");
        (function (di, si) {
          ghost.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            var dayCol = board.querySelector('.wp-day[data-day-index="' + di + '"]');
            var dISO = dayCol ? dayCol.getAttribute("data-date") || "" : "";
            if (!dISO) dISO = toISODate(dayDateForIndex(di));
            openModal({
              mode: "create",
              dayIndex: di,
              slotIndex: si,
              dateISO: dISO,
              taskKind: "konu_calisma",
            });
          });
        })(i, s);
        drop.appendChild(ghost);
        slot.appendChild(sh);
        slot.appendChild(drop);
        body.appendChild(slot);
        wireSlotDrop(drop, i, s);
      }
      day.appendChild(head);
      day.appendChild(body);
      boardEl.appendChild(day);
    }
  }

  function getDropZone(dayIndex, slotIndex) {
    return board.querySelector(
      '.wp-slot[data-day-index="' + dayIndex + '"][data-slot-index="' + slotIndex + '"] .wp-slot__drop'
    );
  }

  function renderWeekChrome() {
    if (weekLabelEl) weekLabelEl.textContent = formatWeekRangeTurkish();
    syncPrintHeader();
    for (var i = 0; i < 7; i++) {
      var col = board.querySelector('.wp-day[data-day-index="' + i + '"]');
      if (!col) continue;
      col.setAttribute("data-date", toISODate(dayDateForIndex(i)));
      var head = col.querySelector(".wp-day__head");
      if (head) head.textContent = formatDayHead(i);
    }
    fillQuickAddDays();
    refreshMetrics();
  }

  function fillSubjectSelect() {
    if (!selSubject || !window.YksMufredatApi) return;
    selSubject.innerHTML = '<option value="">— Ders seçin —</option>';
    window.YksMufredatApi.getSubjects().forEach(function (s) {
      var opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = s.name + " · " + s.sinav;
      selSubject.appendChild(opt);
    });
  }

  function updateConceptToolbar() {
    if (!conceptToolbarEl || !conceptCountEl) return;
    var boxes = conceptListEl ? conceptListEl.querySelectorAll('input[type="checkbox"]') : [];
    var total = boxes.length;
    var checked = conceptListEl ? conceptListEl.querySelectorAll('input[type="checkbox"]:checked').length : 0;
    if (total === 0) {
      conceptToolbarEl.hidden = true;
      conceptCountEl.textContent = "";
      if (btnConceptAll) btnConceptAll.disabled = true;
      if (btnConceptNone) btnConceptNone.disabled = true;
      return;
    }
    conceptToolbarEl.hidden = false;
    conceptCountEl.textContent = checked + " / " + total + " seçili";
    if (btnConceptAll) btnConceptAll.disabled = checked === total;
    if (btnConceptNone) btnConceptNone.disabled = checked === 0;
  }

  function clearConceptList() {
    if (!conceptListEl) return;
    conceptListEl.innerHTML = "";
    var p = document.createElement("p");
    p.className = "wp-concept-empty";
    p.textContent = "Önce ders ve konu seçin.";
    conceptListEl.appendChild(p);
    updateConceptToolbar();
  }

  function renderConceptCheckboxes() {
    if (!conceptListEl || !selSubject || !selTopic) return;
    conceptListEl.innerHTML = "";
    var sid = selSubject.value;
    var tid = selTopic.value;
    if (!sid || !tid) {
      clearConceptList();
      return;
    }
    var list = window.YksMufredatApi.getConcepts(sid, tid);
    if (!list.length) {
      var empty = document.createElement("p");
      empty.className = "wp-concept-empty";
      empty.textContent = "Bu konu için kavram listesi yok.";
      conceptListEl.appendChild(empty);
      updateConceptToolbar();
      return;
    }
    list.forEach(function (c) {
      var safeId = "wp-cb-" + String(c.id).replace(/[^a-zA-Z0-9_-]/g, "_");
      var lab = document.createElement("label");
      lab.className = "wp-concept-cell";
      lab.setAttribute("for", safeId);
      var inp = document.createElement("input");
      inp.type = "checkbox";
      inp.className = "wp-concept-cell__input";
      inp.id = safeId;
      inp.value = c.id;
      inp.setAttribute("data-concept-name", c.name);
      var span = document.createElement("span");
      span.className = "wp-concept-cell__text";
      span.textContent = c.name;
      lab.appendChild(inp);
      lab.appendChild(span);
      conceptListEl.appendChild(lab);
    });
    updateConceptToolbar();
  }

  function getSelectedConceptIds() {
    if (!conceptListEl) return [];
    return Array.prototype.map.call(conceptListEl.querySelectorAll('input[type="checkbox"]:checked'), function (el) {
      return el.value;
    });
  }

  function setConceptCheckboxSelection(ids) {
    if (!conceptListEl) return;
    var set = {};
    (ids || []).forEach(function (id) {
      set[id] = true;
    });
    conceptListEl.querySelectorAll('input[type="checkbox"]').forEach(function (inp) {
      inp.checked = !!set[inp.value];
    });
    updateConceptToolbar();
  }

  function refreshTopicSelect() {
    if (!selTopic || !selSubject) return;
    selTopic.innerHTML = '<option value="">— Konu seçin —</option>';
    clearConceptList();
    var sid = selSubject.value;
    if (!sid) return;
    window.YksMufredatApi.getTopics(sid).forEach(function (t) {
      var opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = t.name;
      selTopic.appendChild(opt);
    });
  }

  function openModal(ctx) {
    modalCtx = ctx;
    if (!overlay) return;
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    var slotPart =
      ctx.slotIndex != null && ctx.slotIndex >= 0 ? " · " + SLOT_LABELS[ctx.slotIndex] : "";
    if (modalSubtitle) {
      modalSubtitle.textContent =
        "Merkezi YKS müfredatı · " + (ctx.dateISO || toISODate(dayDateForIndex(ctx.dayIndex))) + slotPart;
    }
    fillSubjectSelect();
    selGorevTipi.value = ctx.taskKind || "konu_calisma";

    if (ctx.mode === "edit" && ctx.existing) {
      var ex = ctx.existing;
      selSubject.value = ex.subjectId || "";
      refreshTopicSelect();
      selTopic.value = ex.topicId || "";
      renderConceptCheckboxes();
      var preIds = ex.conceptIds && ex.conceptIds.length ? ex.conceptIds : ex.conceptId ? [ex.conceptId] : [];
      setConceptCheckboxSelection(preIds);
      selGorevTipi.value = ex.taskKind || "konu_calisma";
      inpHedefSoru.value = ex.targetQuestions || "";
      inpSure.value = ex.durationMin || "";
      inpKaynak.value = ex.material || "";
      inpVideo.value = ex.videoUrl || "";
      inpDate.value = ex.dateISO || toISODate(dayDateForIndex(ctx.dayIndex));
      taNot.value = ex.coachNote || "";
    } else {
      selSubject.value = "";
      selTopic.innerHTML = '<option value="">— Konu seçin —</option>';
      clearConceptList();
      inpHedefSoru.value = "";
      inpSure.value = "";
      inpKaynak.value = "";
      inpVideo.value = "";
      inpDate.value = ctx.dateISO || toISODate(dayDateForIndex(ctx.dayIndex));
      taNot.value = "";
    }
    selSubject.focus();
  }

  function closeModal() {
    if (!overlay) return;
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
  }

  function gorevTipiLabel(val) {
    var m = {
      konu_calisma: "Konu çalışması",
      soru_cozme: "Soru çözümü",
      deneme_cozme: "Deneme / analiz",
      etut_mola: "Etüt / Mola",
      tekrar: "Tekrar / pekiştirme",
      video: "Video / dijital içerik",
    };
    return m[val] || val;
  }

  function conceptDisplayLine(t) {
    return t.conceptJoined || (t.conceptNames && t.conceptNames.length ? t.conceptNames.join(" · ") : "") || t.conceptName || "";
  }

  function buildSummary(t) {
    if (t.taskKind === "etut_mola") {
      var bits = [];
      if (t.durationMin) bits.push(t.durationMin + " dk");
      if (t.coachNote) bits.push(t.coachNote);
      return "Etüt / Mola" + (bits.length ? " — " + bits.join(" · ") : "");
    }
    var g = gorevTipiLabel(t.taskKind);
    var core = (t.subjectName || "") + " › " + (t.topicName || "") + " › " + conceptDisplayLine(t);
    var bits = [];
    if (t.durationMin) bits.push(t.durationMin + " dk");
    if (t.targetQuestions) bits.push(t.targetQuestions + " soru");
    return g + ": " + core + (bits.length ? " (" + bits.join(", ") + ")" : "");
  }

  function readBoardFromDom() {
    var days = emptyDaysObject();
    for (var i = 0; i < 7; i++) {
      for (var s = 0; s < 4; s++) {
        var drop = getDropZone(i, s);
        if (!drop) continue;
        drop.querySelectorAll(".wp-chip").forEach(function (chip) {
          var raw = chip.getAttribute("data-wp-task");
          if (raw) {
            try {
              var t = JSON.parse(raw);
              t.slotIndex = s;
              days[String(i)].push(t);
            } catch (e) {}
          } else {
            days[String(i)].push({
              chipId: chip.getAttribute("data-chip-id") || "",
              label: chip.getAttribute("data-label") || "",
              track: chip.getAttribute("data-track") || "genel",
              slotIndex: s,
            });
          }
        });
      }
    }
    return days;
  }

  function clearBoard() {
    for (var i = 0; i < 7; i++) {
      for (var s = 0; s < 4; s++) {
        var drop = getDropZone(i, s);
        if (!drop) continue;
        drop.querySelectorAll(".wp-chip").forEach(function (ch) {
          ch.remove();
        });
        drop.querySelectorAll("[data-wp-skeleton]").forEach(function (n) {
          n.remove();
        });
      }
    }
  }

  function tagVariant(kind) {
    if (kind === "soru_cozme") return "questions";
    if (kind === "deneme_cozme") return "exam";
    if (kind === "etut_mola") return "break";
    if (kind === "konu_calisma" || kind === "tekrar" || kind === "video") return "study";
    return "legacy";
  }

  function iconSvgForKind(kind) {
    if (kind === "soru_cozme") {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>';
    }
    if (kind === "deneme_cozme") {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg>';
    }
    if (kind === "etut_mola") {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h12v8a2 2 0 002 2h4a2 2 0 002-2V8"/><path d="M6 1v3M10 1v3M14 1v3"/></svg>';
    }
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>';
  }

  function shortPreview(task) {
    if (task.taskKind === "etut_mola") {
      var n = (task.coachNote || "Mola").trim().split(/\s+/).filter(Boolean);
      return n.slice(0, 3).join(" ") || "Etüt";
    }
    var line = ((task.subjectName || "") + " " + (task.topicName || "")).trim();
    var w = line.split(/\s+/).filter(Boolean);
    return w.slice(0, 3).join(" ") || gorevTipiLabel(task.taskKind);
  }

  /** Grid kartında gösterilecek ana başlık (konu + ders, tam okunur) */
  function cardTitle(task) {
    if (task.taskKind === "etut_mola") {
      var m = (task.coachNote || "").trim();
      return m || "Etüt / Mola";
    }
    var topic = (task.topicName || "").trim();
    var sub = (task.subjectName || "").trim();
    if (topic && sub) return topic + " — " + sub;
    if (topic) return topic;
    if (sub) return sub;
    return gorevTipiLabel(task.taskKind || "konu_calisma");
  }

  function cardMetaLine(task) {
    if (task.taskKind === "etut_mola") return "";
    var c = conceptDisplayLine(task);
    if (c) return c;
    return gorevTipiLabel(task.taskKind || "konu_calisma");
  }

  function wireChip(chip) {
    var removeBtn = chip.querySelector(".wp-chip__remove");
    var editBtn = chip.querySelector(".wp-chip__edit");
    if (removeBtn) {
      removeBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        e.preventDefault();
        openDeleteConfirm(chip);
      });
    }
    if (editBtn) {
      editBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        var raw = chip.getAttribute("data-wp-task");
        if (!raw) return;
        try {
          var t = JSON.parse(raw);
          var col = chip.closest(".wp-day");
          var slotEl = chip.closest(".wp-slot");
          var di = col ? parseInt(col.getAttribute("data-day-index"), 10) : 0;
          var si = slotEl ? parseInt(slotEl.getAttribute("data-slot-index"), 10) : 0;
          openModal({
            mode: "edit",
            dayIndex: di,
            slotIndex: si,
            chipEl: chip,
            existing: t,
            dateISO: t.dateISO,
            taskKind: t.taskKind,
          });
        } catch (err) {}
      });
    }
    chip.addEventListener("click", function (e) {
      if (e.target.closest("button")) return;
      var raw = chip.getAttribute("data-wp-task");
      if (!raw) return;
      try {
        var t = JSON.parse(raw);
        var col = chip.closest(".wp-day");
        var slotEl = chip.closest(".wp-slot");
        var di = col ? parseInt(col.getAttribute("data-day-index"), 10) : 0;
        var si = slotEl ? parseInt(slotEl.getAttribute("data-slot-index"), 10) : 0;
        openModal({
          mode: "edit",
          dayIndex: di,
          slotIndex: si,
          chipEl: chip,
          existing: t,
          dateISO: t.dateISO,
          taskKind: t.taskKind,
        });
      } catch (err2) {}
    });
    chip.addEventListener("dragstart", function (e) {
      e.stopPropagation();
      var col = chip.closest(".wp-day");
      var slotEl = chip.closest(".wp-slot");
      var dayIndex = col ? col.getAttribute("data-day-index") : "0";
      var fromSlot = slotEl ? parseInt(slotEl.getAttribute("data-slot-index"), 10) : 0;
      e.dataTransfer.setData(
        "text/plain",
        JSON.stringify({
          chipId: chip.getAttribute("data-chip-id"),
          fromDay: dayIndex,
          fromSlot: fromSlot,
        })
      );
      e.dataTransfer.effectAllowed = "move";
      chip.classList.add("wp-chip--dragging");
    });
    chip.addEventListener("dragend", function () {
      chip.classList.remove("wp-chip--dragging");
    });
  }

  function appendTaskChip(dayIndex, task, slotIndex) {
    var si = slotIndex != null ? slotIndex : task.slotIndex != null ? task.slotIndex : 0;
    task.slotIndex = si;
    var drop = getDropZone(dayIndex, si);
    if (!drop) return;
    if (!task.chipId) task.chipId = window.WeeklyProgramStore.uid();
    task.summary = task.summary || buildSummary(task);

    var kind = task.taskKind || "konu_calisma";
    var chip = document.createElement("div");
    chip.className = "wp-chip wp-task-tag wp-task-tag--" + tagVariant(kind);
    chip.setAttribute("data-wp-kind", kind);
    chip.setAttribute("draggable", "true");
    chip.setAttribute("data-chip-id", task.chipId);
    chip.setAttribute("data-wp-task", JSON.stringify(task));
    chip.title = task.summary;
    if (kind === "etut_mola" && (task.coachNote || "").trim() === "☕ Dinlenme & Mola") {
      chip.classList.add("wp-task-tag--quick-break");
    }

    var ico = document.createElement("span");
    ico.className = "wp-task-tag__ico";
    ico.setAttribute("aria-hidden", "true");
    ico.innerHTML = iconSvgForKind(kind);

    var col = document.createElement("div");
    col.className = "wp-task-card__col";
    var titleEl = document.createElement("span");
    titleEl.className = "wp-task-card__title";
    titleEl.textContent = cardTitle(task);
    col.appendChild(titleEl);
    var metaStr = cardMetaLine(task);
    if (metaStr) {
      var metaEl = document.createElement("span");
      metaEl.className = "wp-task-card__meta";
      metaEl.textContent = metaStr;
      col.appendChild(metaEl);
    }

    var actions = document.createElement("div");
    actions.className = "wp-task-chip__actions";
    actions.innerHTML =
      '<button type="button" class="wp-chip__edit wp-chip__edit--icon" aria-label="Düzenle" title="Düzenle">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
      "</button>" +
      REMOVE_BTN_HTML;

    chip.appendChild(ico);
    chip.appendChild(col);
    chip.appendChild(actions);
    drop.appendChild(chip);
    wireChip(chip);
    refreshMetrics();
  }

  /** Araç kutusundan Etüt/Mola sürüklenince — modal açmadan doğrudan mola kartı */
  function appendQuickBreakChip(dayIndex, slotIndex) {
    var dayCol = board.querySelector('.wp-day[data-day-index="' + dayIndex + '"]');
    var dISO = dayCol ? dayCol.getAttribute("data-date") || "" : "";
    if (!dISO) dISO = toISODate(dayDateForIndex(dayIndex));
    var si = slotIndex != null ? slotIndex : 0;
    var task = {
      chipId: window.WeeklyProgramStore.uid(),
      taskKind: "etut_mola",
      subjectId: "",
      topicId: "",
      conceptIds: [],
      conceptNames: [],
      conceptJoined: "",
      subjectName: "Etüt",
      topicName: "Mola",
      targetQuestions: "",
      durationMin: "",
      material: "",
      videoUrl: "",
      dateISO: dISO,
      coachNote: "☕ Dinlenme & Mola",
      slotIndex: si,
    };
    task.summary = buildSummary(task);
    appendTaskChip(dayIndex, task, si);
  }

  function legacyAddChip(dayIndex, label, track, chipId, slotIndex) {
    var si = slotIndex != null ? slotIndex : 0;
    var drop = getDropZone(dayIndex, si);
    if (!drop) return;
    var chip = document.createElement("div");
    chip.className = "wp-chip wp-task-tag wp-task-tag--legacy";
    chip.setAttribute("draggable", "true");
    chip.setAttribute("data-label", label);
    chip.setAttribute("data-track", track || "genel");
    chip.setAttribute("data-chip-id", chipId || window.WeeklyProgramStore.uid());
    chip.title = label;
    chip.innerHTML =
      '<span class="wp-task-tag__ico" aria-hidden="true">' +
      iconSvgForKind("konu_calisma") +
      '</span><div class="wp-task-card__col"><span class="wp-task-card__title"></span></div><div class="wp-task-chip__actions">' +
      REMOVE_BTN_HTML +
      "</div>";
    chip.querySelector(".wp-task-card__title").textContent = label;
    wireChip(chip);
    drop.appendChild(chip);
    refreshMetrics();
  }

  function normalizeStoredTask(item) {
    if (!item || item.conceptIds && item.conceptIds.length) return item;
    if (item.conceptId) {
      var copy = Object.assign({}, item);
      copy.conceptIds = [item.conceptId];
      if (item.conceptName) copy.conceptNames = [item.conceptName];
      copy.conceptJoined = item.conceptName || "";
      return copy;
    }
    return item;
  }

  function hasStructuredTask(item) {
    if (!item) return false;
    if (item.taskKind === "etut_mola") return true;
    return !!(item.subjectId && item.topicId && (item.conceptIds && item.conceptIds.length || item.conceptId));
  }

  function loadDays(days) {
    clearBoard();
    if (!days) return;
    for (var i = 0; i < 7; i++) {
      var arr = days[String(i)] || [];
      arr.forEach(function (item) {
        var si = item.slotIndex != null ? parseInt(item.slotIndex, 10) : 0;
        if (isNaN(si) || si < 0 || si > 3) si = 0;
        if (hasStructuredTask(item)) {
          appendTaskChip(i, normalizeStoredTask(item), si);
        } else if (item.label) {
          legacyAddChip(i, item.label, item.track || "genel", item.chipId, si);
        }
      });
    }
    renderWeekChrome();
  }

  function getQuery() {
    var q = {};
    window.location.search
      .replace(/^\?/, "")
      .split("&")
      .forEach(function (pair) {
        var p = pair.split("=");
        if (p[0]) q[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || "");
      });
    return q;
  }

  function loadFromQueryOrStorage() {
    var q = getQuery();
    var sid = q.student || "";
    var pid = q.edit || "";
    if (sid) selStudent.value = sid;
    if (pid && sid && window.WeeklyProgramStore) {
      var prog = window.WeeklyProgramStore.getProgram(sid, pid);
      if (prog) {
        currentProgramId = prog.id;
        inpTitle.value = prog.title || "";
        if (selTargetExam) selTargetExam.value = prog.targetExam || "";
        if (inpMotto) inpMotto.value = prog.motto || "";
        if (prog.weekStartISO) {
          var d0 = parseISODate(prog.weekStartISO);
          if (d0) weekMonday = mondayOf(d0);
        }
        loadDays(prog.days);
        toast("Program düzenleme modunda yüklendi.", "success");
        return;
      }
    }
    currentProgramId = null;
    if (selTargetExam) selTargetExam.value = "";
    if (inpMotto) inpMotto.value = "";
    if (q.new === "1") {
      inpTitle.value = "";
      weekMonday = mondayOf(new Date());
      loadDays(emptyDaysObject());
      if (sid) toast("Yeni program — öğrenci seçildi.", "success");
    } else {
      loadDays(emptyDaysObject());
    }
    tryConsumeTransferGorev();
  }

  /** Görüşme Odası (Strateji Merkezi) → görev metni tek seferlik */
  function tryConsumeTransferGorev() {
    try {
      var raw = localStorage.getItem("transfer_gorev");
      if (!raw || !String(raw).trim()) return;
      var o = JSON.parse(raw);
      localStorage.removeItem("transfer_gorev");
      var text = String((o && o.text) || "").trim();
      if (!text || typeof legacyAddChip !== "function" || !window.WeeklyProgramStore) return;
      legacyAddChip(0, text, "strateji_merkezi", window.WeeklyProgramStore.uid(), 0);
      toast("Görüşme notundan görev haftalık programa eklendi.", "success");
      refreshMetrics();
    } catch (e) {
      try {
        localStorage.removeItem("transfer_gorev");
      } catch (e2) {}
    }
  }

  function collectPdfRows() {
    var days = readBoardFromDom();
    var rows = [];
    for (var i = 0; i < 7; i++) {
      var list = days[String(i)] || [];
      var slotTexts = ["", "", "", ""];
      list.forEach(function (t) {
        var si = t.slotIndex != null ? parseInt(t.slotIndex, 10) : 0;
        if (isNaN(si) || si < 0 || si > 3) si = 0;
        var line = t.summary || t.label || "";
        if (!line && t.taskKind) {
          try {
            line = buildSummary(t);
          } catch (e1) {
            line = "";
          }
        }
        slotTexts[si] = slotTexts[si] ? slotTexts[si] + "\n• " + line : "• " + line;
      });
      rows.push({
        dayLabel: DAYS_TR[i] + " (" + formatDayHead(i) + ")",
        slots: slotTexts.map(function (x) {
          return x || "—";
        }),
      });
    }
    return rows;
  }

  function targetExamLabel() {
    if (!selTargetExam || !selTargetExam.value) return "";
    var opt = selTargetExam.options[selTargetExam.selectedIndex];
    return opt ? opt.textContent : selTargetExam.value;
  }

  /** Yalnızca PDF / yazdır çıktısında görünen üst bilgi (grid üstü) */
  function syncPrintHeader() {
    var titleEl = document.getElementById("wp-print-doc-title");
    var studentEl = document.getElementById("wp-print-student");
    var weekEl = document.getElementById("wp-print-week-range");
    var optLine = document.getElementById("wp-print-optional-line");
    if (!titleEl || !studentEl || !weekEl) return;
    titleEl.textContent = (inpTitle && inpTitle.value.trim()) || "Haftalık Program";
    var sid = selStudent && selStudent.value;
    var stRec = window.DereceStudentCatalogById && sid ? window.DereceStudentCatalogById[sid] : null;
    studentEl.textContent = stRec ? stRec.name : "—";
    weekEl.textContent = formatWeekRangeTurkish();
    if (optLine) {
      var bits = [];
      var te = targetExamLabel();
      var mo = inpMotto && inpMotto.value.trim();
      if (te) bits.push("Hedef sınav: " + te);
      if (mo) bits.push("Motto: " + mo);
      optLine.textContent = bits.join(" · ");
      optLine.hidden = bits.length === 0;
    }
  }

  function handleSave() {
    var sid = selStudent.value;
    if (!sid) {
      toast("Lütfen öğrenci seçin.", "error");
      return;
    }
    var title = inpTitle.value.trim() || "Haftalık Program — " + new Date().toLocaleDateString("tr-TR");
    var st = window.DereceStudentCatalogById && window.DereceStudentCatalogById[sid];
    var prog = {
      id: currentProgramId || window.WeeklyProgramStore.uid(),
      title: title,
      studentId: sid,
      studentName: st ? st.name : sid,
      weekStartISO: toISODate(weekMonday),
      days: readBoardFromDom(),
      targetExam: selTargetExam ? selTargetExam.value : "",
      motto: inpMotto ? inpMotto.value.trim() : "",
    };
    window.WeeklyProgramStore.saveProgram(sid, prog);
    currentProgramId = prog.id;
    if (typeof window.saveActiveWeeklyProgramForStudent === "function") {
      window.saveActiveWeeklyProgramForStudent(sid, prog);
    }
    var url =
      "haftalik-program-olusturucu.html?student=" + encodeURIComponent(sid) + "&edit=" + encodeURIComponent(prog.id);
    window.history.replaceState({}, "", url);
    toast("Program kaydedildi ve öğrenciye gönderildi.", "success");
  }

  function handlePdf() {
    syncPrintHeader();
    var st = window.DereceStudentCatalogById && window.DereceStudentCatalogById[selStudent.value];
    var fname = (inpTitle.value.trim() || "haftalik-program") + (st ? " - " + st.name : "");
    if (!window.WeeklyProgramPdf) {
      toast("PDF modülü yüklenemedi.", "error");
      return;
    }
    toast("PDF hazırlanıyor…");
    if (btnPdf) {
      btnPdf.disabled = true;
      btnPdf.setAttribute("aria-busy", "true");
    }
    var finish = function () {
      if (btnPdf) {
        btnPdf.disabled = false;
        btnPdf.removeAttribute("aria-busy");
      }
    };

    function runTableFallback() {
      if (!window.WeeklyProgramPdf.downloadPdf) {
        finish();
        return Promise.reject(new Error("PDF tablo modülü yok."));
      }
      var payload = {
        title: inpTitle.value.trim() || "Haftalık Program",
        studentName: st ? st.name : "—",
        weekRange: formatWeekRangeTurkish(),
        motto: inpMotto ? inpMotto.value.trim() : "",
        targetExam: targetExamLabel(),
        rows: collectPdfRows(),
      };
      return window.WeeklyProgramPdf.downloadPdf(fname, payload);
    }

    /* html2canvas + karma grid CSS sık beyaz PDF üretir; çıktı her zaman dolu olsun diye tablo PDF kullanılıyor. */
    var p = runTableFallback();

    if (p && typeof p.then === "function") {
      p.then(function () {
        finish();
        toast("PDF indirildi.", "success");
      }).catch(function (err) {
        finish();
        var msg =
          window.WeeklyProgramPdf && typeof window.WeeklyProgramPdf.formatPdfError === "function"
            ? window.WeeklyProgramPdf.formatPdfError(err)
            : err && err.message
              ? String(err.message)
              : "PDF oluşturulamadı.";
        console.error("[weekly-builder] PDF", err);
        toast(msg, "error");
      });
    } else {
      finish();
    }
  }

  function handlePrint() {
    syncPrintHeader();
    var zone = document.getElementById("wp-calendar-print-zone");
    if (zone) zone.classList.add("is-wp-pdf-capture");
    document.body.classList.add("wp-print-mode");
    var cleaned = false;
    function cleanup() {
      if (cleaned) return;
      cleaned = true;
      if (zone) zone.classList.remove("is-wp-pdf-capture");
      document.body.classList.remove("wp-print-mode");
    }
    window.addEventListener("afterprint", cleanup, { once: true });
    setTimeout(function () {
      window.print();
      setTimeout(cleanup, 3500);
    }, 30);
  }

  function handleClear() {
    if (!confirm("Tüm haftayı temizlemek istediğinize emin misiniz?")) return;
    clearBoard();
    renderWeekChrome();
    toast("Tahta temizlendi.", "success");
  }

  function wireToolboxPill(el) {
    el.addEventListener("dragstart", function (e) {
      var kind = el.getAttribute("data-task-kind") || "konu_calisma";
      e.dataTransfer.setData("text/plain", JSON.stringify({ tool: "wp", taskKind: kind }));
      e.dataTransfer.effectAllowed = "copy";
      el.classList.add("wp-tool-pill--drag");
    });
    el.addEventListener("dragend", function () {
      el.classList.remove("wp-tool-pill--drag");
    });
  }

  function wireSlotDrop(dropEl, dayIndex, slotIndex) {
    dropEl.addEventListener("dragenter", function (e) {
      e.preventDefault();
    });
    dropEl.addEventListener("dragover", function (e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      dropEl.classList.add("wp-slot__drop--hover");
    });
    dropEl.addEventListener("dragleave", function () {
      dropEl.classList.remove("wp-slot__drop--hover");
    });
    dropEl.addEventListener("drop", function (e) {
      e.preventDefault();
      dropEl.classList.remove("wp-slot__drop--hover");
      var raw = e.dataTransfer.getData("text/plain");
      var payload = null;
      try {
        payload = JSON.parse(raw);
      } catch (err) {
        return;
      }
      if (!payload) return;

      if (payload.chipId) {
        var moving = board.querySelector('.wp-chip[data-chip-id="' + payload.chipId + '"]');
        if (moving) {
          dropEl.appendChild(moving);
          var dayEl = dropEl.closest(".wp-day");
          var tRaw = moving.getAttribute("data-wp-task");
          if (tRaw) {
            try {
              var tt = JSON.parse(tRaw);
              tt.dateISO = dayEl ? dayEl.getAttribute("data-date") || tt.dateISO : tt.dateISO;
              tt.slotIndex = slotIndex;
              moving.setAttribute("data-wp-task", JSON.stringify(tt));
            } catch (err2) {}
          }
          refreshMetrics();
        }
        return;
      }

      if (payload.tool === "wp" && payload.taskKind) {
        if (payload.taskKind === "etut_mola") {
          appendQuickBreakChip(dayIndex, slotIndex);
          return;
        }
        var dayNode = board.querySelector('.wp-day[data-day-index="' + dayIndex + '"]');
        openModal({
          mode: "create",
          dayIndex: dayIndex,
          slotIndex: slotIndex,
          dateISO: dayNode ? dayNode.getAttribute("data-date") : toISODate(dayDateForIndex(dayIndex)),
          taskKind: payload.taskKind,
        });
      }
    });
  }

  function parseIntSafe(v) {
    var n = parseInt(String(v).replace(/[^\d]/g, ""), 10);
    return isNaN(n) ? 0 : n;
  }

  function refreshMetrics() {
    if (!metricsList) return;
    var days = readBoardFromDom();
    var konuBlok = 0;
    var soruBlok = 0;
    var soruHedef = 0;
    var deneme = 0;
    var etut = 0;
    var diger = 0;
    for (var i = 0; i < 7; i++) {
      (days[String(i)] || []).forEach(function (t) {
        var k = t.taskKind || "";
        if (k === "konu_calisma" || k === "tekrar" || k === "video") konuBlok++;
        else if (k === "soru_cozme") {
          soruBlok++;
          soruHedef += parseIntSafe(t.targetQuestions);
        } else if (k === "deneme_cozme") deneme++;
        else if (k === "etut_mola") etut++;
        else if (t.label) diger++;
      });
    }
    metricsList.innerHTML = "";
    function addMetric(key, val) {
      var li = document.createElement("li");
      li.className = "wp-metrics__item";
      var kEl = document.createElement("span");
      kEl.className = "wp-metrics__item-k";
      kEl.textContent = key;
      var vEl = document.createElement("span");
      vEl.className = "wp-metrics__item-v";
      vEl.textContent = val;
      li.appendChild(kEl);
      li.appendChild(vEl);
      metricsList.appendChild(li);
    }
    addMetric("Konu & içerik", String(konuBlok));
    addMetric("Soru çözümü (adet)", String(soruBlok));
    addMetric("Deneme", String(deneme));
    addMetric("Etüt / Mola", String(etut));
    if (diger) addMetric("Eski / genel", String(diger));
    if (metricsSoru) {
      metricsSoru.textContent =
        soruHedef > 0
          ? "Girilen soru hedefi toplamı: ~" + soruHedef + " soru"
          : soruBlok
            ? "Soru hedefi rakamı girilmedi (etikette gösterilemez)."
            : "Soru çözümü ekleyerek hedefi yazın.";
    }
  }

  function onModalSave(e) {
    e.preventDefault();
    var isEtut = selGorevTipi.value === "etut_mola";
    if (isEtut) {
      if (!inpSure.value.trim() && !taNot.value.trim()) {
        toast("Etüt / mola için süre (dk) veya koç notu girin.", "error");
        return;
      }
      var task = {
        chipId: modalCtx.mode === "edit" && modalCtx.existing ? modalCtx.existing.chipId : window.WeeklyProgramStore.uid(),
        taskKind: "etut_mola",
        subjectId: "",
        topicId: "",
        conceptIds: [],
        conceptNames: [],
        conceptJoined: "",
        subjectName: "Etüt",
        topicName: "Mola",
        targetQuestions: "",
        durationMin: inpSure.value.trim(),
        material: inpKaynak.value.trim(),
        videoUrl: inpVideo.value.trim(),
        dateISO: inpDate.value || toISODate(dayDateForIndex(modalCtx.dayIndex)),
        coachNote: taNot.value.trim(),
        slotIndex: modalCtx.slotIndex != null ? modalCtx.slotIndex : 0,
      };
      task.summary = buildSummary(task);
      var targetDay = modalCtx.dayIndex;
      if (modalCtx.mode === "edit" && modalCtx.chipEl) {
        var col = modalCtx.chipEl.closest(".wp-day");
        if (col) targetDay = parseInt(col.getAttribute("data-day-index"), 10);
        modalCtx.chipEl.remove();
      }
      appendTaskChip(targetDay, task, modalCtx.slotIndex != null ? modalCtx.slotIndex : task.slotIndex);
      closeModal();
      toast("Görev eklendi.", "success");
      return;
    }

    var sid = selSubject.value;
    var tid = selTopic.value;
    var conceptIds = getSelectedConceptIds().filter(function (id, idx, arr) {
      return arr.indexOf(id) === idx;
    });
    if (!sid || !tid || !conceptIds.length) {
      toast("Ders, konu ve en az bir kavram seçmelisiniz.", "error");
      return;
    }
    var names = window.YksMufredatApi.resolveConceptsMulti(sid, tid, conceptIds);
    var task = {
      chipId: modalCtx.mode === "edit" && modalCtx.existing ? modalCtx.existing.chipId : window.WeeklyProgramStore.uid(),
      taskKind: selGorevTipi.value,
      subjectId: sid,
      topicId: tid,
      conceptIds: conceptIds,
      conceptNames: names.conceptNames,
      conceptJoined: names.conceptJoined,
      conceptId: conceptIds[0],
      conceptName: names.conceptNames[0] || "",
      subjectName: names.subject,
      topicName: names.topic,
      targetQuestions: inpHedefSoru.value.trim(),
      durationMin: inpSure.value.trim(),
      material: inpKaynak.value.trim(),
      videoUrl: inpVideo.value.trim(),
      dateISO: inpDate.value || toISODate(dayDateForIndex(modalCtx.dayIndex)),
      coachNote: taNot.value.trim(),
      slotIndex: modalCtx.slotIndex != null ? modalCtx.slotIndex : 0,
    };
    task.summary = buildSummary(task);

    var targetDay = modalCtx.dayIndex;
    if (modalCtx.mode === "edit" && modalCtx.chipEl) {
      var col2 = modalCtx.chipEl.closest(".wp-day");
      if (col2) targetDay = parseInt(col2.getAttribute("data-day-index"), 10);
      modalCtx.chipEl.remove();
    }
    appendTaskChip(targetDay, task, modalCtx.slotIndex != null ? modalCtx.slotIndex : task.slotIndex);
    closeModal();
    toast("Görev eklendi.", "success");
  }

  buildBoardShell(board);
  document.querySelectorAll(".wp-tool-pill").forEach(wireToolboxPill);

  fillStudents();
  renderWeekChrome();
  injectSkeletons();
  setTimeout(function () {
    loadFromQueryOrStorage();
    clearConceptList();
  }, 420);

  if (deleteConfirmBtn) {
    deleteConfirmBtn.addEventListener("click", function () {
      if (pendingDeleteChip && pendingDeleteChip.parentNode) {
        pendingDeleteChip.remove();
        refreshMetrics();
        toast("Görev silindi.", "success");
      }
      closeDeleteConfirm();
    });
  }
  if (deleteCancelBtn) {
    deleteCancelBtn.addEventListener("click", closeDeleteConfirm);
  }
  if (deleteOverlay) {
    deleteOverlay.addEventListener("click", function (e) {
      if (e.target === deleteOverlay) closeDeleteConfirm();
    });
  }

  var btnQaOpen = document.getElementById("wp-qa-open");
  if (btnQaOpen) {
    btnQaOpen.addEventListener("click", function () {
      var selDay = document.getElementById("wp-qa-day");
      var selSlot = document.getElementById("wp-qa-slot");
      var selKind = document.getElementById("wp-qa-kind");
      var di = selDay ? parseInt(selDay.value, 10) : 0;
      if (isNaN(di) || di < 0 || di > 6) di = 0;
      var si = selSlot ? parseInt(selSlot.value, 10) : 0;
      if (isNaN(si) || si < 0 || si > 3) si = 0;
      var kind = selKind && selKind.value ? selKind.value : "konu_calisma";
      if (kind === "etut_mola") {
        appendQuickBreakChip(di, si);
        return;
      }
      var dayCol = board.querySelector('.wp-day[data-day-index="' + di + '"]');
      var dISO = dayCol ? dayCol.getAttribute("data-date") || "" : "";
      if (!dISO) dISO = toISODate(dayDateForIndex(di));
      openModal({
        mode: "create",
        dayIndex: di,
        slotIndex: si,
        dateISO: dISO,
        taskKind: kind,
      });
    });
  }

  if (selSubject)
    selSubject.addEventListener("change", function () {
      refreshTopicSelect();
    });
  if (selTopic)
    selTopic.addEventListener("change", function () {
      renderConceptCheckboxes();
    });

  if (conceptShellEl) {
    conceptShellEl.addEventListener("change", function (e) {
      var t = e.target;
      if (t && t.tagName === "INPUT" && t.getAttribute("type") === "checkbox") updateConceptToolbar();
    });
  }
  if (btnConceptAll) {
    btnConceptAll.addEventListener("click", function () {
      if (!conceptListEl) return;
      conceptListEl.querySelectorAll('input[type="checkbox"]').forEach(function (inp) {
        inp.checked = true;
      });
      updateConceptToolbar();
    });
  }
  if (btnConceptNone) {
    btnConceptNone.addEventListener("click", function () {
      if (!conceptListEl) return;
      conceptListEl.querySelectorAll('input[type="checkbox"]').forEach(function (inp) {
        inp.checked = false;
      });
      updateConceptToolbar();
    });
  }

  if (btnWeekPrev)
    btnWeekPrev.addEventListener("click", function () {
      weekMonday = addDays(weekMonday, -7);
      renderWeekChrome();
    });
  if (btnWeekNext)
    btnWeekNext.addEventListener("click", function () {
      weekMonday = addDays(weekMonday, 7);
      renderWeekChrome();
    });

  if (selStudent) selStudent.addEventListener("change", syncPrintHeader);
  if (inpTitle) inpTitle.addEventListener("input", syncPrintHeader);
  if (inpMotto) inpMotto.addEventListener("input", syncPrintHeader);
  if (selTargetExam) selTargetExam.addEventListener("change", syncPrintHeader);

  if (btnSave) btnSave.addEventListener("click", handleSave);
  if (btnPdf) btnPdf.addEventListener("click", handlePdf);
  if (btnPrint) btnPrint.addEventListener("click", handlePrint);
  if (btnClear) btnClear.addEventListener("click", handleClear);

  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (btnModalCancel) btnModalCancel.addEventListener("click", closeModal);
  if (formTask) formTask.addEventListener("submit", onModalSave);
  if (overlay) {
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeModal();
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (deleteOverlay && deleteOverlay.classList.contains("is-open")) {
      closeDeleteConfirm();
      return;
    }
    if (overlay && overlay.classList.contains("is-open")) closeModal();
  });
})();
