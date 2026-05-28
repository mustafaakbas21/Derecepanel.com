/**
 * Net Sihirbazı — pages/net-sihirbazi.html
 * Lisans YÖK Atlas JSON; yerleşen ortalama netleri varsa kullanır, yoksa taban sırası modeli.
 */
(function () {
  var ATLAS_NAME = 'yok-atlas-lisans.json';

  function atlasJsonHref() {
    try {
      return new URL('../' + ATLAS_NAME, window.location.href).href;
    } catch (_) {
      return '../' + ATLAS_NAME;
    }
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function trUpper(s) {
    return String(s || '').toLocaleUpperCase('tr-TR');
  }

  function parseTaban(v) {
    if (v == null || v === '') return null;
    var n = parseFloat(String(v).replace(/\./g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : null;
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

  function getBranchSpec(puanTipi) {
    var t = normPuanTip(puanTipi);
    var tyt = [
      { id: 'tyt_tr', label: 'TYT Türkçe', max: 40 },
      { id: 'tyt_mat', label: 'TYT Matematik', max: 40 },
      { id: 'tyt_fen', label: 'TYT Fen Bilimleri', max: 20 },
      { id: 'tyt_sos', label: 'TYT Sosyal Bilimler', max: 20 },
    ];
    if (t === 'SAY') {
      return tyt.concat([
        { id: 'ayt_mat', label: 'AYT Matematik', max: 40 },
        { id: 'ayt_fiz', label: 'AYT Fizik', max: 14 },
        { id: 'ayt_kim', label: 'AYT Kimya', max: 13 },
        { id: 'ayt_bio', label: 'AYT Biyoloji', max: 13 },
      ]);
    }
    if (t === 'SOZ') {
      return tyt.concat([
        { id: 'ayt_edb', label: 'AYT Türk Dili ve Edebiyatı', max: 24 },
        { id: 'ayt_tar1', label: 'AYT Tarih-1', max: 10 },
        { id: 'ayt_cog1', label: 'AYT Coğrafya-1', max: 6 },
        { id: 'ayt_tar2', label: 'AYT Tarih-2', max: 11 },
      ]);
    }
    if (t === 'EA') {
      return tyt.concat([
        { id: 'ayt_mat', label: 'AYT Matematik', max: 40 },
        { id: 'ayt_edb', label: 'AYT Türk Dili ve Edebiyatı', max: 24 },
        { id: 'ayt_tar1', label: 'AYT Tarih-1', max: 10 },
        { id: 'ayt_cog1', label: 'AYT Coğrafya-1', max: 6 },
      ]);
    }
    if (t === 'DIL' || t === 'DİL') {
      return tyt.concat([
        { id: 'ayt_dil', label: 'AYT Dil', max: 80 },
        { id: 'ayt_edb', label: 'AYT Edebiyat-Sosyal-1', max: 24 },
        { id: 'ayt_tar1', label: 'AYT Tarih-1', max: 10 },
        { id: 'ayt_cog1', label: 'AYT Coğrafya-1', max: 6 },
      ]);
    }
    return getBranchSpec('SAY');
  }

  function round1(x) {
    return Math.round(x * 10) / 10;
  }

  function roundInt(x) {
    return Math.round(x);
  }

  /**
   * Tek referans noktasından görüntülenebilir tam sayı net bandı.
   * model: taban sırası tahmini — biraz daha geniş; json: YÖK ortalaması — daha dar.
   */
  function netBand(mid, maxNet, sourceType) {
    var m = round1(Math.min(maxNet, Math.max(0, mid)));
    var isModel = sourceType === 'model';
    var half = isModel
      ? Math.max(2, Math.min(3.5, maxNet * 0.085))
      : Math.max(1, Math.min(2.4, maxNet * 0.06));
    var lo = roundInt(Math.max(0, m - half));
    var hi = roundInt(Math.min(maxNet, m + half));
    if (hi - lo < 2 && maxNet >= 2) {
      var pad = 1;
      lo = roundInt(Math.max(0, lo - pad));
      hi = roundInt(Math.min(maxNet, hi + pad));
    }
    if (hi < lo) {
      hi = lo;
    }
    return { mid: m, lo: lo, hi: hi };
  }

  function buildBandsFromNets(nets, spec, sourceType) {
    var bands = {};
    for (var i = 0; i < spec.length; i++) {
      var br = spec[i];
      var id = br.id;
      if (nets[id] == null) continue;
      bands[id] = netBand(nets[id], br.max, sourceType);
    }
    return bands;
  }

  /** JSON’da nesne veya düz anahtarlarla gelen netleri { id: sayı } biçimine çevir */
  function extractDeclaredNets(row, spec) {
    var raw = row.ortalama_netler || row.Yerlesen_Ortalama_Netleri || row.yerlesen_ortalama_netleri;
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      var outObj = {};
      var keys = Object.keys(raw);
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        var v = raw[k];
        var n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
        if (!Number.isFinite(n)) continue;
        var nk = normKey(k);
        for (var j = 0; j < spec.length; j++) {
          var sk = normKey(spec[j].label);
          if (sk.indexOf(nk) !== -1 || nk.indexOf(sk) !== -1) {
            outObj[spec[j].id] = round1(Math.min(spec[j].max, Math.max(0, n)));
            break;
          }
        }
      }
      var ok = Object.keys(outObj).filter(function (x) {
        return outObj[x] != null;
      });
      if (ok.length) return { nets: outObj, source: 'json' };
    }
    var outFlat = {};
    for (var s = 0; s < spec.length; s++) {
      var id = spec[s].id;
      var candidates = ['Net_' + id, 'Ort_' + id, 'Ortalama_' + id, 'OrtNet_' + id, id];
      for (var c = 0; c < candidates.length; c++) {
        var ck = candidates[c];
        if (row[ck] != null && String(row[ck]).trim() !== '') {
          var num = parseFloat(String(row[ck]).replace(',', '.'));
          if (Number.isFinite(num)) {
            outFlat[id] = round1(Math.min(spec[s].max, Math.max(0, num)));
            break;
          }
        }
      }
    }
    if (Object.keys(outFlat).length) return { nets: outFlat, source: 'json' };
    return null;
  }

  function normKey(s) {
    return normPuanTip(String(s || '')).replace(/[^A-Z0-9]/g, '');
  }

  function syntheticNets(row, strength, spec) {
    var nets = {};
    var s = Math.max(0, Math.min(1, strength));
    for (var i = 0; i < spec.length; i++) {
      var br = spec[i];
      var lo = br.max * (0.28 + i * 0.01);
      var hi = br.max * (0.88 - i * 0.008);
      var v = lo + (hi - lo) * s;
      var seed = (String(row.Program_Kodu || '') + br.id).split('').reduce(function (a, ch) {
        return a + ch.charCodeAt(0);
      }, 0);
      v += ((seed % 17) - 8) * 0.08;
      nets[br.id] = round1(Math.min(br.max, Math.max(0, v)));
    }
    return { nets: nets, source: 'model' };
  }

  function assignStrengthIndex(allRows) {
    var byType = {};
    for (var i = 0; i < allRows.length; i++) {
      var r = allRows[i];
      var k = r.Puan_Tipi || '—';
      (byType[k] = byType[k] || []).push(r);
    }
    var keys = Object.keys(byType);
    for (var t = 0; t < keys.length; t++) {
      var arr = byType[keys[t]];
      arr.sort(function (a, b) {
        var pa = parseTaban(a.Taban_Puani_Guncel);
        var pb = parseTaban(b.Taban_Puani_Guncel);
        if (pa == null && pb == null) return 0;
        if (pa == null) return 1;
        if (pb == null) return -1;
        return pb - pa;
      });
      var n = arr.length;
      for (var j = 0; j < n; j++) {
        var strength = n <= 1 ? 0.5 : 1 - j / (n - 1);
        arr[j]._nsStrength = strength;
      }
    }
  }

  function resolveNets(row, allRows) {
    var spec = getBranchSpec(row.Puan_Tipi);
    var dec = extractDeclaredNets(row, spec);
    var nets;
    var source;
    if (dec) {
      nets = dec.nets;
      source = dec.source;
    } else {
      var str = row._nsStrength != null ? row._nsStrength : 0.5;
      var syn = syntheticNets(row, str, spec);
      nets = syn.nets;
      source = syn.source;
    }
    var bands = buildBandsFromNets(nets, spec, source);
    return { nets: nets, bands: bands, source: source };
  }

  document.addEventListener('DOMContentLoaded', function () {
    var loader = document.getElementById('ns-loader');
    var errBox = document.getElementById('ns-error');
    var errText = document.getElementById('ns-error-text');
    var mainUi = document.getElementById('ns-main');
    var citySelect = document.getElementById('ns-city');
    var ptypeSelect = document.getElementById('ns-ptype');
    var globalQInput = document.getElementById('ns-global-q');
    var filterResetBtn = document.getElementById('ns-filter-reset');
    var filterStatsEl = document.getElementById('ns-filter-stats');
    var uniTrigger = document.getElementById('ns-uni-trigger');
    var uniPanel = document.getElementById('ns-uni-panel');
    var uniFilter = document.getElementById('ns-uni-filter');
    var uniList = document.getElementById('ns-uni-list');
    var uniDisplay = document.getElementById('ns-uni-display');
    var progTrigger = document.getElementById('ns-prog-trigger');
    var progPanel = document.getElementById('ns-prog-panel');
    var progFilter = document.getElementById('ns-prog-filter');
    var progList = document.getElementById('ns-prog-list');
    var progDisplay = document.getElementById('ns-prog-display');
    var progHint = document.getElementById('ns-prog-hint');
    var card = document.getElementById('ns-card');
    var cardMeta = document.getElementById('ns-card-meta');
    var elTaban = document.getElementById('ns-taban');
    var elRank = document.getElementById('ns-rank');
    var sourceBadge = document.getElementById('ns-source-badge');
    var tableBody = document.getElementById('ns-net-tbody');
    var obpSlider = document.getElementById('ns-obp-slider');
    var obpValueEl = document.getElementById('ns-obp-value');
    var obpEffectEl = document.getElementById('ns-obp-effect');
    var hamNeedEl = document.getElementById('ns-ham-need');
    var diagTotalEl = document.getElementById('ns-v2-diagnosis-total');
    var diagCriticalEl = document.getElementById('ns-v2-diagnosis-critical');

    if (!uniTrigger || !uniList || !progList || !tableBody) return;

    var rows = [];
    var universities = [];
    var allProgramCount = 0;
    var selectedUni = '';
    var selectedProgram = null;
    var lastSpec = [];
    var lastNets = {};
    var lastBands = {};
    var lastSource = '';
    var openDd = null;
    var radarChart = null;

    function obpContribution(obp) {
      var o = Number(obp);
      if (!Number.isFinite(o)) o = 85;
      return o * 5 * 0.12;
    }

    function getCurrentObp() {
      if (!obpSlider) return 85;
      var v = parseInt(String(obpSlider.value), 10);
      if (!Number.isFinite(v)) return 85;
      return Math.max(50, Math.min(100, v));
    }

    function destroyRadar() {
      if (radarChart) {
        try {
          radarChart.destroy();
        } catch (e) {}
        radarChart = null;
      }
    }

    function radarCategories() {
      return lastSpec.map(function (br) {
        var t = br.label || '';
        return t.length > 24 ? t.slice(0, 22) + '…' : t;
      });
    }

    function seriesYerlesen() {
      return lastSpec.map(function (br) {
        var v = lastNets[br.id];
        return v != null && Number.isFinite(v) ? v : 0;
      });
    }

    function seriesStudent() {
      return lastSpec.map(function (br) {
        var inp = document.querySelector('.ns-student-inp[data-branch="' + br.id + '"]');
        if (!inp || String(inp.value).trim() === '') return 0;
        var n = parseFloat(String(inp.value).replace(',', '.'));
        return Number.isFinite(n) ? n : 0;
      });
    }

    function updateObpPanel() {
      var obp = getCurrentObp();
      if (obpSlider) obpSlider.setAttribute('aria-valuenow', String(obp));
      if (obpValueEl) obpValueEl.textContent = String(obp);
      var pts = obpContribution(obp);
      if (obpEffectEl) {
        obpEffectEl.textContent =
          '+' + String(round1(pts)).replace('.', ',') + ' Puan OBP Etkisi';
      }
      if (hamNeedEl) {
        if (!selectedProgram) {
          hamNeedEl.textContent = '—';
          return;
        }
        var taban = parseTaban(selectedProgram.Taban_Puani_Guncel);
        if (taban == null) {
          hamNeedEl.textContent = 'Taban puanı yok; ham ihtiyaç hesaplanamıyor.';
        } else {
          var ham = taban - pts;
          hamNeedEl.textContent =
            'Asıl ihtiyacınız olan ham puan (yaklaşık): ' +
            String(round1(ham)).replace('.', ',') +
            ' (taban − OBP etkisi)';
        }
      }
    }

    function updateDiagnosis() {
      if (!diagTotalEl || !diagCriticalEl) return;
      if (!lastSpec.length) {
        diagTotalEl.textContent = '';
        diagCriticalEl.textContent = '';
        return;
      }
      var totalDef = 0;
      var worstLabel = '';
      var worstAmt = -1;
      var anyInput = false;
      for (var i = 0; i < lastSpec.length; i++) {
        var br = lastSpec[i];
        var inp = document.querySelector('.ns-student-inp[data-branch="' + br.id + '"]');
        if (!inp || String(inp.value).trim() === '') continue;
        anyInput = true;
        var st = parseFloat(String(inp.value).replace(',', '.'));
        if (!Number.isFinite(st)) continue;
        var mid = lastNets[br.id];
        if (mid == null || !Number.isFinite(mid)) continue;
        var def = Math.max(0, mid - st);
        totalDef += def;
        if (def > worstAmt) {
          worstAmt = def;
          worstLabel = br.label;
        }
      }
      if (!anyInput) {
        diagTotalEl.textContent =
          'Branş netlerini tablodaki "Senin netin" sütununa yazın; toplam eksik ve en zayıf alan burada özetlenir.';
        diagCriticalEl.textContent = '';
        return;
      }
      if (totalDef <= 0) {
        diagTotalEl.textContent =
          'Girdiğin netler orta referansa uygun veya üzerinde — bu branş setinde ek net ihtiyacı görünmüyor.';
        diagCriticalEl.textContent = '';
        return;
      }
      diagTotalEl.textContent =
        'Hedefe ulaşmak için toplam ' +
        String(round1(totalDef)).replace('.', ',') +
        ' net daha artırmalısın.';
      if (worstAmt > 0 && worstLabel) {
        diagCriticalEl.textContent =
          'En çok odaklanman gereken alan: ' +
          worstLabel +
          ' (−' +
          String(round1(worstAmt)).replace('.', ',') +
          ' net).';
      } else {
        diagCriticalEl.textContent = '';
      }
    }

    function mountRadar() {
      destroyRadar();
      var el = document.getElementById('netRadarChart');
      if (!el || typeof ApexCharts === 'undefined' || !lastSpec.length) return;
      var cats = radarCategories();
      var s1 = seriesYerlesen();
      var s2 = seriesStudent();
      var opts = {
        chart: {
          type: 'radar',
          height: 300,
          toolbar: { show: false },
          fontFamily: 'Inter, system-ui, sans-serif',
          animations: { enabled: true },
        },
        series: [
          { name: 'Yerleşen Ortalaması', data: s1 },
          { name: 'Senin Netlerin', data: s2 },
        ],
        labels: cats,
        colors: ['#1e3a8a', '#059669'],
        stroke: { width: 2 },
        fill: { opacity: 0.14 },
        markers: { size: 3, hover: { size: 5 } },
        plotOptions: {
          radar: {
            polygons: {
              strokeColors: '#e2e8f0',
              fill: { colors: ['#f8fafc', '#ffffff'] },
            },
          },
        },
        yaxis: { show: false },
        legend: { position: 'bottom', fontSize: '12px', fontWeight: 600 },
        dataLabels: { enabled: false },
        tooltip: { theme: 'light', y: { formatter: function (val) { return String(val).replace('.', ','); } } },
      };
      radarChart = new ApexCharts(el, opts);
      radarChart.render();
    }

    function updateRadarSeries() {
      if (!radarChart || !lastSpec.length) return;
      var cats = radarCategories();
      var s1 = seriesYerlesen();
      var s2 = seriesStudent();
      radarChart.updateOptions({ labels: cats }, false, true);
      radarChart.updateSeries(
        [
          { name: 'Yerleşen Ortalaması', data: s1 },
          { name: 'Senin Netlerin', data: s2 },
        ],
        true
      );
    }

    function refreshV2() {
      applyCompareColors();
      if (radarChart) updateRadarSeries();
      else mountRadar();
      updateDiagnosis();
    }

    function setLoading(on) {
      if (loader) loader.hidden = !on;
      if (mainUi) mainUi.style.opacity = on ? '0.45' : '1';
    }

    function showError(msg) {
      if (errBox && errText) {
        errText.textContent = msg || 'Bilinmeyen hata';
        errBox.hidden = false;
      }
    }

    function hideError() {
      if (errBox) errBox.hidden = true;
    }

    function closeAllDd() {
      if (uniPanel) {
        uniPanel.classList.add('hidden');
        uniPanel.hidden = true;
      }
      if (uniTrigger) uniTrigger.setAttribute('aria-expanded', 'false');
      if (progPanel) {
        progPanel.classList.add('hidden');
        progPanel.hidden = true;
      }
      if (progTrigger) progTrigger.setAttribute('aria-expanded', 'false');
      openDd = null;
    }

    function openUniDd() {
      closeAllDd();
      openDd = 'uni';
      if (uniPanel) {
        uniPanel.classList.remove('hidden');
        uniPanel.hidden = false;
      }
      if (uniTrigger) uniTrigger.setAttribute('aria-expanded', 'true');
      if (uniFilter) {
        uniFilter.value = '';
        uniFilter.focus();
      }
      renderUniList('');
    }

    function programLabel(r) {
      var sub = (r.Fakulte_YO || '').trim();
      return (r.Bolum || '') + (sub ? ' — ' + sub : '') + ' [' + (r.Program_Kodu || '') + ']';
    }

    function rowMatchesCityAndPtype(r) {
      var city = citySelect && citySelect.value;
      var pt = ptypeSelect && ptypeSelect.value;
      if (city && r.Sehir !== city) return false;
      if (pt && normPuanTip(r.Puan_Tipi) !== normPuanTip(pt)) return false;
      return true;
    }

    function rowMatchesGlobalNeedle(r, needle) {
      if (!needle) return true;
      if (trUpper(r.Universite || '').indexOf(needle) !== -1) return true;
      if (trUpper(r.Bolum || '').indexOf(needle) !== -1) return true;
      if (trUpper(r.Fakulte_YO || '').indexOf(needle) !== -1) return true;
      if (trUpper(r.Program_Kodu || '').indexOf(needle) !== -1) return true;
      return false;
    }

    function rebuildUniversities() {
      var needle = trUpper(globalQInput && globalQInput.value ? globalQInput.value.trim() : '');
      var uniSet2 = {};
      for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        var u = r.Universite;
        if (!u) continue;
        if (!rowMatchesCityAndPtype(r)) continue;
        if (!rowMatchesGlobalNeedle(r, needle)) continue;
        uniSet2[u] = true;
      }
      universities = Object.keys(uniSet2).sort(function (a, b) {
        return a.localeCompare(b, 'tr');
      });
    }

    function programsForUni(uni) {
      var out = [];
      for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        if (r.Universite !== uni) continue;
        if (!rowMatchesCityAndPtype(r)) continue;
        out.push(r);
      }
      out.sort(function (a, b) {
        var c = String(a.Bolum || '').localeCompare(String(b.Bolum || ''), 'tr');
        if (c !== 0) return c;
        return String(a.Fakulte_YO || '').localeCompare(String(b.Fakulte_YO || ''), 'tr');
      });
      return out;
    }

    function renderUniList(q) {
      if (!uniList) return;
      uniList.innerHTML = '';
      var needle = trUpper(String(q || '').trim());
      var frag = document.createDocumentFragment();
      for (var i = 0; i < universities.length; i++) {
        var u = universities[i];
        if (needle && trUpper(u).indexOf(needle) === -1) continue;
        var li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.className =
          'js-ns-dd-li cursor-pointer px-3 py-2 text-sm text-slate-800 hover:bg-indigo-50 hover:text-indigo-700';
        li.textContent = u;
        li.dataset.uni = u;
        frag.appendChild(li);
      }
      uniList.appendChild(frag);
    }

    function updateFilterStats() {
      if (!filterStatsEl) return;
      var nUni = universities.length;
      filterStatsEl.textContent =
        'Veri seti: ' +
        allProgramCount +
        ' program kaydı · Filtreye uyan ' +
        nUni +
        ' üniversite listeleniyor. Önce üniversite, sonra bölüm seçin.';
    }

    function updateProgHint() {
      if (!progHint) return;
      if (!selectedUni) {
        progHint.textContent = '';
        return;
      }
      var n = programsForUni(selectedUni).length;
      progHint.textContent = n ? n + ' program' : 'Uygun program yok';
    }

    function setProgTriggerEnabled(on) {
      if (!progTrigger) return;
      progTrigger.disabled = !on;
    }

    function openProgDd() {
      if (!selectedUni) return;
      closeAllDd();
      openDd = 'prog';
      if (progPanel) {
        progPanel.classList.remove('hidden');
        progPanel.hidden = false;
      }
      if (progTrigger) progTrigger.setAttribute('aria-expanded', 'true');
      if (progFilter) {
        progFilter.value = '';
        progFilter.focus();
      }
      renderProgList('');
    }

    function renderProgList(q) {
      if (!progList) return;
      progList.innerHTML = '';
      if (!selectedUni) return;
      var needle = trUpper(String(q || '').trim());
      var list = programsForUni(selectedUni);
      var frag = document.createDocumentFragment();
      var shown = 0;
      for (var i = 0; i < list.length; i++) {
        var r = list[i];
        var lab = programLabel(r);
        if (needle && trUpper(lab).indexOf(needle) === -1) continue;
        var li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.className =
          'js-ns-dd-li cursor-pointer border-b border-slate-100 px-3 py-2.5 text-sm text-slate-800 last:border-0 hover:bg-indigo-50 hover:text-indigo-800';
        li.innerHTML =
          '<span class="block font-semibold leading-snug">' +
          escapeHtml(r.Bolum || '—') +
          '</span><span class="mt-0.5 block text-xs font-medium text-slate-500">' +
          escapeHtml(
            (r.Puan_Tipi || '—') +
              (r.Fakulte_YO ? ' · ' + r.Fakulte_YO : '') +
              (r.Sehir ? ' · ' + r.Sehir : '')
          ) +
          '</span>';
        li._nsRow = r;
        frag.appendChild(li);
        shown++;
      }
      progList.appendChild(frag);
      if (shown === 0 && list.length) {
        var empty = document.createElement('li');
        empty.className = 'px-3 py-2 text-xs text-slate-500';
        empty.textContent = 'Aramanıza uyan program yok; üstteki arama kutusunu değiştirin.';
        progList.appendChild(empty);
      }
    }

    function clearProgramUi() {
      destroyRadar();
      selectedProgram = null;
      if (card) card.hidden = true;
      if (diagTotalEl) diagTotalEl.textContent = '';
      if (diagCriticalEl) diagCriticalEl.textContent = '';
    }

    function onUniPicked(name) {
      selectedUni = name;
      if (uniDisplay) uniDisplay.textContent = name;
      closeAllDd();
      clearProgramUi();
      var n = programsForUni(name).length;
      if (progDisplay) {
        progDisplay.textContent = n ? 'Bölüm ara veya seçin…' : 'Bu filtrelerle program yok';
      }
      setProgTriggerEnabled(!!n);
      updateProgHint();
      if (n === 1 && programsForUni(name)[0]) {
        var only = programsForUni(name)[0];
        if (progDisplay) progDisplay.textContent = programLabel(only);
        renderCard(only);
      }
    }

    function onFiltersChanged() {
      rebuildUniversities();
      updateFilterStats();
      var stillOk = selectedUni && universities.indexOf(selectedUni) !== -1;
      if (!stillOk) {
        selectedUni = '';
        if (uniDisplay) uniDisplay.textContent = 'Üniversite ara veya seç…';
        if (progDisplay) progDisplay.textContent = 'Önce üniversite seçin';
        setProgTriggerEnabled(false);
        if (progHint) progHint.textContent = '';
        clearProgramUi();
      } else {
        var list = programsForUni(selectedUni);
        setProgTriggerEnabled(list.length > 0);
        updateProgHint();
        if (selectedProgram) {
          var stillProg = list.some(function (x) {
            return String(x.Program_Kodu) === String(selectedProgram.Program_Kodu);
          });
          if (!stillProg) {
            if (progDisplay) {
              progDisplay.textContent = list.length ? 'Bölüm ara veya seçin…' : 'Bu filtrelerle program yok';
            }
            clearProgramUi();
          }
        } else if (progDisplay) {
          progDisplay.textContent = list.length ? 'Bölüm ara veya seçin…' : 'Bu filtrelerle program yok';
        }
      }
      renderUniList(uniFilter ? uniFilter.value : '');
    }

    var globalQTimer = null;
    function scheduleGlobalQRefresh() {
      if (globalQTimer) clearTimeout(globalQTimer);
      globalQTimer = setTimeout(function () {
        globalQTimer = null;
        onFiltersChanged();
      }, 200);
    }

    function resetAllFilters() {
      if (citySelect) citySelect.value = '';
      if (ptypeSelect) ptypeSelect.value = '';
      if (globalQInput) globalQInput.value = '';
      selectedUni = '';
      if (uniDisplay) uniDisplay.textContent = 'Üniversite ara veya seç…';
      if (progDisplay) progDisplay.textContent = 'Önce üniversite seçin';
      setProgTriggerEnabled(false);
      if (progHint) progHint.textContent = '';
      clearProgramUi();
      rebuildUniversities();
      updateFilterStats();
      renderUniList(uniFilter ? uniFilter.value : '');
    }

    function renderCard(prog) {
      destroyRadar();
      selectedProgram = prog;
      lastSpec = getBranchSpec(prog.Puan_Tipi);
      var resolved = resolveNets(prog, rows);
      lastNets = resolved.nets;
      lastBands = resolved.bands || {};
      lastSource = resolved.source;

      card.hidden = false;
      if (cardMeta) {
        cardMeta.className = 'ns-card__meta mt-1 text-sm font-medium text-slate-800';
        cardMeta.textContent =
          (prog.Universite || '') +
          ' · ' +
          (prog.Bolum || '') +
          (prog.Fakulte_YO ? ' · ' + prog.Fakulte_YO : '') +
          ' · Puan: ' +
          (prog.Puan_Tipi || '—');
      }

      if (sourceBadge) {
        var badgeShort =
          resolved.source === 'json'
            ? 'Kaynak: YÖK Atlas — programa ait ortalama net alanları'
            : 'Kaynak: Tahmini bant — aynı puan tipinde taban sırasına göre model; kesin yerleşen neti değildir';
        sourceBadge.textContent = badgeShort;
        sourceBadge.setAttribute(
          'title',
          resolved.source === 'json'
            ? 'JSON kaydında ortalama_netler veya Net_* / Ort_* alanları doluysa doğrudan kullanılır; tabloda dar bir bant gösterilir.'
            : 'Veri setinde branş neti yoksa, aynı puan tipindeki programların taban sırasına göre üretilen referans orta nokta ve yaklaşık net bandı gösterilir. YÖK verisi eklendiğinde otomatik daralır.'
        );
      }

      if (elTaban) elTaban.textContent = prog.Taban_Puani_Guncel != null ? String(prog.Taban_Puani_Guncel) : '—';
      if (elRank) elRank.textContent = prog.Basari_Sirasi_Guncel != null ? String(prog.Basari_Sirasi_Guncel) : '—';

      tableBody.innerHTML = '';
      for (var i = 0; i < lastSpec.length; i++) {
        var br = lastSpec[i];
        var net = lastNets[br.id] != null ? lastNets[br.id] : 0;
        var band = lastBands[br.id] || netBand(net, br.max, resolved.source);
        var mid = band.mid;
        var pct = br.max > 0 ? Math.min(100, (mid / br.max) * 100) : 0;
        var tr = document.createElement('tr');
        tr.dataset.branchId = br.id;
        tr.dataset.lo = String(band.lo);
        tr.dataset.hi = String(band.hi);
        tr.dataset.mid = String(mid);
        var bandHtml =
          '<div class="ns-net-band"><span class="text-sm font-semibold text-slate-800">' +
          escapeHtml(String(band.lo)) +
          ' – ' +
          escapeHtml(String(band.hi)) +
          '</span> <span class="text-xs font-semibold text-slate-600">net</span></div>' +
          '<div class="ns-net-sub mt-1 text-xs font-medium text-slate-500">Ort. referans ~ ' +
          escapeHtml(String(mid).replace('.', ',')) +
          ' · üst sınır ' +
          escapeHtml(String(br.max)) +
          '</div>';
        tr.innerHTML =
          '<td class="ns-td-label text-sm font-medium text-slate-800">' +
          escapeHtml(br.label) +
          '</td>' +
          '<td class="ns-td-val">' +
          bandHtml +
          '</td>' +
          '<td class="ns-td-bar"><div class="ns-bar" role="progressbar" aria-valuemin="0" aria-valuemax="' +
          br.max +
          '" aria-valuenow="' +
          mid +
          '" aria-valuetext="' +
          escapeHtml('Yaklaşık ' + band.lo + '–' + band.hi + ' net, orta ' + mid) +
          '"><div class="ns-bar__fill" style="width:' +
          pct.toFixed(1) +
          '%"></div></div></td>' +
          '<td class="ns-td-inp">' +
          '<input type="number" step="0.1" min="0" max="' +
          br.max +
          '" class="ns-student-inp w-20 rounded-md border border-slate-200 bg-white px-2 py-1 text-center text-sm font-medium text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" data-branch="' +
          escapeHtml(br.id) +
          '" placeholder="—" aria-label="' +
          escapeHtml(br.label) +
          ' netiniz" />' +
          '</td>' +
          '<td class="ns-td-cmp text-sm"><span class="ns-cmp-msg" data-cmp-msg></span></td>';
        tableBody.appendChild(tr);
      }

      autoFillStudentNetsFromStorage();
      updateObpPanel();
      mountRadar();
      updateDiagnosis();
      applyCompareColors();
    }

    function autoFillStudentNetsFromStorage() {
      if (!window.DereceOgrenciSimBridge) return;
      var u = window.DereceOgrenciSimBridge.getCurrentUser();
      if (!u) return;
      var last = window.DereceOgrenciSimBridge.getLastExamRecord(u);
      if (!last) return;
      var nets = window.DereceOgrenciSimBridge.computeNsBranchNetsFromRecord(last);
      if (!nets || !Object.keys(nets).length) return;
      for (var i = 0; i < lastSpec.length; i++) {
        var bid = lastSpec[i].id;
        if (nets[bid] == null || !Number.isFinite(nets[bid])) continue;
        var inp = document.querySelector('.ns-student-inp[data-branch="' + bid + '"]');
        if (inp) inp.value = String(nets[bid]).replace('.', ',');
      }
    }

    function getStudentNet(branchId) {
      var inp = document.querySelector('.ns-student-inp[data-branch="' + branchId + '"]');
      if (!inp || inp.value.trim() === '') return null;
      var n = parseFloat(String(inp.value).replace(',', '.'));
      return Number.isFinite(n) ? n : null;
    }

    function applyCompareColors() {
      for (var i = 0; i < tableBody.rows.length; i++) {
        var tr = tableBody.rows[i];
        var bid = tr.dataset.branchId;
        var mid = parseFloat(tr.dataset.mid);
        var lo = parseFloat(tr.dataset.lo);
        var hi = parseFloat(tr.dataset.hi);
        if (!Number.isFinite(mid)) mid = lastNets[bid];
        if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
          var b = lastBands[bid];
          if (b) {
            lo = b.lo;
            hi = b.hi;
            mid = b.mid;
          }
        }
        if (mid == null || !Number.isFinite(mid)) continue;
        var st = getStudentNet(bid);
        var msgEl = tr.querySelector('[data-cmp-msg]');
        tr.classList.remove('ns-row--low', 'ns-row--high', 'ns-row--inband');
        if (msgEl) msgEl.textContent = '';
        if (st == null) continue;
        if (Number.isFinite(lo) && Number.isFinite(hi)) {
          if (st < lo) {
            tr.classList.add('ns-row--low');
            if (msgEl) msgEl.textContent = 'Bandın altı (~' + round1(lo - st) + ' net)';
          } else if (st > hi) {
            tr.classList.add('ns-row--high');
            if (msgEl) msgEl.textContent = 'Bandın üstü (+' + round1(st - hi) + ' net)';
          } else {
            tr.classList.add('ns-row--inband');
            var vsMid = round1(st - mid);
            if (vsMid < -0.05) {
              if (msgEl) msgEl.textContent = 'Bant içi · ort. altında (' + vsMid + ')';
            } else if (vsMid > 0.05) {
              if (msgEl) msgEl.textContent = 'Bant içi · ort. üstünde (+' + vsMid + ')';
            } else {
              if (msgEl) msgEl.textContent = 'Bant içi · ortaya yakın';
            }
          }
        } else {
          var diff = round1(st - mid);
          if (diff < 0) {
            tr.classList.add('ns-row--low');
            if (msgEl) msgEl.textContent = 'Eksik: ' + diff + ' net';
          } else if (diff > 0) {
            tr.classList.add('ns-row--high');
            if (msgEl) msgEl.textContent = 'Hedef üstü: +' + diff + ' net';
          } else if (msgEl) msgEl.textContent = 'Hedefte';
        }
      }
    }

    tableBody.addEventListener('input', function (e) {
      var t = e.target;
      if (t && t.classList && t.classList.contains('ns-student-inp')) refreshV2();
    });
    tableBody.addEventListener('change', function (e) {
      var t = e.target;
      if (t && t.classList && t.classList.contains('ns-student-inp')) refreshV2();
    });

    if (obpSlider) {
      obpSlider.addEventListener('input', function () {
        updateObpPanel();
      });
    }

    uniTrigger.addEventListener('click', function (e) {
      e.stopPropagation();
      if (openDd === 'uni') closeAllDd();
      else openUniDd();
    });

    if (progTrigger) {
      progTrigger.addEventListener('click', function (e) {
        e.stopPropagation();
        if (progTrigger.disabled) return;
        if (openDd === 'prog') closeAllDd();
        else openProgDd();
      });
    }

    if (uniFilter) {
      uniFilter.addEventListener('input', function () {
        renderUniList(uniFilter.value);
      });
      uniFilter.addEventListener('click', function (e) {
        e.stopPropagation();
      });
    }
    if (progFilter) {
      progFilter.addEventListener('input', function () {
        renderProgList(progFilter.value);
      });
      progFilter.addEventListener('click', function (e) {
        e.stopPropagation();
      });
    }

    uniList.addEventListener('click', function (e) {
      var li = e.target.closest('li');
      if (!li || !li.dataset.uni) return;
      e.stopPropagation();
      onUniPicked(li.dataset.uni);
    });

    progList.addEventListener('click', function (e) {
      var li = e.target.closest('li');
      if (!li || !li._nsRow) return;
      e.stopPropagation();
      var p = li._nsRow;
      if (progDisplay) progDisplay.textContent = programLabel(p);
      closeAllDd();
      renderCard(p);
    });

    document.addEventListener('click', function () {
      closeAllDd();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAllDd();
    });

    if (citySelect) {
      citySelect.addEventListener('change', function () {
        onFiltersChanged();
      });
    }
    if (ptypeSelect) {
      ptypeSelect.addEventListener('change', function () {
        onFiltersChanged();
      });
    }
    if (globalQInput) {
      globalQInput.addEventListener('input', function () {
        scheduleGlobalQRefresh();
      });
    }
    if (filterResetBtn) {
      filterResetBtn.addEventListener('click', function () {
        resetAllFilters();
      });
    }

    ;[uniPanel, progPanel, uniList, progList, uniFilter, progFilter].forEach(function (el) {
      if (el)
        el.addEventListener('click', function (e) {
          e.stopPropagation();
        });
    });

    setLoading(true);
    fetch(atlasJsonHref())
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        rows = Array.isArray(data) ? data : [];
        allProgramCount = rows.length;
        assignStrengthIndex(rows);
        var citySeen = {};
        var cityList = [];
        for (var c = 0; c < rows.length; c++) {
          var sh = rows[c].Sehir;
          if (!sh || citySeen[sh]) continue;
          citySeen[sh] = true;
          cityList.push(sh);
        }
        cityList.sort(function (a, b) {
          return a.localeCompare(b, 'tr');
        });
        if (citySelect) {
          var prevCity = citySelect.value;
          citySelect.innerHTML = '<option value="">Tüm şehirler</option>';
          for (var ci = 0; ci < cityList.length; ci++) {
            var opt = document.createElement('option');
            opt.value = cityList[ci];
            opt.textContent = cityList[ci];
            citySelect.appendChild(opt);
          }
          if (prevCity && citySeen[prevCity]) citySelect.value = prevCity;
        }
        rebuildUniversities();
        updateFilterStats();
        renderUniList('');
        hideError();
        setLoading(false);
      })
      .catch(function (e) {
        console.error('[Net Sihirbazı]', e);
        setLoading(false);
        showError(e && e.message ? e.message : String(e));
      });
  });
})();
