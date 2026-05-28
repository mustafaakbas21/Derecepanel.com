/**
 * Global Deneme Takvimi — merkezi liste + takvim + yaklaşan denemeler.
 * Varsayılan liste boştur; kayıtlar eklendikçe dolar.
 */
(function () {
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

  function statusMeta(tarihIso) {
    var t0 = todayIso();
    if (tarihIso < t0) return { label: "Bitti", cls: "gdt-badge gdt-badge--bitti" };
    if (tarihIso === t0) return { label: "Bugün", cls: "gdt-badge gdt-badge--bugun" };
    return { label: "Yaklaşıyor", cls: "gdt-badge gdt-badge--yaklasan" };
  }

  function tagClass(tur) {
    if (tur === "TYT") return "gdt-tag gdt-tag--tyt";
    if (tur === "AYT") return "gdt-tag gdt-tag--ayt";
    return "gdt-tag gdt-tag--yks";
  }

  var ALL = [];

  var tbody = document.getElementById("gdt-tbody");
  if (!tbody) return;

  var state = {
    tur: "all",
    ay: "",
    page: 1,
    pageSize: 10,
    calYear: 2026,
    calMonth: 3,
    selectedKey: null,
  };

  var elTur = document.getElementById("gdt-filter-tur");
  var elAy = document.getElementById("gdt-filter-ay");
  var elPageSize = document.getElementById("gdt-page-size");
  var elPageLabel = document.getElementById("gdt-page-label");
  var elPrev = document.getElementById("gdt-page-prev");
  var elNext = document.getElementById("gdt-page-next");
  var elCalTitle = document.getElementById("gdt-cal-title");
  var elCalGrid = document.getElementById("gdt-cal-grid");
  var elCalPrev = document.getElementById("gdt-cal-prev");
  var elCalNext = document.getElementById("gdt-cal-next");
  var elSelectedDay = document.getElementById("gdt-selected-day");
  var elClearDay = document.getElementById("gdt-clear-day");
  var elUpcoming = document.getElementById("gdt-upcoming");

  function monthOptions() {
    var seen = {};
    var opts = [{ value: "", label: "Tüm aylar" }];
    for (var i = 0; i < ALL.length; i++) {
      var d = parseIso(ALL[i].tarih);
      var key = d.getFullYear() + "-" + pad(d.getMonth() + 1);
      if (seen[key]) continue;
      seen[key] = true;
      opts.push({ value: key, label: MONTHS_TR[d.getMonth()] + " " + d.getFullYear() });
    }
    opts.sort(function (a, b) {
      return a.value.localeCompare(b.value);
    });
    if (elAy) {
      elAy.innerHTML = "";
      opts.forEach(function (o) {
        var opt = document.createElement("option");
        opt.value = o.value;
        opt.textContent = o.label;
        elAy.appendChild(opt);
      });
    }
  }

  function filtered() {
    return ALL.filter(function (r) {
      if (state.tur !== "all" && r.tur !== state.tur) return false;
      if (state.ay) {
        var d = parseIso(r.tarih);
        var key = d.getFullYear() + "-" + pad(d.getMonth() + 1);
        if (key !== state.ay) return false;
      }
      if (state.selectedKey && r.tarih !== state.selectedKey) return false;
      return true;
    });
  }

  function renderTable() {
    var list = filtered();
    var total = list.length;
    var pages = Math.max(1, Math.ceil(total / state.pageSize));
    if (state.page > pages) state.page = pages;
    var start = (state.page - 1) * state.pageSize;
    var slice = list.slice(start, start + state.pageSize);

    tbody.innerHTML = "";
    slice.forEach(function (r) {
      var st = statusMeta(r.tarih);
      var tr = document.createElement("tr");
      tr.innerHTML =
        '<td><div class="gdt-cell-name"><span class="gdt-name">' +
        escapeHtml(r.ad) +
        '</span><span class="' +
        tagClass(r.tur) +
        '">' +
        escapeHtml(r.tur) +
        "</span></div></td>" +
        "<td>" +
        escapeHtml(r.yayinevi) +
        "</td>" +
        "<td>" +
        formatTrDate(r.tarih) +
        "</td>" +
        "<td>" +
        escapeHtml(r.tur) +
        "</td>" +
        '<td><span class="' +
        st.cls +
        '">' +
        escapeHtml(st.label) +
        "</span></td>";
      tbody.appendChild(tr);
    });

    if (elPageLabel) {
      var end = Math.min(start + slice.length, total);
      elPageLabel.textContent =
        total === 0 ? "Kayıt yok" : start + 1 + "-" + end + " / " + total + " · Sayfa " + state.page + "/" + pages;
    }
    if (elPrev) elPrev.disabled = state.page <= 1;
    if (elNext) elNext.disabled = state.page >= pages;
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function renderCalendar() {
    if (!elCalGrid || !elCalTitle) return;
    var y = state.calYear;
    var m = state.calMonth;
    elCalTitle.textContent = MONTHS_TR[m] + " " + y;

    var first = new Date(y, m, 1);
    var startPad = (first.getDay() + 6) % 7;
    var daysInMonth = new Date(y, m + 1, 0).getDate();
    var map = {};
    ALL.forEach(function (r) {
      if (state.tur !== "all" && r.tur !== state.tur) return;
      var d = parseIso(r.tarih);
      if (d.getFullYear() === y && d.getMonth() === m) map[r.tarih] = true;
    });

    elCalGrid.innerHTML = "";
    DAYS_TR.forEach(function (lab) {
      var h = document.createElement("div");
      h.className = "gdt-cal__dow";
      h.textContent = lab;
      elCalGrid.appendChild(h);
    });

    var prevMonthDays = new Date(y, m, 0).getDate();
    for (var i = 0; i < startPad; i++) {
      var dom = prevMonthDays - startPad + i + 1;
      var cell = document.createElement("button");
      cell.type = "button";
      cell.className = "gdt-cal__cell gdt-cal__cell--muted";
      cell.textContent = String(dom);
      cell.disabled = true;
      elCalGrid.appendChild(cell);
    }

    for (var d = 1; d <= daysInMonth; d++) {
      var key = iso(y, m + 1, d);
      var cell = document.createElement("button");
      cell.type = "button";
      cell.className = "gdt-cal__cell";
      cell.textContent = String(d);
      if (map[key]) cell.classList.add("gdt-cal__cell--has-exam");
      if (state.selectedKey === key) cell.classList.add("gdt-cal__cell--selected");
      cell.addEventListener("click", function (k) {
        return function () {
          state.selectedKey = state.selectedKey === k ? null : k;
          state.page = 1;
          updateSelectedLabel();
          renderTable();
          renderCalendar();
          renderUpcoming();
        };
      }(key));
      elCalGrid.appendChild(cell);
    }

    var used = startPad + daysInMonth;
    var rem = used % 7 === 0 ? 0 : 7 - (used % 7);
    for (var j = 1; j <= rem; j++) {
      var cell2 = document.createElement("button");
      cell2.type = "button";
      cell2.className = "gdt-cal__cell gdt-cal__cell--muted";
      cell2.textContent = String(j);
      cell2.disabled = true;
      elCalGrid.appendChild(cell2);
    }
  }

  function updateSelectedLabel() {
    if (!elSelectedDay) return;
    elSelectedDay.textContent = state.selectedKey ? formatTrDate(state.selectedKey) : "—";
    if (elClearDay) elClearDay.hidden = !state.selectedKey;
  }

  function renderUpcoming() {
    if (!elUpcoming) return;
    var t0 = todayIso();
    var list = ALL.filter(function (r) {
      if (state.tur !== "all" && r.tur !== state.tur) return false;
      return r.tarih >= t0;
    })
      .sort(function (a, b) {
        return a.tarih.localeCompare(b.tarih);
      })
      .slice(0, 3);

    elUpcoming.innerHTML = "";
    if (!list.length) {
      elUpcoming.innerHTML = '<p class="gdt-upcoming__empty">Yaklaşan deneme bulunmuyor.</p>';
      return;
    }
    list.forEach(function (r) {
      var div = document.createElement("div");
      div.className = "gdt-upcoming__item";
      div.innerHTML =
        '<span class="gdt-upcoming__badge ' +
        (r.tur === "TYT" ? "gdt-upcoming__badge--tyt" : r.tur === "AYT" ? "gdt-upcoming__badge--ayt" : "gdt-upcoming__badge--yks") +
        '">' +
        escapeHtml(r.tur) +
        "</span>" +
        '<div class="gdt-upcoming__text">' +
        '<strong class="gdt-upcoming__title">' +
        escapeHtml(r.ad) +
        "</strong>" +
        '<span class="gdt-upcoming__meta">' +
        escapeHtml(r.yayinevi) +
        " · " +
        formatTrDate(r.tarih) +
        "</span></div>";
      elUpcoming.appendChild(div);
    });
  }

  function bind() {
    monthOptions();
    if (elTur) {
      elTur.querySelectorAll("[data-gdt-tur]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          state.tur = btn.getAttribute("data-gdt-tur") || "all";
          elTur.querySelectorAll("[data-gdt-tur]").forEach(function (b) {
            b.classList.toggle("gdt-segment__btn--active", b === btn);
          });
          state.page = 1;
          renderTable();
          renderCalendar();
          renderUpcoming();
        });
      });
    }
    if (elAy) {
      elAy.addEventListener("change", function () {
        state.ay = elAy.value;
        state.page = 1;
        renderTable();
        renderUpcoming();
      });
    }
    if (elPageSize) {
      elPageSize.addEventListener("change", function () {
        state.pageSize = parseInt(elPageSize.value, 10) || 10;
        state.page = 1;
        renderTable();
      });
    }
    if (elPrev)
      elPrev.addEventListener("click", function () {
        if (state.page > 1) {
          state.page--;
          renderTable();
        }
      });
    if (elNext)
      elNext.addEventListener("click", function () {
        state.page++;
        renderTable();
      });
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
        state.page = 1;
        updateSelectedLabel();
        renderTable();
        renderCalendar();
      });
    }
  }

  bind();
  updateSelectedLabel();
  renderTable();
  renderCalendar();
  renderUpcoming();
})();
