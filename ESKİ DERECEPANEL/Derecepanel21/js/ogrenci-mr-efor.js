(function () {
  "use strict";
  var C = window.OgrenciMrCore;
  var barChart = null;
  var wired = false;

  var DOW_TR = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

  function parseEffortDate(at) {
    var s = String(at || "");
    var p = s.split(" ")[0];
    if (!p || p.length < 10) return null;
    return p;
  }

  /** Grafik için: at veya tarih alanı */
  function effortRowDateKey(r) {
    if (!r) return null;
    var fromAt = parseEffortDate(r.at);
    if (fromAt) return fromAt;
    var t = String(r.tarih || "").trim();
    if (t.length >= 10) return t.slice(0, 10);
    return null;
  }

  function last7DayKeys() {
    var out = [];
    var d = new Date();
    for (var i = 6; i >= 0; i--) {
      var x = new Date(d.getFullYear(), d.getMonth(), d.getDate() - i);
      out.push(
        x.getFullYear() +
          "-" +
          C.pad2(x.getMonth() + 1) +
          "-" +
          C.pad2(x.getDate())
      );
    }
    return out;
  }

  function categoryLabelForIso(iso) {
    var p = iso.split("-");
    if (p.length < 3) return iso;
    var y = parseInt(p[0], 10);
    var m = parseInt(p[1], 10) - 1;
    var day = parseInt(p[2], 10);
    var dt = new Date(y, m, day);
    var w = DOW_TR[dt.getDay()];
    return w + " " + p[2] + "." + p[1];
  }

  function buildDailySums(primary) {
    var keys = last7DayKeys();
    var sums = {};
    keys.forEach(function (k) {
      sums[k] = 0;
    });
    C.readEffortLog(primary).forEach(function (r) {
      var dk = effortRowDateKey(r);
      if (!dk || sums[dk] == null) return;
      var n = parseInt(String(r.soru != null ? r.soru : 0), 10);
      if (!isNaN(n) && n > 0) sums[dk] += n;
    });
    return keys.map(function (k) {
      return sums[k];
    });
  }

  function setSkel(on) {
    var skel = document.getElementById("og-ef-bar-skel");
    if (!skel) return;
    if (on) skel.classList.add("is-on");
    else skel.classList.remove("is-on");
  }

  function setChartEmpty(on) {
    var el = document.getElementById("og-ef-empty-chart");
    if (!el) return;
    if (on) el.classList.add("is-on");
    else el.classList.remove("is-on");
  }

  function renderBarChart(primary) {
    var el = document.getElementById("og-ef-bar");
    if (!el || typeof ApexCharts === "undefined") return;
    if (barChart) {
      try {
        barChart.destroy();
      } catch (e) {}
      barChart = null;
    }
    el.innerHTML = "";

    var logs = C.readEffortLog(primary);
    if (!logs.length) {
      setSkel(false);
      setChartEmpty(true);
      C.notifyParentResize();
      return;
    }

    setChartEmpty(false);
    setSkel(true);

    var cats = last7DayKeys().map(categoryLabelForIso);
    var data = buildDailySums(primary);

    barChart = new ApexCharts(el, {
      chart: {
        type: "bar",
        height: 300,
        toolbar: { show: false },
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        animations: { enabled: true, easing: "easeinout", speed: 480 },
        events: {
          mounted: function () {
            setSkel(false);
            C.notifyParentResize();
          },
        },
      },
      series: [{ name: "Çözülen soru", data: data }],
      xaxis: {
        categories: cats,
        labels: { style: { fontSize: "11px", fontWeight: 700, colors: "#475569" } },
      },
      yaxis: {
        labels: { formatter: function (v) { return Math.round(v); } },
        min: 0,
      },
      colors: ["#4f46e5"],
      plotOptions: {
        bar: {
          borderRadius: 10,
          columnWidth: "56%",
          dataLabels: { position: "top" },
        },
      },
      dataLabels: {
        enabled: true,
        offsetY: -18,
        style: { fontSize: "11px", fontWeight: 800, colors: ["#312e81"] },
        formatter: function (v) {
          return v > 0 ? Math.round(v) : "";
        },
      },
      grid: { strokeDashArray: 4, borderColor: "#e2e8f0" },
      tooltip: {
        theme: "light",
        y: { formatter: function (v) { return Math.round(v) + " soru"; } },
      },
    });
    barChart.render();
  }

  function fillDersFromMufredat() {
    var sel = document.getElementById("og-ef-ders");
    if (!sel) return;
    var prev = sel.value;
    var api = window.YksMufredatApi;
    sel.innerHTML = "";
    if (!api || typeof api.getSubjects !== "function") {
      C.fillLessonSelect("og-ef-ders");
      Array.prototype.forEach.call(sel.querySelectorAll("option"), function (opt) {
        if (String(opt.value) === "Diğer") {
          opt.value = "__diger__";
          opt.textContent = "Diğer…";
        }
      });
      return;
    }
    var subs = api.getSubjects().slice();
    subs.sort(function (a, b) {
      if ((a.sinav || "") !== (b.sinav || "")) return (a.sinav || "") === "TYT" ? -1 : 1;
      return String(a.name || "").localeCompare(String(b.name || ""), "tr");
    });
    subs.forEach(function (s) {
      var o = document.createElement("option");
      o.value = s.id;
      o.textContent = s.name;
      sel.appendChild(o);
    });
    var oD = document.createElement("option");
    oD.value = "__diger__";
    oD.textContent = "Diğer…";
    sel.appendChild(oD);
    if (prev && Array.prototype.some.call(sel.options, function (opt) { return opt.value === prev; })) {
      sel.value = prev;
    }
  }

  function syncKonuFieldsVisibility(isDiger) {
    var selKonu = document.getElementById("eforKonu");
    var serbest = document.getElementById("efor-konu-serbest");
    if (!selKonu || !serbest) return;
    if (isDiger) {
      selKonu.hidden = true;
      selKonu.disabled = true;
      serbest.hidden = false;
      serbest.disabled = false;
    } else {
      selKonu.hidden = false;
      selKonu.disabled = false;
      serbest.hidden = true;
      serbest.disabled = true;
      serbest.value = "";
    }
  }

  function fillKonuForSubjectId(subjectId) {
    var sel = document.getElementById("eforKonu");
    if (!sel) return;
    var prev = sel.value;
    sel.innerHTML = "";
    var ph = document.createElement("option");
    ph.value = "";
    ph.textContent = "Konu seçin…";
    sel.appendChild(ph);
    if (subjectId === "__diger__") {
      syncKonuFieldsVisibility(true);
      return;
    }
    syncKonuFieldsVisibility(false);
    if (!subjectId) return;
    var api = window.YksMufredatApi;
    if (!api || typeof api.getTopics !== "function") return;
    var topics = api.getTopics(subjectId) || [];
    topics.forEach(function (t) {
      var o = document.createElement("option");
      o.value = t.name || t.id;
      o.textContent = t.name || t.id;
      if (t.id) o.setAttribute("data-topic-id", t.id);
      sel.appendChild(o);
    });
    for (var i = 0; i < sel.options.length; i++) {
      if (sel.options[i].value === prev) {
        sel.value = prev;
        break;
      }
    }
  }

  function fillKitapDropdown(u) {
    var sel = document.getElementById("eforKitap");
    if (!sel) return;
    var prev = sel.value;
    sel.innerHTML = "";
    var o0 = document.createElement("option");
    o0.value = "";
    o0.textContent = "Kaynak seçin…";
    sel.appendChild(o0);
    var oOwn = document.createElement("option");
    oOwn.value = "__own__";
    oOwn.textContent = "Okul kitabı / Kendi kaynağım";
    sel.appendChild(oOwn);

    var store = window.DereceLibraryStore;
    var titles = [];
    var seen = Object.create(null);
    function addTitle(t) {
      t = String(t || "").trim();
      if (!t || seen[t]) return;
      seen[t] = true;
      titles.push(t);
    }
    if (store && typeof store.getAssignments === "function" && typeof store.getBookById === "function") {
      var idSet = {};
      (typeof C.aliasStudentIds === "function" ? C.aliasStudentIds(u) : []).forEach(function (x) {
        idSet[String(x || "").trim()] = true;
      });
      store.getAssignments().forEach(function (a) {
        if (!a || !a.bookId) return;
        var sid = String(a.studentId || "").trim();
        if (!sid || !idSet[sid]) return;
        var book = store.getBookById(a.bookId);
        var base = book && book.title ? String(book.title).trim() : "Kitap";
        var note = a.note ? String(a.note).trim() : "";
        addTitle(note ? base + " — " + note : base);
      });
    }
    titles.sort(function (a, b) {
      return a.localeCompare(b, "tr");
    });
    titles.forEach(function (t) {
      var o = document.createElement("option");
      o.value = t;
      o.textContent = t;
      sel.appendChild(o);
    });
    for (var k = 0; k < sel.options.length; k++) {
      if (sel.options[k].value === prev) {
        sel.value = prev;
        break;
      }
    }
  }

  function tableDateCell(r) {
    var raw = r.at || r.tarih || "—";
    return C.escapeHtml(String(raw));
  }

  function kitapDisplayCell(r) {
    var k = String(r.kitap != null ? r.kitap : "").trim();
    if (!k) return "—";
    return C.escapeHtml(k);
  }

  function dersKonuCellHtml(r) {
    var ders = String(r.ders || "—").trim();
    var konu = String(r.konu || "").trim();
    var kav = String(r.kavram || "").trim();
    var sub = [];
    if (konu) sub.push(konu);
    if (kav) sub.push(kav);
    var subLine = sub.join(" — ");
    return (
      '<span class="font-bold">' +
      C.escapeHtml(ders || "—") +
      "</span><br>" +
      '<span class="text-xs text-slate-500">' +
      (subLine ? C.escapeHtml(subLine) : "—") +
      "</span>"
    );
  }

  function renderEffortTable(primary) {
    var tbody = document.getElementById("og-ef-tbody");
    if (!tbody) return;
    var rows = C.readEffortLog(primary).slice().reverse();
    tbody.innerHTML = "";
    if (!rows.length) {
      tbody.innerHTML =
        '<tr class="og-ef-tr"><td colspan="6" class="og-ef-td og-ef-table-empty">' +
        '<div class="og-empty" style="display:flex">' +
        '<div class="og-empty__icon" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>' +
        '<path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/>' +
        "</svg></div>" +
        '<p class="og-empty__title">Henüz analiz edilecek veri bulunamadı</p>' +
        "</div></td></tr>";
      C.notifyParentResize();
      return;
    }
    rows.forEach(function (r) {
      var tr = document.createElement("tr");
      tr.className = "og-ef-tr";
      tr.innerHTML =
        '<td class="og-ef-td">' +
        tableDateCell(r) +
        "</td>" +
        '<td class="og-ef-td">' +
        dersKonuCellHtml(r) +
        "</td>" +
        '<td class="og-ef-td">' +
        kitapDisplayCell(r) +
        "</td>" +
        '<td class="og-ef-td og-ef-td--num">' +
        C.escapeHtml(r.soru != null ? String(r.soru) : "—") +
        "</td>" +
        '<td class="og-ef-td og-ef-td--num">' +
        C.escapeHtml(r.dk != null ? String(r.dk) : "—") +
        "</td>" +
        '<td class="og-ef-td og-ef-td--act">' +
        '<button type="button" class="og-ef-iconbtn" data-id="' +
        C.escapeHtml(r.id) +
        '" title="Sil" aria-label="Sil">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6"/></svg>' +
        "</button></td>";
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll(".og-ef-iconbtn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-id");
        if (!id || !confirm("Bu efor kaydını silmek istiyor musunuz?")) return;
        var list = C.readEffortLog(primary).filter(function (x) {
          return x && String(x.id) !== String(id);
        });
        C.writeEffortLog(primary, list);
        C.touchMrDataStudent(primary);
        renderEffortTable(primary);
        renderBarChart(primary);
        C.notifyParentResize();
      });
    });
    C.notifyParentResize();
  }

  function wireForm(primary, u) {
    var form = document.getElementById("og-ef-form");
    var sel = document.getElementById("og-ef-ders");
    var other = document.getElementById("og-ef-ders-diger");
    if (!form || !sel) return;
    sel.addEventListener("change", function () {
      if (sel.value === "__diger__") {
        other.hidden = false;
        other.required = true;
        fillKonuForSubjectId("__diger__");
      } else {
        other.hidden = true;
        other.required = false;
        other.value = "";
        fillKonuForSubjectId(sel.value);
      }
    });
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var api = window.YksMufredatApi;
      var ders = "";
      if (sel.value === "__diger__") {
        ders = String(other.value || "").trim();
      } else if (api && typeof api.getSubject === "function") {
        var sub = api.getSubject(sel.value);
        ders = sub && sub.name ? String(sub.name).trim() : sel.value;
      } else {
        ders = String(sel.value || "").trim();
      }
      var konuEl = document.getElementById("eforKonu");
      var konuSerbest = document.getElementById("efor-konu-serbest");
      var kavramEl = document.getElementById("eforKavram");
      var kitapEl = document.getElementById("eforKitap");
      var konu =
        sel.value === "__diger__"
          ? konuSerbest && konuSerbest.value
            ? String(konuSerbest.value).trim()
            : ""
          : konuEl && konuEl.value
            ? String(konuEl.value).trim()
            : "";
      var kavram = kavramEl && kavramEl.value ? String(kavramEl.value).trim() : "";
      var kitRaw = kitapEl && kitapEl.value ? String(kitapEl.value).trim() : "";
      var kitap = kitRaw === "__own__" ? "Okul Kitabı / Kendi Kaynağım" : kitRaw;
      var soru = parseInt(String(document.getElementById("og-ef-soru").value || ""), 10);
      var dk = parseInt(String(document.getElementById("og-ef-dk").value || ""), 10);
      if (!ders) {
        alert("Ders seçin veya «Diğer…» için ders adını yazın.");
        return;
      }
      if (sel.value === "__diger__" && !konu) {
        alert("Diğer ders için konu adını yazın.");
        return;
      }
      if (sel.value !== "__diger__" && !konu) {
        alert("Müfredattan bir konu seçin.");
        return;
      }
      if (isNaN(soru) || soru < 0) {
        alert("Geçerli bir soru sayısı girin.");
        return;
      }
      if (isNaN(dk) || dk < 0) {
        alert("Geçerli bir süre (dakika) girin.");
        return;
      }
      var nowFull = C.formatNow();
      var tarih = nowFull.split(" ")[0];
      var list = C.readEffortLog(primary);
      list.push({
        id: "eff-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
        at: nowFull,
        tarih: tarih,
        ders: ders,
        konu: konu,
        kavram: kavram,
        kitap: kitap,
        soru: soru,
        dk: dk,
      });
      C.writeEffortLog(primary, list);
      C.touchMrDataStudent(primary);
      form.reset();
      other.hidden = true;
      other.required = false;
      fillDersFromMufredat();
      if (sel.options.length) sel.selectedIndex = 0;
      fillKonuForSubjectId(sel.value || "");
      fillKitapDropdown(u);
      renderEffortTable(primary);
      renderBarChart(primary);
    });
  }

  function boot() {
    if (!C) return;
    var u = C.getCurrentUser();
    if (!u) {
      window.location.replace("../login.html");
      return;
    }
    var primary = C.canonicalStudentId(u);
    if (!primary) {
      window.location.replace("../login.html");
      return;
    }

    function initUi() {
      fillDersFromMufredat();
      var selDers = document.getElementById("og-ef-ders");
      if (selDers && selDers.value && selDers.value !== "__diger__") fillKonuForSubjectId(selDers.value);
      else if (selDers && selDers.value === "__diger__") fillKonuForSubjectId("__diger__");
      else if (selDers && selDers.options.length) {
        selDers.selectedIndex = 0;
        fillKonuForSubjectId(selDers.value);
      }
      fillKitapDropdown(u);
      renderEffortTable(primary);
      renderBarChart(primary);
      wireForm(primary, u);
    }

    var tries = 0;
    function waitMufredat() {
      if (window.YksMufredatApi || tries >= 120) {
        initUi();
        return;
      }
      tries += 1;
      setTimeout(waitMufredat, 35);
    }

    waitMufredat();

    if (!wired) {
      wired = true;
      window.addEventListener("storage", function (e) {
        var u2 = C.getCurrentUser();
        if (!u2) return;
        var p2 = C.canonicalStudentId(u2);
        if (e && e.key === C.effortLogKey(p2)) {
          renderEffortTable(p2);
          renderBarChart(p2);
        }
        if (
          e &&
          e.key &&
          (e.key.indexOf("assigned_fascicles_") === 0 ||
            e.key === "derecepanel.library.assignments.v1" ||
            e.key === "derecepanel.library.books.v1")
        ) {
          fillKitapDropdown(u2);
        }
      });
      window.addEventListener("load", function () {
        setTimeout(C.notifyParentResize, 200);
        setTimeout(C.notifyParentResize, 700);
      });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
