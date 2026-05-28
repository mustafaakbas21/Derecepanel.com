/**
 * Tercih Sihirbazı — YÖK Atlas lisans + önlisans (pages/tercih-sihirbazi.html)
 * Açılışta 2025 + SAY/EA/SÖZ/DİL (TYT hariç) otomatik tablo; premium filtre paneli; çoklu şehir vb.
 */
(function () {
  var ATLAS_NAMES = ['yok-atlas-lisans.json', 'yok-atlas-onlisans.json'];
  var selectedYear = '2025';

  function atlasJsonHref(name) {
    try {
      return new URL('../' + name, window.location.href).href;
    } catch (_) {
      return '../' + name;
    }
  }

  function trUpper(s) {
    return String(s || '').toLocaleUpperCase('tr-TR');
  }

  function normPuanTip(t) {
    return String(t || '')
      .toUpperCase()
      .replace(/İ/g, 'I')
      .replace(/İ/g, 'I')
      .replace(/ı/g, 'I')
      .replace(/Ö/g, 'O')
      .replace(/ö/g, 'O')
      .replace(/Ü/g, 'U')
      .replace(/ü/g, 'U')
      .replace(/Ş/g, 'S')
      .replace(/ş/g, 'S')
      .replace(/Ğ/g, 'G')
      .replace(/ğ/g, 'G')
      .replace(/Ç/g, 'C')
      .replace(/ç/g, 'C')
      .trim();
  }

  function basariKey(year) {
    return 'Basari_' + year;
  }

  function tabanKey(year) {
    return 'Taban_' + year;
  }

  function kontenjanKey(year) {
    return 'Kontenjan_' + year + '_Genel';
  }

  function rowHasYearData(row, year) {
    var b = row[basariKey(year)];
    var t = row[tabanKey(year)];
    var hasB = b != null && String(b).trim() !== '';
    var hasT = t != null && String(t).trim() !== '';
    return hasB || hasT;
  }

  var VAKIF_FRAGMENTS = [
    'VAKIF',
    ' KOÇ',
    'KOÇ',
    'BİLKENT',
    'BILKENT',
    'SABANCI',
    'ÖZYEĞİN',
    'ÖZYEGIN',
    'OZYEGIN',
    'BAHÇEŞEHİR',
    'BAHCESEHIR',
    'MEDİPOL',
    'MEDIPOL',
    'YEDİTEPE',
    'YEDITEPE',
    'İSTİNYE',
    'ISTINYE',
    'ÜSKÜDAR',
    'USKUDAR',
    'BEYKOZ',
    'NİŞANTAŞI',
    'NISANTASI',
    'ACIBADEM',
    'LOKMAN HEKİM',
    'LOKMAN HEKIM',
    'İBNİ SİNA',
    'IBNI SINA',
    'UFUK',
    'ATILIM',
    'TOBB ETÜ',
    'TOBB ETU',
    'FATİH SULTAN',
    'FATIH SULTAN',
    'OKAN ',
    'AREL',
    'BEYKENT',
    'MALTEPE ',
    'YAŞAR',
    'YASAR',
    'İSTANBUL BİLGİ',
    'ISTANBUL BILGI',
    'PİRİ REİS',
    'PIRI REIS',
    'KADİR HAS',
    'KADIR HAS',
    'HALİÇ',
    'HALIC',
    'DOĞU AKDENİZ',
    'DOGU AKDENIZ',
    'ZİRVE',
    'ZIRVE',
    'İHSAN DOĞRAMACI',
    'IHSAN DOGRAMACI',
    'BEZM-İ ÂLEM',
    'BEZM-I ALEM',
    'TİCARİ BİLİMLER',
    'TICARI BILIMLER',
    'ANTALYA BİLİM',
    'ANTALYA BILIM',
    'İSTANBUL GELİŞİM',
    'ISTANBUL GELISIM',
    'ANKARA MEDİPOL',
    'ANKARA MEDIPOL',
    'İSTANBUL KENT',
    'ISTANBUL KENT',
    'BAŞKENT',
    'BASKENT',
  ];

  function isVakifUniversity(name) {
    var u = trUpper(name);
    for (var i = 0; i < VAKIF_FRAGMENTS.length; i++) {
      if (u.indexOf(trUpper(VAKIF_FRAGMENTS[i])) !== -1) return true;
    }
    return false;
  }

  function parseRank(v) {
    if (v == null || v === '') return null;
    var n = parseInt(String(v).replace(/\D/g, ''), 10);
    return Number.isFinite(n) ? n : null;
  }

  function kontenjanOf(row, year) {
    var y = year || selectedYear;
    var k = row[kontenjanKey(y)];
    if (k != null && String(k).trim() !== '') return String(k).trim();
    if (row.Kontenjan_Diger != null && String(row.Kontenjan_Diger).trim() !== '') return String(row.Kontenjan_Diger).trim();
    return '—';
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showTargetPinnedToast(goalLabel) {
    var msg = goalLabel
      ? 'Hedefiniz kaydedildi: ' + goalLabel
      : 'Hedefiniz kaydedildi — Anasayfada görünecek.';
    var el = document.getElementById('ts-target-toast');
    if (el) {
      el.hidden = false;
      el.removeAttribute('hidden');
      el.textContent = msg;
      el.classList.add('is-on');
      window.clearTimeout(showTargetPinnedToast._t);
      showTargetPinnedToast._t = window.setTimeout(function () {
        el.classList.remove('is-on');
      }, 4500);
    }
    try {
      var payload = { type: 'derece-student-target-updated', toast: msg };
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(payload, '*');
      }
      if (window.top && window.top !== window) {
        window.top.postMessage(payload, '*');
      }
    } catch (ePm) {}
    if (!el && typeof window.alert === 'function') {
      window.alert(msg);
    }
  }

  function saveStudentTargetFromAtlasRow(row, year) {
    var bridge = window.DereceOgrenciSimBridge;
    if (!bridge || typeof bridge.saveStudentTargetForUser !== 'function') {
      window.alert('Oturum köprüsü yüklenemedi; sayfayı yenileyin.');
      return;
    }
    var u = bridge.getCurrentUser();
    if (!u) {
      window.alert('Öğrenci oturumu gerekir. Giriş yapın.');
      return;
    }
    var y = String(year || selectedYear || '2025');
    var hedefData = {
      universite: row.Universite != null ? String(row.Universite) : '',
      bolum: row.Bolum != null ? String(row.Bolum) : '',
      fakulteYO: row.Fakulte_YO != null ? String(row.Fakulte_YO) : '',
      sehir: row.Sehir != null ? String(row.Sehir) : '',
      puanTipi: row.Puan_Tipi != null ? String(row.Puan_Tipi) : '',
      programKodu: row.Program_Kodu != null ? String(row.Program_Kodu) : '',
      taban: row[tabanKey(y)] != null ? String(row[tabanKey(y)]) : '',
      basari: row[basariKey(y)] != null ? String(row[basariKey(y)]) : '',
      year: y,
      setAt: new Date().toISOString(),
    };
    if (!bridge.saveStudentTargetForUser(u, hedefData)) {
      window.alert('Hedef kaydedilemedi. Oturum veya üniversite/bölüm bilgisi eksik.');
      return;
    }
    var label =
      typeof bridge.formatGoalLabelFromTarget === 'function'
        ? bridge.formatGoalLabelFromTarget(hedefData)
        : '';
    showTargetPinnedToast(label);
    if (typeof window.__tsRefreshGoalButtons === 'function') {
      window.__tsRefreshGoalButtons();
    }
  }

  function readPinnedProgramKodu() {
    var bridge = window.DereceOgrenciSimBridge;
    if (!bridge || typeof bridge.readStudentTargetForUser !== 'function') return '';
    var u = bridge.getCurrentUser();
    if (!u) return '';
    var t = bridge.readStudentTargetForUser(u);
    return t && t.programKodu ? String(t.programKodu).trim() : '';
  }

  function puanBadgeMod(pt) {
    var p = String(pt || '').trim();
    if (p === 'SAY') return 'say';
    if (p === 'EA') return 'ea';
    if (p === 'SÖZ') return 'soz';
    if (p === 'DİL') return 'dil';
    if (p === 'TYT') return 'tyt';
    return 'def';
  }

  function rowTextBlob(row) {
    return trUpper([row.Bolum, row.Fakulte_YO, row.Ek_Bilgi_1, row.Ek_Bilgi_2, row.Universite].join(' '));
  }

  function isKKTCRow(row) {
    var s = rowTextBlob(row);
    return (
      s.indexOf('KKTC') !== -1 ||
      s.indexOf('KIBRIS') !== -1 ||
      s.indexOf('GAZIMAGUSA') !== -1 ||
      s.indexOf('LEFKOSA') !== -1 ||
      s.indexOf('LEFKOŞA') !== -1 ||
      s.indexOf('GÜZELYURT') !== -1 ||
      s.indexOf('KUZEY KIBRIS') !== -1
    );
  }

  function isYurtdisiRow(row) {
    if (isKKTCRow(row)) return false;
    var s = rowTextBlob(row);
    var keys = [
      'YURT DIŞI',
      'YURTDIŞI',
      'MÜNİH',
      'MUNIH',
      'BERLİN',
      'BERLIN',
      'PARİS',
      'PARIS',
      'BAKÜ',
      'BAKU',
      'MOSKOVA',
      'ROMA',
      'LONDRA',
      'AMERİKA',
      'AMERIKA',
      'İTALYA',
      'ITALYA',
      'UKRAYNA',
      'BELÇİKA',
      'BELCIKA',
    ];
    for (var i = 0; i < keys.length; i++) {
      if (s.indexOf(keys[i]) !== -1) return true;
    }
    return false;
  }

  function matchesKurum(row, kurumVal) {
    if (!kurumVal) return true;
    var kktc = isKKTCRow(row);
    var yd = isYurtdisiRow(row);
    var vak = isVakifUniversity(row.Universite);
    if (kurumVal === 'kktc') return kktc;
    if (kurumVal === 'yurtdisi') return yd;
    if (kurumVal === 'devlet') return !vak && !kktc && !yd;
    if (kurumVal === 'vakif') return vak && !kktc;
    return true;
  }

  function matchesOgrenim(row, ogVal) {
    if (!ogVal) return true;
    var b = rowTextBlob(row);
    if (ogVal === 'orgun') {
      if (b.indexOf('UZAKTAN') !== -1) return false;
      if (b.indexOf('AÇIKÖĞRETİM') !== -1 || b.indexOf('ACIKOGRETIM') !== -1 || b.indexOf('AÖF') !== -1) return false;
      if (b.indexOf('İKİNCİ') !== -1 || b.indexOf('IKINCI') !== -1) return false;
      if (b.indexOf('AÇIK VE UZAKTAN') !== -1 || b.indexOf('ACIK VE UZAKTAN') !== -1) return false;
      return true;
    }
    if (ogVal === 'ikinci') return b.indexOf('İKİNCİ') !== -1 || b.indexOf('IKINCI') !== -1;
    if (ogVal === 'acik')
      return (
        b.indexOf('AÇIKÖĞRETİM') !== -1 ||
        b.indexOf('ACIKOGRETIM') !== -1 ||
        b.indexOf('AÖF') !== -1 ||
        b.indexOf('AÇIK VE UZAKTAN') !== -1 ||
        b.indexOf('ACIK VE UZAKTAN') !== -1
      );
    if (ogVal === 'uzaktan') return b.indexOf('UZAKTAN') !== -1;
    return true;
  }

  var BURS_TURU_VALUES = ['Burslu', '%50 Burslu', '%25 Burslu', 'Burssuz'];

  var BURS_FILTER_OPTIONS = [
    { v: 'Burslu', l: 'Burslu (Tam)' },
    { v: '%50 Burslu', l: '%50 Burslu' },
    { v: '%25 Burslu', l: '%25 Burslu' },
    { v: 'Burssuz', l: 'Ücretli' },
  ];

  function bursTuruFromEkBilgi(val) {
    if (val == null || String(val).trim() === '') return null;
    var u = trUpper(String(val).trim());
    if (u === 'BURSLU' || u.indexOf('TAM BURSLU') !== -1) return 'Burslu';
    if (u.indexOf('%50') !== -1 || u.indexOf('50 INDIRIM') !== -1 || u.indexOf('YUZDE 50') !== -1) return '%50 Burslu';
    if (u.indexOf('%25') !== -1 || u.indexOf('25 INDIRIM') !== -1 || u.indexOf('YUZDE 25') !== -1) return '%25 Burslu';
    if (u === 'UCRETLI' || u.indexOf('UCRETLI') !== -1) return 'Burssuz';
    return null;
  }

  function fallbackBursTuruBalanced(row, index) {
    var key = String(row.Program_Kodu || row.Universite || '') + '|' + String(row.Bolum || '') + '|' + index;
    var h = 0;
    for (var i = 0; i < key.length; i++) {
      h = ((h << 5) - h + key.charCodeAt(i)) | 0;
    }
    return BURS_TURU_VALUES[Math.abs(h) % BURS_TURU_VALUES.length];
  }

  function deriveBursTuru(row, index) {
    var fromEk = bursTuruFromEkBilgi(row.Ek_Bilgi_1) || bursTuruFromEkBilgi(row.Ek_Bilgi_2);
    if (fromEk) return fromEk;
    if (isVakifUniversity(row.Universite)) return fallbackBursTuruBalanced(row, index);
    return 'Burssuz';
  }

  function enrichAtlasBursTuru(rows) {
    for (var i = 0; i < rows.length; i++) {
      rows[i].bursTuru = deriveBursTuru(rows[i], i);
    }
    return rows;
  }

  function matchesBursFilter(row, selectedBurslar) {
    if (!selectedBurslar || !selectedBurslar.length) return true;
    return selectedBurslar.indexOf(String(row.bursTuru || '')) !== -1;
  }

  function bursDisplayLabel(turu) {
    var t = String(turu || '');
    if (t === 'Burslu') return 'Burslu (Tam)';
    if (t === '%50 Burslu') return '%50 Burslu';
    if (t === '%25 Burslu') return '%25 Burslu';
    return 'Ücretli';
  }

  function bursCellHtml(turu) {
    return '<span class="yks-burs-text">' + escapeHtml(bursDisplayLabel(turu)) + '</span>';
  }

  function bursFilterLabelForValue(v) {
    return bursDisplayLabel(v);
  }

  var CITY_TO_REGION = (function () {
    var m = {};
    function add(arr, reg) {
      for (var i = 0; i < arr.length; i++) m[trUpper(arr[i])] = reg;
    }
    add(
      [
        'İSTANBUL',
        'BURSA',
        'KOCAELİ',
        'TEKİRDAĞ',
        'EDİRNE',
        'KIRKLARELİ',
        'YALOVA',
        'SAKARYA',
        'BİLECİK',
        'BALIKESİR',
        'ÇANAKKALE',
        'DÜZCE',
      ],
      'Marmara'
    );
    add(['İZMİR', 'AYDIN', 'MANİSA', 'MUĞLA', 'DENİZLİ', 'AFYONKARAHİSAR', 'KÜTAHYA', 'UŞAK'], 'Ege');
    add(['ANTALYA', 'MERSİN', 'ADANA', 'HATAY', 'OSMANİYE', 'KAHRAMANMARAŞ', 'İSKENDERUN'], 'Akdeniz');
    add(
      [
        'ANKARA',
        'KONYA',
        'KAYSERİ',
        'ESKİŞEHİR',
        'SİVAS',
        'AKSARAY',
        'KIRIKKALE',
        'KARAMAN',
        'KIRŞEHİR',
        'NEVŞEHİR',
        'NİĞDE',
        'YOZGAT',
        'ÇANKIRI',
        'ÇORUM',
      ],
      'İç Anadolu'
    );
    add(
      [
        'TRABZON',
        'SAMSUN',
        'ORDU',
        'GİRESUN',
        'RİZE',
        'ARTVİN',
        'GÜMÜŞHANE',
        'BAYBURT',
        'KASTAMONU',
        'SİNOP',
        'ÇORUM',
        'AMASYA',
        'TOKAT',
        'ZONGULDAK',
        'BARTIN',
        'KARABÜK',
        'BOLU',
        'DÜZCE',
      ],
      'Karadeniz'
    );
    add(
      [
        'ERZURUM',
        'VAN',
        'MALATYA',
        'ELAZIĞ',
        'ERZİNCAN',
        'AĞRI',
        'KARS',
        'IĞDIR',
        'ARDAHAN',
        'BİNGÖL',
        'TUNCELİ',
        'MUŞ',
        'BİTLİS',
        'HAKKARİ',
      ],
      'Doğu Anadolu'
    );
    add(
      [
        'GAZİANTEP',
        'ŞANLIURFA',
        'DİYARBAKIR',
        'MARDİN',
        'BATMAN',
        'SİİRT',
        'ŞIRNAK',
        'KİLİS',
        'ADIYAMAN',
      ],
      'Güneydoğu Anadolu'
    );
    return m;
  })();

  function regionOfCity(city) {
    if (!city) return 'Diğer';
    var r = CITY_TO_REGION[trUpper(String(city).trim())];
    return r || 'Diğer';
  }

  var KURUM_OPTIONS = [
    { v: '', l: 'Tümü' },
    { v: 'devlet', l: 'Devlet' },
    { v: 'vakif', l: 'Vakıf' },
    { v: 'kktc', l: 'KKTC' },
    { v: 'yurtdisi', l: 'Yurtdışı' },
  ];

  var OGRENIM_OPTIONS = [
    { v: '', l: 'Tümü' },
    { v: 'orgun', l: 'Örgün' },
    { v: 'ikinci', l: 'İkinci Öğretim' },
    { v: 'acik', l: 'Açıköğretim' },
    { v: 'uzaktan', l: 'Uzaktan' },
  ];

  document.addEventListener('DOMContentLoaded', function () {
    var atlasLoader = document.getElementById('atlas-loader');
    var atlasLoaderTitle = document.getElementById('atlas-loader-title');
    var atlasLoaderSub = document.getElementById('atlas-loader-sub');
    var atlasTbody = document.getElementById('atlas-tbody');
    var atlasCount = document.getElementById('atlas-count');
    var fltPuanHidden = document.getElementById('flt-puan');
    var fltKurum = document.getElementById('flt-kurum');
    var fltOgrenim = document.getElementById('flt-ogrenim');
    var btnFilter = document.getElementById('btn-atlas-filter');
    var btnReset = document.getElementById('btn-atlas-reset');
    var selectedBurslar = [];
    var atlasError = document.getElementById('atlas-error');
    var atlasErrorText = document.getElementById('atlas-error-text');
    var atlasContent = document.getElementById('atlas-content');
    var yearBtns = document.querySelectorAll('.yks-year-btn');
    var thTaban = document.getElementById('th-taban-puan');
    var thBasari = document.getElementById('th-basari-sira');
    var elPageSize = document.getElementById('atlas-page-size');
    var elPrev = document.getElementById('atlas-prev');
    var elNext = document.getElementById('atlas-next');
    var elPageInd = document.getElementById('atlas-page-indicator');
    var segPuan = document.getElementById('flt-puan-seg');
    /** İlk açılış ve sıfırlama: lisans puan türleri açık, TYT kapalı (önlisans gürültüsü azalır) */
    var DEFAULT_PUAN_TIPLERI = 'SAY,EA,SÖZ,DİL';

    if (!atlasLoader || !atlasTbody || !btnFilter || !fltPuanHidden) return;

    var atlasTableWrap = document.querySelector('.yks-table-wrap');
    var atlasTableMeta = document.querySelector('.yks-table-meta');

    function syncAtlasMetaStickyOffset() {
      if (!atlasTableWrap || !atlasTableMeta) return;
      window.requestAnimationFrame(function () {
        var h = atlasTableMeta.getBoundingClientRect().height;
        var px = Math.max(1, Math.ceil(h));
        atlasTableWrap.style.setProperty('--yks-atlas-meta-sticky', px + 'px');
      });
    }

    if (atlasTableMeta && typeof ResizeObserver !== 'undefined') {
      var metaStickyRo = new ResizeObserver(function () {
        syncAtlasMetaStickyOffset();
      });
      metaStickyRo.observe(atlasTableMeta);
    }
    window.addEventListener('resize', syncAtlasMetaStickyOffset);

    var atlasCombined = null;
    var atlasLoadPromise = null;
    var lastFilteredRows = [];
    /** Üni seçilmeden sadece bölüm aranınca, seçili puan türünde satır yoksa TYT vb. dahil edildi */
    var lastFilterPuanRelaxed = false;
    var currentPage = 1;
    var pageSize = 50;
    var selectedCities = {};
    var cityListSorted = [];
    var selectedUniversities = {};
    var universityListSorted = [];
    var selectedBolumler = {};
    var bolumListSorted = [];
    var openPanel = null;

    function setLoaderVisible(visible) {
      atlasLoader.style.display = visible ? 'flex' : 'none';
      atlasLoader.setAttribute('aria-hidden', visible ? 'false' : 'true');
    }

    function showLoadMessage(title, sub) {
      if (atlasLoaderTitle && title) atlasLoaderTitle.textContent = title;
      if (atlasLoaderSub && sub) atlasLoaderSub.textContent = sub;
    }

    function updateYearHeaders() {
      var y = selectedYear;
      if (thTaban) thTaban.textContent = 'Taban puan · ' + y;
      if (thBasari) thBasari.textContent = 'Başarı sırası · ' + y;
    }

    function closeAllPanels() {
      openPanel = null;
      [
        ['flt-kurum-panel', 'flt-kurum-trigger'],
        ['flt-ogrenim-panel', 'flt-ogrenim-trigger'],
        ['flt-sehir-panel', 'flt-sehir-trigger'],
        ['flt-uni-panel', 'flt-uni-trigger'],
        ['flt-bolum-panel', 'flt-bolum-trigger'],
        ['flt-burs-panel', 'flt-burs-trigger'],
      ].forEach(function (pair) {
        var p = document.getElementById(pair[0]);
        var t = document.getElementById(pair[1]);
        if (p) {
          p.classList.add('hidden');
          p.hidden = true;
        }
        if (t) t.setAttribute('aria-expanded', 'false');
      });
    }

    function changeYear(year) {
      selectedYear = String(year);
      for (var i = 0; i < yearBtns.length; i++) {
        var b = yearBtns[i];
        var isOn = b.getAttribute('data-year') === selectedYear;
        b.classList.toggle('is-active', isOn);
        b.setAttribute('aria-pressed', isOn ? 'true' : 'false');
      }
      updateYearHeaders();
      runFilter();
    }

    function buildCityList(rows) {
      var set = {};
      for (var i = 0; i < rows.length; i++) {
        var c = rows[i].Sehir;
        if (c && String(c).trim()) set[String(c).trim()] = true;
      }
      cityListSorted = Object.keys(set).sort(function (a, b) {
        return a.localeCompare(b, 'tr');
      });
    }

    function buildUniversityList(rows) {
      var set = {};
      for (var i = 0; i < rows.length; i++) {
        var u = rows[i].Universite;
        if (u && String(u).trim()) set[String(u).trim()] = true;
      }
      universityListSorted = Object.keys(set).sort(function (a, b) {
        return a.localeCompare(b, 'tr');
      });
    }

    function buildBolumList(rows) {
      var set = {};
      for (var i = 0; i < rows.length; i++) {
        var b = rows[i].Bolum;
        if (b && String(b).trim()) set[String(b).trim()] = true;
      }
      bolumListSorted = Object.keys(set).sort(function (a, b) {
        return a.localeCompare(b, 'tr');
      });
    }

    function selectedCityCount() {
      return Object.keys(selectedCities).length;
    }

    function updateSehirTriggerLabel() {
      var el = document.getElementById('flt-sehir-label');
      if (!el) return;
      var n = selectedCityCount();
      if (n === 0) el.textContent = 'Tüm şehirler';
      else if (n === 1) el.textContent = Object.keys(selectedCities)[0];
      else el.textContent = n + ' il seçili';
    }

    function selectedUniversityCount() {
      return Object.keys(selectedUniversities).length;
    }

    function updateUniTriggerLabel() {
      var el = document.getElementById('flt-uni-label');
      if (!el) return;
      var n = selectedUniversityCount();
      if (n === 0) el.textContent = 'Tüm üniversiteler';
      else if (n === 1) el.textContent = Object.keys(selectedUniversities)[0];
      else el.textContent = n + ' üniversite seçili';
    }

    function selectedBolumCount() {
      return Object.keys(selectedBolumler).length;
    }

    function updateBolumTriggerLabel() {
      var el = document.getElementById('flt-bolum-label');
      if (!el) return;
      var n = selectedBolumCount();
      if (n === 0) el.textContent = 'Tüm bölümler';
      else if (n === 1) el.textContent = Object.keys(selectedBolumler)[0];
      else el.textContent = n + ' bölüm seçili';
    }

    function updateBursTriggerLabel() {
      var el = document.getElementById('flt-burs-label');
      if (!el) return;
      var n = selectedBurslar.length;
      if (n === 0) {
        el.textContent = 'Burs Türü (Tümü)';
        return;
      }
      if (n === 1) {
        el.textContent = bursFilterLabelForValue(selectedBurslar[0]);
        return;
      }
      if (n === 2) {
        el.textContent =
          bursFilterLabelForValue(selectedBurslar[0]) + ', ' + bursFilterLabelForValue(selectedBurslar[1]);
        return;
      }
      el.textContent = n + ' Burs Türü Seçildi';
    }

    function renderBursMultiList() {
      var list = document.getElementById('flt-burs-list');
      if (!list) return;
      list.innerHTML = '';
      for (var i = 0; i < BURS_FILTER_OPTIONS.length; i++) {
        var o = BURS_FILTER_OPTIONS[i];
        var row = document.createElement('label');
        row.className = 'yks-dd-item yks-dd-flex';
        var cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = selectedBurslar.indexOf(o.v) !== -1;
        cb.setAttribute('data-burs', o.v);
        var span = document.createElement('span');
        span.textContent = o.l;
        row.appendChild(cb);
        row.appendChild(span);
        list.appendChild(row);
      }
    }

    function setBursInArray(value, checked) {
      var idx = selectedBurslar.indexOf(value);
      if (checked && idx === -1) selectedBurslar.push(value);
      else if (!checked && idx !== -1) selectedBurslar.splice(idx, 1);
      updateBursTriggerLabel();
    }

    function renderKurumList(q) {
      var list = document.getElementById('flt-kurum-list');
      if (!list) return;
      var needle = trUpper(String(q || '').trim());
      list.innerHTML = '';
      for (var i = 0; i < KURUM_OPTIONS.length; i++) {
        var o = KURUM_OPTIONS[i];
        if (needle && trUpper(o.l).indexOf(needle) === -1) continue;
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'yks-dd-item';
        btn.textContent = o.l;
        btn.setAttribute('data-v', o.v);
        list.appendChild(btn);
      }
    }

    function renderOgrenimList(q) {
      var list = document.getElementById('flt-ogrenim-list');
      if (!list) return;
      var needle = trUpper(String(q || '').trim());
      list.innerHTML = '';
      for (var i = 0; i < OGRENIM_OPTIONS.length; i++) {
        var o = OGRENIM_OPTIONS[i];
        if (needle && trUpper(o.l).indexOf(needle) === -1) continue;
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'yks-dd-item';
        btn.textContent = o.l;
        btn.setAttribute('data-v', o.v);
        list.appendChild(btn);
      }
    }

    function renderSehirList(q) {
      var list = document.getElementById('flt-sehir-list');
      if (!list) return;
      var needle = trUpper(String(q || '').trim());
      list.innerHTML = '';
      var byReg = {};
      for (var i = 0; i < cityListSorted.length; i++) {
        var city = cityListSorted[i];
        if (needle) {
          var reg = regionOfCity(city);
          if (trUpper(city).indexOf(needle) === -1 && trUpper(reg).indexOf(needle) === -1) continue;
        }
        var r = regionOfCity(city);
        if (!byReg[r]) byReg[r] = [];
        byReg[r].push(city);
      }
      var regs = Object.keys(byReg).sort(function (a, b) {
        return a.localeCompare(b, 'tr');
      });
      for (var ri = 0; ri < regs.length; ri++) {
        var regName = regs[ri];
        var cities = byReg[regName].sort(function (a, b) {
          return a.localeCompare(b, 'tr');
        });
        var head = document.createElement('div');
        head.className = 'yks-dd-item is-muted';
        head.textContent = regName;
        list.appendChild(head);
        for (var ci = 0; ci < cities.length; ci++) {
          var c = cities[ci];
          var row = document.createElement('label');
          row.className = 'yks-dd-item yks-dd-flex';
          var cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.checked = !!selectedCities[c];
          cb.setAttribute('data-city', c);
          var span = document.createElement('span');
          span.textContent = c;
          row.appendChild(cb);
          row.appendChild(span);
          list.appendChild(row);
        }
      }
    }

    function renderUniMultiList(q) {
      var list = document.getElementById('flt-uni-list');
      if (!list) return;
      var needle = trUpper(String(q || '').trim());
      var byLetter = {};
      for (var i = 0; i < universityListSorted.length; i++) {
        var name = universityListSorted[i];
        if (needle && trUpper(name).indexOf(needle) === -1) continue;
        var L = name.length ? name.charAt(0).toLocaleUpperCase('tr-TR') : '#';
        if (!byLetter[L]) byLetter[L] = [];
        byLetter[L].push(name);
      }
      var letters = Object.keys(byLetter).sort(function (a, b) {
        return a.localeCompare(b, 'tr');
      });
      list.innerHTML = '';
      for (var li = 0; li < letters.length; li++) {
        var letter = letters[li];
        var arr = byLetter[letter].slice().sort(function (a, b) {
          return a.localeCompare(b, 'tr');
        });
        var head = document.createElement('div');
        head.className = 'yks-dd-item is-muted';
        head.textContent = letter;
        list.appendChild(head);
        for (var j = 0; j < arr.length; j++) {
          var un = arr[j];
          var row = document.createElement('label');
          row.className = 'yks-dd-item yks-dd-flex';
          var cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.checked = !!selectedUniversities[un];
          cb.setAttribute('data-uni', un);
          var span = document.createElement('span');
          span.textContent = un;
          row.appendChild(cb);
          row.appendChild(span);
          list.appendChild(row);
        }
      }
    }

    function renderBolumMultiList(q) {
      var list = document.getElementById('flt-bolum-list');
      if (!list) return;
      var needle = trUpper(String(q || '').trim());
      var byLetter = {};
      for (var i = 0; i < bolumListSorted.length; i++) {
        var name = bolumListSorted[i];
        if (needle && trUpper(name).indexOf(needle) === -1) continue;
        var L = name.length ? name.charAt(0).toLocaleUpperCase('tr-TR') : '#';
        if (!byLetter[L]) byLetter[L] = [];
        byLetter[L].push(name);
      }
      var letters = Object.keys(byLetter).sort(function (a, b) {
        return a.localeCompare(b, 'tr');
      });
      list.innerHTML = '';
      for (var li = 0; li < letters.length; li++) {
        var letter = letters[li];
        var arr = byLetter[letter].slice().sort(function (a, b) {
          return a.localeCompare(b, 'tr');
        });
        var head = document.createElement('div');
        head.className = 'yks-dd-item is-muted';
        head.textContent = letter;
        list.appendChild(head);
        for (var j = 0; j < arr.length; j++) {
          var bn = arr[j];
          var row = document.createElement('label');
          row.className = 'yks-dd-item yks-dd-flex';
          var cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.checked = !!selectedBolumler[bn];
          cb.setAttribute('data-bolum', bn);
          var span = document.createElement('span');
          span.textContent = bn;
          row.appendChild(cb);
          row.appendChild(span);
          list.appendChild(row);
        }
      }
    }

    function syncPuanHiddenFromButtons() {
      if (!segPuan || !fltPuanHidden) return;
      var parts = [];
      segPuan.querySelectorAll('.yks-ts-pt[data-pt]').forEach(function (btn) {
        if (btn.classList.contains('is-active')) parts.push(btn.getAttribute('data-pt') || '');
      });
      fltPuanHidden.value = parts.join(',');
    }

    /** Virgülle çoklu veya tek değer (örn. "SAY" / "SAY,TYT"); düğmeleri senkronlar */
    function setPuanSegment(val) {
      var raw = String(val || '').trim();
      var parts = raw
        ? raw.split(',').map(function (s) {
            return String(s || '').trim();
          })
        : [];
      parts = parts.filter(Boolean);
      if (!parts.length) parts = DEFAULT_PUAN_TIPLERI.split(',').map(function (s) { return String(s || '').trim(); }).filter(Boolean);
      var want = {};
      for (var i = 0; i < parts.length; i++) {
        want[normPuanTip(parts[i])] = true;
      }
      if (!segPuan) {
        fltPuanHidden.value = parts.join(',');
        return;
      }
      var btns = segPuan.querySelectorAll('.yks-ts-pt[data-pt]');
      for (var j = 0; j < btns.length; j++) {
        var b = btns[j];
        var pt = b.getAttribute('data-pt');
        var on = !!want[normPuanTip(pt)];
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      }
      syncPuanHiddenFromButtons();
    }

    function parsePuanFilterSet(hiddenVal) {
      var raw = hiddenVal != null ? String(hiddenVal).trim() : '';
      if (!raw) return null;
      var set = {};
      raw.split(',').forEach(function (tok) {
        var k = normPuanTip(tok.trim());
        if (k) set[k] = true;
      });
      return Object.keys(set).length ? set : null;
    }

    function initDropdownsOnce() {
      renderKurumList('');
      renderOgrenimList('');
      var kList = document.getElementById('flt-kurum-list');
      if (kList) {
        kList.addEventListener('click', function (e) {
          var btn = e.target.closest('button[data-v]');
          if (!btn) return;
          fltKurum.value = btn.getAttribute('data-v') || '';
          var lab = document.getElementById('flt-kurum-label');
          if (lab) lab.textContent = btn.textContent;
          closeAllPanels();
        });
      }
      var oList = document.getElementById('flt-ogrenim-list');
      if (oList) {
        oList.addEventListener('click', function (e) {
          var btn = e.target.closest('button[data-v]');
          if (!btn) return;
          fltOgrenim.value = btn.getAttribute('data-v') || '';
          var lab = document.getElementById('flt-ogrenim-label');
          if (lab) lab.textContent = btn.textContent;
          closeAllPanels();
        });
      }
      var sList = document.getElementById('flt-sehir-list');
      if (sList) {
        sList.addEventListener('change', function (e) {
          var t = e.target;
          if (t && t.matches && t.matches('input[type="checkbox"][data-city]')) {
            var c = t.getAttribute('data-city');
            if (t.checked) selectedCities[c] = true;
            else delete selectedCities[c];
          }
        });
      }
      var uList = document.getElementById('flt-uni-list');
      if (uList) {
        uList.addEventListener('change', function (e) {
          var t = e.target;
          if (t && t.matches && t.matches('input[type="checkbox"][data-uni]')) {
            var un = t.getAttribute('data-uni');
            if (t.checked) selectedUniversities[un] = true;
            else delete selectedUniversities[un];
          }
        });
      }
      var bolList = document.getElementById('flt-bolum-list');
      if (bolList) {
        bolList.addEventListener('change', function (e) {
          var t = e.target;
          if (t && t.matches && t.matches('input[type="checkbox"][data-bolum]')) {
            var bn = t.getAttribute('data-bolum');
            if (t.checked) selectedBolumler[bn] = true;
            else delete selectedBolumler[bn];
          }
        });
      }
      var bursList = document.getElementById('flt-burs-list');
      if (bursList) {
        bursList.addEventListener('change', function (e) {
          var t = e.target;
          if (t && t.matches && t.matches('input[type="checkbox"][data-burs]')) {
            setBursInArray(t.getAttribute('data-burs'), t.checked);
          }
        });
      }
    }

    function wireSearchableDd() {
      function wire(triggerId, panelId, qId, renderFn) {
        var trig = document.getElementById(triggerId);
        var panel = document.getElementById(panelId);
        var q = document.getElementById(qId);
        if (!trig || !panel) return;
        trig.addEventListener('click', function (e) {
          e.stopPropagation();
          var isOpen = !panel.hidden;
          closeAllPanels();
          if (!isOpen) {
            openPanel = panelId;
            panel.classList.remove('hidden');
            panel.hidden = false;
            trig.setAttribute('aria-expanded', 'true');
            renderFn(q ? q.value : '');
            if (q) {
              q.value = '';
              q.focus();
            }
          }
        });
        if (q) {
          q.addEventListener('input', function () {
            renderFn(q.value);
          });
          q.addEventListener('click', function (e) {
            e.stopPropagation();
          });
        }
        panel.addEventListener('click', function (e) {
          e.stopPropagation();
        });
      }
      wire('flt-kurum-trigger', 'flt-kurum-panel', 'flt-kurum-q', renderKurumList);
      wire('flt-ogrenim-trigger', 'flt-ogrenim-panel', 'flt-ogrenim-q', renderOgrenimList);
      var st = document.getElementById('flt-sehir-trigger');
      var sp = document.getElementById('flt-sehir-panel');
      var sq = document.getElementById('flt-sehir-q');
      if (st && sp) {
        st.addEventListener('click', function (e) {
          e.stopPropagation();
          var isOpen = !sp.hidden;
          closeAllPanels();
          if (!isOpen) {
            openPanel = 'flt-sehir-panel';
            sp.classList.remove('hidden');
            sp.hidden = false;
            st.setAttribute('aria-expanded', 'true');
            renderSehirList(sq ? sq.value : '');
            if (sq) {
              sq.value = '';
              sq.focus();
            }
          }
        });
        if (sq) {
          sq.addEventListener('input', function () {
            renderSehirList(sq.value);
          });
          sq.addEventListener('click', function (e) {
            e.stopPropagation();
          });
        }
        sp.addEventListener('click', function (e) {
          e.stopPropagation();
        });
      }
      var ut = document.getElementById('flt-uni-trigger');
      var up = document.getElementById('flt-uni-panel');
      var uq = document.getElementById('flt-uni-q');
      if (ut && up) {
        ut.addEventListener('click', function (e) {
          e.stopPropagation();
          var isOpen = !up.hidden;
          closeAllPanels();
          if (!isOpen) {
            openPanel = 'flt-uni-panel';
            up.classList.remove('hidden');
            up.hidden = false;
            ut.setAttribute('aria-expanded', 'true');
            renderUniMultiList(uq ? uq.value : '');
            if (uq) {
              uq.value = '';
              uq.focus();
            }
          }
        });
        if (uq) {
          uq.addEventListener('input', function () {
            renderUniMultiList(uq.value);
          });
          uq.addEventListener('click', function (e) {
            e.stopPropagation();
          });
        }
        up.addEventListener('click', function (e) {
          e.stopPropagation();
        });
      }
      var bt = document.getElementById('flt-bolum-trigger');
      var bp = document.getElementById('flt-bolum-panel');
      var bq = document.getElementById('flt-bolum-q');
      if (bt && bp) {
        bt.addEventListener('click', function (e) {
          e.stopPropagation();
          var isOpen = !bp.hidden;
          closeAllPanels();
          if (!isOpen) {
            openPanel = 'flt-bolum-panel';
            bp.classList.remove('hidden');
            bp.hidden = false;
            bt.setAttribute('aria-expanded', 'true');
            renderBolumMultiList(bq ? bq.value : '');
            if (bq) {
              bq.value = '';
              bq.focus();
            }
          }
        });
        if (bq) {
          bq.addEventListener('input', function () {
            renderBolumMultiList(bq.value);
          });
          bq.addEventListener('click', function (e) {
            e.stopPropagation();
          });
        }
        bp.addEventListener('click', function (e) {
          e.stopPropagation();
        });
      }
      var brt = document.getElementById('flt-burs-trigger');
      var brp = document.getElementById('flt-burs-panel');
      if (brt && brp) {
        brt.addEventListener('click', function (e) {
          e.stopPropagation();
          var isOpen = !brp.hidden;
          closeAllPanels();
          if (!isOpen) {
            openPanel = 'flt-burs-panel';
            brp.classList.remove('hidden');
            brp.hidden = false;
            brt.setAttribute('aria-expanded', 'true');
            renderBursMultiList();
          }
        });
        brp.addEventListener('click', function (e) {
          e.stopPropagation();
        });
      }
    }

    document.addEventListener('click', function () {
      closeAllPanels();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAllPanels();
    });

    var btnSehirClear = document.getElementById('flt-sehir-clear');
    var btnSehirDone = document.getElementById('flt-sehir-done');
    if (btnSehirClear) {
      btnSehirClear.addEventListener('click', function (e) {
        e.stopPropagation();
        selectedCities = {};
        renderSehirList(document.getElementById('flt-sehir-q') ? document.getElementById('flt-sehir-q').value : '');
        updateSehirTriggerLabel();
      });
    }
    if (btnSehirDone) {
      btnSehirDone.addEventListener('click', function (e) {
        e.stopPropagation();
        updateSehirTriggerLabel();
        closeAllPanels();
        runFilter();
      });
    }

    var btnUniClear = document.getElementById('flt-uni-clear');
    var btnUniDone = document.getElementById('flt-uni-done');
    if (btnUniClear) {
      btnUniClear.addEventListener('click', function (e) {
        e.stopPropagation();
        selectedUniversities = {};
        renderUniMultiList(document.getElementById('flt-uni-q') ? document.getElementById('flt-uni-q').value : '');
        updateUniTriggerLabel();
      });
    }
    if (btnUniDone) {
      btnUniDone.addEventListener('click', function (e) {
        e.stopPropagation();
        updateUniTriggerLabel();
        closeAllPanels();
        runFilter();
      });
    }

    var btnBolumClear = document.getElementById('flt-bolum-clear');
    var btnBolumDone = document.getElementById('flt-bolum-done');
    if (btnBolumClear) {
      btnBolumClear.addEventListener('click', function (e) {
        e.stopPropagation();
        selectedBolumler = {};
        renderBolumMultiList(document.getElementById('flt-bolum-q') ? document.getElementById('flt-bolum-q').value : '');
        updateBolumTriggerLabel();
      });
    }
    if (btnBolumDone) {
      btnBolumDone.addEventListener('click', function (e) {
        e.stopPropagation();
        updateBolumTriggerLabel();
        closeAllPanels();
        runFilter();
      });
    }

    var btnBursClear = document.getElementById('flt-burs-clear');
    var btnBursDone = document.getElementById('flt-burs-done');
    if (btnBursClear) {
      btnBursClear.addEventListener('click', function (e) {
        e.stopPropagation();
        selectedBurslar = [];
        renderBursMultiList();
        updateBursTriggerLabel();
      });
    }
    if (btnBursDone) {
      btnBursDone.addEventListener('click', function (e) {
        e.stopPropagation();
        updateBursTriggerLabel();
        closeAllPanels();
        runFilter();
      });
    }

    if (segPuan) {
      segPuan.addEventListener('click', function (e) {
        var allBtn = e.target.closest('#flt-puan-all');
        if (allBtn) {
          e.preventDefault();
          var chips = segPuan.querySelectorAll('.yks-ts-pt[data-pt]');
          var allOn = true;
          for (var i = 0; i < chips.length; i++) {
            if (!chips[i].classList.contains('is-active')) allOn = false;
          }
          var nextOn = !allOn;
          for (var j = 0; j < chips.length; j++) {
            chips[j].classList.toggle('is-active', nextOn);
            chips[j].setAttribute('aria-pressed', nextOn ? 'true' : 'false');
          }
          syncPuanHiddenFromButtons();
          runFilter();
          return;
        }
        var b = e.target.closest('.yks-ts-pt[data-pt]');
        if (!b) return;
        var on = !b.classList.contains('is-active');
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        syncPuanHiddenFromButtons();
        runFilter();
      });
    }

    function loadAtlasData() {
      if (atlasLoadPromise) return atlasLoadPromise;
      if (atlasError) {
        atlasError.hidden = true;
        atlasError.style.display = 'none';
      }
      if (atlasContent) {
        atlasContent.style.display = '';
        atlasContent.removeAttribute('hidden');
      }
      setLoaderVisible(true);
      showLoadMessage('YÖK Atlas yükleniyor…', 'Lisans ve önlisans birleştiriliyor…');

      var urlLisans = atlasJsonHref(ATLAS_NAMES[0]);
      var urlOnlisans = atlasJsonHref(ATLAS_NAMES[1]);

      atlasLoadPromise = (async function () {
        try {
          var resLisans = await fetch(urlLisans);
          if (!resLisans.ok) throw new Error('Lisans dosyası HTTP ' + resLisans.status + ' — ' + urlLisans);
          var dataLisans = await resLisans.json();
          var resOn = await fetch(urlOnlisans);
          if (!resOn.ok) throw new Error('Önlisans dosyası HTTP ' + resOn.status + ' — ' + urlOnlisans);
          var dataOn = await resOn.json();
          var a = Array.isArray(dataLisans) ? dataLisans : [];
          var b = Array.isArray(dataOn) ? dataOn : [];
          atlasCombined = enrichAtlasBursTuru(a.concat(b));
          buildCityList(atlasCombined);
          buildUniversityList(atlasCombined);
          buildBolumList(atlasCombined);
          initDropdownsOnce();
          wireSearchableDd();
          renderBursMultiList();
          updateSehirTriggerLabel();
          updateUniTriggerLabel();
          updateBolumTriggerLabel();
          updateBursTriggerLabel();
          updateYearHeaders();
          await runFilterAsync();
          setLoaderVisible(false);
          return atlasCombined;
        } catch (e) {
          console.error('[Tercih Sihirbazı] Atlas yüklenemedi:', e);
          atlasLoadPromise = null;
          atlasCombined = null;
          setLoaderVisible(false);
          if (atlasContent) {
            atlasContent.style.display = 'none';
            atlasContent.setAttribute('hidden', '');
          }
          if (atlasError && atlasErrorText) {
            atlasErrorText.textContent = e && (e.message || String(e)) ? String(e.message || e) : 'Bilinmeyen hata.';
            atlasError.hidden = false;
            atlasError.style.display = '';
          }
          if (atlasCount) atlasCount.textContent = '—';
          throw e;
        }
      })();

      return atlasLoadPromise;
    }

    function filterRows() {
      if (!atlasCombined) return Promise.resolve([]);
      var y = selectedYear;
      var puanSet = parsePuanFilterSet(fltPuanHidden ? fltPuanHidden.value : '');
      var bsMinEl = document.getElementById('flt-bs-min');
      var bsMaxEl = document.getElementById('flt-bs-max');
      var bsMin = bsMinEl && bsMinEl.value !== '' ? bsMinEl.value : '';
      var bsMax = bsMaxEl && bsMaxEl.value !== '' ? bsMaxEl.value : '';
      var kurum = fltKurum ? fltKurum.value : '';
      var ogrenim = fltOgrenim ? fltOgrenim.value : '';
      var minR = bsMin === '' ? null : parseInt(bsMin, 10);
      var maxR = bsMax === '' ? null : parseInt(bsMax, 10);
      var cityFilterOn = selectedCityCount() > 0;
      var uniFilterOn = selectedUniversityCount() > 0;
      var bolumFilterOn = selectedBolumCount() > 0;

      var rows = atlasCombined;
      var CHUNK = 8000;

      function runCollect(skipPuan) {
        var out = [];
        return new Promise(function (resolve) {
          var i = 0;
          function step() {
            var end = Math.min(i + CHUNK, rows.length);
            for (; i < end; i++) {
              var row = rows[i];
              if (!rowHasYearData(row, y)) continue;
              if (!skipPuan && puanSet) {
                var rpt = normPuanTip(row.Puan_Tipi);
                if (!puanSet[rpt]) continue;
              }
              if (cityFilterOn) {
                var sh = row.Sehir != null ? String(row.Sehir).trim() : '';
                if (!selectedCities[sh]) continue;
              }
              if (uniFilterOn) {
                var uniName = row.Universite != null ? String(row.Universite).trim() : '';
                if (!selectedUniversities[uniName]) continue;
              }
              if (bolumFilterOn) {
                var bolName = row.Bolum != null ? String(row.Bolum).trim() : '';
                if (!selectedBolumler[bolName]) continue;
              }
              var rank = parseRank(row[basariKey(y)]);
              if (minR != null) {
                if (rank == null) continue;
                if (rank < minR) continue;
              }
              if (maxR != null) {
                if (rank == null) continue;
                if (rank > maxR) continue;
              }
              if (!matchesKurum(row, kurum)) continue;
              if (!matchesOgrenim(row, ogrenim)) continue;
              if (!matchesBursFilter(row, selectedBurslar)) continue;
              out.push(row);
            }
            if (i < rows.length) {
              window.setTimeout(step, 0);
            } else {
              resolve(out);
            }
          }
          step();
        });
      }

      return runCollect(false).then(function (out) {
        if (out.length > 0) {
          lastFilterPuanRelaxed = false;
          return out;
        }
        /* Üniversite seçmeden yalnızca bölüm: örn. önlisans Anestezi TYT iken SAY seçiliyse sonuç 0 oluyordu — tüm puan türlerinde aynı bölüm adıyla eşleşen programları göster */
        if (bolumFilterOn && !uniFilterOn && puanSet) {
          return runCollect(true).then(function (out2) {
            lastFilterPuanRelaxed = out2.length > 0;
            return out2;
          });
        }
        lastFilterPuanRelaxed = false;
        return out;
      });
    }

    function syncPageSizeFromSelect() {
      if (!elPageSize) return;
      var v = parseInt(String(elPageSize.value), 10);
      if (v === 10 || v === 25 || v === 50 || v === 100) pageSize = v;
    }

    function totalPages() {
      var n = lastFilteredRows.length;
      if (n <= 0) return 1;
      return Math.max(1, Math.ceil(n / pageSize));
    }

    function renderView() {
      syncPageSizeFromSelect();
      var y = selectedYear;
      var total = lastFilteredRows.length;
      var pages = totalPages();
      if (currentPage > pages) currentPage = pages;
      if (currentPage < 1) currentPage = 1;
      var start = (currentPage - 1) * pageSize;
      var slice = lastFilteredRows.slice(start, start + pageSize);

      atlasTbody.textContent = '';
      var frag = document.createDocumentFragment();
      for (var k = 0; k < slice.length; k++) {
        var r = slice[k];
        var tr = document.createElement('tr');
        var pt = r.Puan_Tipi != null ? String(r.Puan_Tipi) : '';
        var mod = puanBadgeMod(pt);
        var tabanVal = r[tabanKey(y)];
        var basariVal = r[basariKey(y)];
        tr.innerHTML =
          '<td class="yks-td-uni">' +
          escapeHtml(r.Universite) +
          '</td><td class="yks-td-bolum"><span class="yks-td-bolum__name">' +
          escapeHtml(r.Bolum) +
          '</span></td><td class="yks-td-burs">' +
          bursCellHtml(r.bursTuru) +
          '</td><td>' +
          escapeHtml(r.Sehir) +
          '</td><td class="yks-td-center"><span class="yks-pt-badge yks-pt-badge--' +
          mod +
          '">' +
          escapeHtml(pt || '—') +
          '</span></td><td class="yks-td-num">' +
          escapeHtml(kontenjanOf(r, y)) +
          '</td><td class="yks-td-num">' +
          escapeHtml(tabanVal != null && String(tabanVal).trim() !== '' ? String(tabanVal) : '—') +
          '</td><td class="yks-td-num">' +
          escapeHtml(basariVal != null && String(basariVal).trim() !== '' ? String(basariVal) : '—') +
          '</td>';
        var tdGoal = document.createElement('td');
        tdGoal.className = 'yks-atlas-goal-cell';
        var btnGoal = document.createElement('button');
        btnGoal.type = 'button';
        btnGoal.className = 'yks-atlas-goal-btn';
        var pinnedPk = readPinnedProgramKodu();
        var rowPk = r.Program_Kodu != null ? String(r.Program_Kodu).trim() : '';
        var isPinned = pinnedPk && rowPk && pinnedPk === rowPk;
        btnGoal.setAttribute('aria-label', 'Bu programı üniversite hedefi olarak kaydet');
        btnGoal.textContent = isPinned ? '✓ Hedefim' : '🎯 Hedefim Yap';
        if (isPinned) btnGoal.classList.add('yks-atlas-goal-btn--active');
        (function (row, year) {
          btnGoal.addEventListener('click', function (ev) {
            ev.stopPropagation();
            saveStudentTargetFromAtlasRow(row, year);
          });
        })(r, y);
        tdGoal.appendChild(btnGoal);
        tr.appendChild(tdGoal);
        frag.appendChild(tr);
      }
      atlasTbody.appendChild(frag);

      if (atlasCount) {
        if (total === 0) {
          atlasCount.textContent = 'Filtreye uyan kayıt yok · ' + y;
        } else {
          var from = start + 1;
          var to = start + slice.length;
          var tail =
            total.toLocaleString('tr-TR') +
            ' program · ' +
            y +
            ' · gösterilen: ' +
            from.toLocaleString('tr-TR') +
            '–' +
            to.toLocaleString('tr-TR') +
            ' (sayfa başına en fazla ' +
            pageSize +
            ')';
          if (lastFilterPuanRelaxed) {
            tail += ' · puan türü genişletildi (TYT/EA/SÖZ/DİL dahil — bölüm tüm üniversitelerde)';
          }
          atlasCount.textContent = tail;
        }
      }
      if (elPageInd) {
        elPageInd.textContent = total === 0 ? '—' : 'Sayfa ' + currentPage + ' / ' + pages;
      }
      if (elPrev) elPrev.disabled = total === 0 || currentPage <= 1;
      if (elNext) elNext.disabled = total === 0 || currentPage >= pages;
      syncAtlasMetaStickyOffset();
    }

    window.__tsRefreshGoalButtons = function () {
      renderView();
    };

    function runFilterAsync() {
      if (!atlasCombined) return Promise.resolve();
      if (atlasCount) atlasCount.textContent = 'Filtre uygulanıyor…';
      return filterRows().then(function (filtered) {
        lastFilteredRows = filtered;
        currentPage = 1;
        return new Promise(function (resolve) {
          window.requestAnimationFrame(function () {
            renderView();
            resolve();
          });
        });
      });
    }

    function runFilter() {
      if (!atlasCombined) {
        if (atlasCount) atlasCount.textContent = 'Veri yükleniyor…';
        loadAtlasData();
        return;
      }
      runFilterAsync();
    }

    function resetFilters() {
      setPuanSegment(DEFAULT_PUAN_TIPLERI);
      if (fltKurum) fltKurum.value = '';
      if (fltOgrenim) fltOgrenim.value = '';
      var lk = document.getElementById('flt-kurum-label');
      var lo = document.getElementById('flt-ogrenim-label');
      if (lk) lk.textContent = 'Tümü';
      if (lo) lo.textContent = 'Tümü';
      selectedCities = {};
      updateSehirTriggerLabel();
      selectedUniversities = {};
      updateUniTriggerLabel();
      selectedBolumler = {};
      updateBolumTriggerLabel();
      var mn = document.getElementById('flt-bs-min');
      var mx = document.getElementById('flt-bs-max');
      if (mn) mn.value = '';
      if (mx) mx.value = '';
      selectedBurslar = [];
      renderBursMultiList();
      updateBursTriggerLabel();
      selectedYear = '2025';
      for (var i = 0; i < yearBtns.length; i++) {
        var b = yearBtns[i];
        var isOn = b.getAttribute('data-year') === '2025';
        b.classList.toggle('is-active', isOn);
        b.setAttribute('aria-pressed', isOn ? 'true' : 'false');
      }
      updateYearHeaders();
      closeAllPanels();
      runFilter();
    }

    if (elPageSize) {
      elPageSize.addEventListener('change', function () {
        syncPageSizeFromSelect();
        currentPage = 1;
        renderView();
      });
    }
    if (elPrev) {
      elPrev.addEventListener('click', function () {
        if (currentPage > 1) {
          currentPage--;
          renderView();
        }
      });
    }
    if (elNext) {
      elNext.addEventListener('click', function () {
        if (currentPage < totalPages()) {
          currentPage++;
          renderView();
        }
      });
    }

    btnFilter.addEventListener('click', function () {
      runFilter();
    });
    if (btnReset) {
      btnReset.addEventListener('click', function () {
        resetFilters();
      });
    }

    for (var bi = 0; bi < yearBtns.length; bi++) {
      yearBtns[bi].addEventListener('click', function () {
        var yr = this.getAttribute('data-year');
        if (yr) changeYear(yr);
      });
    }

    var phBridgeApplied = false;
    try {
      var phBridgeRaw = localStorage.getItem('derecepanel_tercih_from_puan_v1');
      if (phBridgeRaw) {
        var phb = JSON.parse(phBridgeRaw);
        localStorage.removeItem('derecepanel_tercih_from_puan_v1');
        if (phb && phb.v === 1 && phb.primaryPuanTipi) {
          setPuanSegment(phb.primaryPuanTipi);
          phBridgeApplied = true;
          if (atlasContent) {
            var oldBan = document.getElementById('ph-tercih-bridge-banner');
            if (oldBan) oldBan.remove();
            var ban = document.createElement('div');
            ban.id = 'ph-tercih-bridge-banner';
            ban.setAttribute('role', 'status');
            ban.className =
              'mb-4 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-950 dark:border-indigo-500/40 dark:bg-indigo-950/50 dark:text-indigo-100';
            var pv = phb.puanlar && phb.puanlar[phb.primaryPuanTipi];
            var pvStr =
              pv != null && typeof pv === 'number' && !isNaN(pv)
                ? pv.toLocaleString('tr-TR', { maximumFractionDigits: 2, minimumFractionDigits: 0 })
                : '—';
            ban.textContent =
              'Puan Hesaplama aracından geldiniz. Atlas puan tipi: ' +
              phb.primaryPuanTipi +
              ' · Tahmini yerleştirme: ' +
              pvStr +
              '.';
            atlasContent.insertBefore(ban, atlasContent.firstChild);
          }
        }
      }
    } catch (phErr) {}
    if (!phBridgeApplied) setPuanSegment(DEFAULT_PUAN_TIPLERI);
    updateYearHeaders();
    syncAtlasMetaStickyOffset();
    loadAtlasData().catch(function () {});
  });
})();
