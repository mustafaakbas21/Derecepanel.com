/**
 * Exam Matrix — Soru→Konu haritası ve Cross-Exam agregasyon katmanı.
 * ------------------------------------------------------------------
 * Bu modül, "Sınav Oluştur" sayfasında hoca'nın her soruyu bir konuya
 * bağlamasıyla oluşan matrix'i tutar ve "Analiz Merkezi"nde
 * `getSubjectMastery(studentId)` ile konu bazlı kümüle başarıyı üretir.
 *
 * LocalStorage anahtarları:
 *   derece_exam_matrix_v1          →  { [examId]: ExamMatrix }
 *   derece_exam_results_matrix_v1  →  [ ExamResult ]
 *
 * Tipler:
 *   ExamMatrix = {
 *     examId: string, name: string, date?: string,
 *     subjectName?: string, questionCount: number,
 *     questions: [{ qNo:number, subjectId:string, subjectName:string,
 *                   topicId?:string, topicName?:string }]
 *   }
 *   ExamResult = {
 *     examId: string, studentId: string, studentName?: string,
 *     answers: [{ qNo:number, result:"correct"|"wrong"|"empty" }]
 *   }
 */
(function () {
  "use strict";

  var K_MATRIX = "derece_exam_matrix_v1";
  var K_RESULTS = "derece_exam_results_matrix_v1";

  function safeParse(raw, fallback) {
    try { return raw ? JSON.parse(raw) : fallback; }
    catch (e) { return fallback; }
  }

  function readAllMatrix() {
    return safeParse(localStorage.getItem(K_MATRIX), {}) || {};
  }
  function writeAllMatrix(obj) {
    try { localStorage.setItem(K_MATRIX, JSON.stringify(obj || {})); } catch (e) {}
  }
  function readAllResults() {
    var v = safeParse(localStorage.getItem(K_RESULTS), []);
    return Array.isArray(v) ? v : [];
  }
  function writeAllResults(list) {
    try { localStorage.setItem(K_RESULTS, JSON.stringify(list || [])); } catch (e) {}
  }

  function ensureMufredat() {
    if (window.YksMufredatApi && typeof window.YksMufredatApi.getSubjects === "function") {
      return window.YksMufredatApi;
    }
    var FALLBACK = {
      "Matematik": ["Köklü Sayılar","Problemler","Türev","İntegral","Fonksiyonlar","Limit","Cebir"],
      "Türkçe":    ["Paragraf — Ana Fikir","Paragraf — Yapı","Sözcükte Anlam","Cümlede Anlam","Yazım","Noktalama"],
      "Geometri":  ["Üçgende Açılar","Çember","Analitik","Katı Cisimler","Dönüşüm","Çokgen"],
      "Fizik":     ["Kuvvet & Hareket","Elektrik","Optik","Dalgalar","Enerji","Manyetizma"],
      "Kimya":     ["Mol","Asit-Baz","Tepkimeler","Organik","Çözünürlük","Termodinamik"],
      "Biyoloji":  ["Hücre","Genetik","Sistemler","Ekosistem","Bitkiler","Metabolizma"],
      "Edebiyat":  ["Şiir","Roman","Öykü","Tiyatro","Eleştiri","Türler"],
      "Tarih":     ["İlk Çağ","Osmanlı","İnkılap","Çağdaş","İslam Tarihi","Kültür"],
      "Coğrafya":  ["İklim","Nüfus","Ekonomi","Harita","Yerşekilleri","Ekosistem"],
      "Felsefe":   ["Bilgi","Varlık","Ahlak","Sanat","Din","Siyaset"]
    };
    var dersler = Object.keys(FALLBACK);
    return {
      getSubjects: function () {
        return dersler.map(function (n, i) { return { id: "fb-" + i, name: n }; });
      },
      getTopics: function (subjectId) {
        var idx = parseInt(String(subjectId).replace("fb-", ""), 10);
        var name = dersler[isNaN(idx) ? 0 : idx] || dersler[0];
        return (FALLBACK[name] || []).map(function (t, j) {
          return { id: "fb-t-" + idx + "-" + j, name: t };
        });
      }
    };
  }

  // Public API ---------------------------------------------------------------

  function saveMatrix(matrix) {
    if (!matrix || !matrix.examId) throw new Error("examId required");
    matrix.questions = (matrix.questions || []).map(function (q) {
      return {
        qNo: +q.qNo,
        subjectId: String(q.subjectId || ""),
        subjectName: String(q.subjectName || ""),
        topicId: q.topicId ? String(q.topicId) : null,
        topicName: q.topicName ? String(q.topicName) : null
      };
    });
    matrix.questionCount = matrix.questions.length;
    matrix.updatedAt = new Date().toISOString();

    var all = readAllMatrix();
    all[matrix.examId] = matrix;
    writeAllMatrix(all);
    return matrix;
  }

  function getMatrix(examId) {
    if (!examId) return null;
    var all = readAllMatrix();
    return all[examId] || null;
  }

  function listExams() {
    var all = readAllMatrix();
    return Object.keys(all).map(function (k) { return all[k]; });
  }

  function deleteMatrix(examId) {
    var all = readAllMatrix();
    delete all[examId];
    writeAllMatrix(all);
  }

  function addResult(result) {
    if (!result || !result.examId || !result.studentId) throw new Error("examId + studentId required");
    var list = readAllResults();
    // Aynı (examId, studentId) çiftini güncelle
    var idx = list.findIndex(function (r) { return r.examId === result.examId && r.studentId === result.studentId; });
    var rec = {
      examId: String(result.examId),
      studentId: String(result.studentId),
      studentName: result.studentName || "",
      date: result.date || new Date().toISOString(),
      answers: (result.answers || []).map(function (a) {
        return { qNo: +a.qNo, result: String(a.result || "empty") };
      })
    };
    if (idx >= 0) list[idx] = rec; else list.push(rec);
    writeAllResults(list);
    return rec;
  }

  function getResultsByStudent(studentId) {
    var sid = String(studentId || "").trim();
    if (!sid) return [];
    return readAllResults().filter(function (r) {
      return String(r.studentId || "").trim() === sid;
    });
  }

  /** Birden fazla öğrenci kimliği (katalog, kod, oturum id) için sonuçları birleştirir */
  function getResultsByStudentIds(studentIds) {
    var set = Object.create(null);
    (studentIds || []).forEach(function (id) {
      id = String(id || "").trim();
      if (id) set[id] = true;
    });
    if (!Object.keys(set).length) return [];
    return readAllResults().filter(function (r) {
      return set[String(r.studentId || "").trim()];
    });
  }

  function getStudents() {
    // Tüm sonuçlardan benzersiz öğrencileri topla
    var map = {};
    readAllResults().forEach(function (r) {
      if (!map[r.studentId]) map[r.studentId] = { id: r.studentId, name: r.studentName || r.studentId };
    });
    // Ayrıca student-catalog.js verisini de dahil et (varsa)
    try {
      var cat = safeParse(localStorage.getItem("derecepanel_student_catalog_v1"), []);
      (cat || []).forEach(function (s) {
        if (!map[s.id]) map[s.id] = { id: s.id, name: s.name || s.id };
      });
    } catch (e) {}
    return Object.keys(map).map(function (k) { return map[k]; });
  }

  /**
   * Bir öğrencinin tüm sınav sonuçlarını, sınavların matrix'i ile
   * eşleştirip konu bazlı kümüle dökümünü döndürür.
   *
   * Dönüş şekli:
   *  {
   *    total: { correct, wrong, empty, asked },
   *    bySubject: {
   *      [subjectName]: {
   *        subjectName, correct, wrong, empty, asked, rate,
   *        topics: {
   *          [topicName]: { correct, wrong, empty, asked, rate,
   *             perExam: [{ examId, name, correct, wrong, empty, asked }] }
   *        }
   *      }
   *    }
   *  }
   */
  function getSubjectMastery(studentId) {
    var out = {
      total: { correct: 0, wrong: 0, empty: 0, asked: 0 },
      bySubject: {}
    };
    if (!studentId) return out;

    var matrixAll = readAllMatrix();
    var results = readAllResults().filter(function (r) { return r.studentId === studentId; });

    results.forEach(function (r) {
      var mx = matrixAll[r.examId];
      if (!mx) return;
      var byQ = {};
      (mx.questions || []).forEach(function (q) { byQ[q.qNo] = q; });

      // Per-exam topic biriktir
      var examTopicAcc = {}; // "Mat||Türev" -> {c,w,e,a}

      (r.answers || []).forEach(function (a) {
        var q = byQ[a.qNo];
        if (!q) return;
        var subj = q.subjectName || "—";
        var topic = q.topicName || "Genel";
        var res = a.result;

        var s = out.bySubject[subj] || (out.bySubject[subj] = {
          subjectName: subj, correct: 0, wrong: 0, empty: 0, asked: 0, rate: 0, topics: {}
        });
        var t = s.topics[topic] || (s.topics[topic] = {
          correct: 0, wrong: 0, empty: 0, asked: 0, rate: 0, perExam: []
        });

        s.asked++; t.asked++; out.total.asked++;
        if (res === "correct") { s.correct++; t.correct++; out.total.correct++; }
        else if (res === "wrong") { s.wrong++; t.wrong++; out.total.wrong++; }
        else { s.empty++; t.empty++; out.total.empty++; }

        var key = subj + "||" + topic;
        var ea = examTopicAcc[key] || (examTopicAcc[key] = { correct: 0, wrong: 0, empty: 0, asked: 0 });
        ea.asked++;
        if (res === "correct") ea.correct++;
        else if (res === "wrong") ea.wrong++;
        else ea.empty++;
      });

      // Per-exam topic kayıtlarını yerleştir
      Object.keys(examTopicAcc).forEach(function (k) {
        var parts = k.split("||");
        var subj = parts[0], topic = parts[1];
        var entry = examTopicAcc[k];
        var t = (out.bySubject[subj] && out.bySubject[subj].topics[topic]);
        if (t) {
          t.perExam.push({
            examId: r.examId,
            name: mx.name || r.examId,
            date: mx.date || r.date || "",
            correct: entry.correct, wrong: entry.wrong, empty: entry.empty, asked: entry.asked
          });
        }
      });
    });

    // Oranları hesapla
    Object.keys(out.bySubject).forEach(function (subj) {
      var s = out.bySubject[subj];
      s.rate = s.asked ? Math.round((s.correct / s.asked) * 100) : 0;
      Object.keys(s.topics).forEach(function (t) {
        var tp = s.topics[t];
        tp.rate = tp.asked ? Math.round((tp.correct / tp.asked) * 100) : 0;
      });
    });

    return out;
  }

  function stats() {
    return {
      matrices: Object.keys(readAllMatrix()).length,
      results: readAllResults().length
    };
  }

  // ==========================================================================
  //  AŞAMA 2 · KONU BAZLI AGREGASYON ALGORİTMASI  (Analitik Beyin)
  // --------------------------------------------------------------------------
  //  calculateSubjectMastery(studentId)
  //    → UI (ApexCharts + tablo) tarafından doğrudan tüketilecek DÜZ dizi.
  //    → Konu birleşik anahtar:  "Ders - Konu"  (Örn: "Matematik - Türev")
  //    → masteryPercentage tek ondalık (Örn: 66.7)
  //    → history[]: o konunun geçtiği her sınav için {examName, correct, wrong, blank, ...}
  //    → Matrix'i eksik sınavlar analiz dışı bırakılır + konsola uyarı basılır.
  //
  //  Çıktı örneği:
  //  [
  //    {
  //      subject: "Matematik - Türev",
  //      subjectName: "Matematik", topicName: "Türev",
  //      totalQuestions: 60, totalCorrect: 40, totalWrong: 20, totalBlank: 0,
  //      masteryPercentage: 66.7,
  //      history: [
  //        { examId, examName, examDate, correct, wrong, blank, total, percentage }
  //      ]
  //    }, ...
  //  ]
  // ==========================================================================
  function calculateSubjectMastery(studentId) {
    if (!studentId) {
      console.warn("[ExamMatrix] calculateSubjectMastery: studentId gerekli.");
      return [];
    }

    var matrices = readAllMatrix();
    var allResults = readAllResults();
    var studentResults = allResults.filter(function (r) { return r.studentId === studentId; });

    if (!studentResults.length) {
      console.info("[ExamMatrix] Otonom Sistem Bilgisi: '" + studentId + "' için henüz sınav sonucu bulunamadı.");
      return [];
    }

    // Matrix'i eksik sınavları önce filtrele + uyar
    var validResults = [];
    var warnedExams = {};
    studentResults.forEach(function (r) {
      var mx = matrices[r.examId];
      if (!mx || !Array.isArray(mx.questions) || mx.questions.length === 0) {
        if (!warnedExams[r.examId]) {
          warnedExams[r.examId] = true;
          var displayName = (mx && mx.name) || r.examId;
          // Şık, kategorize uyarı — browser konsolunda filtrelenebilir
          console.warn(
            "%c⚠ Otonom Sistem Uyarısı%c '" + displayName + "' için Matrix verisi bulunamadı, analiz dışı bırakıldı.",
            "background:#fef3c7;color:#92400e;font-weight:800;padding:2px 6px;border-radius:4px;",
            "color:#92400e;"
          );
        }
        return;
      }
      validResults.push({ result: r, matrix: mx });
    });

    if (!validResults.length) {
      console.warn("[ExamMatrix] Hiçbir sınav için matrix eşleşmesi yok. Rapor boş döndürüldü.");
      return [];
    }

    // subject-topic birleşik anahtar ile agrega
    // Map key: "Matematik\u0001Türev"   (çakışma ihtimali sıfır separator)
    var SEP = "\u0001";
    var acc = {};

    validResults.forEach(function (bundle) {
      var r = bundle.result, mx = bundle.matrix;

      // Soru numarası → konu eşlemesi
      var byQ = {};
      mx.questions.forEach(function (q) { byQ[q.qNo] = q; });

      // Bu sınava özel (exam-level) biriktirme — history push için
      var examLevel = {};

      (r.answers || []).forEach(function (a) {
        var q = byQ[a.qNo];
        if (!q) return;
        var subj = q.subjectName || "—";
        var topic = q.topicName  || "Genel";
        var key = subj + SEP + topic;

        var entry = acc[key] || (acc[key] = {
          subject: subj + " - " + topic,
          subjectName: subj,
          topicName: topic,
          totalQuestions: 0,
          totalCorrect: 0,
          totalWrong: 0,
          totalBlank: 0,
          masteryPercentage: 0,
          history: []
        });

        var exLv = examLevel[key] || (examLevel[key] = {
          examId: mx.examId,
          examName: mx.name || mx.examId,
          examDate: mx.date || r.date || "",
          correct: 0, wrong: 0, blank: 0, total: 0, percentage: 0
        });

        entry.totalQuestions++;
        exLv.total++;
        if (a.result === "correct")      { entry.totalCorrect++; exLv.correct++; }
        else if (a.result === "wrong")   { entry.totalWrong++;   exLv.wrong++; }
        else                              { entry.totalBlank++;   exLv.blank++; }
      });

      // Sınav sonunda history'e ekle
      Object.keys(examLevel).forEach(function (key) {
        var exLv = examLevel[key];
        exLv.percentage = exLv.total
          ? Math.round((exLv.correct / exLv.total) * 1000) / 10
          : 0;
        acc[key].history.push(exLv);
      });
    });

    // Tamamlayıcı hesaplar + sıralama
    var list = Object.keys(acc).map(function (k) {
      var e = acc[k];
      e.masteryPercentage = e.totalQuestions
        ? Math.round((e.totalCorrect / e.totalQuestions) * 1000) / 10
        : 0;
      // history tarihe göre artan sırala
      e.history.sort(function (a, b) {
        return String(a.examDate || "").localeCompare(String(b.examDate || ""));
      });
      return e;
    });

    // En çok sorulan konular başta, eşitlikte alfabetik
    list.sort(function (a, b) {
      if (b.totalQuestions !== a.totalQuestions) return b.totalQuestions - a.totalQuestions;
      return a.subject.localeCompare(b.subject, "tr");
    });

    return list;
  }

  // ============================================================
  // One-shot purge — Önceki session'lardan kalan demo/seed öğrencilerini
  // (Ayşe Yılmaz/s1, Burak Aslan/s2 vb.) temizler. İstemci başına 1 kez.
  // ============================================================
  (function purgeMockOnce() {
    var FLAG = "derece_exam_matrix_purge_mock_v2";
    try {
      if (localStorage.getItem(FLAG)) return;
      var MOCK_IDS   = { s1: 1, s2: 1, s3: 1, s4: 1, s5: 1, s6: 1 };
      var MOCK_NAMES = {
        "ayşe yılmaz": 1, "ayse yilmaz": 1,
        "burak aslan": 1,
        "elif kaya": 1,
        "mehmet demir": 1,
      };
      // 1) Results içindeki demo kayıtları ele
      var results = readAllResults();
      var cleanResults = results.filter(function (r) {
        if (!r) return false;
        var id = String(r.studentId || "").toLowerCase();
        var nm = String(r.studentName || "").toLowerCase();
        if (MOCK_IDS[id]) return false;
        if (MOCK_NAMES[nm]) return false;
        return true;
      });
      if (cleanResults.length !== results.length) writeAllResults(cleanResults);

      // 2) Öğrenci kataloğundan demo öğrencileri ele
      try {
        var CAT_KEY = "derecepanel_student_catalog_v1";
        var cat = safeParse(localStorage.getItem(CAT_KEY), []);
        if (Array.isArray(cat) && cat.length) {
          var cleanCat = cat.filter(function (s) {
            if (!s) return false;
            var id = String(s.id || "").toLowerCase();
            var nm = String(s.name || "").toLowerCase();
            if (MOCK_IDS[id]) return false;
            if (MOCK_NAMES[nm]) return false;
            return true;
          });
          if (cleanCat.length !== cat.length) {
            localStorage.setItem(CAT_KEY, JSON.stringify(cleanCat));
          }
        }
      } catch (e) {}

      localStorage.setItem(FLAG, String(Date.now()));
    } catch (e) {}
  })();

  window.ExamMatrix = {
    saveMatrix: saveMatrix,
    getMatrix: getMatrix,
    listExams: listExams,
    deleteMatrix: deleteMatrix,
    addResult: addResult,
    getResultsByStudent: getResultsByStudent,
    getResultsByStudentIds: getResultsByStudentIds,
    getStudents: getStudents,
    getSubjectMastery: getSubjectMastery,
    calculateSubjectMastery: calculateSubjectMastery,
    stats: stats,
    ensureMufredat: ensureMufredat,
    _keys: { matrix: K_MATRIX, results: K_RESULTS }
  };
})();
