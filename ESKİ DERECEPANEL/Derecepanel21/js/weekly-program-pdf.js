/**
 * Haftalık Program PDF — html2pdf (sayfada önceden yüklenmiş olmalı).
 * İframe + ikinci script yüklemesi: tıklama sonrası gecikmede indirme / kütüphane bağlamı sorunlarına yol açabildiği için
 * içerik ana belgede off-screen oluşturulur ve window.html2pdf doğrudan kullanılır.
 */
(function () {
  /** UMD / farklı paket sürümleri için html2pdf çözümleyici */
  function resolveHtml2Pdf() {
    if (typeof window.html2pdf === "function") return window.html2pdf;
    var h = window.html2pdf;
    if (h && typeof h.default === "function") return h.default;
    return null;
  }

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  var WP_PDF_CLONE_CSS =
    "[data-wp-pdf-wrap]{box-sizing:border-box;margin:0;padding:0;background:#fff;color:#111827;}" +
    "#wp-pdf-source{box-sizing:border-box;max-width:1100px;margin:0;padding:0;background:#fff;color:#111827;}" +
    ".wp-pdf__title{margin:0 0 10px;font-size:1.25rem;font-weight:700;color:#0f172a;}" +
    ".wp-pdf__student{margin:0 0 14px;font-size:0.95rem;color:#4b5563;}" +
    ".wp-pdf__week{margin:0 0 14px;font-size:0.88rem;font-weight:600;color:#374151;}" +
    ".wp-pdf__table{width:100%;border-collapse:collapse;font-size:0.82rem;margin-top:8px;}" +
    ".wp-pdf__table th,.wp-pdf__table td{border:1px solid #e5e7eb;padding:8px 10px;vertical-align:top;text-align:left;}" +
    ".wp-pdf__table th{width:22%;background:#f3f4f6;font-weight:700;}";

  /** html2canvas color-mix / karma CSS sorunlarına karşı düz renkler (klon PDF) */
  var WP_PDF_GRID_SOLID_CSS =
    "[data-wp-pdf-wrap] .wp-board--grid{box-sizing:border-box;width:100%!important;max-width:none!important;min-width:0!important;" +
    "grid-template-columns:repeat(7,minmax(0,1fr))!important;column-gap:6px!important;row-gap:10px!important;}" +
    "[data-wp-pdf-wrap] .wp-board-wrap{overflow:visible!important;max-width:none!important;width:100%!important;}" +
    "[data-wp-pdf-wrap] .wp-day{background:#fff!important;border:1px solid #e2e8f0!important;}" +
    "[data-wp-pdf-wrap] .wp-day__head{background:#f8fafc!important;color:#0f172a!important;border-bottom:1px solid #e2e8f0!important;}" +
    "[data-wp-pdf-wrap] .wp-slot__head{background:#f1f5f9!important;color:#64748b!important;}" +
    "[data-wp-pdf-wrap] .wp-slot--sabah .wp-slot__drop{background:#e8f4fc!important;}" +
    "[data-wp-pdf-wrap] .wp-slot--ogle .wp-slot__drop{background:#fff8e6!important;}" +
    "[data-wp-pdf-wrap] .wp-slot--ikindi .wp-slot__drop{background:#e8f8ef!important;}" +
    "[data-wp-pdf-wrap] .wp-slot--aksam .wp-slot__drop{background:#f3e8ff!important;}" +
    "[data-wp-pdf-wrap] .wp-slot__drop{min-height:72px!important;border-radius:8px!important;}" +
    "[data-wp-pdf-wrap] .wp-chip{background:#fff!important;border:1px solid #e2e8f0!important;}";

  function buildPrintableRoot(doc, data) {
    var root = doc.createElement("div");
    root.setAttribute("data-wp-pdf-root", "1");
    root.style.cssText =
      "box-sizing:border-box;width:1100px;min-height:400px;padding:28px 32px;" +
      "background:#ffffff;color:#111827;font-family:Arial,Helvetica,sans-serif;" +
      "font-size:12px;line-height:1.45;";

    var h1 = doc.createElement("h1");
    h1.style.cssText = "margin:0 0 10px;font-size:20px;font-weight:700;color:#0f172a;";
    h1.textContent = data.title || "Haftalık Program";

    var meta = doc.createElement("p");
    meta.style.cssText = "margin:0 0 6px;color:#374151;font-size:13px;";
    meta.innerHTML =
      "<strong>Öğrenci:</strong> " +
      esc(data.studentName || "—") +
      " &nbsp;|&nbsp; <strong>Hafta:</strong> " +
      esc(data.weekRange || "");

    var meta2 = doc.createElement("p");
    meta2.style.cssText = "margin:0 0 18px;color:#4b5563;font-size:12px;";
    var bits = [];
    if (data.targetExam) bits.push("<strong>Hedef sınav:</strong> " + esc(data.targetExam));
    if (data.motto) bits.push("<strong>Motto:</strong> " + esc(data.motto));
    meta2.innerHTML = bits.length ? bits.join(" · ") : "";
    root.appendChild(h1);
    root.appendChild(meta);
    root.appendChild(meta2);

    var table = doc.createElement("table");
    table.style.cssText =
      "width:100%;border-collapse:collapse;margin-top:8px;" +
      "border:1px solid #cbd5e1;table-layout:fixed;";
    var thead = doc.createElement("thead");
    var hr = doc.createElement("tr");
    var cols = ["Gün", "Sabah", "Öğle", "İkindi", "Akşam"];
    cols.forEach(function (c) {
      var th = doc.createElement("th");
      th.style.cssText =
        "text-align:left;padding:8px 10px;background:#f1f5f9;border:1px solid #cbd5e1;" +
        "font-size:11px;text-transform:uppercase;letter-spacing:0.04em;color:#475569;width:" +
        (c === "Gün" ? "14%" : "21.5%") +
        ";";
      th.textContent = c;
      hr.appendChild(th);
    });
    thead.appendChild(hr);
    table.appendChild(thead);

    var tbody = doc.createElement("tbody");
    var slotBg = ["#e8f4fc", "#fff8e6", "#e8f8ef", "#f3e8ff"];
    (data.rows || []).forEach(function (row) {
      var tr = doc.createElement("tr");
      var td0 = doc.createElement("td");
      td0.style.cssText =
        "vertical-align:top;padding:8px 10px;border:1px solid #e2e8f0;font-weight:700;background:#fafafa;";
      td0.textContent = row.dayLabel || "";
      tr.appendChild(td0);
      (row.slots || []).forEach(function (cell, si) {
        var td = doc.createElement("td");
        var bg = slotBg[si] != null ? slotBg[si] : "#ffffff";
        td.style.cssText =
          "vertical-align:top;padding:8px 10px;border:1px solid #e2e8f0;color:#1e293b;background:" + bg + ";";
        td.innerHTML = cell ? esc(cell).replace(/\n/g, "<br/>") : "—";
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    root.appendChild(table);

    var foot = doc.createElement("p");
    foot.style.cssText = "margin:18px 0 0;font-size:10px;color:#94a3b8;";
    foot.textContent = "Derecepanel — Haftalık program çıktısı";
    root.appendChild(foot);

    return root;
  }

  function pdfOptions(filename, html2canvasExtra) {
    var safeName = (filename || "haftalik-program").replace(/[^\w\u00C0-\u024f\s.-]/gi, "_") + ".pdf";
    var h2c = {
      scale: 1.65,
      useCORS: false,
      allowTaint: true,
      logging: false,
      backgroundColor: "#ffffff",
      scrollX: 0,
      scrollY: 0,
    };
    if (html2canvasExtra && typeof html2canvasExtra === "object") {
      for (var k in html2canvasExtra) {
        if (Object.prototype.hasOwnProperty.call(html2canvasExtra, k)) h2c[k] = html2canvasExtra[k];
      }
    }
    return {
      margin: [4, 4, 4, 4],
      filename: safeName,
      image: { type: "jpeg", quality: 0.92 },
      html2canvas: h2c,
      jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
    };
  }

  function removeNode(n) {
    if (n && n.parentNode) n.parentNode.removeChild(n);
  }

  function formatErr(err) {
    if (err == null) return "Bilinmeyen hata";
    if (typeof err === "string") return err;
    if (err.message) return String(err.message);
    return String(err);
  }

  function triggerBlobDownload(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = name || "haftalik-program.pdf";
    a.rel = "noopener";
    a.style.cssText = "position:fixed;left:-9999px;top:0;";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(url);
      removeNode(a);
    }, 3000);
  }

  /**
   * html2canvas ekran dışı (left:-9999px) öğelerde sık sık BEYAZ PDF üretir.
   * Bu yüzden yakalama öğesi viewport içinde, düşük opaklıkta tutulmalı.
   * İndirme: önce blob (daha güvenilir), olmazsa .save().
   */
  function runHtml2PdfOnElement(targetEl, filename, html2canvasExtra) {
    var h2p = resolveHtml2Pdf();
    if (!h2p) {
      return Promise.reject(new Error("html2pdf yüklenmedi — sayfayı yenileyin veya engelleyiciyi kontrol edin."));
    }
    targetEl.style.setProperty("position", "fixed", "important");
    targetEl.style.setProperty("left", "0", "important");
    targetEl.style.setProperty("top", "0", "important");
    targetEl.style.setProperty("z-index", "2147483006", "important");
    targetEl.style.setProperty("opacity", "0.02", "important");
    targetEl.style.setProperty("pointer-events", "none", "important");
    void targetEl.offsetWidth;
    void targetEl.getBoundingClientRect();

    var opt = pdfOptions(filename, html2canvasExtra);

    function tryBlob() {
      var chain = h2p().set(opt).from(targetEl);
      if (typeof chain.outputPdf !== "function") {
        return Promise.reject(new Error("outputPdf desteklenmiyor."));
      }
      return chain.outputPdf("blob").then(function (blob) {
        if (!blob || blob.size < 200) {
          return Promise.reject(new Error("PDF verisi çok küçük veya boş."));
        }
        triggerBlobDownload(blob, opt.filename);
      });
    }

    function trySave() {
      var saveP = h2p().set(opt).from(targetEl).save();
      if (!saveP || typeof saveP.then !== "function") {
        return tryBlob();
      }
      return saveP;
    }

    return tryBlob().catch(function (errBlob) {
      console.warn("[WeeklyProgramPdf] blob PDF başarısız, save() deneniyor:", errBlob);
      return trySave().catch(function (errSave) {
        console.error("[WeeklyProgramPdf] save() da başarısız:", errSave);
        return Promise.reject(errSave || errBlob);
      });
    });
  }

  window.WeeklyProgramPdf = {
    /** Kütüphanenin yüklü olup olmadığını kontrol (weekly-builder) */
    resolveHtml2Pdf: resolveHtml2Pdf,

    downloadPdf: function (filename, data) {
      var root = buildPrintableRoot(document, data);
      root.style.cssText +=
        "position:fixed;left:0;top:0;z-index:2147483005;width:1100px;" +
        "pointer-events:none;background:#ffffff;";
      document.body.appendChild(root);
      return runHtml2PdfOnElement(root, filename, null).then(
        function () {
          removeNode(root);
        },
        function (err) {
          removeNode(root);
          console.error("[WeeklyProgramPdf] downloadPdf", err);
          return Promise.reject(err);
        }
      );
    },

    download: function (element, filename) {
      if (!element) {
        return Promise.reject(new Error("PDF önizleme alanı yok."));
      }
      var wrap = document.createElement("div");
      wrap.setAttribute("data-wp-pdf-wrap", "1");
      var captureW = Math.ceil(
        Math.max(1200, element.scrollWidth || 0, element.offsetWidth || 0, element.getBoundingClientRect().width || 0) + 32
      );
      var captureH = Math.ceil(Math.max(720, element.scrollHeight || 0, element.offsetHeight || 0) + 32);
      wrap.style.cssText =
        "position:fixed;left:0;top:0;z-index:2147483005;width:" +
        captureW +
        "px;min-height:" +
        captureH +
        "px;" +
        "pointer-events:none;background:#ffffff;box-sizing:border-box;overflow:visible;";
      var st = document.createElement("style");
      st.setAttribute("type", "text/css");
      st.textContent = WP_PDF_CLONE_CSS + WP_PDF_GRID_SOLID_CSS;
      wrap.appendChild(st);
      wrap.appendChild(element.cloneNode(true));
      document.body.appendChild(wrap);
      void wrap.offsetHeight;
      return runHtml2PdfOnElement(wrap, filename, null).then(
        function () {
          removeNode(wrap);
        },
        function (err) {
          removeNode(wrap);
          console.error("[WeeklyProgramPdf] download", err);
          return Promise.reject(err);
        }
      );
    },

    /** Hata metni (toast / alert için) */
    formatPdfError: formatErr,
  };
})();
