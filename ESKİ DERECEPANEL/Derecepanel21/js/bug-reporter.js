/**
 * Evrensel "Sorun Bildir" widget — FAB + modal (stiller inline enjekte edilir).
 * Yükleme: `js/theme-boot.js` içeren tüm sayfalarda theme-boot bunu otomatik yükler;
 * theme-boot kullanmayan sayfalar (ör. login, super-admin) doğrudan bu dosyayı ekler.
 * Kayıt: localStorage system_bug_reports (JSON dizi).
 */
(function () {
  if (window.__dereceBugReporterInit) return;
  window.__dereceBugReporterInit = true;

  var LS_KEY = "system_bug_reports";

  var css =
    "#br-fab{position:fixed;z-index:99998;bottom:1rem;right:1rem;width:3.5rem;height:3.5rem;border-radius:9999px;border:none;cursor:pointer;" +
    "background:linear-gradient(145deg,#6d28d9,#4c1d95);color:#fff;box-shadow:0 10px 30px -8px rgba(76,29,149,.55),0 0 0 1px rgba(167,139,250,.25);" +
    "display:flex;align-items:center;justify-content:center;transition:transform .2s ease,box-shadow .2s ease;}" +
    "#br-fab:hover{transform:translateY(-2px);box-shadow:0 14px 36px -8px rgba(76,29,149,.65),0 0 0 1px rgba(167,139,250,.35);}" +
    "#br-fab:focus-visible{outline:2px solid #a78bfa;outline-offset:3px;}" +
    "#br-overlay{position:fixed;inset:0;z-index:99999;background:rgba(2,6,23,.72);backdrop-filter:blur(6px);" +
    "display:none;align-items:center;justify-content:center;padding:1rem;}" +
    "#br-overlay.br-open{display:flex;}" +
    "#br-modal{width:100%;max-width:420px;max-height:min(92vh,640px);overflow:auto;border-radius:1rem;" +
    "background:linear-gradient(180deg,#0f0a1a 0%,#0b0914 100%);border:1px solid rgba(139,92,246,.22);" +
    "box-shadow:0 24px 64px -20px rgba(0,0,0,.75),0 0 0 1px rgba(0,229,153,.06);color:#e2e8f0;font-family:Inter,system-ui,sans-serif;}" +
    "#br-modal header{padding:1.1rem 1.25rem;border-bottom:1px solid rgba(139,92,246,.15);display:flex;align-items:flex-start;justify-content:space-between;gap:.75rem;}" +
    "#br-modal h2{margin:0;font-size:1.1rem;font-weight:700;letter-spacing:-.02em;color:#f8fafc;}" +
    "#br-modal .br-sub{margin:.35rem 0 0;font-size:.8rem;color:#94a3b8;line-height:1.4;}" +
    "#br-close{background:rgba(255,255,255,.06);border:1px solid rgba(148,163,184,.2);color:#cbd5e1;width:2rem;height:2rem;border-radius:.5rem;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;}" +
    "#br-close:hover{background:rgba(255,255,255,.1);color:#fff;}" +
    "#br-form{padding:1.25rem;display:flex;flex-direction:column;gap:1rem;}" +
    ".br-field label{display:block;font-size:.72rem;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#64748b;margin-bottom:.4rem;}" +
    ".br-field input,.br-field select,.br-field textarea{width:100%;box-sizing:border-box;border-radius:.65rem;border:1px solid rgba(139,92,246,.2);" +
    "background:#000;color:#f1f5f9;font-size:.875rem;padding:.65rem .75rem;}" +
    ".br-field input:focus,.br-field select:focus,.br-field textarea:focus{outline:none;border-color:rgba(0,229,153,.45);box-shadow:0 0 0 3px rgba(0,229,153,.12);}" +
    ".br-field input[readonly]{opacity:.85;cursor:not-allowed;background:#0c0a12;}" +
    ".br-field textarea{min-height:100px;resize:vertical;}" +
    "#br-submit{margin-top:.25rem;width:100%;border:none;border-radius:.65rem;padding:.85rem 1rem;font-weight:700;font-size:.9rem;cursor:pointer;" +
    "background:linear-gradient(90deg,#00e599,#34d399);color:#020617;box-shadow:0 0 24px rgba(0,229,153,.25);}" +
    "#br-submit:hover{filter:brightness(1.05);}" +
    "#br-submit:disabled{opacity:.55;cursor:not-allowed;filter:none;}" +
    "#br-toast{position:fixed;z-index:100000;left:50%;bottom:1.5rem;transform:translateX(-50%) translateY(120%);opacity:0;" +
    "transition:transform .35s ease,opacity .35s ease;padding:.75rem 1.25rem;border-radius:.75rem;" +
    "background:#0f172a;color:#ecfdf5;font-size:.875rem;font-weight:600;border:1px solid rgba(0,229,153,.35);" +
    "box-shadow:0 12px 40px rgba(0,0,0,.4);pointer-events:none;max-width:min(90vw,360px);text-align:center;}" +
    "#br-toast.br-toast-visible{transform:translateX(-50%) translateY(0);opacity:1;}";

  function injectStyles() {
    var s = document.createElement("style");
    s.id = "br-widget-styles";
    s.textContent = css;
    document.head.appendChild(s);
  }

  function readReports() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return [];
      var a = JSON.parse(raw);
      return Array.isArray(a) ? a : [];
    } catch (e) {
      return [];
    }
  }

  function writeReports(arr) {
    localStorage.setItem(LS_KEY, JSON.stringify(arr));
    try {
      window.dispatchEvent(new CustomEvent("system_bug_reports:updated"));
    } catch (e) {}
  }

  function currentPageValue() {
    try {
      return window.location.href || window.location.pathname || "";
    } catch (e) {
      return "";
    }
  }

  function showToast(msg) {
    var t = document.getElementById("br-toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("br-toast-visible");
    window.clearTimeout(showToast._tm);
    showToast._tm = window.setTimeout(function () {
      t.classList.remove("br-toast-visible");
    }, 3200);
  }

  function openModal() {
    var ov = document.getElementById("br-overlay");
    var pageInput = document.getElementById("br-page");
    if (!ov || !pageInput) return;
    pageInput.value = currentPageValue();
    ov.classList.add("br-open");
    document.body.style.overflow = "hidden";
    var first = document.getElementById("br-ad");
    if (first) window.setTimeout(function () {
      first.focus();
    }, 50);
  }

  function closeModal() {
    var ov = document.getElementById("br-overlay");
    if (!ov) return;
    ov.classList.remove("br-open");
    document.body.style.overflow = "";
  }

  function buildUI() {
    injectStyles();

    var fab = document.createElement("button");
    fab.type = "button";
    fab.id = "br-fab";
    fab.setAttribute("aria-label", "Sorun bildir");
    fab.setAttribute("title", "Sorun bildir");
    fab.innerHTML =
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M3 18v-6a9 9 0 0118 0v6"/>' +
      '<path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"/>' +
      "</svg>";

    var overlay = document.createElement("div");
    overlay.id = "br-overlay";
    overlay.setAttribute("role", "presentation");
    overlay.innerHTML =
      '<div id="br-modal" role="dialog" aria-modal="true" aria-labelledby="br-dialog-title">' +
      "<header>" +
      '<div><h2 id="br-dialog-title">Sorun Bildir</h2>' +
      '<p class="br-sub">Yaşadığınız sorunu kısaca yazın; teknik ekibimiz kayda alır.</p></div>' +
      '<button type="button" id="br-close" aria-label="Kapat"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>' +
      "</header>" +
      '<form id="br-form" novalidate>' +
      '<div class="br-field"><label for="br-ad">Ad</label><input id="br-ad" name="ad" type="text" required autocomplete="name" placeholder="Adınız veya rumuz" maxlength="120" /></div>' +
      '<div class="br-field"><label for="br-kategori">Kategori</label>' +
      '<select id="br-kategori" name="kategori" required>' +
      "<option value=\"\">Seçin…</option>" +
      '<option value="Arayüz / UI">Arayüz / UI</option>' +
      '<option value="Giriş / Oturum">Giriş / Oturum</option>' +
      '<option value="Performans">Performans</option>' +
      '<option value="Veri / Kayıt">Veri / Kayıt</option>' +
      '<option value="Deneme / Sınav">Deneme / Sınav</option>' +
      '<option value="Diğer">Diğer</option>' +
      "</select></div>" +
      '<div class="br-field"><label for="br-oncelik">Öncelik</label>' +
      '<select id="br-oncelik" name="oncelik" required>' +
      "<option value=\"Normal\" selected>Normal</option>" +
      '<option value="Düşük">Düşük</option>' +
      '<option value="Yüksek">Yüksek</option>' +
      '<option value="Kritik">Kritik</option>' +
      "</select></div>" +
      '<div class="br-field"><label for="br-aciklama">Açıklama</label><textarea id="br-aciklama" name="aciklama" required placeholder="Ne oldu, hangi adımlarda tekrarlanıyor?" maxlength="4000"></textarea></div>' +
      '<div class="br-field"><label for="br-page">Sorun yaşanan sayfa</label>' +
      '<input id="br-page" name="sayfa" type="text" readonly autocomplete="off" /></div>' +
      '<button type="submit" id="br-submit">Gönder</button>' +
      "</form>" +
      "</div>";

    var toast = document.createElement("div");
    toast.id = "br-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");

    document.body.appendChild(fab);
    document.body.appendChild(overlay);
    document.body.appendChild(toast);

    var modalEl = document.getElementById("br-modal");
    if (modalEl) {
      modalEl.addEventListener("click", function (e) {
        e.stopPropagation();
      });
    }

    fab.addEventListener("click", function (e) {
      e.preventDefault();
      openModal();
    });

    overlay.addEventListener("click", function () {
      closeModal();
    });

    document.getElementById("br-close").addEventListener("click", function (e) {
      e.preventDefault();
      closeModal();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("br-open")) {
        closeModal();
      }
    });

    document.getElementById("br-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var ad = (document.getElementById("br-ad").value || "").trim();
      var kategori = document.getElementById("br-kategori").value;
      var oncelik = document.getElementById("br-oncelik").value;
      var aciklama = (document.getElementById("br-aciklama").value || "").trim();
      var sayfa = (document.getElementById("br-page").value || "").trim();
      if (!ad || !kategori || !aciklama) {
        window.alert("Lütfen ad, kategori ve açıklama alanlarını doldurun.");
        return;
      }
      var btn = document.getElementById("br-submit");
      if (btn) btn.disabled = true;
      var kayit = {
        id:
          window.crypto && typeof window.crypto.randomUUID === "function"
            ? window.crypto.randomUUID()
            : "br_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8),
        ad: ad,
        kategori: kategori,
        oncelik: oncelik || "Normal",
        aciklama: aciklama,
        sayfa: sayfa || currentPageValue(),
        pathname: (function () {
          try {
            return window.location.pathname;
          } catch (e2) {
            return "";
          }
        })(),
        tarih: new Date().toISOString(),
        durum: "Yeni",
      };
      var list = readReports();
      list.push(kayit);
      writeReports(list);
      document.getElementById("br-form").reset();
      document.getElementById("br-page").value = currentPageValue();
      closeModal();
      if (btn) btn.disabled = false;
      showToast("Talebiniz alındı");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildUI);
  } else {
    buildUI();
  }
})();
