/**
 * Kurum İçi Deneme Yönetimi — tablo listesi + ortak modal (deneme-modal-shell) + ders bloklu matris.
 * Veri: localStorage kurum_denemeler_v1. Soru sayıları deneme-exam-layout.js (ÖSYM) ile uyumludur.
 */
(function () {
  var LS_KEY = "kurum_denemeler_v1";

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
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function saveStore(list) {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
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

  /** Deneme sonuçları okutulduğunda yazılan `localStorage.examResults` kayıtlarından katılımcı sayısı (öğrenci bazında tekilleştirilmiş). */
  function countExamResultsParticipants(examId) {
    if (examId == null || examId === "") return 0;
    var canon = [];
    try {
      var raw = localStorage.getItem("examResults");
      canon = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(canon)) canon = [];
    } catch (e) {
      return 0;
    }
    var want = String(examId);
    var seen = {};
    var n = 0;
    for (var i = 0; i < canon.length; i++) {
      var r = canon[i];
      if (!r || String(r.examId) !== want) continue;
      var sid =
        r.studentId != null && r.studentId !== ""
          ? String(r.studentId)
          : r.studentCode != null && r.studentCode !== ""
            ? String(r.studentCode)
            : "";
      if (!sid) continue;
      if (seen[sid]) continue;
      seen[sid] = true;
      n++;
    }
    return n;
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
    var storedAtanan = item.atanan != null ? item.atanan : item.atananSayisi != null ? item.atananSayisi : 0;
    var fromResults = countExamResultsParticipants(item.id);
    var atanan = Math.max(Number(storedAtanan) || 0, fromResults);
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
    copy.id = "kd-" + Date.now();
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
    // Dropdown'ı overflow konteynerlerinden etkilenmemesi için body'ye "portal" et.
    // (Tablo wrapper overflow-x:auto olduğunda aksi halde scrollbar/clip oluşur.)
    try {
      // Menüye satır kimliğini bağla (portal edilince DOM bağlamı kaybolur)
      if (btn && btn.closest) {
        var tr = btn.closest("tr[data-kdy-id]");
        var rid = tr && tr.getAttribute("data-kdy-id");
        if (rid) menu.dataset.kdyId = rid;
      }
      if (!menu.__kdyPortal && menu.parentNode) {
        menu.__kdyPortal = {
          parent: menu.parentNode,
          next: menu.nextSibling
        };
      }
      if (document.body && menu.parentNode !== document.body) {
        document.body.appendChild(menu);
      }
      if (btn && typeof btn.getBoundingClientRect === "function") {
        var rect = btn.getBoundingClientRect();
        menu.style.position = "fixed";
        menu.style.left = "";
        menu.style.right = "";
        menu.style.top = (rect.bottom + 8) + "px";
        menu.style.right = (window.innerWidth - rect.right) + "px";
        menu.style.zIndex = "999";
        // ekran altına taşarsa yukarı aç
        var mh = menu.offsetHeight || 220;
        if (rect.bottom + mh + 12 > window.innerHeight) {
          menu.style.top = Math.max(8, rect.top - mh - 8) + "px";
        }
      }
    } catch (e) {}

    // Reflow → geçiş animasyonu tetiklensin
    void menu.offsetWidth;
    menu.classList.remove("opacity-0", "scale-95", "pointer-events-none");
    menu.classList.add("opacity-100", "scale-100");
    if (btn) btn.setAttribute("aria-expanded", "true");
  }

  function closeAllKdyKebabs(ev) {
    if (ev && ev.target && ev.target.closest) {
      if (ev.target.closest(".kdy-kebab")) return;
      if (ev.target.closest(".kdy-kebab__menu")) return;
    }
    document.querySelectorAll(".kdy-kebab__menu").forEach(function (m) {
      m.classList.remove("opacity-100", "scale-100");
      m.classList.add("opacity-0", "scale-95", "pointer-events-none");
      // Geçiş bittikten sonra erişilemez yap (focus-trap ve a11y için)
      setTimeout(function () {
        if (m.classList.contains("opacity-0")) {
          m.hidden = true;
          // Portal ettiysek geri yerine koy
          try {
            if (m.__kdyPortal && m.__kdyPortal.parent) {
              if (m.__kdyPortal.next && m.__kdyPortal.next.parentNode === m.__kdyPortal.parent) {
                m.__kdyPortal.parent.insertBefore(m, m.__kdyPortal.next);
              } else {
                m.__kdyPortal.parent.appendChild(m);
              }
              m.style.position = "";
              m.style.left = "";
              m.style.right = "";
              m.style.top = "";
              m.style.zIndex = "";
            }
          } catch (e) {}
        }
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
    var sinav = item.sinav || "TYT";
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
    var yazi = (matrix.konuYazi[idx] || "").trim();
    if (yazi && !tid) {
      applyFreeTextKonuKavramToRow(tr, idx, yazi);
    } else if (tid && !cid && yazi && kav) {
      var conceptOnly = yazi.indexOf("—") >= 0 ? yazi.split(/\s*—\s*/).slice(1).join(" — ").trim() : yazi;
      if (conceptOnly) {
        populateKavramSelect(kav, sid, tid, "");
        var cid2 =
          findConceptIdByName(sid, tid, conceptOnly) ||
          (window.DenemeKonuBulk && window.DenemeKonuBulk.matchSelectValue
            ? window.DenemeKonuBulk.matchSelectValue(kav, conceptOnly)
            : "");
        if (cid2) {
          kav.value = String(cid2).trim();
          matrix.konu[idx] = sid + "|" + tid + "|" + cid2;
          matrix.konuYazi[idx] = "";
        } else {
          injectFreeTextSelectOption(kav, conceptOnly);
        }
      }
    }
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
    if (tid && tid.indexOf("__xlsx__") === 0) {
      var tLab =
        konu && konu.selectedIndex >= 0 && konu.options[konu.selectedIndex]
          ? String(konu.options[konu.selectedIndex].textContent || "").trim()
          : "";
      var cLab = "";
      if (kav && kav.selectedIndex >= 0 && kav.options[kav.selectedIndex] && kav.value.indexOf("__xlsx__") === 0) {
        cLab = String(kav.options[kav.selectedIndex].textContent || "").trim();
      }
      matrix.konuYazi[idx] = cLab ? tLab + " — " + cLab : tLab;
      matrix.konu[idx] = sid || "";
    } else {
      var combined = "";
      if (sid && tid && cid) combined = sid + "|" + tid + "|" + cid;
      else if (sid && tid) combined = sid + "|" + tid;
      else if (sid) combined = sid;
      matrix.konu[idx] = combined;
      matrix.konuYazi[idx] = "";
    }
    var sz = tr.querySelector(".kdy-mrow__zor");
    if (sz) matrix.zorluk[idx] = sz.value;
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

    function waitTick(cb) {
      // Kavram option'larının DOM'a yerleşmesi için event-loop tick'i bekle
      return setTimeout(cb, 30);
    }

    function splitTopicConcept(line) {
      var raw = String(line || "").trim();
      if (!raw) return { topic: "", concept: "" };
      // "Konu | Kavram" / "Konu > Kavram" / "Konu - Kavram" gibi ayırıcılar
      var m = raw.split(/\s*(?:\||>|»|—|-|:|;)\s*/);
      var t = (m[0] || "").trim();
      var c = (m.length >= 2 ? (m[1] || "") : "").trim();
      return { topic: t, concept: c };
    }

    // Race condition fix: kavram atamasını tick sonrası yap
    var tasks = [];
    for (var r = 0; r < rows.length; r++) {
      var tr = rows[r];
      var idx = parseInt(tr.getAttribute("data-qindex"), 10);
      if (isNaN(idx) || idx < 0 || idx >= matrix.n) continue;
      var line = r < lines.length ? String(lines[r] || "").trim() : "";
      tasks.push({ tr: tr, idx: idx, line: line });
    }

    function runTask(i) {
      if (i >= tasks.length) {
        renderMatrixTable();
        return;
      }
      var t = tasks[i];
      var tr = t.tr;
      var idx = t.idx;
      var line = t.line;
      var konuSel = tr.querySelector(".kdy-muf-sel--konu");
      var kav = tr.querySelector(".kdy-muf-sel--kavram");
      var meta = examByIndex[idx];
      var sid = meta ? meta.subjectId : "";
      matrix.konuYazi[idx] = "";

      if (!line || !konuSel || konuSel.disabled) {
        if (konuSel) konuSel.value = "";
        if (kav && sid) populateKavramSelect(kav, sid, "", "");
        matrix.konu[idx] = sid || "";
        return runTask(i + 1);
      }

      var parts = splitTopicConcept(line);
      var matched = window.DenemeKonuBulk.matchKonuSelectValue(konuSel, parts.topic);
      if (!matched) {
        if (konuSel) konuSel.value = "";
        if (kav && sid) populateKavramSelect(kav, sid, "", "");
        matrix.konu[idx] = sid || "";
        return runTask(i + 1);
      }

      konuSel.value = String(matched || "").trim();
      try { konuSel.dispatchEvent(new Event("change", { bubbles: true })); } catch (e) {}

      waitTick(function () {
        try {
          if (kav && parts.concept && typeof window.DenemeKonuBulk.matchSelectValue === "function") {
            var cav = window.DenemeKonuBulk.matchSelectValue(kav, String(parts.concept || "").trim());
            if (cav) {
              kav.value = String(cav).trim();
              try { kav.dispatchEvent(new Event("change", { bubbles: true })); } catch (e) {}
            }
          }
          // Kavram seçimi sonrası DOM'dan oku
          readRowFromDom(tr);
        } catch (e) {
          // satır hatası varsa devam
        }
        runTask(i + 1);
      });
    }

    runTask(0);
  }

  // ==========================================================================
  // Excel Entegrasyonu (2. Adım) — SheetJS ile şablon indir + içeri aktar
  // ==========================================================================
  var EXCEL_PREVIEW_FALLBACK = "Belirtilmemiş";
  var excelImportBundles = [];

  function cleanHeaderLabel(k) {
    return String(k || "")
      .replace(/^\uFEFF/, "")
      .replace(/\u00A0/g, " ")
      .trim();
  }

  function trimExcelCell(v) {
    if (v == null) return "";
    return String(v).trim();
  }

  function slugTr(s) {
    return cleanHeaderLabel(s)
      .toLowerCase()
      .replace(/ı/g, "i")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/\s+/g, " ")
      .replace(/[^\w\s-]/g, "");
  }

  function showWpToast(message, type) {
    var el = document.getElementById("wp-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "wp-toast";
      el.className = "wp-toast";
      el.hidden = true;
      document.body.appendChild(el);
    }
    el.classList.remove("wp-toast--success", "wp-toast--error");
    if (type === "error") el.classList.add("wp-toast--error");
    else el.classList.add("wp-toast--success");
    el.textContent = String(message || "");
    el.hidden = false;
    window.clearTimeout(el.__wpToastT);
    el.__wpToastT = window.setTimeout(function () {
      el.hidden = true;
    }, 2400);
  }

  function setExcelWizard(open) {
    var ov = document.getElementById("kdy-excel-overlay");
    if (!ov) return;
    ov.classList.toggle("is-open", !!open);
    ov.setAttribute("aria-hidden", open ? "false" : "true");
  }

  function makeExcelTemplateAndDownload() {
    if (!window.XLSX) {
      showWpToast("Excel kütüphanesi yüklenemedi. İnternet bağlantısını kontrol edin.", "error");
      return;
    }
    var headers = ["Soru No", "Doğru Cevap", "Konu", "Kavram", "Zorluk"];
    var rows = [
      headers,
      [1, "A", "Türkçe", "Cümle Öğeleri", "Kolay"],
      [2, "B", "Türkçe", "Cümlede Anlam", "Orta"],
    ];
    var wb = window.XLSX.utils.book_new();
    var ws = window.XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 10 }, { wch: 14 }, { wch: 28 }, { wch: 28 }, { wch: 10 }];
    window.XLSX.utils.book_append_sheet(wb, ws, "Sablon");
    window.XLSX.writeFile(wb, "deneme_sablonu.xlsx");
  }

  function normalizeHeaderKey(k) {
    var x = slugTr(k);
    x = x.replace(/\s+/g, "");
    return x;
  }

  function pick(row, keys) {
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (row[k] != null) {
        var v = trimExcelCell(row[k]);
        if (v) return v;
      }
    }
    return "";
  }

  function buildExcelRowBundle(rawRow) {
    var norm = {};
    var raw = {};
    Object.keys(rawRow || {}).forEach(function (k) {
      var label = cleanHeaderLabel(k);
      if (!label) return;
      var val = trimExcelCell(rawRow[k]);
      raw[label] = val;
      var nk = normalizeHeaderKey(label);
      if (nk) norm[nk] = val;
    });
    return { norm: norm, raw: raw };
  }

  /** Önce tam başlık (Konu, Kavram), sonra normalize anahtarlar; trim uygulanır. */
  function pickExcelField(bundle, exactKeys, normKeys) {
    var i;
    var k;
    var v;
    if (!bundle) return "";
    for (i = 0; i < (exactKeys || []).length; i++) {
      k = exactKeys[i];
      if (bundle.raw[k] != null) {
        v = trimExcelCell(bundle.raw[k]);
        if (v) return v;
      }
    }
    for (i = 0; i < (normKeys || []).length; i++) {
      k = normKeys[i];
      if (bundle.norm[k] != null) {
        v = trimExcelCell(bundle.norm[k]);
        if (v) return v;
      }
    }
    return "";
  }

  function pickExcelDersFromBundle(bundle) {
    return pickExcelField(bundle, ["Konu", "Ders"], ["konu", "ders", "subject"]);
  }

  function pickExcelKavramFromBundle(bundle) {
    return pickExcelField(bundle, ["Kavram", "Alt Konu"], ["kavram", "concept", "altkonu", "altkavram"]);
  }

  /** Önizleme tablosu: Excel sütunlarını olduğu gibi gösterir. */
  function pickKonuFromBundle(bundle) {
    return pickExcelDersFromBundle(bundle);
  }

  function pickKavramFromBundle(bundle) {
    return pickExcelKavramFromBundle(bundle);
  }

  function isExcelDersLabel(label, subjectId) {
    var t = slugTr(label);
    if (!t) return false;
    var sub = slugTr(subjectShortLabel(subjectId));
    if (sub && t === sub) return true;
    if (sub && t.indexOf(sub) >= 0 && t.length <= sub.length + 4) return true;
    return false;
  }

  /**
   * DerecePanel Excel şablonu:
   *   Konu  → Ders adı (Türkçe, Matematik …) — satırın branşı zaten belli, eşlemede kullanılmaz
   *   Kavram → Müfredat konusu / alt başlık — matristeki «Konu» kutusuna yazılır
   * Eski şablon uyumu: Konu sütunu ders adı değilse doğrudan konu kabul edilir.
   */
  function resolveExcelMatrixLabels(bundle, subjectId) {
    var excelDers = pickExcelDersFromBundle(bundle);
    var excelKavram = pickExcelKavramFromBundle(bundle);
    var matrixTopic = "";
    var matrixConcept = "";

    if (excelKavram) {
      matrixTopic = excelKavram;
    }

    if (excelDers && subjectId && !isExcelDersLabel(excelDers, subjectId)) {
      if (!matrixTopic) matrixTopic = stripSubjectFromTopicLabel(excelDers, subjectId);
      else if (!matrixConcept && slugTr(excelDers) !== slugTr(matrixTopic)) matrixConcept = excelDers;
    } else if (!matrixTopic && excelDers) {
      matrixTopic = stripSubjectFromTopicLabel(excelDers, subjectId);
    }

    return { topic: matrixTopic, concept: matrixConcept };
  }

  function findTopicAndConceptByLabel(subjectId, label) {
    var out = { topicId: "", conceptId: "" };
    if (!label || !subjectId) return out;
    out.topicId = findTopicIdByName(subjectId, label);
    if (out.topicId) return out;
    if (!window.YksMufredatApi) return out;
    var topics = window.YksMufredatApi.getTopics(subjectId) || [];
    var i;
    for (i = 0; i < topics.length; i++) {
      var tid = String(topics[i].id || "");
      var cid = findConceptIdByName(subjectId, tid, label);
      if (cid) return { topicId: tid, conceptId: cid };
    }
    return out;
  }

  function rowBundleToPreview(bundle, index) {
    var soruNo = pickExcelField(bundle, ["Soru No"], ["soruno", "soru", "no", "sorunumarasi", "qno"]);
    var konu = pickKonuFromBundle(bundle);
    var kavram = pickKavramFromBundle(bundle);
    var cevap = pickExcelField(bundle, ["Doğru Cevap"], ["dogrucevap", "cevap", "dogru", "correctanswer"]);
    var zorluk = pickExcelField(bundle, ["Zorluk"], ["zorluk", "difficulty"]);
    return {
      soruNo: soruNo || String(index + 1),
      dogruCevap: cevap || EXCEL_PREVIEW_FALLBACK,
      konu: konu || EXCEL_PREVIEW_FALLBACK,
      kavram: kavram || EXCEL_PREVIEW_FALLBACK,
      zorluk: zorluk || EXCEL_PREVIEW_FALLBACK,
    };
  }

  function renderExcelPreviewTable() {
    var wrap = document.getElementById("kdy-excel-preview");
    var tbody = document.getElementById("kdy-excel-preview-tbody");
    var meta = document.getElementById("kdy-excel-preview-meta");
    if (!wrap || !tbody) return;
    tbody.innerHTML = "";
    if (!excelImportBundles.length) {
      wrap.hidden = true;
      if (meta) meta.textContent = "";
      return;
    }
    wrap.hidden = false;
    if (meta) {
      meta.textContent = excelImportBundles.length + " satır okundu — kontrol edip matrise aktarın.";
    }
    excelImportBundles.forEach(function (bundle, i) {
      var p = rowBundleToPreview(bundle, i);
      var tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" +
        escapeHtml(p.soruNo) +
        "</td><td>" +
        escapeHtml(p.dogruCevap) +
        "</td><td>" +
        escapeHtml(p.konu) +
        "</td><td>" +
        escapeHtml(p.kavram) +
        "</td><td>" +
        escapeHtml(p.zorluk) +
        "</td>";
      tbody.appendChild(tr);
    });
  }

  function parseAnswer(v) {
    var s = String(v || "").trim().toUpperCase();
    if (!s) return "";
    var m = s.match(/[ABCDE]/);
    return m ? m[0] : "";
  }

  function parseDifficulty(v) {
    if (v == null || String(v).trim() === "") return null;
    var s = String(v).trim().toLowerCase();
    if (s === "kolay") return "0";
    if (s === "orta") return "1";
    if (s === "zor") return "2";
    if (s.indexOf("cok") >= 0 || s.indexOf("çok") >= 0) return "3";
    var n = parseInt(s, 10);
    if (!isNaN(n)) {
      if (n <= 0) return "0";
      if (n === 1) return "1";
      if (n === 2) return "2";
      if (n >= 3) return "3";
    }
    return null;
  }

  function findTopicIdByName(subjectId, topicName) {
    if (!window.YksMufredatApi || !subjectId || !topicName) return "";
    var tn = slugTr(topicName);
    if (!tn) return "";
    var list = window.YksMufredatApi.getTopics(subjectId) || [];
    for (var i = 0; i < list.length; i++) {
      if (slugTr(list[i].name) === tn) return String(list[i].id || "");
    }
    for (var j = 0; j < list.length; j++) {
      var nm = slugTr(list[j].name);
      if (nm && (nm.indexOf(tn) >= 0 || tn.indexOf(nm) >= 0)) return String(list[j].id || "");
    }
    return "";
  }

  function findConceptIdByName(subjectId, topicId, conceptName) {
    if (!window.YksMufredatApi || !subjectId || !topicId || !conceptName) return "";
    var cn = slugTr(conceptName);
    if (!cn) return "";
    var list = window.YksMufredatApi.getConcepts(subjectId, topicId) || [];
    for (var i = 0; i < list.length; i++) {
      if (slugTr(list[i].name) === cn) return String(list[i].id || "");
    }
    for (var j = 0; j < list.length; j++) {
      var nm = slugTr(list[j].name);
      if (nm && (nm.indexOf(cn) >= 0 || cn.indexOf(nm) >= 0)) return String(list[j].id || "");
    }
    return "";
  }

  function splitExcelTopicConceptLabels(topicName, conceptName, subjectId) {
    var topic = String(topicName || "").trim();
    var concept = String(conceptName || "").trim();
    if (topic && !concept) {
      var parts = topic.split(/\s*(?:\||>|»|—|–|-|:|;)\s*/);
      if (parts.length >= 2) {
        topic = (parts[0] || "").trim();
        concept = parts.slice(1).join(" ").trim();
      }
    }
    topic = stripSubjectFromTopicLabel(topic, subjectId);
    return { topic: topic, concept: concept };
  }

  function stripSubjectFromTopicLabel(topicName, subjectId) {
    var t = String(topicName || "").trim();
    if (!t || !subjectId) return t;
    var subName = subjectShortLabel(subjectId);
    if (!subName) return t;
    var prefixes = [subName + " — ", subName + " - ", subName + " | ", subName + ": "];
    var pi;
    for (pi = 0; pi < prefixes.length; pi++) {
      if (t.indexOf(prefixes[pi]) === 0) return t.slice(prefixes[pi].length).trim();
    }
    var parts = t.split(/\s*(?:—|–|-|\||>)\s*/);
    if (parts.length >= 2 && slugTr(parts[0]) === slugTr(subName)) {
      return parts.slice(1).join(" ").trim();
    }
    return t;
  }

  function injectFreeTextSelectOption(sel, label) {
    if (!sel || !label) return "";
    var v = "__xlsx__" + slugTr(label).replace(/\s+/g, "_");
    if (!optionHasValue(sel, v)) {
      var o = document.createElement("option");
      o.value = v;
      o.textContent = label;
      sel.appendChild(o);
    }
    sel.value = v;
    sel.disabled = false;
    return v;
  }

  function applyFreeTextKonuKavramToRow(tr, idx, yazi) {
    var konuSel = tr.querySelector(".kdy-muf-sel--konu");
    var kavSel = tr.querySelector(".kdy-muf-sel--kavram");
    var meta = examByIndex[idx];
    var sid = meta ? meta.subjectId : "";
    if (!konuSel || konuSel.disabled || !yazi) return false;

    var parts = String(yazi).split(/\s*—\s*/);
    var topicLabel = stripSubjectFromTopicLabel((parts[0] || "").trim(), sid);
    var conceptLabel = parts.length > 1 ? parts.slice(1).join(" — ").trim() : "";

    var tid =
      findTopicIdByName(sid, topicLabel) ||
      (window.DenemeKonuBulk && window.DenemeKonuBulk.matchKonuSelectValue
        ? window.DenemeKonuBulk.matchKonuSelectValue(konuSel, topicLabel)
        : "");
    if (tid) {
      konuSel.value = String(tid).trim();
      var cid = "";
      if (conceptLabel) {
        populateKavramSelect(kavSel, sid, tid, "");
        cid =
          findConceptIdByName(sid, tid, conceptLabel) ||
          (window.DenemeKonuBulk && window.DenemeKonuBulk.matchSelectValue
            ? window.DenemeKonuBulk.matchSelectValue(kavSel, conceptLabel)
            : "");
        if (cid) kavSel.value = String(cid).trim();
      }
      if (sid && tid && cid) matrix.konu[idx] = sid + "|" + tid + "|" + cid;
      else if (sid && tid) matrix.konu[idx] = sid + "|" + tid;
      matrix.konuYazi[idx] = "";
      return true;
    }

    injectFreeTextSelectOption(konuSel, topicLabel || yazi);
    if (conceptLabel && kavSel) {
      populateKavramSelect(kavSel, sid, konuSel.value, "");
      injectFreeTextSelectOption(kavSel, conceptLabel);
    }
    return false;
  }

  function applyExcelKonuKavramToMatrix(idx, bundle) {
    var meta = examByIndex && examByIndex[idx];
    var sid = meta ? meta.subjectId : "";
    var labels = resolveExcelMatrixLabels(bundle, sid);
    var topicName = labels.topic;
    var conceptName = labels.concept;
    matrix.konuYazi[idx] = "";

    if (!topicName && !conceptName) return;

    var resolved = findTopicAndConceptByLabel(sid, topicName);
    var tid = resolved.topicId;
    var cid = resolved.conceptId;
    if (tid && conceptName && !cid) {
      cid = findConceptIdByName(sid, tid, conceptName);
    }

    if (tid) {
      if (sid && tid && cid) matrix.konu[idx] = sid + "|" + tid + "|" + cid;
      else if (sid && tid) matrix.konu[idx] = sid + "|" + tid;
      else matrix.konu[idx] = sid || "";
      return;
    }

    matrix.konuYazi[idx] = conceptName ? topicName + " — " + conceptName : topicName;
    matrix.konu[idx] = sid || "";
  }

  function refineExcelKonuKavramAfterRender() {
    var tb = document.getElementById("kdy-matrix-tbody");
    if (!tb) return;
    var rows = tb.querySelectorAll("tr.kdy-mrow");
    for (var r = 0; r < rows.length; r++) {
      var tr = rows[r];
      var idx = parseInt(tr.getAttribute("data-qindex"), 10);
      if (isNaN(idx) || idx < 0 || idx >= matrix.n) continue;
      var raw = (matrix.konu[idx] || "").trim();
      var seg = raw.split("|");
      if (seg.length >= 2 && seg[1] && seg[1].indexOf("__xlsx__") !== 0) continue;
      var yazi = (matrix.konuYazi[idx] || "").trim();
      if (!yazi) continue;
      applyFreeTextKonuKavramToRow(tr, idx, yazi);
    }
  }

  function applyExcelRowsToMatrix(bundles) {
    if (!bundles || !bundles.length) {
      showWpToast("Dosyada aktarılacak satır bulunamadı.", "error");
      return;
    }
    readAllMatrixRowsFromDom();
    if (!examByIndex || !examByIndex.length) {
      renderMatrixTable();
    }

    for (var i = 0; i < bundles.length; i++) {
      var bundle = bundles[i];
      if (!bundle || !bundle.norm) continue;

      var qNoRaw = pickExcelField(bundle, ["Soru No"], ["soruno", "soru", "no", "sorunumarasi", "qno"]);
      var qNo = parseInt(String(qNoRaw || "").trim(), 10);
      if (isNaN(qNo) || qNo <= 0) qNo = i + 1;
      var idx = qNo - 1;
      if (idx < 0 || idx >= matrix.n) continue;

      var ans = parseAnswer(pickExcelField(bundle, ["Doğru Cevap"], ["dogrucevap", "cevap", "dogru", "correctanswer"]));
      if (ans) matrix.cevap[idx] = ans;

      var z = parseDifficulty(pickExcelField(bundle, ["Zorluk"], ["zorluk", "difficulty"]));
      if (z != null) matrix.zorluk[idx] = z;

      try {
        applyExcelKonuKavramToMatrix(idx, bundle);
      } catch (e) {}
    }

    renderMatrixTable();
    refineExcelKonuKavramAfterRender();
    showWpToast("Başarıyla aktarıldı", "success");
    setExcelWizard(false);
  }

  function readExcelFileAndImport(file) {
    if (!file) return;
    if (!window.XLSX) {
      showWpToast("Excel kütüphanesi yüklenemedi. İnternet bağlantısını kontrol edin.", "error");
      return;
    }
    var name = String(file.name || "");
    var isCsv = /\.csv$/i.test(name) || (file.type && String(file.type).toLowerCase().indexOf("csv") >= 0);

    var reader = new FileReader();
    reader.onerror = function () {
      showWpToast("Dosya okunamadı.", "error");
    };
    reader.onload = function (ev) {
      try {
        var data = ev.target.result;
        var wb = isCsv
          ? window.XLSX.read(String(data || ""), { type: "string" })
          : window.XLSX.read(data, { type: "array" });
        var sheetName = wb.SheetNames && wb.SheetNames[0];
        if (!sheetName) {
          showWpToast("Excel sayfası bulunamadı.", "error");
          return;
        }
        var ws = wb.Sheets[sheetName];
        var json = window.XLSX.utils.sheet_to_json(ws, { defval: "" });
        excelImportBundles = json.map(buildExcelRowBundle);
        renderExcelPreviewTable();
        if (document.getElementById("kdy-excel-preview")) {
          setExcelWizard(true);
          showWpToast("Dosya okundu — önizlemeyi kontrol edin.", "success");
        } else {
          applyExcelRowsToMatrix(excelImportBundles);
        }
      } catch (err) {
        showWpToast("Dosya formatı okunamadı. Şablonu indirip tekrar deneyin.", "error");
      }
    };
    if (isCsv) reader.readAsText(file, "utf-8");
    else reader.readAsArrayBuffer(file);
  }

  function renderList() {
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
        '<div class="kdy-kebab">' +
        '<button type="button" class="kdy-kebab__btn" data-kdy-kebab aria-expanded="false" aria-haspopup="menu" aria-label="Diğer işlemler">' +
        ICON_KEBAB +
        "</button>" +
        '<ul class="kdy-kebab__menu opacity-0 scale-95 pointer-events-none" role="menu" hidden>' +
        '<li><button type="button" class="kdy-kebab__item" role="menuitem" data-kdy-act="optik">' +
        ICON_OPTIK +
        'Matris / Optik</button></li>' +
        '<li><button type="button" class="kdy-kebab__item" role="menuitem" data-kdy-act="kopyala">' +
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>' +
        'Kopyala</button></li>' +
        '<li><button type="button" class="kdy-kebab__item" role="menuitem" data-kdy-act="ayarlar">' +
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 1v2"/><path d="M12 21v2"/><path d="M4.22 4.22l1.42 1.42"/><path d="M18.36 18.36l1.42 1.42"/><path d="M1 12h2"/><path d="M21 12h2"/><path d="M4.22 19.78l1.42-1.42"/><path d="M18.36 5.64l1.42-1.42"/><circle cx="12" cy="12" r="3"/></svg>' +
        'Yayın ayarları</button></li>' +
        '<li><div class="kdy-kebab__sep" role="separator" aria-hidden="true"></div></li>' +
        '<li><button type="button" class="kdy-kebab__item kdy-kebab__item--danger" role="menuitem" data-kdy-act="sil">' +
        ICON_DELETE +
        'Sil</button></li>' +
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
      tarih: tarih,
      saat: saat,
      sinav: sinav,
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
        list[idx] = Object.assign({}, prev, payload, { id: eid });
      } else {
        list.unshift(Object.assign({}, payload, { id: "kd-" + Date.now() }));
      }
      editingExamId = null;
    } else {
      list.unshift(Object.assign({}, payload, { id: "kd-" + Date.now() }));
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

    document.getElementById("kdy-open-modal") &&
      document.getElementById("kdy-open-modal").addEventListener("click", function () {
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
        var excelOv = document.getElementById("kdy-excel-overlay");
        if (excelOv && excelOv.classList.contains("is-open")) {
          setExcelWizard(false);
          e.preventDefault();
          return;
        }
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

    // Excel Wizard (2. adım)
    var excelOpen = document.getElementById("kdy-excel-open");
    if (excelOpen) {
      excelOpen.addEventListener("click", function () {
        setExcelWizard(true);
      });
    }
    var excelClose = document.getElementById("kdy-excel-close");
    if (excelClose) excelClose.addEventListener("click", function () { setExcelWizard(false); });
    var excelOverlay = document.getElementById("kdy-excel-overlay");
    if (excelOverlay) {
      excelOverlay.addEventListener("click", function (e) {
        if (e.target === excelOverlay) setExcelWizard(false);
      });
    }
    var excelDownload = document.getElementById("kdy-excel-download");
    if (excelDownload) excelDownload.addEventListener("click", makeExcelTemplateAndDownload);
    var excelImportCard = document.getElementById("kdy-excel-import");
    var excelFile = document.getElementById("kdy-excel-file");
    if (excelImportCard && excelFile) {
      // input tüm kartı kapladığı için click hem input'ta hem kartta tetiklenebiliyor.
      // Bu da dosya seçiciyi iki kez açtırabiliyor. Bunu engelle.
      excelFile.addEventListener("click", function (e) {
        e.stopPropagation();
      });
      excelImportCard.addEventListener("click", function (e) {
        if (e && e.target === excelFile) return;
        try { excelFile.click(); } catch (err) {}
      });
      excelFile.addEventListener("change", function () {
        var f = excelFile.files && excelFile.files[0];
        if (!f) return;
        readExcelFileAndImport(f);
        excelFile.value = "";
      });
    }
    var excelApply = document.getElementById("kdy-excel-apply");
    if (excelApply) {
      excelApply.addEventListener("click", function () {
        if (!excelImportBundles.length) {
          showWpToast("Önce bir Excel dosyası seçin.", "error");
          return;
        }
        applyExcelRowsToMatrix(excelImportBundles);
      });
    }

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

    // Portal edilen dropdown menü aksiyonları (tbody delegation artık yakalayamaz)
    document.addEventListener("click", function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var btn = t.closest(".kdy-kebab__menu [data-kdy-act]");
      if (!btn) return;
      var menu = btn.closest(".kdy-kebab__menu");
      var id = menu && menu.dataset ? menu.dataset.kdyId : "";
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
    }, true);

    ["kdy-filter-search", "kdy-filter-durum", "kdy-filter-sinav"].forEach(function (fid) {
      var fel = document.getElementById(fid);
      if (!fel) return;
      fel.addEventListener("input", renderList);
      fel.addEventListener("change", renderList);
    });

    window.addEventListener("examResults:change", renderList);
    window.addEventListener("storage", function (ev) {
      if (ev && ev.key === "examResults") renderList();
    });
  }

  function boot() {
    if (!window.YksMufredatApi) {
      window.console && window.console.warn("YksMufredatApi yok; yks-mufredat.js yüklenmeli.");
    }
    if (!window.getExamLayout) {
      window.console && window.console.warn("getExamLayout yok; deneme-exam-layout.js yüklenmeli.");
    }
    bind();
    renderList();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
