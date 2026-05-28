/**
 * Derecepanel — Sidebar: Test Maker alt menü (tek doğruluk kaynağı)
 *
 * Statik HTML sayfalarında Test Maker ile Taramalar ve Fasiküller arasına
 * şu bağlantılar içeren "Hata Reçetesi" accordion da eklenmiştir:
 *   Reçete Yaz → recete-yaz.html
 *   Reçete Deposu → recete-deposu.html
 *   Hatalı Soru Havuzu → hatali-soru-havuzu.html
 * Statik HTML sayfalarındaki Test Maker bloğu bu dizisiyle birebir olmalıdır:
 *   Test Oluşturucu → test-olusturucu.html
 *   Otomatik Soru Kırpıcı → otomatik-soru-kirpici.html
 *   Soru Havuzu → soru-havuzu.html
 *
 * Kök index.html: href öneki "pages/". pages/*.html: dosya adı yeterli.
 *
 * İsteğe bağlı: aktif sayfayı vurgulamak için getTestMakerAnchorTagsHtml kullanın.
 */
(function (global) {
  var ITEMS = [
    { file: "test-olusturucu.html", label: "Test Oluşturucu" },
    { file: "otomatik-soru-kirpici.html", label: "Otomatik Soru Kırpıcı" },
    { file: "soru-havuzu.html", label: "Soru Havuzu" },
  ];

  function hrefFor(base, file) {
    return base === "root" ? "pages/" + file : file;
  }

  /**
   * @param {{ base: 'root'|'pages', activeFile: string|null }} opts
   *   activeFile: bu sayfanın dosya adı (ör. 'otomatik-soru-kirpici.html'); yoksa null
   * @returns {string} HTML — <a class="nav-sub"> satırları (girinti yok)
   */
  function getTestMakerAnchorTagsHtml(opts) {
    var base = opts && opts.base === "root" ? "root" : "pages";
    var activeFile = (opts && opts.activeFile) || "";
    return ITEMS.map(function (it) {
      var href = hrefFor(base, it.file);
      var active = activeFile === it.file;
      var cls = "nav-sub" + (active ? " nav-sub--active" : "");
      return '<a href="' + href + '" class="' + cls + '">' + it.label + "</a>";
    }).join("\n              ");
  }

  global.DerecepanelSidebar = {
    TEST_MAKER_ITEMS: ITEMS.slice(),
    getTestMakerAnchorTagsHtml: getTestMakerAnchorTagsHtml,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
