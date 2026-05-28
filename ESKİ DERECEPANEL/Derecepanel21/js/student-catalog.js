/**
 * Öğrenci listesi — Öğrencilerim tablosu ve yerel depo (derecepanel_student_catalog_v1) ile senkron.
 */
(function () {
  var LS_KEY = "derecepanel_student_catalog_v1";

  function slugFromRow(tr) {
    var code = (tr.dataset.studentCode || "").trim();
    if (code) {
      return code
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9ğüşıöçĞÜŞİÖÇ\-_.]/g, "");
    }
    var name = (tr.dataset.name || "").trim();
    if (!name) return "";
    var base = name
      .toLowerCase()
      .replace(/ı/g, "i")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return base || "ogrenci";
  }

  function buildListFromTbody(tbody) {
    var list = [];
    var seen = {};
    tbody.querySelectorAll("tr[data-student]").forEach(function (tr) {
      var name = (tr.dataset.name || "").trim();
      if (!name) return;
      var id = slugFromRow(tr);
      if (!id) return;
      var u = id;
      var n = 0;
      while (seen[u]) {
        n += 1;
        u = id + "-" + n;
      }
      seen[u] = true;
      list.push({
        id: u,
        name: name,
        code: (tr.dataset.studentCode || "").trim(),
        alan: (tr.dataset.alan || "tyt").toLowerCase(),
        sube: (tr.dataset.sube || tr.dataset.class || "").trim(),
        coachId: (tr.dataset.coachId || "").trim(),
      });
    });
    return list;
  }

  function persist(list) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(list));
    } catch (e) {}
  }

  function loadStored() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return [];
      var v = JSON.parse(raw);
      return Array.isArray(v) ? v : [];
    } catch (e) {
      return [];
    }
  }

  /** Öğrencilerim tam kayıtları (app.js / ogrencilerim) — katalog boşken haftalık program select'lerini doldurmak için */
  function rowSlugFromFullPayload(p) {
    var code = String((p && p.studentCode) || "").trim();
    if (code) {
      return code
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9ğüşıöçĞÜŞİÖÇ\-_.]/g, "");
    }
    var name = String((p && p.name) || "").trim();
    if (!name) return "";
    return slugFromName(name);
  }

  function buildListFromStudentsFullStorage() {
    var out = [];
    var seen = {};
    var keys = ["derecepanel_students_full_v1", "students"];
    var role = typeof window.dpGetAuthRole === "function" ? window.dpGetAuthRole() : "";
    var coachScope =
      typeof window.dpGetActiveCoachId === "function" ? String(window.dpGetActiveCoachId() || "").trim() : "";
    for (var ki = 0; ki < keys.length; ki++) {
      try {
        var raw = localStorage.getItem(keys[ki]);
        if (!raw) continue;
        var arr = JSON.parse(raw);
        if (!Array.isArray(arr)) continue;
        for (var i = 0; i < arr.length; i++) {
          var p = arr[i];
          if (!p) continue;
          var name = String(p.name || "").trim();
          if (!name) continue;
          if ((role === "coach" || role === "admin") && coachScope) {
            if (String(p.coachId || "").trim() !== coachScope) continue;
          }
          var id = rowSlugFromFullPayload(p);
          if (!id) continue;
          if (seen[id]) continue;
          seen[id] = true;
          out.push({
            id: id,
            name: name,
            code: String(p.studentCode || "").trim(),
            alan: String(p.alan || "tyt")
              .toLowerCase()
              .trim() || "tyt",
            sube: String(p.sinifBranch || p.sinif || p.sube || "").trim(),
            coachId: String(p.coachId || "").trim(),
          });
        }
      } catch (e) {}
    }
    out.sort(function (a, b) {
      return String(a.name || "").localeCompare(String(b.name || ""), "tr");
    });
    return out;
  }

  function mergeCatalogById(primary, secondary) {
    var byId = {};
    (primary || []).forEach(function (s) {
      if (s && s.id) byId[s.id] = s;
    });
    (secondary || []).forEach(function (s) {
      if (s && s.id && !byId[s.id]) byId[s.id] = s;
    });
    return Object.keys(byId)
      .map(function (k) {
        return byId[k];
      })
      .sort(function (a, b) {
        return String(a.name || "").localeCompare(String(b.name || ""), "tr");
      });
  }

  function applyList(list) {
    var byId = {};
    list.forEach(function (s) {
      if (s && s.id) byId[s.id] = s;
    });
    window.DereceStudentCatalog = list;
    window.DereceStudentCatalogById = byId;
  }

  /** Öğrenci no (code) olanlar; aynı numarada tek kayıt — atama / randevu dropdown'ları için */
  function studentsWithUniqueCode(list) {
    var byCode = {};
    var out = [];
    (list || []).forEach(function (s) {
      if (!s) return;
      var code = String(s.code || "").trim();
      if (!code) return;
      var key = code.toLowerCase();
      if (byCode[key]) return;
      byCode[key] = true;
      out.push(s);
    });
    out.sort(function (a, b) {
      return String(a.name || "").localeCompare(String(b.name || ""), "tr");
    });
    return out;
  }

  window.getDereceStudentsWithUniqueCode = function () {
    return studentsWithUniqueCode(window.DereceStudentCatalog || []);
  };

  window.syncDereceStudentCatalog = function () {
    var tbody = document.getElementById("students-tbody");
    var fromDom = tbody ? buildListFromTbody(tbody) : [];
    var stored = loadStored();
    var fromFull = buildListFromStudentsFullStorage();
    // DOM kaynağı tabloyu persist eder; ama tablo boşsa localStorage'daki veriyi EZME.
    var list;
    if (tbody && fromDom.length) {
      list = fromDom;
      persist(list);
    } else {
      list = mergeCatalogById(stored, fromFull);
      if (fromFull.length && list.length > (stored && stored.length ? stored.length : 0)) {
        try {
          persist(list);
        } catch (e3) {}
      }
    }
    applyList(list);
  };

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

  /** Öğrenci ana çerçevesi veya onun iframe'i: yalnızca currentUser satırı (kurum listesi sızmaz). */
  function applyCatalogStudentShellOnly() {
    try {
      var raw = localStorage.getItem("currentUser");
      if (!raw) {
        applyList([]);
        return;
      }
      var u = JSON.parse(raw);
      var code = String(u.studentCode || "").trim();
      var name = String(u.name || "").trim();
      var canon = String(u.id || u.ogrenciId || "").trim();
      var id = canon || (code ? code.toLowerCase().replace(/\s+/g, "-") : slugFromName(name));
      applyList([
        {
          id: id,
          name: name || "Öğrenci",
          code: code,
          alan: String((u.alan || "tyt") || "tyt")
            .toLowerCase()
            .trim() || "tyt",
          sube: String(u.sube || u.class || "").trim(),
          coachId: String(u.coachId || "").trim(),
        },
      ]);
    } catch (e) {
      applyList([]);
    }
  }

  function isStudentPanelEmbed() {
    try {
      var path = (window.location.pathname || "").replace(/\\/g, "/").toLowerCase();
      if (path.indexOf("ogrenci-panel") !== -1) return true;
      if (window.self !== window.top) {
        var par = (window.parent.location.pathname || "").replace(/\\/g, "/").toLowerCase();
        return par.indexOf("ogrenci-panel") !== -1;
      }
    } catch (e2) {
      return false;
    }
    return false;
  }

  /** Panel iframe: tam DOM taraması yok; öğretmen tablosu yoksa hafif shell. */
  window.ensureDereceStudentCatalog = function () {
    if (isStudentPanelEmbed()) {
      if (!window.DereceStudentCatalog || !window.DereceStudentCatalog.length) {
        applyCatalogStudentShellOnly();
      }
      return window.DereceStudentCatalog || [];
    }
    return window.syncDereceStudentCatalog();
  };

  function bootCatalog() {
    window.ensureDereceStudentCatalog();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootCatalog);
  } else {
    bootCatalog();
  }
})();
