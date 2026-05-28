/**
 * Öğrencilerim — YÖK Atlas ile hedef üniversite / bölüm dropdown'ları (pages/ogrencilerim.html)
 * Veri: ../yok-atlas-lisans.json + ../yok-atlas-onlisans.json → window.yokAtlasData (tek sefer fetch)
 */
(function () {
  var dataPromise = null;
  var univSel;
  var bolumSel;
  var hiddenGoal;
  var formStudent;

  function $(id) {
    return document.getElementById(id);
  }

  function atlasHref(name) {
    try {
      return new URL("../" + name, window.location.href).href;
    } catch (_) {
      return "../" + name;
    }
  }

  function ensureYokAtlasData() {
    if (window.yokAtlasData && Array.isArray(window.yokAtlasData) && window.yokAtlasData.length) {
      return Promise.resolve(window.yokAtlasData);
    }
    if (dataPromise) return dataPromise;
    dataPromise = Promise.all([
      fetch(atlasHref("yok-atlas-lisans.json")).then(function (r) {
        if (!r.ok) throw new Error("Lisans HTTP " + r.status);
        return r.json();
      }),
      fetch(atlasHref("yok-atlas-onlisans.json")).then(function (r) {
        if (!r.ok) throw new Error("Önlisans HTTP " + r.status);
        return r.json();
      }),
    ])
      .then(function (pair) {
        var a = Array.isArray(pair[0]) ? pair[0] : [];
        var b = Array.isArray(pair[1]) ? pair[1] : [];
        window.yokAtlasData = a.concat(b);
        return window.yokAtlasData;
      })
      .catch(function (err) {
        console.error("[Öğrencilerim] YÖK Atlas yüklenemedi:", err);
        dataPromise = null;
        throw err;
      });
    return dataPromise;
  }

  function uniqueUniversities(data) {
    var set = {};
    for (var i = 0; i < data.length; i++) {
      var u = data[i].Universite;
      if (u == null) continue;
      var t = String(u).trim();
      if (t) set[t] = true;
    }
    return Object.keys(set).sort(function (a, b) {
      return a.localeCompare(b, "tr");
    });
  }

  function uniqueBolumsForUni(data, uni) {
    if (!uni) return [];
    var set = {};
    for (var i = 0; i < data.length; i++) {
      if (data[i].Universite !== uni) continue;
      var b = data[i].Bolum;
      if (b == null) continue;
      var t = String(b).trim();
      if (t) set[t] = true;
    }
    return Object.keys(set).sort(function (a, b) {
      return a.localeCompare(b, "tr");
    });
  }

  function fillUniversities() {
    if (!univSel || !window.yokAtlasData) return;
    var list = uniqueUniversities(window.yokAtlasData);
    var cur = univSel.value;
    univSel.innerHTML = '<option value="">Üniversite Seçin...</option>';
    for (var j = 0; j < list.length; j++) {
      var opt = document.createElement("option");
      opt.value = list[j];
      opt.textContent = list[j];
      univSel.appendChild(opt);
    }
    if (cur && list.indexOf(cur) !== -1) univSel.value = cur;
  }

  function resetBolumDisabled() {
    if (!bolumSel) return;
    bolumSel.disabled = true;
    bolumSel.innerHTML = '<option value="" disabled selected>Önce Üniversite Seçin...</option>';
  }

  function fillBolumsForUni(uni) {
    if (!bolumSel) return;
    if (!uni) {
      resetBolumDisabled();
      return;
    }
    var list = uniqueBolumsForUni(window.yokAtlasData, uni);
    bolumSel.disabled = false;
    bolumSel.innerHTML = '<option value="">Bölüm seçin...</option>';
    for (var k = 0; k < list.length; k++) {
      var o = document.createElement("option");
      o.value = list[k];
      o.textContent = list[k];
      bolumSel.appendChild(o);
    }
  }

  function updateHiddenGoal() {
    if (!hiddenGoal) return;
    var u = univSel && univSel.value ? univSel.value.trim() : "";
    var b = bolumSel && bolumSel.value ? bolumSel.value.trim() : "";
    if (u && b) hiddenGoal.value = u + " — " + b;
    else if (u) hiddenGoal.value = u;
    else hiddenGoal.value = "";
  }

  function onUnivChange() {
    var uni = univSel ? univSel.value.trim() : "";
    fillBolumsForUni(uni);
    updateHiddenGoal();
  }

  function wireElements() {
    univSel = $("hedefUniversite");
    bolumSel = $("hedefBolum");
    hiddenGoal = $("form-student-goal");
    formStudent = $("form-student");
    if (!univSel || !bolumSel || !hiddenGoal) return false;

    univSel.addEventListener("change", onUnivChange);
    bolumSel.addEventListener("change", updateHiddenGoal);

    if (formStudent) {
      formStudent.addEventListener(
        "submit",
        function () {
          updateHiddenGoal();
        },
        true
      );
    }

    return true;
  }

  function prefetchAtlas() {
    ensureYokAtlasData()
      .then(function () {
        fillUniversities();
      })
      .catch(function () {
        /* console zaten ensure içinde */
      });
  }

  window.dpStudentHedefAfterFormReset = function () {
    if (!univSel || !bolumSel || !hiddenGoal) return;
    univSel.value = "";
    resetBolumDisabled();
    hiddenGoal.value = "";
  };

  window.dpStudentHedefApplyGoal = function (goalStr) {
    var str = String(goalStr || "").trim();
    if (!univSel || !bolumSel || !hiddenGoal) {
      if (hiddenGoal) hiddenGoal.value = str;
      return;
    }
    if (!str) {
      window.dpStudentHedefAfterFormReset();
      return;
    }
    ensureYokAtlasData()
      .then(function () {
        fillUniversities();
        var parts = str
          .split(/\s*[–—]\s*/)
          .map(function (x) {
            return String(x || "").trim();
          })
          .filter(Boolean);
        if (parts.length < 2) {
          hiddenGoal.value = str;
          univSel.value = "";
          resetBolumDisabled();
          return;
        }
        var A = parts[0];
        var B = parts[1];
        var uniOpts = [].map.call(univSel.options, function (o) {
          return o.value;
        });
        function hasUni(u) {
          return u && uniOpts.indexOf(u) !== -1;
        }
        var uni = "";
        var bol = "";
        if (hasUni(A)) {
          uni = A;
          bol = B;
        } else if (hasUni(B)) {
          uni = B;
          bol = A;
        }
        if (uni) {
          univSel.value = uni;
          fillBolumsForUni(uni);
          var bolOpts = [].map.call(bolumSel.options, function (o) {
            return o.value;
          });
          if (bol && bolOpts.indexOf(bol) !== -1) bolumSel.value = bol;
          else bolumSel.value = "";
          updateHiddenGoal();
        } else {
          univSel.value = "";
          resetBolumDisabled();
          hiddenGoal.value = str;
        }
      })
      .catch(function () {
        hiddenGoal.value = str;
      });
  };

  function boot() {
    if (!wireElements()) return;
    prefetchAtlas();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

/**
 * Elit öğrenci detay modalı (#detayModal) — pages/ogrencilerim.html
 * Tablo «Göz» → window.showDetayModal(ogrenciId)
 */
(function () {
  var STUDENTS_FULL_KEY = "derecepanel_students_full_v1";

  var alanLabels = { tyt: "TYT", sayisal: "Sayısal", esit: "Eşit ağırlık", sozel: "Sözel", dil: "Dil" };
  var genderLabels = {
    kadin: "Kadın",
    erkek: "Erkek",
    belirtmekistemiyorum: "Belirtmek istemiyorum",
  };
  var parentRelLabels = {
    anne: "Anne",
    baba: "Baba",
    vasi: "Vasi / veli vekili",
    diger: "Diğer",
  };

  function $(id) {
    return document.getElementById(id);
  }

  function makeOgrenciRowId(p) {
    var code = String((p && p.studentCode) || "").trim();
    if (code) return code;
    var name = String((p && p.name) || "").trim();
    if (!name) return "ogrenci-" + Date.now().toString(36);
    return (
      name
        .toLowerCase()
        .replace(/ı/g, "i")
        .replace(/ğ/g, "g")
        .replace(/ü/g, "u")
        .replace(/ş/g, "s")
        .replace(/ö/g, "o")
        .replace(/ç/g, "c")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "ogrenci"
    );
  }

  function initialsFromName(name) {
    var parts = String(name || "")
      .split(/\s+/)
      .filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    if (parts.length === 1 && parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0] ? parts[0][0] : "?").toUpperCase();
  }

  function disp(v) {
    var t = v != null ? String(v).trim() : "";
    return t ? t : "Belirtilmedi";
  }

  function splitGoal(goalStr) {
    var str = String(goalStr || "").trim();
    if (!str) return { uni: "", bol: "" };
    var parts = str.split(/\s*[–—]\s*/).map(function (x) {
      return String(x || "").trim();
    });
    if (parts.length < 2) return { uni: str, bol: "" };
    return { uni: parts[0] || "", bol: parts.slice(1).join(" — ") || "" };
  }

  function isMezun(p) {
    var sn = String((p && p.sinifNum) || "").toLowerCase();
    if (sn === "mezun") return true;
    var s = String((p && p.sinif) || "");
    return /mezun/i.test(s);
  }

  function badgeForStudent(p) {
    if (isMezun(p)) {
      return {
        text: "Mezun",
        cls:
          "bg-violet-100 text-violet-800 ring-1 ring-inset ring-violet-500/20 dark:bg-violet-950/80 dark:text-violet-200",
      };
    }
    var st = String((p && p.status) || "aktif").toLowerCase();
    if (st === "donduruldu" || st.indexOf("dondur") !== -1) {
      return {
        text: "Kayıt donduruldu",
        cls:
          "bg-amber-100 text-amber-900 ring-1 ring-inset ring-amber-500/25 dark:bg-amber-950/70 dark:text-amber-100",
      };
    }
    return {
      text: "Aktif",
      cls:
        "bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-500/20 dark:bg-emerald-950/80 dark:text-emerald-200",
    };
  }

  function datasetToPayload(tr) {
    var d = tr.dataset;
    return {
      ogrenciId: d.ogrenciId || "",
      name: d.name || "",
      studentCode: d.studentCode || "",
      tcNo: d.tcNo || "",
      birthDate: d.birthDate || "",
      gender: d.gender || "",
      email: d.email || "",
      phone: d.phone || "",
      sinifBranch: d.sinifBranch || "",
      goal: d.goal || "",
      sinif: d.sinif || "",
      sinifNum: d.sinifNum || "",
      alan: d.alan || "",
      kayit: d.kayit || "",
      status: d.status || "aktif",
      parentRelation: d.parentRelation || "",
      parent: d.parent || "",
      parentPhone: d.parentPhone || "",
      kullaniciAdi: d.kullaniciAdi || "",
      panelSifre: d.panelSifre || "",
    };
  }

  function findStudentInStorage(ogrenciId) {
    try {
      var raw = localStorage.getItem(STUDENTS_FULL_KEY);
      if (!raw) return null;
      var list = JSON.parse(raw);
      if (!Array.isArray(list)) return null;
      var id = String(ogrenciId || "").trim();
      for (var i = 0; i < list.length; i++) {
        var p = list[i];
        if (!p) continue;
        var oid = String(p.ogrenciId || "").trim();
        if (oid && oid === id) return p;
      }
      for (var j = 0; j < list.length; j++) {
        var q = list[j];
        if (!q) continue;
        if (makeOgrenciRowId(q) === id) return q;
      }
    } catch (e) {}
    return null;
  }

  function findStudentRow(ogrenciId) {
    var table = $("students-table");
    if (!table) return null;
    var id = String(ogrenciId || "").trim();
    var rows = table.querySelectorAll("tbody tr[data-student]");
    for (var i = 0; i < rows.length; i++) {
      var tr = rows[i];
      var oid = String((tr.dataset && tr.dataset.ogrenciId) || "").trim();
      if (oid && oid === id) return tr;
    }
    for (var j = 0; j < rows.length; j++) {
      var tr2 = rows[j];
      if (makeOgrenciRowId(datasetToPayload(tr2)) === id) return tr2;
    }
    return null;
  }

  function resolveStudent(ogrenciId) {
    var tr = findStudentRow(ogrenciId);
    if (tr) return datasetToPayload(tr);
    return findStudentInStorage(ogrenciId);
  }

  function showDetayToast(message, ok) {
    var host = $("og-toast-host");
    if (!host) return;
    var el = document.createElement("div");
    el.className = "og-toast" + (ok ? " og-toast--ok" : "");
    el.setAttribute("role", "status");
    el.textContent = message;
    host.appendChild(el);
    setTimeout(function () {
      el.style.opacity = "0";
      el.style.transition = "opacity 0.25s ease";
      setTimeout(function () {
        el.remove();
      }, 280);
    }, 2200);
  }

  function copyTextFromElId(id) {
    var node = $(id);
    if (!node) return Promise.reject();
    var raw = (node.textContent || "").trim();
    if (!raw || raw === "—" || raw === "Belirtilmedi") return Promise.reject(new Error("empty"));
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(raw);
    }
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement("textarea");
        ta.value = raw;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        var ok = document.execCommand("copy");
        document.body.removeChild(ta);
        if (ok) resolve();
        else reject(new Error("execCommand"));
      } catch (err) {
        reject(err);
      }
    });
  }

  var detayModal;
  var detayEscBound = false;

  function closeDetayModal() {
    if (!detayModal) return;
    detayModal.classList.remove("flex");
    detayModal.classList.add("hidden");
    detayModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (detayEscBound) {
      document.removeEventListener("keydown", onDetayKeydown);
      detayEscBound = false;
    }
  }

  function onDetayKeydown(e) {
    if (e.key === "Escape") closeDetayModal();
  }

  function openDetayModal() {
    if (!detayModal) return;
    detayModal.classList.remove("hidden");
    detayModal.classList.add("flex");
    detayModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    if (!detayEscBound) {
      document.addEventListener("keydown", onDetayKeydown);
      detayEscBound = true;
    }
    var title = $("detayModalTitle");
    if (title) title.focus();
  }

  function fillDetayModal(p) {
    var name = disp(p.name);
    var parts = splitGoal(p.goal);
    var sinifLine = disp(p.sinif);
    var br = String(p.sinifBranch || "").trim();
    if (br && sinifLine !== "Belirtilmedi") sinifLine = sinifLine + " · " + br;
    else if (br) sinifLine = br;

    var av = $("detayAvatar");
    if (av) av.textContent = initialsFromName(p.name);

    var title = $("detayModalTitle");
    if (title) title.textContent = name;

    var badge = $("detayStatusBadge");
    if (badge) {
      var b = badgeForStudent(p);
      badge.textContent = b.text;
      badge.className =
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide " + b.cls;
    }

    var tc = $("detayTc");
    if (tc) tc.textContent = disp(p.tcNo);
    var dogum = $("detayDogum");
    if (dogum) dogum.textContent = disp(p.birthDate);
    var phone = $("detayPhone");
    if (phone) phone.textContent = disp(p.phone);
    var email = $("detayEmail");
    if (email) email.textContent = disp(p.email);
    var gender = $("detayGender");
    if (gender) gender.textContent = genderLabels[p.gender] || disp(p.gender);

    var sinifEl = $("detaySinif");
    if (sinifEl) sinifEl.textContent = sinifLine;
    var alanEl = $("detayAlan");
    if (alanEl) alanEl.textContent = alanLabels[p.alan] || disp(p.alan);
    var uniEl = $("detayHedefUni");
    if (uniEl) uniEl.textContent = disp(parts.uni);
    var bolEl = $("detayHedefBolum");
    if (bolEl) bolEl.textContent = parts.bol ? disp(parts.bol) : disp("");

    var veliAd = $("detayVeliAd");
    if (veliAd) veliAd.textContent = disp(p.parent);
    var veliPh = $("detayVeliPhone");
    if (veliPh) veliPh.textContent = disp(p.parentPhone);
    var veliY = $("detayVeliYakin");
    if (veliY) veliY.textContent = parentRelLabels[p.parentRelation] || disp(p.parentRelation);

    var kayit = $("detayKayit");
    if (kayit) kayit.textContent = disp(p.kayit);
    var ogrNo = $("detayOgrNo");
    if (ogrNo) ogrNo.textContent = disp(p.studentCode || p.ogrenciId);
    var kull = $("detayKullanici");
    if (kull) kull.textContent = disp(p.kullaniciAdi);
    var sifre = $("detaySifre");
    if (sifre) sifre.textContent = disp(p.panelSifre);
  }

  function wireDetayModalOnce() {
    if (detayModal && detayModal.dataset.dpWired === "1") return;
    detayModal = $("detayModal");
    if (!detayModal) return;
    detayModal.dataset.dpWired = "1";

    var backdrop = $("detayModalBackdrop");
    var btnX = $("detayModalClose");
    var btnFoot = $("detayModalFooterClose");
    if (backdrop) backdrop.addEventListener("click", closeDetayModal);
    if (btnX) btnX.addEventListener("click", closeDetayModal);
    if (btnFoot) btnFoot.addEventListener("click", closeDetayModal);

    detayModal.addEventListener("click", function (e) {
      if (e.target === detayModal) closeDetayModal();
    });

    detayModal.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-detay-copy-target]");
      if (!btn || !detayModal.contains(btn)) return;
      var tid = btn.getAttribute("data-detay-copy-target");
      if (!tid) return;
      copyTextFromElId(tid).then(
        function () {
          showDetayToast("Kopyalandı", true);
        },
        function () {
          showDetayToast("Kopyalanamadı", false);
        }
      );
    });
  }

  window.showDetayModal = function (ogrenciId) {
    wireDetayModalOnce();
    if (!detayModal) return;
    var p = resolveStudent(ogrenciId);
    if (!p || !String(p.name || "").trim()) {
      showDetayToast("Öğrenci kaydı bulunamadı.", false);
      return;
    }
    fillDetayModal(p);
    openDetayModal();
  };

  function bootDetay() {
    wireDetayModalOnce();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootDetay);
  } else {
    bootDetay();
  }
})();
