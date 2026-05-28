/**
 * Puan Hesaplama — YKS TYT/AYT/YDT tahmini yerleştirme puanı + tahmini sıralama (pages/puan-hesaplama.html)
 *
 * Model (özet):
 *  - TYT puanı ≈ 100 + (Türkçe+Mat netleri)×3,3 + (Sosyal+Fen)×3,4 (satır data-w ile uyumlu).
 *  - AYT blokları: 100 + ilgili derslerin Σ(net×k).
 *  - Yerleştirme tahmini: 0,40×TYT_puanı + 0,60×AYT_puanı + OBP (diploma×5×0,12; yerleşen×0,5 ile yarım).
 *  - Sıralama: 2023–2024 yığılmayı taklit eden statik eğri noktaları arasında lineer interpolasyon.
 *
 * Tercih köprüsü: localStorage key derecepanel_tercih_from_puan_v1
 */
(function () {
  "use strict";

  var LS_KEY = "derecepanel_tercih_from_puan_v1";

  /**
   * [puan, tahminiSıra] — puan artınca sıra küçülür (daha iyi).
   * Veriler eğitim amaçlı yaklaşık referans noktalarıdır; resmi ÖSYM değildir.
   */
  var RANK_CURVES = {
    TYT: [
      [120, 5500000],
      [180, 3500000],
      [250, 1800000],
      [300, 950000],
      [350, 320000],
      [400, 65000],
      [440, 8000],
    ],
    SAY: [
      [160, 3200000],
      [220, 1200000],
      [280, 350000],
      [320, 95000],
      [360, 22000],
      [400, 5500],
      [440, 650],
      [480, 85],
    ],
    EA: [
      [160, 3000000],
      [220, 1100000],
      [280, 380000],
      [320, 150000],
      [350, 120000],
      [380, 52000],
      [400, 45000],
      [430, 12000],
      [470, 900],
      [500, 120],
    ],
    "SÖZ": [
      [150, 4200000],
      [200, 1800000],
      [260, 520000],
      [300, 140000],
      [340, 48000],
      [380, 12000],
      [420, 2200],
      [455, 280],
    ],
    "DİL": [
      [140, 2200000],
      [180, 620000],
      [220, 150000],
      [260, 42000],
      [300, 11000],
      [340, 2800],
      [380, 520],
      [430, 45],
    ],
  };

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function parseInt0(v) {
    if (v === "" || v == null) return null;
    var n = parseInt(String(v), 10);
    return Number.isFinite(n) ? n : null;
  }

  /** Net = Doğru − Yanlış/4; satırda data-q varsa D+Y > q uyarısı için kullanılır */
  function rowNet(dInp, yInp, qMax) {
    var d = parseInt0(dInp.value);
    var y = parseInt0(yInp.value);
    var has = dInp.value !== "" || yInp.value !== "";
    if (!has) return { has: false, net: 0, invalid: false };
    var dv = d == null ? 0 : Math.max(0, d);
    var yv = y == null ? 0 : Math.max(0, y);
    var net =
      window.ScoreCalculator && typeof window.ScoreCalculator.netFromCorrectWrong === "function"
        ? window.ScoreCalculator.netFromCorrectWrong(dv, yv)
        : dv - yv / 4;
    var invalid = false;
    if (qMax != null && qMax > 0 && dv + yv > qMax) invalid = true;
    return { has: true, net: net, invalid: invalid, q: qMax };
  }

  function fmtNet(n) {
    return n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function fmtPuan(n) {
    if (n == null || !Number.isFinite(n)) return "—";
    // Single Source of Truth: aynı küsuratı üretmek için ortak formatter.
    if (window.ScoreCalculator && typeof window.ScoreCalculator.fmtFixed === "function") {
      return window.ScoreCalculator.fmtFixed(n, 3);
    }
    return Number(n).toFixed(3);
  }

  function fmtRank(r) {
    if (r == null || !Number.isFinite(r) || r < 1) return "—";
    return Math.round(r).toLocaleString("tr-TR");
  }

  /** Lineer interpolasyon: curve [[puan, sıra], ...] puan artan */
  function estimateRankFromCurve(curve, score) {
    if (!curve || !curve.length || score == null || !Number.isFinite(score)) return null;
    var c = curve;
    if (score <= c[0][0]) return c[0][1];
    if (score >= c[c.length - 1][0]) return c[c.length - 1][1];
    for (var i = 0; i < c.length - 1; i++) {
      var p0 = c[i][0];
      var r0 = c[i][1];
      var p1 = c[i + 1][0];
      var r1 = c[i + 1][1];
      if (score >= p0 && score <= p1) {
        if (p1 === p0) return r0;
        var t = (score - p0) / (p1 - p0);
        return r0 + t * (r1 - r0);
      }
    }
    return null;
  }

  function weightedBlockFromCard(card) {
    if (!card) return { sum: 0, has: false };
    var rows = $$(".ph-row", card);
    var items = [];
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var w = parseFloat(row.getAttribute("data-w") || "0");
      if (!Number.isFinite(w)) w = 0;
      var dInp = $(".ph-d", row);
      var yInp = $(".ph-y", row);
      if (!dInp || !yInp) continue;
      var q = parseFloat(row.getAttribute("data-q") || "0");
      var qM = Number.isFinite(q) && q > 0 ? q : null;
      var r = rowNet(dInp, yInp, qM);
      items.push({ has: r.has, net: r.net, weight: w });
    }
    if (window.ScoreCalculator && typeof window.ScoreCalculator.weightedSum === "function") {
      return window.ScoreCalculator.weightedSum(items);
    }
    // fallback
    var sum = 0;
    var has = false;
    for (var j = 0; j < items.length; j++) {
      if (items[j].has) has = true;
      sum += (items[j].net || 0) * (items[j].weight || 0);
    }
    return { sum: sum, has: has };
  }

  function tytScoreFromCard(cardTyt) {
    // TYT için data-w yerine ortak katsayıları kullan (tek kaynak).
    if (!cardTyt) return { has: false, score: 0, nets: { turkce: 0, sosyal: 0, matematik: 0, fen: 0 } };
    var rows = $$(".ph-row", cardTyt);
    if (!rows.length) return { has: false, score: 0, nets: { turkce: 0, sosyal: 0, matematik: 0, fen: 0 } };

    function rowNetVal(row) {
      var dInp = $(".ph-d", row);
      var yInp = $(".ph-y", row);
      if (!dInp || !yInp) return { has: false, net: 0 };
      var q = parseFloat(row.getAttribute("data-q") || "0");
      var qM = Number.isFinite(q) && q > 0 ? q : null;
      var r = rowNet(dInp, yInp, qM);
      return { has: r.has, net: r.net };
    }

    // Beklenen sıra: Türkçe, Temel Matematik, Sosyal, Fen
    var tr = rows[0] ? rowNetVal(rows[0]) : { has: false, net: 0 };
    var ma = rows[1] ? rowNetVal(rows[1]) : { has: false, net: 0 };
    var so = rows[2] ? rowNetVal(rows[2]) : { has: false, net: 0 };
    var fe = rows[3] ? rowNetVal(rows[3]) : { has: false, net: 0 };

    var has = !!(tr.has || ma.has || so.has || fe.has);
    var nets = { turkce: tr.net, sosyal: so.net, matematik: ma.net, fen: fe.net };
    if (!has) return { has: false, score: 0, nets: nets };

    if (window.ScoreCalculator && typeof window.ScoreCalculator.calculateTYTScore === "function") {
      return { has: true, score: window.ScoreCalculator.calculateTYTScore(nets.turkce, nets.sosyal, nets.matematik, nets.fen), nets: nets };
    }
    // Fallback (shouldn't happen because score-calculator is included on page)
    return { has: true, score: 100 + nets.turkce * 3.3 + nets.sosyal * 3.4 + nets.matematik * 3.3 + nets.fen * 3.4, nets: nets };
  }

  function cardHasAnyInput(card) {
    if (!card) return false;
    var rows = $$(".ph-row", card);
    for (var i = 0; i < rows.length; i++) {
      var dInp = $(".ph-d", rows[i]);
      var yInp = $(".ph-y", rows[i]);
      if (dInp && yInp && (dInp.value !== "" || yInp.value !== "")) return true;
    }
    return false;
  }

  /** OBP: diploma notu × 5 × 0,12 = not × 0,6; geçen sene yerleşenlerde ×0,5 */
  function obpContribution() {
    var obpEl = $("#ph-obp");
    var half = $("#ph-obp-half");
    var raw = obpEl && obpEl.value !== "" ? parseFloat(String(obpEl.value).replace(",", ".")) : 0;
    if (!Number.isFinite(raw)) raw = 0;
    raw = Math.max(0, Math.min(100, raw));
    var mult = half && half.checked ? 0.5 : 1;
    return raw * 5 * 0.12 * mult;
  }

  /** TYT / AYT ham ölçek: 100 + ağırlıklı net toplamı */
  function blockScore100Plus(block) {
    if (window.ScoreCalculator && typeof window.ScoreCalculator.score100Plus === "function") {
      return window.ScoreCalculator.score100Plus(block);
    }
    return 100 + (block.has ? block.sum : 0);
  }

  /** Yerleştirme tahmini: 0,4×TYT_puanı + 0,6×AYT_puanı + OBP */
  function yerlestirmePuani(tytBlock, aytBlock) {
    var pTyt = blockScore100Plus(tytBlock);
    var pAyt = blockScore100Plus(aytBlock);
    var obp = obpContribution();
    if (window.ScoreCalculator && typeof window.ScoreCalculator.placementScore === "function") {
      return window.ScoreCalculator.placementScore(pTyt, pAyt, obp);
    }
    return 0.4 * pTyt + 0.6 * pAyt + obp;
  }

  function setOut(id, text, sub, rankText) {
    var v = $("#" + id);
    var s = $("#" + id + "-sub");
    var rk = $("#" + id + "-rank");
    if (v) v.textContent = text;
    if (s && sub != null) s.textContent = sub;
    if (rk) rk.textContent = rankText != null && rankText !== "" ? rankText : "";
  }

  function pickPrimaryTipi(yer) {
    var order = ["SAY", "EA", "SÖZ", "DİL", "TYT"];
    var best = "TYT";
    var bestVal = -Infinity;
    for (var i = 0; i < order.length; i++) {
      var k = order[i];
      var x = yer[k];
      if (x != null && typeof x === "number" && isFinite(x) && x > bestVal) {
        bestVal = x;
        best = k;
      }
    }
    return best;
  }

  function updateProgressBars() {
    $$(".ph-row").forEach(function (row) {
      var fill = $(".ph-mini-bar__fill", row);
      if (!fill) return;
      var dInp = $(".ph-d", row);
      var yInp = $(".ph-y", row);
      var q = parseFloat(row.getAttribute("data-q") || "0");
      if (!Number.isFinite(q) || q <= 0) {
        fill.style.width = "0%";
        return;
      }
      var r = rowNet(dInp, yInp, q);
      if (!r.has) {
        fill.style.width = "0%";
        return;
      }
      var pct = Math.min(100, Math.max(0, (r.net / q) * 100));
      fill.style.width = pct.toFixed(1) + "%";
      row.classList.toggle("ph-row--invalid", !!r.invalid);
    });
  }

  window.calculateScores = function calculateScores() {
    var cardTyt = $("#ph-card-tyt");
    var cardSay = $("#ph-card-say");
    var cardEa = $("#ph-card-ea");
    var cardSoz = $("#ph-card-soz");
    var cardYdt = $("#ph-card-ydt");

    $$(".ph-row").forEach(function (row) {
      var dInp = $(".ph-d", row);
      var yInp = $(".ph-y", row);
      var badge = $(".ph-net", row);
      if (!dInp || !yInp || !badge) return;
      var q = parseFloat(row.getAttribute("data-q") || "0");
      var qM = Number.isFinite(q) && q > 0 ? q : null;
      var r = rowNet(dInp, yInp, qM);
      if (!r.has) {
        badge.textContent = "—";
        row.classList.remove("ph-row--invalid");
        return;
      }
      badge.textContent = fmtNet(r.net);
      row.classList.toggle("ph-row--invalid", !!r.invalid);
    });

    updateProgressBars();

    var tytBlock = weightedBlockFromCard(cardTyt); // AYT yerleştirme hesabı için (0,40×TYT) tutuyoruz.
    var sayBlock = weightedBlockFromCard(cardSay);
    var eaBlock = weightedBlockFromCard(cardEa);
    var sozBlock = weightedBlockFromCard(cardSoz);
    var ydtBlock = weightedBlockFromCard(cardYdt);

    var obp = obpContribution();
    var usedTyt = cardHasAnyInput(cardTyt);
    var usedSay = cardHasAnyInput(cardSay);
    var usedEa = cardHasAnyInput(cardEa);
    var usedSoz = cardHasAnyInput(cardSoz);
    var usedYdt = cardHasAnyInput(cardYdt);

    // TYT ham puan: tek kaynaktan (katsayılar ScoreCalculator'da).
    var tyt = tytScoreFromCard(cardTyt);
    var pTyt = tyt.has ? tyt.score : blockScore100Plus(tytBlock);

    function subLine(kind, hamPart, puan) {
      var obpStr = fmtPuan(obp);
      if (kind === "TYT") {
        return "Ham: 100 + " + fmtPuan(tytBlock.sum) + " · OBP: +" + obpStr;
      }
      return (
        "0,40×TYT(" +
        fmtPuan(pTyt) +
        ") + 0,60×" +
        hamPart +
        " · OBP: +" +
        obpStr
      );
    }

    function lineTyt() {
      if (!usedTyt) {
        setOut("out-tyt", "—", "TYT netlerini girin", "");
        return null;
      }
      var val = pTyt + obp;
      var rk = estimateRankFromCurve(RANK_CURVES.TYT, val);
      setOut(
        "out-tyt",
        fmtPuan(val),
        subLine("TYT", "", val),
        rk != null ? "Tahmini sıra: " + fmtRank(rk) : ""
      );
      return val;
    }

    function lineAytMulti(id, used, aytBlock, curveKey, labelShort) {
      if (!used) {
        setOut(id, "—", "Bu puan türü için AYT neti girilmedi", "");
        return null;
      }
      var pAyt = blockScore100Plus(aytBlock);
      var val = yerlestirmePuani(tytBlock, aytBlock);
      var hamPart = labelShort + "(" + fmtPuan(pAyt) + ")";
      var rk = estimateRankFromCurve(RANK_CURVES[curveKey], val);
      setOut(
        id,
        fmtPuan(val),
        subLine("AYT", hamPart, val),
        rk != null ? "Tahmini sıra: " + fmtRank(rk) : ""
      );
      return val;
    }

    var yTyt = lineTyt();
    var ySay = lineAytMulti("out-say", usedSay, sayBlock, "SAY", "AYT-SAY");
    var yEa = lineAytMulti("out-ea", usedEa, eaBlock, "EA", "AYT-EA");
    var ySoz = lineAytMulti("out-soz", usedSoz, sozBlock, "SÖZ", "AYT-SÖZ");
    var yDil = lineAytMulti("out-dil", usedYdt, ydtBlock, "DİL", "YDT");

    window.__phLastScores = {
      tytBlock: tytBlock,
      sayBlock: sayBlock,
      eaBlock: eaBlock,
      sozBlock: sozBlock,
      ydtBlock: ydtBlock,
      pTyt: pTyt,
      obpContribution: obp,
      yer: {
        TYT: yTyt,
        SAY: ySay,
        EA: yEa,
        "SÖZ": ySoz,
        DİL: yDil,
      },
      used: {
        TYT: usedTyt,
        SAY: usedSay,
        EA: usedEa,
        SÖZ: usedSoz,
        DİL: usedYdt,
      },
    };
  };

  function wireInputs() {
    $$('input[type="number"].ph-d, input[type="number"].ph-y, #ph-obp').forEach(function (el) {
      el.addEventListener("input", function () {
        window.calculateScores();
      });
    });
    var half = $("#ph-obp-half");
    if (half) half.addEventListener("change", window.calculateScores);

    var clearBtn = $("#ph-clear-nets");
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        $$(".ph-d, .ph-y").forEach(function (inp) {
          inp.value = "";
        });
        var obp = $("#ph-obp");
        if (obp) obp.value = "";
        if (half) half.checked = false;
        window.calculateScores();
      });
    }
  }

  function goTercih() {
    var s = window.__phLastScores;
    if (!s) {
      window.calculateScores();
      s = window.__phLastScores;
    }
    var tip = pickPrimaryTipi(s.yer);
    var payload = {
      v: 1,
      ts: Date.now(),
      primaryPuanTipi: tip,
      obpContribution: s.obpContribution,
      puanlar: {
        TYT: s.yer.TYT,
        SAY: s.yer.SAY,
        EA: s.yer.EA,
        "SÖZ": s.yer["SÖZ"],
        DİL: s.yer.DİL,
      },
      ham: {
        tyt: s.tytBlock && s.tytBlock.sum,
        say: s.sayBlock && s.sayBlock.sum,
        ea: s.eaBlock && s.eaBlock.sum,
        soz: s.sozBlock && s.sozBlock.sum,
        ydt: s.ydtBlock && s.ydtBlock.sum,
      },
    };
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(payload));
    } catch (e) {}
    window.location.href = "tercih-sihirbazi.html";
  }

  document.addEventListener("DOMContentLoaded", function () {
    wireInputs();
    window.calculateScores();
    var btn = $("#ph-btn-tercih");
    if (btn) btn.addEventListener("click", goTercih);
  });
})();
