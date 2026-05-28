/**
 * Ortak deneme modal iskeleti (Kurum + Global). Tek DOM, data-dnm-context ile sekme görünürlüğü.
 * HTML dosyası eklemeden body sonuna enjekte edilir.
 */
(function () {
  var MODAL_HTML =
    '<div class="modal-overlay modal-overlay--kdy" id="kdy-modal-overlay" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="kdy-modal-title" data-dnm-context="kurum">' +
    '<div class="modal modal--kdy" id="kdy-modal-panel">' +
    '<div class="kdy-modal__head">' +
    "<div>" +
    '<h2 id="kdy-modal-title" class="kdy-modal__title">Yeni deneme</h2>' +
    '<p id="kdy-modal-subtitle" class="kdy-modal__subtitle">Sınav hazırlama — adımları tamamlayın.</p>' +
    "</div>" +
    '<button type="button" class="btn-icon kdy-modal__close" id="kdy-modal-close" aria-label="Kapat">' +
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
    "</button></div>" +
    '<div class="kdy-tabs kdy-stepstrip" role="tablist" aria-label="Deneme adımları">' +
    '<button type="button" class="kdy-tab kdy-tab--active" role="tab" aria-selected="true" aria-controls="kdy-panel-1" id="kdy-tab-1" data-kdy-tab="1">' +
    '<span class="kdy-tab__step" aria-hidden="true"><span class="kdy-tab__circle">1</span></span>' +
    '<span class="kdy-tab__text"><span class="kdy-tab__label">Genel bilgiler</span><span class="kdy-tab__hint">Ad, tarih, sınav</span></span></button>' +
    '<span class="kdy-stepstrip__connector" aria-hidden="true"></span>' +
    '<button type="button" class="kdy-tab" role="tab" aria-selected="false" aria-controls="kdy-panel-2" id="kdy-tab-2" data-kdy-tab="2">' +
    '<span class="kdy-tab__step" aria-hidden="true"><span class="kdy-tab__circle">2</span></span>' +
    '<span class="kdy-tab__text"><span class="kdy-tab__label">Optik ve soru dağılımı</span><span class="kdy-tab__hint">Matris & cevaplar</span></span></button>' +
    '<span class="kdy-stepstrip__connector" aria-hidden="true"></span>' +
    '<button type="button" class="kdy-tab" role="tab" aria-selected="false" aria-controls="kdy-panel-3" id="kdy-tab-3" data-kdy-tab="3">' +
    '<span class="kdy-tab__step" aria-hidden="true"><span class="kdy-tab__circle">3</span></span>' +
    '<span class="kdy-tab__text"><span class="kdy-tab__label">Yayın ayarları</span><span class="kdy-tab__hint">Kitle & erişim</span></span></button>' +
    "</div>" +
    '<div class="kdy-tab-panels">' +
    '<section class="kdy-panel kdy-panel--active" role="tabpanel" id="kdy-panel-1" aria-labelledby="kdy-tab-1" data-kdy-panel="1">' +
    '<div class="kdy-form-grid">' +
    '<label class="kdy-field kdy-field--full"><span class="kdy-field__label">Deneme adı</span>' +
    '<input type="text" id="kdy-f-name" class="kdy-input" placeholder="Örn. Aralık TYT Deneme 3" autocomplete="off"/></label>' +
    '<label class="kdy-field"><span class="kdy-field__label">Tarih</span><input type="date" id="kdy-f-date" class="kdy-input"/></label>' +
    '<label class="kdy-field"><span class="kdy-field__label">Başlangıç saati</span><input type="time" id="kdy-f-time" class="kdy-input" value="09:00"/></label>' +
    '<fieldset class="kdy-field kdy-field--radio"><legend class="kdy-field__label">Sınav tipi</legend><div class="kdy-segment" id="kdy-f-sinav">' +
    '<label class="kdy-segment__lbl"><input type="radio" name="kdy-sinav" value="TYT" checked/> TYT</label>' +
    '<label class="kdy-segment__lbl"><input type="radio" name="kdy-sinav" value="AYT"/> AYT</label>' +
    '<label class="kdy-segment__lbl"><input type="radio" name="kdy-sinav" value="YDT"/> YDT</label>' +
    "</div></fieldset></div>" +
    '<div class="kdy-dropzone" id="kdy-dropzone" tabindex="0">' +
    '<input type="file" id="kdy-f-pdf" class="kdy-dropzone__input" accept=".pdf,application/pdf" aria-label="PDF veya kitapçık yükle"/>' +
    '<div class="kdy-dropzone__visual">' +
    '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M12 18v-6M9 15l3 3 3-3"/></svg>' +
    "<strong>PDF / kitapçık</strong><span>Sürükleyip bırakın veya tıklayarak seçin</span>" +
    '<span id="kdy-dropzone-name" class="kdy-dropzone__file"></span></div></div></section>' +
    '<section class="kdy-panel" role="tabpanel" id="kdy-panel-2" aria-labelledby="kdy-tab-2" hidden data-kdy-panel="2">' +
    '<p class="kdy-panel__hint" id="kdy-matrix-hint"></p>' +
    '<div class="kdy-bulk">' +
    '<label class="kdy-bulk__label"><span class="kdy-field__label">Toplu cevap anahtarı yapıştır</span>' +
    '<input type="text" id="kdy-bulk-key" class="kdy-input kdy-input--mono" placeholder="Örn. ABDCEED..." autocomplete="off"/></label>' +
    '<button type="button" class="btn-export" id="kdy-bulk-apply">Satırlara dağıt</button></div>' +
    '<div class="kdy-bulk kdy-bulk--excel">' +
    '<div class="kdy-excel-intro">' +
    '<div class="kdy-excel-intro__text">' +
    '<span class="kdy-field__label">Excel Entegrasyonu</span>' +
    '<span class="kdy-excel-intro__sub">Hazır şablonu indirip doldurun; tek tıkla 120 soruya doğru cevap, konu ve kavramı otomatik aktarın.</span>' +
    "</div>" +
    '<button type="button" class="kdy-excel-trigger" id="kdy-excel-open" aria-haspopup="dialog">' +
    '<span class="kdy-excel-trigger__icon" aria-hidden="true">📊</span>' +
    '<span class="kdy-excel-trigger__text">Excel Şablonu ile Yükle</span>' +
    "</button>" +
    "</div>" +
    // Geriye dönük/servis amaçlı: eski textarea saklı (isterseniz sonradan tamamen kaldırılabilir)
    '<textarea id="kdy-bulk-konu" class="kdy-input kdy-textarea" rows="2" hidden aria-hidden="true"></textarea>' +
    '<button type="button" class="btn-export" id="kdy-bulk-konu-apply" hidden aria-hidden="true">Satırlara dağıt</button>' +
    "</div>" +
    '<div class="kdy-matrix-wrap kdy-matrix-wrap--table">' +
    '<div class="kdy-matrix-scroll" id="kdy-matrix-scroll">' +
    '<table class="kdy-matrix-table" aria-label="Soru matrisi">' +
    "<thead><tr>" +
    '<th scope="col" class="kdy-mth kdy-mth--no">Soru</th>' +
    '<th scope="col" class="kdy-mth kdy-mth--cevap">Doğru cevap</th>' +
    '<th scope="col" class="kdy-mth kdy-mth--konu">Konu</th>' +
    '<th scope="col" class="kdy-mth kdy-mth--kav">Kavram</th>' +
    '<th scope="col" class="kdy-mth kdy-mth--zor">Zorluk</th>' +
    "</tr></thead>" +
    '<tbody id="kdy-matrix-tbody"></tbody></table></div></div>' +
    // Excel Wizard Modal (2. adım içinden açılır)
    '<div class="kdy-excel-overlay" id="kdy-excel-overlay" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="kdy-excel-title">' +
    '<div class="kdy-excel-modal" role="document">' +
    '<div class="kdy-excel-head">' +
    '<div class="kdy-excel-head__text">' +
    '<h3 class="kdy-excel-title" id="kdy-excel-title">Excel Şablon Sihirbazı</h3>' +
    '<p class="kdy-excel-sub">Matris bilgilerini Excel ile hızlı ve hatasız doldurun.</p>' +
    "</div>" +
    '<button type="button" class="btn-icon kdy-excel-close" id="kdy-excel-close" aria-label="Kapat">' +
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
    "</button>" +
    "</div>" +
    '<div class="kdy-excel-grid">' +
    '<button type="button" class="kdy-excel-card kdy-excel-card--download" id="kdy-excel-download">' +
    '<span class="kdy-excel-card__icon" aria-hidden="true">📥</span>' +
    '<span class="kdy-excel-card__title">Hazır Şablonu İndir</span>' +
    '<span class="kdy-excel-card__desc">Sisteme tam uyumlu boş Excel formatını bilgisayarınıza indirin.</span>' +
    "</button>" +
    '<button type="button" class="kdy-excel-card kdy-excel-card--import" id="kdy-excel-import">' +
    '<span class="kdy-excel-card__icon" aria-hidden="true">🚀</span>' +
    '<span class="kdy-excel-card__title">Şablonu İçeri Aktar</span>' +
    '<span class="kdy-excel-card__desc">Doldurduğunuz Excel dosyasını yükleyin ve soruları otomatik dağıtın.</span>' +
    '<input type="file" id="kdy-excel-file" class="kdy-excel-file" accept=".xlsx,.xls,.csv" aria-label="Excel dosyası seç" />' +
    "</button>" +
    "</div>" +
    '<div id="kdy-excel-preview" class="kdy-excel-preview" hidden>' +
    '<p id="kdy-excel-preview-meta" class="kdy-excel-preview__meta"></p>' +
    '<div class="kdy-excel-preview__scroll">' +
    '<table class="kdy-excel-preview__table" aria-label="Excel önizleme">' +
    "<thead><tr>" +
    '<th scope="col">Soru No</th><th scope="col">Doğru Cevap</th><th scope="col">Konu</th><th scope="col">Kavram</th><th scope="col">Zorluk</th>' +
    "</tr></thead>" +
    '<tbody id="kdy-excel-preview-tbody"></tbody></table></div>' +
    '<div class="kdy-excel-preview__actions">' +
    '<button type="button" class="btn-add" id="kdy-excel-apply">Matrise aktar</button>' +
    "</div>" +
    "</div>" +
    '<p class="kdy-excel-footnote" role="note">Sütun başlıkları: Soru No, Doğru Cevap, Konu (ders adı), Kavram (müfredat konusu), Zorluk</p>' +
    "</div>" +
    "</div>" +
    "</section>" +
    '<section class="kdy-panel kdy-panel--publish" role="tabpanel" id="kdy-panel-3" aria-labelledby="kdy-tab-3" hidden data-kdy-panel="3">' +
    '<div class="kdy-publish-hero">' +
    '<div class="kdy-publish-hero__icon" aria-hidden="true">' +
    '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
    '<div class="kdy-publish-hero__copy">' +
    '<h3 class="kdy-publish-hero__title">Hedef kitleyi netleştirin</h3>' +
    '<p class="kdy-publish-hero__lead">Denemenin hangi sınıflara ve hangi öğrenci kümesine açılacağını seçin. Öğrenci sayıları kurum kayıtlarına bağlandığında burada gösterilir.</p></div></div>' +
    '<div class="kdy-publish-section">' +
    '<div class="kdy-publish-section__head">' +
    '<span class="kdy-publish-section__badge kdy-publish-section__badge--scope" aria-hidden="true">' +
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2" stroke-linecap="round"/></svg></span>' +
    '<div><h4 class="kdy-publish-section__title">Öğrenci kapsamı</h4>' +
    '<p class="kdy-publish-section__sub">Erişim kuralını seçin; yayınlandığında öğrenci listesi bu kurala göre filtrelenir.</p></div></div>' +
    '<fieldset class="kdy-publish-fieldset"><legend class="visually-hidden">Öğrenci kapsamı</legend>' +
    '<div class="kdy-publish-scope">' +
    '<label class="kdy-publish-scope-card">' +
    '<input type="radio" name="kdy-ogrenci" value="secili" class="kdy-publish-scope-card__input" checked/>' +
    '<span class="kdy-publish-scope-card__body">' +
    '<span class="kdy-publish-scope-card__check" aria-hidden="true"></span>' +
    '<span class="kdy-publish-scope-card__text">' +
    '<span class="kdy-publish-scope-card__title">Kurum içi hedefli yayın</span>' +
    '<span class="kdy-publish-scope-card__desc">Varsayılan: kayıtlı öğrenci kümesine kısıtlı görünürlük (sınıf filtresi kaldırıldı).</span></span></span></label>' +
    '<label class="kdy-publish-scope-card">' +
    '<input type="radio" name="kdy-ogrenci" value="tum" class="kdy-publish-scope-card__input"/>' +
    '<span class="kdy-publish-scope-card__body">' +
    '<span class="kdy-publish-scope-card__check" aria-hidden="true"></span>' +
    '<span class="kdy-publish-scope-card__text">' +
    '<span class="kdy-publish-scope-card__title">Tüm kayıtlı öğrenciler</span>' +
    '<span class="kdy-publish-scope-card__desc">Kurumdaki tüm aktif öğrenci hesaplarına açılır.</span></span></span></label></div></fieldset></div>' +
    '<p class="kdy-publish-footnote" role="note">Öğrenci sayıları kurumdaki kayıt sistemiyle entegre edildiğinde otomatik dolar.</p></section></div>' +
    '<div class="kdy-modal__footer">' +
    '<button type="button" class="btn-export" id="kdy-modal-cancel">Vazgeç</button>' +
    '<button type="button" class="btn-add" id="kdy-modal-save">Kaydet</button></div></div></div>';

  function getContext() {
    var h = document.documentElement.getAttribute("data-dnm-context");
    return h === "global" ? "global" : "kurum";
  }

  function applyContext() {
    var ov = document.getElementById("kdy-modal-overlay");
    if (!ov) return;
    var ctx = getContext();
    ov.setAttribute("data-dnm-context", ctx);
    var t2 = document.getElementById("kdy-tab-2");
    var title = document.getElementById("kdy-modal-title");
    var sub = document.getElementById("kdy-modal-subtitle");
    var strip = document.querySelector(".kdy-stepstrip");
    if (strip) strip.classList.toggle("kdy-stepstrip--global", ctx === "global");
    var c1 = document.querySelector("#kdy-tab-1 .kdy-tab__circle");
    var c3 = document.querySelector("#kdy-tab-3 .kdy-tab__circle");
    if (c1) c1.textContent = "1";
    if (c3) c3.textContent = "3";
    if (t2) {
      t2.hidden = false;
      t2.removeAttribute("aria-hidden");
      t2.style.display = "";
    }
    if (ctx === "global") {
      if (title) title.textContent = "Yeni Global Deneme";
      if (sub) sub.textContent = "Merkezi takvim — üç adımda matris ve yayın ayarları.";
    } else {
      if (title) title.textContent = "Yeni Kurum Denemesi";
      if (sub) sub.textContent = "Sınav hazırlama laboratuvarı — üç adımda tamamlayın.";
    }
    var activeBtn = document.querySelector(".kdy-tab.kdy-tab--active");
    syncTabStepState(activeBtn && activeBtn.getAttribute("data-kdy-tab") ? activeBtn.getAttribute("data-kdy-tab") : "1");
  }

  function syncTabStepState(activeTab) {
    var tabs = document.querySelectorAll(".kdy-tab");
    var cur = parseInt(activeTab, 10);
    if (isNaN(cur)) return;
    tabs.forEach(function (b) {
      if (b.hidden || b.getAttribute("aria-hidden") === "true") return;
      var n = parseInt(b.getAttribute("data-kdy-tab"), 10);
      if (isNaN(n)) return;
      b.classList.remove("kdy-tab--done", "kdy-tab--pending");
      if (n < cur) b.classList.add("kdy-tab--done");
      else if (n > cur) b.classList.add("kdy-tab--pending");
    });
  }

  function wireTabs() {
    var tabs = document.querySelectorAll(".kdy-tab");
    var panels = document.querySelectorAll("[data-kdy-panel]");
    tabs.forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (btn.hidden || btn.getAttribute("aria-hidden") === "true") return;
        var w = btn.getAttribute("data-kdy-tab");
        tabs.forEach(function (b) {
          var on = b.getAttribute("data-kdy-tab") === w;
          b.classList.toggle("kdy-tab--active", on);
          b.setAttribute("aria-selected", on ? "true" : "false");
        });
        syncTabStepState(w);
        panels.forEach(function (p) {
          var on = p.getAttribute("data-kdy-panel") === w;
          p.classList.toggle("kdy-panel--active", on);
          p.hidden = !on;
        });
        try {
          window.dispatchEvent(new CustomEvent("deneme-modal-tab", { detail: { tab: w } }));
        } catch (err) {}
      });
    });
    var init = document.querySelector(".kdy-tab.kdy-tab--active");
    if (init) syncTabStepState(init.getAttribute("data-kdy-tab") || "1");
  }

  function inject() {
    if (document.getElementById("kdy-modal-overlay")) {
      applyContext();
      return;
    }
    document.body.insertAdjacentHTML("beforeend", MODAL_HTML);
    applyContext();
    wireTabs();
  }

  if (document.body) inject();
  else document.addEventListener("DOMContentLoaded", inject);

  window.DenemeModalShell = {
    reinject: inject,
    applyContext: applyContext,
    getContext: getContext,
    syncTabStepState: syncTabStepState,
  };
})();
