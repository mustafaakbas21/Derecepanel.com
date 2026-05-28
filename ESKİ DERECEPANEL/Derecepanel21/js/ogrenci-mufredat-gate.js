/**
 * Öğrenci paneli — YKS müfredatının hazır olmasını bekler.
 * Konu/kavram etiketleri (deneme karne, akademik matrix) bu API hazır olmadan "Genel" veya "—" görünür.
 *
 * Zorunlu script sırası (iframe sayfalarında):
 *   1. yks-mufredat.js
 *   2. ogrenci-mufredat-gate.js  (bu dosya)
 *   3. student-karne-api.js / ogrenci-mr-matrix.js …
 */
(function () {
  "use strict";

  var ready = false;
  var waitQueue = [];
  var pollCount = 0;
  var MAX_POLL = 120;

  function apiReady() {
    try {
      var api = window.YksMufredatApi;
      return !!(api && typeof api.getSubjects === "function" && api.getSubjects().length > 0);
    } catch (e) {
      return false;
    }
  }

  function warmLabelCache() {
    try {
      var api = window.YksMufredatApi;
      if (api && typeof api.warmKonuLabelCache === "function") {
        api.warmKonuLabelCache();
      }
    } catch (eWarm) {}
  }

  function drainQueue() {
    ready = true;
    warmLabelCache();
    var pending = waitQueue.slice();
    waitQueue = [];
    pending.forEach(function (fn) {
      try {
        if (typeof fn === "function") fn();
      } catch (e2) {}
    });
  }

  function ensureReady(fn) {
    if (typeof fn !== "function") return;
    if (ready || apiReady()) {
      ready = true;
      fn();
      return;
    }
    waitQueue.push(fn);
    if (!pollCount) poll();
  }

  function poll() {
    if (apiReady()) {
      drainQueue();
      return;
    }
    pollCount += 1;
    if (pollCount >= MAX_POLL) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn(
          "[OgrenciMufredatGate] YksMufredatApi zaman aşımı — konu etiketleri eksik kalabilir. Script sırasını kontrol edin: yks-mufredat.js önce yüklenmeli."
        );
      }
      drainQueue();
      return;
    }
    setTimeout(poll, 25);
  }

  function assertScriptOrder(context) {
    if (apiReady()) return true;
    if (typeof console !== "undefined" && console.warn) {
      console.warn(
        "[OgrenciMufredatGate]" +
          (context ? " " + context : "") +
          " — YksMufredatApi henüz yok. Sayfada yks-mufredat.js, student-karne-api.js'den önce olmalı."
      );
    }
    return false;
  }

  window.OgrenciMufredatGate = {
    ensureReady: ensureReady,
    isReady: function () {
      return ready || apiReady();
    },
    assertScriptOrder: assertScriptOrder,
    REQUIRED_ORDER: "yks-mufredat.js → ogrenci-mufredat-gate.js → student-karne-api.js",
  };

  window.addEventListener("yks-mufredat:ready", drainQueue);

  if (apiReady()) drainQueue();
  else poll();
})();
