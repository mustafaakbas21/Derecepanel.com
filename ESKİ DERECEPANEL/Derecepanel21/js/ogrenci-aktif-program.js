/**
 * Öğrenci — aktif haftalık program (gün sekmeleri, durum, not, localStorage senkron).
 * Bağımlılık: student-catalog.js, ogrenci-coach-bridge.js
 */
(function () {
  var root = document.getElementById("og-wp-aktif-root");
  var tabsEl = document.getElementById("og-wp-day-tabs");
  var panelEl = document.getElementById("og-wp-day-panel");
  var leadEl = document.getElementById("og-wp-aktif-lead");
  var analyticsEl = document.getElementById("og-wp-analytics");
  var kpisEl = document.getElementById("og-wp-analytics-kpis");
  if (!root || !tabsEl || !panelEl) return;

  var DAYS_SHORT = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
  var DAYS_FULL = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
  var CHART_PALETTE_TYT = ["#F4A5A5", "#EF8F8F", "#E87878", "#E06262", "#D84F4F", "#CF4040"];
  var CHART_PALETTE_AYT = ["#B8C5E0", "#9AADD4", "#7E96C4", "#647FB3", "#4E6A9E", "#3D5A87"];
  var chartMain = null;
  var chartRenderToken = 0;
  var chartRenderTimer = null;
  var weekAggSig = "";
  var selectedSinav = "TYT";
  var weekAggCache = { tyt: [], ayt: [], tytSum: 0, aytSum: 0, total: 0 };

  var activeProgramKey = "";
  var activeProgramData = null;
  var ogrenciId = "";
  var currentUser = null;
  var selectedDay = 0;
  var noteTimers = {};

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

  function findActiveProgramStorageKey(u) {
    if (window.OgStudentPerf) {
      if (typeof window.OgStudentPerf.findActiveProgramStorageKeyFast === "function") {
        var fast = window.OgStudentPerf.findActiveProgramStorageKeyFast(u);
        if (fast) return fast;
      }
      if (typeof window.OgStudentPerf.findActiveProgramStorageKeyByScan === "function") {
        return window.OgStudentPerf.findActiveProgramStorageKeyByScan(u);
      }
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

  function destroyCharts() {
    if (chartMain) {
      try {
        chartMain.destroy();
      } catch (e) {}
    }
    chartMain = null;
    var el = document.getElementById("og-wp-chart-main");
    if (el) el.innerHTML = "";
  }

  function parseTaskSubject(task) {
    if (!task) return null;
    var kind = String(task.taskKind || "").trim();
    if (kind === "etut_mola") return null;

    if (task.subjectId && window.YksMufredatApi && typeof window.YksMufredatApi.getSubject === "function") {
      var sub = window.YksMufredatApi.getSubject(task.subjectId);
      if (sub && sub.name) {
        return { sinav: sub.sinav === "AYT" ? "AYT" : "TYT", subject: sub.name };
      }
    }

    var sn = String(task.subjectName || "").trim();
    if (sn) {
      var m = sn.match(/^(TYT|AYT)\s+/i);
      if (m) return { sinav: m[1].toUpperCase(), subject: sn };
      return { sinav: "TYT", subject: sn };
    }

    var text = String(task.summary || task.label || "").trim();
    var m2 = text.match(/:\s*(TYT|AYT)\s+([^>›]+)/i);
    if (m2) {
      var name = (m2[1].toUpperCase() + " " + m2[2].trim()).trim();
      return { sinav: m2[1].toUpperCase(), subject: name };
    }
    return null;
  }

  function aggregateWeekSubjects(tasks) {
    var tyt = {};
    var ayt = {};
    (tasks || []).forEach(function (t) {
      var p = parseTaskSubject(t);
      if (!p) return;
      var bag = p.sinav === "AYT" ? ayt : tyt;
      bag[p.subject] = (bag[p.subject] || 0) + 1;
    });
    return { tyt: tyt, ayt: ayt };
  }

  function mapToChartRows(countMap) {
    return Object.keys(countMap || {})
      .map(function (k) {
        return { name: k, count: countMap[k] };
      })
      .sort(function (a, b) {
        return b.count - a.count;
      });
  }

  function setChartEmpty(emptyId, chartHostId, on) {
    var empty = document.getElementById(emptyId);
    if (empty) empty.classList.toggle("is-on", !!on);
    var host = document.getElementById(chartHostId);
    if (host) host.style.visibility = on ? "hidden" : "visible";
  }

  function apexFont() {
    return "Inter, ui-sans-serif, system-ui, sans-serif";
  }

  function chartPaletteForSinav(sinav) {
    return sinav === "AYT" ? CHART_PALETTE_AYT : CHART_PALETTE_TYT;
  }

  function renderHBarChart(rows, sinav) {
    var hostId = "og-wp-chart-main";
    var emptyId = "og-wp-chart-main-empty";
    setChartEmpty(emptyId, hostId, !rows.length);
    if (!rows.length || typeof ApexCharts === "undefined") return null;

    var el = document.getElementById(hostId);
    if (!el) return null;

    var cats = rows.map(function (r) {
      return r.name;
    });
    var vals = rows.map(function (r) {
      return r.count;
    });
    var chartH = Math.max(340, rows.length * 44);

    return new ApexCharts(el, {
      chart: {
        type: "bar",
        height: chartH,
        toolbar: { show: false },
        fontFamily: apexFont(),
        redrawOnWindowResize: false,
        animations: {
          enabled: true,
          speed: 480,
          easing: "easeinout",
          animateGradually: { enabled: false },
          dynamicAnimation: { enabled: false },
        },
        events: {
          animationEnd: function () {
            notifyParentResize();
          },
        },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 8,
          barHeight: "72%",
          distributed: true,
          dataLabels: { position: "center" },
        },
      },
      colors: chartPaletteForSinav(sinav),
      dataLabels: {
        enabled: true,
        formatter: function (v) {
          return Math.round(v);
        },
        style: { fontSize: "12px", fontWeight: 800, colors: ["#fff"] },
      },
      grid: { strokeDashArray: 4, borderColor: "#e2e8f0", xaxis: { lines: { show: true } } },
      xaxis: {
        categories: cats,
        labels: { style: { fontSize: "11px", fontWeight: 600, colors: "#64748b" } },
      },
      yaxis: {
        labels: {
          maxWidth: 280,
          style: { fontSize: "12px", fontWeight: 700, colors: ["#334155"] },
        },
      },
      legend: { show: false },
      tooltip: {
        theme: "light",
        y: {
          formatter: function (v) {
            return v + " ders";
          },
        },
      },
      series: [{ name: "Oturum", data: vals }],
    });
  }

  function renderDataTable(rows, sinav) {
    var tbody = document.getElementById("og-wp-chart-table-body");
    var table = document.getElementById("og-wp-chart-table");
    if (!tbody) return;
    if (table) {
      table.classList.remove("og-wp-chart-table--tyt", "og-wp-chart-table--ayt");
      table.classList.add(sinav === "AYT" ? "og-wp-chart-table--ayt" : "og-wp-chart-table--tyt");
    }
    if (!rows.length) {
      tbody.innerHTML =
        '<tr><td colspan="2" style="text-align:center;color:#94a3b8;font-weight:600">Kayıt yok</td></tr>';
      return;
    }
    tbody.innerHTML = rows
      .map(function (r) {
        return (
          "<tr><td>" +
          escapeHtml(r.name) +
          '</td><td class="og-wp-chart-table__count">' +
          escapeHtml(String(r.count)) +
          "</td></tr>"
        );
      })
      .join("");
  }

  function updateSinavToggleUi() {
    var isTyt = selectedSinav !== "AYT";
    var btnTyt = document.getElementById("og-wp-sinav-tyt");
    var btnAyt = document.getElementById("og-wp-sinav-ayt");
    if (btnTyt) {
      btnTyt.classList.toggle("og-wp-sinav-btn--active", isTyt);
      btnTyt.setAttribute("aria-selected", isTyt ? "true" : "false");
    }
    if (btnAyt) {
      btnAyt.classList.toggle("og-wp-sinav-btn--active", !isTyt);
      btnAyt.setAttribute("aria-selected", !isTyt ? "true" : "false");
    }
    var title = document.getElementById("og-wp-chart-main-title");
    var empty = document.getElementById("og-wp-chart-main-empty");
    if (title) title.textContent = (isTyt ? "TYT" : "AYT") + " dersleri";
    if (empty) {
      empty.textContent = isTyt
        ? "Bu hafta TYT ders görevi yok."
        : "Bu hafta AYT ders görevi yok.";
    }
  }

  function paintSelectedSinavChart() {
    if (!analyticsEl || analyticsEl.hidden) return;

    var sig = weekAggSignature();
    if (sig && sig === weekAggSig && chartMain) return;

    chartRenderToken += 1;
    var token = chartRenderToken;
    destroyCharts();
    updateSinavToggleUi();

    var rows = selectedSinav === "AYT" ? weekAggCache.ayt : weekAggCache.tyt;
    renderDataTable(rows, selectedSinav);

    function drawChart() {
      if (token !== chartRenderToken) return;
      chartMain = renderHBarChart(rows, selectedSinav);
      weekAggSig = sig;
      if (!chartMain) {
        notifyParentResize();
        return;
      }
      try {
        var p = chartMain.render();
        if (p && typeof p.then === "function") {
          p.catch(function () {}).then(function () {
            if (token !== chartRenderToken) return;
          });
        }
      } catch (eR) {
        if (token === chartRenderToken) notifyParentResize();
      }
    }

    if (window.OgStudentPerf && typeof window.OgStudentPerf.ensureApexCharts === "function") {
      window.OgStudentPerf.ensureApexCharts().then(drawChart).catch(drawChart);
    } else {
      drawChart();
    }
  }

  /** Layout + iframe yüksekliği oturduktan sonra tek sefer çiz (animasyon ortasında kesilmesin). */
  function scheduleChartRender() {
    if (chartRenderTimer) clearTimeout(chartRenderTimer);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        chartRenderTimer = setTimeout(function () {
          chartRenderTimer = null;
          paintSelectedSinavChart();
        }, 220);
      });
    });
  }

  function renderSelectedSinavChart() {
    scheduleChartRender();
  }

  function bindSinavToggle() {
    var toggle = document.querySelector(".og-wp-sinav-toggle");
    if (!toggle || toggle.dataset.bound) return;
    toggle.dataset.bound = "1";
    toggle.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-sinav]");
      if (!btn) return;
      var next = String(btn.getAttribute("data-sinav") || "TYT").toUpperCase();
      if (next !== "TYT" && next !== "AYT") return;
      if (next === selectedSinav) return;
      selectedSinav = next;
      renderSelectedSinavChart();
    });
  }

  function renderWeekAnalytics() {
    if (!analyticsEl) return;

    var tasks = getTasksFromPayload(activeProgramData);
    if (!activeProgramData || !tasks.length) {
      analyticsEl.hidden = true;
      weekAggSig = "";
      destroyCharts();
      return;
    }

    analyticsEl.hidden = false;
    weekAggSig = "";
    var agg = aggregateWeekSubjects(tasks);
    weekAggCache.tyt = mapToChartRows(agg.tyt);
    weekAggCache.ayt = mapToChartRows(agg.ayt);
    weekAggCache.tytSum = weekAggCache.tyt.reduce(function (s, r) {
      return s + r.count;
    }, 0);
    weekAggCache.aytSum = weekAggCache.ayt.reduce(function (s, r) {
      return s + r.count;
    }, 0);
    weekAggCache.total = weekAggCache.tytSum + weekAggCache.aytSum;

    if (kpisEl) {
      kpisEl.innerHTML =
        '<span class="og-wp-kpi">Toplam ' +
        escapeHtml(String(weekAggCache.total)) +
        " ders</span>" +
        '<span class="og-wp-kpi og-wp-kpi--tyt">TYT ' +
        escapeHtml(String(weekAggCache.tytSum)) +
        "</span>" +
        '<span class="og-wp-kpi og-wp-kpi--ayt">AYT ' +
        escapeHtml(String(weekAggCache.aytSum)) +
        "</span>";
    }

    bindSinavToggle();
    renderSelectedSinavChart();
  }

  function todayDayIndexMon0() {
    var d = new Date().getDay();
    return (d + 6) % 7;
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function parseTaskLabelParts(task) {
    var raw = String(task.label || task.summary || "Görev").trim();
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
    } else {
      var ps = parseTaskSubject(task);
      if (ps) {
        sinav = ps.sinav;
        ders =
          String(ps.subject || ders)
            .replace(/^(TYT|AYT)\s+/i, "")
            .trim() || ps.subject;
      }
    }

    return {
      kind: kind || "Konu çalışması",
      sinav: sinav,
      ders: ders,
      topics: parts.length > 1 ? parts.slice(1) : [],
    };
  }

  function getNormalizedStatus(t) {
    var s = String(t.studentStatus || "").toLowerCase();
    if (s === "bekliyor" || s === "tamamlandi" || s === "yapilamadi") return s;
    if (t.done) return "tamamlandi";
    return "bekliyor";
  }

  function setTaskStatus(task, status) {
    task.studentStatus = status;
    task.done = status === "tamamlandi";
    if (status !== "yapilamadi") task.studentNote = "";
  }

  function persistAndBridge() {
    if (!activeProgramKey || !activeProgramData) return;
    try {
      localStorage.setItem(activeProgramKey, JSON.stringify(activeProgramData));
    } catch (e) {}
    var tasks = getTasksFromPayload(activeProgramData);
    if (window.DereceOgrenciBridge && ogrenciId) {
      window.DereceOgrenciBridge.writeCompletedTasksSnapshot(
        ogrenciId,
        tasks,
        (currentUser && currentUser.name) ||
          (activeProgramData.program && activeProgramData.program.studentName) ||
          ""
      );
    }
    try {
      window.dispatchEvent(new CustomEvent("studentProgram:updated"));
    } catch (e2) {}
  }

  function notifyParentResize() {
    if (window.OgStudentPerf && typeof window.OgStudentPerf.notifyParentResize === "function") {
      window.OgStudentPerf.notifyParentResize(180);
      return;
    }
    try {
      if (window.parent !== window) {
        window.parent.postMessage({ type: "og-iframe-content" }, "*");
      }
    } catch (e) {}
  }

  function weekAggSignature() {
    try {
      return JSON.stringify({
        tyt: weekAggCache.tyt,
        ayt: weekAggCache.ayt,
        sinav: selectedSinav,
      });
    } catch (eSig) {
      return "";
    }
  }

  function loadProgram(u) {
    activeProgramKey = findActiveProgramStorageKey(u);
    activeProgramData = null;
    ogrenciId = "";

    if (!activeProgramKey) {
      if (leadEl) {
        leadEl.textContent =
          "Henüz koçunuzdan aktif bir program gelmedi. Program gönderildiğinde burada görünecek.";
      }
      if (analyticsEl) analyticsEl.hidden = true;
      destroyCharts();
      return false;
    }

    var raw = null;
    try {
      raw = localStorage.getItem(activeProgramKey);
    } catch (e3) {
      raw = null;
    }
    if (!raw) return false;

    try {
      activeProgramData = JSON.parse(raw);
    } catch (e4) {
      return false;
    }

    ogrenciId =
      (activeProgramData && activeProgramData.ogrenciId) ||
      activeProgramKey.replace(/^active_program_/, "") ||
      String(u.studentCode || "").trim() ||
      catalogIdForUser(u);

    if (!ogrenciId && u) {
      ogrenciId = String(u.studentCode || "").trim() || catalogIdForUser(u);
    }

    var progTitle =
      (activeProgramData.program && activeProgramData.program.title) ||
      (activeProgramData.programs && activeProgramData.programs[0] && activeProgramData.programs[0].title) ||
      "Haftalık program";
    if (leadEl) {
      leadEl.textContent =
        "Program: " +
        progTitle +
        ". Durum ve notlar kayda yazılır; koç paneli aynı veriyi görür.";
    }
    return true;
  }

  function tasksForDay(dayIndex) {
    var tasks = getTasksFromPayload(activeProgramData);
    var out = [];
    for (var i = 0; i < tasks.length; i++) {
      var t = tasks[i];
      if (!t) continue;
      var di = t.dayIndex != null ? Number(t.dayIndex) : 0;
      if (di === dayIndex) out.push({ task: t, idx: i });
    }
    return out;
  }

  function renderTabs() {
    tabsEl.innerHTML = "";
    for (var d = 0; d < 7; d++) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "og-wp-tab" + (d === selectedDay ? " og-wp-tab--active" : "");
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", d === selectedDay ? "true" : "false");
      btn.setAttribute("aria-controls", "og-wp-day-panel");
      btn.dataset.day = String(d);
      btn.textContent = DAYS_SHORT[d];
      btn.addEventListener("click", function () {
        selectedDay = parseInt(this.dataset.day, 10);
        renderTabs();
        renderPanel();
        notifyParentResize();
      });
      tabsEl.appendChild(btn);
    }
  }

  function renderPanel() {
    panelEl.innerHTML = "";
    if (!activeProgramData) {
      var empty = document.createElement("div");
      empty.className = "og-wp-empty";
      empty.textContent = "Gösterilecek aktif program yok.";
      panelEl.appendChild(empty);
      notifyParentResize();
      return;
    }

    var list = tasksForDay(selectedDay);
    if (!list.length) {
      var e2 = document.createElement("div");
      e2.className = "og-wp-empty";
      e2.textContent = "Bu gün için planlanmış görev yok.";
      panelEl.appendChild(e2);
      notifyParentResize();
      return;
    }

    var daySec = document.createElement("section");
    daySec.className = "og-wp-day";
    var dayHead = document.createElement("header");
    dayHead.className = "og-wp-day__head";
    var dayTitle = document.createElement("h2");
    dayTitle.textContent = DAYS_FULL[selectedDay] || DAYS_SHORT[selectedDay];
    var daySub = document.createElement("p");
    daySub.textContent = list.length + " görev";
    dayHead.appendChild(dayTitle);
    dayHead.appendChild(daySub);
    daySec.appendChild(dayHead);

    var listWrap = document.createElement("div");
    listWrap.className = "og-wp-task-list";

    list.forEach(function (item) {
      var task = item.task;
      var idx = item.idx;
      var st = getNormalizedStatus(task);

      var card = document.createElement("article");
      card.className = "og-wp-task og-wp-task--" + st;

      var info = parseTaskLabelParts(task);

      var body = document.createElement("div");
      body.className = "og-wp-task__body";

      var meta = document.createElement("div");
      meta.className = "og-wp-task__meta";
      var kindEl = document.createElement("span");
      kindEl.className = "og-wp-task__kind";
      kindEl.textContent = info.kind;
      meta.appendChild(kindEl);
      if (info.sinav) {
        var sinavEl = document.createElement("span");
        sinavEl.className = "og-wp-task__sinav";
        sinavEl.textContent = info.sinav;
        meta.appendChild(sinavEl);
      }
      body.appendChild(meta);

      var dersEl = document.createElement("h3");
      dersEl.className = "og-wp-task__ders";
      dersEl.textContent = info.ders;
      body.appendChild(dersEl);

      if (info.topics.length) {
        var trail = document.createElement("p");
        trail.className = "og-wp-task__trail";
        info.topics.forEach(function (tp, ti) {
          if (ti > 0) {
            var sep = document.createElement("span");
            sep.className = "og-wp-task__trail-sep";
            sep.setAttribute("aria-hidden", "true");
            sep.textContent = "\u203a";
            trail.appendChild(sep);
          }
          var span = document.createElement("span");
          span.textContent = tp;
          trail.appendChild(span);
        });
        body.appendChild(trail);
      }

      var statusWrap = document.createElement("div");
      statusWrap.className = "og-wp-task__status-wrap";

      var sel = document.createElement("select");
      sel.className = "og-wp-task__status";
      sel.setAttribute("aria-label", "Görev durumu");
      [["bekliyor", "Bekliyor"], ["tamamlandi", "Tamamlandı"], ["yapilamadi", "Yapılamadı"]].forEach(function (opt) {
        var o = document.createElement("option");
        o.value = opt[0];
        o.textContent = opt[1];
        if (opt[0] === st) o.selected = true;
        sel.appendChild(o);
      });
      statusWrap.appendChild(sel);

      var noteWrap = document.createElement("div");
      noteWrap.className = "og-wp-task__note-wrap";
      noteWrap.hidden = st !== "yapilamadi";

      var ta = document.createElement("textarea");
      ta.className = "og-wp-task__note";
      ta.rows = 2;
      ta.placeholder = "Neden yapılamadı? (ör. konu yetişmedi)";
      ta.value = String(task.studentNote || "");

      function applyUiFromStatus(newSt) {
        card.className = "og-wp-task og-wp-task--" + newSt;
        noteWrap.hidden = newSt !== "yapilamadi";
      }

      function onStatusChange(newSt) {
        setTaskStatus(task, newSt);
        activeProgramData.tasks = getTasksFromPayload(activeProgramData);
        applyUiFromStatus(newSt);
        persistAndBridge();
        renderWeekAnalytics();
      }

      sel.addEventListener("change", function () {
        onStatusChange(sel.value);
      });

      function flushNote() {
        if (getNormalizedStatus(task) !== "yapilamadi") return;
        task.studentNote = ta.value;
        activeProgramData.tasks = getTasksFromPayload(activeProgramData);
        persistAndBridge();
      }

      ta.addEventListener("blur", flushNote);
      ta.addEventListener("input", function () {
        var k = "n" + idx;
        if (noteTimers[k]) window.clearTimeout(noteTimers[k]);
        noteTimers[k] = window.setTimeout(function () {
          flushNote();
          delete noteTimers[k];
        }, 450);
      });

      var hint = document.createElement("p");
      hint.className = "og-wp-task__note-hint";
      hint.textContent = "Not koç panelinde görünür.";

      noteWrap.appendChild(ta);
      noteWrap.appendChild(hint);

      card.appendChild(body);
      card.appendChild(statusWrap);
      card.appendChild(noteWrap);
      listWrap.appendChild(card);
    });

    daySec.appendChild(listWrap);
    panelEl.appendChild(daySec);

    notifyParentResize();
  }

  function reloadFromStorage() {
    if (!currentUser) return;
    var key = findActiveProgramStorageKey(currentUser);
    if (key !== activeProgramKey) {
      activeProgramKey = key;
      if (!key) {
        activeProgramData = null;
        renderTabs();
        renderPanel();
        return;
      }
    }
    if (!activeProgramKey) return;
    try {
      var raw = localStorage.getItem(activeProgramKey);
      if (!raw) return;
      activeProgramData = JSON.parse(raw);
    } catch (e) {}
    renderTabs();
    renderPanel();
    renderWeekAnalytics();
  }

  function boot() {
    if (typeof window.ensureDereceStudentCatalog === "function") {
      window.ensureDereceStudentCatalog();
    }
    currentUser = getCurrentUser();
    if (!currentUser) {
      window.location.href = "../login.html";
      return;
    }

    selectedDay = todayDayIndexMon0();

    function finishBoot() {
      renderTabs();
      renderPanel();
      renderWeekAnalytics();
    }

    if (!loadProgram(currentUser)) {
      finishBoot();
    } else {
      finishBoot();
      persistAndBridge();
    }

    window.addEventListener("yks-mufredat:ready", function () {
      if (!activeProgramData) return;
      var prev = weekAggSig;
      renderWeekAnalytics();
      if (weekAggSig === prev && chartMain) return;
    });

    window.addEventListener("storage", function (e) {
      if (!e || !e.key) return;
      if (e.key === activeProgramKey || (e.key && e.key.indexOf("active_program_") === 0)) {
        reloadFromStorage();
      }
    });

    notifyParentResize();
  }

  window.addEventListener("load", function () {
    window.setTimeout(boot, 60);
  });
})();
