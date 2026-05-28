import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "pages/basit-deneme-sonuclari.html"), "utf8");

const startMarker = "        function readArray(key, altKey)";
const endMarker = "        var allExams = [];";
const start = html.indexOf(startMarker);
const end = html.indexOf(endMarker);
if (start < 0 || end < 0 || end <= start) {
  console.error("markers", start, end);
  process.exit(1);
}
let block = html.slice(start, end).replace(/\r\n/g, "\n");
// Drop trailing blank lines
block = block.replace(/\n\s*$/, "");

// Unindent 8 spaces -> 2 spaces for IIFE body
block = block
  .split("\n")
  .map((line) => {
    if (line.startsWith("        ")) return "  " + line.slice(8);
    return line;
  })
  .join("\n");

const out = `/**
 * Tek öğrenci karne HTML + PDF (html2pdf) — Sonuç Merkezi ile aynı üretim ağacı.
 * tools/extract-karne-api.mjs ile basit-deneme-sonuclari.html'den üretilir.
 */
(function () {
  "use strict";

  var allExams = [];

  function refreshExams() {
    allExams = loadMergedExams();
  }

${block}

  function sanitizeFilenamePart(s) {
    return String(s == null ? "sinav" : s)
      .replace(/[^\\w\\u00C0-\\u024f\\-]+/gi, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 80) || "sinav";
  }

  window.DereceStudentKarneApi = {
    refreshExams: refreshExams,

    findExamById: function (id) {
      refreshExams();
      return findExamById(id);
    },

    buildKarneHtmlForStudent: function (examId, resultRow) {
      refreshExams();
      var ex = findExamById(examId);
      if (!ex || !resultRow) return "";
      var meta = computeRankMeta(ex.id);
      var sinav = ex.sinav || ex.tur || "TYT";
      var layout = window.getExamLayout ? window.getExamLayout(sinav) : { n: 120, sections: [] };
      var n = layout.n || 120;
      var keyStr = buildKeyString(ex, n);
      var sectionAvgs = computeSectionKurumAvgs(ex.id, ex, layout, keyStr);
      return buildSingleStudentKarnePage(ex, resultRow, meta, layout, keyStr, sectionAvgs);
    },

    downloadKarnePdf: function (examId, resultRow) {
      var html = this.buildKarneHtmlForStudent(examId, resultRow);
      if (!html) {
        if (typeof window.alert === "function") window.alert("Karne oluşturulamadı — sınav veya sonuç bulunamadı.");
        return Promise.reject(new Error("empty karne"));
      }
      if (typeof window.html2pdf !== "function") {
        if (typeof window.alert === "function") window.alert("PDF kütüphanesi yüklenmedi.");
        return Promise.reject(new Error("no html2pdf"));
      }
      var host = document.createElement("div");
      host.setAttribute("data-derece-karne-pdf-root", "1");
      host.style.position = "fixed";
      host.style.left = "-9999px";
      host.style.top = "0";
      host.style.width = "794px";
      host.style.background = "#fff";
      host.innerHTML = html;
      document.body.appendChild(host);
      var base =
        sanitizeFilenamePart((resultRow.studentCode || resultRow.studentId || "ogrenci") + "_" + String(examId));
      var opt = {
        margin: [8, 8, 8, 8],
        filename: "Karne_" + base + ".pdf",
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"] },
      };
      return window
        .html2pdf()
        .set(opt)
        .from(host)
        .save()
        .then(function () {
          if (host.parentNode) host.parentNode.removeChild(host);
        })
        .catch(function (e) {
          if (host.parentNode) host.parentNode.removeChild(host);
          throw e;
        });
    },
  };
})();

`;

fs.writeFileSync(path.join(root, "js/student-karne-api.js"), out, "utf8");
console.log("Wrote js/student-karne-api.js bytes", Buffer.byteLength(out, "utf8"));
