/**
 * Merkezi FMT Kasası — IndexedDB
 *
 * DB:     derecepanel_db
 * Store:  fmt_templates  · keyPath: id (string)
 * Kayıt:  {
 *   id, label, vendor, builtin, createdAt, updatedAt,
 *   // Metin tabanlı (TXT/DAT) optik dosya için karakter offsetleri:
 *   minLine, no:[s,e], nameRange:[s,e], book:[s,e], answers:[s,e|null],
 *   // Opsiyonel görsel OMR için: işaretleme koordinatları (normalize 0..1)
 *   omr?: {
 *     paperSize?: {w, h},
 *     anchors?: [{x,y}, {x,y}, {x,y}, {x,y}],  // 4 köşe referansı
 *     bubbleRadius?: number,
 *     questions?: [{ index, options:[{label, x, y}] }]
 *   }
 * }
 *
 * Aynı DB ve store tüm sayfalarda (deneme-sonuclari-yukleme, optik-okuyucu) paylaşılır.
 */
(function () {
  "use strict";

  var DB_NAME = "derecepanel_db";
  var DB_VERSION = 1;
  var STORE = "fmt_templates";

  // Hiçbir dahili/mock şablon yok — yalnızca kullanıcı tarafından Stüdyo'da
  // üretilmiş veya .fmt olarak yüklenmiş gerçek şablonlar listelenir.
  var BUILTINS = [];

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
          var s = db.createObjectStore(STORE, { keyPath: "id" });
          s.createIndex("updatedAt", "updatedAt", { unique: false });
          s.createIndex("vendor", "vendor", { unique: false });
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

  function ensureBuiltins() {
    return listAll().then(function (items) {
      var have = {};
      items.forEach(function (x) { have[x.id] = true; });
      var missing = BUILTINS.filter(function (b) { return !have[b.id]; });
      if (!missing.length) return items;
      return Promise.all(missing.map(function (b) {
        b.createdAt = b.createdAt || Date.now();
        b.updatedAt = Date.now();
        return put(b);
      })).then(listAll);
    });
  }

  function listAll() {
    return tx("readonly").then(function (store) {
      return new Promise(function (resolve, reject) {
        var out = [];
        var req = store.openCursor();
        req.onsuccess = function (e) {
          var c = e.target.result;
          if (!c) { resolve(out); return; }
          out.push(c.value);
          c.continue();
        };
        req.onerror = function () { reject(req.error); };
      });
    }).then(function (arr) {
      // Önce builtin'ler, sonra son güncellenene göre
      arr.sort(function (a, b) {
        if (a.builtin !== b.builtin) return a.builtin ? -1 : 1;
        return (b.updatedAt || 0) - (a.updatedAt || 0);
      });
      return arr;
    });
  }

  function get(id) {
    return tx("readonly").then(function (store) {
      return new Promise(function (resolve, reject) {
        var r = store.get(id);
        r.onsuccess = function () { resolve(r.result || null); };
        r.onerror = function () { reject(r.error); };
      });
    });
  }

  function put(fmt) {
    if (!fmt || !fmt.id) return Promise.reject(new Error("FMT.id gerekli"));
    fmt.updatedAt = Date.now();
    return tx("readwrite").then(function (store) {
      return new Promise(function (resolve, reject) {
        var r = store.put(fmt);
        r.onsuccess = function () { resolve(fmt); };
        r.onerror = function () { reject(r.error); };
      });
    }).then(function (res) {
      dispatchChange();
      return res;
    });
  }

  function remove(id) {
    return get(id).then(function (f) {
      if (f && f.builtin) return Promise.reject(new Error("Dahili şablonlar silinemez."));
      return tx("readwrite").then(function (store) {
        return new Promise(function (resolve, reject) {
          var r = store.delete(id);
          r.onsuccess = function () { resolve(); };
          r.onerror = function () { reject(r.error); };
        });
      });
    }).then(function () {
      dispatchChange();
    });
  }

  function dispatchChange() {
    try {
      var ev = new CustomEvent("fmt-store:change");
      window.dispatchEvent(ev);
    } catch (e) {}
  }

  // Eski localStorage anahtarı "derece_optik_fmt_repo" varsa tek seferlik göçür
  function migrateLegacy() {
    try {
      var raw = localStorage.getItem("derece_optik_fmt_repo");
      if (!raw) return Promise.resolve();
      var arr = JSON.parse(raw);
      if (!Array.isArray(arr) || !arr.length) {
        localStorage.removeItem("derece_optik_fmt_repo");
        return Promise.resolve();
      }
      return listAll().then(function (existing) {
        var have = {};
        existing.forEach(function (x) { have[x.id] = true; });
        var toPut = arr.filter(function (x) {
          return x && x.id && !have[x.id] && !x.builtin;
        });
        return Promise.all(toPut.map(function (x) {
          x.builtin = false;
          if (!Array.isArray(x.nameRange) && Array.isArray(x.name)) x.nameRange = x.name;
          if (!Array.isArray(x.nameRange)) x.nameRange = [11, 31];
          x.createdAt = x.createdAt || Date.now();
          return put(x);
        })).then(function () {
          localStorage.removeItem("derece_optik_fmt_repo");
        });
      });
    } catch (e) {
      return Promise.resolve();
    }
  }

  /** Basit .fmt parser — KEY=VALUE satırları.
   * Desteklenenler: TITLE/BASLIK/SABLON, VENDOR/YAYIN, MIN_LINE,
   * NO/TC, NAME/AD_SOYAD, BOOK/KITAPCIK, ANSWERS/CEVAPLAR
   * Aralıklar "0-11" veya "0,11" şeklinde. ANSWERS için "32-" sona kadar anlamı.
   */
  function parseFmtText(text, fallbackName) {
    var out = {
      id: "fmt-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      label: fallbackName || "Yüklenen FMT",
      vendor: "Özel",
      builtin: false,
      minLine: 30,
      no: [0, 11],
      nameRange: [11, 31],
      book: [31, 32],
      answers: [32, null],
    };
    function parseRange(v) {
      var m = String(v || "").replace(/\s+/g, "").match(/^(\d+)(?:[-,](\d+)?)?$/);
      if (!m) return null;
      var s = parseInt(m[1], 10);
      var e = m[2] != null && m[2] !== "" ? parseInt(m[2], 10) : null;
      return [s, e];
    }
    String(text || "").split(/\r?\n/).forEach(function (ln) {
      var m = ln.match(/^\s*([A-Z_]+)\s*[:=]\s*(.+?)\s*$/);
      if (!m) return;
      var k = m[1].toUpperCase(), v = m[2];
      if (k === "TITLE" || k === "BASLIK" || k === "SABLON" || k === "TEMPLATE_NAME" || k === "AD") out.label = v;
      else if (k === "VENDOR" || k === "YAYIN") out.vendor = v;
      else if (k === "MIN_LINE") out.minLine = parseInt(v, 10) || out.minLine;
      else if (k === "NO" || k === "OGRENCI_NO" || k === "TC") { var r = parseRange(v); if (r) out.no = r; }
      else if (k === "NAME" || k === "NAME_RANGE" || k === "AD_SOYAD") { var r2 = parseRange(v); if (r2) out.nameRange = r2; }
      else if (k === "BOOK" || k === "KITAPCIK") { var r3 = parseRange(v); if (r3) out.book = r3; }
      else if (k === "ANSWERS" || k === "CEVAPLAR") { var r4 = parseRange(v); if (r4) out.answers = r4; }
    });
    return out;
  }

  // ------------------------------------------------------------------
  // One-shot purge — eski oturumlardan IndexedDB'ye yazılmış mock/demo
  // FMT şablonlarını (Hız Yayınları TYT, Özdebir AYT, Kurum Özel Şablonu,
  // Standart TYT Şablonu vb.) sessizce temizler. Yalnızca ilk çalıştırmada
  // localStorage bayrağı ile çalışır; kullanıcının kendi gerçek kayıtlarına
  // dokunmaz (isim + vendor birebir eşleşmesi şartı).
  // ------------------------------------------------------------------
  var PURGE_FLAG = "derecepanel_fmt_mock_purged_v2";
  var MOCK_LABELS = {
    "hız yayınları tyt": true,
    "hiz yayinlari tyt": true,
    "özdebir ayt": true,
    "ozdebir ayt": true,
    "kurum özel şablonu": true,
    "kurum ozel sablonu": true,
    "standart tyt şablonu": true,
    "standart tyt sablonu": true,
    "standart tyt": true,
    "tyt 120 soru (edesis standart)": true,
    "ayt 160 soru (edesis)": true,
    "lgs 90 soru": true
  };

  function purgeMockOnce() {
    try {
      if (localStorage.getItem(PURGE_FLAG) === "1") return Promise.resolve();
    } catch (e) {}
    return listAll().then(function (items) {
      var victims = items.filter(function (x) {
        var label = String(x.label || "").trim().toLowerCase();
        return MOCK_LABELS[label] === true;
      });
      if (!victims.length) {
        try { localStorage.setItem(PURGE_FLAG, "1"); } catch (e) {}
        return;
      }
      return Promise.all(victims.map(function (v) {
        return tx("readwrite").then(function (store) {
          return new Promise(function (resolve) {
            var r = store.delete(v.id);
            r.onsuccess = function () { resolve(); };
            r.onerror = function () { resolve(); };
          });
        });
      })).then(function () {
        try { localStorage.setItem(PURGE_FLAG, "1"); } catch (e) {}
        dispatchChange();
      });
    }).catch(function () {});
  }

  function clearAll() {
    return tx("readwrite").then(function (store) {
      return new Promise(function (resolve, reject) {
        var r = store.clear();
        r.onsuccess = function () { resolve(); };
        r.onerror = function () { reject(r.error); };
      });
    }).then(dispatchChange);
  }

  function ready() {
    return migrateLegacy().then(purgeMockOnce).then(ensureBuiltins);
  }

  window.FmtStore = {
    BUILTINS: BUILTINS,
    ready: ready,
    listAll: function () { return ready().then(listAll); },
    get: get,
    put: put,
    remove: remove,
    clearAll: clearAll,
    parseFmtText: parseFmtText,
  };
})();
