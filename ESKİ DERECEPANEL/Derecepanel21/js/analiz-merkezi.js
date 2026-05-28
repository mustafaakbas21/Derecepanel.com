/**
 * Analiz Merkezi — examResults (LocalStorage) yardımcıları
 * Ortalama net, öğrenci geçmişi, tahmin ve Apex trend serisi üretimi.
 */
(function (global) {
  "use strict";

  function examResultsStorageKey() {
    try {
      var k = global && global.__AnalizMerkeziExamResultsKey;
      if (k != null && String(k).trim()) return String(k).trim();
    } catch (e0) {}
    return "examResults";
  }

  function getExamResults() {
    try {
      var raw = localStorage.getItem(examResultsStorageKey());
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function filterByExamId(rows, examId) {
    if (examId == null || examId === "") return [];
    var eid = String(examId);
    return (rows || []).filter(function (r) {
      return r && String(r.examId) === eid;
    });
  }

  /** Ortalama net; boş → 0, 2 ondalık */
  function averageNet(rows) {
    var nets = (rows || [])
      .map(function (r) {
        return Number(r && r.net);
      })
      .filter(function (n) {
        return !isNaN(n);
      });
    if (!nets.length) return 0;
    var sum = nets.reduce(function (a, b) {
      return a + b;
    }, 0);
    return Math.round((sum / nets.length) * 100) / 100;
  }

  function parseTime(iso) {
    if (!iso) return 0;
    var t = Date.parse(String(iso));
    return isNaN(t) ? 0 : t;
  }

  function filterStudentHistory(allResults, studentId) {
    var sid = studentId == null ? "" : String(studentId);
    return (allResults || []).filter(function (r) {
      return r && String(r.studentId) === sid;
    });
  }

  /**
   * examMeta: { [examId]: { date: string, name: string } }
   * Önce savedAt, yoksa examMeta tarihi; en eski → en yeni.
   */
  function sortStudentHistoryByDate(history, examMeta) {
    var meta = examMeta || {};
    return history.slice().sort(function (a, b) {
      var ta =
        parseTime(a.savedAt) ||
        parseTime((meta[a.examId] || {}).date) ||
        parseTime(a.date) ||
        0;
      var tb =
        parseTime(b.savedAt) ||
        parseTime((meta[b.examId] || {}).date) ||
        parseTime(b.date) ||
        0;
      if (ta !== tb) return ta - tb;
      return String(a.examId || "").localeCompare(String(b.examId || ""));
    });
  }

  function realNetsFromHistory(sortedHistory) {
    return sortedHistory.map(function (r) {
      return Number(r.net != null ? r.net : 0) || 0;
    });
  }

  function clampNet(x) {
    return Math.max(0, Math.min(120, x));
  }

  /**
   * Son 2–3 denemedeki adım ortalaması ile ivme; 1 sınav → +0.5 ivme.
   */
  function predictNextThreeNets(realNets) {
    var a = realNets || [];
    var n = a.length;
    if (n === 0) return [0, 0, 0];
    var last = a[n - 1];
    var delta = 0;
    if (n >= 3) {
      var d1 = a[n - 1] - a[n - 2];
      var d2 = a[n - 2] - a[n - 3];
      delta = (d1 + d2) / 2;
    } else if (n === 2) {
      delta = a[1] - a[0];
    } else {
      delta = 0.5;
    }
    var p1 = clampNet(last + delta);
    var p2 = clampNet(p1 + delta);
    var p3 = clampNet(p2 + delta);
    return [p1, p2, p3];
  }

  function shortLabel(name, idx) {
    var s = String(name || "").trim() || "S" + (idx + 1);
    if (s.length > 12) return s.slice(0, 11) + "…";
    return s;
  }

  function categoryLabelForRow(r, idx, examMeta) {
    var m = examMeta && r && r.examId ? examMeta[r.examId] : null;
    var name = (m && m.name) || (r && r.examName) || (r && r.name) || "";
    return shortLabel(name, idx);
  }

  /**
   * ApexCharts için kategoriler + iki seri (gerçek / tahmin).
   */
  function buildTrendChartData(studentId, examMeta) {
    var all = getExamResults();
    var hist = sortStudentHistoryByDate(filterStudentHistory(all, studentId), examMeta);
    var nets = realNetsFromHistory(hist);
    var pred = predictNextThreeNets(nets);
    var n = nets.length;

    var categories = [];
    var i;
    for (i = 0; i < n; i++) {
      categories.push(categoryLabelForRow(hist[i], i, examMeta));
    }
    categories.push("+1", "+2", "+3");

    var L = categories.length;
    var actualSeries = new Array(L);
    var forecastSeries = new Array(L);
    for (i = 0; i < L; i++) {
      actualSeries[i] = null;
      forecastSeries[i] = null;
    }
    for (i = 0; i < n; i++) {
      actualSeries[i] = nets[i];
    }
    if (n > 0) {
      forecastSeries[n - 1] = nets[n - 1];
    }
    if (L >= n + 3) {
      forecastSeries[n] = pred[0];
      forecastSeries[n + 1] = pred[1];
      forecastSeries[n + 2] = pred[2];
    }

    var lo = Math.min(pred[0], pred[1], pred[2]);
    var hi = Math.max(pred[0], pred[1], pred[2]);
    var lastNet = n ? nets[n - 1] : 0;
    var direction =
      n === 0 ? "veri yok" : pred[2] > lastNet + 0.01 ? "yükselişte" : pred[2] < lastNet - 0.01 ? "düşüşte" : "sabit";
    var forecastText =
      n === 0
        ? "Bu öğrenci için sınav geçmişi yok; tahmin <b>0–" + hi.toFixed(1) + " net</b> referans aralığıdır."
        : "Otonom tahmin (sonraki 3 deneme): <b>" +
          lo.toFixed(1) +
          "–" +
          hi.toFixed(1) +
          " net</b> · trend <b>" +
          direction +
          "</b>.";

    return {
      categories: categories,
      actualSeries: actualSeries,
      forecastSeries: forecastSeries,
      forecastText: forecastText,
      realNets: nets,
      predictedNets: pred,
    };
  }

  global.AnalizMerkeziLS = {
    getExamResults: getExamResults,
    filterByExamId: filterByExamId,
    averageNet: averageNet,
    filterStudentHistory: filterStudentHistory,
    sortStudentHistoryByDate: sortStudentHistoryByDate,
    realNetsFromHistory: realNetsFromHistory,
    predictNextThreeNets: predictNextThreeNets,
    buildTrendChartData: buildTrendChartData,
  };
})(typeof window !== "undefined" ? window : this);

// Beta uyarı modalı — her Analiz sayfası ziyaretinde gösterilir (sessionStorage yok)
function showBetaWarningModal() {
  const modal = document.getElementById("betaWarningModal");
  if (!modal) return;
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

window.closeBetaModal = function () {
  const modal = document.getElementById("betaWarningModal");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
};

function initBetaWarningModal() {
  showBetaWarningModal();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initBetaWarningModal);
} else {
  initBetaWarningModal();
}

// BFCache ile geri dönüşte DOMContentLoaded tetiklenmez; yine göster
window.addEventListener("pageshow", function () {
  showBetaWarningModal();
});
