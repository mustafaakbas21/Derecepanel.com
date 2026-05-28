/**
 * Randevular — haftalık yoğunluk grafiği, premium kartlar, iki sütunlu modal (localStorage appointments).
 */
(function () {
  var APPOINTMENTS_KEY = "appointments";
  var LEGACY_KEY = "derecepanel_randevular_v2";
  var DAY_SHORT = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
  var DAY_LONG = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
  var MOS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

  var ICON_CAL =
    '<svg class="rnd-ico rnd-ico--cal" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICON_CLK =
    '<svg class="rnd-ico rnd-ico--clk" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2" stroke-linecap="round"/></svg>';
  var ICON_DOTS =
    '<svg class="rnd-card__menu-dots" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.85"/><circle cx="12" cy="12" r="1.85"/><circle cx="19" cy="12" r="1.85"/></svg>';

  var chartInstance = null;
  var editingAppointmentId = null;
  var deletePendingId = null;
  var bulkSelectedAppointmentIds = {};

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function isoDate(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function isoTime(d) {
    return pad(d.getHours()) + ":" + pad(d.getMinutes());
  }

  function weekStartMonday(ref) {
    var d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
    var day = d.getDay();
    var diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function weekBounds() {
    var start = weekStartMonday(new Date());
    var end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { start: start.getTime(), end: end.getTime(), startDate: start };
  }

  function mondayFirstIndex(d) {
    var wd = d.getDay();
    return wd === 0 ? 6 : wd - 1;
  }

  function formatTrShort(iso) {
    var p = iso.split("-").map(Number);
    if (p.length < 3 || isNaN(p[1])) return iso;
    return p[2] + " " + MOS[p[1] - 1] + " " + p[0];
  }

  function slugFromName(name) {
    var n = String(name || "")
      .trim()
      .toLowerCase()
      .replace(/ı/g, "i")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return n || "ogrenci";
  }

  function stableStudentIdFromRecord(p) {
    if (!p) return "";
    var oid = String(p.ogrenciId || "").trim();
    if (oid) return oid;
    var code = String(p.studentCode || p.code || "").trim();
    if (code) {
      return code
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9ğüşıöçĞÜŞİÖÇ\-_.]/g, "");
    }
    return slugFromName(p.name);
  }

  function readStudentsFromStorage() {
    var out = [];
    var seen = {};
    function pushUnique(p) {
      if (!p) return;
      var id = stableStudentIdFromRecord(p);
      if (!id || seen[id]) return;
      seen[id] = true;
      out.push(p);
    }
    try {
      (window.DereceStudentCatalog || []).forEach(pushUnique);
    } catch (e0) {}
    var keys = ["students", "derecepanel_students_full_v1"];
    for (var k = 0; k < keys.length; k++) {
      try {
        var raw = localStorage.getItem(keys[k]);
        if (!raw) continue;
        var arr = JSON.parse(raw);
        if (!Array.isArray(arr)) continue;
        for (var i = 0; i < arr.length; i++) {
          pushUnique(arr[i]);
        }
      } catch (e) {}
    }
    return out;
  }

  function normalizeAppointment(r) {
    if (!r || typeof r !== "object") return r;
    var o = Object.assign({}, r);
    var st = String(o.status || "").trim();
    if (st !== "tamamlandi" && st !== "iptal" && st !== "bekliyor") o.status = "bekliyor";
    return o;
  }

  function loadList() {
    try {
      var raw = localStorage.getItem(APPOINTMENTS_KEY);
      if (raw != null && raw !== "") {
        var arr = JSON.parse(raw);
        if (Array.isArray(arr)) return arr.map(normalizeAppointment);
      }
    } catch (e) {}
    try {
      var leg = localStorage.getItem(LEGACY_KEY);
      if (!leg) return [];
      var old = JSON.parse(leg);
      if (!Array.isArray(old) || !old.length) return [];
      var migrated = old.map(function (r) {
        return Object.assign({}, r, {
          studentId: r.studentId || "",
          ogrenci: r.ogrenci || "",
        });
      });
      try {
        localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(migrated));
      } catch (e2) {}
      return migrated.map(normalizeAppointment);
    } catch (e3) {
      return [];
    }
  }

  function saveList(arr) {
    try {
      localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(arr));
    } catch (e) {}
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function setBulkSelected(id, on) {
    var k = String(id || "").trim();
    if (!k) return;
    if (on) bulkSelectedAppointmentIds[k] = true;
    else delete bulkSelectedAppointmentIds[k];
    syncBulkButtonState();
  }

  function getBulkSelectedIds() {
    return Object.keys(bulkSelectedAppointmentIds);
  }

  function syncBulkButtonState() {
    var btn = document.getElementById("rnd-bulk-open");
    if (!btn) return;
    btn.disabled = getBulkSelectedIds().length === 0;
  }

  function setBulkModal(open) {
    var ov = document.getElementById("rnd-bulk-overlay");
    if (!ov) return;
    ov.classList.toggle("is-open", open);
    ov.setAttribute("aria-hidden", open ? "false" : "true");
    syncBodyOverflow();
  }

  function tipLabel(v) {
    if (v === "online") return "Online";
    if (v === "telefon") return "Telefon";
    return "Yüz yüze";
  }

  function pillClass(tip) {
    if (tip === "online") return "rnd-pill rnd-pill--online";
    if (tip === "telefon") return "rnd-pill rnd-pill--phone";
    return "rnd-pill rnd-pill--inperson";
  }

  function initials(name) {
    var parts = (name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  function hueFromName(name) {
    var h = 0;
    var s = name || "";
    for (var i = 0; i < s.length; i++) {
      h = (h * 31 + s.charCodeAt(i)) >>> 0;
    }
    return (h % 72) + 160;
  }

  function chartCssVars() {
    var cs = getComputedStyle(document.documentElement);
    return {
      bar: (cs.getPropertyValue("--btn-primary-bg").trim() || "#6366f1").replace(/"/g, ""),
      grid: cs.getPropertyValue("--header-border").trim() || "rgba(0,0,0,0.08)",
      tick: cs.getPropertyValue("--text-muted").trim() || "#64748b",
      tickStrong: cs.getPropertyValue("--text-primary").trim() || "#0f172a",
    };
  }

  function computeWeekCounts(list) {
    var w = weekBounds();
    var counts = [0, 0, 0, 0, 0, 0, 0];
    list.forEach(function (r) {
      if (typeof r.ts !== "number") return;
      if (r.status === "iptal") return;
      if (r.ts < w.start || r.ts >= w.end) return;
      var idx = mondayFirstIndex(new Date(r.ts));
      counts[idx]++;
    });
    return { counts: counts, bounds: w };
  }

  function updateWeekMetrics(counts, bounds) {
    var total = counts.reduce(function (a, b) {
      return a + b;
    }, 0);
    var elT = document.getElementById("rnd-metric-total");
    var elP = document.getElementById("rnd-metric-peak");
    var elPs = document.getElementById("rnd-metric-peak-sub");
    var elR = document.getElementById("rnd-metric-range");
    if (elT) elT.textContent = String(total);
    var peakIdx = 0;
    var peakVal = -1;
    for (var i = 0; i < counts.length; i++) {
      if (counts[i] > peakVal) {
        peakVal = counts[i];
        peakIdx = i;
      }
    }
    if (elP && elPs) {
      if (total === 0 || peakVal === 0) {
        elP.textContent = "—";
        elPs.textContent = "Bu hafta henüz randevu yok";
      } else {
        elP.textContent = DAY_LONG[peakIdx];
        elPs.textContent = peakVal + " görüşme";
      }
    }
    if (elR) {
      var a = new Date(bounds.start);
      var b = new Date(bounds.end - 86400000);
      elR.textContent =
        pad(a.getDate()) +
        " " +
        MOS[a.getMonth()] +
        " – " +
        pad(b.getDate()) +
        " " +
        MOS[b.getMonth()] +
        " " +
        b.getFullYear();
    }
  }

  function renderWeekChart(counts, forceRebuild) {
    var canvas = document.getElementById("rnd-week-chart");
    if (!canvas || typeof Chart === "undefined") return;
    var c = chartCssVars();
    var maxVal = Math.max.apply(null, counts);
    var yTop = Math.max(4, maxVal + 1);
    var cfg = {
      type: "bar",
      data: {
        labels: DAY_SHORT.slice(),
        datasets: [
          {
            label: "Randevu",
            data: counts.slice(),
            borderRadius: 8,
            borderSkipped: false,
            maxBarThickness: 36,
            backgroundColor: colorMixFlat(c.bar, 0.28),
            borderColor: colorMixFlat(c.bar, 0.95),
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: colorMixFlat(c.tickStrong, 0.92),
            titleFont: { size: 12, weight: "600" },
            bodyFont: { size: 13 },
            padding: 10,
            cornerRadius: 10,
            displayColors: false,
          },
        },
        scales: {
          x: {
            grid: { display: false, drawBorder: false },
            ticks: { color: c.tick, font: { size: 11, weight: "600" } },
          },
          y: {
            beginAtZero: true,
            suggestedMax: yTop,
            ticks: {
              precision: 0,
              stepSize: 1,
              color: c.tick,
              font: { size: 11 },
            },
            grid: { color: colorMixFlat(c.grid, 0.65), drawBorder: false },
          },
        },
      },
    };
    if (!forceRebuild && chartInstance) {
      chartInstance.data.datasets[0].data = counts.slice();
      chartInstance.options.scales.y.suggestedMax = yTop;
      chartInstance.update();
      return;
    }
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
    chartInstance = new Chart(canvas, cfg);
  }

  function colorMixFlat(hex, alpha) {
    if (!hex || hex.indexOf("#") !== 0) {
      return "rgba(148,163,184," + alpha + ")";
    }
    var x = hex.replace("#", "");
    if (x.length === 3) {
      x = x[0] + x[0] + x[1] + x[1] + x[2] + x[2];
    }
    var r = parseInt(x.slice(0, 2), 16);
    var g = parseInt(x.slice(2, 4), 16);
    var b = parseInt(x.slice(4, 6), 16);
    return "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
  }

  function refreshDashboard(forceRebuildChart) {
    var list = loadList();
    var pack = computeWeekCounts(list);
    updateWeekMetrics(pack.counts, pack.bounds);
    renderWeekChart(pack.counts, !!forceRebuildChart);
  }

  function syncBodyOverflow() {
    var m = document.getElementById("rnd-modal-overlay");
    var d = document.getElementById("rnd-delete-overlay");
    var openM = m && m.classList.contains("is-open");
    var openD = d && d.classList.contains("is-open");
    document.body.style.overflow = openM || openD ? "hidden" : "";
  }

  function closeAllCardMenus() {
    document.querySelectorAll(".rnd-card__menu-panel").forEach(function (p) {
      p.hidden = true;
    });
    document.querySelectorAll(".rnd-card__menu-trigger").forEach(function (b) {
      b.setAttribute("aria-expanded", "false");
    });
  }

  function statusBadgeClass(st) {
    if (st === "tamamlandi") return "rnd-badge rnd-badge--done";
    if (st === "iptal") return "rnd-badge rnd-badge--cancel";
    return "rnd-badge rnd-badge--pending";
  }

  function statusLabelTr(st) {
    if (st === "tamamlandi") return "Tamamlandı";
    if (st === "iptal") return "İptal";
    return "Bekliyor";
  }

  function isPastTs(ts, now) {
    if (typeof ts !== "number") return false;
    var ref = now instanceof Date ? now : new Date();
    return ts < ref.getTime();
  }

  function getEffectiveStatus(r, now) {
    var raw = r && r.status ? String(r.status).trim() : "bekliyor";
    if (raw !== "bekliyor" && raw !== "tamamlandi" && raw !== "iptal") raw = "bekliyor";
    if (raw === "bekliyor" && r && isPastTs(r.ts, now)) return "tamamlandi";
    return raw;
  }

  function getStatusBadgeText(r, now) {
    var raw = r && r.status ? String(r.status).trim() : "bekliyor";
    var eff = getEffectiveStatus(r, now);
    if (eff === "tamamlandi" && raw === "bekliyor" && r && isPastTs(r.ts, now)) return "Geçmiş";
    return statusLabelTr(eff);
  }

  function getStudentWhatsappNumber(studentRecord) {
    var gsm = normalizeTrGsmForWa(pickStudentPhone(studentRecord));
    return gsm || "905000000000";
  }

  function buildWhatsAppUrl(phoneDigits, message) {
    var tel = String(phoneDigits || "").replace(/\D/g, "");
    if (!tel) tel = "905000000000";
    var url = "https://wa.me/" + tel;
    if (message != null && String(message).trim()) {
      url += "?text=" + encodeURIComponent(String(message));
    }
    return url;
  }

  function openWhatsApp(phoneDigits, message, preOpenedWindow) {
    var url = buildWhatsAppUrl(phoneDigits, message);
    if (preOpenedWindow && typeof preOpenedWindow.location !== "undefined") {
      try {
        preOpenedWindow.opener = null;
      } catch (e0) {}
      try {
        preOpenedWindow.location.href = url;
        return true;
      } catch (e1) {
        // fall through to regular open
      }
    }
    var w = null;
    try {
      w = window.open(url, "_blank");
    } catch (e) {
      w = null;
    }
    if (w) {
      try {
        w.opener = null;
      } catch (e2) {}
      return true;
    }
    alert("WhatsApp penceresi tarayıcı tarafından engellendi. Linki manuel açabilirsiniz:\n\n" + url);
    return false;
  }

  function applyStatusFilter(list, key) {
    var now = new Date();
    if (key === "all") return list.slice();
    if (key === "upcoming") {
      return list.filter(function (r) {
        return getEffectiveStatus(r, now) === "bekliyor" && typeof r.ts === "number" && r.ts >= now.getTime();
      });
    }
    if (key === "done")
      return list.filter(function (r) {
        return getEffectiveStatus(r, now) === "tamamlandi";
      });
    if (key === "cancelled")
      return list.filter(function (r) {
        return getEffectiveStatus(r, now) === "iptal";
      });
    return list.slice();
  }

  function applyTypeFilter(list, key) {
    if (!key || key === "all") return list.slice();
    if (key === "yuz_yuze") return list.filter(function (r) { return r.tip === "yuz_yuze"; });
    if (key === "online") {
      return list.filter(function (r) {
        return r.tip === "online" || r.tip === "telefon";
      });
    }
    return list.slice();
  }

  function applySearchFilter(list, q) {
    var t = String(q || "")
      .trim()
      .toLocaleLowerCase("tr-TR");
    if (!t) return list.slice();
    return list.filter(function (r) {
      return (
        String(r.ogrenci || "")
          .toLocaleLowerCase("tr-TR")
          .indexOf(t) !== -1
      );
    });
  }

  function getFilterControls() {
    var searchEl = document.getElementById("rnd-filter-search");
    var statusWrap = document.getElementById("rnd-filter-status");
    var typeWrap = document.getElementById("rnd-filter-type");
    var st = "all";
    var tp = "all";
    if (statusWrap) {
      var sb = statusWrap.querySelector(".rnd-filter-seg__btn.is-active");
      if (sb && sb.getAttribute("data-value")) st = sb.getAttribute("data-value");
    }
    if (typeWrap) {
      var tb = typeWrap.querySelector(".rnd-filter-seg__btn.is-active");
      if (tb && tb.getAttribute("data-value")) tp = tb.getAttribute("data-value");
    }
    return {
      search: searchEl ? searchEl.value : "",
      status: st,
      type: tp,
    };
  }

  function setDeleteOverlay(open) {
    var ov = document.getElementById("rnd-delete-overlay");
    if (!ov) return;
    ov.classList.toggle("is-open", open);
    ov.setAttribute("aria-hidden", open ? "false" : "true");
    if (!open) deletePendingId = null;
    syncBodyOverflow();
  }

  function setModalTitle(isEdit) {
    var el = document.getElementById("rnd-modal-title");
    if (el) el.textContent = isEdit ? "Randevuyu düzenle" : "Yeni randevu";
  }

  function findAppointmentById(id) {
    var want = String(id || "").trim();
    if (!want) return null;
    var list = loadList();
    for (var i = 0; i < list.length; i++) {
      if (list[i] && String(list[i].id) === want) return list[i];
    }
    return null;
  }

  function buildBulkSelectedPeople() {
    var ids = getBulkSelectedIds();
    var out = [];
    for (var i = 0; i < ids.length; i++) {
      var rec = findAppointmentById(ids[i]);
      if (!rec) continue;
      var stu = findStudentRecordByStableId(rec.studentId);
      var phone = normalizeTrGsmForWa(pickStudentPhone(stu)) || "905000000000";
      out.push({
        appointmentId: String(rec.id || ""),
        studentId: String(rec.studentId || ""),
        name: String(rec.ogrenci || (stu && stu.name) || "Öğrenci"),
        phone: phone,
      });
    }
    return out;
  }

  function renderBulkModalList() {
    var listEl = document.getElementById("rnd-bulk-list");
    if (!listEl) return;
    listEl.innerHTML = "";
    var people = buildBulkSelectedPeople();
    if (!people.length) {
      listEl.innerHTML = '<div class="rnd-filter-empty__hint">Henüz seçim yok.</div>';
      return;
    }
    for (var i = 0; i < people.length; i++) {
      var p = people[i];
      var row = document.createElement("div");
      row.className = "rnd-bulk-item";
      row.dataset.appointmentId = p.appointmentId;
      row.innerHTML =
        '<div class="rnd-bulk-item__name">' +
        escapeHtml(p.name) +
        "</div>" +
        '<button type="button" class="rnd-bulk-send" data-bulk-action="send" data-phone="' +
        escapeHtml(p.phone) +
        '" data-name="' +
        escapeHtml(p.name) +
        '">Gönder</button>';
      listEl.appendChild(row);
    }
  }

  function fillFormFromRecord(r) {
    if (!r) return;
    var d = document.getElementById("rnd-date");
    var t = document.getElementById("rnd-time");
    if (d) d.value = r.tarih || "";
    if (t) t.value = r.saat || "";
    var sel = document.getElementById("randevuOgrenciSelect");
    if (sel) {
      var sid = String(r.studentId || "").trim();
      fillRandevuOgrenciSelect();
      var found = false;
      for (var i = 0; i < sel.options.length; i++) {
        if (sel.options[i].value === sid) {
          sel.value = sid;
          found = true;
          break;
        }
      }
      if (!found && sid) {
        var opt = document.createElement("option");
        opt.value = sid;
        opt.textContent = String(r.ogrenci || sid);
        sel.appendChild(opt);
        sel.value = sid;
      }
    }
    var dur = document.getElementById("rnd-duration");
    if (dur) dur.value = String(r.sure != null ? r.sure : 45);
    var tip = document.getElementById("rnd-type");
    if (tip) tip.value = r.tip || "yuz_yuze";
    var stEl = document.getElementById("rnd-status");
    if (stEl) stEl.value = r.status || "bekliyor";
    var sub = document.getElementById("rnd-subject");
    if (sub) sub.value = r.konu || "";
    var notes = document.getElementById("rnd-notes");
    if (notes) notes.value = r.notlar || "";
    var loc = document.getElementById("rnd-location");
    if (loc) loc.value = r.yer || "";
    var n = document.getElementById("rnd-notify-student");
    if (n) n.checked = false;
  }

  function openEditModal(id) {
    var r = findAppointmentById(id);
    if (!r) {
      alert("Randevu bulunamadı.");
      return;
    }
    editingAppointmentId = String(r.id);
    fillRandevuOgrenciSelect();
    fillFormFromRecord(r);
    setModalTitle(true);
    setModal(true);
  }

  function confirmDeleteAppointment() {
    if (!deletePendingId) return;
    var id = deletePendingId;
    var list = loadList().filter(function (r) {
      return r && String(r.id) !== id;
    });
    saveList(list);
    setDeleteOverlay(false);
    renderList();
  }

  function renderList() {
    var raw = loadList().sort(function (a, b) {
      return (a.ts || 0) - (b.ts || 0);
    });
    var fl = getFilterControls();
    var filtered = applySearchFilter(applyTypeFilter(applyStatusFilter(raw, fl.status), fl.type), fl.search);
    var wrap = document.getElementById("rnd-list");
    var empty = document.getElementById("rnd-empty");
    var filtEmpty = document.getElementById("rnd-filter-empty");
    if (!wrap || !empty) return;
    wrap.innerHTML = "";
    if (!raw.length) {
      empty.hidden = false;
      if (filtEmpty) filtEmpty.hidden = true;
      refreshDashboard();
      return;
    }
    empty.hidden = true;
    if (!filtered.length) {
      if (filtEmpty) filtEmpty.hidden = false;
      refreshDashboard();
      return;
    }
    if (filtEmpty) filtEmpty.hidden = true;
    var now = new Date();
    filtered.forEach(function (r) {
      var hue = hueFromName(r.ogrenci);
      var ini = initials(r.ogrenci);
      var st = getEffectiveStatus(r, now);
      var stText = getStatusBadgeText(r, now);
      var art = document.createElement("article");
      art.className = "rnd-card rnd-card--premium";
      art.setAttribute("role", "listitem");
      art.dataset.rndId = String(r.id || "");
      art.style.setProperty("--rnd-av-h", String(hue));
      art.innerHTML =
        '<input type="checkbox" class="rnd-card__select" data-rnd-action="select" aria-label="Randevuyu seç" ' +
        (bulkSelectedAppointmentIds[String(r.id || "")] ? "checked" : "") +
        " />" +
        '<div class="rnd-card__row">' +
        '<div class="rnd-card__avatar" aria-hidden="true">' +
        escapeHtml(ini) +
        "</div>" +
        '<div class="rnd-card__main">' +
        '<div class="rnd-card__topbar">' +
        '<div class="rnd-card__pills">' +
        '<span class="' +
        pillClass(r.tip) +
        '">' +
        escapeHtml(tipLabel(r.tip)) +
        "</span>" +
        '<span class="' +
        statusBadgeClass(st) +
        '">' +
        escapeHtml(stText) +
        "</span>" +
        "</div>" +
        '<div class="rnd-card__topbar-right">' +
        '<div class="rnd-card__meta">' +
        '<span class="rnd-card__meta-item">' +
        ICON_CAL +
        escapeHtml(formatTrShort(r.tarih)) +
        "</span>" +
        '<span class="rnd-card__meta-item">' +
        ICON_CLK +
        escapeHtml(r.saat || "—") +
        "</span></div>" +
        '<div class="rnd-card__menu">' +
        '<button type="button" class="rnd-card__wa-btn" data-rnd-action="wa" aria-label="WhatsApp ile hızlı iletişim" title="WhatsApp">' +
        '<svg width="18" height="18" viewBox="0 0 32 32" aria-hidden="true" style="display:block">' +
        '<path fill="currentColor" d="M19.11 17.24c-.28-.14-1.66-.82-1.92-.91-.26-.09-.45-.14-.64.14-.19.28-.73.91-.9 1.1-.16.19-.33.21-.61.07-.28-.14-1.2-.44-2.28-1.4-.84-.75-1.41-1.68-1.57-1.96-.16-.28-.02-.43.12-.57.12-.12.28-.33.42-.49.14-.16.19-.28.28-.47.09-.19.05-.35-.02-.49-.07-.14-.64-1.54-.87-2.1-.23-.56-.47-.48-.64-.49h-.55c-.19 0-.49.07-.75.35-.26.28-.98.96-.98 2.34 0 1.38 1 2.71 1.14 2.9.14.19 1.96 2.99 4.75 4.19.66.28 1.17.45 1.57.58.66.21 1.26.18 1.74.11.53-.08 1.66-.68 1.89-1.33.23-.66.23-1.22.16-1.33-.07-.12-.26-.19-.54-.33z"/>' +
        '<path fill="currentColor" d="M16.01 3.2c-7.07 0-12.81 5.74-12.81 12.81 0 2.25.59 4.46 1.72 6.4L3.2 28.8l6.55-1.69a12.75 12.75 0 0 0 6.26 1.64h.01c7.07 0 12.81-5.74 12.81-12.81S23.08 3.2 16.01 3.2zm0 23.06h-.01c-2.04 0-4.05-.55-5.8-1.6l-.42-.25-3.89 1 1.04-3.79-.27-.44a10.79 10.79 0 0 1-1.65-5.74c0-5.95 4.84-10.79 10.79-10.79 5.95 0 10.79 4.84 10.79 10.79s-4.84 10.82-10.78 10.82z"/>' +
        "</svg>" +
        "</button>" +
        '<button type="button" class="rnd-card__menu-trigger" aria-expanded="false" aria-haspopup="true" aria-label="Randevu işlemleri">' +
        ICON_DOTS +
        "</button>" +
        '<div class="rnd-card__menu-panel" hidden role="menu">' +
        '<button type="button" class="rnd-card__menu-item" role="menuitem" data-rnd-action="edit">Düzenle</button>' +
        '<button type="button" class="rnd-card__menu-item rnd-card__menu-item--danger" role="menuitem" data-rnd-action="delete">Sil</button>' +
        "</div></div></div></div>" +
        '<h3 class="rnd-card__name">' +
        escapeHtml(r.ogrenci) +
        "</h3>" +
        '<p class="rnd-card__sub">' +
        escapeHtml(r.konu || "Görüşme") +
        " · " +
        escapeHtml(String(r.sure || 45) + " dk") +
        "</p></div></div>";
      wrap.appendChild(art);
    });
    refreshDashboard();
    syncBulkButtonState();
  }

  function formatSinifLabel(s) {
    var t = String(s || "").trim();
    return t || "—";
  }

  function findStudentRecordByStableId(stableId) {
    var id = String(stableId || "").trim();
    if (!id) return null;
    var list = readStudentsFromStorage();
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      if (!p) continue;
      if (stableStudentIdFromRecord(p) === id) return p;
    }
    return null;
  }

  function pickStudentPhone(p) {
    if (!p) return "";
    return String(p.phone || p.telefon || p.gsm || p.parentPhone || "").trim();
  }

  function normalizeTrGsmForWa(raw) {
    var d = String(raw || "").replace(/\D/g, "");
    if (!d) return "";
    if (d.indexOf("00") === 0) d = d.slice(2);
    if (d.charAt(0) === "0") d = "90" + d.slice(1);
    if (d.length === 10 && d.charAt(0) === "5") d = "90" + d;
    if (d.length < 10) return "";
    return d;
  }

  function formatDdMmFromIso(tarih) {
    var p = String(tarih || "").split("-");
    if (p.length < 3) return String(tarih || "");
    return pad(parseInt(p[2], 10) || 0) + "." + pad(parseInt(p[1], 10) || 0);
  }

  function notificationStorageKey(studentId) {
    return "student_notifications_" + String(studentId || "").trim();
  }

  function appendStudentNotification(studentId, item) {
    var k = notificationStorageKey(studentId);
    var list = [];
    try {
      var prev = localStorage.getItem(k);
      if (prev) {
        var parsed = JSON.parse(prev);
        if (Array.isArray(parsed)) list = parsed;
        else if (parsed && typeof parsed === "object") list = [parsed];
      }
    } catch (e) {}
    list.push(item);
    try {
      localStorage.setItem(k, JSON.stringify(list));
    } catch (e2) {}
  }

  function fillRandevuOgrenciSelect() {
    var sel = document.getElementById("randevuOgrenciSelect");
    if (!sel) return;
    var prev = sel.value;
    while (sel.options.length > 1) sel.remove(1);
    var seen = {};
    readStudentsFromStorage().forEach(function (p) {
      if (!p) return;
      var id = stableStudentIdFromRecord(p);
      if (!id || seen[id]) return;
      seen[id] = true;
      var opt = document.createElement("option");
      opt.value = id;
      var name = String(p.name || "").trim() || "İsimsiz";
      opt.textContent = name + " - " + formatSinifLabel(p.sinif);
      sel.appendChild(opt);
    });
    if (prev) {
      for (var i = 0; i < sel.options.length; i++) {
        if (sel.options[i].value === prev) {
          sel.value = prev;
          break;
        }
      }
    }
  }

  function setModal(open) {
    var ov = document.getElementById("rnd-modal-overlay");
    if (!ov) return;
    ov.classList.toggle("is-open", open);
    ov.setAttribute("aria-hidden", open ? "false" : "true");
    syncBodyOverflow();
  }

  function resetForm() {
    editingAppointmentId = null;
    setModalTitle(false);
    var d = document.getElementById("rnd-date");
    var t = document.getElementById("rnd-time");
    var today = new Date();
    if (d) d.value = isoDate(today);
    if (t) t.value = pad(today.getHours() + 1 > 23 ? 9 : today.getHours() + 1) + ":00";
    var s = document.getElementById("randevuOgrenciSelect");
    if (s) s.selectedIndex = 0;
    var dur = document.getElementById("rnd-duration");
    if (dur) dur.value = "45";
    var tip = document.getElementById("rnd-type");
    if (tip) tip.value = "yuz_yuze";
    var stEl = document.getElementById("rnd-status");
    if (stEl) stEl.value = "bekliyor";
    ["rnd-subject", "rnd-notes", "rnd-location"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = "";
    });
    var n = document.getElementById("rnd-notify-student");
    if (n) n.checked = true;
  }

  function getSelectedStudentDisplayNameFromForm() {
    var sel = document.getElementById("randevuOgrenciSelect");
    if (!sel) return "";
    var sid = String(sel.value || "").trim();
    if (!sid) return "";
    var opt = sel.options[sel.selectedIndex];
    var label = opt && opt.textContent ? String(opt.textContent).trim() : "";
    if (!label) return "";
    var parts = label.split(" - ");
    var name = String(parts[0] || "").trim();
    return name || label;
  }

  /**
   * Yeni Randevu formundaki WhatsApp butonu: anında önizleme mesajı açar (kayıt gerektirmez).
   * Test telefonu: 905000000000
   */
  function openWhatsappFromNewAppointmentForm() {
    var ogrenci = getSelectedStudentDisplayNameFromForm();
    var tarihIso = document.getElementById("rnd-date") && document.getElementById("rnd-date").value;
    var saat = document.getElementById("rnd-time") && document.getElementById("rnd-time").value;
    if (!ogrenci || !tarihIso || !saat) {
      alert("Lütfen öğrenci, tarih ve saat seçin.");
      return;
    }
    var tarihHuman = formatTrShort(tarihIso);
    var msg =
      "Merhaba " +
      ogrenci +
      ", " +
      tarihHuman +
      " günü saat " +
      saat +
      "'te görüşme randevunuz oluşturulmuştur. İyi çalışmalar dileriz.";
    var link = "https://wa.me/905000000000?text=" + encodeURIComponent(msg);
    window.open(link, "_blank");
  }

  function saveAppointment() {
    var sel = document.getElementById("randevuOgrenciSelect");
    var studentStableId = sel && sel.value ? String(sel.value).trim() : "";
    if (!studentStableId) {
      alert("Lütfen öğrenci seçin.");
      return;
    }
    var stu = findStudentRecordByStableId(studentStableId);
    var ogrenci = stu && String(stu.name || "").trim() ? String(stu.name).trim() : studentStableId;
    var tarih = document.getElementById("rnd-date") && document.getElementById("rnd-date").value;
    var saat = document.getElementById("rnd-time") && document.getElementById("rnd-time").value;
    if (!tarih || !saat) {
      alert("Tarih ve saat gerekli.");
      return;
    }
    var parts = tarih.split("-").map(Number);
    var tt = saat.split(":");
    var dt = new Date(parts[0], parts[1] - 1, parts[2], parseInt(tt[0], 10), parseInt(tt[1] || "0", 10));
    var stEl = document.getElementById("rnd-status");
    var stVal = stEl && stEl.value ? String(stEl.value).trim() : "bekliyor";
    if (stVal !== "bekliyor" && stVal !== "tamamlandi" && stVal !== "iptal") stVal = "bekliyor";
    var row = {
      studentId: studentStableId,
      ogrenci: ogrenci,
      tarih: tarih,
      saat: saat,
      sure: parseInt(document.getElementById("rnd-duration").value, 10) || 45,
      tip: document.getElementById("rnd-type").value,
      status: stVal,
      konu: (document.getElementById("rnd-subject") && document.getElementById("rnd-subject").value.trim()) || "",
      notlar: (document.getElementById("rnd-notes") && document.getElementById("rnd-notes").value) || "",
      yer: (document.getElementById("rnd-location") && document.getElementById("rnd-location").value.trim()) || "",
      ts: dt.getTime(),
    };
    var list = loadList();
    var isEdit = !!editingAppointmentId;
    if (isEdit) {
      var idx = -1;
      for (var i = 0; i < list.length; i++) {
        if (list[i] && String(list[i].id) === String(editingAppointmentId)) {
          idx = i;
          break;
        }
      }
      if (idx === -1) {
        alert("Randevu bulunamadı.");
        return;
      }
      row.id = list[idx].id;
      list[idx] = Object.assign({}, list[idx], row);
    } else {
      row.id = "rnd-" + Date.now();
      list.push(row);
    }
    saveList(list);
    var notifyEl = document.getElementById("rnd-notify-student");
    var doNotify = !isEdit && notifyEl && notifyEl.checked;
    var ddmm = formatDdMmFromIso(tarih);
    var saatDisp = saat || "—";
    if (doNotify) {
      appendStudentNotification(studentStableId, {
        type: "randevu",
        text: "Yeni Randevu: " + ddmm + " Saat " + saatDisp,
        read: false,
      });
    }
    editingAppointmentId = null;
    setModalTitle(false);
    renderList();
    setModal(false);
  }

  function wireFilterSeg(wrapId) {
    var wrap = document.getElementById(wrapId);
    if (!wrap) return;
    wrap.addEventListener("click", function (e) {
      var btn = e.target.closest(".rnd-filter-seg__btn");
      if (!btn || !wrap.contains(btn)) return;
      wrap.querySelectorAll(".rnd-filter-seg__btn").forEach(function (b) {
        var on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      renderList();
    });
    wrap.querySelectorAll(".rnd-filter-seg__btn").forEach(function (b) {
      b.setAttribute("aria-pressed", b.classList.contains("is-active") ? "true" : "false");
    });
  }

  function bind() {
    fillRandevuOgrenciSelect();
    document.getElementById("rnd-open-modal") &&
      document.getElementById("rnd-open-modal").addEventListener("click", function () {
        fillRandevuOgrenciSelect();
        resetForm();
        setModal(true);
      });
    ["rnd-modal-close", "rnd-cancel"].forEach(function (id) {
      var b = document.getElementById(id);
      if (b)
        b.addEventListener("click", function () {
          setModal(false);
        });
    });
    var ov = document.getElementById("rnd-modal-overlay");
    if (ov) {
      ov.addEventListener("click", function (e) {
        if (e.target === ov) setModal(false);
      });
    }
    var delOv = document.getElementById("rnd-delete-overlay");
    if (delOv) {
      delOv.addEventListener("click", function (e) {
        if (e.target === delOv) setDeleteOverlay(false);
      });
    }
    document.getElementById("rnd-delete-cancel") &&
      document.getElementById("rnd-delete-cancel").addEventListener("click", function () {
        setDeleteOverlay(false);
      });
    document.getElementById("rnd-delete-confirm") &&
      document.getElementById("rnd-delete-confirm").addEventListener("click", function () {
        confirmDeleteAppointment();
      });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      var d = document.getElementById("rnd-delete-overlay");
      if (d && d.classList.contains("is-open")) {
        setDeleteOverlay(false);
        return;
      }
      var b = document.getElementById("rnd-bulk-overlay");
      if (b && b.classList.contains("is-open")) {
        setBulkModal(false);
        return;
      }
      closeAllCardMenus();
      if (ov && ov.classList.contains("is-open")) setModal(false);
    });
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".rnd-card__menu")) closeAllCardMenus();
    });
    var listEl = document.getElementById("rnd-list");
    if (listEl) {
      listEl.addEventListener("click", function (e) {
        var selCb = e.target && e.target.closest ? e.target.closest('[data-rnd-action="select"]') : null;
        if (selCb && listEl.contains(selCb)) {
          e.stopPropagation();
          var card0 = selCb.closest(".rnd-card");
          var rid0 = card0 && card0.dataset ? card0.dataset.rndId : "";
          setBulkSelected(rid0, !!selCb.checked);
          return;
        }
        var waBtn = e.target.closest('[data-rnd-action="wa"]');
        if (waBtn && listEl.contains(waBtn)) {
          e.stopPropagation();
          var waCard = waBtn.closest(".rnd-card");
          var waRid = waCard && waCard.dataset ? waCard.dataset.rndId : "";
          if (!waRid) return;
          var rec = findAppointmentById(waRid);
          if (!rec) return;
          var stu = findStudentRecordByStableId(rec.studentId);
          var ogr = rec.ogrenci || (stu && stu.name) || "Öğrenci";
          var gsm = getStudentWhatsappNumber(stu);
          var tarihHuman = formatTrShort(rec.tarih);
          var saatDisp = rec.saat || "—";
          openWhatsApp(
            gsm,
            "Merhaba " +
              ogr +
              ", " +
              tarihHuman +
              " günü saat " +
              saatDisp +
              "'teki görüşme randevunuz için yazıyorum. İyi çalışmalar dilerim."
          );
          return;
        }
        var trig = e.target.closest(".rnd-card__menu-trigger");
        if (trig && listEl.contains(trig)) {
          e.stopPropagation();
          var menuRoot = trig.closest(".rnd-card__menu");
          var panel = menuRoot && menuRoot.querySelector(".rnd-card__menu-panel");
          var willOpen = panel && panel.hidden;
          closeAllCardMenus();
          if (willOpen && panel) {
            panel.hidden = false;
            trig.setAttribute("aria-expanded", "true");
          }
          return;
        }
        var actBtn = e.target.closest("[data-rnd-action]");
        if (!actBtn || !listEl.contains(actBtn)) return;
        e.stopPropagation();
        var card = actBtn.closest(".rnd-card");
        var rid = card && card.dataset ? card.dataset.rndId : "";
        var action = actBtn.getAttribute("data-rnd-action");
        closeAllCardMenus();
        if (action === "edit" && rid) {
          openEditModal(rid);
          return;
        }
        if (action === "delete" && rid) {
          deletePendingId = String(rid);
          setDeleteOverlay(true);
        }
      });
    }
    var searchIn = document.getElementById("rnd-filter-search");
    if (searchIn) {
      searchIn.addEventListener("input", function () {
        renderList();
      });
    }
    wireFilterSeg("rnd-filter-status");
    wireFilterSeg("rnd-filter-type");
    document.getElementById("rnd-save") &&
      document.getElementById("rnd-save").addEventListener("click", saveAppointment);

    var waBtn = document.getElementById("rnd-wa-toggle");
    if (waBtn) {
      waBtn.addEventListener("click", function (e) {
        e.preventDefault();
        openWhatsappFromNewAppointmentForm();
      });
    }

    var bulkBtn = document.getElementById("rnd-bulk-open");
    if (bulkBtn) {
      bulkBtn.addEventListener("click", function () {
        renderBulkModalList();
        setBulkModal(true);
      });
    }
    ["rnd-bulk-close", "rnd-bulk-cancel"].forEach(function (id) {
      var b2 = document.getElementById(id);
      if (b2)
        b2.addEventListener("click", function () {
          setBulkModal(false);
        });
    });
    var bulkOv = document.getElementById("rnd-bulk-overlay");
    if (bulkOv) {
      bulkOv.addEventListener("click", function (e) {
        if (e.target === bulkOv) setBulkModal(false);
      });
    }
    var bulkList = document.getElementById("rnd-bulk-list");
    if (bulkList) {
      bulkList.addEventListener("click", function (e) {
        var btn = e.target.closest('[data-bulk-action="send"]');
        if (!btn || !bulkList.contains(btn)) return;
        e.stopPropagation();
        if (btn.classList.contains("is-sent") || btn.disabled) return;
        var msgEl = document.getElementById("rnd-bulk-message");
        var msg = msgEl ? String(msgEl.value || "").trim() : "";
        if (!msg) {
          alert("Lütfen mesaj metnini yazın.");
          return;
        }
        var tel = btn.getAttribute("data-phone") || "905000000000";
        var link = "https://wa.me/" + String(tel).replace(/\D/g, "") + "?text=" + encodeURIComponent(msg);
        window.open(link, "_blank");
        btn.classList.add("is-sent");
        btn.textContent = "Gönderildi";
        btn.disabled = true;
      });
    }

    try {
      new MutationObserver(function () {
        refreshDashboard(true);
      }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    } catch (err) {}
  }

  function boot() {
    bind();
    renderList();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
