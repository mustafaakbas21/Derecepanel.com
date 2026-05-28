/**
 * Deneme Sonuçları Yükleme — TXT Yükleme ve Değerlendirme Motoru  ·  V2
 * ---------------------------------------------------------------------
 * V2 Güncellemeleri:
 *  - Dinamik Optik Şablon Motoru (optikSablonlar) : TYT120 / AYT160 / LGS90 / Kurum / TSV
 *  - Asenkron chunked parser (500 satırlık bloklar, requestAnimationFrame) → binlerce satırda da tarayıcı donmaz
 *  - Canlı Özet Panosu (mini dashboard) real-time güncellenir
 *  - Smart Diagnostics: eksik kitapçık (sarı), mükerrer okuma, fuzzy name match
 *  - Fuzzy Öneri (Levenshtein) — manuel eşleştirme modalında en üstte %-skorlu öneri
 *  - Değerlendir akışı: hatalı satır varsa özel onay modalı ("Temizleri Kaydet")
 */
(function () {
  "use strict";

  // ============================================================
  // 1) OPTİK ŞABLON MOTORU — dinamik karakter offsetleri
  // ============================================================
  // Tüm sabit/mock şablonlar kaldırıldı — motor yalnızca Stüdyo veya
  // FmtStore (LocalStorage/IndexedDB) üzerinden yüklenen gerçek şablonları
  // `.custom` / `.fmt:<id>` anahtarlarına runtime'da yerleştirir.
  var optikSablonlar = {};

  var STORAGE_STUDENTS = "derecepanel_student_catalog_v1";
  var STORAGE_RESULTS  = "derece_exam_results_v1";
  var STORAGE_EXAMS    = "exams";          // Kurumsal deneme takvimi (Test Oluşturucu / Global Deneme Takvimi)
  var STORAGE_EXAMRES  = "examResults";    // Analiz Merkezi'nin okuduğu kanonik sonuç havuzu
  var CHUNK_SIZE       = 500; // her animation frame'de işlenecek satır sayısı

  // ============================================================
  // State
  // ============================================================
  var state = {
    rows: [],
    filter: "all",
    search: "",
    fileName: "",
    students: [],
    template: "",
    examId: "",      // Hedef Deneme (Kurumsal) — payload bu ID ile damgalanır
    seenCodes: {}, // mükerrer okuma tespiti için
    cancel: false,
  };

  var $ = function (id) { return document.getElementById(id); };

  // ============================================================
  // Öğrenci Kataloğu
  // ============================================================
  function loadStudents() {
    try {
      var raw = localStorage.getItem(STORAGE_STUDENTS);
      var arr = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(arr)) arr = [];
      return filterStudentsForActiveCoach(arr);
    } catch (e) { return []; }
  }

  function filterStudentsForActiveCoach(arr) {
    try {
      var role = String(sessionStorage.getItem("dp_auth_role") || "").trim();
      if (role !== "coach" && role !== "admin") return arr || [];
      var cid =
        String(sessionStorage.getItem("dp_auth_user_id") || sessionStorage.getItem("dp_appwrite_user_id") || "").trim();
      if (!cid) return [];
      return (arr || []).filter(function (s) {
        return String((s && s.coachId) || "").trim() === cid;
      });
    } catch (e2) {
      return arr || [];
    }
  }
  function saveStudents(list) {
    try { localStorage.setItem(STORAGE_STUDENTS, JSON.stringify(list)); } catch (e) {}
  }
  function refreshStudentsCache() { state.students = loadStudents(); }
  function findStudentByCode(code) {
    if (!code) return null;
    var needle = String(code).trim();
    if (!needle) return null;
    for (var i = 0; i < state.students.length; i++) {
      var s = state.students[i];
      var sc = (s.code || s.studentCode || s.no || "").toString().trim();
      if (sc && sc === needle) return s;
    }
    return null;
  }
  function upsertStudent(obj) {
    var list = state.students.slice();
    var code = String(obj.code || "").trim();
    var idx = -1;
    for (var i = 0; i < list.length; i++) {
      if ((list[i].code || "").toString().trim() === code) { idx = i; break; }
    }
    if (idx >= 0) {
      list[idx] = Object.assign({}, list[idx], obj);
    } else {
      list.push(Object.assign({
        id: obj.id || ("stu-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6)),
        alan: "tyt",
      }, obj));
    }
    saveStudents(list);
    state.students = list;
    return list[idx >= 0 ? idx : list.length - 1];
  }

  // ============================================================
  // Fuzzy Match (Levenshtein) — Akıllı İsim Önerisi
  // ============================================================
  function normalizeName(s) {
    return String(s || "")
      .toLocaleLowerCase("tr")
      .replace(/ı/g, "i").replace(/İ/g, "i")
      .replace(/ş/g, "s").replace(/ç/g, "c").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ğ/g, "g")
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }
  function levenshtein(a, b) {
    a = a || ""; b = b || "";
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    var m = a.length, n = b.length;
    var prev = new Array(n + 1), curr = new Array(n + 1);
    for (var j = 0; j <= n; j++) prev[j] = j;
    for (var i = 1; i <= m; i++) {
      curr[0] = i;
      for (var jj = 1; jj <= n; jj++) {
        var cost = a.charCodeAt(i - 1) === b.charCodeAt(jj - 1) ? 0 : 1;
        curr[jj] = Math.min(curr[jj - 1] + 1, prev[jj] + 1, prev[jj - 1] + cost);
      }
      var tmp = prev; prev = curr; curr = tmp;
    }
    return prev[n];
  }
  function similarity(a, b) {
    var na = normalizeName(a), nb = normalizeName(b);
    if (!na || !nb) return 0;
    var maxLen = Math.max(na.length, nb.length);
    if (!maxLen) return 0;
    return Math.max(0, 1 - levenshtein(na, nb) / maxLen);
  }
  function bestFuzzyMatches(query, limit) {
    var scored = [];
    for (var i = 0; i < state.students.length; i++) {
      var s = state.students[i];
      var score = similarity(query, s.name || "");
      if (score >= 0.55) scored.push({ s: s, score: score });
    }
    scored.sort(function (a, b) { return b.score - a.score; });
    return scored.slice(0, limit || 3);
  }

  // ============================================================
  // Dinamik Parser
  // ============================================================
  function safeSlice(str, a, b) { return b == null ? str.slice(a) : str.slice(a, b); }

  // Aktif cevap anahtarı — Hedef Deneme seçildiğinde doldurulur
  // Format: { key: "ABCDE...", count: 4 }   (sadece A-E harfleri)
  state.answerKey = null;

  function normalizeKeyString(src) {
    return String(src || "").toUpperCase().replace(/[^A-E]/g, "");
  }

  // Seçili Hedef Deneme'nin cevap anahtarını state'e yükle
  function refreshAnswerKey() {
    state.answerKey = null;
    if (!state.examId) return;
    var ex = (typeof getSelectedExam === "function") ? getSelectedExam() : null;
    if (!ex) {
      // Fallback: doğrudan havuzlardan bul
      var buckets = loadExamsBuckets();
      var pool = buckets.kurumsal.concat(buckets.global);
      ex = pool.find(function (x) { return x && x.id === state.examId; });
    }
    if (!ex) return;
    // Olası alanlar: cevaplar (kurumsal), answers, answerKey, key
    var arr = ex.cevaplar || ex.answers || ex.answerKey || null;
    var str = "";
    if (Array.isArray(arr)) str = arr.join("");
    else if (typeof arr === "string") str = arr;
    var key = normalizeKeyString(str);
    if (!key) return;
    state.answerKey = { key: key, count: key.length };
  }

  // Gerçek cevap anahtarı ile doğru/yanlış/boş/net hesabı
  //   · Anahtar yoksa → { correct:0, wrong:0, blank:0, net:null }
  //   · Öğrenci cevabı kısaysa eksik kalanlar "boş" sayılır
  //   · Fazla şık varsa anahtar uzunluğunda kesilir
  function evaluateRow(studentAnswers) {
    var res = { correct: 0, wrong: 0, blank: 0, net: null };
    var key = state.answerKey && state.answerKey.key;
    if (!key) return res;
    var N = key.length;
    var ans = normalizeKeyString(studentAnswers).padEnd(N, " "); // eksikler boş kalsın
    for (var i = 0; i < N; i++) {
      var a = ans.charAt(i), k = key.charAt(i);
      if (!a || a === " ") res.blank++;
      else if (a === k) res.correct++;
      else res.wrong++;
    }
    res.net = Math.max(0, Math.round((res.correct - res.wrong / 4) * 100) / 100);
    return res;
  }

  var FMT_KIND_ALIASES = {
    no: "no", number: "no", ogrenci: "no", student: "no", student_id: "no", tc: "no",
    name: "name", ad: "name", isim: "name", ad_soyad: "name", student_name: "name",
    book: "book", kitapcik: "book", form: "book",
    answers: "answers", answer: "answers", cevap: "answers", cevaplar: "answers",
  };

  function resolveFmtKind(raw) {
    var k = String(raw || "").toLowerCase().replace(/[\s-]+/g, "_");
    return FMT_KIND_ALIASES[k] || k;
  }

  /** FMT alan tanımı → { kind, start, length } (length null = satır sonuna kadar) */
  function normalizeFmtFieldDef(field) {
    if (!field) return null;
    var kind = resolveFmtKind(field.kind || field.key || field.name || field.label || field.type || field.id);
    var start = null;
    var length = null;

    if (Array.isArray(field)) {
      start = +field[0];
      if (field.length > 2 && field[2] === "len") {
        length = field[1] == null ? null : Math.max(0, +field[1]);
      } else if (field[1] != null) {
        var end = +field[1];
        length = end > start ? end - start : Math.max(0, end);
      }
    } else if (field.start != null || field.offset != null) {
      start = +(field.start != null ? field.start : field.offset);
      if (field.length != null) length = Math.max(0, +field.length);
      else if (field.len != null) length = Math.max(0, +field.len);
      else if (field.end != null) length = Math.max(0, +field.end - start);
    } else if (field.from != null) {
      start = +field.from;
      if (field.length != null) length = Math.max(0, +field.length);
      else if (field.to != null) length = Math.max(0, +field.to - start);
    }

    if (start == null || isNaN(start)) return null;
    return { kind: kind, start: Math.max(0, start), length: length == null || isNaN(length) ? null : length };
  }

  function legacyRangeToField(kind, range) {
    if (!range || range[0] == null || isNaN(+range[0])) return null;
    var start = +range[0];
    var end = range[1];
    var length = end == null ? null : Math.max(0, end - start);
    return { kind: kind, start: start, length: length };
  }

  function buildParserFields(source) {
    if (!source) return [];
    if (Array.isArray(source.fields) && source.fields.length) {
      var out = [];
      source.fields.forEach(function (f) {
        var n = normalizeFmtFieldDef(f);
        if (n) out.push(n);
      });
      if (out.length) return out;
    }
    var fields = [];
    ["no", "name", "book", "answers"].forEach(function (kind) {
      var key = kind === "name" ? (source.nameRange ? "nameRange" : "name") : kind;
      var range = source[key] || (kind === "name" ? source.name : null);
      if (kind === "name" && !range && source.nameRange) range = source.nameRange;
      var f = legacyRangeToField(kind, range);
      if (f) fields.push(f);
    });
    return fields;
  }

  function buildParserTemplate(source) {
    if (!source) return null;
    var fields = buildParserFields(source);
    if (!fields.length) return null;
    var maxEnd = 0;
    fields.forEach(function (f) {
      var end = f.length == null ? (source.minLine || 0) : f.start + f.length;
      if (end > maxEnd) maxEnd = end;
    });
    return {
      label: source.label || source.name || "FMT",
      fields: fields,
      tabbed: !!source.tabbed,
      minLine: source.minLine || maxEnd || 10,
      expectedAnswers: source.expectedAnswers,
      __fmtId: source.id,
    };
  }

  function sliceByFmtField(line, field) {
    var s = field.start;
    if (field.length == null) return line.slice(s).trim();
    return line.slice(s, s + field.length).trim();
  }

  function applyMatchToRow(row, stu) {
    if (!row || !stu) return;
    row.matched = true;
    row.status = "matched";
    row.matchedId = stu.id;
    row.studentId = stu.id;
    row.no = stu.code || stu.studentCode || stu.no || row.no;
    row.name = stu.name || row.name;
    row.sube = stu.sube || stu.alan || "";
    row.issues = (row.issues || []).filter(function (x) {
      return x !== "unmatched" && x !== "no-code";
    });
  }

  function markRowUnmatched(row) {
    if (!row) return;
    row.matched = false;
    row.status = "unmatched";
    row.matchedId = null;
    row.studentId = null;
    if ((row.issues || []).indexOf("unmatched") === -1) row.issues.push("unmatched");
  }

  function parseLineWithTemplate(line, idx, tpl) {
    var no = "", name = "", book = "", answers = "";

    if (tpl.tabbed) {
      var parts = line.split(/\t|;|,(?=\S)/);
      no      = (parts[0] || "").trim();
      name    = (parts[1] || "").trim();
      book    = ((parts[2] || "").trim().charAt(0) || "").toUpperCase();
      answers = (parts.slice(3).join("") || "").trim();
    } else if (tpl.fields && tpl.fields.length) {
      tpl.fields.forEach(function (f) {
        var val = sliceByFmtField(line, f);
        if (f.kind === "no") no = val;
        else if (f.kind === "name") name = val;
        else if (f.kind === "book") book = (val.charAt(0) || "").toUpperCase();
        else if (f.kind === "answers") answers += val;
      });
    } else {
      return null;
    }

    var issues = []; // smart diagnostics

    // İsim temizliği — trim + çift boşluk sıkıştır
    var cleanName = String(name || "").trim().replace(/\s{2,}/g, " ");
    // Cevaplar — sadece A-E (sayı/boşluk olanlar boş kabul edilir)
    var cleanAnswers = normalizeKeyString(answers);

    var ev = evaluateRow(cleanAnswers);
    var row = {
      id: "row-" + idx + "-" + Math.random().toString(36).slice(2, 7),
      no: String(no || "").trim(),
      name: cleanName,
      book: book || "",
      answers: cleanAnswers,
      correct: ev.correct,
      wrong: ev.wrong,
      blank: ev.blank,
      net: ev.net,
      sube: "",
      matched: false,
      matchedId: null,
      studentId: null,
      status: "unmatched",
      selected: true,
      issues: issues,
    };

    // Smart Diagnostics -------------------------------------
    // 1) Eksik kitapçık
    if (!row.book) issues.push("no-book");
    // 2) Mükerrer okuma
    if (row.no) {
      if (state.seenCodes[row.no]) issues.push("duplicate");
      else state.seenCodes[row.no] = true;
    } else {
      issues.push("no-code");
    }

    // Eşleştirme --------------------------------------------
    var student = findStudentByCode(row.no);
    if (student) {
      applyMatchToRow(row, student);
      if (!row.name) row.name = student.name || "";
    } else if (row.name) {
      var nameKey = normalizeName(row.name);
      for (var i = 0; i < state.students.length; i++) {
        if (normalizeName(state.students[i].name) === nameKey) {
          applyMatchToRow(row, state.students[i]);
          break;
        }
      }
    }
    if (!row.matched) markRowUnmatched(row);
    else row.status = "matched";
    return row;
  }

  // ============================================================
  // Asenkron Chunked Parser (UI donmaz)
  // ============================================================
  function parseTextAsync(text, onProgress) {
    return new Promise(function (resolve) {
      var tpl = optikSablonlar[state.template];
      if (!tpl) {
        toast("Önce bir Optik Şablon seçin veya Stüdyo'dan yükleyin", "error");
        resolve([]);
        return;
      }
      state.seenCodes = {};
      var lines = text.split(/\r?\n/).map(function (l) {
        return l.replace(/\uFFFD/g, "").replace(/\s+$/g, "");
      }).filter(function (l) { return l && l.trim().length > 0; });

      // Uzunluk uyum kontrolü — şablonun beklenen min uzunluğu vs satırın gerçek uzunluğu
      if (lines.length && !tpl.tabbed) {
        var ansField = (tpl.fields || []).find(function (f) { return f.kind === "answers"; });
        var expected = Math.max(tpl.minLine || 0, ansField ? ansField.start : 0);
        var avgLen = 0;
        for (var k = 0; k < Math.min(lines.length, 10); k++) avgLen += lines[k].length;
        avgLen = Math.round(avgLen / Math.min(lines.length, 10));
        if (expected && avgLen && Math.abs(avgLen - expected) > Math.max(20, expected * 0.5)) {
          toast("Dosya uzunluğu şablonla uyumsuz (satır ~" + avgLen + ", beklenen ~" + expected + ")", "error");
        }
      }

      var rows = [];
      var total = lines.length;
      var i = 0;

      function nextChunk() {
        if (state.cancel) { resolve(rows); return; }
        var end = Math.min(i + CHUNK_SIZE, total);
        for (; i < end; i++) {
          var r = parseLineWithTemplate(lines[i], i, tpl);
          if (r) rows.push(r);
        }
        var pct = total ? Math.round((i / total) * 100) : 100;
        if (onProgress) onProgress(pct, i, total);
        if (i < total) {
          (window.requestAnimationFrame || function (fn) { setTimeout(fn, 16); })(nextChunk);
        } else {
          resolve(rows);
        }
      }
      nextChunk();
    });
  }

  // ============================================================
  // FileReader — ISO-8859-9 öncelikli
  // ============================================================
  function readFile(file) {
    return new Promise(function (resolve, reject) {
      if (window.TextDecoder && file.arrayBuffer) {
        file.arrayBuffer().then(function (buf) {
          var text;
          try { text = new TextDecoder("windows-1254").decode(buf); }
          catch (e) { text = new TextDecoder("utf-8").decode(buf); }
          if (text.indexOf("\uFFFD") !== -1) {
            try {
              var alt = new TextDecoder("utf-8").decode(buf);
              if (alt.indexOf("\uFFFD") === -1) text = alt;
            } catch (e) {}
          }
          resolve(text);
        }).catch(reject);
      } else {
        var rdr = new FileReader();
        rdr.onload = function () { resolve(String(rdr.result || "")); };
        rdr.onerror = reject;
        rdr.readAsText(file, "ISO-8859-9");
      }
    });
  }

  // ============================================================
  // UI Helpers
  // ============================================================
  var toastTimer;
  function toast(msg, variant) {
    var t = $("dsy-toast"), tx = $("dsy-toast-text"), ic = $("dsy-toast-icon");
    tx.textContent = msg || "Tamam";
    if (variant === "error") {
      t.classList.remove("bg-slate-900"); t.classList.add("bg-rose-600");
      if (ic) { ic.classList.remove("text-emerald-400"); ic.classList.add("text-white"); }
    } else {
      t.classList.remove("bg-rose-600"); t.classList.add("bg-slate-900");
      if (ic) { ic.classList.add("text-emerald-400"); ic.classList.remove("text-white"); }
    }
    t.classList.remove("hidden"); t.classList.add("inline-flex");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      t.classList.add("hidden"); t.classList.remove("inline-flex");
    }, 2800);
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // Progress bar ---------------------------------------------
  function showProgress(meta) {
    var wrap = $("dsy-progress-wrap");
    wrap.classList.remove("hidden");
    setProgress(0, meta || "Dosya okunuyor…");
  }
  function setProgress(pct, meta) {
    var bar = $("dsy-progress-bar"), pctEl = $("dsy-progress-pct"), metaEl = $("dsy-progress-meta");
    bar.style.width = pct + "%";
    pctEl.textContent = pct + "%";
    if (meta != null) metaEl.textContent = meta;
  }
  function hideProgress() {
    setTimeout(function () { $("dsy-progress-wrap").classList.add("hidden"); }, 250);
  }

  // ============================================================
  // Canlı Özet Panosu
  // ============================================================
  function countIssues() {
    var missing = 0, nobook = 0, dupe = 0;
    for (var i = 0; i < state.rows.length; i++) {
      var iss = state.rows[i].issues || [];
      if (iss.indexOf("unmatched") !== -1 || iss.indexOf("no-code") !== -1) missing++;
      if (iss.indexOf("no-book") !== -1) nobook++;
      if (iss.indexOf("duplicate") !== -1) dupe++;
    }
    return { missing: missing, nobook: nobook, dupe: dupe, total: missing + nobook + dupe };
  }

  function renderLiveDashboard() {
    var dash = $("dsy-live-dashboard");
    if (!state.rows.length) { dash.classList.add("hidden"); dash.classList.remove("grid"); return; }
    dash.classList.remove("hidden"); dash.classList.add("grid");

    var total = state.rows.length;
    var matched = state.rows.filter(function (r) { return r.matched; }).length;
    var pct = total ? Math.round((matched / total) * 100) : 0;
    var iss = countIssues();

    $("dsy-live-total").textContent = total;
    $("dsy-live-file").textContent = state.fileName || "—";
    $("dsy-live-matched").textContent = matched;
    $("dsy-live-matched-pct").textContent = "%" + pct;
    $("dsy-live-matched-bar").style.width = pct + "%";
    $("dsy-live-critical").textContent = iss.total;
    $("dsy-live-missing").textContent = iss.missing;
    $("dsy-live-nobook").textContent = iss.nobook;
    $("dsy-live-dupe").textContent = iss.dupe;
  }

  // ============================================================
  // Stats + tablo render
  // ============================================================
  function renderStats() {
    var total = state.rows.length;
    var matched = state.rows.filter(function (r) { return r.matched; }).length;
    var selected = state.rows.filter(function (r) { return r.selected; }).length;
    $("dsy-stat-total").textContent = total;
    $("dsy-stat-matched").textContent = matched;
    $("dsy-stat-unmatched").textContent = total - matched;
    $("dsy-stat-selected").textContent = selected;

    var btn = $("dsy-btn-evaluate");
    var btnCount = $("dsy-btn-count");
    btn.disabled = selected === 0;
    if (selected > 0) { btnCount.classList.remove("hidden"); btnCount.textContent = selected; }
    else btnCount.classList.add("hidden");

    var unmatched = total - matched;
    var bulkBtn = $("dsy-btn-manage-unmatched");
    if (bulkBtn) {
      bulkBtn.disabled = unmatched === 0;
      bulkBtn.setAttribute("aria-disabled", unmatched === 0 ? "true" : "false");
      bulkBtn.classList.toggle("opacity-40", unmatched === 0);
      bulkBtn.classList.toggle("pointer-events-none", unmatched === 0);
      var badge = $("dsy-btn-unmatched-count");
      if (badge) {
        if (unmatched > 0) {
          badge.textContent = unmatched;
          badge.classList.remove("hidden");
        } else {
          badge.classList.add("hidden");
        }
      }
    }
  }

  function rowMatches(r) {
    if (state.filter === "matched" && !r.matched) return false;
    if (state.filter === "unmatched" && r.matched) return false;
    if (state.search) {
      var q = state.search.toLowerCase();
      if ((r.no || "").toLowerCase().indexOf(q) === -1 &&
          (r.name || "").toLowerCase().indexOf(q) === -1) return false;
    }
    return true;
  }

  function statusCellHtml(r) {
    var iss = r.issues || [];
    if (iss.indexOf("duplicate") !== -1) {
      return '<button type="button" data-act="match" data-id="' + r.id + '" title="Çift Okuma Hatası — aynı öğrenci numarası daha önce de okundu" class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-violet-700 transition hover:bg-violet-200">' +
        '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>' +
      '</button>';
    }
    if (!r.matched) {
      return '<button type="button" data-act="match" data-id="' + r.id + '" title="Öğrenci Bulunamadı — manuel eşleştir" class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-rose-700 transition hover:bg-rose-200">' +
        '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>' +
      '</button>';
    }
    if (iss.indexOf("no-book") !== -1) {
      return '<span title="Eşleşti ancak kitapçık türü boş" class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-700">' +
        '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01"/><circle cx="12" cy="12" r="10"/></svg>' +
      '</span>';
    }
    return '<span title="Eşleşti" class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">' +
      '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>' +
    '</span>';
  }

  function renderTable() {
    var tb = $("dsy-tbody");
    var rows = state.rows.filter(rowMatches);
    if (!state.rows.length) {
      $("dsy-table-wrap").classList.add("hidden");
      $("dsy-stats").classList.add("hidden");
      $("dsy-empty").classList.remove("hidden");
      renderLiveDashboard();
      return;
    }
    $("dsy-empty").classList.add("hidden");
    $("dsy-table-wrap").classList.remove("hidden");
    $("dsy-stats").classList.remove("hidden");
    $("dsy-stats").classList.add("grid");

    if (!rows.length) {
      tb.innerHTML = "";
      $("dsy-empty-rows").classList.remove("hidden");
    } else {
      $("dsy-empty-rows").classList.add("hidden");
      tb.innerHTML = rows.map(function (r) {
        var iss = r.issues || [];
        var rowCls;
        if (iss.indexOf("duplicate") !== -1) rowCls = "bg-violet-50/50 hover:bg-violet-50";
        else if (!r.matched) rowCls = "bg-rose-50/50 hover:bg-rose-50";
        else rowCls = "hover:bg-slate-50";

        var bookCellCls = "px-4 py-3 text-center";
        var bookInner;
        if (!r.book) {
          bookCellCls += " bg-amber-50";
          bookInner = '<span title="Kitapçık boş" class="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-700">' +
            '<svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01"/><circle cx="12" cy="12" r="10"/></svg>EKSİK</span>';
        } else {
          var bookCls = r.book === "A" ? "bg-indigo-100 text-indigo-700"
            : r.book === "B" ? "bg-violet-100 text-violet-700"
            : r.book === "C" ? "bg-sky-100 text-sky-700"
            : r.book === "D" ? "bg-pink-100 text-pink-700"
            : "bg-slate-100 text-slate-700";
          bookInner = '<span class="inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-extrabold ' + bookCls + '">' + escapeHtml(r.book) + '</span>';
        }

        var nameCell = '<td class="px-4 py-3 font-semibold text-slate-900">' + escapeHtml(r.name || "—") +
          (iss.indexOf("duplicate") !== -1 ? ' <span class="ml-1 rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-700">ÇİFT OKUMA</span>' : "") +
        '</td>';

        var dashMuted = '<span class="text-slate-400">—</span>';
        var dCell = (r.correct != null && state.answerKey) ? '<span class="font-mono text-[12px] font-extrabold text-emerald-600">' + r.correct + '</span>' : dashMuted;
        var yCell = (r.wrong   != null && state.answerKey) ? '<span class="font-mono text-[12px] font-extrabold text-rose-600">' + r.wrong + '</span>' : dashMuted;
        var bCell = (r.blank   != null && state.answerKey) ? '<span class="font-mono text-[12px] font-bold text-slate-500">' + r.blank + '</span>' : dashMuted;

        return '<tr data-id="' + r.id + '" class="' + rowCls + '">' +
          '<td class="px-4 py-3"><input type="checkbox" data-act="sel" data-id="' + r.id + '" class="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"' + (r.selected ? " checked" : "") + '/></td>' +
          '<td class="px-4 py-3">' + statusCellHtml(r) + '</td>' +
          '<td class="px-4 py-3 font-mono text-[12px] font-semibold text-slate-800">' + escapeHtml(r.no || "—") + '</td>' +
          nameCell +
          '<td class="' + bookCellCls + '">' + bookInner + '</td>' +
          '<td class="px-3 py-3 text-right">' + dCell + '</td>' +
          '<td class="px-3 py-3 text-right">' + yCell + '</td>' +
          '<td class="px-3 py-3 text-right">' + bCell + '</td>' +
          '<td class="px-4 py-3 text-right font-mono text-sm font-bold text-slate-800">' + (r.net != null ? r.net.toFixed(2) : "—") + '</td>' +
          '<td class="px-4 py-3 text-xs text-slate-600">' + (r.sube ? escapeHtml(String(r.sube).toUpperCase()) : '<span class="text-slate-400">—</span>') + '</td>' +
          '<td class="px-4 py-3 text-right">' +
            '<button type="button" data-act="del" data-id="' + r.id + '" class="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600" title="Satırı sil" aria-label="Sil">' +
              '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/><path d="M10 11v6M14 11v6"/></svg>' +
            '</button>' +
          '</td>' +
        '</tr>';
      }).join("");
    }

    var selectAll = $("dsy-select-all");
    var visible = rows;
    var allSelected = visible.length > 0 && visible.every(function (r) { return r.selected; });
    selectAll.checked = allSelected;
    selectAll.indeterminate = !allSelected && visible.some(function (r) { return r.selected; });

    renderStats();
    renderLiveDashboard();
  }

  // ============================================================
  // Manuel Eşleştirme Modalı (Fuzzy öneri dahil)
  // ============================================================
  var matchCtx = { rowId: null };
  function openMatchModal(rowId) {
    var row = state.rows.find(function (r) { return r.id === rowId; });
    if (!row) return;
    matchCtx.rowId = rowId;
    var modal = $("dsy-match-modal");
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    $("dsy-match-sub").innerHTML = 'TXT\'den gelen: <b>' + escapeHtml(row.name || "—") + '</b> (<span class="font-mono">' + escapeHtml(row.no || "—") + '</span>)';
    renderSuggestions(row);
    var input = $("dsy-match-search");
    input.value = row.name || row.no || "";
    renderMatchList(input.value);
    setTimeout(function () { input.focus(); input.select(); }, 30);
  }
  function closeMatchModal() {
    var m = $("dsy-match-modal");
    m.classList.add("hidden"); m.classList.remove("flex");
    matchCtx.rowId = null;
  }
  function renderSuggestions(row) {
    var box = $("dsy-match-suggestions");
    var list = $("dsy-match-suggestion-list");
    var query = row.name || row.no || "";
    var sugg = bestFuzzyMatches(query, 3);
    if (!sugg.length) { box.classList.add("hidden"); return; }
    box.classList.remove("hidden");
    list.innerHTML = sugg.map(function (item) {
      var pct = Math.round(item.score * 100);
      var pctCls = pct >= 85 ? "bg-emerald-100 text-emerald-700"
                  : pct >= 70 ? "bg-amber-100 text-amber-700"
                  : "bg-slate-100 text-slate-600";
      var init = (item.s.name || "?").split(/\s+/).map(function (x) { return x[0] || ""; }).slice(0, 2).join("").toUpperCase();
      return '<li><button type="button" data-id="' + item.s.id + '" class="dsy-match-pick flex w-full items-center gap-3 rounded-xl border border-brand-200 bg-white px-3 py-2 text-left transition hover:border-brand-500 hover:bg-brand-50">' +
        '<span class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-indigo-500 text-[11px] font-extrabold text-white">' + escapeHtml(init) + '</span>' +
        '<span class="min-w-0 flex-1">' +
          '<span class="block truncate text-sm font-semibold text-slate-900">' + escapeHtml(item.s.name || "—") + '</span>' +
          '<span class="block truncate text-[11px] text-slate-500">No: ' + escapeHtml(item.s.code || "—") + '</span>' +
        '</span>' +
        '<span class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold ' + pctCls + '">%' + pct + ' eşleşme</span>' +
      '</button></li>';
    }).join("");
    list.querySelectorAll(".dsy-match-pick").forEach(function (b) {
      b.addEventListener("click", function () { pickMatch(b.dataset.id); });
    });
  }
  function renderMatchList(q) {
    var ul = $("dsy-match-list");
    var query = (q || "").toLowerCase().trim();
    var items = state.students.filter(function (s) {
      if (!query) return true;
      return (s.name || "").toLowerCase().indexOf(query) !== -1 ||
             (s.code || "").toLowerCase().indexOf(query) !== -1;
    }).slice(0, 40);
    if (!items.length) {
      ul.innerHTML = '<li class="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">Eşleşen öğrenci bulunamadı. Aşağıdan yeni kayıt oluşturabilirsiniz.</li>';
      return;
    }
    ul.innerHTML = items.map(function (s) {
      var init = (s.name || "?").split(/\s+/).map(function (x) { return x[0] || ""; }).slice(0, 2).join("").toUpperCase();
      return '<li><button type="button" data-id="' + s.id + '" class="dsy-match-pick flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-left transition hover:border-brand-300 hover:bg-brand-50/60">' +
        '<span class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-indigo-500 text-[11px] font-extrabold text-white">' + escapeHtml(init) + '</span>' +
        '<span class="min-w-0 flex-1">' +
          '<span class="block truncate text-sm font-semibold text-slate-900">' + escapeHtml(s.name || "—") + '</span>' +
          '<span class="block truncate text-[11px] text-slate-500">No: ' + escapeHtml(s.code || "—") + ' · ' + escapeHtml((s.alan || "").toUpperCase()) + '</span>' +
        '</span>' +
      '</button></li>';
    }).join("");
    ul.querySelectorAll(".dsy-match-pick").forEach(function (b) {
      b.addEventListener("click", function () { pickMatch(b.dataset.id); });
    });
  }
  function pickMatch(studentId) {
    if (!matchCtx.rowId) return;
    var row = state.rows.find(function (r) { return r.id === matchCtx.rowId; });
    var stu = state.students.find(function (s) { return s.id === studentId; });
    if (!row || !stu) return;
    applyMatchToRow(row, stu);
    closeMatchModal();
    renderTable();
    toast("Manuel eşleştirme tamamlandı: " + stu.name);
  }
  function createStudentFromRow() {
    if (!matchCtx.rowId) return;
    var row = state.rows.find(function (r) { return r.id === matchCtx.rowId; });
    if (!row) return;
    if (!row.no) { toast("Öğrenci no boş olduğu için eklenemedi", "error"); return; }
    var stu = upsertStudent({ code: row.no, name: row.name || ("Öğrenci " + row.no), alan: "tyt" });
    applyMatchToRow(row, stu);
    closeMatchModal();
    renderTable();
    toast("Yeni öğrenci kaydedildi: " + stu.name);
  }

  // ============================================================
  // Toplu Eşleştirme Modalı (Split-Pane)
  // ============================================================
  var bulkMatchCtx = { opticalId: null, studentId: null };

  function getUnmatchedRows() {
    return state.rows.filter(function (r) { return !r.matched || r.status === "unmatched"; });
  }

  function openBulkMatchModal() {
    var list = getUnmatchedRows();
    if (!list.length) return;
    bulkMatchCtx.opticalId = null;
    bulkMatchCtx.studentId = null;
    var modal = $("dsy-bulk-match-modal");
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    renderBulkOpticalList();
    var search = $("dsy-bulk-student-search");
    if (search) { search.value = ""; }
    renderBulkStudentList("");
    updateBulkMatchButton();
    if (search) setTimeout(function () { search.focus(); }, 40);
  }

  function closeBulkMatchModal() {
    var m = $("dsy-bulk-match-modal");
    if (!m) return;
    m.classList.add("hidden");
    m.classList.remove("flex");
    bulkMatchCtx.opticalId = null;
    bulkMatchCtx.studentId = null;
    renderTable();
  }

  function updateBulkMatchButton() {
    var btn = $("dsy-bulk-match-btn");
    if (!btn) return;
    var ready = !!(bulkMatchCtx.opticalId && bulkMatchCtx.studentId);
    btn.disabled = !ready;
    btn.classList.toggle("opacity-40", !ready);
    btn.classList.toggle("cursor-not-allowed", !ready);
    btn.classList.toggle("shadow-lg", ready);
    btn.classList.toggle("shadow-brand-200", ready);
  }

  function renderBulkOpticalList() {
    var ul = $("dsy-bulk-optical-list");
    var empty = $("dsy-bulk-optical-empty");
    if (!ul) return;
    var rows = getUnmatchedRows();
    if (empty) empty.classList.toggle("hidden", rows.length > 0);
    if (!rows.length) {
      ul.innerHTML = "";
      return;
    }
    ul.innerHTML = rows.map(function (r) {
      var active = bulkMatchCtx.opticalId === r.id;
      return '<li><button type="button" data-optical-id="' + r.id + '" class="dsy-bulk-optical-pick flex w-full flex-col gap-0.5 rounded-xl border px-3 py-2.5 text-left transition ' +
        (active
          ? "border-brand-500 bg-brand-50 ring-2 ring-brand-200"
          : "border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50/50") + '">' +
        '<span class="truncate text-sm font-bold text-slate-900">' + escapeHtml(r.name || "—") + '</span>' +
        '<span class="font-mono text-[11px] text-slate-500">No: ' + escapeHtml(r.no || "—") + '</span>' +
      '</button></li>';
    }).join("");
    ul.querySelectorAll(".dsy-bulk-optical-pick").forEach(function (b) {
      b.addEventListener("click", function () {
        bulkMatchCtx.opticalId = b.getAttribute("data-optical-id");
        renderBulkOpticalList();
        updateBulkMatchButton();
      });
    });
  }

  function renderBulkStudentList(q) {
    var ul = $("dsy-bulk-student-list");
    var empty = $("dsy-bulk-student-empty");
    if (!ul) return;
    var query = (q || "").toLowerCase().trim();
    var items = state.students.filter(function (s) {
      if (!query) return true;
      return (s.name || "").toLowerCase().indexOf(query) !== -1 ||
             (String(s.code || s.studentCode || s.no || "")).toLowerCase().indexOf(query) !== -1;
    });
    if (empty) empty.classList.toggle("hidden", items.length > 0);
    if (!items.length) {
      ul.innerHTML = "";
      return;
    }
    ul.innerHTML = items.map(function (s) {
      var active = bulkMatchCtx.studentId === s.id;
      var init = (s.name || "?").split(/\s+/).map(function (x) { return x[0] || ""; }).slice(0, 2).join("").toUpperCase();
      var code = s.code || s.studentCode || s.no || "—";
      return '<li><button type="button" data-student-id="' + s.id + '" class="dsy-bulk-student-pick flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition ' +
        (active
          ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200"
          : "border-transparent hover:border-slate-200 hover:bg-slate-50") + '">' +
        '<span class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-[11px] font-extrabold text-white">' + escapeHtml(init) + '</span>' +
        '<span class="min-w-0 flex-1">' +
          '<span class="block truncate text-sm font-semibold text-slate-900">' + escapeHtml(s.name || "—") + '</span>' +
          '<span class="block truncate text-[11px] text-slate-500">No: ' + escapeHtml(code) + '</span>' +
        '</span>' +
      '</button></li>';
    }).join("");
    ul.querySelectorAll(".dsy-bulk-student-pick").forEach(function (b) {
      b.addEventListener("click", function () {
        bulkMatchCtx.studentId = b.getAttribute("data-student-id");
        renderBulkStudentList(query);
        updateBulkMatchButton();
      });
    });
  }

  function commitBulkMatch() {
    if (!bulkMatchCtx.opticalId || !bulkMatchCtx.studentId) return;
    var row = state.rows.find(function (r) { return r.id === bulkMatchCtx.opticalId; });
    var stu = state.students.find(function (s) { return s.id === bulkMatchCtx.studentId; });
    if (!row || !stu) return;
    applyMatchToRow(row, stu);
    toast("Eşleştirildi: " + (stu.name || stu.code));
    bulkMatchCtx.opticalId = null;
    bulkMatchCtx.studentId = null;
    renderBulkOpticalList();
    renderBulkStudentList(($("dsy-bulk-student-search") || {}).value || "");
    updateBulkMatchButton();
    if (!getUnmatchedRows().length) {
      setTimeout(closeBulkMatchModal, 400);
    }
  }

  // ============================================================
  // Dosya Yükleme Akışı — Asenkron
  // ============================================================
  function handleFile(file) {
    if (!file) return;
    state.fileName = file.name || "—";
    state.cancel = false;
    refreshStudentsCache();

    showProgress("Dosya okunuyor…");
    readFile(file).then(function (text) {
      setProgress(20, "Satırlar hazırlanıyor…");
      return parseTextAsync(text, function (pct) {
        var overall = 20 + Math.round(pct * 0.75);
        setProgress(overall, "Satırlar işleniyor… (" + pct + "%)");
      });
    }).then(function (rows) {
      setProgress(98, "Eşleştirmeler sonlandırılıyor…");
      if (!rows.length) {
        hideProgress();
        toast("Geçerli satır bulunamadı. Şablonu kontrol edin.", "error");
        return;
      }
      if ($("dsy-toggle-create").checked) {
        var created = 0;
        rows.forEach(function (r) {
          if (!r.matched && r.no) {
            var stu = upsertStudent({ code: r.no, name: r.name || ("Öğrenci " + r.no), alan: "tyt" });
            applyMatchToRow(r, stu);
            created++;
          }
        });
        if (created) toast(created + " yeni öğrenci otomatik kaydedildi");
      }
      state.rows = rows;
      $("dsy-file-name").textContent = state.fileName;
      $("dsy-file-size").textContent = rows.length;
      var info = $("dsy-file-info");
      info.classList.remove("hidden"); info.classList.add("inline-flex");
      setProgress(100, "Tamamlandı");
      hideProgress();
      renderTable();
      toast(rows.length + " satır başarıyla okundu");
    }).catch(function (err) {
      hideProgress();
      toast("Dosya okunamadı: " + (err && err.message ? err.message : "bilinmeyen hata"), "error");
    });
  }

  // ============================================================
  // Değerlendir ve Yükle (hatalı satır kontrolü)
  // ============================================================
  function isRowDirty(r) {
    var iss = r.issues || [];
    return (!r.matched) || iss.indexOf("no-book") !== -1 || iss.indexOf("duplicate") !== -1 || iss.indexOf("no-code") !== -1;
  }

  function doSave(selectedClean) {
    var update = $("dsy-toggle-update").checked;
    var targetExam = getSelectedExam();
    var examId = state.examId;
    var examName = targetExam ? (targetExam.name || targetExam.title || examId) : examId;

    // --- Paket (eski format — geriye dönük uyumluluk) ----------------
    var pkg = {
      id: "pkg-" + Date.now().toString(36),
      savedAt: new Date().toISOString(),
      source: state.fileName,
      parser: (optikSablonlar[state.template] || {}).label || state.template,
      template: state.template,
      examId: examId,
      examName: examName,
      count: selectedClean.length,
      updateExisting: update,
      items: selectedClean.map(function (r) {
        return {
          rowId: r.id, studentCode: r.no, studentName: r.name, studentId: r.studentId || r.matchedId,
          book: r.book, answers: r.answers, net: r.net, sube: r.sube, matched: r.matched,
          examId: examId,
        };
      }),
    };

    var prev = [];
    try {
      var raw = localStorage.getItem(STORAGE_RESULTS);
      prev = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(prev)) prev = [];
    } catch (e) { prev = []; }
    prev.unshift(pkg);
    if (prev.length > 50) prev.length = 50;
    try { localStorage.setItem(STORAGE_RESULTS, JSON.stringify(prev)); }
    catch (e) { toast("Kaydetme başarısız (depolama dolu olabilir)", "error"); return; }

    // --- Kanonik `examResults` havuzu (Analiz Merkezi + MR motoru) ----
    try {
      var canonRaw = localStorage.getItem(STORAGE_EXAMRES);
      var canon = canonRaw ? JSON.parse(canonRaw) : [];
      if (!Array.isArray(canon)) canon = [];
      var now = new Date().toISOString();
      selectedClean.forEach(function (r) {
        var sid = r.matchedId || r.no;
        if (!sid) return;
        var rec = {
          examId: examId,
          examName: examName,
          studentId: sid,
          studentCode: r.no,
          name: r.name,
          studentName: r.name,
          book: r.book,
          answers: r.answers,
          net: r.net,
          correct: r.correct,
          wrong: r.wrong,
          blank: r.blank,
          sube: r.sube,
          source: state.fileName,
          savedAt: now,
        };
        if (update) {
          var idx = -1;
          for (var i = 0; i < canon.length; i++) {
            if (canon[i] && canon[i].examId === examId && canon[i].studentId === sid) { idx = i; break; }
          }
          if (idx >= 0) canon[idx] = rec; else canon.push(rec);
        } else {
          canon.push(rec);
        }
      });
      localStorage.setItem(STORAGE_EXAMRES, JSON.stringify(canon));
    } catch (e) {
      console.warn("[DSY] examResults yazılamadı:", e);
    }

    // --- Öğrenci gelişim ekranı: examResults_<öğrenciId> arşivi ----------
    try {
      var nowIsoStudent = new Date().toISOString();
      selectedClean.forEach(function (r) {
        var sid = r.matchedId || r.no;
        if (!sid) return;
        var rec = {
          examId: examId,
          examName: examName,
          studentId: sid,
          studentCode: r.no,
          name: r.name,
          studentName: r.name,
          book: r.book,
          answers: r.answers,
          net: r.net,
          correct: r.correct,
          wrong: r.wrong,
          blank: r.blank,
          sube: r.sube,
          source: state.fileName,
          savedAt: nowIsoStudent,
        };
        var key = "examResults_" + sid;
        var list = [];
        try {
          var prev = localStorage.getItem(key);
          list = prev ? JSON.parse(prev) : [];
          if (!Array.isArray(list)) list = [];
        } catch (e3) {
          list = [];
        }
        var ix = -1;
        for (var li = 0; li < list.length; li++) {
          if (list[li] && list[li].examId === examId) {
            ix = li;
            break;
          }
        }
        if (update && ix >= 0) list[ix] = rec;
        else if (ix >= 0) list[ix] = rec;
        else list.push(rec);
        list.sort(function (a, b) {
          return String(a.savedAt || "").localeCompare(String(b.savedAt || ""));
        });
        if (list.length > 120) list = list.slice(-120);
        localStorage.setItem(key, JSON.stringify(list));
      });
    } catch (eArs) {
      console.warn("[DSY] examResults_<id> yazılamadı:", eArs);
    }

    // --- MR motoruna (ExamMatrix) bağla ------------------------------
    //   r.answers: "ABCDEBA..." (A-E normalize edilmiş string)
    //   state.answerKey: { key, count }
    //   Her soru için { qNo, result: "correct"|"wrong"|"empty" } listesine çevir
    try {
      if (window.ExamMatrix && typeof window.ExamMatrix.addResult === "function") {
        var keyStr = state.answerKey && state.answerKey.key ? state.answerKey.key : "";
        selectedClean.forEach(function (r) {
          var sid = r.matchedId || r.no;
          if (!sid) return;
          var answers = [];
          if (keyStr) {
            var studentStr = String(r.answers || "").toUpperCase().replace(/[^A-E]/g, "");
            for (var q = 0; q < keyStr.length; q++) {
              var sAns = studentStr.charAt(q);
              var kAns = keyStr.charAt(q);
              var result = "empty";
              if (!sAns) result = "empty";
              else if (sAns === kAns) result = "correct";
              else result = "wrong";
              answers.push({ qNo: q + 1, result: result });
            }
          } else if (typeof r.answers === "string") {
            // Anahtar yok — en azından boş/cevaplı bilgisini aktar
            var s2 = r.answers.toUpperCase().replace(/[^A-E ]/g, "");
            for (var j = 0; j < s2.length; j++) {
              var c = s2.charAt(j);
              answers.push({ qNo: j + 1, result: (!c || c === " ") ? "empty" : "wrong" });
            }
          }
          window.ExamMatrix.addResult({
            examId: examId,
            studentId: sid,
            studentName: r.name,
            date: (targetExam && (targetExam.date || targetExam.examDate)) || new Date().toISOString().slice(0, 10),
            answers: answers,
          });
        });
      }
    } catch (e) { console.warn("[DSY] ExamMatrix.addResult hatası:", e); }

    // Başka sekmelerdeki Analiz Merkezi anında haberdar olsun
    try { window.dispatchEvent(new CustomEvent("examResults:change", { detail: { examId: examId } })); } catch (_) {}

    toast("Başarıyla Yüklendi ve Değerlendirildi — " + selectedClean.length + " kayıt · " + examName);

    var keep = {};
    selectedClean.forEach(function (r) { keep[r.id] = true; });
    state.rows = state.rows.filter(function (r) { return !keep[r.id]; });
    renderTable();
  }

  // Onay modalı
  function openConfirm(text, onOk) {
    var m = $("dsy-confirm-modal");
    $("dsy-confirm-text").textContent = text;
    m.classList.remove("hidden"); m.classList.add("flex");
    var ok = $("dsy-confirm-ok");
    var cancel = $("dsy-confirm-cancel");
    function cleanup() {
      m.classList.add("hidden"); m.classList.remove("flex");
      ok.removeEventListener("click", okH);
      cancel.removeEventListener("click", cancelH);
    }
    function okH() { cleanup(); onOk(); }
    function cancelH() { cleanup(); }
    ok.addEventListener("click", okH);
    cancel.addEventListener("click", cancelH);
  }

  function evaluateAndSave() {
    // Aşama 3: Hedef Deneme (Kurumsal) zorunlu — sahipsiz veri yok
    if (!state.examId) {
      toast("Lütfen sonuçları yüklemeden önce hedef denemeyi seçiniz!", "error");
      var sel = $("examSelect");
      if (sel) {
        try { sel.focus(); } catch (_) {}
        sel.classList.add("ring-4", "ring-rose-200", "border-rose-400");
        setTimeout(function () {
          sel.classList.remove("ring-4", "ring-rose-200", "border-rose-400");
        }, 1600);
      }
      return;
    }

    var selected = state.rows.filter(function (r) { return r.selected; });
    if (!selected.length) { toast("Seçili satır yok", "error"); return; }

    var dirty = selected.filter(isRowDirty);
    var clean = selected.filter(function (r) { return !isRowDirty(r); });

    if (dirty.length > 0) {
      if (!clean.length) {
        toast(dirty.length + " satırın tamamı hatalı — önce eşleştirin veya düzeltin", "error");
        return;
      }
      openConfirm(
        dirty.length + " adet hatalı kağıt var (eksik kitapçık / tanımsız numara / çift okuma). " +
        "Bunları dışarıda bırakarak diğer " + clean.length + " temiz kaydı sisteme yüklemek istiyor musunuz?",
        function () { doSave(clean); }
      );
    } else {
      doSave(clean);
    }
  }

  // ============================================================
  // Event wiring
  // ============================================================
  function wire() {
    refreshStudentsCache();

    // Şablon seçici — FmtStore merkezli (Single Source of Truth)
    var tplSel = $("dsy-template");
    populateTemplateSelect();
    refreshActiveTemplateChip();
    tplSel.addEventListener("change", function () {
      var v = tplSel.value;
      if (!v) { state.template = ""; $("dsy-parser-label").textContent = "— Şablon seçilmedi —"; refreshActiveTemplateChip(); return; }
      if (v.indexOf("fmt:") === 0) {
        var id = v.slice(4);
        loadFmtAsActive(id);
      } else {
        state.template = v;
        var tpl = optikSablonlar[state.template] || {};
        $("dsy-parser-label").textContent = tpl.label || state.template;
      }
      if (state.rows.length) {
        toast("Şablon değişti — dosyayı tekrar yükleyin", "error");
      }
    });

    // FmtStore değişince dropdown'u tazele
    window.addEventListener("fmt-store:change", populateTemplateSelect);

    // Hedef Deneme seçici — Kurumsal deneme takviminden beslenir
    var examSel = $("examSelect");
    if (examSel) {
      populateExams();
      refreshAnswerKey();
      examSel.addEventListener("change", function () {
        state.examId = examSel.value || "";
        var meta = $("dsy-exam-meta");
        if (meta) {
          if (state.examId) {
            var opt = examSel.options[examSel.selectedIndex];
            meta.textContent = (opt && opt.dataset && opt.dataset.short) || "Seçildi";
            meta.classList.remove("hidden");
            meta.classList.add("inline-flex");
          } else {
            meta.classList.add("hidden");
            meta.classList.remove("inline-flex");
          }
        }
        // Cevap anahtarını yükle — mevcut satırları yeniden değerlendir
        refreshAnswerKey();
        if (state.rows.length && state.answerKey) {
          state.rows.forEach(function (r) {
            var ev = evaluateRow(r.answers);
            r.correct = ev.correct; r.wrong = ev.wrong; r.blank = ev.blank; r.net = ev.net;
          });
          renderTable();
          toast("Cevap anahtarı uygulandı (" + state.answerKey.count + " soru)", "success");
        } else if (state.examId && !state.answerKey) {
          toast("Bu deneme için cevap anahtarı tanımlı değil", "error");
        }
      });
      // Başka bir sekmede deneme eklenir/silinirse anında yenile
      window.addEventListener("storage", function (e) {
        if (!e) return;
        if (e.key === STORAGE_EXAMS ||
            e.key === "kurum_denemeler_v1" ||
            e.key === "global_denemeler_v1") populateExams();
      });
      // Aynı sekme içinde özel event ile tetiklenebilsin
      window.addEventListener("exams:change", populateExams);
    }

    // [📁 FMT Dosyası Yükle] — FMT Kütüphanesi Modalı'nı aç
    wireFmtLibrary();

    // URL ?studio=1 veya #studio ile direkt stüdyoyu aç (Optik Okuyucu'dan gelen köprü)
    try {
      var qs = new URLSearchParams(window.location.search);
      if (qs.get("studio") === "1" || window.location.hash === "#studio") {
        setTimeout(studioOpen, 80);
      } else if (qs.get("studio") === "import") {
        setTimeout(function () {
          studioOpen();
          setTimeout(function () { var i = $("dsy-studio-fmt"); if (i) i.click(); }, 120);
        }, 80);
      }
    } catch (_) {}

    var dz = $("dsy-dropzone");
    var input = $("dsy-file-input");
    dz.addEventListener("click", function () { input.click(); });
    dz.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); }
    });
    input.addEventListener("change", function () {
      if (input.files && input.files[0]) handleFile(input.files[0]);
      input.value = "";
    });
    ["dragenter", "dragover"].forEach(function (ev) {
      dz.addEventListener(ev, function (e) {
        e.preventDefault(); e.stopPropagation();
        dz.classList.add("border-brand-500", "bg-brand-50/60", "scale-[1.01]");
      });
    });
    ["dragleave", "drop"].forEach(function (ev) {
      dz.addEventListener(ev, function (e) {
        e.preventDefault(); e.stopPropagation();
        dz.classList.remove("border-brand-500", "bg-brand-50/60", "scale-[1.01]");
      });
    });
    dz.addEventListener("drop", function (e) {
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) handleFile(f);
    });

    var tb = $("dsy-tbody");
    tb.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-act]");
      if (!btn) return;
      var act = btn.dataset.act, id = btn.dataset.id;
      if (act === "del") {
        state.rows = state.rows.filter(function (r) { return r.id !== id; });
        renderTable();
      } else if (act === "match") {
        openMatchModal(id);
      }
    });
    tb.addEventListener("change", function (e) {
      var cb = e.target.closest('input[type="checkbox"][data-act="sel"]');
      if (!cb) return;
      var row = state.rows.find(function (r) { return r.id === cb.dataset.id; });
      if (row) { row.selected = cb.checked; renderStats(); }
    });

    $("dsy-select-all").addEventListener("change", function (e) {
      var check = e.target.checked;
      var visible = state.rows.filter(rowMatches);
      visible.forEach(function (r) { r.selected = check; });
      renderTable();
    });

    $("dsy-search").addEventListener("input", function (e) {
      state.search = e.target.value; renderTable();
    });
    $("dsy-filter").addEventListener("change", function (e) {
      state.filter = e.target.value; renderTable();
    });
    $("dsy-btn-reset").addEventListener("click", function () {
      if (!state.rows.length) return;
      if (!confirm("Tüm okunan satırlar temizlensin mi?")) return;
      state.rows = [];
      var info = $("dsy-file-info");
      info.classList.add("hidden"); info.classList.remove("inline-flex");
      renderTable();
    });

    $("dsy-btn-evaluate").addEventListener("click", evaluateAndSave);

    // Manuel eşleştirme modalı
    $("dsy-match-close").addEventListener("click", closeMatchModal);
    $("dsy-match-modal").addEventListener("click", function (e) {
      if (e.target === e.currentTarget) closeMatchModal();
    });
    $("dsy-match-search").addEventListener("input", function (e) {
      renderMatchList(e.target.value);
    });
    $("dsy-match-create").addEventListener("click", createStudentFromRow);

    var bulkBtn = $("dsy-btn-manage-unmatched");
    if (bulkBtn) bulkBtn.addEventListener("click", openBulkMatchModal);
    var bulkClose = $("dsy-bulk-match-close");
    var bulkModal = $("dsy-bulk-match-modal");
    var bulkMatchBtn = $("dsy-bulk-match-btn");
    var bulkSearch = $("dsy-bulk-student-search");
    if (bulkClose) bulkClose.addEventListener("click", closeBulkMatchModal);
    if (bulkModal) {
      bulkModal.addEventListener("click", function (e) {
        if (e.target === e.currentTarget) closeBulkMatchModal();
      });
    }
    if (bulkMatchBtn) bulkMatchBtn.addEventListener("click", commitBulkMatch);
    if (bulkSearch) {
      bulkSearch.addEventListener("input", function (e) {
        renderBulkStudentList(e.target.value);
      });
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        closeMatchModal();
        closeBulkMatchModal();
        var cm = $("dsy-confirm-modal");
        if (cm && !cm.classList.contains("hidden")) {
          cm.classList.add("hidden"); cm.classList.remove("flex");
        }
      }
    });

    renderTable();
    wireStudioV4();
    refreshActiveTemplateChip();
  }

  // ================================================================
  // V4 — ŞABLON STÜDYOSU (Visual Form Mapper)
  // ----------------------------------------------------------------
  //  * Full-screen görsel haritalama: kullanıcı canvas üzerinde öğrenci
  //    no / ad / kitapçık / cevap kutuları çizer.
  //  * .FMT (klasik metin) ve JSON import/export
  //  * Kaydedilen şablon LocalStorage'da tutulur ve optikSablonlar.custom
  //    olarak motorla entegre edilir → V2 TXT parser ve V3 kamera simülatörü
  //    otomatik olarak bu koordinatları kullanır.
  // ================================================================

  var STORAGE_TEMPLATES = "derecepanel_optik_templates_v1";
  var STORAGE_ACTIVE_TPL = "derecepanel_active_template_v1";
  var STUDIO_REF_WIDTH = 900;   // canvas baz genişliği (px)
  var STUDIO_REF_HEIGHT = 1273; // A4 oranı
  var STUDIO_FORM_CHAR_WIDTH = 80; // bir optik satırı ~80 char (pragmatik dönüşüm)

  var studio = {
    tool: "no",          // no | name | book | answers | subject | select
    fields: [],          // { id, kind, x, y, w, h, label }
    selectedId: null,
    bgDataUrl: null,
    popover: null,
    drawing: null,
    dragging: null,      // { id, startX, startY, ox, oy }
    resizing: null,      // { id, handle, startX, startY, base }
  };

  function studioLoadSaved() {
    try { return JSON.parse(localStorage.getItem(STORAGE_TEMPLATES) || "[]") || []; }
    catch (e) { return []; }
  }
  function studioPersistSaved(list) {
    try { localStorage.setItem(STORAGE_TEMPLATES, JSON.stringify(list)); } catch (e) {}
  }
  function studioLoadActive() {
    try { return JSON.parse(localStorage.getItem(STORAGE_ACTIVE_TPL) || "null"); }
    catch (e) { return null; }
  }
  function studioPersistActive(obj) {
    try {
      if (obj) localStorage.setItem(STORAGE_ACTIVE_TPL, JSON.stringify(obj));
      else localStorage.removeItem(STORAGE_ACTIVE_TPL);
    } catch (e) {}
  }

  // Piksel koordinatlarından motor uyumlu { no, name, book, answers, ...} şablonu üret
  function studioToParserTemplate(template) {
    var refW = template.refW || STUDIO_REF_WIDTH;
    var charW = STUDIO_FORM_CHAR_WIDTH;
    var pxToChar = function (px) { return Math.max(0, Math.round((px / refW) * charW)); };

    // Her tür için ilk kutuyu al; cevaplar için birden fazla kutunun toplam karakter genişliğini topla
    var pick = function (kind) {
      return (template.fields || []).filter(function (f) { return f.kind === kind; });
    };
    var fNo   = pick("no")[0];
    var fName = pick("name")[0];
    var fBook = pick("book")[0];
    var fAns  = pick("answers");

    var no   = fNo   ? [pxToChar(fNo.x),   pxToChar(fNo.x + fNo.w)]     : [0, 10];
    var name = fName ? [pxToChar(fName.x), pxToChar(fName.x + fName.w)] : [10, 30];
    var book = fBook ? [pxToChar(fBook.x), pxToChar(fBook.x + fBook.w)] : [30, 31];

    var ansStart, ansEnd;
    if (fAns.length) {
      ansStart = pxToChar(Math.min.apply(null, fAns.map(function (f) { return f.x; })));
      ansEnd   = pxToChar(Math.max.apply(null, fAns.map(function (f) { return f.x + f.w; })));
    } else {
      ansStart = book[1]; ansEnd = null;
    }

    // Monotonic düzelt
    if (name[0] < no[1]) name[0] = no[1];
    if (name[1] <= name[0]) name[1] = name[0] + 20;
    if (book[0] < name[1]) book[0] = name[1];
    if (book[1] <= book[0]) book[1] = book[0] + 1;
    if (ansStart < book[1]) ansStart = book[1];
    if (ansStart < 31 && !fAns.length) ansStart = 31;

    var expected = template.expectedAnswers ||
      Math.max(0, (ansEnd != null ? (ansEnd - ansStart) : 120));

    return buildParserTemplate({
      label: template.name || "Özel Şablon",
      no: no,
      nameRange: name,
      book: book,
      answers: [ansStart, ansEnd],
      minLine: Math.max(ansStart, book[1]) + 1,
      expectedAnswers: expected,
    });
  }

  function activateCustomTemplate(template) {
    if (!template) return;
    var parserTpl = studioToParserTemplate(template);
    if (!parserTpl) {
      toast("Şablon alanları tanımlanamadı — FMT koordinatlarını kontrol edin", "error");
      return;
    }
    optikSablonlar.custom = parserTpl;
    state.template = "custom";

    // Dropdown'a 'Özel (Stüdyo)' seçeneğini yerleştir/güncelle
    var sel = $("dsy-template");
    if (sel) {
      var opt = sel.querySelector('option[value="custom"]');
      if (!opt) {
        opt = document.createElement("option");
        opt.value = "custom";
        sel.appendChild(opt);
      }
      opt.textContent = "★ " + (template.name || "Özel Şablon") + " (Stüdyo)";
      sel.value = "custom";
    }
    var parserLbl = $("dsy-parser-label");
    if (parserLbl) parserLbl.textContent = parserTpl.label;

    studioPersistActive(template);
    refreshActiveTemplateChip();
  }

  // ============================================================
  // Hedef Deneme Seçici (Kurumsal)
  // ============================================================
  // Tek Hakikat Kaynağı: `localStorage.exams`. Hiçbir mock yok.
  // Boş ise dropdown disable edilir ve kullanıcı uyarılır.
  // Güvenli JSON oku
  function readJsonArray(key) {
    try {
      var raw = localStorage.getItem(key);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }

  // Takvim modüllerinden gelen sınavları topla
  //   · Kurumsal: kurum_denemeler_v1 (kurum-deneme-takvimi)
  //   · Global:   global_denemeler_v1  (global-deneme-takvimi — varsa)
  //   · Genel "exams": legacy/tek havuz; type alanına göre ayrıştırılır
  function loadExamsBuckets() {
    var kurumsal = readJsonArray("kurum_denemeler_v1");
    var global = readJsonArray("global_denemeler_v1");
    var legacy = readJsonArray(STORAGE_EXAMS); // "exams"

    legacy.forEach(function (ex) {
      if (!ex || !ex.id) return;
      var t = String(ex.type || ex.scope || ex.kategori || "").toLowerCase();
      var isGlobal = t.indexOf("global") !== -1;
      (isGlobal ? global : kurumsal).push(ex);
    });

    // ID'ye göre tekilleştir
    var dedup = function (list) {
      var seen = {};
      return list.filter(function (x) {
        if (!x || !x.id) return false;
        if (seen[x.id]) return false;
        seen[x.id] = 1; return true;
      });
    };
    return { kurumsal: dedup(kurumsal), global: dedup(global) };
  }

  // Geriye dönük uyumluluk: bazı yerler loadExams() çağırıyor
  function loadExams() {
    var b = loadExamsBuckets();
    return b.kurumsal.concat(b.global);
  }

  function formatExamDate(d) {
    if (!d) return "";
    try {
      var dt = new Date(d);
      if (isNaN(dt.getTime())) return String(d);
      var dd = String(dt.getDate()).padStart(2, "0");
      var mm = String(dt.getMonth() + 1).padStart(2, "0");
      return dd + "." + mm + "." + dt.getFullYear();
    } catch (e) { return String(d); }
  }

  function populateExams() {
    var sel = $("examSelect");
    if (!sel) return;
    var prev = sel.value || state.examId || "";
    sel.innerHTML = "";
    var ph = document.createElement("option");
    ph.value = ""; ph.disabled = true; ph.selected = true;

    var buckets = loadExamsBuckets();
    var total = buckets.kurumsal.length + buckets.global.length;

    if (!total) {
      ph.textContent = "Sistemde kayıtlı deneme bulunamadı";
      sel.appendChild(ph);
      sel.disabled = true;
      state.examId = "";
      return;
    }
    sel.disabled = false;
    ph.textContent = "— Sonuçların ekleneceği denemeyi seçin —";
    sel.appendChild(ph);

    var makeOption = function (ex) {
      var o = document.createElement("option");
      o.value = ex.id;
      var name = ex.name || ex.title || ex.ad || ex.id;
      var date = ex.date || ex.examDate || ex.tarih || ex.scheduledAt || "";
      var dateStr = formatExamDate(date);
      o.textContent = dateStr ? (name + " (" + dateStr + ")") : name;
      if (ex.type) o.dataset.short = String(ex.type).toUpperCase();
      return o;
    };

    // Kurumsal Denemeler (en üstte)
    if (buckets.kurumsal.length) {
      var g1 = document.createElement("optgroup");
      g1.label = "Kurumsal Denemeler";
      buckets.kurumsal.forEach(function (ex) { g1.appendChild(makeOption(ex)); });
      sel.appendChild(g1);
    }
    // Global Denemeler
    if (buckets.global.length) {
      var g2 = document.createElement("optgroup");
      g2.label = "Global Denemeler";
      buckets.global.forEach(function (ex) { g2.appendChild(makeOption(ex)); });
      sel.appendChild(g2);
    }

    // Önceki seçimi koru
    if (prev && Array.prototype.some.call(sel.options, function (o) { return o.value === prev; })) {
      sel.value = prev;
      state.examId = prev;
      ph.selected = false;
    } else {
      state.examId = "";
    }
  }

  function getSelectedExam() {
    if (!state.examId) return null;
    var exams = loadExams();
    for (var i = 0; i < exams.length; i++) {
      if (exams[i] && exams[i].id === state.examId) return exams[i];
    }
    return null;
  }

  // ============================================================
  // Merkezi FmtStore Köprüsü (Tek Hakikat Kaynağı)
  // ============================================================
  // `optikSablonlar`'daki yerleşik (TYT/AYT/LGS…) anahtarları "dahili"
  // olarak gösterir; FmtStore'daki (IndexedDB) tüm kayıtları "fmt:<id>"
  // önekiyle aynı dropdown'a basar. Değişince canlı tazelenir.
  function populateTemplateSelect() {
    var sel = $("dsy-template");
    if (!sel) return;
    var current = sel.value || state.template || "";
    sel.innerHTML = "";

    var opt0 = document.createElement("option");
    opt0.value = ""; opt0.textContent = "— Şablon seçin —";
    opt0.disabled = true;
    if (!current) opt0.selected = true;
    sel.appendChild(opt0);

    // Aktif "Özel (Stüdyo)" — çizilmiş özel şablon varsa
    if (optikSablonlar.custom) {
      var customOpt = document.createElement("option");
      customOpt.value = "custom";
      customOpt.textContent = "★ " + (optikSablonlar.custom.label || "Özel Şablon") + " (Stüdyo)";
      sel.appendChild(customOpt);
    }

    // Merkezi FMT kasasından (IndexedDB / LocalStorage) tüm kayıtlar
    if (window.FmtStore && typeof window.FmtStore.listAll === "function") {
      window.FmtStore.listAll().then(function (list) {
        if (Array.isArray(list) && list.length) {
          var group = document.createElement("optgroup");
          group.label = "FMT Kasası";
          list.forEach(function (f) {
            var o = document.createElement("option");
            o.value = "fmt:" + f.id;
            o.textContent = f.label || f.id;
            group.appendChild(o);
          });
          sel.appendChild(group);
        }
        if (current) sel.value = current;
      }).catch(function () { /* sessiz */ });
    } else if (current) {
      sel.value = current;
    }

    var pLbl = $("dsy-parser-label");
    if (pLbl) {
      if (current && current.indexOf("fmt:") === 0) pLbl.textContent = "FmtStore · " + current.slice(4);
      else if (current && optikSablonlar[current]) pLbl.textContent = optikSablonlar[current].label || current;
      else pLbl.textContent = "— Şablon seçilmedi —";
    }
  }

  // FmtStore kaydını motorun parser şablonuna çevir
  function fmtStoreToParser(f) {
    if (!f) return null;
    var tpl = buildParserTemplate(f);
    if (tpl && !tpl.expectedAnswers) tpl.expectedAnswers = f.expectedAnswers || 120;
    return tpl;
  }

  function loadFmtAsActive(id) {
    if (!window.FmtStore) return;
    window.FmtStore.get(id).then(function (f) {
      if (!f) { toast("FMT bulunamadı", "error"); return; }
      var p = fmtStoreToParser(f);
      if (!p) { toast("FMT alan tanımları okunamadı", "error"); return; }
      optikSablonlar.custom = p;
      state.template = "custom";
      var sel = $("dsy-template");
      var opt = sel && sel.querySelector('option[value="custom"]');
      if (!opt && sel) {
        opt = document.createElement("option"); opt.value = "custom"; sel.appendChild(opt);
      }
      if (opt) opt.textContent = "★ " + p.label + " (FMT Kasası)";
      if (sel) sel.value = "custom";
      var pLbl = $("dsy-parser-label"); if (pLbl) pLbl.textContent = p.label;
      refreshActiveTemplateChip();
      toast('"' + p.label + '" aktif şablon olarak yüklendi');
    }).catch(function () { toast("FMT yüklenemedi", "error"); });
  }

  function parserFieldsToFmtRanges(parser) {
    var rec = { minLine: parser.minLine, expectedAnswers: parser.expectedAnswers };
    (parser.fields || []).forEach(function (f) {
      var range = [f.start, f.length == null ? null : f.start + f.length];
      if (f.kind === "no") rec.no = range;
      else if (f.kind === "name") rec.nameRange = range;
      else if (f.kind === "book") rec.book = range;
      else if (f.kind === "answers") rec.answers = range;
    });
    return rec;
  }

  // Studio kaydı → FmtStore'a köprü (Tek Hakikat Kaynağı)
  function persistStudioToFmtStore(tpl) {
    if (!window.FmtStore || !tpl) return;
    var parser = studioToParserTemplate(tpl);
    if (!parser) return;
    var ranges = parserFieldsToFmtRanges(parser);
    var rec = Object.assign({
      id: "studio-" + (tpl.id || (Date.now() + "-" + Math.random().toString(36).slice(2, 6))),
      label: tpl.name || parser.label || "Stüdyo Şablonu",
      vendor: "Stüdyo",
      builtin: false,
      fields: parser.fields,
      createdAt: Date.now(),
    }, ranges);
    try { window.FmtStore.put(rec); } catch (e) {}
  }

  function refreshActiveTemplateChip() {
    var nm = $("dsy-active-template-name");
    if (!nm) return;
    if (!state.template) { nm.textContent = "— seçilmedi —"; return; }
    var cur = optikSablonlar[state.template] || {};
    nm.textContent = cur.label || state.template || "— seçilmedi —";
  }

  // ---------- UI: Katmanlar / Kayıtlı liste ----------
  function studioRenderLayers() {
    var wrap = $("dsy-studio-layers");
    var cnt  = $("dsy-studio-count");
    if (!wrap) return;
    cnt.textContent = String(studio.fields.length);
    if (!studio.fields.length) {
      wrap.innerHTML = '<div class="dsy-studio__empty">Henüz alan çizilmedi.</div>';
      return;
    }
    var colorMap = { no:"#6366f1", name:"#059669", book:"#d97706", answers:"#7c3aed", subject:"#db2777" };
    var labelMap = { no:"Öğrenci No", name:"Ad Soyad", book:"Kitapçık", answers:"Cevaplar", subject:"Ders" };
    wrap.innerHTML = studio.fields.map(function (f) {
      return '<div class="dsy-studio__layer' + (f.id === studio.selectedId ? " is-selected" : "") + '" data-lid="' + f.id + '">' +
        '<span class="dot" style="background:' + (colorMap[f.kind] || "#6366f1") + '"></span>' +
        '<span class="dsy-studio__layer__meta">' +
          '<span class="dsy-studio__layer__name">' + escapeHtml(f.label || labelMap[f.kind] || f.kind) + '</span>' +
          '<span class="dsy-studio__layer__dim">' + Math.round(f.x) + ',' + Math.round(f.y) + ' · ' + Math.round(f.w) + '×' + Math.round(f.h) + '</span>' +
        '</span>' +
        '<button class="dsy-studio__layer__del" data-del="' + f.id + '" title="Sil">' +
          '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>' +
        '</button>' +
      '</div>';
    }).join("");
  }

  function studioRenderSaved() {
    var wrap = $("dsy-studio-saved");
    if (!wrap) return;
    var list = studioLoadSaved();
    var active = studioLoadActive();
    if (!list.length) {
      wrap.innerHTML = '<div class="dsy-studio__empty">Kayıtlı özel şablon yok.</div>';
      return;
    }
    wrap.innerHTML = list.map(function (t) {
      var isActive = active && active.id === t.id;
      return '<div class="dsy-studio__saved-item' + (isActive ? " is-active" : "") + '">' +
        '<span class="dsy-studio__saved-name" title="' + escapeHtml(t.name) + '">' + escapeHtml(t.name) + '</span>' +
        '<button class="dsy-studio__mini-btn" data-tpl-load="' + t.id + '">Yükle</button>' +
        '<button class="dsy-studio__mini-btn dsy-studio__mini-btn--accent" data-tpl-activate="' + t.id + '">' + (isActive ? "Aktif" : "Aktif Yap") + '</button>' +
      '</div>';
    }).join("");
  }

  // ---------- Alan render ----------
  function studioRenderFields() {
    var canvas = $("dsy-studio-canvas");
    if (!canvas) return;
    // Mevcut field DOM'larını temizle
    Array.prototype.slice.call(canvas.querySelectorAll(".dsy-studio__field")).forEach(function (el) {
      el.parentNode.removeChild(el);
    });
    var labelMap = { no:"Öğrenci No", name:"Ad Soyad", book:"Kitapçık", answers:"Cevaplar", subject:"Ders" };
    studio.fields.forEach(function (f) {
      var el = document.createElement("div");
      el.className = "dsy-studio__field" + (f.id === studio.selectedId ? " is-selected" : "");
      el.dataset.kind = f.kind;
      el.dataset.fid = f.id;
      el.style.left = f.x + "px";
      el.style.top = f.y + "px";
      el.style.width = f.w + "px";
      el.style.height = f.h + "px";

      var lbl = document.createElement("span");
      lbl.className = "dsy-studio__field__label";
      lbl.textContent = f.label || labelMap[f.kind] || f.kind;
      el.appendChild(lbl);

      if (f.id === studio.selectedId) {
        ["nw","n","ne","e","se","s","sw","w"].forEach(function (h) {
          var hd = document.createElement("span");
          hd.className = "dsy-studio__handle";
          hd.dataset.h = h;
          el.appendChild(hd);
        });
      }
      canvas.appendChild(el);
    });
  }

  function studioRenderAll() {
    studioRenderFields();
    studioRenderLayers();
  }

  function studioSelect(id) {
    studio.selectedId = id || null;
    studioRenderAll();
  }

  // ---------- Popover (rename + özellikler) ----------
  function studioClosePopover() {
    if (studio.popover && studio.popover.parentNode) studio.popover.parentNode.removeChild(studio.popover);
    studio.popover = null;
  }
  function studioOpenPopover(field) {
    studioClosePopover();
    var canvas = $("dsy-studio-canvas");
    if (!canvas) return;
    var pop = document.createElement("div");
    pop.className = "dsy-studio__popover";
    pop.innerHTML = '' +
      '<h5>Alan Özellikleri</h5>' +
      '<input type="text" id="sp-label" placeholder="Alan adı" value="' + escapeHtml(field.label || "") + '">' +
      '<div class="dsy-studio__popover-row">' +
        '<select id="sp-kind">' +
          '<option value="no">Öğrenci No</option>' +
          '<option value="name">Ad Soyad</option>' +
          '<option value="book">Kitapçık</option>' +
          '<option value="answers">Cevaplar</option>' +
          '<option value="subject">Ders</option>' +
        '</select>' +
        '<input type="number" id="sp-count" placeholder="Soru sayısı" value="' + (field.count || "") + '" min="0">' +
      '</div>' +
      '<div class="dsy-studio__popover-foot">' +
        '<button class="dsy-studio__btn dsy-studio__btn--danger" id="sp-delete">Sil</button>' +
        '<div class="flex gap-2">' +
          '<button class="dsy-studio__btn" id="sp-cancel">Vazgeç</button>' +
          '<button class="dsy-studio__btn dsy-studio__btn--primary" id="sp-ok">Uygula</button>' +
        '</div>' +
      '</div>';

    // Konum: field'ın sağ üstüne
    var left = Math.min(field.x + field.w + 10, STUDIO_REF_WIDTH - 280);
    var top  = Math.max(0, field.y - 10);
    pop.style.left = left + "px";
    pop.style.top = top + "px";
    canvas.appendChild(pop);
    studio.popover = pop;

    pop.querySelector("#sp-kind").value = field.kind;

    pop.querySelector("#sp-cancel").addEventListener("click", studioClosePopover);
    pop.querySelector("#sp-delete").addEventListener("click", function () {
      studioDeleteField(field.id);
      studioClosePopover();
    });
    pop.querySelector("#sp-ok").addEventListener("click", function () {
      field.label = pop.querySelector("#sp-label").value.trim() || field.label;
      field.kind = pop.querySelector("#sp-kind").value;
      var cnt = parseInt(pop.querySelector("#sp-count").value, 10);
      if (!isNaN(cnt) && cnt > 0) field.count = cnt;
      studioClosePopover();
      studioRenderAll();
    });
    // ESC / outside
    setTimeout(function () {
      pop.querySelector("#sp-label").focus();
      pop.querySelector("#sp-label").select();
    }, 20);
  }

  function studioDeleteField(id) {
    studio.fields = studio.fields.filter(function (f) { return f.id !== id; });
    if (studio.selectedId === id) studio.selectedId = null;
    studioRenderAll();
  }

  // ---------- Mouse etkileşimi ----------
  function studioBindCanvas() {
    var wrap = $("dsy-studio-canvas-wrap");
    var canvas = $("dsy-studio-canvas");
    if (!canvas || !wrap) return;

    function relPoint(e) {
      var rect = canvas.getBoundingClientRect();
      return { x: (e.clientX - rect.left), y: (e.clientY - rect.top) };
    }

    canvas.addEventListener("mousedown", function (e) {
      // Handle?
      var handle = e.target.closest && e.target.closest(".dsy-studio__handle");
      if (handle) {
        var fieldEl = handle.parentNode;
        var fid = fieldEl.dataset.fid;
        var f = studio.fields.find(function (x) { return x.id === fid; });
        if (!f) return;
        studio.resizing = {
          id: fid, handle: handle.dataset.h,
          startX: e.clientX, startY: e.clientY,
          base: { x: f.x, y: f.y, w: f.w, h: f.h },
        };
        e.preventDefault(); e.stopPropagation();
        return;
      }

      var fieldEl2 = e.target.closest && e.target.closest(".dsy-studio__field");
      if (fieldEl2) {
        var fid2 = fieldEl2.dataset.fid;
        studioSelect(fid2);
        if (studio.tool === "select" || !studio.tool) {
          var f2 = studio.fields.find(function (x) { return x.id === fid2; });
          if (!f2) return;
          var p = relPoint(e);
          studio.dragging = { id: fid2, startX: p.x, startY: p.y, ox: f2.x, oy: f2.y };
        }
        e.preventDefault(); e.stopPropagation();
        return;
      }

      // Boş canvas'a tıklandı → yeni kutu çizimi (tool 'select' değilse)
      if (studio.tool && studio.tool !== "select") {
        studioClosePopover();
        studioSelect(null);
        var p2 = relPoint(e);
        studio.drawing = { x: p2.x, y: p2.y, w: 0, h: 0, kind: studio.tool };
        wrap.classList.add("is-drawing");
      } else {
        studioSelect(null);
        studioClosePopover();
      }
    });

    document.addEventListener("mousemove", function (e) {
      if (studio.drawing) {
        var p = relPoint(e);
        studio.drawing.w = p.x - studio.drawing.x;
        studio.drawing.h = p.y - studio.drawing.y;
        studioDrawGhost();
        return;
      }
      if (studio.dragging) {
        var p2 = relPoint(e);
        var f = studio.fields.find(function (x) { return x.id === studio.dragging.id; });
        if (!f) return;
        f.x = Math.max(0, studio.dragging.ox + (p2.x - studio.dragging.startX));
        f.y = Math.max(0, studio.dragging.oy + (p2.y - studio.dragging.startY));
        studioRenderFields();
        return;
      }
      if (studio.resizing) {
        var r = studio.resizing;
        var dx = e.clientX - r.startX, dy = e.clientY - r.startY;
        var f3 = studio.fields.find(function (x) { return x.id === r.id; });
        if (!f3) return;
        var b = r.base;
        var nx = b.x, ny = b.y, nw = b.w, nh = b.h;
        var h = r.handle;
        if (h.indexOf("e") > -1) nw = Math.max(6, b.w + dx);
        if (h.indexOf("s") > -1) nh = Math.max(6, b.h + dy);
        if (h.indexOf("w") > -1) { nx = b.x + dx; nw = Math.max(6, b.w - dx); }
        if (h.indexOf("n") > -1) { ny = b.y + dy; nh = Math.max(6, b.h - dy); }
        f3.x = Math.max(0, nx); f3.y = Math.max(0, ny); f3.w = nw; f3.h = nh;
        studioRenderFields();
      }
    });

    document.addEventListener("mouseup", function (e) {
      if (studio.drawing) {
        var d = studio.drawing;
        var x = Math.min(d.x, d.x + d.w), y = Math.min(d.y, d.y + d.h);
        var w = Math.abs(d.w), h = Math.abs(d.h);
        studio.drawing = null;
        wrap.classList.remove("is-drawing");
        studioRemoveGhost();
        if (w >= 8 && h >= 8) {
          var labelMap = { no:"Öğrenci No", name:"Ad Soyad", book:"Kitapçık", answers:"Cevaplar", subject:"Ders" };
          var f = {
            id: "fld-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
            kind: d.kind, x: x, y: y, w: w, h: h,
            label: labelMap[d.kind] || d.kind,
          };
          studio.fields.push(f);
          studio.selectedId = f.id;
          studioRenderAll();
          studioOpenPopover(f);
        }
      }
      studio.dragging = null;
      studio.resizing = null;
    });

    // Double click → popover
    canvas.addEventListener("dblclick", function (e) {
      var fieldEl = e.target.closest && e.target.closest(".dsy-studio__field");
      if (!fieldEl) return;
      var fid = fieldEl.dataset.fid;
      var f = studio.fields.find(function (x) { return x.id === fid; });
      if (f) studioOpenPopover(f);
    });

    // Delete key
    document.addEventListener("keydown", function (e) {
      if ($("dsy-studio") && $("dsy-studio").hidden) return;
      if (e.key === "Escape") {
        if (studio.popover) { studioClosePopover(); return; }
        studioClose();
      }
      if ((e.key === "Delete" || e.key === "Backspace") && studio.selectedId) {
        var active = document.activeElement;
        if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.tagName === "SELECT")) return;
        studioDeleteField(studio.selectedId);
        e.preventDefault();
      }
    });
  }

  function studioDrawGhost() {
    var canvas = $("dsy-studio-canvas");
    if (!canvas) return;
    var g = canvas.querySelector(".dsy-studio__field.is-ghost");
    if (!g) {
      g = document.createElement("div");
      g.className = "dsy-studio__field is-ghost";
      g.dataset.kind = studio.drawing.kind;
      g.style.pointerEvents = "none";
      g.style.opacity = "0.9";
      canvas.appendChild(g);
    }
    var d = studio.drawing;
    var x = Math.min(d.x, d.x + d.w), y = Math.min(d.y, d.y + d.h);
    g.style.left = x + "px";
    g.style.top = y + "px";
    g.style.width = Math.abs(d.w) + "px";
    g.style.height = Math.abs(d.h) + "px";
  }
  function studioRemoveGhost() {
    var canvas = $("dsy-studio-canvas");
    if (!canvas) return;
    var g = canvas.querySelector(".dsy-studio__field.is-ghost");
    if (g && g.parentNode) g.parentNode.removeChild(g);
  }

  // ---------- Arka plan & FMT ----------
  function studioSetBg(dataUrl) {
    studio.bgDataUrl = dataUrl || null;
    var img = $("dsy-studio-bg-img");
    var canvas = $("dsy-studio-canvas");
    var clearBtn = $("dsy-studio-clear-bg");
    if (!img || !canvas) return;
    if (dataUrl) {
      img.src = dataUrl;
      img.style.display = "block";
      canvas.classList.add("has-bg");
      if (clearBtn) clearBtn.style.display = "inline-flex";
    } else {
      img.removeAttribute("src");
      img.style.display = "none";
      canvas.classList.remove("has-bg");
      if (clearBtn) clearBtn.style.display = "none";
    }
  }

  // Basit ama dayanıklı .fmt parseri:
  //  - Önce JSON olarak deneriz (bizim dışa aktardığımız format).
  //  - Değilse her satırı "KIND NAME X Y W H" veya "NAME: X, Y, W, H" formatında okuruz.
  function studioParseFmt(text) {
    text = (text || "").trim();
    // 1) JSON
    try {
      var obj = JSON.parse(text);
      if (obj && Array.isArray(obj.fields)) {
        return {
          name: obj.name || "İçe aktarılan şablon",
          refW: obj.refW || STUDIO_REF_WIDTH,
          refH: obj.refH || STUDIO_REF_HEIGHT,
          expectedAnswers: obj.expectedAnswers || 0,
          fields: obj.fields.map(function (f) {
            return {
              id: f.id || ("fld-" + Math.random().toString(36).slice(2, 8)),
              kind: f.kind || "answers",
              label: f.label || f.kind || "Alan",
              x: +f.x || 0, y: +f.y || 0, w: +f.w || 40, h: +f.h || 20,
              count: f.count || undefined,
            };
          }),
        };
      }
    } catch (e) { /* JSON değil */ }

    // 2) Klasik FMT: her satır "kind label x y w h" (whitespace veya , ayrılmış)
    var fields = [];
    var lines = text.split(/\r?\n/);
    var kindAliases = {
      no: "no", number: "no", ogrenci: "no", student: "no",
      name: "name", ad: "name", isim: "name",
      book: "book", kitapcik: "book", form: "book",
      answers: "answers", cevap: "answers", ans: "answers",
      subject: "subject", ders: "subject",
    };
    lines.forEach(function (raw) {
      var line = raw.trim();
      if (!line || line.charAt(0) === "#") return;
      var parts = line.split(/[\s,;]+/).filter(Boolean);
      if (parts.length < 5) return;
      var kindKey = (parts[0] || "").toLowerCase();
      var kind = kindAliases[kindKey] || "answers";
      // Son 4 sayısal değer = x y w h
      var nums = parts.slice(-4).map(Number);
      if (nums.some(function (n) { return isNaN(n); })) return;
      var label = parts.slice(1, parts.length - 4).join(" ") || kind;
      fields.push({
        id: "fld-" + Math.random().toString(36).slice(2, 8),
        kind: kind, label: label,
        x: nums[0], y: nums[1], w: nums[2], h: nums[3],
      });
    });
    if (fields.length) {
      return { name: "İçe aktarılan .fmt", refW: STUDIO_REF_WIDTH, refH: STUDIO_REF_HEIGHT, fields: fields };
    }

    // 3) INI/Section tarzı .fmt (endüstri standardı):
    //    [CONFIG] / [STRUCTURE] + FORMAT_NAME=..., FIELD=x,y,w,h ve türevleri
    //    Gevşek anahtar eşleştirme (no/student_id/ad/kitapcik/cevap/ders) yapar.
    var lowered = text.toLowerCase();
    var hasKeyword =
      lowered.indexOf("[structure]") !== -1 ||
      lowered.indexOf("[config]") !== -1 ||
      lowered.indexOf("format_name") !== -1 ||
      lowered.indexOf("student_id") !== -1 ||
      lowered.indexOf("student") !== -1 ||
      lowered.indexOf("answer") !== -1 ||
      lowered.indexOf("cevap") !== -1;

    var iniName = null;
    var iniFields = [];
    var fieldKeyRx = {
      no:     /(?:^|_)(student[_-]?id|number|no|ogrenci)(?:$|_)/i,
      name:   /(?:^|_)(ad|isim|name|student[_-]?name)(?:$|_)/i,
      book:   /(?:^|_)(book|kitapcik|form)(?:$|_)/i,
      answers:/(?:^|_)(answer|answers|cevap|ans)(?:$|_)/i,
      subject:/(?:^|_)(subject|ders|test)(?:$|_)/i,
    };
    var resolveKind = function (key) {
      for (var k in fieldKeyRx) { if (fieldKeyRx[k].test(key)) return k; }
      return null;
    };

    lines.forEach(function (raw) {
      var line = (raw || "").trim();
      if (!line || line.charAt(0) === "#" || line.charAt(0) === ";") return;
      if (line.charAt(0) === "[") return; // section başlığı

      // key = value   ya da   key : value
      var m = line.match(/^([A-Za-z0-9_\-\.]+)\s*[:=]\s*(.+)$/);
      if (!m) return;
      var key = m[1];
      var val = m[2].trim();

      if (/format[_-]?name/i.test(key)) { iniName = val.replace(/^["']|["']$/g, ""); return; }

      // Değer içindeki sayıları yakala (virgül/boşluk/noktalı virgül)
      var nums = val.split(/[\s,;]+/).map(function (s) { return Number(s); }).filter(function (n) { return !isNaN(n); });
      if (nums.length < 4) return;

      var kind = resolveKind(key) || "answers";
      iniFields.push({
        id: "fld-" + Math.random().toString(36).slice(2, 8),
        kind: kind,
        label: key,
        x: nums[0], y: nums[1], w: nums[2], h: nums[3],
      });
    });

    if (iniFields.length) {
      return {
        name: iniName || "İçe aktarılan .fmt",
        refW: STUDIO_REF_WIDTH,
        refH: STUDIO_REF_HEIGHT,
        fields: iniFields,
      };
    }

    // 4) Dosya anahtar kelime içeriyor ama koordinat yakalayamadık →
    //    boş bir şablon üretmek yerine null dönelim ki üst katman uyarsın.
    //    (Ama FORMAT_NAME tek başına varsa onu yakalayıp boş iskelet döndür.)
    if (hasKeyword) {
      var nm = (text.match(/format[_-]?name\s*[:=]\s*["']?([^"'\r\n]+)["']?/i) || [])[1];
      if (nm) {
        return {
          name: nm.trim(),
          refW: STUDIO_REF_WIDTH,
          refH: STUDIO_REF_HEIGHT,
          fields: [], // alan yok; kullanıcı Stüdyo'da çizer
        };
      }
    }
    return null;
  }

  function studioExportJson() {
    var payload = {
      name: ($("dsy-studio-name").value || "").trim() || "Özel Şablon",
      refW: STUDIO_REF_WIDTH,
      refH: STUDIO_REF_HEIGHT,
      expectedAnswers: 0,
      fields: studio.fields.map(function (f) { return {
        id: f.id, kind: f.kind, label: f.label,
        x: +f.x.toFixed(2), y: +f.y.toFixed(2),
        w: +f.w.toFixed(2), h: +f.h.toFixed(2),
        count: f.count || undefined,
      }; }),
      createdAt: new Date().toISOString(),
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = payload.name.replace(/\s+/g, "_") + ".fmt.json";
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 100);
  }

  function studioImportFmtFromText(text, srcName) {
    var parsed = studioParseFmt(text);
    if (!parsed) {
      toast("FMT formatı tanınamadı", "error");
      return false;
    }
    studio.fields = parsed.fields;
    studio.selectedId = null;
    var nameInp = $("dsy-studio-name");
    // Dosyadan okunan şablon adını her zaman input'a yaz (boş dahi olsa üzerine yaz)
    if (nameInp) nameInp.value = parsed.name || srcName || "İçe aktarılan şablon";
    studioRenderAll();
    return true;
  }

  // ---------- Aç/Kapa ----------
  function studioOpen() {
    var el = $("dsy-studio");
    if (!el) return;
    el.hidden = false;
    document.body.style.overflow = "hidden";
    // İlk açılışta aktif şablonu yükle
    var active = studioLoadActive();
    if (active && !studio.fields.length) {
      studio.fields = (active.fields || []).slice();
      if (active.bgDataUrl) studioSetBg(active.bgDataUrl);
      var nameInp = $("dsy-studio-name");
      if (nameInp) nameInp.value = active.name || "";
    }
    studioRenderAll();
    studioRenderSaved();
  }
  function studioClose() {
    var el = $("dsy-studio");
    if (!el) return;
    el.hidden = true;
    document.body.style.overflow = "";
    studioClosePopover();
    // Altta kalan ana sayfanın dropdown'ı yeni şablonları görsün
    try { populateTemplateSelect(); } catch (e) {}
  }

  // ---------- Save / Activate ----------
  function studioSaveCurrent(opts) {
    var silent = !!(opts && opts.silent);
    var name = ($("dsy-studio-name").value || "").trim();
    if (!name) { toast("Şablon adı girin", "error"); $("dsy-studio-name").focus(); return; }
    if (!studio.fields.length) { toast("En az bir alan çizmelisiniz", "error"); return; }
    var tpl = {
      id: "tpl-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      name: name,
      refW: STUDIO_REF_WIDTH,
      refH: STUDIO_REF_HEIGHT,
      bgDataUrl: studio.bgDataUrl || null,
      expectedAnswers: 0,
      fields: studio.fields.slice(),
      createdAt: new Date().toISOString(),
    };
    var list = studioLoadSaved();
    // Aynı isim varsa güncelle
    var idx = list.findIndex(function (x) { return x.name.toLowerCase() === name.toLowerCase(); });
    if (idx >= 0) { tpl.id = list[idx].id; list[idx] = tpl; }
    else list.push(tpl);
    studioPersistSaved(list);
    activateCustomTemplate(tpl);
    studioRenderSaved();
    // Merkezi FmtStore'a da yaz — her iki sayfada anında kullanılabilir
    persistStudioToFmtStore(tpl);
    populateTemplateSelect();
    if (!silent) toast('"' + name + '" kaydedildi ve aktifleştirildi', "success");
  }

  // ---------- Tools / Event wiring ----------
  function wireStudioV4() {
    var openBtn = $("dsy-btn-studio");
    if (!openBtn || openBtn.dataset.wired === "1") return;
    openBtn.dataset.wired = "1";

    openBtn.addEventListener("click", studioOpen);
    var closeBtn = $("dsy-studio-close");
    if (closeBtn) closeBtn.addEventListener("click", studioClose);

    // Tool buttons
    var tools = document.querySelectorAll("#dsy-studio-tools .dsy-studio__tool");
    Array.prototype.forEach.call(tools, function (btn) {
      btn.addEventListener("click", function () {
        Array.prototype.forEach.call(tools, function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        studio.tool = btn.dataset.tool;
      });
    });

    studioBindCanvas();

    // Layer click / delete
    var layersWrap = $("dsy-studio-layers");
    if (layersWrap) {
      layersWrap.addEventListener("click", function (e) {
        var del = e.target.closest && e.target.closest("[data-del]");
        if (del) { studioDeleteField(del.dataset.del); return; }
        var row = e.target.closest && e.target.closest("[data-lid]");
        if (row) studioSelect(row.dataset.lid);
      });
    }

    // Saved list actions
    var savedWrap = $("dsy-studio-saved");
    if (savedWrap) {
      savedWrap.addEventListener("click", function (e) {
        var load = e.target.closest && e.target.closest("[data-tpl-load]");
        var act  = e.target.closest && e.target.closest("[data-tpl-activate]");
        var list = studioLoadSaved();
        if (load) {
          var t = list.find(function (x) { return x.id === load.dataset.tplLoad; });
          if (!t) return;
          studio.fields = (t.fields || []).slice();
          studio.selectedId = null;
          studioSetBg(t.bgDataUrl || null);
          $("dsy-studio-name").value = t.name;
          studioRenderAll();
          toast('"' + t.name + '" yüklendi', "success");
        }
        if (act) {
          var t2 = list.find(function (x) { return x.id === act.dataset.tplActivate; });
          if (!t2) return;
          activateCustomTemplate(t2);
          studioRenderSaved();
          toast('"' + t2.name + '" aktif edildi', "success");
        }
      });
    }

    // Upload: FMT — Otonom Kayıt Akışı
    //   1) Dosya FileReader ile okunur (readAsText)
    //   2) studioParseFmt ile [CONFIG]/[STRUCTURE] ayrıştırılır
    //   3) Adı Şablon adı input'una yazılır
    //   4) studioSaveCurrent() otomatik çağrılır →
    //        · Studio 'Kayıtlı Şablonlar' listesine eklenir (render dahil)
    //        · Merkezi FmtStore'a (IndexedDB) yazılır
    //        · dsy-template dropdown'u tazelenir
    //        · fmt-store:change event'i → optik-okuyucu sayfası da anında yenilenir
    var fmtInp = $("dsy-studio-fmt");
    if (fmtInp) {
      fmtInp.addEventListener("change", function () {
        var file = fmtInp.files && fmtInp.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () {
          var txt = String(reader.result || "");
          var base = file.name.replace(/\.[^.]+$/, "");
          var ok = studioImportFmtFromText(txt, base);
          if (!ok) { fmtInp.value = ""; return; }

          // Otonom kayıt: kullanıcı "Şablonu Kaydet" tuşuna basmasına gerek yok
          try {
            studioSaveCurrent({ silent: true });
            toast("FMT Şablonu başarıyla yüklendi ve sisteme kaydedildi.", "success");
          } catch (e) {
            console.warn("[Studio] FMT otonom kayıt hatası:", e);
            toast("Şablon okundu ama kaydedilemedi", "error");
          }
        };
        reader.onerror = function () { toast("Dosya okunamadı", "error"); };
        reader.readAsText(file);
        fmtInp.value = "";
      });
    }

    // Upload: Background image
    var bgInp = $("dsy-studio-bg");
    if (bgInp) {
      bgInp.addEventListener("change", function () {
        var file = bgInp.files && bgInp.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () { studioSetBg(String(reader.result || "")); };
        reader.readAsDataURL(file);
        bgInp.value = "";
      });
    }
    var clearBg = $("dsy-studio-clear-bg");
    if (clearBg) clearBg.addEventListener("click", function () { studioSetBg(null); });

    // Save & Export
    var saveBtn = $("dsy-studio-save");
    if (saveBtn) saveBtn.addEventListener("click", studioSaveCurrent);
    var exportBtn = $("dsy-studio-export");
    if (exportBtn) exportBtn.addEventListener("click", studioExportJson);

    // Açılışta: aktif custom şablonu optikSablonlar'a enjekte et (ana sayfada da geçerli)
    var active = studioLoadActive();
    if (active && active.fields && active.fields.length) {
      optikSablonlar.custom = studioToParserTemplate(active);
      var sel = $("dsy-template");
      if (sel) {
        var opt = sel.querySelector('option[value="custom"]');
        if (!opt) {
          opt = document.createElement("option");
          opt.value = "custom";
          sel.appendChild(opt);
        }
        opt.textContent = "★ " + (active.name || "Özel Şablon") + " (Stüdyo)";
      }
    }
  }

  // ================================================================
  // FMT KÜTÜPHANESİ MODALI — Single Source of Truth: studioLoadSaved()
  //   · Dropzone + FileReader ile .fmt yükler
  //   · Studio'nun studioSaveCurrent() zincirine bağlanır (liste + FmtStore + dropdown)
  //   · Arama (real-time), Seç, Sil aksiyonları
  // ================================================================
  var fmtLibState = { query: "" };

  function openFmtLibrary() {
    var m = $("fmtLibraryModal");
    if (!m) return;
    m.style.display = "flex";
    m.removeAttribute("hidden");
    document.body.style.overflow = "hidden";
    var s = $("fmtLib-search");
    if (s) { s.value = ""; fmtLibState.query = ""; }
    renderFmtLibrary();
    setTimeout(function () { if (s) s.focus(); }, 50);
  }
  function closeFmtLibrary() {
    var m = $("fmtLibraryModal");
    if (!m) return;
    m.style.display = "none";
    m.setAttribute("hidden", "");
    document.body.style.overflow = "";
    // Kapanırken ana sayfa dropdown'ı tazelensin
    try { populateTemplateSelect(); } catch (e) {}
  }

  function renderFmtLibrary() {
    var list = $("fmtLib-list");
    var empty = $("fmtLib-empty");
    var countEl = $("fmtLib-count");
    if (!list) return;
    var all = studioLoadSaved();
    var q = (fmtLibState.query || "").toLowerCase().trim();
    var filtered = q
      ? all.filter(function (t) { return (t.name || "").toLowerCase().indexOf(q) !== -1; })
      : all.slice();

    // En yeni üstte
    filtered.sort(function (a, b) {
      return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
    });

    list.innerHTML = "";
    if (!filtered.length) {
      if (empty) empty.hidden = all.length === 0 ? false : true;
      if (!all.length && empty) {
        empty.hidden = false;
      } else if (empty) {
        empty.hidden = false;
        empty.querySelector("div.text-\\[13px\\]").textContent = q
          ? "Arama sonucu bulunamadı"
          : "Henüz kayıtlı şablon yok";
      }
    } else {
      if (empty) empty.hidden = true;
      filtered.forEach(function (tpl) {
        var qs = tpl.expectedAnswers || (tpl.fields || []).filter(function (f) { return f.kind === "answers"; }).length;
        var li = document.createElement("li");
        li.className = "group flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm transition hover:border-indigo-300 hover:shadow-md";
        li.innerHTML =
          '<div class="flex min-w-0 items-center gap-3">' +
            '<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">' +
              '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' +
            '</div>' +
            '<div class="min-w-0">' +
              '<div class="truncate text-[13px] font-bold text-slate-900">' + escapeHtml(tpl.name || "Şablon") + '</div>' +
              '<div class="text-[11px] font-medium text-slate-500">' +
                (qs ? (qs + ' soru alanı') : 'özel alanlar') +
                (tpl.createdAt ? ' · ' + new Date(tpl.createdAt).toLocaleDateString("tr-TR") : '') +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="flex shrink-0 items-center gap-1.5">' +
            '<button type="button" data-act="pick" data-id="' + escapeHtml(tpl.id) + '" class="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm transition hover:bg-indigo-700">Seç</button>' +
            '<button type="button" data-act="del" data-id="' + escapeHtml(tpl.id) + '" class="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2 py-1 text-[11px] font-bold text-red-600 transition hover:border-red-400 hover:bg-red-50" aria-label="Sil">' +
              '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>' +
            '</button>' +
          '</div>';
        list.appendChild(li);
      });
    }
    if (countEl) countEl.textContent = all.length + " şablon" + (q ? " · " + filtered.length + " eşleşme" : "");
  }

  function fmtLibPickById(id) {
    var all = studioLoadSaved();
    var tpl = all.find(function (x) { return x.id === id; });
    if (!tpl) return;
    // Mevcut aktivasyon kanalı: optikSablonlar.custom'a enjekte + dropdown'u "custom"a çek
    activateCustomTemplate(tpl);
    populateTemplateSelect();
    // Dropdown'da custom'u seç
    var sel = $("dsy-template");
    if (sel) {
      sel.value = "custom";
      sel.dispatchEvent(new Event("change", { bubbles: true }));
    }
    refreshActiveTemplateChip();
    toast('"' + (tpl.name || "Şablon") + '" aktif edildi', "success");
    closeFmtLibrary();
  }

  function fmtLibDeleteById(id) {
    var all = studioLoadSaved();
    var tpl = all.find(function (x) { return x.id === id; });
    if (!tpl) return;
    if (!window.confirm('"' + (tpl.name || "Şablon") + '" silinsin mi?')) return;
    var next = all.filter(function (x) { return x.id !== id; });
    studioPersistSaved(next);
    // Merkezi FmtStore'dan da sil (varsa)
    try {
      if (window.FmtStore && typeof window.FmtStore.remove === "function") {
        window.FmtStore.remove("studio:" + id);
      }
    } catch (e) {}
    // Aktif şablon silindiyse temizle
    var active = studioLoadActive();
    if (active && active.id === id) {
      studioPersistActive(null);
      delete optikSablonlar.custom;
      state.template = "";
    }
    renderFmtLibrary();
    try { studioRenderSaved(); } catch (e) {}
    populateTemplateSelect();
    refreshActiveTemplateChip();
    toast("Şablon silindi", "success");
  }

  function fmtLibHandleFile(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var txt = String(reader.result || "");
      var base = file.name.replace(/\.[^.]+$/, "");
      // Studio state'ini besle + aktifleştir + kaydet (studio zinciri her şeyi yapar)
      var ok = studioImportFmtFromText(txt, base);
      if (!ok) return;
      // Alan yoksa (yalnızca FORMAT_NAME içeren dosya), kullanıcıyı Stüdyo'ya yönlendir
      if (!studio.fields || !studio.fields.length) {
        toast("Şablon okundu, alanları Stüdyo'da çizmeniz gerekiyor", "info");
        closeFmtLibrary();
        setTimeout(function () { try { studioOpen(); } catch (e) {} }, 120);
        return;
      }
      try {
        studioSaveCurrent({ silent: true });
        toast("FMT Şablonu başarıyla yüklendi ve sisteme kaydedildi.", "success");
        renderFmtLibrary();
      } catch (e) {
        console.warn("[FmtLib] kayıt hatası:", e);
        toast("Şablon okundu ama kaydedilemedi", "error");
      }
    };
    reader.onerror = function () { toast("Dosya okunamadı", "error"); };
    reader.readAsText(file);
  }

  // Global delegation: [📁 FMT Dosyası Yükle] → sessiz dosya seçici (modal YOK)
  document.addEventListener("click", function (e) {
    var t = e.target && e.target.closest && e.target.closest("#dsy-btn-fmt-upload");
    if (!t) return;
    e.preventDefault();
    var inp = document.getElementById("dsy-fmt-quick-input");
    if (inp) inp.click();
  });

  // Sessiz FMT yükleme: parse → savedFmtTemplates'e yaz → dropdown güncelle & otomatik seç → toast
  document.addEventListener("change", function (e) {
    var inp = e.target;
    if (!inp || inp.id !== "dsy-fmt-quick-input") return;
    var file = inp.files && inp.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var txt = String(reader.result || "");
        var baseName = file.name.replace(/\.[^.]+$/, "");
        var parsed = studioParseFmt(txt);
        if (!parsed) { toast("FMT formatı tanınamadı", "error"); return; }

        // FORMAT_NAME yoksa dosya adını kullan
        var name = (parsed.name && parsed.name.trim()) || baseName || "İçe aktarılan şablon";

        // savedFmtTemplates (= derecepanel_optik_templates_v1) havuzu
        var list = studioLoadSaved();
        var existingIdx = list.findIndex(function (x) {
          return (x.name || "").toLowerCase() === name.toLowerCase();
        });
        var tpl = {
          id: existingIdx >= 0 ? list[existingIdx].id
                                : ("tpl-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6)),
          name: name,
          refW: parsed.refW || STUDIO_REF_WIDTH,
          refH: parsed.refH || STUDIO_REF_HEIGHT,
          bgDataUrl: null,
          expectedAnswers: parsed.expectedAnswers || 0,
          fields: (parsed.fields || []).slice(),
          createdAt: new Date().toISOString(),
        };
        if (existingIdx >= 0) list[existingIdx] = tpl;
        else list.push(tpl);
        studioPersistSaved(list);

        // Merkezi FmtStore'a da yaz (diğer sayfalar için)
        try { persistStudioToFmtStore(tpl); } catch (_) {}

        // Aktifleştir + dropdown'u 'custom'a çek + parser chip'i güncelle
        activateCustomTemplate(tpl);
        populateTemplateSelect();
        var sel = document.getElementById("dsy-template");
        if (sel) {
          sel.value = "custom";
          sel.dispatchEvent(new Event("change", { bubbles: true }));
        }
        // Studio açıksa listesini de tazele (aynı havuz — zaten senkron)
        try { studioRenderSaved(); } catch (_) {}

        toast("Şablon başarıyla tanındı ve seçildi. Okumaya hazırsınız!", "success");
      } catch (err) {
        console.warn("[FMT Quick Upload] hata:", err);
        toast("Şablon okunamadı", "error");
      } finally {
        inp.value = "";
      }
    };
    reader.onerror = function () {
      toast("Dosya okunamadı", "error");
      inp.value = "";
    };
    reader.readAsText(file);
  });

  function wireFmtLibrary() {
    var m = $("fmtLibraryModal");
    if (!m || m.dataset.wired === "1") return;
    m.dataset.wired = "1";

    var closeBtn = $("fmtLib-close");
    var doneBtn = $("fmtLib-done");
    var backdrop = $("fmtLib-backdrop");
    var openStudioBtn = $("fmtLib-open-studio");
    var fileInp = $("fmtLib-file");
    var dz = $("fmtLib-dropzone");
    var search = $("fmtLib-search");
    var list = $("fmtLib-list");

    if (closeBtn) closeBtn.addEventListener("click", closeFmtLibrary);
    if (doneBtn) doneBtn.addEventListener("click", closeFmtLibrary);
    if (backdrop) backdrop.addEventListener("click", closeFmtLibrary);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && m.style.display !== "none") closeFmtLibrary();
    });

    if (openStudioBtn) openStudioBtn.addEventListener("click", function () {
      closeFmtLibrary();
      setTimeout(function () { try { studioOpen(); } catch (e) {} }, 80);
    });

    // Dropzone (drag & drop)
    if (dz) {
      ["dragenter", "dragover"].forEach(function (ev) {
        dz.addEventListener(ev, function (e) {
          e.preventDefault(); e.stopPropagation();
          dz.classList.add("border-indigo-500", "bg-indigo-50");
        });
      });
      ["dragleave", "drop"].forEach(function (ev) {
        dz.addEventListener(ev, function (e) {
          e.preventDefault(); e.stopPropagation();
          dz.classList.remove("border-indigo-500", "bg-indigo-50");
        });
      });
      dz.addEventListener("drop", function (e) {
        var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) fmtLibHandleFile(f);
      });
    }
    if (fileInp) {
      fileInp.addEventListener("change", function () {
        var f = fileInp.files && fileInp.files[0];
        if (f) fmtLibHandleFile(f);
        fileInp.value = "";
      });
    }

    // Arama (real-time)
    if (search) {
      search.addEventListener("input", function () {
        fmtLibState.query = search.value || "";
        renderFmtLibrary();
      });
    }

    // Liste: Seç / Sil (event delegation)
    if (list) {
      list.addEventListener("click", function (e) {
        var btn = e.target.closest && e.target.closest("button[data-act]");
        if (!btn) return;
        var id = btn.getAttribute("data-id");
        var act = btn.getAttribute("data-act");
        if (act === "pick") fmtLibPickById(id);
        else if (act === "del") fmtLibDeleteById(id);
      });
    }

    // Başka sayfa/sekme savedFmtTemplates'i güncellerse modal açıkken yenile
    window.addEventListener("storage", function (ev) {
      if (ev.key === STORAGE_TEMPLATES && m.style.display !== "none") renderFmtLibrary();
    });
    // FmtStore dış değişimlerinde
    window.addEventListener("fmt-store:change", function () {
      if (m.style.display !== "none") renderFmtLibrary();
    });
  }

  // HTML escape yardımcı (XSS'e karşı)
  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // Template değişiminde chip'i tazele
  document.addEventListener("change", function (e) {
    if (e.target && e.target.id === "dsy-template") {
      setTimeout(refreshActiveTemplateChip, 0);
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }
})();

