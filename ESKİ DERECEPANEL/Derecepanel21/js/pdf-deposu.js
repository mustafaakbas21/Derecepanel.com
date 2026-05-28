/**
 * PDF Deposu — IndexedDB tabanlı PDF kütüphanesi.
 *
 * • DB: pdfDeposuDB  · store: files  · key: id (autoIncrement)
 * • Kayıt: { id, name, size, type, addedAt, blob }
 * • Çalışma alanına aktarım: window.TestOlusturucuPdf.loadToWorkspace(File)
 *
 * localStorage kullanılmaz (PDF'ler büyük olabilir).
 */
(function () {
  "use strict";

  var DB_NAME = "pdfDeposuDB";
  var DB_VERSION = 1;
  var STORE = "files";
  var MAX_BYTES = 150 * 1024 * 1024; // 150 MB — IndexedDB limitini zorlamadan güvenli üst sınır

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
          var store = db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
          store.createIndex("addedAt", "addedAt", { unique: false });
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

  function addFile(file) {
    return tx("readwrite").then(function (store) {
      return new Promise(function (resolve, reject) {
        var rec = {
          name: file.name || "isimsiz.pdf",
          size: file.size || 0,
          type: file.type || "application/pdf",
          addedAt: Date.now(),
          blob: file,
        };
        var req = store.add(rec);
        req.onsuccess = function () {
          rec.id = req.result;
          resolve(rec);
        };
        req.onerror = function () {
          reject(req.error || new Error("PDF kaydedilemedi."));
        };
      });
    });
  }

  function listAll() {
    return tx("readonly").then(function (store) {
      return new Promise(function (resolve, reject) {
        var out = [];
        var req = store.openCursor(null, "prev");
        req.onsuccess = function (e) {
          var cur = e.target.result;
          if (!cur) {
            resolve(out);
            return;
          }
          var v = cur.value;
          // addedAt'a göre yeni→eski sırala (cursor key'i id olduğu için sonradan manuel sıralıyoruz).
          out.push({
            id: v.id,
            name: v.name,
            size: v.size,
            type: v.type,
            addedAt: v.addedAt,
          });
          cur.continue();
        };
        req.onerror = function () {
          reject(req.error || new Error("Liste alınamadı."));
        };
      });
    }).then(function (arr) {
      arr.sort(function (a, b) {
        return (b.addedAt || 0) - (a.addedAt || 0);
      });
      return arr;
    });
  }

  function getOne(id) {
    return tx("readonly").then(function (store) {
      return new Promise(function (resolve, reject) {
        var req = store.get(id);
        req.onsuccess = function () {
          resolve(req.result || null);
        };
        req.onerror = function () {
          reject(req.error || new Error("PDF alınamadı."));
        };
      });
    });
  }

  function removeOne(id) {
    return tx("readwrite").then(function (store) {
      return new Promise(function (resolve, reject) {
        var req = store.delete(id);
        req.onsuccess = function () {
          resolve();
        };
        req.onerror = function () {
          reject(req.error || new Error("PDF silinemedi."));
        };
      });
    });
  }

  /* ── UI ───────────────────────────────────────────────────────── */

  function $(id) {
    return document.getElementById(id);
  }

  function fmtBytes(n) {
    if (!n && n !== 0) return "—";
    if (n < 1024) return n + " B";
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
    return (n / 1024 / 1024).toFixed(1) + " MB";
  }

  function fmtDate(ts) {
    if (!ts) return "—";
    try {
      var d = new Date(ts);
      return d.toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) + " · " + d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return "";
    }
  }

  function openModal() {
    var modal = $("pdf-deposu-modal");
    if (!modal) return;
    modal.classList.add("is-open");
    document.body.style.overflow = "hidden";
    refreshList();
  }

  function closeModal() {
    var modal = $("pdf-deposu-modal");
    if (!modal) return;
    modal.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  function refreshList() {
    var listEl = $("pdf-deposu-list");
    var emptyEl = $("pdf-deposu-empty");
    var countEl = $("pdf-deposu-count");
    var sizeEl = $("pdf-deposu-size");
    var statsEl = $("pdf-deposu-stats");
    if (!listEl) return;

    listAll()
      .then(function (items) {
        listEl.innerHTML = "";
        if (countEl) countEl.textContent = String(items.length);
        var total = 0;
        items.forEach(function (it) {
          total += it.size || 0;
        });
        var totalTxt = items.length ? fmtBytes(total) : "—";
        if (sizeEl) sizeEl.textContent = totalTxt;
        if (statsEl)
          statsEl.textContent = items.length
            ? items.length + " dosya · " + totalTxt
            : "—";

        if (!items.length) {
          listEl.style.display = "none";
          if (emptyEl) emptyEl.style.display = "flex";
          return;
        }
        listEl.style.display = "";
        if (emptyEl) emptyEl.style.display = "none";

        items.forEach(function (it) {
          var row = document.createElement("div");
          row.className = "pdd-item";
          row.dataset.id = String(it.id);

          row.innerHTML =
            '<div class="pdd-item__left">' +
              '<span class="pdd-item__icon" aria-hidden="true">' +
                '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
                  '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>' +
                '</svg>' +
              '</span>' +
              '<div class="pdd-item__meta">' +
                '<span class="pdd-item__name" title="' + escapeHtml(it.name) + '">' + escapeHtml(it.name) + '</span>' +
                '<span class="pdd-item__sub">' + fmtBytes(it.size) + ' · ' + fmtDate(it.addedAt) + '</span>' +
              '</div>' +
            '</div>' +
            '<div class="pdd-item__actions">' +
              '<button type="button" data-act="load" class="pdd-btn pdd-btn--primary">' +
                '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 12h15"/></svg>' +
                '<span>Çalışma Alanına Ekle</span>' +
              '</button>' +
              '<button type="button" data-act="delete" class="pdd-icon-btn" aria-label="Sil" title="Sil">' +
                '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>' +
              '</button>' +
            '</div>';

          listEl.appendChild(row);
        });
      })
      .catch(function (err) {
        console.error(err);
        listEl.innerHTML =
          '<p style="font-size:13px;color:#dc2626;">Depo okunamadı: ' + escapeHtml(err.message || err) + "</p>";
      });
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function handleFiles(fileList) {
    if (!fileList || !fileList.length) return;
    var files = Array.prototype.slice.call(fileList).filter(function (f) {
      return f && (f.type === "application/pdf" || /\.pdf$/i.test(f.name));
    });
    if (!files.length) {
      window.alert("Yalnızca PDF dosyaları yüklenebilir.");
      return;
    }
    var rejected = [];
    var accepted = files.filter(function (f) {
      if (f.size > MAX_BYTES) {
        rejected.push(f.name);
        return false;
      }
      return true;
    });
    if (rejected.length) {
      window.alert(
        "Şu dosyalar çok büyük olduğu için atlandı (maks " +
          Math.round(MAX_BYTES / 1024 / 1024) +
          " MB):\n" +
          rejected.join("\n")
      );
    }
    var tasks = accepted.map(function (f) {
      return addFile(f);
    });
    Promise.all(tasks)
      .then(function () {
        refreshList();
      })
      .catch(function (err) {
        console.error(err);
        window.alert("PDF depoya kaydedilemedi: " + (err.message || err));
      });
  }

  function sendToWorkspace(id) {
    getOne(id)
      .then(function (rec) {
        if (!rec) return;
        // Blob'tan gerçek bir File üretip mevcut çalışma alanı akışını besle.
        var file;
        try {
          file = new File([rec.blob], rec.name, { type: rec.type || "application/pdf" });
        } catch (e) {
          // Bazı eski tarayıcılarda File kurucusu olmayabilir — Blob da yeterli olacaktır.
          file = rec.blob;
          file.name = rec.name;
        }
        if (window.TestOlusturucuPdf && typeof window.TestOlusturucuPdf.loadToWorkspace === "function") {
          window.TestOlusturucuPdf.loadToWorkspace(file);
          closeModal();
        } else {
          window.alert("Çalışma alanı henüz hazır değil. Sayfayı yenileyip tekrar deneyin.");
        }
      })
      .catch(function (err) {
        console.error(err);
        window.alert("PDF okunamadı: " + (err.message || err));
      });
  }

  function wire() {
    var openBtn = $("btn-open-pdf-deposu");
    var closeBtn = $("close-pdf-deposu");
    var modal = $("pdf-deposu-modal");
    var dz = $("depo-dropzone");
    var input = $("depo-file-input");
    var listEl = $("pdf-deposu-list");

    if (openBtn) openBtn.addEventListener("click", openModal);
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (modal) {
      modal.addEventListener("click", function (e) {
        if (e.target === modal) closeModal();
      });
    }
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal && modal.classList.contains("is-open")) closeModal();
    });

    if (input) {
      input.addEventListener("change", function () {
        handleFiles(input.files);
        input.value = "";
      });
    }
    if (dz) {
      ["dragenter", "dragover"].forEach(function (ev) {
        dz.addEventListener(ev, function (e) {
          e.preventDefault();
          e.stopPropagation();
          dz.classList.add("is-drag");
        });
      });
      ["dragleave", "drop"].forEach(function (ev) {
        dz.addEventListener(ev, function (e) {
          e.preventDefault();
          e.stopPropagation();
          dz.classList.remove("is-drag");
        });
      });
      dz.addEventListener("drop", function (e) {
        var dt = e.dataTransfer;
        if (dt && dt.files && dt.files.length) handleFiles(dt.files);
      });
    }

    if (listEl) {
      listEl.addEventListener("click", function (e) {
        var btn = e.target.closest && e.target.closest("button[data-act]");
        if (!btn) return;
        var row = btn.closest("[data-id]");
        if (!row) return;
        var id = parseInt(row.getAttribute("data-id"), 10);
        if (isNaN(id)) return;
        var act = btn.getAttribute("data-act");
        if (act === "load") {
          sendToWorkspace(id);
        } else if (act === "delete") {
          if (!window.confirm("Bu PDF depodan silinsin mi?")) return;
          removeOne(id)
            .then(refreshList)
            .catch(function (err) {
              window.alert("Silinemedi: " + (err.message || err));
            });
        }
      });
    }
  }

  window.PdfDeposu = {
    open: openModal,
    close: closeModal,
    refresh: refreshList,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }
})();
