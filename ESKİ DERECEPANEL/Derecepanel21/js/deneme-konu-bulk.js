/**
 * Deneme matrisi — toplu konu yapıştırma için metin normalizasyonu ve Konu <select> eşlemesi.
 * Kurum / Global deneme sihirbazları tarafından kullanılır.
 */
(function () {
  /**
   * @param {string|null|undefined} text
   * @returns {string}
   */
  function normalizeText(text) {
    if (text == null || text === "") return "";
    var s = String(text).trim();
    try {
      s = s.toLocaleLowerCase("tr-TR");
    } catch (e) {
      s = s.toLowerCase();
    }
    s = s.replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c");
    s = s.replace(/ı/g, "i");
    s = s.replace(/\s+/g, " ");
    return s.trim();
  }

  function scoreMatch(pastedNorm, optNorm) {
    if (!pastedNorm || !optNorm) return 0;
    if (pastedNorm === optNorm) return 100;
    if (pastedNorm.length >= 2 && optNorm.indexOf(pastedNorm) !== -1) return 85;
    if (optNorm.length >= 4 && pastedNorm.indexOf(optNorm) !== -1) return 75;
    return 0;
  }

  /**
   * Genel select eşlemesi: Konu/Kavram gibi bağlı selectlerde kullanılabilir.
   * @param {HTMLSelectElement|null} sel
   * @param {string} lineRaw
   * @returns {string}
   */
  function matchSelectValue(sel, lineRaw) {
    var pastedNorm = normalizeText(lineRaw);
    if (!pastedNorm || !sel || sel.disabled) return "";
    var bestVal = "";
    var bestScore = 0;
    var bestLabLen = 0;
    for (var i = 0; i < sel.options.length; i++) {
      var o = sel.options[i];
      var v = (o.value || "").trim();
      if (!v) continue;
      var lab = normalizeText(o.textContent || o.innerText || "");
      if (!lab) continue;
      var sc = scoreMatch(pastedNorm, lab);
      if (sc > bestScore || (sc === bestScore && sc > 0 && lab.length > bestLabLen)) {
        bestScore = sc;
        bestVal = v;
        bestLabLen = lab.length;
      }
    }
    return bestScore >= 70 ? bestVal : "";
  }

  /**
   * Yapıştırılan satır metnini, select içindeki müfredat konu seçenekleriyle eşleştirir.
   * @param {HTMLSelectElement|null} sel
   * @param {string} lineRaw
   * @returns {string} eşleşen option value veya ""
   */
  function matchKonuSelectValue(sel, lineRaw) {
    var pastedNorm = normalizeText(lineRaw);
    if (!pastedNorm || !sel || sel.disabled) return "";
    var bestVal = "";
    var bestScore = 0;
    var bestLabLen = 0;
    for (var i = 0; i < sel.options.length; i++) {
      var o = sel.options[i];
      var v = (o.value || "").trim();
      if (!v) continue;
      var lab = normalizeText(o.textContent || o.innerText || "");
      if (!lab) continue;
      var sc = scoreMatch(pastedNorm, lab);
      if (sc > bestScore || (sc === bestScore && sc > 0 && lab.length > bestLabLen)) {
        bestScore = sc;
        bestVal = v;
        bestLabLen = lab.length;
      }
    }
    return bestScore >= 70 ? bestVal : "";
  }

  window.DenemeKonuBulk = {
    normalizeText: normalizeText,
    matchKonuSelectValue: matchKonuSelectValue,
    matchSelectValue: matchSelectValue,
  };
})();
