/**
 * Tarama Deposu — IndexedDB tabanlı test/tarama arşivi.
 *
 * DB: derece_tarama_deposu · store: taramalar · key: id (string)
 *
 * Kayıt şeması:
 * {
 *   id:          "trm-<ts>-<rand>",
 *   name:        "TYT Matematik Denemesi #3",
 *   ders:        "Matematik",
 *   konu:        "Fonksiyonlar",
 *   kurum:       "Derece Akademi",
 *   coverTitle:  "KURUMSAL DENEME SINAVI",
 *   createdAt:   1714210000000,
 *   updatedAt:   1714210000000,
 *   layout:      { qPerPage, sablon, ... },
 *   questions: [
 *     { id, imageDataUrl, answer }
 *   ],
 *   thumbs:      [dataUrl, ...]    // ilk 4 sorunun mini thumb'ları (opsiyonel)
 *   pdf_file_id: "…"               // Appwrite Storage dosya ID (Test Oluşturucu PDF → Bulut)
 * }
 *
 * Arşiv mantığı: Soru havuzundan silinse bile bu depodaki kopyalar
 * (Base64 resim + cevap) kendi içinde yaşamaya devam eder.
 */
(function () {
  "use strict";

  var DB_NAME = "derece_tarama_deposu";
  var DB_VERSION = 1;
  var STORE = "taramalar";

  var dbPromise = null;

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      if (!("indexedDB" in window)) {
        reject(new Error("Tarayıcınız IndexedDB desteklemiyor."));
        return;
      }
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function (e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains(STORE)) {
          var store = db.createObjectStore(STORE, { keyPath: "id" });
          store.createIndex("createdAt", "createdAt", { unique: false });
          store.createIndex("ders", "ders", { unique: false });
          store.createIndex("name", "name", { unique: false });
        }
      };
      req.onsuccess = function () {
        resolve(req.result);
      };
      req.onerror = function () {
        reject(req.error || new Error("IndexedDB açılamadı."));
      };
    });
    return dbPromise;
  }

  function tx(mode) {
    return openDb().then(function (db) {
      return db.transaction(STORE, mode).objectStore(STORE);
    });
  }

  function genId() {
    return (
      "trm-" +
      Date.now().toString(36) +
      "-" +
      Math.random().toString(36).slice(2, 8)
    );
  }

  function add(rec) {
    return tx("readwrite").then(function (store) {
      return new Promise(function (resolve, reject) {
        if (!rec.id) rec.id = genId();
        if (!rec.createdAt) rec.createdAt = Date.now();
        rec.updatedAt = Date.now();
        var req = store.put(rec);
        req.onsuccess = function () {
          resolve(rec);
        };
        req.onerror = function () {
          reject(req.error || new Error("Tarama kaydedilemedi."));
        };
      });
    });
  }

  function update(id, patch) {
    return get(id).then(function (old) {
      if (!old) throw new Error("Tarama bulunamadı.");
      var merged = Object.assign({}, old, patch, {
        id: old.id,
        createdAt: old.createdAt,
        updatedAt: Date.now(),
      });
      return add(merged);
    });
  }

  function listAll() {
    return tx("readonly").then(function (store) {
      return new Promise(function (resolve, reject) {
        var out = [];
        var req = store.openCursor();
        req.onsuccess = function (e) {
          var cur = e.target.result;
          if (!cur) {
            resolve(out);
            return;
          }
          out.push(cur.value);
          cur.continue();
        };
        req.onerror = function () {
          reject(req.error || new Error("Liste alınamadı."));
        };
      });
    }).then(function (arr) {
      arr.sort(function (a, b) {
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
      return arr;
    });
  }

  function get(id) {
    return tx("readonly").then(function (store) {
      return new Promise(function (resolve, reject) {
        var req = store.get(id);
        req.onsuccess = function () {
          resolve(req.result || null);
        };
        req.onerror = function () {
          reject(req.error || new Error("Tarama alınamadı."));
        };
      });
    });
  }

  function remove(id) {
    return tx("readwrite").then(function (store) {
      return new Promise(function (resolve, reject) {
        var req = store.delete(id);
        req.onsuccess = function () {
          resolve();
        };
        req.onerror = function () {
          reject(req.error || new Error("Tarama silinemedi."));
        };
      });
    });
  }

  function stats() {
    return listAll().then(function (items) {
      var totalQ = 0;
      var byDers = Object.create(null);
      items.forEach(function (it) {
        var qCount = (it.questions && it.questions.length) || 0;
        totalQ += qCount;
        var d = (it.ders || "Diğer").trim() || "Diğer";
        byDers[d] = (byDers[d] || 0) + qCount;
      });
      var topDers = null;
      var topCount = 0;
      Object.keys(byDers).forEach(function (k) {
        if (byDers[k] > topCount) {
          topCount = byDers[k];
          topDers = k;
        }
      });
      return {
        totalCount: items.length,
        totalQuestions: totalQ,
        topDers: topDers,
        topDersCount: topCount,
        byDers: byDers,
      };
    });
  }

  window.TaramaDeposu = {
    add: add,
    update: update,
    list: listAll,
    get: get,
    remove: remove,
    stats: stats,
    genId: genId,
  };
})();
