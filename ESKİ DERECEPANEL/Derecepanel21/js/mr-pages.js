/**
 * MR — Konu MR / Soru MR / Deneme MR
 * Çoklu mount: [data-mr-mount][data-mr-kind] kökleri (görüşme odası gömülü paneller dahil).
 * Kalıcı durum: localStorage derece_mr_coach_track_v1 (öğrenci + sınav + konu kimlikleri).
 */
(function () {
  "use strict";

  var MR_STORE_KEY = "derece_mr_coach_track_v1";
  var mrCharts = typeof WeakMap !== "undefined" ? new WeakMap() : null;

  function readStore() {
    try {
      var raw = localStorage.getItem(MR_STORE_KEY);
      var o = raw ? JSON.parse(raw) : {};
      return o && typeof o === "object" ? o : {};
    } catch (e) {
      return {};
    }
  }

  function writeStore(obj) {
    try {
      localStorage.setItem(MR_STORE_KEY, JSON.stringify(obj || {}));
      try {
        window.dispatchEvent(new CustomEvent("mr-coach:update"));
      } catch (e1) {}
      try {
        window.dispatchEvent(new StorageEvent("storage", { key: MR_STORE_KEY, newValue: JSON.stringify(obj || {}) }));
      } catch (e2) {}
    } catch (e3) {}
  }

  function rowKey(studentId, mrKind, examKey, subjectId, topicId) {
    return (
      String(studentId || "") +
      "|" +
      String(mrKind || "") +
      "|" +
      String(examKey || "TYT") +
      "|" +
      String(subjectId || "") +
      "|" +
      String(topicId || "")
    );
  }

  function getRowRecord(studentId, mrKind, examKey, subjectId, topicId) {
    var all = readStore();
    var k = rowKey(studentId, mrKind, examKey, subjectId, topicId);
    var rec = all[k];
    return rec && typeof rec === "object" ? rec : {};
  }

  function setRowRecord(studentId, mrKind, examKey, subjectId, topicId, patch) {
    var all = readStore();
    var k = rowKey(studentId, mrKind, examKey, subjectId, topicId);
    var prev = all[k] && typeof all[k] === "object" ? all[k] : {};
    all[k] = Object.assign({}, prev, patch, { updatedAt: new Date().toISOString() });
    writeStore(all);
  }

  function mrKindLabels(kind) {
    var k = String(kind || "konu");
    return {
      todo: k === "soru" ? "Çözüm Bitmedi" : "Konu Bitmemiş",
      done: k === "soru" ? "Çözüm Bitti" : "Konu Bitti",
    };
  }

  window.MrCoachBridge = window.MrCoachBridge || {};

  window.MrCoachBridge.markTopicRow = function (opts) {
    var studentId = String((opts && opts.studentId) || "").trim();
    var examKey = String((opts && opts.examKey) || "TYT").toUpperCase() === "AYT" ? "AYT" : "TYT";
    var subjectId = String((opts && opts.subjectId) || "").trim();
    var topicId = String((opts && opts.topicId) || "").trim();
    var mrKind = String((opts && opts.kind) || "konu").toLowerCase() === "soru" ? "soru" : "konu";
    var done = opts && opts.done !== false;
    if (!studentId || !subjectId || !topicId) return false;
    setRowRecord(studentId, mrKind, examKey, subjectId, topicId, { done: !!done });
    refreshAllMrMounts();
    return true;
  };

  window.MrCoachBridge.refreshAll = refreshAllMrMounts;

  function refreshAllMrMounts() {
    document.querySelectorAll("[data-mr-mount]").forEach(function (root) {
      if (typeof root.__mrRefresh === "function") root.__mrRefresh();
    });
  }

  var CHECK_SVG =
    '<svg class="mr-status-btn__svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4 10.5l4 4 8-9"/></svg>';

  function collectAllStudents() {
    var map = {};
    function add(id, name) {
      if (!id) return;
      if (!map[id]) map[id] = { id: id, name: name || id };
      else if (!map[id].name || map[id].name === id) map[id].name = name || map[id].name;
    }
    try {
      (window.DereceStudentCatalog || []).forEach(function (s) {
        if (s && s.id) add(s.id, s.name);
      });
    } catch (e) {}
    try {
      var raw = localStorage.getItem("examResults");
      var results = [];
      if (raw) {
        var parsed = JSON.parse(raw);
        results = Array.isArray(parsed) ? parsed : [];
      }
      results.forEach(function (r) {
        if (r && r.studentId) add(r.studentId, r.studentName);
      });
    } catch (e2) {}
    try {
      if (window.ExamMatrix && typeof window.ExamMatrix.getStudents === "function") {
        window.ExamMatrix.getStudents().forEach(function (s) {
          if (s && s.id) add(s.id, s.name);
        });
      }
    } catch (e3) {}
    return Object.keys(map)
      .map(function (k) {
        return map[k];
      })
      .sort(function (a, b) {
        return String(a.name || "").localeCompare(String(b.name || ""), "tr");
      });
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function escapeAttr(s) {
    return String(s == null ? "" : s).replace(/"/g, "&quot;");
  }

  function subjectsForExam(key) {
    if (!window.YksMufredatApi || typeof window.YksMufredatApi.getSubjects !== "function") return [];
    return window.YksMufredatApi.getSubjects().filter(function (s) {
      return s.sinav === key;
    });
  }

  window.toggleStatus = function (btn) {
    if (!btn || !btn.classList.contains("mr-topic-row__status-btn")) return;
    var mount = btn.closest("[data-mr-mount]");
    var kind =
      (mount && mount.getAttribute("data-mr-kind")) ||
      document.documentElement.getAttribute("data-mr-kind") ||
      "konu";
    var labels = mrKindLabels(kind);
    var card = btn.closest(".mr-ders-card");
    var isDone = btn.getAttribute("data-mr-status") === "done";
    var textEl = btn.querySelector(".mr-status-btn__text");

    if (!isDone) {
      btn.setAttribute("data-mr-status", "done");
      btn.classList.add("mr-status-btn--done");
      btn.classList.remove("mr-status-btn--todo");
      btn.setAttribute("aria-pressed", "true");
      if (textEl) textEl.textContent = labels.done;
    } else {
      btn.setAttribute("data-mr-status", "todo");
      btn.classList.add("mr-status-btn--todo");
      btn.classList.remove("mr-status-btn--done");
      btn.setAttribute("aria-pressed", "false");
      if (textEl) textEl.textContent = labels.todo;
    }
    updateCardProgress(card);
    if (mount && typeof mount.__mrPersistRow === "function") {
      var row = btn.closest(".mr-topic-row");
      if (row) mount.__mrPersistRow(row);
    }
  };

  function updateCardProgress(card) {
    if (!card) return;
    var rows = card.querySelectorAll(".mr-topic-row");
    var total = rows.length;
    var done = 0;
    rows.forEach(function (row) {
      var b = row.querySelector(".mr-topic-row__status-btn");
      if (b && b.getAttribute("data-mr-status") === "done") done++;
    });
    var pct = total ? Math.round((done / total) * 100) : 0;
    animateDonut(card, pct);
  }

  function animateDonut(card, targetPct) {
    var donut = card.querySelector(".mr-pct-donut");
    if (!donut) return;
    var numEl = donut.querySelector(".mr-pct-donut__num");
    var from = parseInt(donut.getAttribute("data-mr-pct") || "0", 10);
    var to = Math.max(0, Math.min(100, Math.round(Number(targetPct) || 0)));
    if (from === to) {
      donut.style.setProperty("--mr-pct", String(to));
      if (numEl) numEl.textContent = String(to);
      donut.setAttribute("aria-label", "Ders ilerlemesi " + to + "%");
      return;
    }
    donut._mrAnimToken = (donut._mrAnimToken || 0) + 1;
    var token = donut._mrAnimToken;
    var duration = 480;
    var start = null;

    function frame(now) {
      if (donut._mrAnimToken !== token) return;
      if (start == null) start = now;
      var t = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - t, 3);
      var v = Math.round(from + (to - from) * eased);
      donut.style.setProperty("--mr-pct", String(v));
      if (numEl) numEl.textContent = String(v);
      donut.setAttribute("aria-label", "Ders ilerlemesi " + v + "%");
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        donut.style.setProperty("--mr-pct", String(to));
        if (numEl) numEl.textContent = String(to);
        donut.setAttribute("data-mr-pct", String(to));
        donut.setAttribute("aria-label", "Ders ilerlemesi " + to + "%");
      }
    }
    requestAnimationFrame(frame);
  }

  function destroyInsightChart(root) {
    if (!mrCharts || !root) return;
    var ch = mrCharts.get(root);
    if (ch) {
      try {
        ch.destroy();
      } catch (e) {}
      mrCharts.delete(root);
    }
  }

  function initMrMount(root) {
    if (!root) return;
    var kind = String(root.getAttribute("data-mr-kind") || "").trim();
    if (!kind) return;

    var selStudent = root.querySelector("[data-mr-student]");
    var btnTyt = root.querySelector("[data-mr-exam-tyt]");
    var btnAyt = root.querySelector("[data-mr-exam-ayt]");
    var trackRoot = root.querySelector("[data-mr-track-root]");
    var emptyRoot = root.querySelector("[data-mr-empty-root]");
    var rowTpl = root.querySelector("template[data-mr-row-tpl]");
    var insightHost = root.querySelector("[data-mr-insight]");
    var idPrefix = String(root.getAttribute("data-mr-instance") || "mr").replace(/[^a-zA-Z0-9_-]/g, "");
    /** Görüşme odası gömülü paneller — öğrenci paneli grafiği gösterme */
    var isEmbed = !!(root.closest && root.closest("#tw-scope"));

    var examKey = "TYT";
    var labels = mrKindLabels(kind);

    function persistRow(row) {
      if (!row || !selStudent) return;
      var sid = String(selStudent.value || "").trim();
      if (!sid) return;
      var subj = row.getAttribute("data-mr-subject-id") || "";
      var topic = row.getAttribute("data-mr-topic-id") || "";
      var btn = row.querySelector(".mr-topic-row__status-btn");
      var sel = row.querySelector(".mr-topic-row__book-select");
      var inpS = row.querySelector(".mr-topic-row__inp-solved");
      var inpT = row.querySelector(".mr-topic-row__inp-target");
      setRowRecord(sid, kind, examKey, subj, topic, {
        done: btn && btn.getAttribute("data-mr-status") === "done",
        book: sel ? String(sel.value || "") : "",
        solved: inpS && inpS.value !== "" ? String(inpS.value) : "",
        target: inpT && inpT.value !== "" ? String(inpT.value) : "",
      });
    }

    function hydrateRow(row) {
      if (!row || !selStudent) return;
      var sid = String(selStudent.value || "").trim();
      if (!sid) return;
      var subj = row.getAttribute("data-mr-subject-id") || "";
      var topic = row.getAttribute("data-mr-topic-id") || "";
      var rec = getRowRecord(sid, kind, examKey, subj, topic);
      var btn = row.querySelector(".mr-topic-row__status-btn");
      var sel = row.querySelector(".mr-topic-row__book-select");
      var inpS = row.querySelector(".mr-topic-row__inp-solved");
      var inpT = row.querySelector(".mr-topic-row__inp-target");
      var textEl = btn && btn.querySelector(".mr-status-btn__text");

      if (rec.done) {
        if (btn) {
          btn.setAttribute("data-mr-status", "done");
          btn.classList.add("mr-status-btn--done");
          btn.classList.remove("mr-status-btn--todo");
          btn.setAttribute("aria-pressed", "true");
          if (textEl) textEl.textContent = labels.done;
        }
      } else {
        if (btn) {
          btn.setAttribute("data-mr-status", "todo");
          btn.classList.add("mr-status-btn--todo");
          btn.classList.remove("mr-status-btn--done");
          btn.setAttribute("aria-pressed", "false");
          if (textEl) textEl.textContent = labels.todo;
        }
      }
      if (sel && rec.book != null && rec.book !== "") sel.value = rec.book;
      if (inpS && rec.solved != null && rec.solved !== "") inpS.value = rec.solved;
      if (inpT && rec.target != null && rec.target !== "") inpT.value = rec.target;

      var card = row.closest(".mr-ders-card");
      updateCardProgress(card);
    }

    function hydrateTrack() {
      if (!trackRoot) return;
      trackRoot.querySelectorAll(".mr-topic-row").forEach(hydrateRow);
    }

    function initStatusButton(btn, todoText) {
      if (!btn) return;
      btn.setAttribute("type", "button");
      btn.setAttribute("data-mr-status", "todo");
      btn.classList.add("mr-status-btn--todo");
      btn.classList.remove("mr-status-btn--done");
      btn.setAttribute("aria-pressed", "false");
      var textEl = btn.querySelector(".mr-status-btn__text");
      if (textEl) textEl.textContent = todoText;
      btn.onclick = function () {
        window.toggleStatus(this);
      };
    }

    function statusButtonHtml(todoText) {
      return (
        '<span class="mr-status-btn__text">' +
        escapeHtml(todoText) +
        '</span><span class="mr-status-btn__check" aria-hidden="true">' +
        CHECK_SVG +
        "</span>"
      );
    }

    function buildTopicRow(subject, topic, todoText) {
      var uid = subject.id + "-" + topic.id;
      var bookId = idPrefix + "-book-" + uid;

      if (rowTpl && rowTpl.content) {
        var proto = rowTpl.content.querySelector(".mr-topic-row");
        if (proto) {
          var row = proto.cloneNode(true);
          row.setAttribute("data-mr-subject-id", subject.id);
          row.setAttribute("data-mr-topic-id", topic.id);
          var nameEl = row.querySelector(".mr-topic-row__name");
          if (nameEl) nameEl.textContent = topic.name;
          var sel = row.querySelector(".mr-topic-row__book-select");
          var lbl = row.querySelector(".mr-topic-row__book-lbl");
          if (sel) {
            sel.id = bookId;
            sel.value = "";
          }
          if (lbl) lbl.setAttribute("for", bookId);
          var inpSolved = row.querySelector(".mr-topic-row__inp-solved");
          var inpTarget = row.querySelector(".mr-topic-row__inp-target");
          if (inpSolved) {
            inpSolved.value = "";
            inpSolved.setAttribute("placeholder", "0");
          }
          if (inpTarget) {
            inpTarget.value = "";
            inpTarget.setAttribute("placeholder", "0");
          }
          var btn = row.querySelector(".mr-topic-row__status-btn");
          initStatusButton(btn, todoText);
          return row;
        }
      }

      var row = document.createElement("div");
      row.className = "mr-topic-row";
      row.setAttribute("data-mr-subject-id", subject.id);
      row.setAttribute("data-mr-topic-id", topic.id);
      row.innerHTML =
        '<div class="mr-topic-row__name">' +
        escapeHtml(topic.name) +
        '</div><div class="mr-topic-row__book">' +
        '<label class="visually-hidden" for="' +
        escapeAttr(bookId) +
        '">Kaynak kitap</label>' +
        '<select id="' +
        escapeAttr(bookId) +
        '" class="mr-select kdy-input" aria-label="Kaynak kitap">' +
        '<option value="">— Kitap seçin —</option></select></div>' +
        '<div class="mr-topic-row__solved">' +
        '<span class="mr-topic-row__solved-lbl">Çözülen soru</span>' +
        '<div class="mr-topic-row__inputs">' +
        '<input type="number" min="0" class="mr-inp-num mr-topic-row__inp-solved" value="" placeholder="0" aria-label="Çözülen soru sayısı" />' +
        '<span class="mr-topic-row__slash">/</span>' +
        '<input type="number" min="0" class="mr-inp-num mr-topic-row__inp-target" value="" placeholder="0" aria-label="Hedef soru sayısı" />' +
        "</div></div>" +
        '<div class="mr-topic-row__status">' +
        '<button type="button" class="mr-status-btn mr-topic-row__status-btn mr-status-btn--todo" data-mr-status="todo" aria-pressed="false">' +
        statusButtonHtml(todoText) +
        "</button></div>";
      initStatusButton(row.querySelector(".mr-topic-row__status-btn"), todoText);
      return row;
    }

    function donutInnerHtml(pct) {
      var n = Math.max(0, Math.min(100, Math.round(Number(pct) || 0)));
      return (
        '<span class="mr-pct-donut__inner"><span class="mr-pct-donut__num">' +
        n +
        "</span>%</span>"
      );
    }

    function renderDersCard(subject, topics, todoText, openByDefault) {
      var pct = 0;
      var details = document.createElement("details");
      details.className = "mr-ders-card mr-ders-acc card";
      details.setAttribute("data-mr-ders", subject.id);
      if (openByDefault) details.setAttribute("open", "");

      var summary = document.createElement("summary");
      summary.className = "mr-ders-card__head";
      summary.innerHTML =
        '<h3 class="mr-ders-card__title">' +
        escapeHtml(subject.name) +
        '</h3><div class="mr-ders-acc__head-tools"><div class="mr-pct-donut" data-mr-pct="' +
        pct +
        '" style="--mr-pct:' +
        pct +
        '" role="img" aria-label="Ders ilerlemesi ' +
        pct +
        '%">' +
        donutInnerHtml(pct) +
        '</div><svg class="mr-ders-acc__chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg></div>';

      var body = document.createElement("div");
      body.className = "mr-ders-card__body";
      (topics || []).forEach(function (topic) {
        body.appendChild(buildTopicRow(subject, topic, todoText));
      });
      details.appendChild(summary);
      details.appendChild(body);
      return details;
    }

    function renderExamTrack() {
      if (!trackRoot || kind === "deneme") return;
      trackRoot.innerHTML = "";
      var todoText = labels.todo;

      if (!window.YksMufredatApi || typeof window.YksMufredatApi.getSubjects !== "function") {
        var warn = document.createElement("p");
        warn.className = "mr-track__warn";
        warn.setAttribute("role", "alert");
        warn.textContent = "Müfredat yüklenemedi. yks-mufredat.js sayfada tanımlı olmalıdır.";
        trackRoot.appendChild(warn);
        return;
      }

      var list = subjectsForExam(examKey);
      if (!list.length) {
        var empty = document.createElement("p");
        empty.className = "mr-track__warn";
        empty.textContent = examKey + " için ders bulunamadı.";
        trackRoot.appendChild(empty);
        return;
      }

      list.forEach(function (subject, idx) {
        var topics =
          typeof window.YksMufredatApi.getTopics === "function"
            ? window.YksMufredatApi.getTopics(subject.id)
            : [];
        trackRoot.appendChild(renderDersCard(subject, topics, todoText, idx === 0));
      });
      hydrateTrack();
    }

    function renderMrStudentPanelInsight() {
      if (kind !== "konu" && kind !== "soru") return;
      if (!selStudent) return;
      if (isEmbed) {
        destroyInsightChart(root);
        if (insightHost) {
          insightHost.hidden = true;
          insightHost.innerHTML = "";
        }
        return;
      }
      if (!insightHost) return;
      destroyInsightChart(root);
      var sid = selStudent.value;
      if (!sid || !window.DereceOgrenciBridge) {
        insightHost.hidden = true;
        insightHost.innerHTML = "";
        return;
      }

      var dataId = window.DereceOgrenciBridge.resolveCoachStorageStudentId(sid);
      var sum = window.DereceOgrenciBridge.readCoachCompletedSummary(sid);
      var tries = [sid];
      var cat = (window.DereceStudentCatalog || []).find(function (s) {
        return s && s.id === sid;
      });
      if (cat && cat.code) tries.push(String(cat.code).trim());
      var focusMax = 0;
      for (var fi = 0; fi < tries.length; fi++) {
        if (!tries[fi]) continue;
        var tf = window.DereceOgrenciBridge.todayFocusMinutes(tries[fi]);
        if (tf > focusMax) focusMax = tf;
      }

      var lines = [];
      if (sum && sum.data && sum.data.totalCount > 0) {
        lines.push(
          "Görevler: <strong>" +
            sum.data.completedCount +
            "</strong> / " +
            sum.data.totalCount +
            " tamamlandı."
        );
      }
      if (focusMax > 0) {
        lines.push("Bugünkü odak (panel): <strong>" + focusMax + "</strong> dk.");
      }
      var series = window.DereceOgrenciBridge.lastSevenDaysQuestionSeries(dataId);
      var sumQs = 0;
      for (var qi = 0; qi < series.values.length; qi++) sumQs += series.values[qi] || 0;
      if (sumQs > 0) {
        lines.push("Son 7 günde çözülen soru (panel): <strong>" + sumQs + "</strong> adet.");
      }
      if (!lines.length) {
        lines.push(
          "Bu öğrenci için henüz panelden görev tamamlama, Pomodoro veya soru kumbarası verisi yok."
        );
      }

      var chartId = idPrefix + "-mr-og-chart-" + Math.random().toString(36).slice(2, 9);
      insightHost.innerHTML =
        '<div class="distribution-head"><h3>Öğrenci paneli — günlük köprü</h3></div>' +
        '<p class="distribution-sub" data-mr-insight-copy></p>' +
        '<div class="mr-og-chart-wrap"><canvas id="' +
        escapeAttr(chartId) +
        '" aria-label="Son 7 günlük soru çözümü"></canvas></div>';
      var copy = insightHost.querySelector("[data-mr-insight-copy]");
      if (copy) copy.innerHTML = lines.join(" ");

      insightHost.hidden = false;

      var canvas = document.getElementById(chartId);
      if (!canvas || typeof Chart === "undefined") return;

      var grid =
        getComputedStyle(document.documentElement).getPropertyValue("--header-border").trim() || "#e2e8f0";
      var ctx = canvas.getContext("2d");
      var chart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: series.labels,
          datasets: [
            {
              label: "Çözülen soru",
              data: series.values,
              backgroundColor: "rgba(14, 165, 233, 0.5)",
              borderColor: "rgba(2, 132, 199, 0.95)",
              borderWidth: 1,
              borderRadius: 8,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { maxRotation: 45, minRotation: 0 } },
            y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: grid } },
          },
        },
      });
      if (mrCharts) mrCharts.set(root, chart);
    }

    function setExam(k) {
      examKey = k === "AYT" ? "AYT" : "TYT";
      if (btnTyt) btnTyt.classList.toggle("mr-toggle__btn--active", examKey === "TYT");
      if (btnAyt) btnAyt.classList.toggle("mr-toggle__btn--active", examKey === "AYT");
      if (btnTyt) btnTyt.setAttribute("aria-pressed", examKey === "TYT" ? "true" : "false");
      if (btnAyt) btnAyt.setAttribute("aria-pressed", examKey === "AYT" ? "true" : "false");
      if (kind !== "deneme") {
        renderExamTrack();
        renderMrStudentPanelInsight();
      }
    }

    function fillStudentsSelect(skipQuery) {
      if (!selStudent) return;
      var list = collectAllStudents();
      var prev = selStudent.value || "";
      selStudent.innerHTML = "";
      var ph = document.createElement("option");
      ph.value = "";
      ph.textContent = list.length ? "Öğrenci seçin…" : "Kayıtlı öğrenci bulunamadı";
      selStudent.appendChild(ph);
      list.forEach(function (s) {
        var o = document.createElement("option");
        o.value = s.id;
        o.textContent = s.name;
        selStudent.appendChild(o);
      });
      if (prev && list.some(function (s) { return s.id === prev; })) {
        selStudent.value = prev;
      } else if (list.length && !root.closest("#tw-scope")) {
        selStudent.value = list[0].id;
      }
      selStudent.disabled = !list.length;
      if (!skipQuery && !root.closest("#tw-scope")) {
        try {
          var q = new URLSearchParams(window.location.search || "");
          var sid = String(q.get("student") || q.get("ogrenci") || "").trim();
          if (sid) {
            var opts = selStudent.options;
            for (var i = 0; i < opts.length; i++) {
              if (opts[i].value === sid) {
                selStudent.value = sid;
                break;
              }
            }
          }
        } catch (e) {}
      }
    }

    function bootDeneme() {
      if (trackRoot) {
        trackRoot.hidden = true;
        trackRoot.setAttribute("aria-hidden", "true");
      }
      if (emptyRoot) {
        emptyRoot.hidden = false;
        emptyRoot.removeAttribute("aria-hidden");
      }
    }

    function bootList() {
      if (emptyRoot) {
        emptyRoot.hidden = true;
        emptyRoot.setAttribute("aria-hidden", "true");
      }
      if (trackRoot) {
        trackRoot.hidden = false;
        trackRoot.removeAttribute("aria-hidden");
      }
      fillStudentsSelect(false);
      renderMrStudentPanelInsight();
      setExam("TYT");
    }

    root.__mrPersistRow = persistRow;
    root.__mrRefresh = function () {
      fillStudentsSelect(true);
      if (kind === "deneme") return;
      renderExamTrack();
      renderMrStudentPanelInsight();
    };
    root.__mrSetExam = function (k) {
      setExam(k === "AYT" ? "AYT" : "TYT");
    };
    root.__mrSelectStudent = function (studentId, silent) {
      if (!selStudent) return;
      var v = studentId != null ? String(studentId).trim() : "";
      if (!v) {
        selStudent.value = "";
        if (!silent) selStudent.dispatchEvent(new Event("change", { bubbles: true }));
        else {
          renderExamTrack();
          renderMrStudentPanelInsight();
        }
        return;
      }
      var ok = false;
      for (var i = 0; i < selStudent.options.length; i++) {
        if (selStudent.options[i].value === v) {
          ok = true;
          break;
        }
      }
      if (!ok) fillStudentsSelect(true);
      selStudent.value = v;
      if (!silent) {
        selStudent.dispatchEvent(new Event("change", { bubbles: true }));
      } else {
        renderExamTrack();
        renderMrStudentPanelInsight();
      }
    };

    if (btnTyt) btnTyt.addEventListener("click", function () { setExam("TYT"); });
    if (btnAyt) btnAyt.addEventListener("click", function () { setExam("AYT"); });

    if (selStudent) {
      selStudent.addEventListener("change", function () {
        renderExamTrack();
        renderMrStudentPanelInsight();
      });
    }

    if (trackRoot && kind !== "deneme") {
      trackRoot.addEventListener(
        "change",
        function (e) {
          var t = e.target;
          if (!t || !t.closest(".mr-topic-row")) return;
          var row = t.closest(".mr-topic-row");
          persistRow(row);
        },
        true
      );
      trackRoot.addEventListener(
        "input",
        function (e) {
          var t = e.target;
          if (!t || !t.classList.contains("mr-topic-row__inp-solved")) return;
          if (!t.closest(".mr-topic-row")) return;
          persistRow(t.closest(".mr-topic-row"));
        },
        true
      );
      trackRoot.addEventListener(
        "input",
        function (e) {
          var t = e.target;
          if (!t || !t.classList.contains("mr-topic-row__inp-target")) return;
          persistRow(t.closest(".mr-topic-row"));
        },
        true
      );
    }

    window.addEventListener("mr-coach:update", function () {
      if (kind !== "deneme") hydrateTrack();
    });

    if (kind === "deneme") {
      fillStudentsSelect(false);
      setExam("TYT");
      bootDeneme();
    } else {
      bootList();
    }
  }

  function discoverMounts() {
    var roots = Array.prototype.slice.call(document.querySelectorAll("[data-mr-mount]"));
    return roots;
  }

  function boot() {
    var roots = discoverMounts();
    if (!roots.length) return;
    roots.forEach(initMrMount);
  }

  function fillAllStudentSelectsFromOutside() {
    document.querySelectorAll("[data-mr-mount]").forEach(function (root) {
      var sel = root.querySelector("[data-mr-student]");
      if (!sel) return;
      var list = collectAllStudents();
      var prev = sel.value || "";
      sel.innerHTML = "";
      var ph = document.createElement("option");
      ph.value = "";
      ph.textContent = list.length ? "Öğrenci seçin…" : "Kayıtlı öğrenci bulunamadı";
      sel.appendChild(ph);
      list.forEach(function (s) {
        var o = document.createElement("option");
        o.value = s.id;
        o.textContent = s.name;
        sel.appendChild(o);
      });
      if (prev && list.some(function (s) { return s.id === prev; })) sel.value = prev;
      sel.disabled = !list.length;
    });
    refreshAllMrMounts();
  }

  window.addEventListener("storage", function (e) {
    if (!e) return;
    if (
      e.key === "derecepanel_student_catalog_v1" ||
      e.key === "examResults" ||
      e.key === "derece_exam_results_matrix_v1"
    ) {
      fillAllStudentSelectsFromOutside();
    }
    if (e.key === MR_STORE_KEY) {
      refreshAllMrMounts();
    }
  });
  window.addEventListener("examResults:change", function () {
    fillAllStudentSelectsFromOutside();
  });

  window.addEventListener("yks-mufredat:ready", function () {
    refreshAllMrMounts();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
