/**
 * Denemeler Global Takvim — kompakt takvim + en yakın 5 deneme + tablo listesi.
 * Varsayılan liste boş; kayıtlar arayüzden eklenebilir.
 */
(function () {
  var DGT_READONLY =
    typeof document !== "undefined" &&
    document.documentElement &&
    document.documentElement.getAttribute("data-dgt-readonly") === "1";
  var MONTHS_TR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  var DAYS_TR = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function iso(y, m, d) {
    return y + "-" + pad(m) + "-" + pad(d);
  }

  function parseIso(s) {
    var p = s.split("-");
    return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
  }

  function formatTrDate(s) {
    var d = parseIso(s);
    return pad(d.getDate()) + "." + pad(d.getMonth() + 1) + "." + d.getFullYear();
  }

  function todayIso() {
    var t = new Date();
    return iso(t.getFullYear(), t.getMonth() + 1, t.getDate());
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  var ICON_EDIT =
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
  var ICON_DETAIL =
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
  var ICON_DELETE =
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>';

  function badgeClass(tur) {
    if (tur === "TYT") return "dgt-badge dgt-badge--tyt";
    if (tur === "AYT") return "dgt-badge dgt-badge--ayt";
    if (tur === "YDT") return "dgt-badge dgt-badge--ydt";
    return "dgt-badge dgt-badge--yks";
  }

  function dotClass(tur) {
    if (tur === "TYT") return "dgt-dot dgt-dot--tyt";
    if (tur === "AYT") return "dgt-dot dgt-dot--ayt";
    if (tur === "YDT") return "dgt-dot dgt-dot--ydt";
    return "dgt-dot dgt-dot--yks";
  }

  function daysFromToday(isoDate) {
    var t0 = parseIso(todayIso());
    var t = parseIso(isoDate);
    var d0 = Date.UTC(t0.getFullYear(), t0.getMonth(), t0.getDate());
    var d1 = Date.UTC(t.getFullYear(), t.getMonth(), t.getDate());
    return Math.round((d1 - d0) / 864e5);
  }

  function relativeDayLabel(n) {
    if (n < 0) return Math.abs(n) + " gün önce";
    if (n === 0) return "Bugün";
    if (n === 1) return "Yarın";
    return n + " gün sonra";
  }

  function sortExams(rows) {
    rows.sort(function (a, b) {
      return a.tarih.localeCompare(b.tarih) || (a.saat || "").localeCompare(b.saat || "");
    });
  }

  var exams = [];
  var LIVE_LS_KEY = "global_exams_live";
  var EMPTY_LIVE_MSG = "Henüz global deneme takvimi açıklanmadı";

  function normalizeExamRow(x) {
    if (!x || typeof x !== "object") return null;
    var o = Object.assign({}, x);
    var s = o.sinav || o.tur || "TYT";
    o.sinav = s;
    o.tur = s;
    o.ad = o.ad || o.name || "";
    if (o.yayinevi == null || o.yayinevi === "") o.yayinevi = "—";
    return o;
  }

  function loadExamsFromStorage() {
    try {
      var raw = localStorage.getItem(LIVE_LS_KEY);
      if (raw == null || raw === "") {
        exams = [];
        return;
      }
      var arr = JSON.parse(raw);
      if (!Array.isArray(arr)) {
        exams = [];
        return;
      }
      exams = arr.map(normalizeExamRow).filter(Boolean);
      sortExams(exams);
    } catch (e) {
      exams = [];
    }
  }

  function persistExamsToStorage() {
    try {
      var norm = exams.map(normalizeExamRow).filter(Boolean);
      localStorage.setItem(LIVE_LS_KEY, JSON.stringify(norm));
      localStorage.setItem("global_denemeler_v1", JSON.stringify(norm));
      localStorage.setItem("globalExams", JSON.stringify(norm));
    } catch (e) {}
    try {
      window.dispatchEvent(new CustomEvent("globalDenemeler:updated"));
    } catch (e2) {}
  }

  var elCalGrid = document.getElementById("dgt-cal-grid");
  var elCalTitle = document.getElementById("dgt-cal-title");
  var elCalPrev = document.getElementById("dgt-cal-prev");
  var elCalNext = document.getElementById("dgt-cal-next");
  var elCalDayTitle = document.getElementById("dgt-cal-day-title");
  var elCalDayHint = document.getElementById("dgt-cal-day-hint");
  var elCalDayList = document.getElementById("dgt-cal-day-list");
  var elNearestList = document.getElementById("dgt-nearest-list");
  var elTableBody = document.getElementById("dgt-exam-table-body");
  var elPanelTitle = document.getElementById("dgt-panel-title");
  var elPanelSub = document.getElementById("dgt-panel-sub");
  var elClearDay = document.getElementById("dgt-clear-day");
  var elTur = document.getElementById("dgt-filter-tur");
  var elAy = document.getElementById("dgt-filter-ay");
  var elSearch = document.getElementById("dgt-filter-search");
  var elTurSelect = document.getElementById("dgt-filter-tur-select");
  var elYayinevi = document.getElementById("dgt-filter-yayinevi");
  var elFilterCount = document.getElementById("dgt-filter-count");
  var elModalCancel = document.getElementById("kdy-modal-cancel");
  var elModalCloseX = document.getElementById("kdy-modal-close");
  var elPageSize = document.getElementById("dgt-page-size");
  var elPageMeta = document.getElementById("dgt-page-meta");
  var elPagePrev = document.getElementById("dgt-page-prev");
  var elPageNext = document.getElementById("dgt-page-next");

  if (!elCalGrid || !elNearestList || !elTableBody || !elCalDayList) return;

  var state = {
    tur: "all",
    ay: "",
    search: "",
    yayinevi: "",
    calYear: 2026,
    calMonth: 3,
    selectedKey: null,
    pageSize: 10,
    tablePage: 1,
  };

  function monthOptions() {
    var seen = {};
    var opts = [{ value: "", label: "Tüm aylar" }];
    for (var i = 0; i < exams.length; i++) {
      var d = parseIso(exams[i].tarih);
      var key = d.getFullYear() + "-" + pad(d.getMonth() + 1);
      if (seen[key]) continue;
      seen[key] = true;
      opts.push({ value: key, label: MONTHS_TR[d.getMonth()] + " " + d.getFullYear() });
    }
    opts.sort(function (a, b) {
      return a.value.localeCompare(b.value);
    });
    if (elAy) {
      var prevAy = state.ay;
      elAy.innerHTML = "";
      opts.forEach(function (o) {
        var opt = document.createElement("option");
        opt.value = o.value;
        opt.textContent = o.label;
        elAy.appendChild(opt);
      });
      if (prevAy) {
        var found = false;
        for (var j = 0; j < elAy.options.length; j++) {
          if (elAy.options[j].value === prevAy) {
            elAy.value = prevAy;
            found = true;
            break;
          }
        }
        if (!found) state.ay = "";
      }
    }
  }

  function passesTur(r) {
    if (state.tur === "all") return true;
    return r.tur === state.tur;
  }

  function passesAy(r) {
    if (!state.ay) return true;
    var d = parseIso(r.tarih);
    var key = d.getFullYear() + "-" + pad(d.getMonth() + 1);
    return key === state.ay;
  }

  function passesSearch(r) {
    if (!state.search) return true;
    return r.ad.toLowerCase().indexOf(state.search.toLowerCase()) !== -1;
  }

  function passesYayinevi(r) {
    if (!state.yayinevi) return true;
    return (r.yayinevi || "") === state.yayinevi;
  }

  function typesOnDate(y, m, d) {
    var key = iso(y, m + 1, d);
    var types = [];
    var seen = {};
    exams.forEach(function (r) {
      if (r.tarih !== key) return;
      if (!passesTur(r)) return;
      if (!seen[r.tur]) {
        seen[r.tur] = true;
        types.push(r.tur);
      }
    });
    var order = { TYT: 0, AYT: 1, YKS: 2, YDT: 3 };
    types.sort(function (a, b) {
      return (order[a] != null ? order[a] : 9) - (order[b] != null ? order[b] : 9);
    });
    return types;
  }

  function renderCalendar() {
    var y = state.calYear;
    var m = state.calMonth;
    if (elCalTitle) elCalTitle.textContent = MONTHS_TR[m] + " " + y;

    var first = new Date(y, m, 1);
    var startPad = (first.getDay() + 6) % 7;
    var daysInMonth = new Date(y, m + 1, 0).getDate();
    var t0 = todayIso();

    elCalGrid.innerHTML = "";
    DAYS_TR.forEach(function (lab) {
      var h = document.createElement("div");
      h.className = "dgt-cal__dow";
      h.textContent = lab;
      elCalGrid.appendChild(h);
    });

    var prevMonthDays = new Date(y, m, 0).getDate();
    for (var i = 0; i < startPad; i++) {
      var dom = prevMonthDays - startPad + i + 1;
      var cell = document.createElement("button");
      cell.type = "button";
      cell.className = "dgt-cal__cell dgt-cal__cell--outside";
      cell.disabled = true;
      cell.innerHTML = '<span class="dgt-cal__num">' + dom + '</span><span class="dgt-cal__dots"></span>';
      elCalGrid.appendChild(cell);
    }

    for (var d = 1; d <= daysInMonth; d++) {
      var key = iso(y, m + 1, d);
      var types = typesOnDate(y, m, d);
      var cell = document.createElement("button");
      cell.type = "button";
      cell.className = "dgt-cal__cell";
      cell.innerHTML = '<span class="dgt-cal__num">' + d + '</span><span class="dgt-cal__dots"></span>';
      var dots = cell.querySelector(".dgt-cal__dots");
      types.forEach(function (t) {
        var dot = document.createElement("span");
        dot.className = dotClass(t);
        dot.setAttribute("aria-hidden", "true");
        dots.appendChild(dot);
      });
      if (types.length) {
        cell.classList.add("dgt-cal__cell--has-exam");
        var line = document.createElement("span");
        line.className = "dgt-cal__underline";
        line.setAttribute("aria-hidden", "true");
        cell.appendChild(line);
      }
      if (state.selectedKey === key) cell.classList.add("dgt-cal__cell--selected");
      if (key === t0) cell.classList.add("dgt-cal__cell--today");
      cell.addEventListener(
        "click",
        (function (k) {
          return function () {
            state.selectedKey = state.selectedKey === k ? null : k;
            renderCalDayList();
            renderCalendar();
          };
        })(key)
      );
      elCalGrid.appendChild(cell);
    }

    var used = startPad + daysInMonth;
    var rem = used % 7 === 0 ? 0 : 7 - (used % 7);
    for (var j = 1; j <= rem; j++) {
      var cell2 = document.createElement("button");
      cell2.type = "button";
      cell2.className = "dgt-cal__cell dgt-cal__cell--outside";
      cell2.disabled = true;
      cell2.innerHTML = '<span class="dgt-cal__num">' + j + '</span><span class="dgt-cal__dots"></span>';
      elCalGrid.appendChild(cell2);
    }
  }

  function updatePanelHeader() {
    if (!elPanelTitle || !elPanelSub) return;
    elPanelTitle.textContent = "Yaklaşan denemeler";
    if (DGT_READONLY) {
      elPanelSub.textContent =
        "Koç paneliyle aynı veri; burada yalnızca görüntüleme modundasınız. Yaklaşan sınavlar filtrelerle daraltılabilir.";
      return;
    }
    elPanelSub.textContent =
      "Bugünden sonraki sınavlar (ay ve tür filtresi uygulanır). Takvim altında seçtiğiniz günün özeti ayrı listelenir.";
  }

  function buildTableList() {
    var t0 = todayIso();
    var list = exams.filter(function (r) {
      return r.tarih >= t0 && passesTur(r) && passesAy(r) && passesSearch(r) && passesYayinevi(r);
    });
    sortExams(list);
    return list;
  }

  function populateYayinevi() {
    if (!elYayinevi) return;
    var seen = {};
    var publishers = [];
    for (var i = 0; i < exams.length; i++) {
      var py = exams[i].yayinevi || "";
      if (py && !seen[py]) {
        seen[py] = true;
        publishers.push(py);
      }
    }
    publishers.sort();
    var prevVal = elYayinevi.value;
    elYayinevi.innerHTML = '<option value="">Tümü</option>';
    publishers.forEach(function (p) {
      var opt = document.createElement("option");
      opt.value = p;
      opt.textContent = p;
      elYayinevi.appendChild(opt);
    });
    if (prevVal && publishers.indexOf(prevVal) !== -1) {
      elYayinevi.value = prevVal;
    }
  }

  function updateFilterCount(total) {
    if (!elFilterCount) return;
    elFilterCount.textContent = total + " deneme";
  }

  /* Sınav türü segment butonları ile dropdown'ı senkronize tutar */
  function syncTurControls(tur) {
    if (elTur) {
      elTur.querySelectorAll("[data-dgt-tur]").forEach(function (b) {
        b.classList.toggle("dgt-segment__btn--active", b.getAttribute("data-dgt-tur") === tur);
      });
    }
    if (elTurSelect && elTurSelect.value !== tur) {
      elTurSelect.value = tur;
    }
  }

  function buildCalDayPickList() {
    if (!state.selectedKey) return [];
    return exams
      .filter(function (r) {
        return r.tarih === state.selectedKey && passesTur(r);
      })
      .sort(function (a, b) {
        return (a.saat || "").localeCompare(b.saat || "");
      });
  }

  function renderCalDayList() {
    if (!elCalDayList) return;
    if (elClearDay) elClearDay.hidden = !state.selectedKey;
    if (elCalDayHint) elCalDayHint.hidden = !!state.selectedKey;
    if (!state.selectedKey) {
      if (elCalDayTitle) elCalDayTitle.textContent = "Seçilen günün denemeleri";
      elCalDayList.hidden = true;
      elCalDayList.innerHTML = "";
      return;
    }
    elCalDayList.hidden = false;
    if (elCalDayTitle) elCalDayTitle.textContent = formatTrDate(state.selectedKey);
    var pick = buildCalDayPickList();
    elCalDayList.innerHTML = "";
    if (!pick.length) {
      var p = document.createElement("p");
      p.className = "dgt-cal-day-empty";
      p.textContent = "Bu tarihte deneme yok (veya tür filtresi dışında).";
      elCalDayList.appendChild(p);
      return;
    }
    pick.forEach(function (r) {
      var rel = daysFromToday(r.tarih);
      var art = document.createElement("article");
      art.className = "dgt-cal-day-item";
      art.setAttribute("role", "listitem");
      art.innerHTML =
        '<div class="dgt-cal-day-item__top">' +
        '<h4 class="dgt-cal-day-item__name">' +
        escapeHtml(r.ad) +
        '</h4><span class="' +
        badgeClass(r.tur) +
        '">' +
        escapeHtml(r.tur) +
        "</span></div>" +
        '<div class="dgt-cal-day-item__when">' +
        escapeHtml((r.saat || "—") + " · " + (r.yayinevi || "—")) +
        '</div><div class="dgt-cal-day-item__rel">' +
        escapeHtml(relativeDayLabel(rel)) +
        "</div>";
      elCalDayList.appendChild(art);
    });
  }

  function buildNearestFive() {
    var t0 = todayIso();
    return exams
      .filter(function (r) {
        return passesTur(r) && r.tarih >= t0;
      })
      .sort(function (a, b) {
        return a.tarih.localeCompare(b.tarih) || (a.saat || "").localeCompare(b.saat || "");
      })
      .slice(0, 5);
  }

  function renderNearest() {
    elNearestList.innerHTML = "";
    var list = buildNearestFive();
    if (!list.length) {
      var p = document.createElement("p");
      p.className = "dgt-nearest-empty";
      p.textContent = exams.length ? "Önümüzdeki tarihlerde sınav yok (veya tür filtresi dışında)." : EMPTY_LIVE_MSG;
      elNearestList.appendChild(p);
      return;
    }
    list.forEach(function (r) {
      var rel = daysFromToday(r.tarih);
      var art = document.createElement("article");
      art.className = "dgt-nearest-item";
      art.setAttribute("role", "listitem");
      art.innerHTML =
        '<div class="dgt-nearest-item__top">' +
        '<h3 class="dgt-nearest-item__name">' +
        escapeHtml(r.ad) +
        '</h3><span class="' +
        badgeClass(r.tur) +
        '">' +
        escapeHtml(r.tur) +
        '</span></div><div class="dgt-nearest-item__when">' +
        escapeHtml(formatTrDate(r.tarih) + " · " + (r.saat || "—")) +
        '</div><div class="dgt-nearest-item__rel">' +
        escapeHtml(relativeDayLabel(rel)) +
        "</div>";
      elNearestList.appendChild(art);
    });
  }

  function clampTablePage(total) {
    var pages = Math.max(1, Math.ceil(total / state.pageSize));
    if (state.tablePage > pages) state.tablePage = pages;
    if (state.tablePage < 1) state.tablePage = 1;
  }

  function syncPaginationControls(total) {
    var pages = Math.max(1, Math.ceil(total / state.pageSize));
    if (elPagePrev) elPagePrev.disabled = state.tablePage <= 1 || total === 0;
    if (elPageNext) elPageNext.disabled = state.tablePage >= pages || total === 0;
  }

  function updateTablePaginationMeta(total, fromN, toN) {
    if (!elPageMeta) return;
    if (!total) {
      elPageMeta.textContent = "Kayıt yok";
      return;
    }
    var pages = Math.max(1, Math.ceil(total / state.pageSize));
    elPageMeta.textContent =
      fromN + "–" + toN + " / " + total + " kayıt · Sayfa " + state.tablePage + " / " + pages;
  }

  function renderExamTable(animate) {
    var all = buildTableList();
    updateFilterCount(all.length);
    clampTablePage(all.length);
    var size = state.pageSize;
    var total = all.length;
    var start = (state.tablePage - 1) * size;
    var list = all.slice(start, start + size);
    var fromN = total ? start + 1 : 0;
    var toN = total ? Math.min(start + size, total) : 0;
    updateTablePaginationMeta(total, fromN, toN);
    syncPaginationControls(total);

    var inject = function () {
      elTableBody.innerHTML = "";
      if (!total) {
        var tr = document.createElement("tr");
        var td = document.createElement("td");
        td.colSpan = DGT_READONLY ? 5 : 6;
        td.className = "dgt-panel-empty";
        td.style.border = "none";
        td.textContent = exams.length ? "Tabloda gösterilecek yaklaşan sınav yok." : EMPTY_LIVE_MSG;
        tr.appendChild(td);
        elTableBody.appendChild(tr);
        return;
      }
      list.forEach(function (r) {
        var tr = document.createElement("tr");
        if (DGT_READONLY) {
          tr.innerHTML =
            '<td class="dgt-exam-table__name"><span class="dgt-exam-name" title="' +
            escapeHtml(r.ad) +
            '">' +
            escapeHtml(r.ad) +
            "</span></td><td>" +
            escapeHtml(formatTrDate(r.tarih)) +
            "</td><td>" +
            escapeHtml(r.saat || "—") +
            '</td><td><span class="' +
            badgeClass(r.tur || r.sinav || "TYT") +
            '">' +
            escapeHtml(r.tur || r.sinav || "TYT") +
            "</span></td><td>" +
            escapeHtml(r.yayinevi || "—") +
            "</td>";
        } else {
          tr.innerHTML =
            '<td class="dgt-exam-table__name"><span class="dgt-exam-name" title="' +
            escapeHtml(r.ad) +
            '">' +
            escapeHtml(r.ad) +
            "</span></td><td>" +
            escapeHtml(formatTrDate(r.tarih)) +
            "</td><td>" +
            escapeHtml(r.saat || "—") +
            '</td><td><span class="' +
            badgeClass(r.tur || r.sinav || "TYT") +
            '">' +
            escapeHtml(r.tur || r.sinav || "TYT") +
            "</span></td><td>" +
            escapeHtml(r.yayinevi || "—") +
            '</td><td class="dgt-exam-table__actions"><div class="dgt-row-actions">' +
            '<button type="button" class="dgt-icon-btn dgt-icon-btn--primary" data-dgt-act="edit" data-dgt-id="' +
            escapeHtml(r.id) +
            '" aria-label="Düzenle">' +
            ICON_EDIT +
            "</button>" +
            '<button type="button" class="dgt-icon-btn dgt-icon-btn--muted" data-dgt-act="detail" data-dgt-id="' +
            escapeHtml(r.id) +
            '" aria-label="Detay">' +
            ICON_DETAIL +
            "</button>" +
            '<button type="button" class="dgt-icon-btn dgt-icon-btn--danger" data-dgt-act="delete" data-dgt-id="' +
            escapeHtml(r.id) +
            '" aria-label="Sil">' +
            ICON_DELETE +
            "</button></div></td>";
        }
        elTableBody.appendChild(tr);
      });
    };

    if (animate) {
      elTableBody.style.opacity = "0.55";
      window.setTimeout(function () {
        inject();
        window.requestAnimationFrame(function () {
          elTableBody.style.opacity = "1";
        });
      }, 120);
    } else {
      inject();
    }
  }

  function refreshViews() {
    renderCalendar();
    renderNearest();
    renderExamTable(false);
    updatePanelHeader();
    renderCalDayList();
  }

  function findExam(id) {
    for (var i = 0; i < exams.length; i++) {
      if (exams[i].id === id) return exams[i];
    }
    return null;
  }

  function closeGlobalWizardModal() {
    if (window.GlobalDenemeWizard && window.GlobalDenemeWizard.setModal) {
      window.GlobalDenemeWizard.setModal(false);
    } else {
      var elModal = document.getElementById("kdy-modal-overlay");
      if (elModal) {
        elModal.classList.remove("is-open");
        elModal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
      }
    }
  }

  function bindTableActions() {
    if (DGT_READONLY) return;
    elTableBody.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-dgt-act]");
      if (!btn || !elTableBody.contains(btn)) return;
      var id = btn.getAttribute("data-dgt-id");
      var act = btn.getAttribute("data-dgt-act");
      var r = id ? findExam(id) : null;
      if (!r) return;
      if (act === "delete") {
        if (!window.confirm("Bu denemeyi listeden kaldırmak istiyor musunuz?")) return;
        exams = exams.filter(function (x) {
          return x.id !== id;
        });
        persistExamsToStorage();
        monthOptions();
        refreshViews();
        return;
      }
      if (act === "detail") {
        window.alert(
          r.ad + "\n" + formatTrDate(r.tarih) + " · " + (r.saat || "—") + "\nTür: " + r.tur + "\nYayınevi: " + (r.yayinevi || "—")
        );
        return;
      }
      if (act === "edit") {
        if (window.GlobalDenemeWizard && window.GlobalDenemeWizard.openExamModal) {
          window.GlobalDenemeWizard.openExamModal(id, "1");
        }
      }
    });
  }

  function bind() {
    loadExamsFromStorage();
    window.__denemeGlobalUISync = function () {
      loadExamsFromStorage();
      monthOptions();
      populateYayinevi();
      refreshViews();
    };
    monthOptions();
    populateYayinevi();

    if (elSearch) {
      elSearch.addEventListener("input", function () {
        state.search = elSearch.value.trim();
        state.tablePage = 1;
        renderExamTable(true);
      });
    }

    if (elTurSelect) {
      elTurSelect.addEventListener("change", function () {
        state.tur = elTurSelect.value || "all";
        state.tablePage = 1;
        syncTurControls(state.tur);
        refreshViews();
      });
    }

    if (elYayinevi) {
      elYayinevi.addEventListener("change", function () {
        state.yayinevi = elYayinevi.value;
        state.tablePage = 1;
        renderExamTable(true);
      });
    }

    if (elTur) {
      elTur.querySelectorAll("[data-dgt-tur]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          state.tur = btn.getAttribute("data-dgt-tur") || "all";
          state.tablePage = 1;
          syncTurControls(state.tur);
          refreshViews();
        });
      });
    }
    if (elAy) {
      elAy.addEventListener("change", function () {
        state.ay = elAy.value;
        state.tablePage = 1;
        renderExamTable(true);
        renderCalDayList();
      });
    }
    if (elCalPrev) {
      elCalPrev.addEventListener("click", function () {
        if (state.calMonth === 0) {
          state.calMonth = 11;
          state.calYear--;
        } else state.calMonth--;
        renderCalendar();
      });
    }
    if (elCalNext) {
      elCalNext.addEventListener("click", function () {
        if (state.calMonth === 11) {
          state.calMonth = 0;
          state.calYear++;
        } else state.calMonth++;
        renderCalendar();
      });
    }
    if (elClearDay) {
      elClearDay.addEventListener("click", function () {
        state.selectedKey = null;
        renderCalDayList();
        renderCalendar();
      });
    }

    if (elPageSize) {
      elPageSize.value = String(state.pageSize);
      elPageSize.addEventListener("change", function () {
        var n = parseInt(elPageSize.value, 10);
        state.pageSize = n === 20 || n === 50 ? n : 10;
        state.tablePage = 1;
        renderExamTable(true);
      });
    }
    if (elPagePrev) {
      elPagePrev.addEventListener("click", function () {
        if (state.tablePage > 1) {
          state.tablePage--;
          renderExamTable(true);
        }
      });
    }
    if (elPageNext) {
      elPageNext.addEventListener("click", function () {
        var all = buildTableList();
        var pages = Math.max(1, Math.ceil(all.length / state.pageSize));
        if (state.tablePage < pages) {
          state.tablePage++;
          renderExamTable(true);
        }
      });
    }
    function closeModalWithoutPersist() {
      closeGlobalWizardModal();
      refreshViews();
    }
    if (elModalCancel) elModalCancel.addEventListener("click", closeModalWithoutPersist);
    if (elModalCloseX) elModalCloseX.addEventListener("click", closeModalWithoutPersist);
    var elModalOv = document.getElementById("kdy-modal-overlay");
    if (elModalOv) {
      elModalOv.addEventListener("click", function (e) {
        if (e.target === elModalOv) closeModalWithoutPersist();
      });
    }
    document.addEventListener("keydown", function (e) {
      var mo = document.getElementById("kdy-modal-overlay");
      if (e.key === "Escape" && mo && mo.classList.contains("is-open")) closeModalWithoutPersist();
    });
    window.addEventListener("globalDenemeler:updated", function () {
      loadExamsFromStorage();
      monthOptions();
      populateYayinevi();
      refreshViews();
    });
    window.addEventListener("storage", function (e) {
      if (e.key === LIVE_LS_KEY) {
        loadExamsFromStorage();
        monthOptions();
        populateYayinevi();
        refreshViews();
      }
    });

    bindTableActions();

    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) {
        renderNearest();
        renderExamTable(false);
        renderCalDayList();
      }
    });
    window.setInterval(function () {
      renderNearest();
      renderExamTable(false);
      renderCalDayList();
    }, 60000);
  }

  bind();
  updatePanelHeader();
  renderCalendar();
  renderNearest();
  renderCalDayList();
  renderExamTable(false);
})();
