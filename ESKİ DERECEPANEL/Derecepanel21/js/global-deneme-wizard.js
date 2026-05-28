/**
 * Global deneme sihirbazı — kurum-deneme-takvimi.js ile aynı modal/matris akışı.
 * Veri: global_exams_live (canlı); global_denemeler_v1 + globalExams aynası olarak da yazılır.
 */
(function () {
  var LS_KEY = "global_denemeler_v1";
  var LIVE_KEY = "global_exams_live";

  var ICON_EDIT =
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
  var ICON_OPTIK =
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>';
  var ICON_DELETE =
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>';
  var ICON_CHECK =
    '<svg class="kdy-mat-bar__check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>';
  var ICON_KEBAB =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none"/></svg>';

  function qCount(sinav) {
    if (window.getExamLayout) {
      try {
        return window.getExamLayout(sinav).n;
      } catch (e) {}
    }
    if (sinav === "TYT") return 120;
    if (sinav === "AYT") return 160;
    if (sinav === "YDT") return 80;
    return 120;
  }

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function todayIso() {
    var t = new Date();
    return t.getFullYear() + "-" + pad(t.getMonth() + 1) + "-" + pad(t.getDate());
  }

  function loadStore() {
    try {
      var raw = localStorage.getItem(LIVE_KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr.map(function (x) {
        var o = Object.assign({}, x);
        var s = o.sinav || o.tur || "TYT";
        o.sinav = s;
        o.tur = s;
        return o;
      });
    } catch (e) {
      return [];
    }
  }

  function saveStore(list) {
    var norm = list.map(function (x) {
      var o = Object.assign({}, x);
      var s = o.sinav || o.tur || "TYT";
      o.sinav = s;
      o.tur = s;
      o.name = o.name || o.ad;
      if (o.yayinevi == null || o.yayinevi === "") o.yayinevi = "—";
      return o;
    });
    localStorage.setItem(LIVE_KEY, JSON.stringify(norm));
    localStorage.setItem(LS_KEY, JSON.stringify(norm));
    try {
      localStorage.setItem("globalExams", JSON.stringify(norm));
    } catch (e2) {}
    try {
      window.dispatchEvent(new CustomEvent("globalDenemeler:updated"));
    } catch (e3) {}
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function formatTrDate(iso) {
    if (!iso || String(iso).length < 10) return iso || "";
    var p = String(iso).split("-");
    if (p.length < 3) return iso;
    return p[2] + "." + p[1] + "." + p[0];
  }

  function computeMatrixPct(cevaplar, n) {
    if (!n) return 0;
    if (!cevaplar || !cevaplar.length) return 0;
    var filled = 0;
    for (var i = 0; i < n; i++) {
      if (cevaplar[i] && String(cevaplar[i]).length) filled++;
    }
    return Math.round((filled / n) * 100);
  }

  function getPublishStats() {
    var tum = document.querySelector('input[name="kdy-ogrenci"]:checked');
    if (tum && tum.value === "tum") {
      return { atanan: 0, kapsam: "tum", sinifler: [] };
    }
    return { atanan: 0, kapsam: "secili", sinifler: [] };
  }

  function deriveDurum(matrixPct, pdfYuklu) {
    if (matrixPct >= 100 && pdfYuklu) return "aktif";
    return "taslak";
  }

  function enrichExam(item) {
    var n = item.soruSayisi || qCount(item.sinav);
    var pct =
      item.matrixPct != null && item.matrixPct !== ""
        ? Number(item.matrixPct)
        : computeMatrixPct(item.cevaplar, n);
    var pdfYuklu = item.pdfYuklu != null ? !!item.pdfYuklu : !!(item.pdfName && String(item.pdfName).length);
    var durum = item.durum || deriveDurum(pct, pdfYuklu);
    var atanan = item.atanan != null ? item.atanan : item.atananSayisi != null ? item.atananSayisi : 0;
    return {
      n: n,
      matrixPct: pct,
      pdfYuklu: pdfYuklu,
      durum: durum,
      atanan: atanan,
    };
  }

  function durumLabel(code) {
    if (code === "aktif") return "Yayında";
    if (code === "tamamlandi") return "Tamamlandı";
    return "Taslak";
  }

  function badgeClassTur(tur) {
    if (tur === "TYT") return "dgt-badge dgt-badge--tyt";
    if (tur === "AYT") return "dgt-badge dgt-badge--ayt";
    if (tur === "YDT") return "dgt-badge dgt-badge--ydt";
    return "dgt-badge dgt-badge--yks";
  }

  function durumBadgeClass(code) {
    if (code === "aktif") return "dgt-badge dgt-badge--tyt";
    if (code === "tamamlandi") return "dgt-badge dgt-badge--ayt";
    return "dgt-badge dgt-badge--yks";
  }

  function getFilteredList() {
    var list = loadStore();
    var inp = document.getElementById("kdy-filter-search");
    var fd = document.getElementById("kdy-filter-durum");
    var fs = document.getElementById("kdy-filter-sinav");
    var q = (inp && inp.value.trim().toLowerCase()) || "";
    var fDurum = fd && fd.value;
    var fSinav = fs && fs.value;
    return list.filter(function (item) {
      var ex = enrichExam(item);
      if (q && String(item.ad || "").toLowerCase().indexOf(q) === -1) return false;
      if (fDurum && ex.durum !== fDurum) return false;
      if (fSinav && String(item.sinav || "") !== fSinav) return false;
      return true;
    });
  }

  function updateFilterCount(visible, total) {
    var el = document.getElementById("kdy-filter-count");
    if (!el) return;
    if (!total) {
      el.textContent = "";
      return;
    }
    el.textContent = visible === total ? visible + " deneme" : visible + " / " + total + " deneme";
  }

  function removeExam(id) {
    var list = loadStore().filter(function (x) {
      return x.id !== id;
    });
    saveStore(list);
    renderList();
  }

  function copyExam(id) {
    var list = loadStore();
    var item = null;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        item = list[i];
        break;
      }
    }
    if (!item) return;
    try {
      var copy = JSON.parse(JSON.stringify(item));
    } catch (err) {
      return;
    }
    copy.id = "gd-" + Date.now();
    copy.ad = (copy.ad || "Deneme") + " (kopya)";
    copy.durum = "taslak";
    copy.matrixPct = 0;
    if (copy.cevaplar && copy.cevaplar.length) copy.cevaplar = copy.cevaplar.map(function () { return ""; });
    list.unshift(copy);
    saveStore(list);
    renderList();
  }

  function openKdyKebab(menu, btn) {
    if (!menu) return;
    menu.hidden = false;

    // Wrapper'lardaki overflow:auto / overflow:hidden içine sıkışmamak için
    // menüyü viewport'a bağla (position: fixed). Buton koordinatlarına
    // göre konumlandır; ekranın alt/sağ kenarlarını taşıyorsa yukarı/sola kaydır.
    if (btn) {
      var rect = btn.getBoundingClientRect();
      menu.style.position = "fixed";
      menu.style.left = "";
      menu.style.right = "";
      menu.style.top  = (rect.bottom + 6) + "px";
      // Varsayılan: sağa yasla (butonun sağ kenarı ile hizala)
      menu.style.right = (window.innerWidth - rect.right) + "px";
      // Alt kenara taşarsa yukarı aç
      var MENU_H = 220; // yaklaşık
      if (rect.bottom + MENU_H + 12 > window.innerHeight) {
        menu.style.top = (rect.top - MENU_H - 6) + "px";
      }
    }

    // Reflow → geçiş animasyonu tetiklensin
    void menu.offsetWidth;
    menu.classList.remove("opacity-0", "scale-95", "pointer-events-none");
    menu.classList.add("opacity-100", "scale-100");
    if (btn) btn.setAttribute("aria-expanded", "true");
  }

  function closeAllKdyKebabs(ev) {
    if (ev && ev.target && ev.target.closest && ev.target.closest(".kdy-kebab")) return;
    document.querySelectorAll(".kdy-kebab__menu").forEach(function (m) {
      m.classList.remove("opacity-100", "scale-100");
      m.classList.add("opacity-0", "scale-95", "pointer-events-none");
      // Geçiş bittikten sonra erişilemez yap (focus-trap ve a11y için)
      setTimeout(function () {
        if (m.classList.contains("opacity-0")) m.hidden = true;
      }, 200);
    });
    document.querySelectorAll("[data-kdy-kebab]").forEach(function (b) {
      b.setAttribute("aria-expanded", "false");
    });
  }

  var editingExamId = null;

  function openExamModal(id, tab) {
    closeAllKdyKebabs();
    var list = loadStore();
    var item = null;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        item = list[i];
        break;
      }
    }
    if (!item) return;
    editingExamId = id;
    resetTab1Defaults();
    var name = document.getElementById("kdy-f-name");
    var date = document.getElementById("kdy-f-date");
    var time = document.getElementById("kdy-f-time");
    if (name) name.value = item.ad || "";
    if (date) date.value = item.tarih || todayIso();
    if (time) time.value = item.saat || "09:00";
    var sinav = item.sinav || item.tur || "TYT";
    document.querySelectorAll('input[name="kdy-sinav"]').forEach(function (r) {
      r.checked = r.value === sinav;
    });
    var wantTum = item.ogrenciKapsam === "tum";
    var rt = document.querySelector('input[name="kdy-ogrenci"][value="tum"]');
    var rs = document.querySelector('input[name="kdy-ogrenci"][value="secili"]');
    if (wantTum && rt) rt.checked = true;
    else if (rs) rs.checked = true;
    onSinavChange();
    var n = matrix.n;
    for (var j = 0; j < n; j++) {
      matrix.cevap[j] = item.cevaplar && j < item.cevaplar.length ? item.cevaplar[j] || "" : "";
      matrix.zorluk[j] =
        item.zorluk && j < item.zorluk.length && item.zorluk[j] != null ? String(item.zorluk[j]) : "1";
      matrix.konu[j] = item.konu && j < item.konu.length ? item.konu[j] || "" : "";
      matrix.konuYazi[j] = item.konuYazi && j < item.konuYazi.length ? String(item.konuYazi[j] || "").trim() : "";
    }
    var dn = document.getElementById("kdy-dropzone-name");
    var pdfInp = document.getElementById("kdy-f-pdf");
    if (item.pdfName && dn) dn.textContent = item.pdfName;
    if (pdfInp) pdfInp.value = "";
    setModal(true);
    switchTab(tab || "1");
    window.requestAnimationFrame(function () {
      renderMatrixTable();
    });
  }

  var matrix = {
    n: 120,
    cevap: [],
    zorluk: [],
    konu: [],
    konuYazi: [],
  };

  var examByIndex = [];

  function initMatrix(n) {
    matrix.n = n;
    matrix.cevap = new Array(n);
    matrix.zorluk = new Array(n);
    matrix.konu = new Array(n);
    matrix.konuYazi = new Array(n);
    for (var i = 0; i < n; i++) {
      matrix.cevap[i] = "";
      matrix.zorluk[i] = "1";
      matrix.konu[i] = "";
      matrix.konuYazi[i] = "";
    }
  }

  function getSinavFromForm() {
    var r = document.querySelector('input[name="kdy-sinav"]:checked');
    return r ? r.value : "TYT";
  }

  function rebuildExamLayout() {
    if (!window.getExamLayout) {
      examByIndex = [];
      return qCount(getSinavFromForm());
    }
    var lay = window.getExamLayout(getSinavFromForm());
    examByIndex = lay.byIndex;
    return lay.n;
  }

  function sortByName(arr, key) {
    return arr.slice().sort(function (a, b) {
      return (a[key] || "").localeCompare(b[key] || "", "tr");
    });
  }

  function optionHasValue(sel, val) {
    if (!sel || !val) return false;
    for (var i = 0; i < sel.options.length; i++) {
      if (sel.options[i].value === val) return true;
    }
    return false;
  }

  function populateKonuSelect(sel, sid, selectedId) {
    if (!sel) return;
    var v = selectedId != null ? String(selectedId) : "";
    sel.innerHTML = "";
    var ph = document.createElement("option");
    ph.value = "";
    ph.textContent = "— Konu —";
    sel.appendChild(ph);
    if (!sid || !window.YksMufredatApi) {
      sel.disabled = true;
      sel.value = "";
      return;
    }
    sel.disabled = false;
    var topics = sortByName(window.YksMufredatApi.getTopics(sid), "name");
    for (var j = 0; j < topics.length; j++) {
      var t = topics[j];
      var o = document.createElement("option");
      o.value = t.id;
      o.textContent = t.name;
      sel.appendChild(o);
    }
    sel.value = optionHasValue(sel, v) ? v : "";
  }

  function populateKavramSelect(sel, sid, tid, selectedId) {
    if (!sel) return;
    var val = selectedId != null ? String(selectedId) : "";
    sel.innerHTML = "";
    var ph = document.createElement("option");
    ph.value = "";
    ph.textContent = "— Kavram —";
    sel.appendChild(ph);
    if (!sid || !tid || !window.YksMufredatApi) {
      sel.disabled = true;
      sel.value = "";
      return;
    }
    sel.disabled = false;
    var conc = sortByName(window.YksMufredatApi.getConcepts(sid, tid), "name");
    for (var k = 0; k < conc.length; k++) {
      var c = conc[k];
      var o = document.createElement("option");
      o.value = c.id;
      o.textContent = c.name;
      sel.appendChild(o);
    }
    sel.value = optionHasValue(sel, val) ? val : "";
  }

  function subjectShortLabel(subjectId) {
    if (!window.YksMufredatApi || !subjectId) return "";
    var s = window.YksMufredatApi.getSubject(subjectId);
    return s ? s.name : subjectId;
  }

  function hydrateQuestionRow(tr, idx) {
    var meta = examByIndex[idx];
    var sid = meta ? meta.subjectId : "";
    tr.dataset.qindex = String(idx);
    var noCell = tr.querySelector(".kdy-mtd--no");
    if (noCell) noCell.textContent = String(idx + 1);
    var subEl = tr.querySelector(".kdy-mrow__subhint:not(.kdy-mrow__subhint--spacer)");
    if (subEl) {
      var sl = subjectShortLabel(sid);
      subEl.textContent = sl || "\u00a0";
    }
    var sc = tr.querySelector(".kdy-mrow__cevap");
    if (sc) sc.value = matrix.cevap[idx] || "";
    var konu = tr.querySelector(".kdy-muf-sel--konu");
    var kav = tr.querySelector(".kdy-muf-sel--kavram");
    var raw = (matrix.konu[idx] || "").trim();
    var p = raw.split("|");
    var storedSid = (p[0] || "").trim();
    var tid = (p[1] || "").trim();
    var cid = (p[2] || "").trim();
    if (storedSid && storedSid !== sid) {
      tid = "";
      cid = "";
    }
    populateKonuSelect(konu, sid, tid);
    populateKavramSelect(kav, sid, konu && konu.value ? konu.value : tid, cid);
    var sz = tr.querySelector(".kdy-mrow__zor");
    if (sz) sz.value = matrix.zorluk[idx] != null ? String(matrix.zorluk[idx]) : "1";
    tr.classList.remove("kdy-mrow--z0", "kdy-mrow--z1", "kdy-mrow--z2", "kdy-mrow--z3");
    tr.classList.add("kdy-mrow--z" + (sz && sz.value ? sz.value : "1"));
  }

  function readRowFromDom(tr) {
    var idx = parseInt(tr.getAttribute("data-qindex"), 10);
    if (isNaN(idx) || idx < 0 || idx >= matrix.n) return;
    var meta = examByIndex[idx];
    var sid = meta ? meta.subjectId : "";
    var sc = tr.querySelector(".kdy-mrow__cevap");
    if (sc) matrix.cevap[idx] = sc.value;
    var konu = tr.querySelector(".kdy-muf-sel--konu");
    var kav = tr.querySelector(".kdy-muf-sel--kavram");
    var tid = konu && konu.value ? konu.value.trim() : "";
    var cid = kav && kav.value ? kav.value.trim() : "";
    var combined = "";
    if (sid && tid && cid) combined = sid + "|" + tid + "|" + cid;
    else if (sid && tid) combined = sid + "|" + tid;
    else if (sid) combined = sid;
    matrix.konu[idx] = combined;
    var sz = tr.querySelector(".kdy-mrow__zor");
    if (sz) matrix.zorluk[idx] = sz.value;
    matrix.konuYazi[idx] = "";
    tr.classList.remove("kdy-mrow--z0", "kdy-mrow--z1", "kdy-mrow--z2", "kdy-mrow--z3");
    tr.classList.add("kdy-mrow--z" + (matrix.zorluk[idx] || "1"));
  }

  function readAllMatrixRowsFromDom() {
    var tb = document.getElementById("kdy-matrix-tbody");
    if (!tb) return;
    tb.querySelectorAll("tr.kdy-mrow").forEach(function (tr) {
      readRowFromDom(tr);
    });
  }

  function renderMatrixTable() {
    var tb = document.getElementById("kdy-matrix-tbody");
    if (!tb || !window.getExamLayout) return;
    var lay = window.getExamLayout(getSinavFromForm());
    examByIndex = lay.byIndex;
    tb.innerHTML = "";
    for (var s = 0; s < lay.sections.length; s++) {
      var sec = lay.sections[s];
      var nInSec = sec.endQ - sec.startQ + 1;
      var hr = document.createElement("tr");
      hr.className = "kdy-matrix-sec";
      hr.innerHTML =
        '<td colspan="5"><span class="kdy-matrix-sec__inner">' +
        escapeHtml(sec.title) +
        ' <span class="kdy-matrix-sec__cnt">(' +
        nInSec +
        " Soru)</span></span></td>";
      tb.appendChild(hr);
      for (var q = sec.startQ; q <= sec.endQ; q++) {
        var idx = q - 1;
        var tr = document.createElement("tr");
        tr.className = "kdy-mrow kdy-mrow--z1";
        tr.setAttribute("data-qindex", String(idx));
        tr.innerHTML =
          '<td class="kdy-mtd kdy-mtd--no"></td>' +
          '<td class="kdy-mtd"><select class="kdy-mrow__cevap kdy-input" aria-label="Doğru cevap">' +
          '<option value="">—</option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option><option value="E">E</option></select></td>' +
          '<td class="kdy-mtd kdy-mtd--stack">' +
          '<span class="kdy-mrow__subhint"></span>' +
          '<select class="kdy-muf-sel kdy-muf-sel--konu kdy-input" aria-label="Konu"></select></td>' +
          '<td class="kdy-mtd kdy-mtd--stack">' +
          '<span class="kdy-mrow__subhint kdy-mrow__subhint--spacer" aria-hidden="true">\u00a0</span>' +
          '<select class="kdy-muf-sel kdy-muf-sel--kavram kdy-input" aria-label="Kavram" disabled></select></td>' +
          '<td class="kdy-mtd"><select class="kdy-mrow__zor kdy-input" aria-label="Zorluk">' +
          '<option value="0">Kolay</option><option value="1">Orta</option><option value="2">Zor</option><option value="3">Çok zor</option></select></td>';
        tb.appendChild(tr);
        hydrateQuestionRow(tr, idx);
      }
    }
  }

  function onMufKonuChangeRow(tr, sid) {
    var konu = tr.querySelector(".kdy-muf-sel--konu");
    var kav = tr.querySelector(".kdy-muf-sel--kavram");
    populateKavramSelect(kav, sid, konu && konu.value ? konu.value : "", "");
  }

  function setMatrixHint() {
    var el = document.getElementById("kdy-matrix-hint");
    if (!el) return;
    var s = getSinavFromForm();
    var map = { TYT: "TYT: 120 soru (ÖSYM)", AYT: "AYT: 160 soru (tam alan, ÖSYM)", YDT: "YDT: 80 soru (ÖSYM)" };
    el.textContent =
      (map[s] || "") +
      ". Sorular ders bloklarına ayrılmıştır; konu ve kavram listeleri yalnızca o satırın branşından gelir (yks-mufredat.js).";
  }

  function onSinavChange() {
    var n = rebuildExamLayout();
    initMatrix(n);
    setMatrixHint();
    var sc = document.getElementById("kdy-matrix-scroll");
    if (sc) sc.scrollTop = 0;
    renderMatrixTable();
  }

  function applyBulkKey() {
    readAllMatrixRowsFromDom();
    var inp = document.getElementById("kdy-bulk-key");
    if (!inp) return;
    var raw = (inp.value || "").toUpperCase().replace(/[^ABCDE]/g, "");
    for (var i = 0; i < matrix.n && i < raw.length; i++) {
      matrix.cevap[i] = raw.charAt(i);
    }
    renderMatrixTable();
  }

  function applyBulkKonuList() {
    readAllMatrixRowsFromDom();
    var ta = document.getElementById("kdy-bulk-konu");
    if (!ta || !window.DenemeKonuBulk || typeof window.DenemeKonuBulk.matchKonuSelectValue !== "function") return;
    var lines = String(ta.value || "").split(/\r\n|\n|\r/);
    var tb = document.getElementById("kdy-matrix-tbody");
    if (!tb) return;
    var rows = tb.querySelectorAll("tr.kdy-mrow");
    for (var r = 0; r < rows.length; r++) {
      var tr = rows[r];
      var idx = parseInt(tr.getAttribute("data-qindex"), 10);
      if (isNaN(idx) || idx < 0 || idx >= matrix.n) continue;
      var line = r < lines.length ? String(lines[r] || "").trim() : "";
      var konuSel = tr.querySelector(".kdy-muf-sel--konu");
      var kav = tr.querySelector(".kdy-muf-sel--kavram");
      var meta = examByIndex[idx];
      var sid = meta ? meta.subjectId : "";
      matrix.konuYazi[idx] = "";
      if (!line || !konuSel || konuSel.disabled) {
        if (konuSel) konuSel.value = "";
        if (kav && sid) populateKavramSelect(kav, sid, "", "");
        matrix.konu[idx] = sid || "";
        continue;
      }
      var matched = window.DenemeKonuBulk.matchKonuSelectValue(konuSel, line);
      if (matched) {
        konuSel.value = matched;
        if (kav && sid) populateKavramSelect(kav, sid, matched, "");
        matrix.konu[idx] = sid && matched ? sid + "|" + matched : sid || "";
      } else {
        if (konuSel) konuSel.value = "";
        if (kav && sid) populateKavramSelect(kav, sid, "", "");
        matrix.konu[idx] = sid || "";
      }
    }
    renderMatrixTable();
  }

  function renderList() {
    if (window.__denemeGlobalUISync) window.__denemeGlobalUISync();
    var full = loadStore();
    var list = getFilteredList();
    var tbody = document.getElementById("kdy-exam-table-body");
    var empty = document.getElementById("kdy-empty");
    var msgEl = document.getElementById("kdy-empty-msg");
    if (!tbody || !empty) return;
    tbody.innerHTML = "";
    if (!full.length) {
      empty.hidden = false;
      if (msgEl) {
        msgEl.textContent = "Henüz kurum denemesi yok. Sağ üstten yeni deneme oluşturarak başlayın.";
      }
      updateFilterCount(0, 0);
      return;
    }
    if (!list.length) {
      empty.hidden = false;
      if (msgEl) {
        msgEl.textContent = "Filtrelere uyan deneme yok. Filtreleri sıfırlayın veya aramayı genişletin.";
      }
      updateFilterCount(0, full.length);
      return;
    }
    empty.hidden = true;
    updateFilterCount(list.length, full.length);

    list.forEach(function (item) {
      var ex = enrichExam(item);
      var pct = Math.max(0, Math.min(100, Math.round(ex.matrixPct)));
      var fillClass =
        pct >= 100 ? "kdy-mat-bar__fill--full" : pct >= 66 ? "kdy-mat-bar__fill--good" : pct > 0 ? "kdy-mat-bar__fill--mid" : "kdy-mat-bar__fill--empty";
      var matLabel = pct >= 100 ? "%100 Dolu" : "%" + pct + " Dolu";
      var checkHtml = pct >= 100 ? ICON_CHECK : '<span class="kdy-mat-bar__check-spacer" aria-hidden="true"></span>';
      var tr = document.createElement("tr");
      tr.className = "kdy-list-row";
      tr.setAttribute("data-kdy-id", item.id || "");
      tr.innerHTML =
        '<td class="kdy-td-exam">' +
        '<div class="kdy-td-exam__title" title="' +
        escapeHtml(item.ad || "") +
        '">' +
        escapeHtml(item.ad || "Adsız") +
        "</div>" +
        '<div class="kdy-td-exam__meta">' +
        escapeHtml(formatTrDate(item.tarih) + " · " + (item.saat || "09:00")) +
        "</div></td>" +
        '<td><span class="' +
        badgeClassTur(item.sinav || "TYT") +
        '">' +
        escapeHtml(item.sinav || "TYT") +
        "</span></td>" +
        '<td class="kdy-td-matrix">' +
        '<div class="kdy-mat-bar" role="progressbar" aria-valuenow="' +
        pct +
        '" aria-valuemin="0" aria-valuemax="100" aria-label="Matris doluluğu ' +
        pct +
        '%">' +
        '<div class="kdy-mat-bar__track"><div class="kdy-mat-bar__fill ' +
        fillClass +
        '" style="width:' +
        pct +
        '%"></div></div>' +
        '<span class="kdy-mat-bar__label">' +
        escapeHtml(matLabel) +
        "</span>" +
        checkHtml +
        "</div></td>" +
        '<td class="kdy-td-part">' +
        '<span class="kdy-badge-part">' +
        escapeHtml(String(ex.atanan || 0)) +
        " katılımcı</span>" +
        '<span class="kdy-badge-durum ' +
        durumBadgeClass(ex.durum) +
        '">' +
        escapeHtml(durumLabel(ex.durum)) +
        "</span></td>" +
        '<td class="dgt-exam-table__actions" style="overflow:visible;">' +
        '<div class="kdy-row-actions">' +
        '<button type="button" class="kdy-btn-row-primary" data-kdy-act="duzenle">Düzenle</button>' +
        '<div class="kdy-kebab relative">' +
        '<button type="button" class="kdy-kebab__btn inline-flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 aria-expanded:bg-slate-100 aria-expanded:text-slate-900" data-kdy-kebab aria-expanded="false" aria-haspopup="menu" aria-label="Diğer işlemler">' +
        ICON_KEBAB +
        "</button>" +
        '<ul class="kdy-kebab__menu absolute right-0 top-full z-50 mt-2 w-48 origin-top-right overflow-hidden rounded-xl border border-slate-100 bg-white p-1 opacity-0 scale-95 pointer-events-none shadow-lg transition-all duration-200 ease-out" role="menu" hidden>' +
        '<li><button type="button" class="kdy-kebab__item block w-full rounded-lg px-4 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-indigo-600" role="menuitem" data-kdy-act="optik">Matris / Optik</button></li>' +
        '<li><button type="button" class="kdy-kebab__item block w-full rounded-lg px-4 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-indigo-600" role="menuitem" data-kdy-act="kopyala">Kopyala</button></li>' +
        '<li><button type="button" class="kdy-kebab__item block w-full rounded-lg px-4 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-indigo-600" role="menuitem" data-kdy-act="ayarlar">Yayın ayarları</button></li>' +
        '<li class="my-1 border-t border-slate-100"></li>' +
        '<li><button type="button" class="kdy-kebab__item kdy-kebab__item--danger block w-full rounded-lg px-4 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50" role="menuitem" data-kdy-act="sil">Sil</button></li>' +
        "</ul></div></div></td>";
      tbody.appendChild(tr);
    });
  }

  function setModal(open) {
    var ov = document.getElementById("kdy-modal-overlay");
    if (!ov) return;
    if (window.DenemeModalShell && window.DenemeModalShell.applyContext) window.DenemeModalShell.applyContext();
    ov.classList.toggle("is-open", open);
    ov.setAttribute("aria-hidden", open ? "false" : "true");
    document.body.style.overflow = open ? "hidden" : "";
    if (open) {
      setMatrixHint();
      renderMatrixTable();
    }
  }

  function resetTab1Defaults() {
    var name = document.getElementById("kdy-f-name");
    var date = document.getElementById("kdy-f-date");
    var tm = document.getElementById("kdy-f-time");
    var pdf = document.getElementById("kdy-f-pdf");
    var dn = document.getElementById("kdy-dropzone-name");
    var bk = document.getElementById("kdy-bulk-key");
    var bkn = document.getElementById("kdy-bulk-konu");
    if (name) name.value = "";
    if (date) date.value = todayIso();
    if (tm) tm.value = "09:00";
    if (pdf) pdf.value = "";
    if (dn) dn.textContent = "";
    if (bk) bk.value = "";
    if (bkn) bkn.value = "";
    var rtyt = document.querySelector('input[name="kdy-sinav"][value="TYT"]');
    if (rtyt) rtyt.checked = true;
  }

  function switchTab(which) {
    document.querySelectorAll(".kdy-tab").forEach(function (btn) {
      var w = btn.getAttribute("data-kdy-tab");
      var on = w === which;
      btn.classList.toggle("kdy-tab--active", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
    });
    document.querySelectorAll("[data-kdy-panel]").forEach(function (p) {
      var w = p.getAttribute("data-kdy-panel");
      var on = w === which;
      p.classList.toggle("kdy-panel--active", on);
      p.hidden = !on;
    });
    if (window.DenemeModalShell && window.DenemeModalShell.syncTabStepState) {
      window.DenemeModalShell.syncTabStepState(which);
    }
  }

  function saveDraft() {
    readAllMatrixRowsFromDom();
    var ad = (document.getElementById("kdy-f-name") && document.getElementById("kdy-f-name").value.trim()) || "Adsız deneme";
    var tarih = (document.getElementById("kdy-f-date") && document.getElementById("kdy-f-date").value) || todayIso();
    var saatEl = document.getElementById("kdy-f-time");
    var saat = (saatEl && saatEl.value) || "09:00";
    var sinav = getSinavFromForm();
    var pdfInp = document.getElementById("kdy-f-pdf");
    var pdfName = pdfInp && pdfInp.files && pdfInp.files[0] ? pdfInp.files[0].name : "";
    var dn = document.getElementById("kdy-dropzone-name");
    if (!pdfName && dn && dn.textContent.trim()) pdfName = dn.textContent.trim();
    var matrixPct = computeMatrixPct(matrix.cevap, matrix.n);
    var pdfYuklu = !!(pdfName && pdfName.length);
    var pub = getPublishStats();
    var durum = deriveDurum(matrixPct, pdfYuklu);
    var list = loadStore();
    var payload = {
      ad: ad,
      name: ad,
      tarih: tarih,
      saat: saat,
      sinav: sinav,
      tur: sinav,
      soruSayisi: matrix.n,
      pdfName: pdfName,
      pdfYuklu: pdfYuklu,
      matrixPct: matrixPct,
      durum: durum,
      atanan: pub.atanan,
      ogrenciKapsam: pub.kapsam,
      sinifler: pub.sinifler.slice(),
      cevaplar: matrix.cevap.slice(),
      zorluk: matrix.zorluk.slice(),
      konu: matrix.konu.slice(),
      konuYazi: matrix.konuYazi.slice(),
      yayinevi: "—",
    };
    var eid = editingExamId;
    if (eid) {
      var idx = -1;
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === eid) {
          idx = i;
          break;
        }
      }
      if (idx >= 0) {
        var prev = list[idx];
        if (!payload.pdfName && prev.pdfName) {
          payload.pdfName = prev.pdfName;
          payload.pdfYuklu = prev.pdfYuklu != null ? !!prev.pdfYuklu : !!(prev.pdfName && String(prev.pdfName).length);
        }
        payload.yayinevi = prev.yayinevi != null && prev.yayinevi !== "" ? prev.yayinevi : payload.yayinevi;
        list[idx] = Object.assign({}, prev, payload, { id: eid });
      } else {
        list.unshift(Object.assign({}, payload, { id: "gd-" + Date.now() }));
      }
      editingExamId = null;
    } else {
      list.unshift(Object.assign({}, payload, { id: "gd-" + Date.now() }));
    }
    saveStore(list);
    renderList();
    setModal(false);
    resetTab1Defaults();
    switchTab("1");
  }

  function bindMatrixTbody() {
    var tb = document.getElementById("kdy-matrix-tbody");
    if (!tb || tb.dataset.kdyBound) return;
    tb.dataset.kdyBound = "1";
    tb.addEventListener("change", function (e) {
      var tr = e.target.closest("tr.kdy-mrow");
      if (!tr) return;
      var idx = parseInt(tr.getAttribute("data-qindex"), 10);
      var sid = examByIndex[idx] ? examByIndex[idx].subjectId : "";
      if (e.target.classList.contains("kdy-muf-sel--konu")) {
        onMufKonuChangeRow(tr, sid);
      }
      readRowFromDom(tr);
    });
  }

  function bind() {
    var n0 = rebuildExamLayout();
    initMatrix(n0);
    bindMatrixTbody();

    document.getElementById("dgt-open-modal") &&
      document.getElementById("dgt-open-modal").addEventListener("click", function () {
        editingExamId = null;
        resetTab1Defaults();
        onSinavChange();
        switchTab("1");
        setModal(true);
      });

    ["kdy-modal-close", "kdy-modal-cancel"].forEach(function (id) {
      var b = document.getElementById(id);
      if (b)
        b.addEventListener("click", function () {
          editingExamId = null;
          setModal(false);
        });
    });

    var ov = document.getElementById("kdy-modal-overlay");
    if (ov) {
      ov.addEventListener("click", function (e) {
        if (e.target === ov) {
          editingExamId = null;
          setModal(false);
        }
      });
    }

    document.addEventListener(
      "keydown",
      function (e) {
        if (e.key !== "Escape") return;
        var anyKebabOpen = document.querySelector(".kdy-kebab__menu:not([hidden])");
        if (anyKebabOpen) {
          closeAllKdyKebabs();
          e.preventDefault();
          return;
        }
        if (ov && ov.classList.contains("is-open")) {
          editingExamId = null;
          setModal(false);
        }
      },
      true
    );

    document.addEventListener("mousedown", closeAllKdyKebabs, true);
    // Scroll veya resize olduğunda fixed menünün yeri kaymasın diye kapat
    window.addEventListener("scroll", function () { closeAllKdyKebabs(); }, true);
    window.addEventListener("resize", function () { closeAllKdyKebabs(); });

    window.addEventListener("deneme-modal-tab", function (e) {
      if (!e.detail || e.detail.tab !== "2") return;
      setMatrixHint();
      renderMatrixTable();
    });

    document.querySelectorAll('input[name="kdy-sinav"]').forEach(function (r) {
      r.addEventListener("change", function () {
        setMatrixHint();
        onSinavChange();
      });
    });

    document.getElementById("kdy-bulk-apply") &&
      document.getElementById("kdy-bulk-apply").addEventListener("click", applyBulkKey);
    document.getElementById("kdy-bulk-konu-apply") &&
      document.getElementById("kdy-bulk-konu-apply").addEventListener("click", applyBulkKonuList);

    document.getElementById("kdy-modal-save") &&
      document.getElementById("kdy-modal-save").addEventListener("click", saveDraft);

    var dz = document.getElementById("kdy-dropzone");
    var pdf = document.getElementById("kdy-f-pdf");
    var dzName = document.getElementById("kdy-dropzone-name");
    if (dz && pdf) {
      dz.addEventListener("click", function () { pdf.click(); });
      dz.addEventListener("dragover", function (e) { e.preventDefault(); dz.classList.add("kdy-dropzone--over"); });
      dz.addEventListener("dragleave", function () { dz.classList.remove("kdy-dropzone--over"); });
      dz.addEventListener("drop", function (e) {
        e.preventDefault();
        dz.classList.remove("kdy-dropzone--over");
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          try {
            pdf.files = e.dataTransfer.files;
          } catch (err) {}
          if (dzName) dzName.textContent = e.dataTransfer.files[0].name;
        }
      });
      pdf.addEventListener("change", function () {
        if (dzName) dzName.textContent = pdf.files && pdf.files[0] ? pdf.files[0].name : "";
      });
    }

    var tbody = document.getElementById("kdy-exam-table-body");
    if (tbody) {
      tbody.addEventListener("click", function (e) {
        var kebabBtn = e.target.closest("[data-kdy-kebab]");
        if (kebabBtn && tbody.contains(kebabBtn)) {
          e.stopPropagation();
          var wrap = kebabBtn.closest(".kdy-kebab");
          var menu = wrap && wrap.querySelector(".kdy-kebab__menu");
          if (!menu) return;
          var willOpen = menu.hidden || menu.classList.contains("opacity-0");
          closeAllKdyKebabs();
          if (willOpen) openKdyKebab(menu, kebabBtn);
          return;
        }
        var btn = e.target.closest("[data-kdy-act]");
        if (!btn || !tbody.contains(btn)) return;
        var tr = btn.closest("tr[data-kdy-id]");
        var id = tr && tr.getAttribute("data-kdy-id");
        if (!id) return;
        var act = btn.getAttribute("data-kdy-act");
        closeAllKdyKebabs();
        if (act === "sil") {
          if (window.confirm("Bu denemeyi silmek istiyor musunuz?")) removeExam(id);
          return;
        }
        if (act === "optik") openExamModal(id, "2");
        else if (act === "duzenle") openExamModal(id, "1");
        else if (act === "ayarlar") openExamModal(id, "3");
        else if (act === "kopyala") copyExam(id);
      });
    }

    ["kdy-filter-search", "kdy-filter-durum", "kdy-filter-sinav"].forEach(function (fid) {
      var fel = document.getElementById(fid);
      if (!fel) return;
      fel.addEventListener("input", renderList);
      fel.addEventListener("change", renderList);
    });
  }

  function boot() {
    if (!document.getElementById("dgt-open-modal")) return;
    if (!window.YksMufredatApi) {
      window.console && window.console.warn("YksMufredatApi yok; yks-mufredat.js yüklenmeli.");
    }
    if (!window.getExamLayout) {
      window.console && window.console.warn("getExamLayout yok; deneme-exam-layout.js yüklenmeli.");
    }
    bind();
    renderList();
    window.GlobalDenemeWizard = {
      openExamModal: openExamModal,
      setModal: setModal,
      switchTab: switchTab,
      resetTab1Defaults: resetTab1Defaults,
      onSinavChange: onSinavChange,
    };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
