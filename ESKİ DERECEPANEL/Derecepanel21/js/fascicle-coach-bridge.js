/**
 * Fasikül / test atama köprüsü — koç (Test Maker) ↔ öğrenci paneli
 * assigned_fascicles_<ogrenciId>  ·  fascicle_results_<ogrenciId>
 */
(function () {
  "use strict";

  function safeJsonParse(raw, fb) {
    try {
      if (raw == null || raw === "") return fb;
      return JSON.parse(raw);
    } catch (e) {
      return fb;
    }
  }

  function assignedKey(ogrenciId) {
    return "assigned_fascicles_" + String(ogrenciId || "").trim();
  }

  function resultsKey(ogrenciId) {
    return "fascicle_results_" + String(ogrenciId || "").trim();
  }

  function readList(key) {
    var v = safeJsonParse(localStorage.getItem(key), []);
    return Array.isArray(v) ? v : [];
  }

  function writeList(key, arr) {
    try {
      localStorage.setItem(key, JSON.stringify(arr || []));
    } catch (e) {}
  }

  window.DereceFascicleBridge = {
    assignedKey: assignedKey,
    resultsKey: resultsKey,

    readAssigned: function (ogrenciId) {
      return readList(assignedKey(ogrenciId));
    },

    readResults: function (ogrenciId) {
      return readList(resultsKey(ogrenciId));
    },

    /**
     * @param {string} ogrenciId — katalog id veya öğrenci kodu
     * @param {object} testData — { id?, title, questionCount, answerKey, template?, assignedBy?, notes? }
     */
    appendAssigned: function (ogrenciId, testData) {
      if (!ogrenciId || !testData) return null;
      var list = this.readAssigned(ogrenciId);
      var rec = Object.assign({}, testData);
      rec.id = rec.id || "fasc-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
      rec.assignedAt = new Date().toISOString();
      rec.status = rec.status || "bekliyor";
      list.push(rec);
      writeList(assignedKey(ogrenciId), list);
      try {
        window.dispatchEvent(new CustomEvent("derece:fascicle-assigned", { detail: { ogrenciId: ogrenciId } }));
      } catch (e2) {}
      return rec;
    },

    /**
     * @param {string} ogrenciId
     * @param {object} result — { fascicleId, title?, correct, wrong, blank, accuracyPct, answersStudent, answerKey, completedAt }
     */
    appendResult: function (ogrenciId, result) {
      if (!ogrenciId || !result) return null;
      var list = this.readResults(ogrenciId);
      var rec = Object.assign({}, result);
      rec.completedAt = rec.completedAt || new Date().toISOString();
      list.push(rec);
      writeList(resultsKey(ogrenciId), list);
      try {
        window.dispatchEvent(new CustomEvent("derece:fascicle-result", { detail: { ogrenciId: ogrenciId } }));
      } catch (e2) {}
      return rec;
    },

    markAssignedStatus: function (ogrenciId, fascicleId, status) {
      var list = this.readAssigned(ogrenciId);
      var ok = false;
      for (var i = 0; i < list.length; i++) {
        if (list[i] && String(list[i].id) === String(fascicleId)) {
          list[i].status = status;
          ok = true;
          break;
        }
      }
      if (ok) writeList(assignedKey(ogrenciId), list);
      return ok;
    },

    /** Koç: katalog id + öğrenci kodu dene */
    readResultsForCoach: function (catalogStudentId) {
      var tries = [];
      if (catalogStudentId) tries.push(String(catalogStudentId).trim());
      var cat = (window.DereceStudentCatalog || []).find(function (s) {
        return s && s.id === catalogStudentId;
      });
      if (cat && cat.code) tries.push(String(cat.code).trim());
      for (var i = 0; i < tries.length; i++) {
        if (!tries[i]) continue;
        var r = this.readResults(tries[i]);
        if (r.length) return { ogrenciId: tries[i], items: r };
      }
      return { ogrenciId: tries[0] || "", items: [] };
    },

    /** Son sonuç özeti metni (yüzde) */
    lastResultSummaryPct: function (catalogStudentId) {
      var pack = this.readResultsForCoach(catalogStudentId);
      var items = pack.items || [];
      if (!items.length) return null;
      var last = items[items.length - 1];
      var p = last.accuracyPct != null ? Number(last.accuracyPct) : null;
      if (p == null || isNaN(p)) return null;
      return Math.round(p);
    },
  };
})();
