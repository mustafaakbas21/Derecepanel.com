/**
 * Score Calculator (Single Source of Truth)
 * -----------------------------------------
 * Ortak puan hesaplama modülü: katsayılar ve matematik tek yerde.
 * Çıktılar farklı sayfalarda birebir aynı küsuratı vermelidir.
 *
 * Global API: window.ScoreCalculator
 */
(function () {
  "use strict";

  var CONST = {
    TYT_BASE: 100,
    TYT_TURKCE: 3.3,
    TYT_MAT: 3.3,
    TYT_SOSYAL: 3.4,
    TYT_FEN: 3.4,
    NET_WRONG_PENALTY: 4, // Net = D - Y/4
    PLACE_TYT_W: 0.4,
    PLACE_AYT_W: 0.6,
  };

  function toNum(v) {
    var n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  function roundTo(n, digits) {
    var d = digits == null ? 3 : digits;
    var pow = Math.pow(10, d);
    // floating drift azaltmak için +EPS
    return Math.round((toNum(n) + Number.EPSILON) * pow) / pow;
  }

  function fmtFixed(n, digits) {
    var d = digits == null ? 3 : digits;
    var x = toNum(n);
    if (!Number.isFinite(x)) return "—";
    return roundTo(x, d).toFixed(d);
  }

  function parseDynHyphen(str) {
    // "12-3-8.25" → { d, y, n } (n = üçüncü alan; puan için yalnızca d,y kullanılır)
    try {
      var p = String(str || "").split("-");
      return { d: toNum(p[0]), y: toNum(p[1]), n: toNum(p[2]) };
    } catch (e) {
      return { d: 0, y: 0, n: 0 };
    }
  }

  function netFromDyn(dyn) {
    var d = toNum(dyn && dyn.d);
    var y = toNum(dyn && dyn.y);
    return d - y / CONST.NET_WRONG_PENALTY;
  }

  function netFromCorrectWrong(d, y) {
    return toNum(d) - toNum(y) / CONST.NET_WRONG_PENALTY;
  }

  function weightedSum(items) {
    // items: [{ net, weight }]
    if (!items || !items.length) return { sum: 0, has: false };
    var sum = 0;
    var has = false;
    for (var i = 0; i < items.length; i++) {
      var it = items[i] || {};
      var net = toNum(it.net);
      var w = toNum(it.weight);
      if (it.has) has = true;
      sum += net * w;
    }
    return { sum: sum, has: has };
  }

  function score100Plus(block) {
    // block: {sum, has}
    return CONST.TYT_BASE + (block && block.has ? toNum(block.sum) : 0);
  }

  function placementScore(tytScore, aytScore, obpContribution) {
    return (
      toNum(tytScore) * CONST.PLACE_TYT_W +
      toNum(aytScore) * CONST.PLACE_AYT_W +
      toNum(obpContribution)
    );
  }

  function calculateTYTScore(turkceNet, sosyalNet, matematikNet, fenNet) {
    // ÖSYM TYT (standart) — katsayılar tek kaynak
    return (
      CONST.TYT_BASE +
      toNum(turkceNet) * CONST.TYT_TURKCE +
      toNum(sosyalNet) * CONST.TYT_SOSYAL +
      toNum(matematikNet) * CONST.TYT_MAT +
      toNum(fenNet) * CONST.TYT_FEN
    );
  }

  function calculateTYTScoreFromDyn(trDyn, soDyn, maDyn, feDyn) {
    var t = netFromDyn(trDyn);
    var s = netFromDyn(soDyn);
    var m = netFromDyn(maDyn);
    var f = netFromDyn(feDyn);
    return calculateTYTScore(t, s, m, f);
  }

  function calculateTYTScoreFromFourAreasStrings(fourAreas) {
    // fourAreas: { turk, sosyal, mat, fen } — her biri "D-Y-Net" gösterim dizesi; net yine d,y'den türetilir
    var tr = parseDynHyphen(fourAreas && fourAreas.turk);
    var so = parseDynHyphen(fourAreas && fourAreas.sosyal);
    var ma = parseDynHyphen(fourAreas && fourAreas.mat);
    var fe = parseDynHyphen(fourAreas && fourAreas.fen);
    return calculateTYTScoreFromDyn(tr, so, ma, fe);
  }

  window.ScoreCalculator = {
    constants: CONST,
    roundTo: roundTo,
    fmtFixed: fmtFixed,
    parseDynHyphen: parseDynHyphen,
    netFromDyn: netFromDyn,
    netFromCorrectWrong: netFromCorrectWrong,
    weightedSum: weightedSum,
    score100Plus: score100Plus,
    placementScore: placementScore,
    calculateTYTScore: calculateTYTScore,
    calculateTYTScoreFromDyn: calculateTYTScoreFromDyn,
    calculateTYTScoreFromFourAreasStrings: calculateTYTScoreFromFourAreasStrings,
  };
})();

