/**
 * YKS / Tercih vb. og-partial-page: yalnızca <main> vardı; doğrudan sekmede açılınca sidebar yoktu.
 * Üst pencerede (iframe değil) koç veya öğrenci için .app + sidebar sarar; iframe içinde dokunmaz.
 */
(function () {
  if (window.self !== window.top) return;

  function role() {
    try {
      return String(sessionStorage.getItem("dp_auth_role") || "").trim();
    } catch (e) {
      return "";
    }
  }

  function pathKey() {
    var p = (window.location.pathname || "").replace(/\\/g, "/").toLowerCase();
    if (p.indexOf("tercih-sihirbazi") !== -1) return "tercih";
    if (p.indexOf("net-sihirbazi") !== -1) return "net";
    if (p.indexOf("puan-hesaplama") !== -1) return "puan";
    if (p.indexOf("yks-konulari") !== -1) return "konular";
    return "";
  }

  /** Öğrenci standalone sayfalarında aktif sekme / açık accordion */
  function studentPathKey() {
    var p = (window.location.pathname || "").replace(/\\/g, "/").toLowerCase();
    var y = pathKey();
    if (y) return y;
    if (p.indexOf("ogrenci-randevular") !== -1) return "rnd";
    if (p.indexOf("ogrenci-kutuphane") !== -1) return "lib";
    if (p.indexOf("ogrenci-deneme-sonuclari") !== -1) return "gel-den";
    if (p.indexOf("ogrenci-global-deneme") !== -1) return "gel-glob";
    if (p.indexOf("ogrenci-kurum-deneme") !== -1) return "gel-kur";
    if (p.indexOf("ogrenci-mr-matrix") !== -1) return "mr-mat";
    if (p.indexOf("ogrenci-mr-efor") !== -1) return "mr-efor";
    if (p.indexOf("ogrenci-mr-trend") !== -1) return "mr-trend";
    if (p.indexOf("ogrenci-aktif-program") !== -1) return "wp-act";
    if (p.indexOf("ogrenci-gecmis-programlar") !== -1) return "wp-past";
    if (p.indexOf("ogrenci-panel") !== -1) return "home";
    return "";
  }

  function iconHome() {
    return '<svg class="nav-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/></svg>';
  }
  function iconCal() {
    return '<svg class="nav-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  function iconBook() {
    return '<svg class="nav-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>';
  }
  function iconYks() {
    return '<svg class="nav-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 14l9-5-9-5-9 5 9 5z" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 14v7M9 18h6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  function iconDoc() {
    return '<svg class="nav-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  function iconMrPulse() {
    return '<svg class="nav-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>';
  }
  function iconMegaphone() {
    return '<svg class="nav-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 11v2a1 1 0 0 0 1 1h2l9 4V6L6 10H4a1 1 0 0 0-1 1z" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 10.5a4 4 0 0 1 0 3" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 9a7 7 0 0 1 0 6" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 14.5V19a2 2 0 0 0 2 2h1" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  function chevron() {
    return '<svg class="nav-item__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  }

  function studentSidebar(active) {
    var a = function (key, href, label, iconHtml) {
      var cls = "nav-item" + (active === key ? " nav-item--active" : "");
      var cur = active === key ? ' aria-current="page"' : "";
      return '<a href="' + href + '" class="' + cls + '"' + cur + ">" + iconHtml + label + "</a>";
    };
    var sub = function (href, label, key) {
      return (
        '<a href="' +
        href +
        '" class="nav-sub' +
        (active === key ? " nav-sub--active" : "") +
        '">' +
        label +
        "</a>"
      );
    };
    var gelOpen = active === "gel-den" || active === "gel-glob" || active === "gel-kur";
    var mrOpen = active === "mr-mat" || active === "mr-efor" || active === "mr-trend";
    var yksOpen = active === "tercih" || active === "net" || active === "puan" || active === "konular";
    var wpOpen = active === "wp-act" || active === "wp-past";
    return (
      '<aside class="sidebar" aria-label="Öğrenci menüsü">' +
      '<div class="sidebar__brand"><div class="sidebar__logo" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div><span class="sidebar__title">Derecepanel</span></div>' +
      '<nav class="sidebar__nav">' +
      a("home", "ogrenci-panel.html", "Anasayfa", iconHome()) +
      '<div class="nav-group' +
      (gelOpen ? " nav-group--open" : "") +
      '" data-nav-group>' +
      '<button type="button" class="nav-item nav-group__trigger" aria-expanded="' +
      (gelOpen ? "true" : "false") +
      '" aria-controls="yks-st-og-gel-sub" id="yks-st-og-gel-btn">' +
      iconDoc() +
      "Gelişim Karnem" +
      chevron() +
      "</button>" +
      '<div class="nav-group__sub" id="yks-st-og-gel-sub" role="group" aria-label="Gelişim Karnem alt menü">' +
      sub("ogrenci-deneme-sonuclari.html", "Deneme Sonuçları", "gel-den") +
      sub("ogrenci-global-deneme.html", "Global Deneme Takvimi", "gel-glob") +
      sub("ogrenci-kurum-deneme.html", "Kurum Deneme Sınavları", "gel-kur") +
      "</div></div>" +
      '<div class="nav-group' +
      (mrOpen ? " nav-group--open" : "") +
      '" data-nav-group>' +
      '<button type="button" class="nav-item nav-group__trigger" aria-expanded="' +
      (mrOpen ? "true" : "false") +
      '" aria-controls="yks-st-og-mr-sub" id="yks-st-og-mr-btn">' +
      iconMrPulse() +
      "MR (Kişisel Analiz)" +
      chevron() +
      "</button>" +
      '<div class="nav-group__sub" id="yks-st-og-mr-sub" role="group" aria-label="MR alt menü">' +
      sub("ogrenci-mr-matrix.html", "Akademik Matrix", "mr-mat") +
      sub("ogrenci-mr-efor.html", "Efor Günlüğüm", "mr-efor") +
      sub("ogrenci-mr-trend.html", "Gelişim Trendi", "mr-trend") +
      "</div></div>" +
      '<div class="nav-group' +
      (yksOpen ? " nav-group--open" : "") +
      '" data-nav-group>' +
      '<button type="button" class="nav-item nav-group__trigger" aria-expanded="' +
      (yksOpen ? "true" : "false") +
      '" aria-controls="yks-st-og-yks-sub" id="yks-st-og-yks-btn">' +
      iconYks() +
      "YKS Simülasyon" +
      chevron() +
      "</button>" +
      '<div class="nav-group__sub" id="yks-st-og-yks-sub" role="group" aria-label="YKS Simülasyon alt menü">' +
      sub("tercih-sihirbazi.html", "Tercih Sihirbazı", "tercih") +
      sub("net-sihirbazi.html", "Net Sihirbazı", "net") +
      sub("puan-hesaplama.html", "Puan Hesaplama", "puan") +
      sub("yks-konulari.html", "YKS Konuları", "konular") +
      "</div></div>" +
      '<div class="nav-group' +
      (wpOpen ? " nav-group--open" : "") +
      '" data-nav-group>' +
      '<button type="button" class="nav-item nav-group__trigger" aria-expanded="' +
      (wpOpen ? "true" : "false") +
      '" aria-controls="yks-st-og-week-sub" id="yks-st-og-week-btn">' +
      iconCal() +
      "Haftalık Programım" +
      chevron() +
      "</button>" +
      '<div class="nav-group__sub" id="yks-st-og-week-sub" role="group" aria-label="Haftalık program alt menü">' +
      sub("ogrenci-aktif-program.html", "Aktif Programım", "wp-act") +
      sub("ogrenci-gecmis-programlar.html", "Geçmiş Programlarım", "wp-past") +
      "</div></div>" +
      a("rnd", "ogrenci-randevular.html", "Randevularım", iconCal()) +
      a("lib", "ogrenci-kutuphane.html", "Kütüphane", iconBook()) +
      "</nav>" +
      '<div class="theme-switcher" role="group" aria-label="Görünüm teması">' +
      '<span class="theme-switcher__label">Tema</span>' +
      '<div class="theme-switcher__swatches">' +
      '<button type="button" class="theme-swatch theme-swatch--dark" data-theme="dark" aria-pressed="false" aria-label="Koyu tema"></button>' +
      '<button type="button" class="theme-swatch theme-swatch--light" data-theme="light" aria-pressed="false" aria-label="Açık tema"></button>' +
      '<button type="button" class="theme-swatch theme-swatch--blue" data-theme="blue" aria-pressed="false" aria-label="Okyanus teması"></button>' +
      '<button type="button" class="theme-swatch theme-swatch--orange" data-theme="orange" aria-pressed="false" aria-label="Gün batımı teması"></button>' +
      "</div></div>" +
      '<div class="sidebar__logout"><button type="button" class="btn-logout">Çıkış<span class="btn-logout__arrow" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span></button></div>' +
      "</aside>"
    );
  }

  function coachSidebar(active) {
    var yksOpen = active === "tercih" || active === "net" || active === "puan" || active === "konular";
    var yksSub =
      '<a href="tercih-sihirbazi.html" class="nav-sub' +
      (active === "tercih" ? " nav-sub--active" : "") +
      '">Tercih Sihirbazı</a>' +
      '<a href="yks-konulari.html" class="nav-sub' +
      (active === "konular" ? " nav-sub--active" : "") +
      '">YKS Konuları</a>' +
      '<a href="net-sihirbazi.html" class="nav-sub' +
      (active === "net" ? " nav-sub--active" : "") +
      '">Net Sihirbazı</a>' +
      '<a href="puan-hesaplama.html" class="nav-sub' +
      (active === "puan" ? " nav-sub--active" : "") +
      '">Puan Hesaplama</a>';
    var iconDen =
      '<svg class="nav-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var iconMr =
      '<svg class="nav-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>';
    var iconKitap =
      '<svg class="nav-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>';
    var iconHr =
      '<svg class="nav-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7z"/><path d="M14 2v4h4"/><path d="M12 11v6"/><path d="M9 14h6"/></svg>';
    var iconTm =
      '<svg class="nav-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>';
    var iconTf =
      '<svg class="nav-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>';
    return (
      '<aside class="sidebar" aria-label="Koç menüsü">' +
      '<div class="sidebar__brand"><div class="sidebar__logo" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div><span class="sidebar__title">Derecepanel</span></div>' +
      '<nav class="sidebar__nav">' +
      '<a href="../koc-paneli.html" class="nav-item"><svg class="nav-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/></svg>Dashboard</a>' +
      '<a href="ogrencilerim.html" class="nav-item"><svg class="nav-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>Öğrencilerim</a>' +
      '<a href="koclar.html" class="nav-item"><svg class="nav-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14l6.16 3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01-.665-6.479L12 14z"/></svg>Koçlar</a>' +
      '<a href="randevular.html" class="nav-item">' +
      iconCal() +
      "Randevular</a>" +
      '<a href="pazarlama.html" class="nav-item nav-item--marketing-beta">' +
      iconMegaphone() +
      '<span class="nav-analiz-beta">' +
      '<span class="nav-analiz-beta__row1">Pazarlama</span>' +
      '<span class="nav-analiz-beta__row2">' +
      '<span class="nav-analiz-beta__suffix">Asistanı</span>' +
      '<span class="nav-analiz-beta__pill">BETA</span>' +
      "</span></span></a>" +
      '<div class="nav-group' +
      (yksOpen ? " nav-group--open" : "") +
      '" data-nav-group>' +
      '<button type="button" class="nav-item nav-group__trigger" aria-expanded="' +
      (yksOpen ? "true" : "false") +
      '" aria-controls="yks-st-coach-yks-sub" id="yks-st-coach-yks-btn">' +
      iconYks() +
      "YKS Simülasyon" +
      chevron() +
      "</button>" +
      '<div class="nav-group__sub" id="yks-st-coach-yks-sub" role="group" aria-label="YKS Simülasyon alt menü">' +
      yksSub +
      "</div></div>" +
      '<div class="nav-group" data-nav-group>' +
      '<button type="button" class="nav-item nav-group__trigger" aria-expanded="false" aria-controls="yks-st-coach-den-sub">' +
      iconDen +
      "Denemeler" +
      chevron() +
      "</button>" +
      '<div class="nav-group__sub" id="yks-st-coach-den-sub" role="group" aria-label="Denemeler alt menü">' +
      '<a href="basit-deneme-sonuclari.html" class="nav-sub">Sonuç Merkezi</a>' +
      '<a href="analiz-merkezi.html" class="nav-sub nav-sub--analiz-beta"><span class="nav-analiz-beta"><span class="nav-analiz-beta__row1">Analiz ve Raporlama</span><span class="nav-analiz-beta__row2"><span class="nav-analiz-beta__suffix">Merkezi</span><span class="nav-analiz-beta__pill">BETA</span></span></span></a>' +
      '<a href="denemeler-global-takvim.html" class="nav-sub">Global Deneme Takvimi</a>' +
      '<a href="kurum-deneme-takvimi.html" class="nav-sub">Kurum Deneme Takvimi</a>' +
      '<a href="deneme-sonuclari-yukleme.html" class="nav-sub">Deneme Sonuçları Yükleme</a>' +
      '<a href="optik-okuyucu.html" class="nav-sub">Optik Okuyucu</a>' +
      '<a href="okutulan-denemeler.html" class="nav-sub">Okutulan Denemeler</a>' +
      "</div></div>" +
      '<div class="nav-group" data-nav-group>' +
      '<button type="button" class="nav-item nav-group__trigger" aria-expanded="false" aria-controls="yks-st-coach-wp-sub">' +
      iconCal() +
      "Haftalık Program" +
      chevron() +
      "</button>" +
      '<div class="nav-group__sub" id="yks-st-coach-wp-sub" role="group" aria-label="Haftalık Program alt menü">' +
      '<a href="haftalik-program-olusturucu.html" class="nav-sub">Haftalık Program Oluşturucu</a>' +
      '<a href="kayitli-haftalik-programlar.html" class="nav-sub">Kayıtlı Haftalık Programlar</a>' +
      '<a href="haftalik-program.html" class="nav-sub">Öğrenciye program gönder</a>' +
      "</div></div>" +
      '<div class="nav-group" data-nav-group>' +
      '<button type="button" class="nav-item nav-group__trigger" aria-expanded="false" aria-controls="yks-st-coach-mr-sub">' +
      iconMr +
      "MR" +
      chevron() +
      "</button>" +
      '<div class="nav-group__sub" id="yks-st-coach-mr-sub" role="group" aria-label="MR alt menü">' +
      '<a href="konu-mr.html" class="nav-sub">Konu MR</a>' +
      '<a href="soru-mr.html" class="nav-sub">Soru MR</a>' +
      '<a href="deneme-mr.html" class="nav-sub">Deneme MR</a>' +
      "</div></div>" +
      '<div class="nav-group" data-nav-group>' +
      '<button type="button" class="nav-item nav-group__trigger" aria-expanded="false" aria-controls="yks-st-coach-kitap-sub">' +
      iconKitap +
      "Kitap Kütüphanesi" +
      chevron() +
      "</button>" +
      '<div class="nav-group__sub" id="yks-st-coach-kitap-sub" role="group" aria-label="Kitap Kütüphanesi alt menü">' +
      '<a href="kitaplar.html" class="nav-sub">Kitap Listesi &amp; Kayıt</a>' +
      '<a href="kaynak-atama.html" class="nav-sub">Kaynak Atama</a>' +
      "</div></div>" +
      '<div class="nav-group" data-nav-group>' +
      '<button type="button" class="nav-item nav-group__trigger" aria-expanded="false" aria-controls="yks-st-coach-tm-sub">' +
      iconTm +
      "Test Maker" +
      chevron() +
      "</button>" +
      '<div class="nav-group__sub" id="yks-st-coach-tm-sub" role="group" aria-label="Test Maker alt menü">' +
      '<a href="test-olusturucu.html" class="nav-sub">Test Oluşturucu</a>' +
      '<a href="otomatik-soru-kirpici.html" class="nav-sub">Otomatik Soru Kırpıcı</a>' +
      '<a href="soru-havuzu.html" class="nav-sub">Soru Havuzu</a>' +
      "</div></div>" +
      '<div class="nav-group" data-nav-group>' +
      '<button type="button" class="nav-item nav-group__trigger" aria-expanded="false" aria-controls="yks-st-coach-hr-sub" id="yks-st-coach-hr-btn">' +
      iconHr +
      "Hata Reçetesi" +
      chevron() +
      "</button>" +
      '<div class="nav-group__sub" id="yks-st-coach-hr-sub" role="group" aria-label="Hata Reçetesi alt menü">' +
      '<a href="recete-yaz.html" class="nav-sub">Reçete Yaz</a>' +
      '<a href="recete-deposu.html" class="nav-sub">Reçete Deposu</a>' +
      '<a href="hatali-soru-havuzu.html" class="nav-sub">Hatalı Soru Havuzu</a>' +
      "</div></div>" +
      '<div class="nav-group" data-nav-group>' +
      '<button type="button" class="nav-item nav-group__trigger" aria-expanded="false" aria-controls="yks-st-coach-tf-sub">' +
      iconTf +
      "Taramalar ve Fasiküller" +
      chevron() +
      "</button>" +
      '<div class="nav-group__sub" id="yks-st-coach-tf-sub" role="group" aria-label="Taramalar ve Fasiküller alt menü">' +
      '<a href="tarama-analiz.html" class="nav-sub"><span>Tarama Analiz ve Raporlama</span></a>' +
      '<a href="tarama-olusturucu.html" class="nav-sub"><span>Tarama Oluşturma</span></a>' +
      '<a href="tarama-deposu.html" class="nav-sub"><span>Tarama Deposu</span></a>' +
      '<a href="#" class="nav-sub nav-sub--disabled" aria-disabled="true" onclick="event.preventDefault()"><span>Fasikül Oluşturma</span><span class="nav-sub__badge">Yakında</span></a>' +
      '<a href="#" class="nav-sub nav-sub--disabled" aria-disabled="true" onclick="event.preventDefault()"><span>Fasikül Deposu</span><span class="nav-sub__badge">Yakında</span></a>' +
      "</div></div>" +
      "</nav>" +
      '<div class="theme-switcher" role="group" aria-label="Görünüm teması"><span class="theme-switcher__label">Tema</span><div class="theme-switcher__swatches">' +
      '<button type="button" class="theme-swatch theme-swatch--dark" data-theme="dark" aria-pressed="false" aria-label="Koyu tema"></button>' +
      '<button type="button" class="theme-swatch theme-swatch--light" data-theme="light" aria-pressed="false" aria-label="Açık tema"></button>' +
      '<button type="button" class="theme-swatch theme-swatch--blue" data-theme="blue" aria-pressed="false" aria-label="Okyanus teması"></button>' +
      '<button type="button" class="theme-swatch theme-swatch--orange" data-theme="orange" aria-pressed="false" aria-label="Gün batımı teması"></button>' +
      "</div></div>" +
      '<div class="sidebar__logout"><button type="button" class="btn-logout">Çıkış<span class="btn-logout__arrow" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span></button></div>' +
      "</aside>"
    );
  }

  function wrap() {
    var main = document.querySelector("body > main.main.og-partial-main");
    if (!main || main.closest("#yks-shell-app")) return;

    var r = role();
    var active = r === "coach" ? pathKey() : studentPathKey();
    var shell = document.createElement("div");
    shell.className = "app";
    shell.id = "yks-shell-app";

    var asideHtml =
      r === "coach" ? coachSidebar(active) : studentSidebar(active);

    shell.innerHTML = asideHtml;
    document.body.insertBefore(shell, main);
    shell.appendChild(main);

    document.documentElement.classList.add("yks-standalone-root");
  }

  /* app.js DOMContentLoaded önce sidebar ister; defer sırasında hemen sar. */
  wrap();
})();

