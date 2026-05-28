/**
 * DerecePanel — Appwrite Storage / Database köprüsü (Test Oluşturucu PDF vb.)
 *
 * Sayfada tanımlayın (ör. test-olusturucu.html içinde, kendi değerlerinizle):
 *   window.DP_APPWRITE = {
 *     endpoint: "https://cloud.appwrite.io/v1",
 *     projectId: "…",
 *     bucketId: "…",
 *     apiKey: "…",                    // ÜRETİM: tercihen sunucu / Edge Function; geliştirme için
 *     sessionJwt: "…",              // veya oturum JWT (öğrenci/koç indirme için)
 *     databaseId: "…",              // isteğe bağlı: tarama_deposu koleksiyonu senkronu
 *     collectionTaramaDeposuId: "…"
 *   };
 */
(function (global) {
  "use strict";

  function cfg() {
    return global.DP_APPWRITE || {};
  }

  function isStorageConfigured() {
    var c = cfg();
    return !!(c.endpoint && c.projectId && c.bucketId && (c.apiKey || c.sessionJwt));
  }

  function isDatabaseConfigured() {
    var c = cfg();
    return !!(c.endpoint && c.projectId && c.databaseId && c.collectionTaramaDeposuId && (c.apiKey || c.sessionJwt));
  }

  function genFileId() {
    if (global.crypto && typeof global.crypto.randomUUID === "function") {
      return global.crypto.randomUUID().replace(/-/g, "").slice(0, 20);
    }
    return "pdf_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 9);
  }

  function normalizeEndpoint(ep) {
    return String(ep || "").replace(/\/+$/, "");
  }

  /**
   * Appwrite REST: POST /storage/buckets/{bucketId}/files
   * @returns {Promise<{ $id: string, [k: string]: unknown }>}
   */
  function createStorageFileMultipart(pdfFile, fileId) {
    var c = cfg();
    var ep = normalizeEndpoint(c.endpoint);
    var url = ep + "/storage/buckets/" + encodeURIComponent(c.bucketId) + "/files";
    var fid = fileId || genFileId();
    var form = new FormData();
    form.append("fileId", fid);
    form.append("file", pdfFile);

    var headers = {
      "X-Appwrite-Project": c.projectId,
    };
    if (c.sessionJwt) headers["X-Appwrite-JWT"] = c.sessionJwt;
    if (c.apiKey) headers["X-Appwrite-Key"] = c.apiKey;

    return fetch(url, {
      method: "POST",
      headers: headers,
      body: form,
    }).then(function (res) {
      return res.text().then(function (txt) {
        var j = null;
        try {
          j = txt ? JSON.parse(txt) : null;
        } catch (e) {
          j = null;
        }
        if (!res.ok) {
          var msg = (j && (j.message || j.error)) || txt || "HTTP " + res.status;
          throw new Error(String(msg));
        }
        if (!j || !j.$id) {
          throw new Error("Appwrite yanıtında dosya ID yok.");
        }
        return j;
      });
    });
  }

  /**
   * Tarayıcıda yeni sekmede açılabilir indirme/görüntüleme URL’si (project query ile).
   * Özel dosyalar için bucket ACL veya oturum çerezi gerekir; aksi halde 403 alınabilir.
   */
  function getFileDownloadUrl(fileId) {
    var c = cfg();
    if (!c.endpoint || !c.projectId || !c.bucketId || !fileId) return "";
    var ep = normalizeEndpoint(c.endpoint);
    return (
      ep +
      "/storage/buckets/" +
      encodeURIComponent(c.bucketId) +
      "/files/" +
      encodeURIComponent(fileId) +
      "/download?project=" +
      encodeURIComponent(c.projectId)
    );
  }

  function getFileViewUrl(fileId) {
    var c = cfg();
    if (!c.endpoint || !c.projectId || !c.bucketId || !fileId) return "";
    var ep = normalizeEndpoint(c.endpoint);
    return (
      ep +
      "/storage/buckets/" +
      encodeURIComponent(c.bucketId) +
      "/files/" +
      encodeURIComponent(fileId) +
      "/view?project=" +
      encodeURIComponent(c.projectId)
    );
  }

  /**
   * tarama_deposu koleksiyonunda belge oluşturur veya günceller (pdf_file_id dahil).
   */
  function upsertTaramaDeposuDocument(documentId, data) {
    var c = cfg();
    if (!isDatabaseConfigured() || !documentId) {
      return Promise.resolve(null);
    }
    var ep = normalizeEndpoint(c.endpoint);
    var headers = {
      "X-Appwrite-Project": c.projectId,
      "Content-Type": "application/json",
    };
    if (c.sessionJwt) headers["X-Appwrite-JWT"] = c.sessionJwt;
    if (c.apiKey) headers["X-Appwrite-Key"] = c.apiKey;

    var coll =
      ep +
      "/databases/" +
      encodeURIComponent(c.databaseId) +
      "/collections/" +
      encodeURIComponent(c.collectionTaramaDeposuId) +
      "/documents";

    var docUrl = coll + "/" + encodeURIComponent(documentId);

    return fetch(coll, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        documentId: documentId,
        data: data,
      }),
    }).then(function (res) {
      return res.text().then(function (txt) {
        if (res.status === 409) {
          return fetch(docUrl, {
            method: "PATCH",
            headers: headers,
            body: JSON.stringify({ data: data }),
          }).then(function (res2) {
            return res2.text().then(function (t2) {
              var j2 = null;
              try {
                j2 = t2 ? JSON.parse(t2) : null;
              } catch (e2) {}
              if (!res2.ok) {
                throw new Error((j2 && j2.message) || t2 || "HTTP " + res2.status);
              }
              return j2;
            });
          });
        }
        var j = null;
        try {
          j = txt ? JSON.parse(txt) : null;
        } catch (e) {}
        if (!res.ok) {
          throw new Error((j && j.message) || txt || "HTTP " + res.status);
        }
        return j;
      });
    });
  }

  /**
   * @param {Blob} pdfBlob
   * @param {string} filename
   * @returns {Promise<{ $id: string }>}
   */
  function uploadPdfBlob(pdfBlob, filename) {
    if (!isStorageConfigured()) {
      return Promise.reject(new Error("Appwrite Storage yapılandırması eksik (DP_APPWRITE)."));
    }
    var name = filename || "deneme_sinavi.pdf";
    var pdfFile = new File([pdfBlob], name, { type: "application/pdf" });
    return createStorageFileMultipart(pdfFile, genFileId());
  }

  global.DPAppwrite = {
    cfg: cfg,
    isStorageConfigured: isStorageConfigured,
    isDatabaseConfigured: isDatabaseConfigured,
    uploadPdfBlob: uploadPdfBlob,
    getFileDownloadUrl: getFileDownloadUrl,
    getFileViewUrl: getFileViewUrl,
    upsertTaramaDeposuDocument: upsertTaramaDeposuDocument,
  };
})(typeof window !== "undefined" ? window : this);
